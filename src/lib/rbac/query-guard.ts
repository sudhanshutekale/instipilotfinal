import { UserRole, isTableAllowed } from './permissions';
import { getSupabase, isSupabaseConfigured, upsertToSupabase } from '@/lib/supabase';

export interface ValidationResult {
  isValid: boolean;
  sanitizedSql?: string;
  blockedReason?: string;
  violations?: string[];
  extractedTables?: string[];
}

export interface QueryExecutionResult {
  success: boolean;
  data?: any[];
  rowCount?: number;
  error?: string;
  executedSql?: string;
  blocked?: boolean;
  blockedReason?: string;
  executionTimeMs?: number;
}

const FORBIDDEN_SQL_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'PRAGMA', 'ATTACH',
  'DETACH', 'CREATE', 'REPLACE', 'TRUNCATE', 'VACUUM', 'REINDEX',
  'BEGIN', 'COMMIT', 'ROLLBACK', 'SAVEPOINT', 'RELEASE', 'EXEC',
  'EXECUTE', 'EXPLAIN', 'UPSERT', 'INTO', 'SET'
];

/**
 * Validates whether a SQL/query adheres strictly to the security sandbox
 */
export function validateSqlQuery(sql: string, role: UserRole): ValidationResult {
  const violations: string[] = [];

  if (!sql || typeof sql !== 'string') {
    return { isValid: false, blockedReason: 'Empty query received', violations: ['empty_query'] };
  }

  let cleaned = sql.trim();

  if (cleaned.endsWith(';')) {
    cleaned = cleaned.slice(0, -1).trim();
  }

  if (cleaned.includes(';')) {
    return {
      isValid: false,
      blockedReason: 'Multiple SQL statements are strictly forbidden.',
      violations: ['multiple_statements']
    };
  }

  if (/(--|\/\*|\*\/)/.test(cleaned)) {
    return {
      isValid: false,
      blockedReason: 'SQL comments are disabled for safety.',
      violations: ['sql_comments_detected']
    };
  }

  const normalized = cleaned.replace(/\s+/g, ' ');
  if (!/^(\s*SELECT|\s*WITH)/i.test(normalized)) {
    return {
      isValid: false,
      blockedReason: 'Only read-only SELECT queries are permitted.',
      violations: ['non_select_statement']
    };
  }

  const uppercaseQuery = normalized.toUpperCase();
  for (const keyword of FORBIDDEN_SQL_KEYWORDS) {
    const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (keywordRegex.test(uppercaseQuery)) {
      return {
        isValid: false,
        blockedReason: `Dangerous SQL keyword '${keyword}' is prohibited by InstiPilot safety policy.`,
        violations: [`forbidden_keyword_${keyword.toLowerCase()}`]
      };
    }
  }

  const tableMatches = Array.from(uppercaseQuery.matchAll(/\b(?:FROM|JOIN)\s+([a-zA-Z0-9_]+)/gi));
  const foundTables = new Set<string>();

  for (const match of tableMatches) {
    if (match[1]) {
      foundTables.add(match[1].toLowerCase());
    }
  }

  const extractedTables = Array.from(foundTables);

  for (const table of extractedTables) {
    if (!isTableAllowed(role, table)) {
      violations.push(`unauthorized_table_${table}`);
      return {
        isValid: false,
        blockedReason: `Role '${role}' does not have permission to query table '${table}'. Access strictly blocked.`,
        violations,
        extractedTables
      };
    }
  }

  if (role === 'trainer') {
    const forbiddenFinancialTerms = ['amount', 'fee', 'total_fee', 'total_amount', 'down_payment', 'emi', 'payment', 'discount', 'paid_date'];
    for (const term of forbiddenFinancialTerms) {
      const termRegex = new RegExp(`\\b${term}\\b`, 'i');
      if (termRegex.test(uppercaseQuery)) {
        violations.push(`unauthorized_column_${term}`);
        return {
          isValid: false,
          blockedReason: `Trainer role is restricted from accessing financial terms ('${term}'). Access blocked by policy.`,
          violations,
          extractedTables
        };
      }
    }
  }

  if (role === 'accounts') {
    const forbiddenPedagogicalTerms = ['check_in_time', 'ip_or_location', 'submission_url', 'topic_tags'];
    for (const term of forbiddenPedagogicalTerms) {
      const termRegex = new RegExp(`\\b${term}\\b`, 'i');
      if (termRegex.test(uppercaseQuery)) {
        violations.push(`unauthorized_column_${term}`);
        return {
          isValid: false,
          blockedReason: `Accounts role is restricted from accessing granular biometric/pedagogical logs ('${term}'). Access blocked.`,
          violations,
          extractedTables
        };
      }
    }
  }

  let finalSql = cleaned;
  if (!/\bLIMIT\s+\d+/i.test(finalSql)) {
    finalSql = `${finalSql} LIMIT 50`;
  }

  return {
    isValid: true,
    sanitizedSql: finalSql,
    extractedTables
  };
}

/**
 * Executes a safe Supabase query using the rpc or direct table selects.
 * Since Supabase doesn't run raw SQL by default, this function:
 * 1. Validates the SQL (RBAC rules)
 * 2. Attempts to run via Supabase RPC `exec_sql` if available
 * 3. Logs the audit trail to Supabase
 */
export async function executeSafeQuery(
  rawSql: string,
  user: { id: string; name: string; role: UserRole },
  originalPrompt?: string
): Promise<QueryExecutionResult> {
  const startTime = Date.now();

  // 1. Validate
  const validation = validateSqlQuery(rawSql, user.role);

  if (!validation.isValid) {
    const duration = Date.now() - startTime;

    // Log blocked event
    try {
      if (isSupabaseConfigured()) {
        await upsertToSupabase('audit_log', {
          id: `aud_blk_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          user_id: user.id,
          user_name: user.name,
          role: user.role,
          action: 'copilot_blocked',
          query: originalPrompt ? `${originalPrompt} [SQL: ${rawSql}]` : rawSql,
          result_summary: validation.blockedReason || 'Blocked by security validator',
          status: 'blocked'
        });
      }
    } catch (e) {
      console.error('Failed to log blocked audit event:', e);
    }

    return {
      success: false,
      blocked: true,
      blockedReason: validation.blockedReason,
      error: validation.blockedReason,
      executionTimeMs: duration
    };
  }

  // 2. Execute via Supabase RPC
  try {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Supabase not configured. Cannot execute query.',
        executionTimeMs: Date.now() - startTime
      };
    }

    const client = getSupabase();
    if (!client) {
      return {
        success: false,
        error: 'Supabase client unavailable.',
        executionTimeMs: Date.now() - startTime
      };
    }

    // Try running via RPC (requires `exec_sql` function in Supabase)
    const { data, error } = await client.rpc('exec_sql', { query: validation.sanitizedSql });

    const duration = Date.now() - startTime;
    const rows = data || [];

    if (error) {
      // Log failure
      await upsertToSupabase('audit_log', {
        id: `aud_err_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        user_id: user.id,
        user_name: user.name,
        role: user.role,
        action: 'copilot_query',
        query: originalPrompt ? `${originalPrompt} [SQL: ${validation.sanitizedSql}]` : validation.sanitizedSql,
        result_summary: `Error: ${error.message}`,
        status: 'error'
      }).catch(() => {});

      return {
        success: false,
        error: `Query execution error: ${error.message}`,
        executedSql: validation.sanitizedSql,
        executionTimeMs: duration
      };
    }

    // Log success
    await upsertToSupabase('audit_log', {
      id: `aud_ok_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      user_id: user.id,
      user_name: user.name,
      role: user.role,
      action: 'copilot_query',
      query: originalPrompt ? `${originalPrompt} [SQL: ${validation.sanitizedSql}]` : validation.sanitizedSql,
      result_summary: `Returned ${rows.length} rows in ${duration}ms`,
      status: 'success'
    }).catch(() => {});

    return {
      success: true,
      data: rows,
      rowCount: rows.length,
      executedSql: validation.sanitizedSql,
      executionTimeMs: duration
    };
  } catch (err: any) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      error: `Database execution error: ${err.message}`,
      executedSql: validation.sanitizedSql,
      executionTimeMs: duration
    };
  }
}
