
import React from 'react';
import { Appointment, Service, Customer, Transaction } from '../types';
import { Clock, User, CheckCircle2, TrendingUp, Wallet, Megaphone, ArrowRight, ListOrdered, Trophy, ChevronRight, Check } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { appointmentsApi, transactionsApi } from '../api';
import toast from 'react-hot-toast';

interface Props {
  userName?: string;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  services: Service[];
  customers: Customer[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  onNavigateToPromotions?: () => void;
}

const DashboardView: React.FC<Props> = ({ 
  userName,
  appointments, 
  setAppointments,
  services, 
  customers, 
  setTransactions,
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
  
  // Estatísticas de serviços prestados
  const serviceStats = services.map(s => {
    const count = completedApts.filter(a => a.serviceId === s.id).length;
    return { name: s.name, count };
  }).filter(s => s.count > 0).sort((a, b) => b.count - a.count);

  const handleFinishAppointment = async (apt: Appointment) => {
    try {
      const updated = await appointmentsApi.complete(apt.id);
      
      const price = getServicePrice(apt.serviceId);
      setAppointments(prev => prev.map(a => a.id === apt.id ? updated : a));
      
      // We don't need to manually create transaction here as backend does it
      // But we might want to refresh transactions if the parent component needs it
      // For now, let's just show success
      toast.success(`Serviço de ${apt.clientName} finalizado! +R$ ${price}`);
    } catch (error) {
      console.error("Erro ao finalizar:", error);
      toast.error("Erro ao processar finalização.");
    }
  };

  return (
    <div className="space-y-8 sm:space-y-12 animate-fadeIn max-w-[1200px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">Resumo <span className="text-gray-500">Hoje</span></h2>
          <p className="text-gray-500 mt-1 sm:mt-2 font-medium text-xs sm:text-base">Acompanhe seus cortes e desempenho atual.</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        <StatCard title="Faturamento" value={`R$ ${totalRevenue}`} icon={<Wallet className="text-white/60" size={18} />} />
        <StatCard title="Cortes" value={completedApts.length.toString()} icon={<CheckCircle2 className="text-white/60" size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12 pt-4">
        <section className="col-span-1 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Para Finalizar
            </h3>
            <span className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] bg-white/5 px-3 py-1 rounded-full border border-white/5">Deslize para concluir</span>
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
                      <CheckCircle2 size={48} className="text-white/10 mx-auto mb-6" />
                      <p className="text-gray-400 text-sm font-semibold">Tudo em dia!</p>
                      <p className="text-gray-600 text-xs mt-2">Nenhum atendimento pendente no momento.</p>
                   </motion.div>
                )}
             </AnimatePresence>
          </div>
        </section>

        <section className="space-y-8">
          <div className="bg-[#1c1c1e] border border-white/5 rounded-[32px] p-8 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-6 font-bold">Metas do Período</h3>
            <div className="space-y-8">
              <GoalCard label="Atendimentos" current={completedApts.length} target={15} color="bg-accent" />
              <GoalCard label="Faturamento" current={totalRevenue} target={1500} color="bg-accent" />
            </div>
          </div>

          <div className="bg-[#1c1c1e] border border-white/5 rounded-[32px] p-8 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-6 font-bold">Serviços Mais Prestados</h3>
            <div className="space-y-5">
              {serviceStats.map(stat => (
                <div key={stat.name} className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                  <span className="text-sm font-bold text-gray-400">{stat.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">{stat.count}</span>
                    <span className="text-[9px] font-black uppercase text-gray-600 tracking-tighter">unid.</span>
                  </div>
                </div>
              ))}
              {serviceStats.length === 0 && (
                <p className="text-[11px] text-gray-600 font-medium text-center">Nenhum serviço prestado ainda.</p>
              )}
            </div>
          </div>
          
          <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-8">
             <h4 className="text-white/60 font-bold text-sm mb-3 flex items-center gap-2">
                <TrendingUp size={16} /> Insights
             </h4>
             <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Seus clientes VIPs estão retornando menos este mês. <span className="text-accent cursor-pointer hover:underline underline-offset-4 font-semibold">Agendar lembretes?</span>
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
            <User size={24} className="text-white/60" />
          </div>
          <div>
            <h4 className="font-bold text-white text-lg tracking-tight">{apt.clientName}</h4>
            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 mt-1.5">
               <span className="text-[10px] sm:text-[11px] text-white/50 font-bold tracking-tight bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{serviceName}</span>
               <div className="hidden sm:block w-1 h-1 rounded-full bg-white/20"></div>
               <span className="text-[9px] sm:text-[10px] text-white/40 font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{apt.platform}</span>
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
  <div className="bg-[#1c1c1e] border border-white/5 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] hover:bg-[#2c2c2e] transition-all group">
    <div className="flex justify-between items-start mb-3 sm:mb-4">
      <span className="text-gray-500 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em]">{title}</span>
      <div className="bg-white/5 p-1.5 sm:p-2 rounded-lg sm:rounded-xl group-hover:bg-white/10 transition-colors">
        {icon}
      </div>
    </div>
    <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">{value}</div>
  </div>
);

const GoalCard: React.FC<{ label: string, current: number, target: number, color: string }> = ({ label, current, target, color }) => (
  <div className="space-y-3 sm:space-y-4">
    <div className="flex justify-between text-[10px] sm:text-[11px] font-bold uppercase tracking-widest leading-none">
      <span className="text-gray-500">{label}</span>
      <span className="text-white">{current} <span className="text-gray-600">/ {target}</span></span>
    </div>
    <div className="w-full bg-black/40 h-1 sm:h-1.5 rounded-full overflow-hidden">
      <div 
        className={`${color} h-full transition-all duration-1000`} 
        style={{ width: `${Math.min((current/target)*100, 100)}%` }}
      ></div>
    </div>
  </div>
);

export default DashboardView;

