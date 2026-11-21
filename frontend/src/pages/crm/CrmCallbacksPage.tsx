import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Search,
  Calendar,
  RefreshCw,
  Clock,
  User,
  Smartphone,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  MessageSquare,
  MessageCircle,
  Phone,
  X,
} from 'lucide-react';
import { crmApi } from '../../api/crmApi';
import { Lead } from '../../types';
import toast from 'react-hot-toast';

export const CrmCallbacksPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('11:00 AM');
  const [followupNote, setFollowupNote] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'due_today' | 'overdue' | 'upcoming'>('all');

  const fetchCallbacks = async () => {
    setLoading(true);
    try {
      const res = await crmApi.getLeads();
      const allLeads = res.results || [];
      const callbackLeads = allLeads.filter(
        (l) => l.status === 'callback_later' || Boolean(l.callback_date)
      );
      setLeads(callbackLeads);
    } catch {
      toast.error('Failed to load callbacks pipeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallbacks();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const getDateStr = (lead: Lead) => {
    return lead.callback_date || (lead.preferred_time ? lead.preferred_time.split('T')[0] : '');
  };

  const dueTodayCount = leads.filter((l) => getDateStr(l) === todayStr).length;
  const overdueCount = leads.filter((l) => {
    const d = getDateStr(l);
    return d && d < todayStr;
  }).length;
  const upcomingCount = leads.filter((l) => {
    const d = getDateStr(l);
    return d && d > todayStr;
  }).length;

  const filteredLeads = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (l.reference && l.reference.toLowerCase().includes(q)) ||
      (l.name && l.name.toLowerCase().includes(q)) ||
      (l.phone && l.phone.includes(q)) ||
      (l.brand_model && l.brand_model.toLowerCase().includes(q)) ||
      (l.repair_needed && l.repair_needed.toLowerCase().includes(q)) ||
      (l.area && l.area.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    const d = getDateStr(l);
    if (activeTab === 'due_today') return d === todayStr;
    if (activeTab === 'overdue') return Boolean(d && d < todayStr);
    if (activeTab === 'upcoming') return Boolean(d && d > todayStr);

    return true;
  });

  const handleConvertToBooking = async (lead: Lead) => {
    try {
      await crmApi.performLeadAction(lead.id, {
        action: 'interested',
        notes: `Converted from Call Back Later desk on ${new Date().toLocaleDateString()}`,
      });
      toast.success(`Converted ${lead.reference || `PMR-${lead.id}`} into active Booking!`);
      await fetchCallbacks();
    } catch {
      toast.error('Failed to convert to booking');
    }
  };

  const handleMarkRejected = async (lead: Lead) => {
    try {
      await crmApi.performLeadAction(lead.id, {
        action: 'not_interested',
        rejection_reason: 'Customer declined during follow-up call',
        rejection_notes: followupNote || 'Customer indicated no longer interested',
      });
      toast.success(`Moved ${lead.reference} to Rejected list`);
      setSelectedLead(null);
      await fetchCallbacks();
    } catch {
      toast.error('Failed to update lead');
    }
  };

  const handleReschedule = async () => {
    if (!selectedLead) return;
    if (!rescheduleDate) {
      toast.error('Please pick a new callback date');
      return;
    }
    try {
      await crmApi.performLeadAction(selectedLead.id, {
        action: 'callback_later',
        callback_date: rescheduleDate,
        callback_time: rescheduleTime,
        callback_notes: followupNote || 'Rescheduled follow-up agreed with customer',
      });
      toast.success(`Callback rescheduled for ${selectedLead.reference || `PMR-${selectedLead.id}`}`);
      setSelectedLead(null);
      setFollowupNote('');
      await fetchCallbacks();
    } catch {
      toast.error('Failed to reschedule callback');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <PhoneCall className="w-6 h-6 text-amber-500" />
            <span>Call Back Later — Follow-Up Desk</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dedicated follow-up interface: Contact customers at their preferred time, reschedule dates, and convert directly to bookings.
          </p>
        </div>

        <button
          onClick={fetchCallbacks}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('due_today')}
          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
            activeTab === 'due_today'
              ? 'bg-amber-50 border-amber-500 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Due Today</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-900 mt-1">{dueTodayCount}</div>
          <div className="text-[11px] text-amber-700 mt-0.5">Must call back today</div>
        </div>

        <div
          onClick={() => setActiveTab('overdue')}
          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
            activeTab === 'overdue'
              ? 'bg-rose-50 border-rose-500 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Overdue</div>
          <div className="text-2xl sm:text-3xl font-black text-rose-900 mt-1">{overdueCount}</div>
          <div className="text-[11px] text-rose-700 mt-0.5">Action pending</div>
        </div>

        <div
          onClick={() => setActiveTab('upcoming')}
          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
            activeTab === 'upcoming'
              ? 'bg-blue-50 border-blue-500 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Upcoming</div>
          <div className="text-2xl sm:text-3xl font-black text-blue-900 mt-1">{upcomingCount}</div>
          <div className="text-[11px] text-blue-700 mt-0.5">Scheduled future days</div>
        </div>

        <div
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className={`text-[10px] font-bold uppercase tracking-wider ${activeTab === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
            All Callbacks
          </div>
          <div className={`text-2xl sm:text-3xl font-black mt-1 ${activeTab === 'all' ? 'text-white' : 'text-slate-900'}`}>
            {leads.length}
          </div>
          <div className={`text-[11px] mt-0.5 ${activeTab === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
            Full pipeline history
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search callback leads by customer name, phone, PMR reference, or device..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
        />
      </div>

      {/* Callbacks List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 font-bold">Scheduled Call</th>
                <th className="px-4 py-3.5 font-bold">Customer Contact</th>
                <th className="px-4 py-3.5 font-bold">Device & Problem</th>
                <th className="px-4 py-3.5 font-bold">Callback Notes</th>
                <th className="px-4 py-3.5 font-bold">Quick Contact</th>
                <th className="px-4 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => {
                const cleanPhone = lead.phone.replace(/\D/g, '');
                const waUrl = `https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(
                  lead.name
                )}%2C%20following%20up%20from%20Premium%20Mobile%20Repair%20as%20requested%20regarding%20your%20${encodeURIComponent(
                  lead.brand_model
                )}%20repair.%20Is%20now%20a%20good%20time%20to%20talk%3F`;

                const dateStr = getDateStr(lead);
                const isOverdue = dateStr && dateStr < todayStr;
                const isToday = dateStr === todayStr;

                return (
                  <tr key={lead.id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-500' : isToday ? 'text-amber-500' : 'text-blue-500'}`} />
                        <span className="font-bold text-slate-900 font-mono text-[11px]">
                          {dateStr || 'No date set'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 ml-5 block">
                        {lead.callback_time || '11:00 AM'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{lead.name}</div>
                      <div className="font-mono text-slate-500 text-[11px]">{lead.phone}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800">{lead.brand_model}</div>
                      <div className="text-[11px] text-indigo-600 font-medium">{lead.repair_needed}</div>
                    </td>

                    <td className="px-4 py-3.5 max-w-[200px]">
                      <div className="text-slate-600 line-clamp-2">
                        {lead.callback_notes || lead.issue_description || 'No specific notes'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition-colors cursor-pointer"
                          title="WhatsApp Follow-up"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`tel:${lead.phone}`}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 transition-colors cursor-pointer"
                          title="Call Customer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleConvertToBooking(lead)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-300 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Convert</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setRescheduleDate(getDateStr(lead) || todayStr);
                            setRescheduleTime(lead.callback_time || '11:00 AM');
                            setFollowupNote(lead.callback_notes || '');
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white border border-amber-300 transition-colors cursor-pointer"
                        >
                          Reschedule
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-xs">
                    No callback leads found under current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reschedule Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Reschedule Callback: {selectedLead.name}
              </h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Callback Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Preferred Time</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-amber-500"
                >
                  <option value="10:00 AM">10:00 AM (Morning)</option>
                  <option value="12:00 PM">12:00 PM (Noon)</option>
                  <option value="03:00 PM">03:00 PM (Afternoon)</option>
                  <option value="06:00 PM">06:00 PM (Evening)</option>
                  <option value="08:00 PM">08:00 PM (Post-work)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Follow-Up Notes</label>
                <textarea
                  rows={2}
                  value={followupNote}
                  onChange={(e) => setFollowupNote(e.target.value)}
                  placeholder="Notes from customer conversation..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleMarkRejected(selectedLead)}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
              >
                Mark as Not Interested
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReschedule}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm cursor-pointer"
                >
                  Save Reschedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
