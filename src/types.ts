
export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // minutes
  description?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  lastVisit: string;
  totalSpent: number;
  notes: string;
  points: number; // Loyalty points balance
}

export interface LoyaltyReward {
  id: string;
  name: string;
  pointsRequired: number;
  type: 'service' | 'product';
}

export interface Appointment {
  id: string;
  clientName: string;
  serviceId: string;
  date: string; // ISO format
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  platform?: 'manual' | 'whatsapp' | 'web';
}

export interface WaitingListEntry {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  preferredPeriod: 'morning' | 'afternoon' | 'night' | 'any';
  createdAt: string;
}

export interface Availability {
  id: string; // Adicionado para persistência
  dayOfWeek: number; // 0-6
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  lunchStart?: string; // "HH:mm"
  lunchEnd?: string;   // "HH:mm"
  isActive: boolean;
}

export interface ScheduleException {
  id: string;
  date: string; // "YYYY-MM-DD"
  type: 'extended' | 'blocked';
  startTime?: string;
  endTime?: string;
  reason: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  status: 'paid' | 'pending';
  paymentMethod?: 'cash' | 'card' | 'pix';
}

export interface Promotion {
  id: string;
  name: string;
  discount: number;
  serviceId: string;
  targetDay?: number;
  targetAudience: 'all' | 'vip' | 'inactive';
  status: 'active' | 'scheduled' | 'finished';
  reach: number;
}

export interface Product {
  id: string;
  name: string;
  category: 'consumo' | 'venda' | 'bar';
  stock: number;
  minStock: number;
  costPrice: number;
  salePrice?: number;
  expiryDate?: string;
  lastRestock?: string;
}

export type ViewState = 'dashboard' | 'calendar' | 'services' | 'customers' | 'finance' | 'reports' | 'promotions' | 'inventory' | 'settings';
