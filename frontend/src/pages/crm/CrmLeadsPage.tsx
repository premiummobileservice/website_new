import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { crmApi } from '../../api/crmApi';
import { Lead, User } from '../../types';
import toast from 'react-hot-toast';
import {
  KanbanSquare,
  List,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  UserCheck,
  ArrowRight,
  Loader2,
  ExternalLink,
  MessageCircle,
  PhoneCall,
  XCircle,
  PhoneOff,
  Wrench,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Calendar,
  Filter,
  Trash2,
} from 'lucide-react';

const STATUS_FILTERS = [
  { id: 'all', label: 'All Enquiries' },
  { id: 'new', label: '1. New Enquiries', badge: 'bg-purple-100 text-purple-700' },
  { id: 'interested', label: '2. Interested (Booking)', badge: 'bg-emerald-100 text-emerald-700' },
  { id: 'callback_later', label: '3. Call Back Later', badge: 'bg-amber-100 text-amber-700' },
  { id: 'not_interested', label: '4. Not Interested', badge: 'bg-rose-100 text-rose-700' },
  { id: 'wrong_number', label: '5. Wrong Number', badge: 'bg-slate-100 text-slate-700' },
  { id: 'completed', label: 'Completed', badge: 'bg-teal-100 text-teal-700' },
];

const REJECTION_REASONS = [
  'Price too high / Budget constraint',
  'Customer changed mind',
  'Going to local repair shop',
  'Already repaired elsewhere',
  'Service turnaround delay',
  'Device beyond repair / replacing phone',
  'Other',
];

export const CrmLeadsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('new');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Modals
  const [actionLead, setActionLead] = useState<Lead | null>(null);
  const [activeActionTab, setActiveActionTab] = useState<'interested' | 'callback' | 'rejected' | 'wrong_number'>('interested');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmLead, setDeleteConfirmLead] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Action form state
  const [selectedTech, setSelectedTech] = useState<number | ''>('');
  const [partName, setPartName] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [vendorCost, setVendorCost] = useState<number>(0);
  const [productPrice, setProductPrice] = useState<number>(0);
  const [serviceCharges, setServiceCharges] = useState<number>(0);
  const [actionNotes, setActionNotes] = useState('');

  // Callback form state
  const [callbackDate, setCallbackDate] = useState('');
  const [callbackTime, setCallbackTime] = useState('11:00 AM');
  const [callbackNotes, setCallbackNotes] = useState('');

  // Rejection form state
  const [rejectionReason, setRejectionReason] = useState(REJECTION_REASONS[0]);
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Create Lead form state
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadBrandModel, setNewLeadBrandModel] = useState('');
  const [newLeadRepairNeeded, setNewLeadRepairNeeded] = useState('Screen Replacement');
  const [newLeadArea, setNewLeadArea] = useState('Koramangala');
  const [newLeadSource, setNewLeadSource] = useState('walk_in');
  const [newLeadNotes, setNewLeadNotes] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const [leadsRes, usersRes] = await Promise.allSettled([
        crmApi.getLeads({ search: searchQuery || undefined }),
        crmApi.getUsers(),
      ]);

      if (leadsRes.status === 'fulfilled') {
        setLeads(leadsRes.value.results);
      }
      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value);
      }
    } catch {
      toast.error('Failed to load leads pipeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [searchQuery]);

  useEffect(() => {
    const leadId = searchParams.get('leadId');
    if (leadId && leads.length > 0) {
      const found = leads.find((l) => l.id.toString() === leadId);
      if (found) {
        openActionModal(found, 'interested');
      }
    }
  }, [searchParams, leads]);

  // Derived financial calculation
  const totalCustomerCharge = Number(productPrice || 0) + Number(serviceCharges || 0);
  const internalProfit = totalCustomerCharge - Number(vendorCost || 0);

  const openActionModal = (lead: Lead, tab: 'interested' | 'callback' | 'rejected' | 'wrong_number' = 'interested') => {
    setActionLead(lead);
    setActiveActionTab(tab);
    setSelectedTech(lead.assigned_to || '');
    setPartName(lead.part_name || `${lead.repair_needed} Part`);
    setVendorName(lead.vendor_name || 'Standard Distributor');
    setVendorCost(lead.vendor_cost || 0);
    setProductPrice(lead.product_price || 0);
    setServiceCharges(lead.service_charges || 0);
    setActionNotes('');

    const todayStr = new Date().toISOString().split('T')[0];
    setCallbackDate(lead.callback_date || todayStr);
    setCallbackTime(lead.callback_time || '11:00 AM');
    setCallbackNotes(lead.callback_notes || '');

    setRejectionReason(lead.rejection_reason || REJECTION_REASONS[0]);
    setRejectionNotes(lead.rejection_notes || '');
  };

  const handleActionSubmit = async () => {
    if (!actionLead) return;
    setIsSubmittingAction(true);
    try {
      if (activeActionTab === 'interested') {
        await crmApi.performLeadAction(actionLead.id, {
          action: 'interested',
          technician: selectedTech ? Number(selectedTech) : undefined,
          part_name: partName,
          vendor_name: vendorName,
          vendor_cost: Number(vendorCost),
          product_price: Number(productPrice),
          service_charges: Number(serviceCharges),
          total_customer_charge: totalCustomerCharge,
          internal_profit: internalProfit,
          notes: actionNotes,
        });
        toast.success(`Enquiry marked as Interested & converted to Repair Booking!`);
      } else if (activeActionTab === 'callback') {
        if (!callbackDate) {
          toast.error('Please pick a callback date');
          setIsSubmittingAction(false);
          return;
        }
        await crmApi.performLeadAction(actionLead.id, {
          action: 'callback_later',
          callback_date: callbackDate,
          callback_time: callbackTime,
          callback_notes: callbackNotes,
        });
        toast.success(`Callback scheduled for ${callbackDate} at ${callbackTime}`);
      } else if (activeActionTab === 'rejected') {
        await crmApi.performLeadAction(actionLead.id, {
          action: 'not_interested',
          rejection_reason: rejectionReason,
          rejection_notes: rejectionNotes,
        });
        toast.success(`Enquiry marked as Not Interested`);
      } else if (activeActionTab === 'wrong_number') {
        await crmApi.performLeadAction(actionLead.id, {
          action: 'wrong_number',
          notes: actionNotes || 'Customer number verified as incorrect/wrong',
        });
        toast.success(`Enquiry marked as Wrong Number`);
      }

      await fetchLeads();
      setActionLead(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Action update failed');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleArchiveDelete = async (permanent: boolean) => {
    if (!deleteConfirmLead) return;
    setIsDeleting(true);
    try {
      await crmApi.archiveLead(deleteConfirmLead.id, permanent);
      toast.success(permanent ? 'Lead permanently deleted' : 'Lead archived safely');
      setDeleteConfirmLead(null);
      await fetchLeads();
    } catch {
      toast.error('Failed to process archive/delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadPhone.trim()) {
      toast.error('Name and phone are required');
      return;
    }
    const cleanPhone = newLeadPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      await crmApi.createLead({
        name: newLeadName,
        phone: cleanPhone,
        email: newLeadEmail || undefined,
        device_type: 'smartphone',
        brand_model: newLeadBrandModel || 'Smartphone',
        repair_needed: newLeadRepairNeeded,
        area: newLeadArea,
        source: newLeadSource,
        issue_description: newLeadNotes,
      });
      toast.success('New enquiry created successfully!');
      setIsCreateModalOpen(false);
      setNewLeadName('');
      setNewLeadPhone('');
      setNewLeadEmail('');
      setNewLeadBrandModel('');
      setNewLeadNotes('');
      await fetchLeads();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create enquiry');
    }
  };

  const filteredLeads = leads.filter((lead) => {
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
    if (sourceFilter !== 'all' && lead.source !== sourceFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        lead.name?.toLowerCase().includes(q) ||
        lead.phone?.includes(q) ||
        lead.reference?.toLowerCase().includes(q) ||
        lead.area?.toLowerCase().includes(q) ||
        lead.brand_model?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">1. New Enquiry</span>;
      case 'interested':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">2. Interested (Booking)</span>;
      case 'callback_later':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">3. Call Back Later</span>;
      case 'not_interested':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">4. Not Interested</span>;
      case 'wrong_number':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">5. Wrong Number</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">Completed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Page Header & Quick Stats ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Enquiries & Order Pipeline</span>
            <span className="text-xs px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-full">
              {leads.length} Total
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            4-Action Review: Convert to Booking with live profit margin, schedule callbacks, or record customer feedback.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Enquiry</span>
          </button>

          <div className="bg-white border border-slate-200 rounded-xl p-1 flex shadow-sm">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KanbanSquare className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Status Pills Filter Bar ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_FILTERS.map((tab) => {
          const count = tab.id === 'all' ? leads.length : leads.filter((l) => l.status === tab.id).length;
          const isSelected = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search & Source Filters ── */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, phone, PMR reference, model, or Bangalore area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
          />
        </div>

        <div className="sm:col-span-4 flex gap-2">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
          >
            <option value="all">All Traffic Sources</option>
            <option value="website">Website Form</option>
            <option value="walk_in">Walk-in Customer</option>
            <option value="phone">Phone Enquiry</option>
            <option value="whatsapp">WhatsApp Direct</option>
            <option value="google_ads">Google Ads</option>
            <option value="referral">Referral</option>
          </select>
        </div>
      </div>

      {/* ── Table View ── */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 font-bold">Ref / Date</th>
                  <th className="px-4 py-3.5 font-bold">Customer</th>
                  <th className="px-4 py-3.5 font-bold">Device & Problem</th>
                  <th className="px-4 py-3.5 font-bold">Pickup Area</th>
                  <th className="px-4 py-3.5 font-bold">Current Stage</th>
                  <th className="px-4 py-3.5 font-bold">Quick Contact</th>
                  <th className="px-4 py-3.5 font-bold text-right">4 Main Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => {
                  const cleanPhone = lead.phone.replace(/\D/g, '');
                  const waUrl = `https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(
                    lead.name
                  )}%2C%20greetings%20from%20Premium%20Mobile%20Repair%20Bangalore%20regarding%20your%20${encodeURIComponent(
                    lead.brand_model
                  )}%20(${encodeURIComponent(lead.repair_needed)})%20enquiry%20${lead.reference}.%20How%20can%20we%20assist%20you%20today%3F`;

                  return (
                    <tr key={lead.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-indigo-600 block">
                          {lead.reference || `PMR-${lead.id}`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(lead.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{lead.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{lead.phone}</div>
                        {lead.email && <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{lead.email}</div>}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800">{lead.brand_model}</div>
                        <div className="text-[11px] text-indigo-600 font-semibold">{lead.repair_needed}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 text-slate-700">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[120px]">{lead.area}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {getStatusBadge(lead.status)}
                        {lead.status === 'callback_later' && lead.callback_date && (
                          <div className="text-[10px] text-amber-700 font-medium mt-1 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{lead.callback_date} ({lead.callback_time || '11:00 AM'})</span>
                          </div>
                        )}
                        {lead.status === 'not_interested' && lead.rejection_reason && (
                          <div className="text-[10px] text-rose-600 truncate max-w-[130px] mt-1">
                            {lead.rejection_reason}
                          </div>
                        )}
                      </td>

                      {/* Quick Contact Buttons */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition-colors cursor-pointer"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`tel:${lead.phone}`}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 transition-colors cursor-pointer"
                            title="Direct Phone Call"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* 4 Main Action Buttons + Archive/Delete */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openActionModal(lead, 'interested')}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-300 transition-all cursor-pointer flex items-center gap-1"
                            title="Interested (Convert to Booking)"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Interested</span>
                          </button>

                          <button
                            onClick={() => openActionModal(lead, 'callback')}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white border border-amber-300 transition-all cursor-pointer flex items-center gap-1"
                            title="Call Back Later"
                          >
                            <Clock className="w-3 h-3" />
                            <span>Call Back</span>
                          </button>

                          <button
                            onClick={() => openActionModal(lead, 'rejected')}
                            className="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-300 transition-all cursor-pointer"
                            title="Not Interested"
                          >
                            <XCircle className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => openActionModal(lead, 'wrong_number')}
                            className="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-700 hover:text-white border border-slate-300 transition-all cursor-pointer"
                            title="Wrong Number"
                          >
                            <PhoneOff className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmLead(lead)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Archive or Delete Lead"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-xs">
                      No enquiries matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── Kanban View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-6">
          {STATUS_FILTERS.filter((s) => s.id !== 'all').map((col) => {
            const colLeads = filteredLeads.filter((l) => l.status === col.id);
            return (
              <div key={col.id} className="bg-slate-100/70 border border-slate-200 rounded-2xl p-3 flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">{col.label}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-mono">
                    {colLeads.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {colLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-indigo-600">
                          {lead.reference || `PMR-${lead.id}`}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="font-bold text-slate-900 text-xs">{lead.name}</div>
                      <div className="text-[11px] text-slate-600 mb-2 truncate">
                        {lead.brand_model} • {lead.repair_needed}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-500 truncate max-w-[100px]">{lead.area}</span>
                        <button
                          onClick={() => openActionModal(lead)}
                          className="text-indigo-600 font-bold hover:underline text-[10px]"
                        >
                          Review →
                        </button>
                      </div>
                    </div>
                  ))}

                  {colLeads.length === 0 && (
                    <div className="text-center py-12 text-[11px] text-slate-400">Empty stage</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 4-Action Review Modal (Matching fixurdevice) ── */}
      {actionLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600 block">
                  {actionLead.reference || `PMR-${actionLead.id}`}
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {actionLead.name} – {actionLead.brand_model}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phone: <a href={`tel:${actionLead.phone}`} className="font-mono text-indigo-600 underline font-bold">{actionLead.phone}</a> | Area: {actionLead.area}
                </p>
              </div>
              <button
                onClick={() => setActionLead(null)}
                className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 4 Action Navigation Tabs */}
            <div className="p-3 bg-slate-100/60 border-b border-slate-200 grid grid-cols-4 gap-2">
              <button
                onClick={() => setActiveActionTab('interested')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeActionTab === 'interested'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>1. Interested</span>
              </button>

              <button
                onClick={() => setActiveActionTab('callback')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeActionTab === 'callback'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>2. Call Back</span>
              </button>

              <button
                onClick={() => setActiveActionTab('rejected')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeActionTab === 'rejected'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>3. Not Interested</span>
              </button>

              <button
                onClick={() => setActiveActionTab('wrong_number')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeActionTab === 'wrong_number'
                    ? 'bg-slate-800 text-white shadow-md shadow-slate-800/30'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>4. Wrong No.</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* TAB 1: INTERESTED (CONVERT TO REPAIR ORDER WITH LIVE PROFIT) */}
              {activeActionTab === 'interested' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Convert to Repair Booking & Calculate Profit Margin
                    </h4>
                    <p className="text-[11px] text-emerald-700 mt-1">
                      Customer is interested! This will convert the lead into an active Workshop Booking, assign an admin, and track your parts cost vs customer billing.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Assign Admin / Workshop Lead</label>
                      <select
                        value={selectedTech}
                        onChange={(e) => setSelectedTech(e.target.value ? Number(e.target.value) : '')}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                      >
                        <option value="">-- Choose Admin --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.first_name || u.username} (Admin)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Part / Product Name</label>
                      <input
                        type="text"
                        value={partName}
                        onChange={(e) => setPartName(e.target.value)}
                        placeholder="e.g. OLED Display Assembly / Battery Pack"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Parts Distributor / Vendor Name</label>
                      <input
                        type="text"
                        value={vendorName}
                        onChange={(e) => setVendorName(e.target.value)}
                        placeholder="e.g. SP Road Spares, Bangalore"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Vendor Cost Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={vendorCost}
                        onChange={(e) => setVendorCost(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Product Price to Customer (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={productPrice}
                        onChange={(e) => setProductPrice(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Service & Labor Charges (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={serviceCharges}
                        onChange={(e) => setServiceCharges(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Financial Live Calculation Box */}
                  <div className="p-4 rounded-2xl bg-slate-900 text-white grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Customer Charge</span>
                      <span className="text-xl font-extrabold text-white font-mono">
                        ₹{totalCustomerCharge.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 block uppercase font-bold">Estimated Internal Profit</span>
                      <span className="text-xl font-extrabold text-emerald-400 font-mono">
                        ₹{internalProfit.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Internal Work Notes</label>
                    <textarea
                      rows={2}
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="Special customer requests, backup verification, intake remarks..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: CALL BACK LATER */}
              {activeActionTab === 'callback' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <h4 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Schedule Follow-Up Callback
                    </h4>
                    <p className="text-[11px] text-amber-700 mt-1">
                      Customer requested to call back at a convenient time. This lead will appear in the "Call Back Later" desk.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Callback Date</label>
                      <input
                        type="date"
                        value={callbackDate}
                        onChange={(e) => setCallbackDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Preferred Time Slot</label>
                      <select
                        value={callbackTime}
                        onChange={(e) => setCallbackTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-medium"
                      >
                        <option value="10:00 AM">10:00 AM (Morning)</option>
                        <option value="12:00 PM">12:00 PM (Noon)</option>
                        <option value="03:00 PM">03:00 PM (Afternoon)</option>
                        <option value="06:00 PM">06:00 PM (Evening)</option>
                        <option value="08:00 PM">08:00 PM (Post-work)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Callback Notes</label>
                    <textarea
                      rows={3}
                      value={callbackNotes}
                      onChange={(e) => setCallbackNotes(e.target.value)}
                      placeholder="e.g. In a meeting until 3 PM, check if pickup possible tomorrow morning..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: NOT INTERESTED */}
              {activeActionTab === 'rejected' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                    <h4 className="font-bold text-rose-900 text-sm flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      Record Customer Declination
                    </h4>
                    <p className="text-[11px] text-rose-700 mt-1">
                      Customer decided not to proceed. Select the primary reason for operational analytics and service optimization.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Reason for Rejection</label>
                    <select
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500 font-medium"
                    >
                      {REJECTION_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Feedback / Customer Remarks</label>
                    <textarea
                      rows={3}
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      placeholder="e.g. Expected repair under ₹1,500; decided to buy a new phone..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: WRONG NUMBER */}
              {activeActionTab === 'wrong_number' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <PhoneOff className="w-4 h-4 text-slate-600" />
                      Flag Wrong or Invalid Contact Number
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Number dialed did not match enquiry or caller stated wrong number. Moved to Not Interested / Rejected desk.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Verification Remarks</label>
                    <textarea
                      rows={3}
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="e.g. Person answered and stated they never submitted mobile repair request."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-slate-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                onClick={() => setActionLead(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleActionSubmit}
                disabled={isSubmittingAction}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
              >
                {isSubmittingAction ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Action</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add New Enquiry Modal ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Add Walk-in or Phone Enquiry</h3>
                <p className="text-xs text-slate-500 mt-0.5">Quickly log an in-person customer or telephonic enquiry</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  placeholder="e.g. Ramesh Babu"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number (10 Digits) *</label>
                  <input
                    type="tel"
                    required
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    placeholder="9880012345"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Email</label>
                  <input
                    type="email"
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    placeholder="optional@gmail.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Device Model</label>
                  <input
                    type="text"
                    required
                    value={newLeadBrandModel}
                    onChange={(e) => setNewLeadBrandModel(e.target.value)}
                    placeholder="e.g. iPhone 14 Pro / OnePlus 11"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Service / Problem</label>
                  <select
                    value={newLeadRepairNeeded}
                    onChange={(e) => setNewLeadRepairNeeded(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="Screen Replacement">Screen Replacement</option>
                    <option value="Battery Replacement">Battery Replacement</option>
                    <option value="Water Damage Repair">Water Damage Repair</option>
                    <option value="Charging Port Repair">Charging Port Repair</option>
                    <option value="Camera Repair">Camera & Lens Repair</option>
                    <option value="Speaker & Mic Repair">Speaker & Mic Repair</option>
                    <option value="Motherboard Repair">Motherboard / Face ID</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bangalore Area / Address</label>
                  <input
                    type="text"
                    value={newLeadArea}
                    onChange={(e) => setNewLeadArea(e.target.value)}
                    placeholder="e.g. Koramangala 4th Block"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Traffic Source</label>
                  <select
                    value={newLeadSource}
                    onChange={(e) => setNewLeadSource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="walk_in">Walk-in Customer</option>
                    <option value="phone">Phone Call</option>
                    <option value="whatsapp">WhatsApp Enquiry</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Issue Description / Customer Symptoms</label>
                <textarea
                  rows={2}
                  value={newLeadNotes}
                  onChange={(e) => setNewLeadNotes(e.target.value)}
                  placeholder="e.g. Dropped on road, touch not working on bottom half..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
                >
                  Create Enquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete / Archive Confirmation Modal ── */}
      {deleteConfirmLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="p-5 border-b border-rose-100 bg-rose-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="font-extrabold text-base text-slate-900">Archive / Remove Enquiry</h3>
              </div>
              <button
                onClick={() => setDeleteConfirmLead(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-600">
              <p>
                Are you sure you want to remove enquiry{' '}
                <span className="font-mono font-bold text-slate-900">
                  {deleteConfirmLead.reference || `PMR-${deleteConfirmLead.id}`}
                </span>{' '}
                for <span className="font-bold text-slate-900">{deleteConfirmLead.name}</span> ({deleteConfirmLead.phone})?
              </p>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
                <span className="font-bold text-slate-700 block">Options:</span>
                <div>• <strong className="text-slate-800">Archive safely</strong>: Hides lead from active queues while preserving customer history.</div>
                <div>• <strong className="text-rose-600">Permanent delete</strong>: Removes the record completely from the database.</div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 gap-2">
              <button
                onClick={() => setDeleteConfirmLead(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleArchiveDelete(false)}
                  disabled={isDeleting}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 transition-colors cursor-pointer"
                >
                  {isDeleting ? 'Archiving...' : 'Archive Safely'}
                </button>
                <button
                  onClick={() => handleArchiveDelete(true)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-colors cursor-pointer"
                >
                  {isDeleting ? 'Deleting...' : 'Permanent Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
