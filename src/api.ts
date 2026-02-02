import axios from 'axios';
import { 
  Service, Customer, Appointment, Transaction, Barber,
  Product, Promotion, Availability, ScheduleException, 
  Barbershop
} from './types';

const getBaseURL = () => {
  const origin = window.location.origin;
  const apiRoot = `${origin}/api`;
  
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
  
  // Se for uma URL completa (ex: de um storage externo ou se o DRF já retornou com host)
  if (path.startsWith('http')) {
    const currentHostname = window.location.hostname;
    const currentPort = window.location.port;

    // Se a URL contém /media/ e aponta para a porta 8000, mas estamos acessando a app em outra porta (produção)
    if ((path.includes(':8000/media/') || path.includes('/media/')) && 
        (!currentPort || currentPort === '80' || currentPort === '443')) {
      
      // Extrai o caminho relativo da mídia
      const mediaPartIndex = path.indexOf('/media/');
      if (mediaPartIndex !== -1) {
        const relativePath = path.substring(mediaPartIndex);
        const baseUrl = window.location.origin.endsWith('/') 
          ? window.location.origin.slice(0, -1) 
          : window.location.origin;
        return `${baseUrl}${relativePath}`;
      }
    }

    // Caso especial para mobile acessando dev
    if (currentHostname !== 'localhost' && currentHostname !== '127.0.0.1' && 
        (path.includes('://localhost') || path.includes('://127.0.0.1'))) {
      return path.replace('://localhost', `://${currentHostname}`).replace('://127.0.0.1', `://${currentHostname}`);
    }

    return path;
  }
  
  const origin = window.location.origin;
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // Normaliza o path para garantir que comece com /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Se for localhost (desenvolvimento) ou acessando via IP em portas comuns de dev (3000, 5173, etc)
  // geralmente o Django roda na 8000 em ambiente de desenvolvimento
  const isDevPort = port === '3000' || port === '5173' || port === '3001' || port === '3002';
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);

  // Se estivermos em uma porta de desenvolvimento ou acessando via localhost com porta 8000 fallback
  if (isLocalHost && !port) {
      // Caso raro onde localhost acessa sem porta, mas geralmente dev é com porta.
      return `${origin}${normalizedPath}`;
  }

  if (isLocalHost || (isIpAddress && isDevPort)) {
    // Desenvolvimento: backend rodando na 8000
    return `http://${hostname}:8000${normalizedPath}`;
  }
  
  // Produção/Docker: O Nginx serve as imagens em /media/ na mesma porta do frontend
  return `${origin}${normalizedPath}`;
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
  getAvailableSlots: (barberId: string, serviceIds: string, date: string) => 
    api.get<string[]>('appointments/available_slots/', { params: { barberId, serviceIds, date } }).then(r => r.data),
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

export const dailyAvailabilityApi = {
  sync: (data: any[]) => api.post<any[]>('dailyavailability/sync/', data).then(r => r.data),
  getForDate: (date: string) => api.get<any[]>(`dailyavailability/?date=${date}`).then(r => r.data),
  getForRange: (start: string, end: string) => api.get<any[]>(`dailyavailability/?start=${start}&end=${end}`).then(r => r.data),
  clearDate: (date: string) => api.delete(`dailyavailability/clear/?date=${date}`).then(r => r.data),
};

export default api;
