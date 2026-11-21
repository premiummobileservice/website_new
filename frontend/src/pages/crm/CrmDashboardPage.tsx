import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { crmApi } from '../../api/crmApi';
import { Lead, RepairJob } from '../../types';
import {
  Users,
  Wrench,
  PhoneCall,
  RefreshCw,
  ArrowRight,
  Clock,
  Phone,
  Sparkles,
  TrendingUp,
  FileText,
  Plus,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const CrmDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [callbackLeads, setCallbackLeads] = useState<Lead[]>([]);
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, leadsRes, jobsRes, callbacksRes] = await Promise.allSettled([
        crmApi.getLeadStats(),
        crmApi.getLeads({ page: 1 }),
        crmApi.getJobs(),
        crmApi.getLeads({ status: 'callback_later' }),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }
      if (leadsRes.status === 'fulfilled') {
        setRecentLeads(leadsRes.value.results || []);
      }
      if (jobsRes.status === 'fulfilled') {
        setJobs(jobsRes.value.results || []);
      }
      if (callbacksRes.status === 'fulfilled') {
        setCallbackLeads(callbacksRes.value.results || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalLeads = stats?.enquiries?.total ?? recentLeads.length;
  const newToday = stats?.enquiries?.new_today ?? 0;
  const activeBookings = stats?.bookings?.active ?? jobs.filter((j) => j.status !== 'completed').length;
  const completedBookings = stats?.bookings?.completed ?? jobs.filter((j) => j.status === 'completed').length;
  const callbacksDue = stats?.callbacks?.due_today ?? 0;
  const callbacksTotal = stats?.callbacks?.total ?? callbackLeads.length;
  const totalRevenue = stats?.invoices?.total_revenue ?? 0;
  const invoiceCount = stats?.invoices?.count ?? 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* ── Page Header & Quick Sync ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Bangalore Hub • Doorstep Operations Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Operations &amp; Revenue Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Real-time pipeline driven directly by the database: Enquiries, 4-Action Conversions, Workshop Bookings, and Instant Invoicing.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-300 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live DB</span>
          </button>

          <Link
            to="/crm/leads"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/40 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Pipeline Desk</span>
          </Link>
        </div>
      </div>

      {/* ── 4 Top KPI Cards with Subtle Radiant Accents ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: TOTAL ENQUIRIES */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Enquiries
              </span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
              {totalLeads}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-4 mt-3 border-t border-slate-100">
            <span className="font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
              +{newToday} New Today
            </span>
            <Link
              to="/crm/leads"
              className="text-purple-600 hover:text-purple-700 font-bold inline-flex items-center gap-1 group/link"
            >
              <span>Review</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Card 2: ACTIVE BOOKINGS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Active Bookings
              </span>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
              {activeBookings}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-4 mt-3 border-t border-slate-100">
            <span className="text-slate-500 font-medium">
              {completedBookings} Completed
            </span>
            <Link
              to="/crm/repairs"
              className="text-sky-600 hover:text-sky-700 font-bold inline-flex items-center gap-1 group/link"
            >
              <span>Workshop</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Card 3: PENDING CALLBACKS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Pending Callbacks
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
                <PhoneCall className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
              {callbacksTotal}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-4 mt-3 border-t border-slate-100">
            <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
              {callbacksDue} Due Today
            </span>
            <Link
              to="/crm/callbacks"
              className="text-amber-600 hover:text-amber-700 font-bold inline-flex items-center gap-1 group/link"
            >
              <span>Follow Up</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Card 4: TOTAL PAID REVENUE */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Paid Revenue
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-600 mt-1 tracking-tight font-mono">
              ₹{Number(totalRevenue).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-4 mt-3 border-t border-slate-100">
            <span className="text-slate-500 font-medium">
              {invoiceCount} Invoices
            </span>
            <Link
              to="/crm/invoices"
              className="text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-1 group/link"
            >
              <span>Tax Invoices</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Interactive Live Pipeline Funnel ── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Real-Time Customer Journey Pipeline
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Automatic lifecycle tracking</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 text-center">
            <span className="text-[10px] font-bold text-purple-700 uppercase block">1. New Enquiry</span>
            <span className="text-xl font-black text-purple-900 mt-1 block">{totalLeads}</span>
            <span className="text-[10px] text-purple-600">Awaiting action</span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 text-center">
            <span className="text-[10px] font-bold text-amber-700 uppercase block">2. Call Back</span>
            <span className="text-xl font-black text-amber-900 mt-1 block">{callbacksTotal}</span>
            <span className="text-[10px] text-amber-600">Scheduled time</span>
          </div>

          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100 text-center">
            <span className="text-[10px] font-bold text-sky-700 uppercase block">3. Interested</span>
            <span className="text-xl font-black text-sky-900 mt-1 block">{stats?.enquiries?.interested ?? 1}</span>
            <span className="text-[10px] text-sky-600">Quote approved</span>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-center">
            <span className="text-[10px] font-bold text-indigo-700 uppercase block">4. In Workshop</span>
            <span className="text-xl font-black text-indigo-900 mt-1 block">{activeBookings}</span>
            <span className="text-[10px] text-indigo-600">Bench in repair</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center col-span-2 md:col-span-1">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">5. Delivered / Paid</span>
            <span className="text-xl font-black text-emerald-900 mt-1 block">{completedBookings}</span>
            <span className="text-[10px] text-emerald-600">Invoice ready</span>
          </div>
        </div>
      </div>

      {/* ── Two Columns: Recent Enquiries & Active Workshop ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Enquiries */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  New Enquiries Requiring Review
                </h2>
                <p className="text-[11px] text-slate-500">Apply Interested, Call Back, or Rejection action</p>
              </div>
            </div>
            <Link
              to="/crm/leads"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-center">
            {recentLeads.length > 0 ? (
              <div className="space-y-3">
                {recentLeads.slice(0, 4).map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between hover:border-indigo-300 hover:bg-indigo-50/20 transition-all"
                  >
                    <div className="overflow-hidden pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-white border border-indigo-100 px-1.5 py-0.5 rounded">
                          {lead.reference || `PMR-${lead.id}`}
                        </span>
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {lead.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 truncate">
                        {lead.brand_model} • {lead.repair_needed} • {lead.area}
                      </div>
                    </div>
                    <Link
                      to={`/crm/leads?leadId=${lead.id}`}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs shrink-0 cursor-pointer"
                    >
                      Action
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No new unreviewed enquiries right now.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Workshop Repairs */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Workshop Repairs (In Progress)
                </h2>
                <p className="text-[11px] text-slate-500">Bench testing, repair &amp; parts replacement</p>
              </div>
            </div>
            <Link
              to="/crm/repairs"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
            >
              <span>View Workshop</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-center">
            {jobs.length > 0 ? (
              <div className="space-y-3">
                {jobs.slice(0, 4).map((job) => (
                  <div
                    key={job.id}
                    className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between hover:border-sky-300 hover:bg-sky-50/20 transition-all"
                  >
                    <div className="overflow-hidden pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-sky-600 bg-white border border-sky-100 px-1.5 py-0.5 rounded">
                          {job.job_number || `JOB-${job.id}`}
                        </span>
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {job.customer_name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 truncate">
                        {job.brand_model} • ₹{Number(job.total_customer_charge || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <Link
                      to="/crm/repairs"
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-xs shrink-0 cursor-pointer"
                    >
                      Status
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No active repairs in workshop.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Scheduled Callbacks Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Scheduled Callbacks Requiring Attention
              </h2>
              <p className="text-[11px] text-slate-500">Direct follow-ups requested by customers</p>
            </div>
          </div>
          <Link
            to="/crm/callbacks"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1"
          >
            <span>Open Callbacks Desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-5">
          {callbackLeads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {callbackLeads.map((l) => (
                <div
                  key={l.id}
                  className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/30 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-900">{l.name}</span>
                      <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                        {l.callback_date || 'Today'} {l.callback_time}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">{l.brand_model} • {l.repair_needed}</div>
                    {l.callback_notes && (
                      <p className="text-[11px] text-slate-500 mt-2 bg-white/70 p-2 rounded-lg border border-amber-100/60 italic">
                        "{l.callback_notes}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-amber-100">
                    <a
                      href={`tel:${l.phone}`}
                      className="flex-1 py-1 px-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-center text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call {l.phone}</span>
                    </a>
                    <Link
                      to={`/crm/leads?leadId=${l.id}`}
                      className="py-1 px-3 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50"
                    >
                      Convert
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No callbacks pending right now. All customer follow-ups are up to date!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
