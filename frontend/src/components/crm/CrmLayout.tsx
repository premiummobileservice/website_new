import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Wrench,
  PhoneCall,
  XCircle,
  FileText,
  BarChart3,
  UserCheck,
  Settings,
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Plus,
  Crown,
  ShieldCheck,
  Headphones,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const CrmLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/crm/login');
  };

  const getBreadcrumbTitle = () => {
    const p = location.pathname;
    if (p.includes('/crm/leads')) return 'Enquiries Pipeline';
    if (p.includes('/crm/repairs') || p.includes('/crm/jobs')) return 'Bookings & Workshop';
    if (p.includes('/crm/callbacks')) return 'Call Back Later Desk';
    if (p.includes('/crm/rejected')) return 'Not Interested / Declined';
    if (p.includes('/crm/invoices')) return 'Invoices & Billing';
    if (p.includes('/crm/customers')) return 'Customers Directory';
    if (p.includes('/crm/reports')) return 'Reports & Analytics';
    if (p.includes('/crm/users')) return 'Staff Users';
    if (p.includes('/crm/technicians')) return 'Technicians';
    if (p.includes('/crm/settings')) return 'Settings';
    return 'Dashboard';
  };

  const isActive = (path: string) => {
    if (path === '/crm/dashboard') {
      return location.pathname === '/crm/dashboard' || location.pathname === '/crm';
    }
    if (path === '/crm/repairs') {
      return location.pathname.includes('/crm/repairs') || location.pathname.includes('/crm/jobs');
    }
    return location.pathname.startsWith(path);
  };

  const getRoleBadge = () => {
    return {
      label: 'System Admin',
      bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      icon: <Crown className="w-3 h-3 text-indigo-400" />,
    };
  };

  const roleMeta = getRoleBadge();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col md:flex-row font-sans selection:bg-indigo-500/20">
      {/* ── Left Sidebar (Midnight Slate #0a0f1d) ── */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0a0f1d] border-r border-slate-800/80 shrink-0 text-slate-300 select-none">
        {/* Brand / Logo Header */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 p-0.5 shadow-md shadow-indigo-600/20 shrink-0">
              <div className="w-full h-full bg-[#0a0f1d] rounded-[10px] flex items-center justify-center p-1.5 overflow-hidden">
                <img
                  src="/tab.png"
                  alt="Premium Mobile Repair"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="overflow-hidden">
              <span className="font-extrabold text-sm tracking-tight text-white block truncate leading-tight">
                Premium Mobile Repair
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">
                  Admin Panel
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto text-xs">
          {/* OVERVIEW */}
          <div>
            <div className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-2">
              Overview
            </div>
            <Link
              to="/crm/dashboard"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                isActive('/crm/dashboard')
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Operations Dashboard</span>
            </Link>
          </div>

          {/* ORDER & PIPELINE */}
          <div>
            <div className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-2 flex items-center justify-between">
              <span>Pipeline Stages</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                4-ACTION
              </span>
            </div>
            <div className="space-y-1">
              <Link
                to="/crm/leads"
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                  isActive('/crm/leads')
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>1. Enquiries</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                  New
                </span>
              </Link>

              <Link
                to="/crm/repairs"
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                  isActive('/crm/repairs')
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Wrench className="w-4 h-4 text-sky-400" />
                  <span>2. Bookings &amp; Workshop</span>
                </div>
              </Link>

              <Link
                to="/crm/callbacks"
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                  isActive('/crm/callbacks')
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <PhoneCall className="w-4 h-4 text-amber-400" />
                  <span>3. Call Back Later</span>
                </div>
              </Link>

              <Link
                to="/crm/rejected"
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                  isActive('/crm/rejected')
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>4. Not Interested / Lost</span>
                </div>
              </Link>

              <Link
                to="/crm/invoices"
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                  isActive('/crm/invoices')
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>5. Tax Invoices &amp; GST</span>
                </div>
              </Link>
            </div>
          </div>

          {/* CUSTOMERS & ANALYTICS */}
          <div>
            <div className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-2">
              Management
            </div>
            <div className="space-y-1">
              <Link
                to="/crm/customers"
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                  isActive('/crm/customers')
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span>Customers Directory</span>
              </Link>

              <Link
                to="/crm/reports"
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                  isActive('/crm/reports')
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <span>Financial &amp; Reports</span>
              </Link>
            </div>
          </div>

          {/* ADMIN & SYSTEM */}
          <div>
            <div className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-2">
              Administration
            </div>
            <div className="space-y-1">
              <Link
                to="/crm/users"
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                  isActive('/crm/users')
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <UserCheck className="w-4 h-4 text-slate-400" />
                <span>Admin Accounts</span>
              </Link>

              <Link
                to="/crm/settings"
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                  isActive('/crm/settings')
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Business Settings</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom User Card & Actions */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
          {/* User Profile Pill */}
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                {roleMeta.icon}
              </div>
              <div className="overflow-hidden">
                <span className="font-bold text-xs text-white block truncate">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username || 'Staff User'}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {user?.email || 'Logged in'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-center gap-2 w-full py-2 text-slate-400 hover:text-white text-xs font-medium rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Customer Website</span>
          </Link>
        </div>
      </aside>

      {/* ── Main Canvas (Light Grey #f8fafc) ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
        {/* Sticky Top Header with Glassmorphism */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
          {/* Breadcrumbs & Mobile Trigger */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 mr-1.5 cursor-pointer"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <span className="text-slate-400 font-medium">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg">
              {getBreadcrumbTitle()}
            </span>
          </div>

          {/* Right Header: Search, +New Lead Button, Live Notifications, User Pill */}
          <div className="flex items-center gap-3">
            {/* Global Search Bar */}
            <div className="relative hidden md:block w-64 lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search leads, repairs, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-full pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 border border-slate-200 rounded px-1.5 py-0.2 bg-white">
                ⌘K
              </span>
            </div>

            {/* Quick +New Lead Action */}
            <Link
              to="/crm/leads"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Enquiry</span>
            </Link>

            {/* Notification Bell */}
            <button
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="System Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            </button>

            {/* Role Chip */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${roleMeta.bg}`}
              >
                {roleMeta.icon}
                <span>{roleMeta.label}</span>
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileSidebarOpen && (
          <div className="md:hidden bg-[#0a0f1d] border-b border-slate-800 p-4 space-y-1.5 text-slate-300 text-xs">
            <Link
              to="/crm/dashboard"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-indigo-600 text-white font-bold"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/crm/leads"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>1. Enquiries Pipeline</span>
            </Link>
            <Link
              to="/crm/repairs"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800"
            >
              <Wrench className="w-4 h-4 text-sky-400" />
              <span>2. Bookings &amp; Workshop</span>
            </Link>
            <Link
              to="/crm/callbacks"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800"
            >
              <PhoneCall className="w-4 h-4 text-amber-400" />
              <span>3. Call Back Later</span>
            </Link>
            <Link
              to="/crm/rejected"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>4. Not Interested</span>
            </Link>
            <Link
              to="/crm/invoices"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>5. Tax Invoices &amp; GST</span>
            </Link>
            <Link
              to="/crm/reports"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800"
            >
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span>Financial Reports</span>
            </Link>
            <Link
              to="/crm/customers"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800"
            >
              <Users className="w-4 h-4 text-slate-400" />
              <span>Customers Directory</span>
            </Link>
            <Link
              to="/crm/users"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800"
            >
              <UserCheck className="w-4 h-4 text-slate-400" />
              <span>Admin Accounts</span>
            </Link>
            <Link
              to="/crm/settings"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Business Settings</span>
            </Link>
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
