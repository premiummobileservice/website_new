import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Calendar,
  RefreshCw,
  Plus,
  Printer,
  Download,
  DollarSign,
  CheckCircle2,
  Clock,
  Smartphone,
  User,
  X,
  CreditCard,
  Building,
  Edit3,
  MessageCircle,
  Mail,
  Send,
  Save,
  Check,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { crmApi } from '../../api/crmApi';
import { RepairJob } from '../../types';
import toast from 'react-hot-toast';

export const CrmInvoicesPage: React.FC = () => {
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending' | 'needs_invoice'>('all');
  
  // View / Print Modal
  const [selectedInvoiceJob, setSelectedInvoiceJob] = useState<RepairJob | null>(null);

  // Edit Modal State
  const [editingJob, setEditingJob] = useState<RepairJob | null>(null);
  const [editForm, setEditForm] = useState({
    invoice_number: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    customer_gstin: '',
    device_description: '',
    part_name: '',
    product_price: 0,
    service_charges: 0,
    gst_rate: 18,
    payment_status: 'paid' as 'paid' | 'pending',
    payment_method: 'upi',
    warranty: '90 Days Touch / 180 Days Battery',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await crmApi.getJobs();
      setJobs(res.results || []);
    } catch {
      toast.error('Failed to load invoice records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const getAmount = (j: RepairJob) => {
    return Number(j.total_customer_charge || j.product_price || j.quotation_amount || 0);
  };

  const isPaid = (j: RepairJob) => {
    return j.payment_status === 'paid' || ['completed', 'delivered', 'delivered_collected'].includes(j.status);
  };

  const totalPaidRevenue = jobs.reduce((sum, j) => {
    if (isPaid(j)) {
      return sum + getAmount(j);
    }
    return sum;
  }, 0);

  const totalPendingBalance = jobs.reduce((sum, j) => {
    if (!isPaid(j)) {
      return sum + getAmount(j);
    }
    return sum;
  }, 0);

  const openEditModal = (job: RepairJob) => {
    const invNum = job.invoice_number || `PMR-INV-${new Date().getFullYear()}-${String(job.id).padStart(4, '0')}`;
    const partCost = Number(job.product_price || 0);
    const laborCost = Number(job.service_charges || (job.total_customer_charge ? Math.max(0, Number(job.total_customer_charge) - partCost) : 350));
    
    setEditingJob(job);
    setEditForm({
      invoice_number: invNum,
      customer_name: job.customer_name || 'Customer',
      customer_phone: job.customer_phone || '',
      customer_email: job.customer_email || '',
      customer_address: job.customer_address || job.pickup_address || '',
      customer_gstin: '',
      device_description: job.device_description || job.brand_model || 'Smartphone',
      part_name: job.part_name || `${job.device_description || 'Device'} Replacement Component`,
      product_price: partCost,
      service_charges: laborCost,
      gst_rate: 18,
      payment_status: isPaid(job) ? 'paid' : 'pending',
      payment_method: job.payment_method || 'upi',
      warranty: '90 Days Touch / 180 Days Battery',
    });
  };

  const handleSaveInvoiceEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    setIsSavingEdit(true);
    const subtotal = Number(editForm.product_price) + Number(editForm.service_charges);
    const totalCharge = subtotal;

    try {
      await crmApi.updateJob(editingJob.id, {
        invoice_number: editForm.invoice_number,
        part_name: editForm.part_name,
        product_price: Number(editForm.product_price),
        service_charges: Number(editForm.service_charges),
        total_customer_charge: totalCharge,
        payment_status: editForm.payment_status as any,
        payment_method: editForm.payment_method,
      });

      toast.success(`Invoice ${editForm.invoice_number} updated successfully!`);
      setEditingJob(null);
      await fetchInvoices();
    } catch {
      toast.error('Failed to update invoice details');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleGenerateInvoice = async (job: RepairJob) => {
    try {
      const updated = await crmApi.createInvoice(job.id);
      toast.success(`Invoice ${updated.invoice_number || `PMR-INV-${job.id}`} generated!`);
      await fetchInvoices();
    } catch {
      toast.error('Failed to generate invoice');
    }
  };

  const handleSendWhatsApp = (job: RepairJob) => {
    const phone = job.customer_phone?.replace(/\D/g, '') || '';
    if (!phone) {
      toast.error('Customer phone number is missing');
      return;
    }

    const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;
    const invNum = job.invoice_number || `PMR-INV-${job.id}`;
    const amount = getAmount(job).toLocaleString('en-IN');
    const device = job.device_description || job.brand_model || 'Device';
    const statusText = isPaid(job) ? 'PAID' : 'PENDING';

    const msg = `Hello ${job.customer_name || 'Customer'},\n\nThank you for choosing *Premium Mobile Repair* Bangalore!\n\nYour Tax Invoice *#${invNum}* for *${device}* repair is ready.\n\n*Amount:* ₹${amount} (${statusText})\n*Warranty:* 90 Days Touch / 180 Days Battery\n*Service Center:* #159, 1st Floor 32nd E Cross Rd, Tilak Nagar, Jayanagar, Bengaluru 560041\n*Helpline / WhatsApp:* +91 99860 97786\n\nPlease retain this message as your valid warranty certificate.`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    toast.success(`Opened WhatsApp to send invoice to ${job.customer_phone}`);
  };

  const handleSendEmail = async (job: RepairJob) => {
    const email = job.customer_email || (job as any).lead_details?.email;
    if (!email) {
      toast.error('No email address on file for this customer');
      return;
    }

    setIsSendingEmail(true);
    try {
      await crmApi.sendInvoiceEmail({
        email,
        customer_name: job.customer_name,
        invoice_number: job.invoice_number || `PMR-INV-${job.id}`,
        device: job.device_description || job.brand_model,
        amount: getAmount(job),
        payment_status: isPaid(job) ? 'PAID' : 'PENDING',
        warranty: '90 Days Touch / 180 Days Battery',
      });
      toast.success(`Tax Invoice dispatched to ${email}!`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to dispatch invoice email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (paymentFilter === 'paid' && !isPaid(j)) return false;
    if (paymentFilter === 'pending' && isPaid(j)) return false;
    if (paymentFilter === 'needs_invoice' && Boolean(j.invoice_number)) return false;

    if (search) {
      const q = search.toLowerCase();
      const invNum = j.invoice_number || `PMR-INV-${j.id}`;
      return (
        invNum.toLowerCase().includes(q) ||
        (j.job_number && j.job_number.toLowerCase().includes(q)) ||
        (j.customer_name && j.customer_name.toLowerCase().includes(q)) ||
        (j.customer_phone && j.customer_phone.includes(q)) ||
        (j.device_description && j.device_description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-600" />
            <span>Tax Invoices &amp; GST Billing</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate itemized GST invoices, customize line items, record payments, and dispatch directly via WhatsApp or Email.
          </p>
        </div>

        <button
          onClick={fetchInvoices}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Invoices</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{jobs.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Workshop billing records</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Collected Revenue</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 font-mono">
            ₹{totalPaidRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Paid &amp; delivered repairs</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pending Receivables</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-1 font-mono">
            ₹{totalPendingBalance.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">In-repair &amp; uncollected charges</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
          <button
            onClick={() => setPaymentFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              paymentFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Records ({jobs.length})
          </button>
          <button
            onClick={() => setPaymentFilter('paid')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              paymentFilter === 'paid'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Paid ({jobs.filter(isPaid).length})
          </button>
          <button
            onClick={() => setPaymentFilter('pending')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              paymentFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Pending ({jobs.filter((j) => !isPaid(j)).length})
          </button>
          <button
            onClick={() => setPaymentFilter('needs_invoice')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              paymentFilter === 'needs_invoice'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            Needs Invoice ({jobs.filter((j) => !j.invoice_number).length})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice, job #, customer..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Invoice / Job #</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Device &amp; Service</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Quick Dispatch &amp; Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.map((j) => {
                const amount = getAmount(j);
                const invNumber = j.invoice_number || `PMR-INV-${j.id}`;
                const paid = isPaid(j);

                return (
                  <tr key={j.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      {j.invoice_number ? (
                        <div className="font-mono font-bold text-indigo-600 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{j.invoice_number}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleGenerateInvoice(j)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          + Generate Invoice
                        </button>
                      )}
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Job: {j.job_number || `JOB-${j.id}`}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{j.customer_name || 'Customer'}</div>
                      <div className="text-[11px] text-slate-500">{j.customer_phone}</div>
                      {j.customer_email && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                          {j.customer_email}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{j.device_description || j.brand_model}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                        {j.part_name || j.confirmed_issue || 'Repair Service'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        ₹{amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">Incl. 18% GST</div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          paid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {paid ? 'PAID' : 'PENDING'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp Dispatch */}
                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(j)}
                          title="Send Invoice to Customer WhatsApp"
                          className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>

                        {/* Email Dispatch */}
                        {j.customer_email && (
                          <button
                            type="button"
                            onClick={() => handleSendEmail(j)}
                            title={`Email Invoice to ${j.customer_email}`}
                            className="p-1.5 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Edit Invoice Button */}
                        <button
                          type="button"
                          onClick={() => openEditModal(j)}
                          title="Edit Invoice Details"
                          className="p-1.5 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Print / View Modal */}
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceJob(j)}
                          title="Print or View Invoice"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-xs">
                    No invoice records found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Edit Invoice ── */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Edit Invoice #{editForm.invoice_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingJob(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoiceEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    required
                    value={editForm.invoice_number}
                    onChange={(e) => setEditForm({ ...editForm, invoice_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Status *</label>
                  <select
                    value={editForm.payment_status}
                    onChange={(e) => setEditForm({ ...editForm, payment_status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="paid">PAID</option>
                    <option value="pending">PENDING</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={editForm.customer_name}
                    onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Customer Phone</label>
                  <input
                    type="text"
                    value={editForm.customer_phone}
                    onChange={(e) => setEditForm({ ...editForm, customer_phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Part / Hardware Replacement Description</label>
                <input
                  type="text"
                  value={editForm.part_name}
                  onChange={(e) => setEditForm({ ...editForm, part_name: e.target.value })}
                  placeholder="e.g. OEM Display Assembly / Battery Pack"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Part Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.product_price}
                    onChange={(e) => setEditForm({ ...editForm, product_price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Labor &amp; QC Service Charge (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.service_charges}
                    onChange={(e) => setEditForm({ ...editForm, service_charges: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
                  <select
                    value={editForm.payment_method}
                    onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="cash">Cash on Delivery</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="bank_transfer">Bank Transfer / NEFT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Warranty Term</label>
                  <input
                    type="text"
                    value={editForm.warranty}
                    onChange={(e) => setEditForm({ ...editForm, warranty: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Calculated Total Banner */}
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 flex items-center justify-between text-indigo-900">
                <div>
                  <span className="font-bold">Calculated Invoice Total:</span>
                  <span className="text-[11px] text-indigo-700 block">
                    Part (₹{editForm.product_price}) + Service (₹{editForm.service_charges})
                  </span>
                </div>
                <div className="text-base font-extrabold font-mono text-indigo-700">
                  ₹{(Number(editForm.product_price) + Number(editForm.service_charges)).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingEdit ? 'Saving...' : 'Save Invoice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: View & Print Tax Invoice ── */}
      {selectedInvoiceJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:p-0">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-8 print:p-0 print:border-none print:shadow-none flex flex-col max-h-[95vh] overflow-y-auto space-y-6">
            {/* Header with PMR Branding & GST Info */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                    PMR
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Premium Mobile Repair</h2>
                </div>
                <p className="text-xs text-slate-500">
                  #159, 1st Floor 32nd E Cross Rd, Tilak Nagar, Jayanagar, Bengaluru 560041
                </p>
                <p className="text-xs text-slate-500">Phone: +91 99860 97786 | Email: premiummobileservice3@gmail.com</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 font-mono">
                  <span>GSTIN: <b>29AABCP1234F1Z5</b></span>
                  <span>•</span>
                  <span>HSN/SAC: <b>9987</b></span>
                </div>
              </div>

              <div className="text-right">
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block mb-1.5 uppercase">
                  TAX INVOICE
                </span>
                <div className="font-mono font-extrabold text-slate-900 text-sm">
                  {selectedInvoiceJob.invoice_number || `PMR-INV-${selectedInvoiceJob.id}`}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Date: {new Date(selectedInvoiceJob.completed_at || selectedInvoiceJob.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Bill To & Repair Order Info */}
            <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-100 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Billed To (Customer):</span>
                <div className="font-bold text-slate-900 text-sm">{selectedInvoiceJob.customer_name}</div>
                <div className="text-slate-600 font-mono">{selectedInvoiceJob.customer_phone}</div>
                {selectedInvoiceJob.customer_email && (
                  <div className="text-slate-600">{selectedInvoiceJob.customer_email}</div>
                )}
                {selectedInvoiceJob.pickup_address && (
                  <div className="text-slate-500 mt-1 text-[11px] leading-relaxed">
                    {selectedInvoiceJob.pickup_address}
                  </div>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Service Details:</span>
                <div className="font-bold text-slate-900 text-sm">{selectedInvoiceJob.device_description}</div>
                <div className="text-slate-600 font-mono text-[11px]">
                  Job Code: {selectedInvoiceJob.job_number || `JOB-${selectedInvoiceJob.id}`}
                </div>
                <div className="mt-1">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    isPaid(selectedInvoiceJob) ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    Payment: {isPaid(selectedInvoiceJob) ? 'PAID' : 'PENDING'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Method: {selectedInvoiceJob.payment_method?.toUpperCase() || 'UPI'}
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-y border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Item / Service Description</th>
                    <th className="py-2.5 px-3 text-center">HSN/SAC</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">
                        {selectedInvoiceJob.part_name || `${selectedInvoiceJob.device_description} Replacement Component`}
                      </div>
                      <div className="text-[11px] text-slate-500">Genuine OEM-grade certified hardware part</div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500">8517</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{Number(selectedInvoiceJob.product_price || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">Precision Bench Labor, Ultrasonic Seal &amp; Delivery</div>
                      <div className="text-[11px] text-slate-500">Master technician bench service, calibration &amp; multi-point diagnostic QC</div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500">9987</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{Number(selectedInvoiceJob.service_charges || (getAmount(selectedInvoiceJob) - Number(selectedInvoiceJob.product_price || 0))).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* GST & Totals Breakdown */}
              <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
                <div className="w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Value:</span>
                    <span className="font-mono">
                      ₹{(getAmount(selectedInvoiceJob) / 1.18).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (9%):</span>
                    <span className="font-mono">
                      ₹{((getAmount(selectedInvoiceJob) / 1.18) * 0.09).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST (9%):</span>
                    <span className="font-mono">
                      ₹{((getAmount(selectedInvoiceJob) / 1.18) * 0.09).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2">
                    <span>Grand Total:</span>
                    <span className="font-mono text-indigo-600">
                      ₹{getAmount(selectedInvoiceJob).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Warranty & Terms */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-[10px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 uppercase block">Certified Warranty Guarantee:</span>
              <p>• Display replacements include 90-day touch and defect guarantee. Batteries include 180-day warranty.</p>
              <p>• Warranty is tracked digitally using your invoice number. Post-repair liquid damage or physical drop voids coverage.</p>
            </div>

            {/* Modal Bottom Action Bar (Hidden during Print) */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <button
                type="button"
                onClick={() => setSelectedInvoiceJob(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {/* Send via WhatsApp */}
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(selectedInvoiceJob)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Send to WhatsApp</span>
                </button>

                {/* Send via Email */}
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={() => handleSendEmail(selectedInvoiceJob)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{isSendingEmail ? 'Sending Email...' : 'Send to Email'}</span>
                </button>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => {
                    const j = selectedInvoiceJob;
                    setSelectedInvoiceJob(null);
                    openEditModal(j);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                {/* Print Invoice */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all cursor-pointer shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
