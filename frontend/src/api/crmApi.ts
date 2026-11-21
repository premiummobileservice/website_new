import { apiClient } from './client';
import { Lead, RepairJob, Customer, User, DashboardStats, LeadStatus, JobStatus } from '../types';

export const crmApi = {
  // Auth
  login: async (credentials: { username: string; password: string }) => {
    const res = await apiClient.post('/auth/login/', credentials);
    return res.data; // { access, refresh, user }
  },
  getMe: async (): Promise<User> => {
    const res = await apiClient.get('/auth/me/');
    return res.data;
  },
  logout: async () => {
    try {
      const refresh = localStorage.getItem('pmr_refresh_token');
      if (refresh) {
        await apiClient.post('/auth/logout/', { refresh });
      }
    } finally {
      localStorage.removeItem('pmr_access_token');
      localStorage.removeItem('pmr_refresh_token');
    }
  },

  // Leads
  getLeads: async (params?: { status?: string; search?: string; page?: number }): Promise<{ results: Lead[]; count: number }> => {
    const res = await apiClient.get('/leads/', { params });
    if (Array.isArray(res.data)) {
      return { results: res.data, count: res.data.length };
    }
    return res.data;
  },
  getLead: async (id: number): Promise<Lead> => {
    const res = await apiClient.get(`/leads/${id}/`);
    return res.data;
  },
  createLead: async (leadData: Partial<Lead>): Promise<Lead> => {
    const res = await apiClient.post('/leads/', leadData);
    return res.data;
  },
  performLeadAction: async (id: number, actionPayload: {
    action: 'interested' | 'callback_later' | 'not_interested' | 'wrong_number' | 'reopen' | string;
    technician?: number;
    part_name?: string;
    vendor_name?: string;
    vendor_cost?: number;
    product_price?: number;
    service_charges?: number;
    total_customer_charge?: number;
    internal_profit?: number;
    callback_date?: string;
    callback_time?: string;
    callback_notes?: string;
    rejection_reason?: string;
    rejection_notes?: string;
    notes?: string;
  }): Promise<Lead> => {
    const res = await apiClient.post(`/leads/${id}/action/`, actionPayload);
    return res.data;
  },
  getLeadStats: async (): Promise<any> => {
    const res = await apiClient.get('/leads/stats/');
    return res.data;
  },
  updateLeadStatus: async (id: number, status: LeadStatus, reason?: string) => {
    const res = await apiClient.patch(`/leads/${id}/`, { status, lost_reason: reason, declined_reason: reason });
    return res.data;
  },
  assignLead: async (id: number, userId: number | null) => {
    const res = await apiClient.patch(`/leads/${id}/`, { assigned_to: userId });
    return res.data;
  },
  createLeadNote: async (leadId: number, text: string) => {
    const res = await apiClient.post(`/leads/${leadId}/notes/`, { text });
    return res.data;
  },
  getLeadActivities: async (leadId: number) => {
    const res = await apiClient.get(`/leads/${leadId}/activities/`);
    return res.data;
  },
  convertToJob: async (leadId: number) => {
    const res = await apiClient.post(`/leads/${leadId}/convert-to-job/`);
    return res.data;
  },
  archiveLead: async (id: number, permanent = false) => {
    const res = await apiClient.post(`/leads/${id}/archive/`, { permanent });
    return res.data;
  },
  sendTestEmail: async (email?: string) => {
    const res = await apiClient.post('/notifications/test-email/', { email });
    return res.data;
  },
  sendInvoiceEmail: async (payload: {
    email: string;
    customer_name?: string;
    invoice_number?: string;
    device?: string;
    amount?: number | string;
    payment_status?: string;
    warranty?: string;
  }) => {
    const res = await apiClient.post('/notifications/send-invoice-email/', payload);
    return res.data;
  },

  // Jobs
  getJobs: async (params?: { status?: string; search?: string; technician?: string; stage?: string }): Promise<{ results: RepairJob[]; count: number }> => {
    const res = await apiClient.get('/jobs/', { params });
    if (Array.isArray(res.data)) {
      return { results: res.data, count: res.data.length };
    }
    return res.data;
  },
  getJob: async (id: number): Promise<RepairJob> => {
    const res = await apiClient.get(`/jobs/${id}/`);
    return res.data;
  },
  updateJob: async (id: number, payload: Partial<RepairJob>) => {
    const res = await apiClient.patch(`/jobs/${id}/`, payload);
    return res.data;
  },
  updateJobStatus: async (id: number, status: JobStatus) => {
    const res = await apiClient.patch(`/jobs/${id}/`, { status });
    return res.data;
  },
  completeJob: async (id: number, payload: {
    work_performed?: string;
    technician?: number | '';
    payment_done?: boolean;
    delivered?: boolean;
    generate_invoice?: boolean;
  }): Promise<RepairJob> => {
    const res = await apiClient.post(`/jobs/${id}/complete/`, payload);
    return res.data;
  },
  createInvoice: async (id: number, payload?: {
    status?: string;
    warranty?: string;
    tax_rate?: number;
  }): Promise<RepairJob> => {
    const res = await apiClient.post(`/jobs/${id}/create-invoice/`, payload || {});
    return res.data;
  },
  getInvoices: async (): Promise<{ results: RepairJob[]; count: number }> => {
    const res = await apiClient.get('/jobs/invoices/');
    if (Array.isArray(res.data)) {
      return { results: res.data, count: res.data.length };
    }
    return res.data;
  },

  // Customers
  getCustomers: async (params?: { search?: string }): Promise<{ results: Customer[]; count: number }> => {
    const res = await apiClient.get('/customers/', { params });
    if (Array.isArray(res.data)) {
      return { results: res.data, count: res.data.length };
    }
    return res.data;
  },

  // Dashboard Stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get('/core/dashboard/stats/');
    return res.data;
  },

  // Users (for assignment and admin settings)
  getUsers: async (): Promise<User[]> => {
    const res = await apiClient.get('/auth/users/');
    if (Array.isArray(res.data)) return res.data;
    return res.data.results || [];
  },
  createUser: async (payload: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    phone?: string;
    password: string;
    password_confirm: string;
  }): Promise<User> => {
    const res = await apiClient.post('/auth/users/', payload);
    return res.data;
  },
  toggleUserActive: async (userId: number): Promise<User> => {
    const res = await apiClient.post(`/auth/users/${userId}/toggle-active/`);
    return res.data;
  },
  deleteUser: async (userId: number): Promise<{ detail: string }> => {
    const res = await apiClient.delete(`/auth/users/${userId}/`);
    return res.data;
  },
};
