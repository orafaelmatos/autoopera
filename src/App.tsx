
import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
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
  LogOut
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { Service, Appointment, Availability, Customer, Transaction, Product, WaitingListEntry, ScheduleException } from './types';
import { 
  servicesApi, 
  customersApi, 
  appointmentsApi, 
  transactionsApi, 
  productsApi, 
  availabilityApi, 
  waitingListApi,
  scheduleExceptionsApi
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

const MobileNavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode }> = ({ active, onClick, icon }) => (
  <button onClick={onClick} className={`p-3 rounded-2xl transition-all ${active ? 'bg-[#007AFF] text-white' : 'text-gray-500 hover:text-white'}`}>{icon}</button>
);

const MenuCard: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-3 p-8 rounded-[32px] border transition-all duration-300 ${active ? 'bg-[#007AFF] border-[#007AFF] text-white shadow-xl scale-[1.02]' : 'bg-[#1c1c1e] border-white/5 text-gray-400 hover:border-white/10'}`}
  >
    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 28 }) : icon}
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode, allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#007AFF]/20 border-t-[#007AFF] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'customer' ? '/booking' : '/'} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isLoading: authLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  React.useEffect(() => {
    if (!user || user.role !== 'barber') return;

    const fetchData = async () => {
      try {
        const [
          servicesData, 
          appointmentsData, 
          waitingListData, 
          customersData, 
          transactionsData, 
          productsData, 
          availabilityData,
          exceptionsData
        ] = await Promise.all([
          servicesApi.getAll(),
          appointmentsApi.getAll(),
          waitingListApi.getAll(),
          customersApi.getAll(),
          transactionsApi.getAll(),
          productsApi.getAll(),
          availabilityApi.getAll(),
          scheduleExceptionsApi.getAll()
        ]);

        setServices(servicesData);
        setAppointments(appointmentsData);
        setWaitingList(waitingListData);
        setCustomers(customersData);
        setTransactions(transactionsData);
        setProducts(productsData);
        setAvailability(availabilityData);
        setExceptions(exceptionsData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [user]);

  const getActiveTab = (pathname: string) => {
    if (pathname === '/') return 'dashboard';
    return pathname.substring(1);
  };

  const activeTab = getActiveTab(location.pathname);

  const handleNavigation = (path: string) => {
    navigate(path);
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

  // Se o usuário é um cliente e está tentando acessar a dashboard, redireciona para o booking
  if (user && user.role === 'customer' && !location.pathname.startsWith('/booking')) {
    return <Navigate to="/booking" replace />;
  }

  // Se o usuário é um barbeiro e está na raiz, a dashboard é mostrada
  // Se não está logado, mostra login

  return (
    <div className={`min-h-screen bg-black text-[#f5f5f7] ${user?.role === 'barber' ? 'flex flex-col md:flex-row' : ''}`}>
      <Toaster position="top-center" />
      
      {user?.role === 'barber' && (
        <nav className="hidden md:flex flex-col w-72 bg-black border-r border-[#1c1c1e] h-screen sticky top-0 p-8">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-[#007AFF] p-2.5 rounded-xl shadow-[0_5px_15px_rgba(0,122,255,0.3)]">
              <Scissors className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Barber<span className="text-[#007AFF]">Flow</span></h1>
          </div>
          <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-2">
            <NavButton active={activeTab === 'dashboard'} onClick={() => handleNavigation('/')} icon={<LayoutDashboard size={20} />} label="Início" />
            <NavButton active={activeTab === 'calendar'} onClick={() => handleNavigation('/calendar')} icon={<Calendar size={20} />} label="Agenda" />
            <NavButton active={activeTab === 'services'} onClick={() => handleNavigation('/services')} icon={<Scissors size={20} />} label="Serviços" />
            <NavButton active={activeTab === 'customers'} onClick={() => handleNavigation('/customers')} icon={<Users size={20} />} label="Clientes" />
            <NavButton active={activeTab === 'finance'} onClick={() => handleNavigation('/finance')} icon={<DollarSign size={20} />} label="Financeiro" />
            <NavButton active={activeTab === 'inventory'} onClick={() => handleNavigation('/inventory')} icon={<Package size={20} />} label="Estoque" />
            <NavButton active={activeTab === 'promotions'} onClick={() => handleNavigation('/promotions')} icon={<Megaphone size={20} />} label="Marketing" />
            <NavButton active={activeTab === 'reports'} onClick={() => handleNavigation('/reports')} icon={<BarChart3 size={20} />} label="Analytics" />
            <NavButton active={activeTab === 'settings'} onClick={() => handleNavigation('/settings')} icon={<Settings size={20} />} label="Ajustes" />
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

      <main className={`flex-1 ${user?.role === 'barber' ? 'p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto max-w-7xl mx-auto w-full' : ''}`}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/booking" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerBooking />
            </ProtectedRoute>
          } />
          
          <Route path="/" element={
            <ProtectedRoute allowedRoles={['barber']}>
              <Dashboard 
                userName={user?.name?.split(' ')[0]}
                appointments={appointments} 
                setAppointments={setAppointments}
                services={services} 
                customers={customers} 
                setTransactions={setTransactions}
                waitingListCount={waitingList.length} 
                onNavigateToPromotions={() => handleNavigation('/promotions')} 
              />
            </ProtectedRoute>
          } />
          
          <Route path="/calendar" element={
            <ProtectedRoute allowedRoles={['barber']}>
              <CalendarPage 
                barberId={user?.profile_id?.toString()}
                availability={availability} 
                setAvailability={setAvailability} 
                waitingList={waitingList} 
                setWaitingList={setWaitingList} 
                services={services} 
                appointments={appointments} 
                setAppointments={setAppointments}
                exceptions={exceptions}
                setExceptions={setExceptions}
              />
            </ProtectedRoute>
          } />

          <Route path="/services" element={
            <ProtectedRoute allowedRoles={['barber']}>
              <Services services={services} setServices={setServices} />
            </ProtectedRoute>
          } />

          <Route path="/customers" element={
            <ProtectedRoute allowedRoles={['barber']}>
              <Customers customers={customers} setCustomers={setCustomers} />
            </ProtectedRoute>
          } />

          <Route path="/finance" element={
            <ProtectedRoute allowedRoles={['barber']}>
              <Finance transactions={transactions} setTransactions={setTransactions} />
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['barber']}>
              <Reports appointments={appointments} services={services} onNavigateToPromotions={() => handleNavigation('/promotions')} />
            </ProtectedRoute>
          } />

          <Route path="/promotions" element={
            <ProtectedRoute allowedRoles={['barber']}>
              <Promotions services={services} customers={customers} />
            </ProtectedRoute>
          } />

          <Route path="/inventory" element={
            <ProtectedRoute allowedRoles={['barber']}>
              <Inventory products={products} setProducts={setProducts} />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['barber']}>
              <SettingsPage availability={availability} setAvailability={setAvailability} />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to={user?.role === 'customer' ? "/booking" : "/"} replace />} />
        </Routes>
      </main>

      {user?.role === 'barber' && (
        <>
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/5 px-2 py-2 flex justify-around items-center z-50">
            <MobileNavButton active={activeTab === 'dashboard'} onClick={() => handleNavigation('/')} icon={<LayoutDashboard size={20} />} />
            <MobileNavButton active={activeTab === 'calendar'} onClick={() => handleNavigation('/calendar')} icon={<Calendar size={20} />} />
            <MobileNavButton active={activeTab === 'customers'} onClick={() => handleNavigation('/customers')} icon={<Users size={20} />} />
            <MobileNavButton active={activeTab === 'finance'} onClick={() => handleNavigation('/finance')} icon={<DollarSign size={20} />} />
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className={`p-3 rounded-2xl transition-all text-gray-500 hover:text-white`}
            >
              <Menu size={20} />
            </button>
          </nav>

          {isMobileMenuOpen && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[60] flex flex-col p-8 animate-fadeIn md:hidden">
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-xl font-bold tracking-tight">Barber<span className="text-[#007AFF]">Flow</span></h2>
                <button onClick={() => setIsMobileMenuOpen(false)} className="bg-white/10 p-2 rounded-full"><X size={24} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-10">
                <MenuCard active={activeTab === 'dashboard'} onClick={() => handleNavigation('/')} icon={<LayoutDashboard />} label="Início" />
                <MenuCard active={activeTab === 'inventory'} onClick={() => handleNavigation('/inventory')} icon={<Package />} label="Estoque" />
                <MenuCard active={activeTab === 'promotions'} onClick={() => handleNavigation('/promotions')} icon={<Megaphone />} label="Marketing" />
                <MenuCard active={activeTab === 'reports'} onClick={() => handleNavigation('/reports')} icon={<BarChart3 />} label="Analytics" />
                <MenuCard active={activeTab === 'services'} onClick={() => handleNavigation('/services')} icon={<Scissors />} label="Serviços" />
                <MenuCard active={activeTab === 'settings'} onClick={() => handleNavigation('/settings')} icon={<Settings />} label="Ajustes" />
              </div>
              <button 
                onClick={handleLogout}
                className="mt-auto flex items-center justify-center gap-3 p-6 bg-red-500/10 text-red-500 rounded-[32px] border border-red-500/20"
              >
                <LogOut size={20} />
                <span className="font-bold uppercase tracking-widest text-xs">Sair da Conta</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
