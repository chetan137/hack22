import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, UserCheck, UserX, Trash2, ChevronLeft,
  ChevronRight, RefreshCw, CheckCircle, XCircle
} from 'lucide-react';
import { adminApi } from '@/api/admin';
import type { AdminUser } from '@/api/admin';

const ROLE_COLORS: Record<string, string> = {
  user: 'bg-slate-700/50 text-slate-300',
  admin: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  super_admin: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
};

export default function AdminUsers() {
  const [data, setData] = useState<{ users: AdminUser[]; total: number }>({ users: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const limit = 15;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({ page, limit, search: search || undefined, role: roleFilter || undefined });
      setData({ users: res.users, total: res.total });
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { setPage(1); }, [search, roleFilter]);
  useEffect(() => { load(); }, [load]);

  const toggleActive = async (user: AdminUser) => {
    setActionLoading(user.id);
    try {
      await adminApi.updateUser(user.id, { is_active: !user.is_active });
      showToast(`${user.full_name} ${user.is_active ? 'suspended' : 'activated'}`);
      load();
    } finally { setActionLoading(null); }
  };

  const changeRole = async (user: AdminUser, role: string) => {
    setActionLoading(user.id + role);
    try {
      await adminApi.updateUser(user.id, { role });
      showToast(`Role changed to ${role}`);
      load();
    } finally { setActionLoading(null); }
  };

  const deleteUser = async (user: AdminUser) => {
    if (!confirm(`Delete ${user.email}? This is irreversible.`)) return;
    setActionLoading(user.id + 'del');
    try {
      await adminApi.deleteUser(user.id);
      showToast(`${user.email} deleted`);
      load();
    } finally { setActionLoading(null); }
  };

  const totalPages = Math.ceil(data.total / limit);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-500 text-sm mt-1">{data.total.toLocaleString()} total users</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm border border-white/5 transition-all">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full bg-[#0d1117]/80 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="bg-[#0d1117]/80 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-brand-500/50 transition"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#0d1117]/80 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-16"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : data.users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-slate-500">No users found</td></tr>
              ) : data.users.map(user => {
                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{user.full_name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={user.role}
                        onChange={e => changeRole(user, e.target.value)}
                        disabled={!!actionLoading}
                        className={`text-xs font-semibold px-2 py-1 rounded-full cursor-pointer border-0 focus:outline-none ${ROLE_COLORS[user.role]} bg-transparent`}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {user.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {user.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleActive(user)}
                          disabled={!!actionLoading}
                          title={user.is_active ? 'Suspend' : 'Activate'}
                          className={`p-1.5 rounded-lg transition-all ${user.is_active ? 'text-amber-400 hover:bg-amber-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                        >
                          {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteUser(user)}
                          disabled={!!actionLoading}
                          title="Delete user"
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
            <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition"
              ><ChevronLeft className="w-4 h-4" /></button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition"
              ><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-white/10 text-white text-sm px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <CheckCircle className="w-4 h-4 text-brand-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
