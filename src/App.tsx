
import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
  X
} from 'lucide-react';
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

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
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
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getActiveTab = (pathname: string) => {
    if (pathname === '/') return 'dashboard';
    return pathname.substring(1);
  };

  const activeTab = getActiveTab(location.pathname);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] flex flex-col md:flex-row">
      <Toaster position="top-center" toastOptions={{
        style: {
          background: 'rgba(28, 28, 30, 0.8)',
          backdropFilter: 'blur(20px)',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '500'
        }
      }} />
      <nav className="hidden md:flex flex-col w-72 bg-black border-r border-[#1c1c1e] h-screen sticky top-0 p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-[#007AFF] p-2.5 rounded-xl shadow-[0_5px_15px_rgba(0,122,255,0.3)]">
            <Scissors className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Barber<span className="text-[#007AFF]">Flow</span></h1>
        </div>
        <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar">
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
        <div className="mt-auto pt-8 border-t border-[#1c1c1e]">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-[#1c1c1e] flex items-center justify-center border border-[#007AFF]/20">
              <User className="w-5 h-5 text-[#007AFF]" />
            </div>
            <div>
              <p className="text-sm font-medium">Willian Cut</p>
              <p className="text-[10px] text-[#007AFF] uppercase tracking-widest font-bold">Admin</p>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <Routes>
          <Route path="/" element={
            <Dashboard 
              appointments={appointments} 
              setAppointments={setAppointments}
              services={services} 
              customers={customers} 
              setTransactions={setTransactions}
              waitingListCount={waitingList.length} 
              onNavigateToPromotions={() => handleNavigation('/promotions')} 
            />
          } />
          <Route path="/calendar" element={
            <CalendarPage 
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
          } />
          <Route path="/services" element={<Services services={services} setServices={setServices} />} />
          <Route path="/customers" element={<Customers customers={customers} setCustomers={setCustomers} />} />
          <Route path="/finance" element={<Finance transactions={transactions} setTransactions={setTransactions} />} />
          <Route path="/reports" element={<Reports appointments={appointments} services={services} onNavigateToPromotions={() => handleNavigation('/promotions')} />} />
          <Route path="/promotions" element={<Promotions services={services} customers={customers} />} />
          <Route path="/inventory" element={<Inventory products={products} setProducts={setProducts} />} />
          <Route path="/settings" element={<SettingsPage availability={availability} setAvailability={setAvailability} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

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
        </div>
      )}
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 ${active ? 'bg-[#007AFF] text-white font-semibold shadow-[0_10px_20px_rgba(0,122,255,0.2)] scale-[1.02]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 18 }) : icon}
    <span className="text-sm">{label}</span>
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

export default App;
