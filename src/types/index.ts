// ─── Role & Status Enums ────────────────────────────────────────────────────

export type Role = 'fleet' | 'project';

export type TripStatus = 'DRAFT' | 'PENDING_JC' | 'COMPLETE';

export type JCStatus = 'PENDING' | 'ENTERED';

// ─── Core Entities ───────────────────────────────────────────────────────────

export interface User {
  userId: string;
  name: string;
  email: string;
  role: Role;
}

export interface Trip {
  tripId: string;
  date: string;           // ISO date string "YYYY-MM-DD"
  whRep: string;
  driver: string;
  route: string;
  laborCost: number;
  parkCost: number;
  truckCost: number;
  hotelCost: number;
  totalCost: number;
  status: TripStatus;
  createdBy: string;      // email of the fleet coordinator who created the trip
  createdAt: string;      // ISO datetime string
}

export interface Site {
  siteId: string;
  tripId: string;
  siteNumber: string;
  coordinatorEmail: string;
  jobCode: string;
  costShare: number;      // pre-calculated cost share for this site
  jcStatus: JCStatus;
}

export interface Notification {
  notifId: string;
  toEmail: string;
  tripId: string;
  message: string;
  isRead: boolean;
  createdAt: string;      // ISO datetime string
}

// ─── Derived / Computed ──────────────────────────────────────────────────────

export interface CostBreakdown {
  tripId: string;
  totalCost: number;
  totalSites: number;
  costPerSite: number;
  coordinatorBreakdowns: CoordinatorBreakdown[];
}

export interface CoordinatorBreakdown {
  coordinatorEmail: string;
  siteCount: number;
  totalCost: number;
  sites: Site[];
}

// ─── Form Payloads ───────────────────────────────────────────────────────────

export interface CreateTripPayload {
  date: string;
  whRep: string;
  driver: string;
  route: string;
  laborCost: number;
  parkCost: number;
  truckCost: number;
  hotelCost: number;
  sites: NewSiteEntry[];
  createdBy: string;
}

export interface NewSiteEntry {
  siteNumber: string;
  coordinatorEmail: string;
}

export interface UpdateTripPayload extends Partial<Omit<CreateTripPayload, 'createdBy'>> {
  tripId: string;
}

export interface UpdateJobCodePayload {
  siteId: string;
  jobCode: string;
}

// ─── API Response Shape ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
