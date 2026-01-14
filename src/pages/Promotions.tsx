
import React, { useState } from 'react';
import { Service, Customer, Promotion } from '../types';
import { 
  Megaphone, 
  Plus, 
  Users, 
  Calendar, 
  Percent, 
  MessageSquare, 
  Send, 
  History,
  CheckCircle,
  X,
  Smartphone,
  Info
} from 'lucide-react';
import { promotionsApi } from '../api';
import toast from 'react-hot-toast';

interface Props {
  services: Service[];
  customers: Customer[];
}

const PromotionsView: React.FC<Props> = ({ services, customers }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [history, setHistory] = useState<Promotion[]>([]);

  // Carregar histórico ao abrir
  React.useEffect(() => {
    promotionsApi.getAll().then(setHistory).catch(console.error);
  }, []);

  // Form State
  const [promoName, setPromoName] = useState('');
  const [discount, setDiscount] = useState(10);
  const [selectedService, setSelectedService] = useState(services[0]?.id || '');
  const [audience, setAudience] = useState<'all' | 'vip' | 'inactive'>('all');

  const handleLaunch = async () => {
    try {
      const newPromo = await promotionsApi.create({
        name: promoName,
        discount: discount,
        serviceId: selectedService,
        targetAudience: audience,
        status: 'active',
        reach: Math.floor(Math.random() * 100) + 1 // Mock de alcance para o exemplo
      });
      setHistory([newPromo, ...history]);
      toast.success(`Promoção "${promoName}" lançada com sucesso!`);
      setIsCreating(false);
    } catch (error) {
      console.error("Erro ao lançar promoção:", error);
      toast.error("Erro ao lançar promoção");
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-oswald font-bold uppercase tracking-tight">Marketing & <span className="text-yellow-500">Promoções</span></h2>
          <p className="text-gray-400 mt-1">Transforme horários vazios em lucro com o n8n.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20 active:scale-95"
        >
          <Plus size={20} /> Nova Campanha
        </button>
      </header>

      {/* Campanhas Ativas */}
      <section className="space-y-4">
        <h3 className="text-xl font-oswald font-bold uppercase flex items-center gap-2">
          <CheckCircle className="text-yellow-500" size={20} /> Campanhas em Curso
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {history.filter(p => p.status === 'active').map(promo => (
            <div key={promo.id} className="bg-gray-900 border border-yellow-500/20 p-6 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-yellow-500 text-black px-3 py-1 text-[10px] font-bold uppercase rounded-bl-xl">Ativa</div>
              <h4 className="text-xl font-bold mb-2">{promo.name}</h4>
              <div className="flex gap-4 mb-6">
                <div className="text-center bg-black/40 p-2 rounded-xl border border-gray-800 flex-1">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Alcance</p>
                  <p className="text-lg font-oswald text-white">{promo.reach} Cli.</p>
                </div>
                <div className="text-center bg-black/40 p-2 rounded-xl border border-gray-800 flex-1">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Desconto</p>
                  <p className="text-lg font-oswald text-yellow-500">{promo.discount}%</p>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Válido para: <span className="text-white">Terças-feiras</span></span>
                <button className="text-red-500 font-bold hover:underline">Pausar</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Histórico e Insights */}
      <section className="space-y-4">
        <h3 className="text-xl font-oswald font-bold uppercase flex items-center gap-2">
          <History className="text-gray-500" size={20} /> Histórico de Disparos
        </h3>
        <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/50 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <th className="p-4">Campanha</th>
                <th className="p-4">Público</th>
                <th className="p-4">Serviço</th>
                <th className="p-4">Resultado</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {history.map(p => (
                <tr key={p.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="p-4 font-bold text-white text-sm">{p.name}</td>
                  <td className="p-4 text-xs text-gray-400 capitalize">{p.targetAudience}</td>
                  <td className="p-4 text-xs text-gray-400">{services.find(s => s.id === p.serviceId)?.name}</td>
                  <td className="p-4 text-xs font-bold text-green-500">{p.reach} envios</td>
                  <td className="p-4 text-right">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${p.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-800 text-gray-500'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Criar Campanha */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="flex h-full flex-col md:flex-row">
              {/* Lado Esquerdo: Formulário */}
              <div className="flex-1 p-8 border-r border-gray-800 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-oswald font-bold uppercase">Configurar <span className="text-yellow-500">Campanha</span></h3>
                  <button onClick={() => setIsCreating(false)} className="md:hidden text-gray-500"><X /></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Nome da Promoção</label>
                    <input 
                      value={promoName}
                      onChange={e => setPromoName(e.target.value)}
                      placeholder="Ex: Black Friday Barber" 
                      className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Serviço</label>
                      <select 
                        value={selectedService}
                        onChange={e => setSelectedService(e.target.value)}
                        className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
                      >
                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Desconto (%)</label>
                      <input 
                        type="number" 
                        value={discount}
                        onChange={e => setDiscount(Number(e.target.value))}
                        className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Público-Alvo</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => setAudience('all')} className={`py-2 rounded-lg text-[10px] font-bold uppercase border transition-all ${audience === 'all' ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-black border-gray-800 text-gray-500'}`}>Todos</button>
                      <button onClick={() => setAudience('vip')} className={`py-2 rounded-lg text-[10px] font-bold uppercase border transition-all ${audience === 'vip' ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-black border-gray-800 text-gray-500'}`}>VIPs</button>
                      <button onClick={() => setAudience('inactive')} className={`py-2 rounded-lg text-[10px] font-bold uppercase border transition-all ${audience === 'inactive' ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-black border-gray-800 text-gray-500'}`}>Inativos</button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button onClick={() => setIsCreating(false)} className="flex-1 py-4 border border-gray-800 rounded-2xl font-bold text-gray-400">Cancelar</button>
                  <button onClick={handleLaunch} className="flex-1 py-4 bg-yellow-500 text-black rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20">
                    <Send size={18} /> Disparar n8n
                  </button>
                </div>
              </div>

              {/* Lado Direito: Preview WhatsApp */}
              <div className="flex-1 bg-black/40 p-8 hidden md:flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
                    <Smartphone size={14} /> Prévia da Mensagem
                  </h4>
                  <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
                </div>
                
                <div className="bg-[#075e54] rounded-2xl p-4 flex-1 relative overflow-hidden shadow-inner">
                  <div className="bg-white/10 rounded-xl p-4 text-sm text-white space-y-3 backdrop-blur-sm border border-white/5">
                    <p>Olá! Notamos que faz tempo que você não vem dar um tapa no visual... ✂️</p>
                    <p className="font-bold text-yellow-500">Temos uma oferta especial: {promoName || 'Promoção Exclusiva'}</p>
                    <p>Ganhe <span className="bg-yellow-500 text-black px-1 font-bold">{discount}% de desconto</span> no serviço de {services.find(s => s.id === selectedService)?.name}!</p>
                    <p>Válido apenas para agendamentos pelo WhatsApp. Clique no botão abaixo para escolher seu horário! 👇</p>
                    <div className="bg-white rounded-lg p-2 text-center text-[#075e54] font-bold text-xs uppercase cursor-not-allowed">
                      Agendar com Desconto
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl flex gap-3">
                  <Info className="text-yellow-500 shrink-0" size={18} />
                  <p className="text-[10px] text-gray-500 leading-relaxed italic">
                    O n8n usará essa estrutura para automatizar os envios individuais respeitando as políticas de spam do WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionsView;
