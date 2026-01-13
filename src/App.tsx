
import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import { Service, Appointment, Availability, Customer, Transaction, Product, WaitingListEntry } from './types';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/Calendar';
import Services from './pages/Services';
import SettingsPage from './pages/Settings';
import Customers from './pages/Customers';
import Finance from './pages/Finance';
import Reports from './pages/Reports';
import Promotions from './pages/Promotions';
import Inventory from './pages/Inventory';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getActiveTab = (pathname: string) => {
    if (pathname === '/') return 'dashboard';
    return pathname.substring(1);
  };

  const activeTab = getActiveTab(location.pathname);

  const [services, setServices] = useState<Service[]>([
    { id: '1', name: 'Corte Social', price: 45, duration: 45, commission: 50, description: 'Corte tradicional.' },
    { id: '2', name: 'Barba Terapia', price: 35, duration: 30, commission: 40, description: 'Toalha quente.' },
    { id: '3', name: 'Combo Completo', price: 70, duration: 75, commission: 50, description: 'Corte + Barba.' }
  ]);

  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: '101', clientName: 'João Silva', serviceId: '1', date: new Date().toISOString(), status: 'completed', platform: 'whatsapp' },
    { id: '102', clientName: 'Marcos Oliveira', serviceId: '3', date: new Date(Date.now() + 3600000).toISOString(), status: 'confirmed', platform: 'whatsapp' },
    { id: '103', clientName: 'Rafael Souza', serviceId: '2', date: new Date(Date.now() + 7200000).toISOString(), status: 'pending', platform: 'manual' }
  ]);

  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([
    { id: 'w1', customerName: 'Carlos Dutra', customerPhone: '11912345678', serviceId: '1', date: new Date().toISOString().split('T')[0], preferredPeriod: 'afternoon', createdAt: new Date().toISOString() },
    { id: 'w2', customerName: 'Felipe Neto', customerPhone: '11987654321', serviceId: '3', date: new Date().toISOString().split('T')[0], preferredPeriod: 'any', createdAt: new Date().toISOString() }
  ]);

  const [customers, setCustomers] = useState<Customer[]>([
    { id: 'c1', name: 'João Silva', phone: '(11) 99999-9999', lastVisit: '2023-10-25', totalSpent: 450, notes: 'Prefere degradê médio.', points: 450 },
    { id: 'c2', name: 'Marcos Oliveira', phone: '(11) 88888-8888', lastVisit: '2023-11-01', totalSpent: 1200, notes: 'Usa barba lenhador.', points: 1200 }
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 't1', description: 'Corte Social - João Silva', amount: 45, type: 'income', category: 'Serviço', date: new Date().toISOString(), status: 'paid', paymentMethod: 'pix' },
    { id: 't2', description: 'Aluguel Sala', amount: 1200, type: 'expense', category: 'Infraestrutura', date: new Date().toISOString(), status: 'pending' },
    { id: 't3', description: 'Produtos Barba (Distribuidora)', amount: 250, type: 'expense', category: 'Insumos', date: new Date().toISOString(), status: 'paid' },
  ]);

  const [products, setProducts] = useState<Product[]>([
    { id: 'p1', name: 'Pomada Efeito Matte 150g', category: 'venda', stock: 12, minStock: 5, costPrice: 18.50, salePrice: 45.00, lastRestock: '2023-11-10' },
    { id: 'p2', name: 'Cerveja Artesanal IPA', category: 'bar', stock: 4, minStock: 10, costPrice: 8.00, salePrice: 15.00, lastRestock: '2023-11-15' },
    { id: 'p3', name: 'Capa de Corte Premium', category: 'consumo', stock: 2, minStock: 1, costPrice: 35.00, lastRestock: '2023-09-01' },
    { id: 'p4', name: 'Óleo para Barba 30ml', category: 'venda', stock: 1, minStock: 3, costPrice: 12.00, salePrice: 35.00, expiryDate: '2023-12-01' }
  ]);

  const [availability, setAvailability] = useState<Availability[]>([
    { dayOfWeek: 1, startTime: '09:00', endTime: '19:00', isActive: true },
    { dayOfWeek: 2, startTime: '09:00', endTime: '19:00', isActive: true },
    { dayOfWeek: 3, startTime: '09:00', endTime: '19:00', isActive: true },
    { dayOfWeek: 4, startTime: '09:00', endTime: '19:00', isActive: true },
    { dayOfWeek: 5, startTime: '09:00', endTime: '21:00', isActive: true },
    { dayOfWeek: 6, startTime: '08:00', endTime: '18:00', isActive: true },
    { dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isActive: false },
  ]);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col md:flex-row">
      <nav className="hidden md:flex flex-col w-64 bg-[#0a0a0a] border-r border-gray-800 h-screen sticky top-0 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-yellow-500 p-2 rounded-lg">
            <Scissors className="text-black w-6 h-6" />
          </div>
          <h1 className="text-2xl font-oswald font-bold tracking-wider">BARBER<span className="text-yellow-500">FLOW</span></h1>
        </div>
        <div className="flex flex-col gap-1 custom-scrollbar overflow-y-auto">
          <NavButton active={activeTab === 'dashboard'} onClick={() => handleNavigation('/')} icon={<LayoutDashboard />} label="Dashboard" />
          <NavButton active={activeTab === 'calendar'} onClick={() => handleNavigation('/calendar')} icon={<Calendar />} label="Agenda" />
          <NavButton active={activeTab === 'services'} onClick={() => handleNavigation('/services')} icon={<Scissors />} label="Serviços" />
          <NavButton active={activeTab === 'customers'} onClick={() => handleNavigation('/customers')} icon={<Users />} label="Clientes" />
          <NavButton active={activeTab === 'finance'} onClick={() => handleNavigation('/finance')} icon={<DollarSign />} label="Financeiro" />
          <NavButton active={activeTab === 'inventory'} onClick={() => handleNavigation('/inventory')} icon={<Package />} label="Estoque" />
          <NavButton active={activeTab === 'promotions'} onClick={() => handleNavigation('/promotions')} icon={<Megaphone />} label="Promoções" />
          <NavButton active={activeTab === 'reports'} onClick={() => handleNavigation('/reports')} icon={<BarChart3 />} label="Relatórios" />
          <NavButton active={activeTab === 'settings'} onClick={() => handleNavigation('/settings')} icon={<Settings />} label="Ajustes" />
        </div>
        <div className="mt-auto pt-6 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border border-yellow-500/50">
              <User className="w-5 h-5 text-yellow-500" />
            </div>
            <div><p className="text-sm font-semibold">Willian Cut</p><p className="text-xs text-gray-500">Master</p></div>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<Dashboard appointments={appointments} services={services} waitingListCount={waitingList.length} onNavigateToPromotions={() => handleNavigation('/promotions')} />} />
          <Route path="/calendar" element={<CalendarPage availability={availability} setAvailability={setAvailability} waitingList={waitingList} setWaitingList={setWaitingList} services={services} />} />
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

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-gray-800 px-2 py-2 flex justify-around items-center z-50">
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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[60] flex flex-col p-6 animate-fadeIn md:hidden">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-oswald font-bold uppercase tracking-widest">Menu <span className="text-yellow-500">Completo</span></h2>
            <button onClick={() => setIsMobileMenuOpen(false)} className="bg-gray-800 p-2 rounded-full"><X size={24} /></button>
          </div>
          <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-10">
            <MenuCard active={activeTab === 'inventory'} onClick={() => handleNavigation('/inventory')} icon={<Package />} label="Estoque" />
            <MenuCard active={activeTab === 'promotions'} onClick={() => handleNavigation('/promotions')} icon={<Megaphone />} label="Promoções" />
            <MenuCard active={activeTab === 'reports'} onClick={() => handleNavigation('/reports')} icon={<BarChart3 />} label="Relatórios" />
            <MenuCard active={activeTab === 'services'} onClick={() => handleNavigation('/services')} icon={<Scissors />} label="Serviços" />
            <MenuCard active={activeTab === 'settings'} onClick={() => handleNavigation('/settings')} icon={<Settings />} label="Ajustes" />
          </div>
        </div>
      )}
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active ? 'bg-yellow-500 text-black font-bold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 20 }) : icon}
    <span>{label}</span>
  </button>
);

const MobileNavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode }> = ({ active, onClick, icon }) => (
  <button onClick={onClick} className={`p-3 rounded-2xl transition-all ${active ? 'bg-yellow-500 text-black' : 'text-gray-500'}`}>{icon}</button>
);

const MenuCard: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border transition-all ${active ? 'bg-yellow-500 border-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-gray-900/50 border-gray-800 text-gray-400'}`}
  >
    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 28 }) : icon}
    <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
  </button>
);

export default App;
