import axios from 'axios';
import { 
  Service, Customer, Appointment, Transaction, Barber,
  Product, Promotion, WaitingListEntry, Availability, ScheduleException 
} from './types';

const API_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Opcional: logout automático ou refresh token
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: any) => api.post('/auth/login/', data),
  me: () => api.get('/auth/me/'),
};

export const barbersApi = {
  getAll: () => api.get<Barber[]>('/barbers/').then(r => r.data),
  create: (data: Partial<Barber>) => api.post<Barber>('/barbers/', data).then(r => r.data),
  update: (id: string, data: Partial<Barber>) => api.put<Barber>(`/barbers/${id}/`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/barbers/${id}/`),
};

export const servicesApi = {
  getAll: () => api.get<Service[]>('/services/').then(r => r.data),
  create: (data: Partial<Service>) => api.post<Service>('/services/', data).then(r => r.data),
  update: (id: string, data: Partial<Service>) => api.put<Service>(`/services/${id}/`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/services/${id}/`),
};

export const customersApi = {
  getAll: () => api.get<Customer[]>('/customers/').then(r => r.data),
  create: (data: Partial<Customer>) => api.post<Customer>('/customers/', data).then(r => r.data),
  update: (id: string, data: Partial<Customer>) => api.put<Customer>(`/customers/${id}/`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/customers/${id}/`),
  redeemPoints: (id: string, points: number) => api.post(`/customers/${id}/redeem_points/`, { points }).then(r => r.data),
};

export const appointmentsApi = {
  getAll: () => api.get<Appointment[]>('/appointments/').then(r => r.data),
  getToday: () => api.get<Appointment[]>('/appointments/today/').then(r => r.data),
  getAvailableSlots: (barberId: string, serviceId: string, date: string) => 
    api.get<string[]>('/appointments/available_slots/', { params: { barberId, serviceId, date } }).then(r => r.data),
  create: (data: Partial<Appointment>) => api.post<Appointment>('/appointments/', data).then(r => r.data),
  update: (id: string, data: Partial<Appointment>) => api.patch<Appointment>(`/appointments/${id}/`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/appointments/${id}/`),
};

export const transactionsApi = {
  getAll: () => api.get<Transaction[]>('/transactions/').then(r => r.data),
  getSummary: () => api.get('/transactions/summary/').then(r => r.data),
  create: (data: Partial<Transaction>) => api.post<Transaction>('/transactions/', data).then(r => r.data),
  update: (id: string, data: Partial<Transaction>) => api.patch<Transaction>(`/transactions/${id}/`, data).then(r => r.data),
};

export const productsApi = {
  getAll: () => api.get<Product[]>('/products/').then(r => r.data),
  getLowStock: () => api.get<Product[]>('/products/low_stock/').then(r => r.data),
  create: (data: Partial<Product>) => api.post<Product>('/products/', data).then(r => r.data),
  update: (id: string, data: Partial<Product>) => api.put<Product>(`/products/${id}/`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/products/${id}/`),
};

export const promotionsApi = {
  getAll: () => api.get<Promotion[]>('/promotions/').then(r => r.data),
  getActive: () => api.get<Promotion[]>('/promotions/active/').then(r => r.data),
  create: (data: Partial<Promotion>) => api.post<Promotion>('/promotions/', data).then(r => r.data),
};

export const waitingListApi = {
  getAll: () => api.get<WaitingListEntry[]>('/waiting-list/').then(r => r.data),
  create: (data: Partial<WaitingListEntry>) => api.post<WaitingListEntry>('/waiting-list/', data).then(r => r.data),
  delete: (id: string) => api.delete(`/waiting-list/${id}/`),
};

export const scheduleExceptionsApi = {
  getAll: () => api.get<ScheduleException[]>('/schedule-exceptions/').then(r => r.data),
  create: (data: Partial<ScheduleException>) => api.post<ScheduleException>('/schedule-exceptions/', data).then(r => r.data),
  delete: (id: string) => api.delete(`/schedule-exceptions/${id}/`),
};

export const availabilityApi = {
  getAll: () => api.get<Availability[]>('/availability/').then(r => r.data),
  update: (id: string, data: Partial<Availability>) => api.put<Availability>(`/availability/${id}/`, data).then(r => r.data),
};

export default api;
