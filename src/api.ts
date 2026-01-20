import axios from 'axios';
import { 
  Service, Customer, Appointment, Transaction, Barber,
  Product, Promotion, Availability, ScheduleException 
} from './types';

const getBaseURL = () => {
  const hostname = window.location.hostname;
  const apiRoot = `http://${hostname}:8000/api`;
  
  const pathParts = window.location.pathname.split('/');
  const bIndex = pathParts.indexOf('b');
  if (bIndex !== -1 && pathParts[bIndex + 1]) {
    return `${apiRoot}/b/${pathParts[bIndex + 1]}/`;
  }
  
  // Fallback: Tenta pegar o slug saved do último login bem-sucedido
  const savedSlug = localStorage.getItem('last_barbershop_slug');
  if (savedSlug) {
    return `${apiRoot}/b/${savedSlug}/`;
  }

  return `${apiRoot}/`;
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Update baseURL on navigation if needed
api.interceptors.request.use(
  (config) => {
    config.baseURL = getBaseURL();
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
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
  async (error) => {
    const originalRequest = error.config;

    // Se o erro for 401 e não for uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${getBaseURL()}/auth/refresh/`, {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          
          // Salva o novo token onde o antigo estava
          if (localStorage.getItem('token')) {
            localStorage.setItem('token', access);
          } else {
            sessionStorage.setItem('token', access);
          }
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Se falhou o refresh, limpa tudo
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: any) => api.post('/auth/login/', data),
  me: () => api.get('/auth/me/'),
};

export const getMediaUrl = (path: string | null | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const hostname = window.location.hostname;
  return `http://${hostname}:8000${path}`;
};

export const barbershopApi = {
  get: () => api.get<Barbershop>('/config/').then(r => r.data),
  update: (data: FormData) => api.patch<Barbershop>('/config/', data).then(r => r.data),
};

export const barbersApi = {
  getAll: () => api.get<Barber[]>('barbers/').then(r => r.data),
  create: (data: Partial<Barber>) => api.post<Barber>('barbers/', data).then(r => r.data),
  update: (id: string, data: Partial<Barber>) => api.patch<Barber>(`barbers/${id}/`, data).then(r => r.data),
  delete: (id: string) => api.delete(`barbers/${id}/`),
};

export const servicesApi = {
  getAll: () => api.get<Service[]>('services/').then(r => r.data),
  create: (data: Partial<Service>) => api.post<Service>('services/', data).then(r => r.data),
  update: (id: string, data: Partial<Service>) => api.patch<Service>(`services/${id}/`, data).then(r => r.data),
  delete: (id: string) => api.delete(`services/${id}/`),
};

export const customersApi = {
  getAll: () => api.get<Customer[]>('customers/').then(r => r.data),
  create: (data: Partial<Customer>) => api.post<Customer>('customers/', data).then(r => r.data),
  update: (id: string, data: Partial<Customer>) => api.patch<Customer>(`customers/${id}/`, data).then(r => r.data),
  delete: (id: string) => api.delete(`customers/${id}/`),
  redeemPoints: (id: string, points: number) => api.post(`customers/${id}/redeem_points/`, { points }).then(r => r.data),
};

export const appointmentsApi = {
  getAll: () => api.get<Appointment[]>('appointments/').then(r => r.data),
  getToday: () => api.get<Appointment[]>('appointments/today/').then(r => r.data),
  getAvailableSlots: (barberId: string, serviceId: string, date: string) => 
    api.get<string[]>('appointments/available_slots/', { params: { barberId, serviceId, date } }).then(r => r.data),
  create: (data: Partial<Appointment>) => api.post<Appointment>('appointments/', data).then(r => r.data),
  update: (id: string, data: Partial<Appointment>) => api.patch<Appointment>(`appointments/${id}/`, data).then(r => r.data),
  delete: (id: string) => api.delete(`appointments/${id}/`),
  complete: (id: string) => api.post<Appointment>(`appointments/${id}/complete/`).then(r => r.data),
};

export const transactionsApi = {
  getAll: () => api.get<Transaction[]>('transactions/').then(r => r.data),
  getSummary: () => api.get('transactions/summary/').then(r => r.data),
  create: (data: Partial<Transaction>) => api.post<Transaction>('transactions/', data).then(r => r.data),
  update: (id: string, data: Partial<Transaction>) => api.patch<Transaction>(`transactions/${id}/`, data).then(r => r.data),
};

export const productsApi = {
  getAll: () => api.get<Product[]>('products/').then(r => r.data),
  getLowStock: () => api.get<Product[]>('products/low_stock/').then(r => r.data),
  create: (data: Partial<Product>) => api.post<Product>('products/', data).then(r => r.data),
  update: (id: string, data: Partial<Product>) => api.put<Product>(`products/${id}/`, data).then(r => r.data),
  delete: (id: string) => api.delete(`products/${id}/`),
};

export const promotionsApi = {
  getAll: () => api.get<Promotion[]>('promotions/').then(r => r.data),
  getActive: () => api.get<Promotion[]>('promotions/active/').then(r => r.data),
  create: (data: Partial<Promotion>) => api.post<Promotion>('promotions/', data).then(r => r.data),
};

export const scheduleExceptionsApi = {
  getAll: () => api.get<ScheduleException[]>('schedule-exceptions/').then(r => r.data),
  create: (data: Partial<ScheduleException>) => api.post<ScheduleException>('schedule-exceptions/', data).then(r => r.data),
  delete: (id: string) => api.delete(`schedule-exceptions/${id}/`),
};

export const availabilityApi = {
  getAll: () => api.get<Availability[]>('availability/').then(r => r.data),
  update: (id: string, data: Partial<Availability>) => api.put<Availability>(`availability/${id}/`, data).then(r => r.data),
  sync: (data: Partial<Availability>[]) => api.post<Availability[]>('availability/sync/', data).then(r => r.data),
};

export default api;
