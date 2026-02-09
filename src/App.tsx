
import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import brandLogo from './assets/autoopera-logo.png';
import { 
  LayoutDashboard, 
  Calendar, 
  Scissors, 
  Settings, 
  Users,
  User,
  DollarSign,
  BarChart3,
  Megaphone,
  Package,
  Menu,
  X,
  LogOut,
  Clock,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Download
} from 'lucide-react';
import { useAuth } from './AuthContext';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};
import { Service, Appointment, Availability, Customer, Transaction, Product, ScheduleException, Barbershop } from './types';
import { 
  servicesApi, 
  customersApi, 
  appointmentsApi, 
  transactionsApi, 
  productsApi, 
  availabilityApi, 
  scheduleExceptionsApi,
  barbershopApi,
  getMediaUrl,
  dailyAvailabilityApi
} from './api';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/Calendar';
import Services from './pages/Services';
import Customers from './pages/Customers';
import Finance from './pages/Finance';
import Reports from './pages/Reports';
import Promotions from './pages/Promotions';
import Inventory from './pages/Inventory';
import SettingsPage from './pages/Settings';
import LoginPage from './pages/Login';
import CustomerBooking from './pages/CustomerBooking';
import BarberRegister from './pages/BarberRegister';
import LandingPage from './pages/LandingPage';
import Onboarding from './components/Onboarding';
import InstallPrompt from './components/InstallPrompt';

const NavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: string, id?: string }> = ({ active, onClick, icon, label, badge, id }) => (
  <button 
    id={id}
    onClick={onClick} 
    className={`
      flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 relative group w-full
      ${active 
        ? 'bg-white shadow-[0_12px_24px_-8px_rgba(0,0,0,0.1)] text-primary' 
        : 'text-white/40 hover:text-white hover:bg-white/5'}
    `}
  >
    {active && (
      <motion.div 
        layoutId="activeTabSide"
        className="absolute left-[-2px] w-1.5 h-6 bg-cta rounded-full"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    )}
    <div className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-500`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { 
        size: 18,
        strokeWidth: active ? 2.5 : 2
      }) : icon}
    </div>
    <span className={`text-[12px] uppercase font-black tracking-[0.15em] italic flex-1 text-left ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
    {badge && (
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cta opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-cta"></span>
      </span>
    )}
  </button>
);

const MobileNavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: boolean, id?: string }> = ({ active, onClick, icon, label, badge, id }) => (
  <button 
    id={id}
    onClick={onClick} 
    className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all relative ${active ? 'text-cta' : 'text-primary/30'}`}
  >
     {badge && (
      <div className="absolute top-4 right-1/2 translate-x-4">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cta opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cta border border-white"></span>
        </span>
      </div>
    )}
    <div className={`transition-transform duration-500 ${active ? 'scale-110' : ''}`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { 
        size: 20,
        strokeWidth: active ? 2.5 : 2
      }) : icon}
    </div>
    <span className={`text-[9px] font-black uppercase tracking-[0.1em] italic transition-all ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
  </button>
);

const MobileMenuRow: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string, description?: string, badge?: boolean }> = ({ active, onClick, icon, label, description, badge }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-6 p-6 rounded-[32px] w-full transition-all active:scale-95 border relative ${active ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/20' : 'bg-white text-primary border-primary/5 hover:border-cta/20 shadow-sm'}`}
  >
    {badge && (
      <div className="absolute top-6 right-6">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cta opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cta border border-white"></span>
        </span>
      </div>
    )}
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${active ? 'bg-white/10 text-white' : 'bg-background text-primary/40'}`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 24, strokeWidth: 2.5 }) : icon}
    </div>
    <div className="flex-1 text-left">
      <span className="text-[14px] font-black italic uppercase tracking-tighter block mb-0.5">{label}</span>
      {description && <span className={`text-[9px] ${active ? 'text-white/40' : 'text-primary/20'} uppercase tracking-[0.2em] font-black italic`}>{description}</span>}
    </div>
    <ChevronRight size={16} className={active ? 'text-white/20' : 'text-primary/10'} />
  </button>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode, allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const { slug } = useParams<{ slug?: string }>();

  if (isLoading) {
    return (
      <div key="protected-loading" className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-cta rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se não estiver logado, manda pro login preservando o slug se existir
  if (!user) {
    const loginPath = slug ? `/b/${slug}/login` : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Se estiver logado mas o papel não for permitido
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const targetSlug = slug || user?.barbershop_slug || localStorage.getItem('last_barbershop_slug') || 'default';
    // Se for cliente e tentar acessar area de barbeiro, manda pro booking
    if (user.role === 'customer') {
      return <Navigate to={`/b/${targetSlug}/booking`} replace />;
    }
    // Se for barbeiro e cair aqui, vai pro dashboard
    return <Navigate to={`/b/${targetSlug}`} replace />;
  }

  // Forçar o slug na URL para Clientes se estiverem na raiz ou sem slug
  if (user.role === 'customer' && !slug) {
    const targetSlug = user?.barbershop_slug || localStorage.getItem('last_barbershop_slug') || 'default';
    return <Navigate to={`/b/${targetSlug}/booking`} replace />;
  }

  return <React.Fragment key="protected-content">{children}</React.Fragment>;
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isLoading: authLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [hasDailyAvailability, setHasDailyAvailability] = useState(false);
  const [barbershop, setBarbershop] = useState<Barbershop | null>(() => {
    if (user?.barbershop_name) {
      return {
        name: user.barbershop_name,
        slug: user.barbershop_slug,
        logo: user.barbershop_logo
      } as any;
    }
    return null;
  });
  const [isLoadingData, setIsLoadingData] = useState(true);

  React.useEffect(() => {
    if (user?.role === 'barber' && user.barbershop_onboarding_completed === false) {
      setShowOnboarding(true);
    }
  }, [user]);

  React.useEffect(() => {
    if (!user || user.role !== 'barber') return;

    const fetchData = async () => {
      try {
        const [
          servicesData, 
          appointmentsData, 
          customersData, 
          transactionsData, 
          productsData, 
          availabilityData,
          exceptionsData,
          shopData,
          dailyData
        ] = await Promise.all([
          servicesApi.getAll(),
          appointmentsApi.getAll(),
          customersApi.getAll(),
          transactionsApi.getAll(),
          productsApi.getAll(),
          availabilityApi.getAll(),
          scheduleExceptionsApi.getAll(),
          barbershopApi.get(),
          dailyAvailabilityApi.getForRange(
            new Date().toISOString().split('T')[0],
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          )
        ]);

        setServices(servicesData);
        setAppointments(appointmentsData);
        setCustomers(customersData);
        setTransactions(transactionsData);
        setProducts(productsData);
        setAvailability(availabilityData);
        setExceptions(exceptionsData);
        setBarbershop(shopData);
        setHasDailyAvailability(dailyData && dailyData.length > 0);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [user]);

  const getActiveTab = (pathname: string) => {
    // Remove o prefixo /b/slug se existir
    const path = pathname.replace(/^\/b\/[^/]+/, '');
    if (path === '' || path === '/') return 'calendar';
    return path.substring(1);
  };

  const activeTab = getActiveTab(location.pathname);
  const { slug: urlSlug } = useParams<{ slug?: string }>();

  const handleNavigation = (path: string) => {
    const slug = urlSlug || barbershop?.slug || localStorage.getItem('last_barbershop_slug') || 'default';
    
    let targetPath = path;
    if (path === '/') targetPath = `/b/${slug}`;
    else if (path.startsWith('/')) targetPath = `/b/${slug}${path}`;

    navigate(targetPath);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/login');
    toast.success('Desconectado com sucesso');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-primary flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/5 border-t-cta rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se o usuário é um cliente e está tentando acessar a dashboard (ou qualquer rota sem ser booking), redireciona
  if (user && user.role === 'customer' && !location.pathname.includes('/booking')) {
    const targetSlug = urlSlug || user?.barbershop_slug || localStorage.getItem('last_barbershop_slug') || 'default';
    return <Navigate to={`/b/${targetSlug}/booking`} replace />;
  }

  // Se o usuário é um barbeiro e está na raiz, a dashboard é mostrada
  // Se não está logado, mostra login

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register-barber' || location.pathname.includes('/login');
  const isPublicPage = location.pathname === '/' || location.pathname.includes('/booking') || isAuthPage;

  return (
    <div className={`min-h-screen bg-background text-primary ${user?.role === 'barber' && !isPublicPage ? 'flex flex-col md:flex-row' : ''}`}>
      <ScrollToTop />
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#fff',
            color: '#0F4C5C',
            borderRadius: '24px',
            border: '1px solid rgba(15,76,92,0.05)',
            fontSize: '12px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontStyle: 'italic',
            padding: '16px 24px',
            boxShadow: '0 24px 48px -12px rgba(15,76,92,0.15)',
          },
          success: {
            iconTheme: {
              primary: '#0F4C5C',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#E67E22',
              secondary: '#fff',
            },
          },
        }}
      />

      {showOnboarding && user?.barbershop_slug && (
        <Onboarding 
          barbershopSlug={user.barbershop_slug} 
          onComplete={() => setShowOnboarding(false)} 
        />
      )}
      
      {user?.role === 'barber' && !isPublicPage && (
        <nav className="hidden md:flex flex-col w-[300px] bg-primary h-screen sticky top-0 p-8 z-50">
          <div className="flex flex-col gap-8 mb-12 pb-8 border-b border-white/5 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            {/* Logo da Marca */}
            <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-[24px] shadow-2xl shadow-black/20 w-fit relative z-10">
              <img src={brandLogo} className="h-6 w-auto object-contain" alt="AutoOpera" />
              <div className="w-px h-4 bg-primary/10" />
              <span className="text-lg font-title font-black text-primary tracking-tighter italic uppercase">Opera</span>
            </div>

            {/* Nome da Barbearia */}
            {barbershop?.name && (
              <div className="flex items-center gap-4 px-2 hover:translate-x-1 transition-transform cursor-default">
                <div className="w-10 h-10 rounded-2xl bg-white/10 p-1 border border-white/5 backdrop-blur-sm">
                   {barbershop?.logo ? (
                     <img src={getMediaUrl(barbershop.logo)} className="w-full h-full rounded-xl object-cover" alt="Logo" loading="lazy" />
                   ) : (
                     <div className="w-full h-full rounded-xl bg-cta flex items-center justify-center text-[10px] font-black italic">BF</div>
                   )}
                </div>
                <h1 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-title italic truncate">{barbershop.name}</h1>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2 flex-grow">
            <NavButton active={activeTab === 'calendar' || activeTab === ''} onClick={() => handleNavigation('/')} icon={<Calendar size={18} />} label="Agenda" />
            <NavButton active={activeTab === 'dashboard'} onClick={() => handleNavigation('/dashboard')} icon={<LayoutDashboard size={18} />} label="Resumo" />
            <NavButton 
              id="nav-services"
              active={activeTab === 'services'} 
              onClick={() => handleNavigation('/services')} 
              icon={<Scissors size={18} />} 
              label="Serviços" 
              badge={(!isLoadingData && services.length === 0) ? "Configurar" : undefined}
            />
            <NavButton active={activeTab === 'customers'} onClick={() => handleNavigation('/customers')} icon={<Users size={18} />} label="Clientes" />
            <NavButton active={activeTab === 'finance'} onClick={() => handleNavigation('/finance')} icon={<DollarSign size={18} />} label="Financeiro" />
            <NavButton active={activeTab === 'inventory'} onClick={() => handleNavigation('/inventory')} icon={<Package size={18} />} label="Estoque" />
            
            <div className="mt-6 mb-2 px-5">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] italic">Configurações</span>
            </div>

            <NavButton active={activeTab === 'settings' && (location.search.includes('tab=shop') || (!location.search.includes('tab=profile') && !location.search.includes('tab=schedule')))} onClick={() => handleNavigation('/settings?tab=shop')} icon={<Settings size={18} />} label="Unidade" />
            <NavButton 
              id="nav-schedule"
              active={activeTab === 'settings' && location.search.includes('tab=schedule')} 
              onClick={() => handleNavigation('/settings?tab=schedule')} 
              icon={<Clock size={18} />} 
              label="Horários" 
              badge={(!isLoadingData && availability.length === 0 && !hasDailyAvailability) ? "Configurar" : undefined}
            />
            <NavButton active={activeTab === 'settings' && location.search.includes('tab=profile')} onClick={() => handleNavigation('/settings?tab=profile')} icon={<User size={18} />} label="Perfil" />
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
            <div className="flex items-center gap-4 px-4 py-4 bg-white/5 border border-white/5 rounded-[28px] relative group overflow-hidden">
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.02] transition-opacity" />
              <div className="w-12 h-12 rounded-[18px] bg-white text-primary flex items-center justify-center shadow-lg relative z-10">
                <User className="w-6 h-6" />
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cta border-[3px] border-primary rounded-full animate-pulse"></div>
              </div>
              <div className="overflow-hidden relative z-10">
                <p className="text-[13px] font-black text-white tracking-tighter truncate uppercase italic italic">{user.name || 'Operador'}</p>
                <div className="flex items-center gap-1.5">
                    <ShieldCheck size={10} className="text-cta" />
                    <p className="text-[9px] text-white/30 truncate uppercase tracking-[0.2em] font-black italic">Mestre</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-6 text-white/30 hover:text-cta transition-all group italic"
            >
              <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">Encerrar Sessão</span>
            </button>
          </div>
        </nav>
      )}

      <main className={`flex-1 ${user?.role === 'barber' && !isPublicPage ? 'pb-24 md:pb-8 overflow-y-auto w-full' : ''}`}>
        {user?.role === 'barber' && !isPublicPage && (
          <div className="relative w-full h-[70px] md:h-[90px] overflow-hidden bg-primary flex items-center border-b border-white/5">
            {/* Texture Overlay */}
            <div className="absolute inset-0 z-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
            <div className="absolute top-0 right-0 w-[40%] h-full bg-cta/10 blur-[100px] rounded-full translate-x-1/4 -translate-y-1/2 pointer-events-none" />
            
            <div className="relative z-10 px-6 md:px-10 flex items-center justify-between w-full">
               <div className="flex items-center gap-4">
                  {/* Logo da Barbearia Miniaturizada */}
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white shadow-lg p-0.5 flex-shrink-0">
                    {barbershop?.logo ? (
                      <img src={getMediaUrl(barbershop.logo)} className="w-full h-full rounded-[14px] object-cover" alt="Logo" loading="lazy" />
                    ) : (
                      <div className="w-full h-full rounded-[14px] bg-cta flex items-center justify-center text-[10px] font-black italic text-white">BF</div>
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg md:text-xl font-title font-black text-white tracking-tighter uppercase italic leading-none mb-1">
                      {barbershop?.name || user?.barbershop_name || "PROCESANDO..."}
                    </h2>
                  </div>
               </div>

               <div className="flex items-center gap-2 md:gap-4">
                  {/* Botão de Download Discreto (Apenas Mobile) */}
                  <button 
                    onClick={() => setShowInstallPrompt(true)}
                    className="md:hidden flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all group"
                  >
                    <Download size={14} className="group-hover:bounce" />
                  </button>

                  {barbershop?.plan === 'trial' ? (
                     <div className="flex items-center gap-3">
                       <div className="hidden sm:flex flex-col items-end">
                          <span className="text-[7px] text-white/30 font-black uppercase tracking-[0.2em] italic mb-0.5">Período de Teste</span>
                          <span className="text-[10px] text-cta font-black uppercase italic">{barbershop.trial_days_left} DIAS RESTANTES</span>
                       </div>
                       <button 
                         onClick={() => window.location.href = '/#precos'} 
                         className="group flex items-center gap-2 bg-cta hover:bg-white text-white hover:text-primary px-4 py-2 rounded-xl transition-all duration-300 shadow-lg shadow-cta/20 hover:scale-105 active:scale-95"
                       >
                         <span className="text-[9px] font-black uppercase tracking-[0.1em] italic">Assinar Agora</span>
                         <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                       </button>
                     </div>
                  ) : (
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                      <div className="w-1.5 h-1.5 bg-cta rounded-full animate-pulse" />
                      <span className="text-[9px] text-white/40 font-black uppercase tracking-[0.2em] italic">Sistema Online</span>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}
        
        <div className={user?.role === 'barber' && !isPublicPage ? 'p-2 sm:p-6 md:p-12 max-w-7xl mx-auto min-h-[calc(100vh-90px)]' : ''}>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register-barber" element={<BarberRegister />} />
          <Route path="/b/:slug/login" element={<LoginPage />} />
          
          <Route path="/booking" element={
            <ProtectedRoute allowedRoles={['customer', 'barber']}>
              <Navigate to={`/b/${localStorage.getItem('last_barbershop_slug') || 'default'}/booking`} replace />
            </ProtectedRoute>
          } />

          <Route path="/b/:slug/booking" element={
            <ProtectedRoute allowedRoles={['customer', 'barber']}>
              <CustomerBooking />
            </ProtectedRoute>
          } />
          
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/b/:slug" element={
            <ProtectedRoute allowedRoles={['barber']}>
              <CalendarPage 
                barberId={user?.profile_id?.toString()}
                availability={availability} 
                setAvailability={setAvailability} 
                services={services} 
                appointments={appointments} 
                setAppointments={setAppointments}
                exceptions={exceptions}
                setExceptions={setExceptions}
              />
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['barber']}>
              <Navigate to={`/b/${localStorage.getItem('last_barbershop_slug') || 'default'}/dashboard`} replace />
            </ProtectedRoute>
          } />

          <Route path="/b/:slug/dashboard" element={
            <ProtectedRoute allowedRoles={['barber']}>
              <Dashboard 
                userName={user?.name?.split(' ')[0]}
                appointments={appointments} 
                setAppointments={setAppointments}
                services={services} 
                customers={customers} 
                setTransactions={setTransactions}
                onNavigateToPromotions={() => handleNavigation('/promotions')} 
                barbershop={barbershop}
              />
            </ProtectedRoute>
          } />
          
          <Route path="/calendar" element={<Navigate to="/" replace />} />

          <Route path="/b/:slug/services" element={
            <ProtectedRoute allowedRoles={['barber']}>
              <Services services={services} setServices={setServices} />
            </ProtectedRoute>
          } />

          <Route path="/b/:slug/customers" element={
            <ProtectedRoute allowedRoles={['barber']}>
              <Customers customers={customers} setCustomers={setCustomers} />
            </ProtectedRoute>
          } />

          <Route path="/b/:slug/finance" element={
            <ProtectedRoute allowedRoles={['barber']}>
              <Finance transactions={transactions} setTransactions={setTransactions} />
            </ProtectedRoute>
          } />

          <Route path="/b/:slug/inventory" element={
            <ProtectedRoute allowedRoles={['barber']}>
              <Inventory products={products} setProducts={setProducts} />
            </ProtectedRoute>
          } />

          <Route path="/b/:slug/reports" element={
            <ProtectedRoute allowedRoles={['barber']}>
              <Reports transactions={transactions} appointments={appointments} services={services} customers={customers} />
            </ProtectedRoute>
          } />

          <Route path="/b/:slug/promotions" element={
            <ProtectedRoute allowedRoles={['barber']}>
              <Promotions services={services} customers={customers} />
            </ProtectedRoute>
          } />

          <Route path="/b/:slug/settings" element={
            <ProtectedRoute allowedRoles={['barber']}>
              <SettingsPage 
                availability={availability} 
                setAvailability={setAvailability} 
                barbershop={barbershop}
                setBarbershop={setBarbershop}
                setHasDailyAvailability={setHasDailyAvailability}
              />
            </ProtectedRoute>
          } />

          <Route path="/reports" element={<ProtectedRoute allowedRoles={['barber']}><Navigate to={`/b/${localStorage.getItem('last_barbershop_slug') || 'default'}/reports`} replace /></ProtectedRoute>} />
          <Route path="/promotions" element={<ProtectedRoute allowedRoles={['barber']}><Navigate to={`/b/${localStorage.getItem('last_barbershop_slug') || 'default'}/promotions`} replace /></ProtectedRoute>} />
          <Route path="/services" element={<ProtectedRoute allowedRoles={['barber']}><Navigate to={`/b/${localStorage.getItem('last_barbershop_slug') || 'default'}/services`} replace /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute allowedRoles={['barber']}><Navigate to={`/b/${localStorage.getItem('last_barbershop_slug') || 'default'}/customers`} replace /></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute allowedRoles={['barber']}><Navigate to={`/b/${localStorage.getItem('last_barbershop_slug') || 'default'}/finance`} replace /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute allowedRoles={['barber']}><Navigate to={`/b/${localStorage.getItem('last_barbershop_slug') || 'default'}/inventory`} replace /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={['barber']}><Navigate to={`/b/${localStorage.getItem('last_barbershop_slug') || 'default'}/settings`} replace /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to={user?.role === 'customer' ? `/b/${localStorage.getItem('last_barbershop_slug') || 'default'}/booking` : `/b/${localStorage.getItem('last_barbershop_slug') || 'default'}`} replace />} />
        </Routes>
        </div>
      </main>

      <InstallPrompt forceShow={showInstallPrompt} onOpenChange={setShowInstallPrompt} />

      {/* Mobile Bottom Navigation - Oculto em páginas públicas ou auth */}
      {user?.role === 'barber' && !isPublicPage && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-primary/5 px-4 h-24 flex items-center justify-around z-[60] shadow-[0_-24px_48px_rgba(15,76,92,0.1) ]">
          <MobileNavButton active={activeTab === 'calendar' || activeTab === ''} onClick={() => handleNavigation('/')} icon={<Calendar />} label="Agenda" />
          <MobileNavButton 
            id="mobile-nav-services"
            active={activeTab === 'services'} 
            onClick={() => handleNavigation('/services')} 
            icon={<Scissors />} 
            label="Serviços" 
            badge={!isLoadingData && services.length === 0}
          />
          <div className="relative -mt-12">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="w-16 h-16 bg-primary text-white rounded-[24px] flex items-center justify-center shadow-2xl shadow-primary/40 border-[6px] border-white active:scale-90 transition-transform"
              >
                <Menu size={28} strokeWidth={2.5} />
              </button>
          </div>
          <MobileNavButton 
            id="mobile-nav-schedule"
            active={location.search.includes('tab=schedule')} 
            onClick={() => handleNavigation('/settings?tab=schedule')} 
            icon={<Clock />} 
            label="Horários" 
            badge={!isLoadingData && availability.length === 0 && !hasDailyAvailability}
          />
          <MobileNavButton active={activeTab === 'settings' && !location.search.includes('tab=schedule')} onClick={() => handleNavigation('/settings')} icon={<Settings />} label="Ajustes" />
        </nav>
      )}

      {/* Mobile Full Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary/20 backdrop-blur-2xl z-[100] p-6 flex items-end"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-background w-full rounded-[48px] p-8 shadow-[0_-24px_48px_rgba(0,0,0,0.1)] relative max-h-[85vh] overflow-y-auto"
            >
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-8 right-8 p-3 bg-white border border-border text-primary rounded-2xl shadow-sm active:scale-90 transition-transform"
              >
                <X size={20} />
              </button>

              <div className="mb-10 mt-2">
                <span className="text-[10px] font-black text-cta uppercase tracking-[0.4em] italic block mb-2">Menu Principal</span>
                <h3 className="text-3xl font-black font-title text-primary italic uppercase tracking-tighter">Navegação</h3>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <MobileMenuRow 
                  active={activeTab === 'calendar'} 
                  onClick={() => handleNavigation('/')} 
                  icon={<Calendar />} 
                  label="Agenda Profissional" 
                  description="Gestão de horários" 
                />
                <MobileMenuRow 
                  active={location.search.includes('tab=schedule')} 
                  onClick={() => handleNavigation('/settings?tab=schedule')} 
                  icon={<Clock />} 
                  label="Horários & Turnos" 
                  description="Configuração da jornada" 
                  badge={!isLoadingData && availability.length === 0 && !hasDailyAvailability}
                />
                <MobileMenuRow active={activeTab === 'dashboard'} onClick={() => handleNavigation('/dashboard')} icon={<LayoutDashboard />} label="Dashboard IA" description="Métricas de performance" />
                <MobileMenuRow 
                  active={activeTab === 'services'} 
                  onClick={() => handleNavigation('/services')} 
                  icon={<Scissors />} 
                  label="Catálogo de Serviços" 
                  description="Preços e durações" 
                  badge={!isLoadingData && services.length === 0}
                />
                <MobileMenuRow active={activeTab === 'customers'} onClick={() => handleNavigation('/customers')} icon={<Users />} label="Gestão de Clientes" description="CRM e fidelidade" />
                <MobileMenuRow active={activeTab === 'finance'} onClick={() => handleNavigation('/finance')} icon={<DollarSign />} label="Fluxo de Caixa" description="Entradas e saídas" />
                <MobileMenuRow active={activeTab === 'inventory'} onClick={() => handleNavigation('/inventory')} icon={<Package />} label="Controle de Estoque" description="Produtos e vendas" />
                <MobileMenuRow active={activeTab === 'reports'} onClick={() => handleNavigation('/reports')} icon={<BarChart3 />} label="Inteligência Analítica" description="Relatórios avançados" />
                <MobileMenuRow active={activeTab === 'promotions'} onClick={() => handleNavigation('/promotions')} icon={<Megaphone />} label="Marketing & Growth" description="Campanhas WhatsApp" />
                <MobileMenuRow 
                  active={false} 
                  onClick={() => { setIsMobileMenuOpen(false); setShowInstallPrompt(true); }} 
                  icon={<Download />} 
                  label="Instalar Aplicativo" 
                  description="Acesso rápido na tela inicial" 
                />
              </div>

              <div className="mt-10 pt-8 border-t border-border flex flex-col gap-4">
                 <button 
                  onClick={() => handleNavigation('/settings')}
                  className="flex items-center gap-4 p-5 rounded-3xl bg-primary/5 text-primary font-black uppercase tracking-[0.1em] italic text-xs"
                 >
                    <Settings size={18} /> Configurações do Sistema
                 </button>
                 <button 
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-3 p-5 rounded-3xl bg-cta/10 text-cta font-black uppercase tracking-[0.2em] italic text-xs"
                 >
                    <LogOut size={18} /> Sair da Conta
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
