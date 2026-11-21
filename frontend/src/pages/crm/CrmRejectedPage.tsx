import React, { useState, useEffect } from 'react';
import {
  XCircle,
  Search,
  Calendar,
  RefreshCw,
  RotateCcw,
  User,
  Smartphone,
  AlertCircle,
  Filter,
  Phone,
  MessageCircle,
  PhoneOff,
} from 'lucide-react';
import { crmApi } from '../../api/crmApi';
import { Lead } from '../../types';
import toast from 'react-hot-toast';

export const CrmRejectedPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState('all');

  const fetchRejected = async () => {
    setLoading(true);
    try {
      const res = await crmApi.getLeads();
      const allLeads = res.results || [];
      const inactive = allLeads.filter(
        (l) => l.status === 'not_interested' || l.status === 'declined' || l.status === 'wrong_number'
      );
      setLeads(inactive);
    } catch {
      toast.error('Failed to load rejected leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRejected();
  }, []);

  const notInterestedCount = leads.filter((l) => l.status === 'not_interested' || l.status === 'declined').length;
  const wrongNumberCount = leads.filter((l) => l.status === 'wrong_number').length;

  const handleReopen = async (lead: Lead) => {
    try {
      await crmApi.performLeadAction(lead.id, {
        action: 'reopen',
      });
      toast.success(`Lead ${lead.reference || `PMR-${lead.id}`} reopened and moved to New Enquiries!`);
      await fetchRejected();
    } catch {
      toast.error('Failed to reopen lead');
    }
  };

  const filteredLeads = leads.filter((l) => {
    if (reasonFilter !== 'all') {
      if (reasonFilter === 'wrong_number' && l.status !== 'wrong_number') return false;
      if (reasonFilter !== 'wrong_number' && l.rejection_reason !== reasonFilter) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        (l.reference && l.reference.toLowerCase().includes(q)) ||
        (l.name && l.name.toLowerCase().includes(q)) ||
        (l.phone && l.phone.includes(q)) ||
        (l.brand_model && l.brand_model.toLowerCase().includes(q)) ||
        (l.area && l.area.toLowerCase().includes(q))
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
            <XCircle className="w-6 h-6 text-rose-500" />
            <span>Not Interested & Declined Pipeline</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit lost enquiries, analyze price sensitivity or turnaround objections, and restore active leads if customer re-contacts.
          </p>
        </div>

        <button
          onClick={fetchRejected}
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
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Declined / Lost</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{leads.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Inactive pipeline records</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Not Interested</div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">{notInterestedCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Price or mind changed</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Wrong Numbers</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-700 mt-1">{wrongNumberCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Invalid contact entry</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, phone, PMR reference, or device model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
          >
            <option value="all">All Rejection Reasons</option>
            <option value="wrong_number">Wrong Number Flagged</option>
            <option value="Price too high / Budget constraint">Price too high</option>
            <option value="Customer changed mind">Customer changed mind</option>
            <option value="Going to local repair shop">Going to local shop</option>
            <option value="Already repaired elsewhere">Already repaired elsewhere</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 font-bold">Ref / Date</th>
                <th className="px-4 py-3.5 font-bold">Customer</th>
                <th className="px-4 py-3.5 font-bold">Device & Problem</th>
                <th className="px-4 py-3.5 font-bold">Declined Reason</th>
                <th className="px-4 py-3.5 font-bold">Feedback Remarks</th>
                <th className="px-4 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => {
                const isWrongNumber = lead.status === 'wrong_number';
                return (
                  <tr key={lead.id} className="hover:bg-rose-50/20 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-slate-700 block">
                        {lead.reference || `PMR-${lead.id}`}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{lead.name}</div>
                      <div className="font-mono text-slate-500 text-[11px]">{lead.phone}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800">{lead.brand_model}</div>
                      <div className="text-[11px] text-slate-500">{lead.repair_needed}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      {isWrongNumber ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 w-fit">
                          <PhoneOff className="w-3 h-3 text-slate-500" />
                          Wrong Number
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 block w-fit">
                          {lead.rejection_reason || lead.declined_reason || 'Not Interested'}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 max-w-[220px]">
                      <div className="text-slate-600 line-clamp-2">
                        {lead.rejection_notes || lead.issue_description || 'No additional notes logged.'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleReopen(lead)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white border border-indigo-200 transition-colors cursor-pointer"
                        title="Reopen Enquiry"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reopen</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-xs">
                    No declined leads found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
