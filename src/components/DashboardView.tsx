
import React from 'react';
import { Appointment, Service } from '../types';
import { Clock, User, CheckCircle2, TrendingUp, Wallet, Percent, Megaphone, ArrowRight, ListOrdered, Trophy } from 'lucide-react';

interface Props {
  appointments: Appointment[];
  services: Service[];
  waitingListCount: number;
  onNavigateToPromotions?: () => void;
}

const DashboardView: React.FC<Props> = ({ appointments, services, waitingListCount, onNavigateToPromotions }) => {
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'Serviço';
  
  const completedApts = appointments.filter(a => a.status === 'completed');
  const totalRevenue = completedApts.reduce((acc, apt) => {
    const s = services.find(serv => serv.id === apt.serviceId);
    return acc + (s?.price || 0);
  }, 0);

  const barberCommission = completedApts.reduce((acc, apt) => {
    const s = services.find(serv => serv.id === apt.serviceId);
    return acc + ((s?.price || 0) * ((s?.commission || 0) / 100));
  }, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-oswald font-bold uppercase tracking-tight">Painel de <span className="text-yellow-500">Controle</span></h2>
          <p className="text-gray-400 mt-1">Resumo financeiro e operacional do dia.</p>
        </div>
        <button 
          onClick={onNavigateToPromotions}
          className="bg-gray-900 border border-gray-800 text-white px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:border-yellow-500/50 transition-all group"
        >
          <Megaphone size={16} className="text-yellow-500" /> 
          Promover Negócio 
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Bruto" value={`R$ ${totalRevenue}`} icon={<Wallet className="text-green-400" />} />
        <StatCard title="Comissão" value={`R$ ${barberCommission.toFixed(0)}`} icon={<Percent className="text-yellow-500" />} />
        <StatCard title="Concluídos" value={completedApts.length.toString()} icon={<CheckCircle2 className="text-blue-400" />} />
        <StatCard title="Na Espera" value={waitingListCount.toString()} icon={<ListOrdered className="text-orange-400" />} />
        <StatCard title="Fidelidade" value="1.6k" icon={<Trophy className="text-yellow-500" />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold font-oswald uppercase flex items-center gap-2">
              <Clock className="text-yellow-500" size={20} /> Agenda de Hoje
            </h3>
          </div>
          <div className="grid gap-3">
            {appointments.filter(a => a.status !== 'completed').map((apt) => (
              <div key={apt.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center justify-between group hover:border-yellow-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-500">
                    <User size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{apt.clientName}</h4>
                    <p className="text-xs text-gray-400">{getServiceName(apt.serviceId)} • {new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold ${
                  apt.status === 'confirmed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {apt.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold font-oswald uppercase mb-4 flex items-center gap-2 text-yellow-500">
            <TrendingUp size={20} /> Insights Inteligentes
          </h3>
          <div className="space-y-6">
             <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex items-center gap-4">
                <Trophy className="text-yellow-500" size={24} />
                <div>
                  <p className="text-sm text-white font-bold">Programa de Fidelidade</p>
                  <p className="text-xs text-gray-400">Há <span className="text-white">12 clientes</span> com pontos suficientes para resgatar um corte grátis. O n8n pode enviar um lembrete para eles.</p>
                </div>
             </div>
             {waitingListCount > 0 && (
               <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                 <p className="text-xs text-orange-400 uppercase font-bold mb-1">Atenção</p>
                 <p className="text-sm text-gray-300">Você tem <span className="text-white font-bold">{waitingListCount} clientes</span> aguardando uma vaga hoje.</p>
               </div>
             )}
            <ProgressBar label="Meta de Faturamento" current={totalRevenue} target={5000} color="bg-yellow-500" />
          </div>
        </section>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl hover:border-gray-700 transition-colors">
    <div className="flex justify-between items-start mb-2">
      <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{title}</span>
      {icon}
    </div>
    <div className="text-xl font-oswald font-bold">{value}</div>
  </div>
);

const ProgressBar: React.FC<{ label: string, current: number, target: number, color: string }> = ({ label, current, target, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs font-bold uppercase">
      <span className="text-gray-400">{label}</span>
      <span className="text-white">{Math.round((current/target)*100)}%</span>
    </div>
    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
      <div className={`${color} h-full transition-all duration-1000`} style={{ width: `${(current/target)*100}%` }}></div>
    </div>
  </div>
);

export default DashboardView;
