
import React from 'react';
import { Appointment, Service, Customer, Transaction } from '../types';
import { Clock, User, CheckCircle2, TrendingUp, Wallet, Megaphone, ArrowRight, ListOrdered, Trophy, ChevronRight, Check } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { appointmentsApi, transactionsApi } from '../api';
import toast from 'react-hot-toast';

interface Props {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  services: Service[];
  customers: Customer[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  waitingListCount: number;
  onNavigateToPromotions?: () => void;
}

const DashboardView: React.FC<Props> = ({ 
  appointments, 
  setAppointments,
  services, 
  customers, 
  setTransactions,
  waitingListCount, 
  onNavigateToPromotions 
}) => {
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'Serviço';
  const getServicePrice = (id: string) => services.find(s => s.id === id)?.price || 0;

  // Filtra apenas agendamentos de hoje (ignora cancelados e completados)
  const today = new Date().toLocaleDateString('en-CA');
  const todayAppointments = appointments.filter(a => 
    a.date.startsWith(today) && 
    a.status !== 'cancelled' && 
    a.status !== 'completed'
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const completedApts = appointments.filter(a => a.status === 'completed');
  const totalRevenue = completedApts.reduce((acc, apt) => acc + getServicePrice(apt.serviceId), 0);
  const totalPoints = customers.reduce((acc, c) => acc + (c.points || 0), 0);

  const handleFinishAppointment = async (apt: Appointment) => {
    try {
      await appointmentsApi.update(apt.id, { status: 'completed' });
      
      const price = getServicePrice(apt.serviceId);
      const newTransaction = await transactionsApi.create({
        description: `Corte: ${apt.clientName} (${getServiceName(apt.serviceId)})`,
        amount: price,
        type: 'income',
        category: 'Serviço',
        date: new Date().toISOString(),
        status: 'paid',
        paymentMethod: 'pix'
      });

      setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, status: 'completed' } : a));
      setTransactions(prev => [newTransaction, ...prev]);
      
      toast.success(`Serviço de ${apt.clientName} finalizado! +R$ ${price}`);
    } catch (error) {
      console.error("Erro ao finalizar:", error);
      toast.error("Erro ao processar finalização.");
    }
  };

  return (
    <div className="space-y-12 animate-fadeIn max-w-[1200px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white">Olá, <span className="text-gray-500">Willian</span></h2>
          <p className="text-gray-500 mt-2 font-medium">Aqui está o resumo do seu dia.</p>
        </div>
        <button 
          onClick={onNavigateToPromotions}
          className="bg-[#007AFF] text-white px-6 py-3 rounded-2xl text-[13px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#0063CC] transition-all shadow-[0_10px_20px_rgba(0,122,255,0.2)] active:scale-95"
        >
          <Megaphone size={16} /> 
          Marketing 
          <ArrowRight size={14} />
        </button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Caixa do Dia" value={`R$ ${totalRevenue}`} icon={<Wallet className="text-[#007AFF]" size={20} />} />
        <StatCard title="Concluídos" value={completedApts.length.toString()} icon={<CheckCircle2 className="text-[#007AFF]" size={20} />} />
        <StatCard title="Lista de Espera" value={waitingListCount.toString()} icon={<ListOrdered className="text-[#007AFF]" size={20} />} />
        <StatCard title="Pontos Ganhos" value={totalPoints > 1000 ? `${(totalPoints/1000).toFixed(1)}k` : totalPoints.toString()} icon={<Trophy className="text-[#007AFF]" size={20} />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-12 pt-4">
        <section className="col-span-1 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
              Agenda de Hoje
            </h3>
            <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-[0.2em] bg-[#007AFF]/10 px-3 py-1 rounded-full">Deslize para finalizar</span>
          </div>
          
          <div className="space-y-4">
             <AnimatePresence>
                {todayAppointments.length > 0 ? (
                   todayAppointments.map(apt => (
                      <SwipeableAppointment 
                        key={apt.id} 
                        apt={apt} 
                        serviceName={getServiceName(apt.serviceId)} 
                        onFinish={() => handleFinishAppointment(apt)} 
                      />
                   ))
                ) : (
                   <motion.div 
                     key="empty"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className="bg-[#1c1c1e] border border-white/5 rounded-[32px] p-20 text-center"
                   >
                      <CheckCircle2 size={48} className="text-[#007AFF]/20 mx-auto mb-6" />
                      <p className="text-gray-400 text-sm font-semibold">Tudo em dia!</p>
                      <p className="text-gray-600 text-xs mt-2">Nenhum atendimento pendente no momento.</p>
                   </motion.div>
                )}
             </AnimatePresence>
          </div>
        </section>

        <section className="space-y-8">
          <div className="bg-[#1c1c1e] border border-white/5 rounded-[32px] p-8 shadow-sm">
            <h3 className="text-lg font-bold tracking-tight mb-8">
               Metas do Período
            </h3>
            <div className="space-y-8">
              <GoalCard label="Atendimentos" current={completedApts.length} target={15} color="bg-[#007AFF]" />
              <GoalCard label="Faturamento" current={totalRevenue} target={1500} color="bg-[#007AFF]" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#007AFF]/10 to-transparent border border-[#007AFF]/5 rounded-[32px] p-8">
             <h4 className="text-[#007AFF] font-bold text-sm mb-3 flex items-center gap-2">
                <TrendingUp size={16} /> Insights
             </h4>
             <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Seus clientes VIPs estão retornando menos este mês. <span className="text-[#007AFF] cursor-pointer hover:underline underline-offset-4 font-semibold">Agendar lembretes?</span>
             </p>
          </div>
        </section>
      </div>
    </div>
  );
};

const SwipeableAppointment: React.FC<{ apt: Appointment, serviceName: string, onFinish: () => void }> = ({ apt, serviceName, onFinish }) => {
  const x = useMotionValue(0);
  const background = useTransform(x, [0, 150], ['rgba(28, 28, 30, 1)', '#007AFF']);
  const checkColor = useTransform(x, [100, 150], ['rgba(255, 255, 255, 0)', '#FFFFFF']);
  const opacity = useTransform(x, [50, 150], [0, 1]);
  const scale = useTransform(x, [0, 150], [0.8, 1]);

  return (
    <motion.div 
      exit={{ x: 500, opacity: 0 }}
      layout
      className="relative overflow-hidden rounded-[24px] bg-[#1c1c1e] border border-white/5 shadow-sm"
    >
      <motion.div 
        style={{ background }}
        className="absolute inset-0 flex items-center pl-8 pointer-events-none"
      >
         <motion.div style={{ opacity, scale }}>
            <motion.div style={{ color: checkColor }}>
               <Check size={32} strokeWidth={3} />
            </motion.div>
         </motion.div>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 250 }}
        dragElastic={0.05}
        onDragEnd={(_, info) => {
          if (info.offset.x > 180) {
            onFinish();
          }
        }}
        style={{ x }}
        className="relative bg-[#1c1c1e] p-6 flex items-center justify-between cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-5">
          <div className="bg-black/40 p-3.5 rounded-2xl border border-white/5">
            <User size={24} className="text-[#007AFF]" />
          </div>
          <div>
            <h4 className="font-bold text-white text-lg tracking-tight">{apt.clientName}</h4>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[11px] text-gray-500 font-semibold tracking-tight">{serviceName}</span>
               <div className="w-1 h-1 rounded-full bg-[#007AFF]/30"></div>
               <span className="text-[10px] text-[#007AFF]/80 font-bold uppercase tracking-widest">{apt.platform}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xl font-bold text-white tracking-tight">
              {new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <ChevronRight className="text-white/10" size={20} />
        </div>
      </motion.div>
    </motion.div>
  );
};

const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-[#1c1c1e] border border-white/5 p-8 rounded-[32px] hover:bg-[#2c2c2e] transition-all group">
    <div className="flex justify-between items-start mb-6">
      <span className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">{title}</span>
      <div className="bg-white/5 p-2 rounded-xl group-hover:bg-white/10 transition-colors">
        {icon}
      </div>
    </div>
    <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
  </div>
);

const GoalCard: React.FC<{ label: string, current: number, target: number, color: string }> = ({ label, current, target, color }) => (
  <div className="space-y-4">
    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest leading-none">
      <span className="text-gray-500">{label}</span>
      <span className="text-white">{current} <span className="text-gray-600">/ {target}</span></span>
    </div>
    <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
      <div 
        className={`${color} h-full transition-all duration-1000`} 
        style={{ width: `${Math.min((current/target)*100, 100)}%` }}
      ></div>
    </div>
  </div>
);

export default DashboardView;

