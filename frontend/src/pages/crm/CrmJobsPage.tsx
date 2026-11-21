import React, { useState, useEffect } from 'react';
import { crmApi } from '../../api/crmApi';
import { RepairJob, User } from '../../types';
import toast from 'react-hot-toast';
import {
  Wrench,
  Search,
  Printer,
  Plus,
  Trash2,
  X,
  Phone,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  MessageCircle,
  FileText,
  DollarSign,
  TrendingUp,
  RotateCcw,
  Shield,
  Edit,
  User as UserIcon,
  Check,
  PackageCheck,
} from 'lucide-react';

const STATUS_TABS = [
  { id: 'all', label: 'All Statuses' },
  { id: 'scheduled', label: 'Scheduled', badge: 'bg-blue-100 text-blue-800' },
  { id: 'in_progress', label: 'In Progress (Bench)', badge: 'bg-amber-100 text-amber-800' },
  { id: 'completed', label: 'Completed (Done & Delivered)', badge: 'bg-emerald-100 text-emerald-800' },
  { id: 'rework', label: 'Rework Required', badge: 'bg-rose-100 text-rose-800' },
];

export const CrmJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Main stage filter matching fixurdevice (Ongoing vs Completed vs All)
  const [mainTab, setMainTab] = useState<'ongoing' | 'completed' | 'all'>('ongoing');
  const [statusFilter, setStatusFilter] = useState('all');
  const [techFilter, setTechFilter] = useState('all');

  // Selected job for updating
  const [selectedJob, setSelectedJob] = useState<RepairJob | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Edit fields
  const [editStatus, setEditStatus] = useState<string>('scheduled');
  const [editTechnician, setEditTechnician] = useState<number | ''>('');
  const [editDiagnosis, setEditDiagnosis] = useState('');
  const [editWorkPerformed, setEditWorkPerformed] = useState('');
  const [editPartsUsed, setEditPartsUsed] = useState('');
  const [editReworkReason, setEditReworkReason] = useState('');

  // Financial fields
  const [editPartName, setEditPartName] = useState('');
  const [editVendorName, setEditVendorName] = useState('');
  const [editVendorCost, setEditVendorCost] = useState<number>(0);
  const [editProductPrice, setEditProductPrice] = useState<number>(0);
  const [editServiceCharges, setEditServiceCharges] = useState<number>(0);

  // Quick 1-Click Complete Modal
  const [completingJob, setCompletingJob] = useState<RepairJob | null>(null);
  const [completionWorkDone, setCompletionWorkDone] = useState('');
  const [completionTechId, setCompletionTechId] = useState<number | ''>('');
  const [completionPaymentDone, setCompletionPaymentDone] = useState(true);
  const [completionDelivered, setCompletionDelivered] = useState(true);
  const [completionGenInvoice, setCompletionGenInvoice] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  // Print Invoice Modal
  const [printInvoiceJob, setPrintInvoiceJob] = useState<RepairJob | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const [jobsRes, usersRes] = await Promise.allSettled([
        crmApi.getJobs({
          search: searchQuery || undefined,
          stage: mainTab !== 'all' ? mainTab : undefined,
        }),
        crmApi.getUsers(),
      ]);

      if (jobsRes.status === 'fulfilled') {
        setJobs(jobsRes.value.results);
      }
      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value);
      }
    } catch {
      toast.error('Failed to load repair bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [searchQuery, mainTab]);

  const openEditModal = (job: RepairJob) => {
    setSelectedJob(job);
    setEditStatus(job.status || 'scheduled');
    setEditTechnician(job.technician || '');
    setEditDiagnosis(job.diagnosis_notes || job.diagnostic_notes || '');
    setEditWorkPerformed(job.work_performed || job.work_notes || '');
    setEditPartsUsed(job.parts_used_notes || '');
    setEditReworkReason(job.rework_reason || '');

    setEditPartName(job.part_name || '');
    setEditVendorName(job.vendor_name || '');
    setEditVendorCost(job.vendor_cost || 0);
    setEditProductPrice(job.product_price || job.quotation_amount || 0);
    setEditServiceCharges(job.service_charges || 0);
  };

  const openCompleteModal = (job: RepairJob) => {
    setCompletingJob(job);
    setCompletionWorkDone(job.work_performed || `${job.device_description} repaired and thoroughly tested`);
    setCompletionTechId(job.technician || '');
    setCompletionPaymentDone(true);
    setCompletionDelivered(true);
    setCompletionGenInvoice(true);
  };

  const calculatedTotalCharge = Number(editProductPrice || 0) + Number(editServiceCharges || 0);
  const calculatedInternalProfit = calculatedTotalCharge - Number(editVendorCost || 0);

  const handleSaveJob = async () => {
    if (!selectedJob) return;
    setIsSaving(true);
    try {
      await crmApi.updateJob(selectedJob.id, {
        status: editStatus as any,
        technician: editTechnician ? Number(editTechnician) : null,
        diagnosis_notes: editDiagnosis,
        work_performed: editWorkPerformed,
        parts_used_notes: editPartsUsed,
        rework_reason: editReworkReason,
        part_name: editPartName,
        vendor_name: editVendorName,
        vendor_cost: Number(editVendorCost),
        product_price: Number(editProductPrice),
        service_charges: Number(editServiceCharges),
        total_customer_charge: calculatedTotalCharge,
        internal_profit: calculatedInternalProfit,
      });

      toast.success(`Booking ${selectedJob.job_number || `JOB-${selectedJob.id}`} updated!`);
      setSelectedJob(null);
      await fetchJobs();
    } catch (err: any) {
      const errData = err.response?.data;
      let msg = errData?.detail;
      if (!msg && errData && typeof errData === 'object') {
        const firstKey = Object.keys(errData)[0];
        const firstVal = errData[firstKey];
        msg = Array.isArray(firstVal) ? `${firstKey}: ${firstVal[0]}` : String(firstVal);
      }
      toast.error(msg || 'Failed to update booking');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingJob) return;
    setIsCompleting(true);
    try {
      await crmApi.completeJob(completingJob.id, {
        work_performed: completionWorkDone,
        technician: completionTechId || undefined,
        payment_done: completionPaymentDone,
        delivered: completionDelivered,
        generate_invoice: completionGenInvoice,
      });
      toast.success(`Job marked as Complete & Delivered! Invoice generated.`);
      setCompletingJob(null);
      await fetchJobs();
    } catch {
      toast.error('Failed to complete job');
    } finally {
      setIsCompleting(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    // Stage check
    const isCompleted = ['completed', 'delivered', 'delivered_collected'].includes(job.status);
    if (mainTab === 'ongoing' && isCompleted) return false;
    if (mainTab === 'completed' && !isCompleted) return false;

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'in_progress' && !['in_progress', 'approved_in_progress', 'in_repair', 'diagnosing'].includes(job.status)) {
        return false;
      }
      if (statusFilter === 'completed' && !isCompleted) {
        return false;
      }
      if (statusFilter === 'scheduled' && !['scheduled', 'pickup_scheduled', 'pending_pickup', 'pending'].includes(job.status)) {
        return false;
      }
      if (statusFilter === 'rework' && job.status !== 'rework') {
        return false;
      }
    }

    // Tech filter
    if (techFilter !== 'all' && String(job.technician) !== techFilter) {
      return false;
    }

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        job.customer_name?.toLowerCase().includes(q) ||
        job.customer_phone?.includes(q) ||
        job.device_description?.toLowerCase().includes(q) ||
        (job.job_number && job.job_number.toLowerCase().includes(q)) ||
        (job.invoice_number && job.invoice_number.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    if (['completed', 'delivered', 'delivered_collected'].includes(status)) {
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Completed (Delivered)</span>;
    }
    if (['in_progress', 'approved_in_progress', 'in_repair', 'diagnosing'].includes(status)) {
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">In Progress</span>;
    }
    if (status === 'rework') {
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">Rework Required</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">Scheduled</span>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>2. Repair Bookings &amp; Workshop</span>
            <span className="text-xs px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-full">
              {jobs.length} Total Records
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage physical bench repair workflow, technician assignment, parts procurement, and customer billing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchJobs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ── Primary Main Tabs (Ongoing vs Completed vs All) ── */}
      <div className="flex items-center border-b border-slate-200 gap-6">
        <button
          onClick={() => setMainTab('ongoing')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            mainTab === 'ongoing'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Ongoing Repairs (Active)</span>
        </button>

        <button
          onClick={() => setMainTab('completed')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            mainTab === 'completed'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>Completed &amp; Delivered</span>
        </button>

        <button
          onClick={() => setMainTab('all')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            mainTab === 'all'
              ? 'border-slate-800 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>All Bookings</span>
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500 shadow-sm"
          >
            <option value="all">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {u.first_name || u.username} (Admin)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by Job ID, Invoice #, Customer name, phone, or device description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
        />
      </div>

      {/* ── Bookings Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 font-bold">Booking ID / Date</th>
                <th className="px-4 py-3.5 font-bold">Customer Contact</th>
                <th className="px-4 py-3.5 font-bold">Device &amp; Issue</th>
                <th className="px-4 py-3.5 font-bold">Assigned Tech</th>
                <th className="px-4 py-3.5 font-bold">Status</th>
                <th className="px-4 py-3.5 font-bold">Billing &amp; Margin</th>
                <th className="px-4 py-3.5 font-bold text-right">Workshop Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.map((job) => {
                const cleanPhone = (job.customer_phone || '').replace(/\D/g, '');
                const waUrl = `https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(
                  job.customer_name || 'Customer'
                )}%2C%20update%20from%20Premium%20Mobile%20Repair%20on%20your%20device%20repair%20${job.job_number || job.id}.`;

                const totalCustomer = job.total_customer_charge || job.product_price || job.quotation_amount || 0;
                const profit = job.internal_profit || (totalCustomer - (job.vendor_cost || 0));
                const isJobCompleted = ['completed', 'delivered', 'delivered_collected'].includes(job.status);

                return (
                  <tr key={job.id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-indigo-600 block">
                        {job.job_number || `JOB-${job.id}`}
                      </span>
                      {job.invoice_number && (
                        <span className="font-mono text-[10px] text-emerald-600 block font-bold">
                          {job.invoice_number}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {new Date(job.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{job.customer_name || 'Customer'}</div>
                      <div className="text-[11px] font-mono text-slate-500">{job.customer_phone}</div>
                      {job.customer_address && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {job.customer_address}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800">{job.device_description}</div>
                      {job.part_name && <div className="text-[10px] text-slate-500 font-medium">Part: {job.part_name}</div>}
                      {job.work_performed && (
                        <div className="text-[10px] text-indigo-600 font-medium truncate max-w-[160px]">
                          Work: {job.work_performed}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Wrench className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-medium">{job.technician_name || 'Unassigned'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {getStatusBadge(job.status)}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-slate-900 text-[12px]">
                        ₹{Number(totalCustomer).toLocaleString('en-IN')}
                      </div>
                      {profit > 0 && (
                        <div className="text-[10px] text-emerald-600 font-bold font-mono">
                          +₹{Number(profit).toLocaleString('en-IN')} profit
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition-colors"
                          title="WhatsApp Update"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>

                        {!isJobCompleted && (
                          <button
                            onClick={() => openCompleteModal(job)}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                            title="1-Click Mark Done & Delivered"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Mark Done</span>
                          </button>
                        )}

                        <button
                          onClick={() => setPrintInvoiceJob(job)}
                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-200 transition-colors cursor-pointer"
                          title="Print Customer Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => openEditModal(job)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                          title="Edit Workshop Details"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Update</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-xs">
                    No repair bookings found in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 1-Click Fast Complete & Deliver Modal ── */}
      {completingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="p-5 border-b border-emerald-100 bg-emerald-50/50 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-700 block">
                  {completingJob.job_number || `JOB-${completingJob.id}`}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Mark Done &amp; Deliver Device
                </h3>
              </div>
              <button
                onClick={() => setCompletingJob(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900">{completingJob.customer_name} ({completingJob.customer_phone})</div>
                <div className="text-slate-600">{completingJob.device_description}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Work Performed Summary *</label>
                <input
                  type="text"
                  required
                  value={completionWorkDone}
                  onChange={(e) => setCompletionWorkDone(e.target.value)}
                  placeholder="e.g. OEM Screen replaced, tested, and sealed with 90-day warranty"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Admin</label>
                <select
                  value={completionTechId}
                  onChange={(e) => setCompletionTechId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Keep Current Admin --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name || u.username} (Admin)
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggles */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={completionPaymentDone}
                    onChange={(e) => setCompletionPaymentDone(e.target.checked)}
                    className="rounded accent-emerald-600 w-4 h-4"
                  />
                  <span>Payment received from customer (Paid status)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={completionDelivered}
                    onChange={(e) => setCompletionDelivered(e.target.checked)}
                    className="rounded accent-emerald-600 w-4 h-4"
                  />
                  <span>Device returned &amp; delivered to customer</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={completionGenInvoice}
                    onChange={(e) => setCompletionGenInvoice(e.target.checked)}
                    className="rounded accent-emerald-600 w-4 h-4"
                  />
                  <span>Generate official Tax Invoice number</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompletingJob(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCompleting}
                  className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isCompleting ? 'Completing...' : 'Complete & Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Update Booking Modal ── */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600 block">
                  {selectedJob.job_number || `JOB-${selectedJob.id}`}
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Update Workshop Repair Order
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customer: {selectedJob.customer_name} ({selectedJob.customer_phone}) • {selectedJob.device_description}
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Repair Order Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="scheduled">Scheduled / Assigned</option>
                    <option value="in_progress">In Progress (Bench Repair)</option>
                    <option value="completed">Completed (Done &amp; Delivered)</option>
                    <option value="rework">Rework Required</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Admin</label>
                  <select
                    value={editTechnician}
                    onChange={(e) => setEditTechnician(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Unassigned --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.first_name || u.username} (Admin)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {editStatus === 'rework' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <label className="block font-bold text-rose-800 mb-1">Rework Reason *</label>
                  <input
                    type="text"
                    value={editReworkReason}
                    onChange={(e) => setEditReworkReason(e.target.value)}
                    placeholder="e.g. Touch flickering or adhesive lifting, needs re-gluing..."
                    className="w-full bg-white border border-rose-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-bold text-slate-700 text-xs mb-2 uppercase tracking-wider">
                  Diagnostics &amp; Work Performed
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Intake Diagnosis</label>
                    <textarea
                      rows={2}
                      value={editDiagnosis}
                      onChange={(e) => setEditDiagnosis(e.target.value)}
                      placeholder="e.g. Digitizer damaged, display test ok..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Work Done</label>
                    <textarea
                      rows={2}
                      value={editWorkPerformed}
                      onChange={(e) => setEditWorkPerformed(e.target.value)}
                      placeholder="e.g. Frame cleaned, new OEM display fitted and sealed..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Margin Tracker */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Parts &amp; Profit Calculation</span>
                  <span className="text-[11px] text-emerald-600 font-mono font-extrabold">
                    Net Profit: ₹{calculatedInternalProfit.toLocaleString('en-IN')}
                  </span>
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Vendor Cost Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={editVendorCost}
                      onChange={(e) => setEditVendorCost(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Product Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={editProductPrice}
                      onChange={(e) => setEditProductPrice(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Service Charges (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={editServiceCharges}
                      onChange={(e) => setEditServiceCharges(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl text-white flex items-center justify-between">
                  <span className="text-xs text-slate-300">Total Customer Payable:</span>
                  <span className="text-base font-extrabold text-white font-mono">
                    ₹{calculatedTotalCharge.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveJob}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
              >
                {isSaving ? 'Updating...' : 'Save Workshop Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Printable Invoice Modal ── */}
      {printInvoiceJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:p-0">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-8 print:p-0 print:border-none print:shadow-none flex flex-col max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Premium Mobile Repair</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  #159, 1st Floor 32nd E Cross Rd, Tilak Nagar, Jayanagar, Bengaluru 560041
                </p>
                <p className="text-xs text-slate-500">Phone: +91 99860 97786 | Email: premiummobileservice3@gmail.com</p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 block mb-1">
                  TAX INVOICE
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {printInvoiceJob.invoice_number || `PMR-INV-${printInvoiceJob.id}`}
                </span>
              </div>
            </div>

            {/* Customer & Device Meta */}
            <div className="grid grid-cols-2 gap-4 py-6 border-b border-slate-100 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Billed To:</span>
                <div className="font-bold text-slate-900 text-sm">{printInvoiceJob.customer_name}</div>
                <div className="text-slate-600">{printInvoiceJob.customer_phone}</div>
                <div className="text-slate-600">{printInvoiceJob.customer_address || printInvoiceJob.pickup_address}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Service Details:</span>
                <div className="font-bold text-slate-900 text-sm">{printInvoiceJob.device_description}</div>
                <div className="text-slate-600">Date: {new Date(printInvoiceJob.created_at).toLocaleDateString()}</div>
                <div className="text-emerald-600 font-bold">Status: {printInvoiceJob.status}</div>
              </div>
            </div>

            {/* Line items table */}
            <div className="py-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-y border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">
                        {printInvoiceJob.part_name || `${printInvoiceJob.device_description} Replacement Spare`}
                      </div>
                      <div className="text-[11px] text-slate-500">Genuine OEM specification component with replacement warranty</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{Number(printInvoiceJob.product_price || printInvoiceJob.quotation_amount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">Professional Bench Diagnostics, Fitting &amp; Doorstep Delivery</div>
                      <div className="text-[11px] text-slate-500">Ultrasonic seal, thermal dissipation &amp; multi-point QA check</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{Number(printInvoiceJob.service_charges || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{Number(printInvoiceJob.total_customer_charge || printInvoiceJob.product_price || printInvoiceJob.quotation_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (Included):</span>
                    <span className="font-mono">18%</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2">
                    <span>Total Billed Amount:</span>
                    <span className="font-mono text-indigo-600">
                      ₹{Number(printInvoiceJob.total_customer_charge || printInvoiceJob.product_price || printInvoiceJob.quotation_amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-[10px] text-slate-500 space-y-1">
              <span className="font-bold text-slate-700 block uppercase">Warranty &amp; Service Terms:</span>
              <p>• Display replacements include 90 days touch warranty. Battery replacements include 180 days warranty.</p>
              <p>• Physical damage, water ingress post-repair, and customer tampering void warranty coverage.</p>
            </div>

            {/* Modal Actions */}
            <div className="pt-6 flex items-center justify-between print:hidden">
              <button
                onClick={() => setPrintInvoiceJob(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all cursor-pointer shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
