import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  RefreshCw,
  Shield,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Calendar,
  X,
  Trash2,
  Lock,
  UserCheck,
  Ban,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { crmApi } from '../../api/crmApi';
import { User } from '../../types';
import toast from 'react-hot-toast';

export const CrmUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'admin',
    phone: '',
    password: '',
    password_confirm: '',
  });

  // Delete Confirmation Modal State
  const [deleteTargetUser, setDeleteTargetUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await crmApi.getUsers();
      setUsers(data);
    } catch {
      toast.error('Failed to load staff accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.username.trim() || !newUserForm.password.trim()) {
      toast.error('Username and password are required');
      return;
    }

    if (newUserForm.password !== newUserForm.password_confirm) {
      toast.error('Passwords do not match');
      return;
    }

    if (newUserForm.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsCreating(true);
    try {
      await crmApi.createUser({
        username: newUserForm.username.trim(),
        first_name: newUserForm.first_name.trim(),
        last_name: newUserForm.last_name.trim(),
        email: newUserForm.email.trim(),
        role: newUserForm.role,
        phone: newUserForm.phone.trim(),
        password: newUserForm.password,
        password_confirm: newUserForm.password_confirm,
      });

      toast.success(`Administrator account @${newUserForm.username} created successfully!`);
      setIsAddModalOpen(false);
      setNewUserForm({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        role: 'admin',
        phone: '',
        password: '',
        password_confirm: '',
      });
      await fetchUsers();
    } catch (err: any) {
      const errData = err.response?.data;
      if (typeof errData === 'object') {
        const firstKey = Object.keys(errData)[0];
        const val = errData[firstKey];
        toast.error(Array.isArray(val) ? `${firstKey}: ${val[0]}` : String(val));
      } else {
        toast.error('Failed to create staff account. Check details.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      toast.error('Cannot deactivate your own account');
      return;
    }

    try {
      await crmApi.toggleUserActive(targetUser.id);
      toast.success(`User @${targetUser.username} status updated.`);
      await fetchUsers();
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTargetUser) return;
    if (deleteTargetUser.id === currentUser?.id) {
      toast.error('You cannot delete your own logged-in account');
      setDeleteTargetUser(null);
      return;
    }

    setIsDeleting(true);
    try {
      await crmApi.deleteUser(deleteTargetUser.id);
      toast.success(`Staff user @${deleteTargetUser.username} deleted permanently.`);
      setDeleteTargetUser(null);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete staff user');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    const matchesSearch =
      u.username.toLowerCase().includes(q) ||
      fullName.includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q));

    if (!matchesSearch) return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;

    return true;
  });

  const getRoleBadge = () => {
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Admin Accounts &amp; Access Control</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            System Admin control: Provision administrator logins, manage credentials, or revoke accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Administrator</span>
          </button>
        </div>
      </div>

      {/* ── Security Notice Banner ── */}
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-indigo-700 shrink-0" />
          <div>
            <div className="font-bold text-indigo-950">
              Admin Governance:{' '}
              <span className="text-indigo-600 font-extrabold">
                {currentUser?.first_name || 'Admin'} (@{currentUser?.username || 'admin'})
              </span>
            </div>
            <p className="text-indigo-800 text-[11px] mt-0.5">
              Authorized Admins have full access across enquiries, bookings, workshop repairs, and billing.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 bg-white font-bold text-indigo-900 border border-indigo-200 rounded-xl text-xs whitespace-nowrap shadow-xs">
          Total Administrators: {users.length}
        </span>
      </div>

      {/* ── Filter and Search Bar ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search administrators by name, username, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 font-bold text-slate-700">
            {users.length} Active {users.length === 1 ? 'Admin' : 'Admins'}
          </span>
        </div>
      </div>

      {/* ── Staff Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role &amp; Permissions</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Date Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isCurrent = u.id === currentUser?.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 uppercase">
                          {u.first_name ? u.first_name[0] : u.username[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-mono font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
                        <Shield className="w-3 h-3 text-indigo-500" />
                        <span>Administrator</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 flex items-center gap-1.5 font-medium">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.email || '—'}</span>
                      </div>
                      {u.phone && (
                        <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1.5 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                          <Ban className="w-3 h-3 text-slate-400" />
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {u.date_joined ? new Date(u.date_joined).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Toggle Active */}
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            title={u.is_active ? 'Deactivate account' : 'Activate account'}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}

                        {/* Delete User Button */}
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => setDeleteTargetUser(u)}
                            title={`Delete user @${u.username}`}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    {loading ? 'Loading staff accounts...' : 'No staff accounts found matching filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Add New Staff Member ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">Provision New Staff Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.first_name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, first_name: e.target.value })}
                    placeholder="e.g. Arun"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newUserForm.last_name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, last_name: e.target.value })}
                    placeholder="e.g. Kumar"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Username (Login ID) *</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    placeholder="e.g. arun_caller"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Access Role</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-indigo-700 font-bold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>System Administrator (Full Access)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Staff Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="arun@premiummobilerepair.in"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Password (min 8 chars) *</label>
                  <input
                    type="password"
                    required
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={newUserForm.password_confirm}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password_confirm: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                <strong>Access Note:</strong> This user can immediately log in to the CRM with this username and password to handle repair operations according to their role.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {isCreating ? 'Creating User...' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Delete Staff Confirmation ── */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Delete Staff Account?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <div>
                <span className="font-bold">Staff Name:</span>{' '}
                {deleteTargetUser.full_name || `${deleteTargetUser.first_name || ''} ${deleteTargetUser.last_name || ''}`.trim() || deleteTargetUser.username}
              </div>
              <div>
                <span className="font-bold">Username:</span> @{deleteTargetUser.username}
              </div>
              <div>
                <span className="font-bold">Role:</span> {deleteTargetUser.role.toUpperCase()}
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                Linked historical jobs and leads will be retained with audit trails, but this login will be permanently revoked.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetUser(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteUser}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 text-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
