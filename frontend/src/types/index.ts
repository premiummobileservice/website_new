export type Role = 'admin' | string;

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  role: Role;
  phone?: string;
  is_active?: boolean;
  date_joined?: string;
}

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'callback_later'
  | 'not_interested'
  | 'wrong_number'
  | 'pickup_scheduled'
  | 'device_collected'
  | 'quote_sent'
  | 'approved'
  | 'in_repair'
  | 'quality_check'
  | 'delivered'
  | 'completed'
  | 'declined'
  | 'lost'
  | 'cancelled';

export type DeviceType = 'smartphone' | 'tablet' | 'laptop' | 'other';

export interface Lead {
  id: number;
  reference: string;
  lead_number?: string;
  name: string;
  full_name?: string;
  phone: string;
  email?: string;
  device_type: DeviceType;
  brand_model: string;
  device_brand?: string;
  device_model?: string;
  device_description?: string;
  repair_needed: string;
  problem_description?: string;
  area: string;
  issue_description?: string;
  status: LeadStatus;
  source: string;
  preferred_time?: string;
  internal_notes?: string;
  assigned_to?: number | null;
  assigned_to_name?: string;
  callback_date?: string;
  callback_time?: string;
  callback_notes?: string;
  rejection_reason?: string;
  rejection_notes?: string;
  part_name?: string;
  vendor_name?: string;
  vendor_cost?: number;
  product_price?: number;
  service_charges?: number;
  total_customer_charge?: number;
  internal_profit?: number;
  has_job?: boolean;
  is_archived?: boolean;
  created_at: string;
  updated_at: string;
  lost_reason?: string;
  declined_reason?: string;
  job_id?: number | string | null;
}

export interface Activity {
  id: number;
  lead: number;
  activity_type: string;
  text: string;
  created_at: string;
  created_by_name?: string;
}

export type JobStatus =
  | 'pending'
  | 'scheduled'
  | 'pending_pickup'
  | 'scheduled_pickup'
  | 'received_at_hub'
  | 'under_diagnosis'
  | 'quote_pending_approval'
  | 'quote_approved'
  | 'approved_in_progress'
  | 'in_progress'
  | 'waiting_for_parts'
  | 'qc_testing'
  | 'repaired'
  | 'ready_for_delivery'
  | 'out_for_delivery'
  | 'delivered'
  | 'delivered_collected'
  | 'completed'
  | 'rework'
  | 'returned_unrepaired'
  | 'cancelled';

export interface QuotationItem {
  id?: number;
  description: string;
  part_cost: number;
  labour_cost: number;
  total: number;
}

export interface RepairJob {
  id: number;
  job_number: string;
  job_id?: string;
  lead: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address?: string;
  device_type: string;
  brand_model: string;
  device_brand?: string;
  device_model?: string;
  device_description?: string;
  repair_needed: string;
  status: JobStatus;
  technician?: number | null;
  technician_name?: string;
  diagnostic_notes?: string;
  diagnosis_notes?: string;
  work_notes?: string;
  confirmed_issue?: string;
  work_performed?: string;
  parts_used_notes?: string;
  rework_reason?: string;
  part_name?: string;
  vendor_name?: string;
  vendor_cost?: number;
  product_price?: number;
  service_charges?: number;
  total_customer_charge?: number;
  internal_profit?: number;
  quotation_amount?: number;
  estimated_quote?: number;
  final_amount?: number;
  final_quote?: number;
  amount_paid?: number;
  payment_status?: 'paid' | 'pending' | 'partial' | 'unpaid' | 'refunded';
  payment_method?: string;
  invoice_number?: string;
  invoice_date?: string;
  is_quote_approved?: boolean;
  lead_details?: {
    lead_number?: string;
    full_name?: string;
    phone?: string;
    email?: string;
    device_brand?: string;
    device_model?: string;
    problem_description?: string;
    address?: string;
    area?: string;
  };
  quotation_items?: QuotationItem[];
  created_at: string;
  updated_at: string;
  pickup_address?: string;
  completed_at?: string;
}

export type Job = RepairJob;

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  total_jobs: number;
  created_at: string;
  leads_count?: number;
}

export interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  icon: string;
  image: string;
  commonIssues: string[];
  supportedDevices: string[];
  processSummary: string;
}

export interface AreaItem {
  slug: string;
  name: string;
  pincode?: string;
  hubZone: string;
  popularSpots: string[];
  deliveryTurnaround: string;
}

export interface DashboardStats {
  total_leads_today: number;
  pending_pickups: number;
  in_repair_count: number;
  delivered_today: number;
  conversion_rate: number;
  leads_by_status: Record<string, number>;
  recent_leads: Lead[];
}
