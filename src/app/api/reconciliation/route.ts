import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/rbac/auth';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Simple fuzzy name match
 */
function fuzzyNameMatch(senderName: string, studentName: string): number {
  if (!senderName || !studentName) return 0;
  const senderWords = senderName.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
  const studentWords = studentName.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);

  let matchCount = 0;
  for (const sw of senderWords) {
    for (const stw of studentWords) {
      if (stw.startsWith(sw) || sw.startsWith(stw)) {
        matchCount++;
        break;
      }
    }
  }

  if (senderWords.length === 0) return 0;
  return Math.round((matchCount / Math.max(senderWords.length, 1)) * 100);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user.role === 'trainer' || user.role === 'counselor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const client = getSupabase();
    if (!client) {
      return NextResponse.json({ error: 'Database client unavailable.' }, { status: 500 });
    }

    const body = await req.json();
    const { transactions } = body;

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Invalid transactions array' }, { status: 400 });
    }

    // Get all pending/overdue EMIs with student info
    const { data: emiData, error: emiErr } = await client
      .from('emi_installments')
      .select(`
        id, student_id, amount, due_date, status,
        students ( name, phone )
      `)
      .in('status', ['pending', 'overdue'])
      .order('due_date', { ascending: true });

    if (emiErr) {
      return NextResponse.json({ error: emiErr.message }, { status: 500 });
    }

    const pendingEmis = (emiData || []).map((e: any) => ({
      emi_id: e.id,
      student_id: e.student_id,
      amount: e.amount,
      due_date: e.due_date,
      status: e.status,
      student_name: e.students?.name || '',
      student_phone: e.students?.phone || ''
    }));

    const matches = transactions.map((txn: any) => {
      const { reference, amount, date, senderName } = txn;

      let bestMatch: any = null;
      let bestConfidence = 0;

      for (const emi of pendingEmis) {
        let confidence = 0;

        if (Math.abs(emi.amount - amount) < 1) {
          confidence += 50;
        } else if (Math.abs(emi.amount - amount) / emi.amount < 0.05) {
          confidence += 20;
        }

        if (senderName) {
          const nameScore = fuzzyNameMatch(senderName, emi.student_name);
          confidence += Math.round(nameScore * 0.4);
        }

        if (reference && emi.student_id) {
          const idFragment = emi.student_id.replace('s_', '');
          if (reference.toLowerCase().includes(idFragment)) {
            confidence += 10;
          }
        }

        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestMatch = emi;
        }
      }

      let status: 'matched' | 'unmatched' | 'suspicious' = 'unmatched';
      if (bestConfidence >= 80) {
        status = 'matched';
      } else if (bestConfidence >= 40) {
        status = 'suspicious';
      }

      return {
        reference,
        amount,
        date,
        matchedStudentName: bestMatch?.student_name || null,
        matchedStudentId: bestMatch?.student_id || null,
        matchedEmiId: bestMatch?.emi_id || null,
        confidence: bestConfidence,
        status,
        reason: bestConfidence >= 80
          ? `Exact amount match (₹${amount}) + name match for ${bestMatch?.student_name}`
          : bestConfidence >= 40
          ? `Partial match: amount close to expected EMI for ${bestMatch?.student_name}`
          : 'No matching EMI found — manual review needed'
      };
    });

    return NextResponse.json({ matches });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
