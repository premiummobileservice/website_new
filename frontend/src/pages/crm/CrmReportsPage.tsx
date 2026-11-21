import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Download,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  Filter,
  Users,
  Wrench,
  FileText,
  CheckCircle2,
  RefreshCw,
  Printer,
  Shield,
  Smartphone,
  ArrowUpRight,
  Layers,
  Percent,
} from 'lucide-react';
import { crmApi } from '../../api/crmApi';
import { RepairJob, Lead } from '../../types';
import toast from 'react-hot-toast';

export const CrmReportsPage: React.FC = () => {
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'all' | 'this_month' | 'this_week'>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, leadsRes] = await Promise.allSettled([
        crmApi.getJobs(),
        crmApi.getLeads(),
      ]);

      if (jobsRes.status === 'fulfilled') {
        setJobs(jobsRes.value.results || []);
      }
      if (leadsRes.status === 'fulfilled') {
        setLeads(leadsRes.value.results || []);
      }
    } catch {
      toast.error('Failed to load financial records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Financial calculations
  const totalRevenue = jobs.reduce((sum, j) => {
    const amt = Number(j.total_customer_charge || j.product_price || 0);
    return sum + amt;
  }, 0);

  const totalVendorCost = jobs.reduce((sum, j) => {
    return sum + Number(j.vendor_cost || 0);
  }, 0);

  const totalGrossProfit = totalRevenue - totalVendorCost;
  const grossProfitMargin = totalRevenue > 0 ? ((totalGrossProfit / totalRevenue) * 100).toFixed(1) : '0';

  const partsRevenue = jobs.reduce((sum, j) => sum + Number(j.product_price || 0), 0);
  const laborRevenue = jobs.reduce((sum, j) => {
    const total = Number(j.total_customer_charge || 0);
    const parts = Number(j.product_price || 0);
    return sum + Math.max(0, total - parts);
  }, 0);

  const totalGstCollected = (totalRevenue * 0.18 / 1.18);
  const cgst = totalGstCollected / 2;
  const sgst = totalGstCollected / 2;

  // Pipeline funnel calculations
  const totalEnquiries = leads.length;
  const convertedToBooking = leads.filter((l) => l.status === 'interested' || Boolean(l.job_id) || (l as any).has_job).length;
  const completedJobs = jobs.filter((j) => j.status === 'completed' || j.status === 'delivered').length;
  const paidInvoices = jobs.filter((j) => j.payment_status === 'paid' || j.status === 'completed').length;

  const conversionRate = totalEnquiries > 0 ? ((convertedToBooking / totalEnquiries) * 100).toFixed(1) : '0';
  const completionRate = convertedToBooking > 0 ? ((completedJobs / convertedToBooking) * 100).toFixed(1) : '0';

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Job Number',
      'Invoice Number',
      'Customer Name',
      'Customer Phone',
      'Device Description',
      'Part Description',
      'Part Price (INR)',
      'Labor Charges (INR)',
      'Total Customer Charge (INR)',
      'Vendor Cost (INR)',
      'Internal Profit (INR)',
      'Payment Status',
      'Payment Method',
      'Completed Date',
    ];

    const rows = jobs.map((j) => [
      `"${j.job_number || j.job_id || ''}"`,
      `"${j.invoice_number || ''}"`,
      `"${(j.customer_name || '').replace(/"/g, '""')}"`,
      `"${j.customer_phone || ''}"`,
      `"${(j.device_description || j.brand_model || '').replace(/"/g, '""')}"`,
      `"${(j.part_name || '').replace(/"/g, '""')}"`,
      Number(j.product_price || 0),
      Number(j.service_charges || (Number(j.total_customer_charge || 0) - Number(j.product_price || 0))),
      Number(j.total_customer_charge || 0),
      Number(j.vendor_cost || 0),
      Number(j.internal_profit || (Number(j.total_customer_charge || 0) - Number(j.vendor_cost || 0))),
      `"${j.payment_status || 'unpaid'}"`,
      `"${j.payment_method || 'upi'}"`,
      `"${j.completed_at || j.created_at || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PMR_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Financial report exported successfully!');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <span>Financial &amp; Executive Performance Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time revenue analytics, profit margins, GST compliance breakdown, and pipeline conversion audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── Top 4 Financial Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Billed Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{jobs.length} completed &amp; active repair orders</span>
          </div>
        </div>

        {/* Gross Profit Margin */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Profit Margin</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
            {grossProfitMargin}%
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            ₹{totalGrossProfit.toLocaleString('en-IN')} net retained after vendor parts
          </div>
        </div>

        {/* Vendor Hardware Cost */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Vendor Parts Outflow</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
            ₹{totalVendorCost.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            SP Road &amp; OEM displays, batteries &amp; IC chips
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Lead Conversion Rate</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 font-mono">
            {conversionRate}%
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {convertedToBooking} bookings from {totalEnquiries} enquiries
          </div>
        </div>
      </div>

      {/* ── Revenue Composition & GST Audit ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parts vs Service Charges Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Revenue Composition (Hardware Parts vs. Labor)</span>
            </h3>
            <span className="text-[11px] font-mono font-bold text-slate-500">
              ₹{totalRevenue.toLocaleString('en-IN')} Total
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Parts Component */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700">Hardware Parts &amp; Screen Assemblies</span>
                <span className="font-mono text-slate-900">
                  ₹{partsRevenue.toLocaleString('en-IN')} ({totalRevenue > 0 ? ((partsRevenue / totalRevenue) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all"
                  style={{ width: `${totalRevenue > 0 ? (partsRevenue / totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Bench Labor & QC */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700">Master Bench Labor &amp; Doorstep Logistics</span>
                <span className="font-mono text-slate-900">
                  ₹{laborRevenue.toLocaleString('en-IN')} ({totalRevenue > 0 ? ((laborRevenue / totalRevenue) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${totalRevenue > 0 ? (laborRevenue / totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Vendor parts cost */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700">Component Procurement Costs</span>
                <span className="font-mono text-amber-600">
                  ₹{totalVendorCost.toLocaleString('en-IN')} ({totalRevenue > 0 ? ((totalVendorCost / totalRevenue) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${totalRevenue > 0 ? (totalVendorCost / totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* GST & Statutory Tax Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>GST Compliance &amp; Tax Liability (18% Flat)</span>
            </h3>
            <span className="text-[11px] font-mono font-bold text-slate-500">
              SAC Code: 9987
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Turnover (Pre-tax Base):</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{(totalRevenue / 1.18).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Central GST (CGST @ 9%):</span>
                <span className="font-mono font-bold text-indigo-600">
                  ₹{cgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Karnataka State GST (SGST @ 9%):</span>
                <span className="font-mono font-bold text-indigo-600">
                  ₹{sgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-900 font-extrabold border-t border-slate-200 pt-2">
                <span>Total GST Liability Collected:</span>
                <span className="font-mono text-emerald-600">
                  ₹{totalGstCollected.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Company GSTIN: <b>29AABCP1234F1Z5</b>. Computer and telephone hardware repair services comply with intra-state CGST + SGST provisions in Karnataka.
            </p>
          </div>
        </div>
      </div>

      {/* ── 4-Action Pipeline Funnel Audit ── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <span>Complete Lifecycle Conversion Pipeline</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200">
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block mb-1">
              1. Enquiries Logged
            </span>
            <div className="text-2xl font-black text-purple-900">{totalEnquiries}</div>
            <span className="text-[11px] text-purple-600 font-bold block mt-1">100% Inflow</span>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
              2. Converted Bookings
            </span>
            <div className="text-2xl font-black text-indigo-900">{convertedToBooking}</div>
            <span className="text-[11px] text-indigo-600 font-bold block mt-1">{conversionRate}% Accepted</span>
          </div>

          <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200">
            <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block mb-1">
              3. Workshop Completed
            </span>
            <div className="text-2xl font-black text-sky-900">{completedJobs}</div>
            <span className="text-[11px] text-sky-600 font-bold block mt-1">{completionRate}% Repaired</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
              4. Invoiced &amp; Paid
            </span>
            <div className="text-2xl font-black text-emerald-900">{paidInvoices}</div>
            <span className="text-[11px] text-emerald-600 font-bold block mt-1">₹{totalRevenue.toLocaleString('en-IN')} Total</span>
          </div>
        </div>
      </div>
    </div>
  );
};
