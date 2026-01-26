
import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import brandLogo from './assets/logo.png';
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
  Smartphone
} from 'lucide-react';
import { useAuth } from './AuthContext';
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
  getMediaUrl
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

const NavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className={`
      flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 relative group
      ${active 
        ? 'bg-[#007AFF] text-white font-bold shadow-lg shadow-[#007AFF]/20 scale-[1.02]' 
        : 'text-white/40 hover:text-white hover:bg-white/5'}
    `}
  >
    {active && (
      <motion.div 
        layoutId="activeTabSide"
        className="absolute left-0 w-1 h-6 bg-white rounded-full ml-1"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    )}
    <div className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { 
        size: 20,
        strokeWidth: active ? 2.5 : 2
      }) : icon}
    </div>
    <span className="text-[14px] tracking-tight">{label}</span>
  </button>
);

const MobileNavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${active ? 'text-[#007AFF]' : 'text-gray-500'}`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { 
        size: 20,
        strokeWidth: active ? 2.5 : 2
      }) : icon}
    </div>
    <span className={`text-[9px] font-bold uppercase tracking-[0.05em] transition-all ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

const MobileMenuRow: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string, description?: string }> = ({ active, onClick, icon, label, description }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-4 p-4 rounded-2xl w-full transition-all active:scale-95 ${active ? 'bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/20' : 'bg-white/[0.03] border border-white/5 text-white/70 hover:bg-white/[0.05]'}`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-white/20' : 'bg-white/5 text-[#007AFF]'}`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 20 }) : icon}
    </div>
    <div className="flex-1 text-left">
      <span className="text-[15px] font-bold block leading-none mb-1">{label}</span>
      {description && <span className={`text-[10px] ${active ? 'text-white/60' : 'text-white/30'} uppercase tracking-widest font-black`}>{description}</span>}
    </div>
    <ChevronRight size={16} className={active ? 'text-white/40' : 'text-white/10'} />
  </button>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode, allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const { slug } = useParams<{ slug?: string }>();

  if (isLoading) {
    return (
      <div key="protected-loading" className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#007AFF]/20 border-t-[#007AFF] rounded-full animate-spin"></div>
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

  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [barbershop, setBarbershop] = useState<Barbershop | null>(() => {
    if (user?.barbershop_name) {
      return {
        name: user.barbershop_name,
        slug: user.barbershop_slug,
        banner: user.barbershop_banner,
        logo: user.barbershop_logo
      } as any;
    }
    return null;
  });
  const [isLoadingData, setIsLoadingData] = useState(true);

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
          shopData
        ] = await Promise.all([
          servicesApi.getAll(),
          appointmentsApi.getAll(),
          customersApi.getAll(),
          transactionsApi.getAll(),
          productsApi.getAll(),
          availabilityApi.getAll(),
          scheduleExceptionsApi.getAll(),
          barbershopApi.get()
        ]);

        setServices(servicesData);
        setAppointments(appointmentsData);
        setCustomers(customersData);
        setTransactions(transactionsData);
        setProducts(productsData);
        setAvailability(availabilityData);
        setExceptions(exceptionsData);
        setBarbershop(shopData);
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
    navigate('/login');
    toast.success('Desconectado com sucesso');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#007AFF]/20 border-t-[#007AFF] rounded-full animate-spin"></div>
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

  return (
    <div className={`min-h-screen bg-black text-[#f5f5f7] ${user?.role === 'barber' ? 'flex flex-col md:flex-row' : ''}`}>
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#1c1c1e',
            color: '#fff',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.05)',
            fontSize: '14px',
            fontWeight: '600',
            padding: '12px 24px',
            backdropFilter: 'blur(10px)',
          },
          success: {
            iconTheme: {
              primary: '#007AFF',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF3B30',
              secondary: '#fff',
            },
          },
        }}
      />
      
      {user?.role === 'barber' && (
        <nav className="hidden md:flex flex-col w-72 bg-black border-r border-[#1c1c1e] h-screen sticky top-0 p-8">
          <div className="flex flex-col gap-6 mb-10 pb-6 border-b border-white/5">
            {/* Logo da Marca - Sempre Visível */}
            <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-[24px] shadow-sm w-fit">
              <img src={brandLogo} className="h-7 w-auto object-contain" alt="AutoOpera" />
              <div className="w-px h-5 bg-gray-200" />
              <span className="text-xl font-bold text-[#007AFF] tracking-tighter">Barber</span>
            </div>

            {/* Nome da Barbearia embaixo */}
            {barbershop?.name && (
              <div className="flex items-center gap-3 px-2">
                {barbershop?.logo && (
                  <img src={getMediaUrl(barbershop.logo)} className="w-6 h-6 rounded-lg object-cover" alt="Logo" />
                )}
                <h1 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] truncate">{barbershop.name}</h1>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-2">
            <NavButton active={activeTab === 'calendar' || activeTab === ''} onClick={() => handleNavigation('/')} icon={<Calendar size={20} />} label="Agenda" />
            <NavButton active={activeTab === 'dashboard'} onClick={() => handleNavigation('/dashboard')} icon={<LayoutDashboard size={20} />} label="Resumo" />
            <NavButton active={activeTab === 'services'} onClick={() => handleNavigation('/services')} icon={<Scissors size={20} />} label="Serviços" />
            <NavButton active={activeTab === 'customers'} onClick={() => handleNavigation('/customers')} icon={<Users size={20} />} label="Clientes" />
            <NavButton active={activeTab === 'finance'} onClick={() => handleNavigation('/finance')} icon={<DollarSign size={20} />} label="Financeiro" />
            <NavButton active={activeTab === 'inventory'} onClick={() => handleNavigation('/inventory')} icon={<Package size={20} />} label="Estoque" />
            <NavButton active={activeTab === 'settings' && (location.search.includes('tab=shop') || (!location.search.includes('tab=profile') && !location.search.includes('tab=schedule')))} onClick={() => handleNavigation('/settings?tab=shop')} icon={<Settings size={20} />} label="Barbearia" />
            <NavButton active={activeTab === 'settings' && location.search.includes('tab=schedule')} onClick={() => handleNavigation('/settings?tab=schedule')} icon={<Clock size={20} />} label="Horários" />
            <NavButton active={activeTab === 'settings' && location.search.includes('tab=profile')} onClick={() => handleNavigation('/settings?tab=profile')} icon={<User size={20} />} label="Meu Perfil" />
          </div>
          <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
            <div className="flex items-center gap-4 px-3 py-4 bg-white/[0.03] border border-white/5 rounded-3xl">
              <div className="w-11 h-11 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center border border-[#007AFF]/20 relative">
                <User className="w-6 h-6 text-[#007AFF]" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white tracking-tight truncate">{user.name || 'Admin'}</p>
                <p className="text-[10px] text-[#007AFF] uppercase tracking-[0.15em] font-black">Admin Pro</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-3 text-gray-500 hover:text-red-500 transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Sair da Conta</span>
            </button>
          </div>
        </nav>
      )}

      <main className={`flex-1 ${user?.role === 'barber' ? 'pb-24 md:pb-8 overflow-y-auto w-full' : ''}`}>
        {user?.role === 'barber' && location.pathname !== '/login' && (
          <div className="relative w-full h-[100px] md:h-[130px] overflow-hidden bg-gradient-to-r from-[#007AFF]/10 to-transparent border-b border-white/5">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            <div className="absolute bottom-4 left-6 md:left-10">
              <h2 className="text-2xl md:text-3xl font-[1000] text-white tracking-tighter uppercase italic">
                {barbershop?.name || user?.barbershop_name || "CARREGANDO..."}
              </h2>
            </div>
          </div>
        )}
        
        <div className={user?.role === 'barber' ? 'p-4 md:p-10 max-w-7xl mx-auto' : ''}>
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

          <Route path="/b/:slug/settings" element={
            <ProtectedRoute allowedRoles={['barber']}>
              <SettingsPage 
                availability={availability} 
                setAvailability={setAvailability} 
                barbershop={barbershop}
                setBarbershop={setBarbershop}
              />
            </ProtectedRoute>
          } />

          {/* Fallbacks para compatibilidade ou URLs antigas */}
          <Route path="/services" element={<ProtectedRoute allowedRoles={['barber']}><Navigate to={`/b/${localStorage.getItem('last_barbershop_slug') || 'default'}/services`} replace /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute allowedRoles={['barber']}><Navigate to={`/b/${localStorage.getItem('last_barbershop_slug') || 'default'}/customers`} replace /></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute allowedRoles={['barber']}><Navigate to={`/b/${localStorage.getItem('last_barbershop_slug') || 'default'}/finance`} replace /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute allowedRoles={['barber']}><Navigate to={`/b/${localStorage.getItem('last_barbershop_slug') || 'default'}/inventory`} replace /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={['barber']}><Navigate to={`/b/${localStorage.getItem('last_barbershop_slug') || 'default'}/settings`} replace /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to={user?.role === 'customer' ? `/b/${localStorage.getItem('last_barbershop_slug') || 'default'}/booking` : `/b/${localStorage.getItem('last_barbershop_slug') || 'default'}`} replace />} />
        </Routes>
        </div>
      </main>

      {user?.role === 'barber' && (
        <>
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-t border-white/5 h-[72px] px-2 flex justify-around items-center z-50 pb-safe">
            <MobileNavButton 
              active={activeTab === 'calendar'} 
              onClick={() => handleNavigation('/')} 
              icon={<Calendar />} 
              label="Agenda"
            />
            <MobileNavButton 
              active={activeTab === 'services'} 
              onClick={() => handleNavigation('/services')} 
              icon={<Scissors />} 
              label="Serviços"
            />
            <MobileNavButton 
              active={activeTab === 'customers'} 
              onClick={() => handleNavigation('/customers')} 
              icon={<Users />} 
              label="Clientes"
            />
            <MobileNavButton 
              active={activeTab === 'settings'} 
              onClick={() => handleNavigation('/settings?tab=schedule')} 
              icon={<Clock />} 
              label="Horários"
            />
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 text-gray-500`}
            >
              <Menu size={20} strokeWidth={2} />
              <span className="text-[9px] font-bold uppercase tracking-[0.05em] opacity-60">Menu</span>
            </button>
          </nav>

          {isMobileMenuOpen && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[60] flex flex-col p-6 animate-fadeIn md:hidden overflow-y-auto">
              {/* Header do Menu */}
              <div className="flex justify-between items-start mb-8 pt-4">
                <div className="flex flex-col gap-4">
                  {/* Logo da Marca - Sempre Visível */}
                  <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-[22px] shadow-sm w-fit">
                    <img src={brandLogo} className="h-6 w-auto object-contain" alt="AutoOpera" />
                    <div className="w-px h-4 bg-gray-200" />
                    <span className="text-lg font-bold text-[#007AFF] tracking-tighter">Barber</span>
                  </div>

                  {/* Nome da Barbearia */}
                  {barbershop?.name && (
                    <div className="flex items-center gap-2 px-1">
                      {barbershop?.logo && (
                        <img src={getMediaUrl(barbershop.logo)} className="w-5 h-5 rounded-md object-cover" alt="Logo" />
                      )}
                      <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{barbershop.name}</h2>
                    </div>
                  )}
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="bg-white/10 p-3 rounded-2xl text-white active:scale-95 transition-transform"><X size={24} /></button>
              </div>

              {/* Seções de Navegação */}
              <div className="space-y-8 pb-12">
                
                {/* Atendimento */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[#007AFF] uppercase tracking-[0.3em] px-2">Atendimento</label>
                  <div className="space-y-2">
                    <MobileMenuRow 
                      active={activeTab === 'calendar'} 
                      onClick={() => handleNavigation('/')} 
                      icon={<Calendar />} 
                      label="Agenda Geral" 
                      description="Próximos cortes"
                    />
                    <MobileMenuRow 
                      active={activeTab === 'customers'} 
                      onClick={() => handleNavigation('/customers')} 
                      icon={<Users />} 
                      label="Meus Clientes" 
                      description="Base de dados"
                    />
                    <MobileMenuRow 
                      active={activeTab === 'services'} 
                      onClick={() => handleNavigation('/services')} 
                      icon={<Scissors />} 
                      label="Serviços" 
                      description="Preços e duração"
                    />
                  </div>
                </div>

                {/* Gestão */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[#007AFF] uppercase tracking-[0.3em] px-2">Gestão</label>
                  <div className="space-y-2">
                    <MobileMenuRow 
                      active={activeTab === 'dashboard'} 
                      onClick={() => handleNavigation('/dashboard')} 
                      icon={<LayoutDashboard />} 
                      label="Resumo e Dashboard" 
                      description="Visão do negócio"
                    />
                    <MobileMenuRow 
                      active={activeTab === 'finance'} 
                      onClick={() => handleNavigation('/finance')} 
                      icon={<DollarSign />} 
                      label="Fluxo Financeiro" 
                      description="Ganhos e despesas"
                    />
                    <MobileMenuRow 
                      active={activeTab === 'inventory'} 
                      onClick={() => handleNavigation('/inventory')} 
                      icon={<Package />} 
                      label="Estoque de Produtos" 
                      description="Vendas e itens"
                    />
                  </div>
                </div>

                {/* Ajustes */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[#007AFF] uppercase tracking-[0.3em] px-2">Configurações</label>
                  <div className="space-y-2">
                    <MobileMenuRow 
                      active={activeTab === 'settings' && location.search.includes('tab=shop')} 
                      onClick={() => handleNavigation('/settings?tab=shop')} 
                      icon={<Settings />} 
                      label="Minha Barbearia" 
                      description="Perfil público"
                    />
                    <MobileMenuRow 
                      active={activeTab === 'settings' && location.search.includes('tab=schedule')} 
                      onClick={() => handleNavigation('/settings?tab=schedule')} 
                      icon={<Clock />} 
                      label="Gestão de Horários" 
                      description="Work hours"
                    />
                    <MobileMenuRow 
                      active={activeTab === 'settings' && location.search.includes('tab=profile')} 
                      onClick={() => handleNavigation('/settings?tab=profile')} 
                      icon={<User />} 
                      label="Meu Perfil" 
                      description="Dados pessoais"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 p-5 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 font-bold uppercase tracking-widest text-[11px] active:scale-95 transition-all"
                  >
                    <LogOut size={18} />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
