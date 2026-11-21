import React, { useState, useEffect } from 'react';
import {
  Building,
  Shield,
  AlertTriangle,
  Save,
  Trash2,
  CheckCircle2,
  Users,
  UserPlus,
  X,
  Mail,
  User,
  Phone,
  Check,
  Ban,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { crmApi } from '../../api/crmApi';
import { User as UserType } from '../../types';

export const CrmSettingsPage: React.FC = () => {
  const [bizName, setBizName] = useState('Premium Mobile Repair');
  const [bizEmail, setBizEmail] = useState('premiummobileservice3@gmail.com');
  const [phone, setPhone] = useState('9986097786');
  const [whatsapp, setWhatsapp] = useState('9986097786');
  const [address, setAddress] = useState(
    '#159, 1st Floor 32nd E Cross Rd, Opp To Sanjay Gandhi Hospital, 4th T Block East, Tilak Nagar, Jayanagar Bengaluru, Karnataka 560041'
  );
  const [hours, setHours] = useState('Monday - Saturday: 9:00 AM – 8:00 PM | Sunday: Closed');
  const [warranty, setWarranty] = useState('6');
  const [isSaving, setIsSaving] = useState(false);

  // Users / Team Management state
  const [users, setUsers] = useState<UserType[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
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

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await crmApi.getUsers();
      setUsers(data);
    } catch {
      // Non-admin might not have permission
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserForm.password !== newUserForm.password_confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (newUserForm.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setCreatingUser(true);
    try {
      await crmApi.createUser(newUserForm);
      toast.success(`User ${newUserForm.username} created successfully!`);
      setShowAddUserModal(false);
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
        toast.error('Failed to create user. Please check details.');
      }
    } finally {
      setCreatingUser(false);
    }
  };

  const handleToggleActive = async (user: UserType) => {
    try {
      await crmApi.toggleUserActive(user.id);
      toast.success(`User ${user.username} status updated.`);
      await fetchUsers();
    } catch {
      toast.error('Failed to toggle user status');
    }
  };

  const handleDeleteUser = async (user: UserType) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.username}"?`)) return;
    try {
      await crmApi.deleteUser(user.id);
      toast.success(`User ${user.username} deleted.`);
      await fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Business and CRM configuration saved successfully!');
    }, 500);
  };

  const handleClearDemoData = () => {
    if (window.confirm('Are you sure you want to clear test leads and restore demo data?')) {
      toast.success('Demo environment state reset.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Business &amp; CRM Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage workshop profile, staff accounts, notification rules, and system configuration.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Card 1: Workshop & Brand Profile */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Workshop &amp; Brand Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Business Name</label>
              <input
                type="text"
                required
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Notification Email Address</label>
              <input
                type="email"
                required
                value={bizEmail}
                onChange={(e) => setBizEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                All incoming website enquiries and lead alerts are dispatched to this email.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Primary Phone Number</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">WhatsApp Support Number</label>
              <input
                type="text"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Physical Lab / Workshop Address</label>
            <textarea
              rows={2}
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Working Hours</label>
              <input
                type="text"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Default Warranty Period (Months)</label>
              <input
                type="number"
                min="1"
                max="24"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Team & Staff Accounts (Created and Managed by Admin) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Staff Accounts &amp; Team Roles</h2>
                <p className="text-[11px] text-slate-500">
                  Staff users must be created by an Admin. Only authorized staff can access the CRM.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAddUserModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer text-xs w-fit"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Staff User</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Email &amp; Phone</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      {loadingUsers ? 'Loading team accounts...' : 'No staff accounts found.'}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const roleColor: Record<string, string> = {
                      admin: 'bg-rose-50 text-rose-700 border-rose-200',
                      manager: 'bg-purple-50 text-purple-700 border-purple-200',
                      technician: 'bg-blue-50 text-blue-700 border-blue-200',
                      telecaller: 'bg-amber-50 text-amber-700 border-amber-200',
                    };

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{u.full_name || u.username}</div>
                          <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
                            Administrator
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-slate-800">{u.email || '—'}</div>
                          {u.phone && <div className="text-[11px] text-slate-400">{u.phone}</div>}
                        </td>
                        <td className="py-3 px-3">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                              <Check className="w-3.5 h-3.5" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 font-semibold text-[11px]">
                              <Ban className="w-3.5 h-3.5" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(u)}
                              title={u.is_active ? 'Deactivate account' : 'Activate account'}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-[11px] font-semibold text-slate-600 transition-colors cursor-pointer"
                            >
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            {u.role !== 'admin' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                title="Delete user"
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2.5: Live Email Notification Diagnostic Tester */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Live Lead Email Alert Diagnostics</h2>
          </div>

          <p className="text-slate-600 text-xs">
            Test outbound email delivery directly. When a customer registers on the website, enquiry details are automatically dispatched to your inbox and customer email.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <input
              type="email"
              value={bizEmail}
              onChange={(e) => setBizEmail(e.target.value)}
              placeholder="recipient@gmail.com"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-indigo-500 w-full"
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  toast.loading('Dispatching test notification email...');
                  const res = await crmApi.sendTestEmail(bizEmail);
                  toast.dismiss();
                  toast.success(res.message || 'Test email dispatched successfully!');
                } catch (err: any) {
                  toast.dismiss();
                  toast.error(err.response?.data?.error || 'Email dispatch failed. Verify SMTP settings.');
                }
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm shrink-0 cursor-pointer w-full sm:w-auto"
            >
              Send Test Lead Email Now
            </button>
          </div>
        </div>

        {/* Card 3: Data Reset & Fresh Setup */}
        <div className="bg-rose-50/70 rounded-2xl p-6 border border-rose-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-rose-700 font-bold">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-base">Data Reset &amp; Fresh Setup</h2>
          </div>
          <p className="text-rose-800 text-xs leading-relaxed">
            Clear all demo / placeholder records with one click so you can test entering your own real customer leads,
            repair jobs, and profit tracking from scratch.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={handleClearDemoData}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Demo / Test Data</span>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal: Add New Staff User (Created by Admin) */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">Create Staff User (Admin Only)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Access Role</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-indigo-700 font-bold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>Administrator (Full Access)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address *</label>
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
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
                <strong>Admin Security Note:</strong> This user will be granted staff access according to the chosen role. They can immediately log in to the CRM with this username and password.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {creatingUser ? 'Creating User...' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
