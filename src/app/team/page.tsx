'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserCog, 
  Plus, 
  ShieldCheck, 
  Crown, 
  GraduationCap, 
  UserCheck, 
  CreditCard, 
  Mail, 
  Phone, 
  Trash2, 
  Check, 
  X, 
  Sparkles,
  AlertCircle,
  ExternalLink,
  LogIn,
  BookOpen
} from 'lucide-react';
import { UserRole } from '@/lib/rbac/permissions';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  trainer_id?: string;
  trainer_phone?: string;
  trainer_specializations?: string;
}

export default function TeamPage() {
  const router = useRouter();
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [roleCounts, setRoleCounts] = useState({ total: 0, owner: 0, counselor: 0, trainer: 0, accounts: 0 });
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'owner' as UserRole,
    phone: '',
    specializations: '',
    avatarUrl: ''
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        if (data.roleCounts) setRoleCounts(data.roleCounts);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      });

      const json = await res.json();

      if (res.ok) {
        setStatusMessage({ text: `Successfully created ${newMember.role.toUpperCase()} account for ${newMember.name}!`, type: 'success' });
        setShowAddModal(false);
        setNewMember({
          name: '',
          email: '',
          role: 'owner',
          phone: '',
          specializations: '',
          avatarUrl: ''
        });
        fetchUsers();
      } else {
        setStatusMessage({ text: json.error || 'Failed to create user account', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}? This action will revoke their access to InstiPilot.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setStatusMessage({ text: `Removed ${name} from active staff.`, type: 'success' });
        fetchUsers();
      } else {
        const json = await res.json();
        setStatusMessage({ text: json.error || 'Failed to delete account', type: 'error' });
      }
    } catch (e: any) {
      setStatusMessage({ text: e.message, type: 'error' });
    }
  };

  const handleSwitchAccount = async (member: TeamMember) => {
    const sessionObj = {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      avatarUrl: member.avatar_url
    };

    document.cookie = `instipilot_session=${encodeURIComponent(JSON.stringify(sessionObj))}; path=/; max-age=604800; SameSite=Lax`;
    
    try {
      await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: member.role })
      });
    } catch {}

    if (member.role === 'student') {
      router.push('/student-portal');
    } else {
      router.push('/dashboard');
    }
    router.refresh();
  };

  const filteredUsers = filterRole === 'all' 
    ? users 
    : users.filter(u => u.role === filterRole);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return { label: 'Director / Owner', icon: <Crown className="w-3.5 h-3.5 text-emerald-600" />, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'trainer':
        return { label: 'Technical Trainer', icon: <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />, className: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'counselor':
        return { label: 'Academic Counselor', icon: <UserCheck className="w-3.5 h-3.5 text-blue-600" />, className: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'accounts':
        return { label: 'Accounts & Billing', icon: <CreditCard className="w-3.5 h-3.5 text-amber-600" />, className: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'student':
        return { label: 'Student', icon: <BookOpen className="w-3.5 h-3.5 text-teal-600" />, className: 'bg-teal-50 text-teal-700 border-teal-200' };
      default:
        return { label: role, icon: <UserCog className="w-3.5 h-3.5 text-slate-500" />, className: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Staff, Faculty & Role Administration
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Team & Leadership Directory
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {roleCounts.total} Active Staff
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage Institute Owners, Technical Trainers, Counselors, and Billing staff with automated RBAC security scopes.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Owner / Staff Member
        </button>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs shadow-xs ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Staff</span>
            <UserCog className="w-4 h-4 text-slate-400" />
          </div>
          <div className="font-display text-2xl font-bold text-slate-900">{roleCounts.total}</div>
          <div className="text-[10px] text-slate-500 mt-1">Across all 4 RBAC tiers</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Owners & Directors</span>
            <Crown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-display text-2xl font-bold text-emerald-700">{roleCounts.owner}</div>
          <div className="text-[10px] text-slate-500 mt-1">Full operational oversight</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Technical Trainers</span>
            <GraduationCap className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="font-display text-2xl font-bold text-indigo-700">{roleCounts.trainer}</div>
          <div className="text-[10px] text-slate-500 mt-1">Batches & attendance only</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">Counselors & Accounts</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-display text-2xl font-bold text-blue-700">{roleCounts.counselor + roleCounts.accounts}</div>
          <div className="text-[10px] text-slate-500 mt-1">Student success & fees</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'all', label: `All Staff (${users.length})` },
          { id: 'owner', label: `Owners (${roleCounts.owner})` },
          { id: 'trainer', label: `Trainers (${roleCounts.trainer})` },
          { id: 'counselor', label: `Counselors (${roleCounts.counselor})` },
          { id: 'accounts', label: `Accounts (${roleCounts.accounts})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterRole(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
              filterRole === tab.id
                ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-44 rounded-2xl bg-white border border-slate-200 animate-pulse"></div>
          ))
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
            No team members found in this category. Click &ldquo;Add Owner / Staff Member&rdquo; to add one.
          </div>
        ) : (
          filteredUsers.map((member) => {
            const roleInfo = getRoleBadge(member.role);
            return (
              <div
                key={member.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                        alt={member.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                      />
                      <div>
                        <h3 className="font-display font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                          {member.name}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border mt-1 ${roleInfo.className}`}>
                          {roleInfo.icon}
                          {roleInfo.label}
                        </span>
                      </div>
                    </div>

                    {member.id !== 'u_owner' && (
                      <button
                        onClick={() => handleDelete(member.id, member.name)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-[11px] truncate">{member.email}</span>
                    </div>
                    {member.trainer_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="text-[11px]">{member.trainer_phone}</span>
                      </div>
                    )}
                    {member.trainer_specializations && (
                      <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                        <span className="text-slate-500 font-medium">Domain: </span>
                        {member.trainer_specializations}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    ID: {member.id.slice(0, 14)}...
                  </span>
                  <button
                    onClick={() => handleSwitchAccount(member)}
                    className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 border border-slate-200 text-[11px] font-medium flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <LogIn className="w-3 h-3 text-blue-600" />
                    Switch to Account
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">
                Staff Onboarding & RBAC Provisioning
              </span>
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900 mb-2">
              Add New Owner or Staff Member
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Provision user accounts with scoped database access, audit logging, and role-based permissions.
            </p>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-medium">Select Operational Role *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'owner', label: 'Director / Owner', icon: <Crown className="w-3.5 h-3.5 text-emerald-600" />, desc: 'Master operational & fee control' },
                    { id: 'trainer', label: 'Technical Trainer', icon: <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />, desc: 'Batches, labs & recordings' },
                    { id: 'counselor', label: 'Academic Counselor', icon: <UserCheck className="w-3.5 h-3.5 text-blue-600" />, desc: 'Attendance & dropout retention' },
                    { id: 'accounts', label: 'Accounts & Billing', icon: <CreditCard className="w-3.5 h-3.5 text-amber-600" />, desc: 'Fee structures & EMI tracking' },
                  ].map((roleChoice) => (
                    <button
                      key={roleChoice.id}
                      type="button"
                      onClick={() => setNewMember({ ...newMember, role: roleChoice.id as UserRole })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        newMember.role === roleChoice.id
                          ? 'border-blue-500 bg-blue-50 text-blue-950 shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900 mb-0.5">
                        {roleChoice.icon}
                        {roleChoice.label}
                      </div>
                      <div className="text-[10px] text-slate-500">{roleChoice.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Anand Kulkarni"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Official Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. anand@instipilot.com"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98200 12345"
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 text-xs"
                  />
                </div>
              </div>

              {newMember.role === 'trainer' && (
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Trainer Technical Specializations</label>
                  <input
                    type="text"
                    placeholder="e.g. Java Fullstack, Spring Boot, AWS, Docker"
                    value={newMember.specializations}
                    onChange={(e) => setNewMember({ ...newMember, specializations: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 text-xs"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-700 block mb-1 font-medium">Avatar Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="Leave empty for auto-generated avatar"
                  value={newMember.avatarUrl}
                  onChange={(e) => setNewMember({ ...newMember, avatarUrl: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                Security Note: Newly provisioned users will automatically be granted role-based table access rules and logged in the immutable audit log.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
                >
                  {creating ? 'Provisioning...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
