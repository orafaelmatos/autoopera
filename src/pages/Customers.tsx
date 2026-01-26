
import React, { useState } from 'react';
import { Customer } from '../types';
import { 
  Search, 
  UserPlus, 
  Phone, 
  Calendar, 
  MessageSquare, 
  Star, 
  X, 
  MessageCircle, 
  History, 
  Save,
  Trophy,
  Ticket,
  ChevronRight,
  Scissors,
  Package
} from 'lucide-react';
import { customersApi, getMediaUrl } from '../api';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

const CustomersView: React.FC<Props> = ({ customers, setCustomers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [tempNotes, setTempNotes] = useState('');

  // Estados para o novo cliente
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const handleOpenProfile = (customer: Customer) => {
    setSelectedCustomer(customer);
    setTempNotes(customer.notes || '');
    setIsEditingNotes(false);
    setIsRedeeming(false);
  };

  const handleSaveNotes = async () => {
    if (selectedCustomer) {
      try {
        const updatedCustomer = await customersApi.update(selectedCustomer.id, { 
          notes: tempNotes
        });
        const updatedList = customers.map(c => 
          c.id === selectedCustomer.id ? updatedCustomer : c
        );
        setCustomers(updatedList);
        setSelectedCustomer(updatedCustomer);
        setIsEditingNotes(false);
        toast.success("Perfil atualizado!");
      } catch (error) {
        console.error("Erro ao salvar perfil:", error);
        toast.error("Erro ao salvar");
      }
    }
  };

  const handleRedeem = async (pointsCost: number, reward: string) => {
    if (selectedCustomer && selectedCustomer.points >= pointsCost) {
      try {
        await customersApi.redeemPoints(selectedCustomer.id, pointsCost);
        const updatedCustomer = { ...selectedCustomer, points: selectedCustomer.points - pointsCost };
        const updatedList = customers.map(c => 
          c.id === selectedCustomer.id ? updatedCustomer : c
        );
        setCustomers(updatedList);
        setSelectedCustomer(updatedCustomer);
        toast.success(`Resgate de "${reward}" realizado com sucesso!`);
        setIsRedeeming(false);
      } catch (error) {
        console.error("Erro ao resgatar pontos:", error);
      }
    } else {
      toast.error("Pontos insuficientes para este resgate.");
    }
  };

  const handleAddNewCustomer = async () => {
    if (!newName || !newPhone) {
      toast.error("Por favor, preencha o nome e telefone.");
      return;
    }

    try {
      const newEntry = await customersApi.create({
        name: newName,
        phone: newPhone,
        notes: newNotes || 'Sem notas iniciais.',
        points: 0,
        totalSpent: 0,
        lastVisit: 'Primeira vez'
      });

      setCustomers([...customers, newEntry]);
      setIsAddingNew(false);
      setNewName('');
      setNewPhone('');
      setNewNotes('');
    } catch (error) {
      console.error("Erro ao adicionar cliente:", error);
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  return (
    <div className="space-y-12 sm:space-y-20 max-w-[1400px] mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 sm:gap-12">
        <div>
          <div className="flex items-center gap-4 mb-4 text-cta">
              <UserPlus size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-black italic uppercase tracking-[0.4em]">CRM & Loyalty Portal Elite</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-black italic uppercase text-primary font-title tracking-tighter leading-none">
            Gestão de <span className="text-primary/20">Membros</span>
          </h2>
          <p className="text-[10px] font-black italic text-primary/30 uppercase mt-4 tracking-[0.2em] ml-1">Cultive relacionamentos, maximize recorrência</p>
        </div>
        <button 
          onClick={() => setIsAddingNew(true)}
          className="bg-primary text-white px-10 py-6 rounded-[28px] text-[10px] font-black italic uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-primary/[0.95] transition-all shadow-xl shadow-primary/20 active:scale-95 w-full md:w-auto font-title"
        >
          <UserPlus size={20} strokeWidth={3} />
          <span>Registrar Novo Membro</span>
        </button>
      </header>

      <div className="relative group max-w-4xl mx-auto w-full">
        <div className="absolute left-8 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-cta transition-colors z-10">
            <Search size={22} strokeWidth={2.5} />
        </div>
        <input 
          type="text" 
          placeholder="Rastrear membro por nome ou contato..."
          className="w-full bg-white border border-primary/5 rounded-[32px] pl-20 pr-10 py-7 text-primary font-black italic uppercase text-sm focus:border-cta/20 focus:bg-white outline-none transition-all placeholder:text-primary/10 font-title shadow-xl shadow-primary/[0.02]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:block">
            <div className="bg-primary/5 px-4 py-2 rounded-full border border-primary/5 text-[10px] font-black italic text-primary/30 uppercase tracking-widest font-title">
                {filtered.length} Resultados
            </div>
        </div>
      </div>

      <div className="grid gap-6">
        {filtered.length > 0 ? filtered.map(customer => (
          <div key={customer.id} className="bg-white border border-primary/5 p-8 sm:p-10 rounded-[48px] flex flex-col md:flex-row md:items-center justify-between gap-8 hover:shadow-[0_48px_96px_-12px_rgba(15,76,92,0.12)] hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
            <div className="flex items-center gap-8 relative z-10">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[32px] bg-background flex items-center justify-center text-primary/20 border border-primary/5 group-hover:bg-primary transition-all duration-500 overflow-hidden shadow-inner relative group/avatar">
                {customer.profile_picture ? (
                  <img 
                    src={getMediaUrl(customer.profile_picture)} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
                    alt={customer.name} 
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-black italic group-hover:text-white transition-colors">{customer.name.charAt(0)}</span>
                )}
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <h4 className="text-2xl sm:text-3xl font-black italic text-primary uppercase font-title truncate group-hover:text-primary transition-colors">{customer.name}</h4>
                  <div className="flex items-center gap-2 bg-cta px-4 py-1.5 rounded-full text-white text-[10px] font-black italic uppercase tracking-[0.2em] shadow-lg shadow-cta/20 border border-white/10 whitespace-nowrap font-title">
                    <Trophy size={12} strokeWidth={3} /> {customer.points} PTS
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-8 gap-y-3 font-title">
                  <span className="flex items-center gap-2 text-[10px] font-black italic text-primary/30 uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-2xl">
                     <Phone size={14} className="text-cta" strokeWidth={3} /> {customer.phone}
                  </span>
                  <span className="flex items-center gap-2 text-[10px] font-black italic text-primary/30 uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-2xl">
                     <Calendar size={14} className="text-cta" strokeWidth={3} /> Visto: {customer.lastVisit}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 relative z-10">
              <button 
                onClick={() => openWhatsApp(customer.phone)}
                className="w-16 h-16 sm:w-20 sm:h-20 bg-background text-primary/20 rounded-[28px] hover:bg-green-500 hover:text-white transition-all duration-300 border border-primary/5 flex items-center justify-center shadow-sm"
                title="Mensagem"
              >
                <MessageCircle size={28} strokeWidth={2.5} />
              </button>
              <button 
                onClick={() => handleOpenProfile(customer)}
                className="px-10 py-6 bg-primary text-white rounded-[28px] text-[10px] font-black italic uppercase tracking-[0.2em] shadow-xl shadow-primary/10 hover:bg-primary/[0.95] active:scale-95 transition-all font-title border border-white/5"
              >
                Visualizar Dossier
              </button>
            </div>
            
            {/* Background Pattern */}
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-primary/[0.02] -skew-x-12 translate-x-16 pointer-events-none group-hover:bg-primary/[0.04] transition-colors" />
          </div>
        )) : (
          <div className="text-center py-24 bg-primary/[0.01] rounded-[64px] border-2 border-dashed border-primary/5">
             <Trophy size={64} className="text-primary/10 mx-auto mb-8" strokeWidth={1.5} />
             <p className="text-primary/20 font-black italic uppercase tracking-[0.3em] font-title text-xl">Nenhum membro localizado no fluxo</p>
          </div>
        )}
      </div>

      {/* Modal: Perfil Detalhado & Fidelidade */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 bg-primary/40 backdrop-blur-xl z-[200] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-primary/5 w-full max-w-4xl rounded-[48px] overflow-hidden shadow-[0_48px_96px_-12px_rgba(15,76,92,0.3)] relative max-h-[90vh] flex flex-col"
            >
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="absolute top-10 right-10 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-white/20 transition-all z-20 border border-white/20 flex items-center justify-center"
              >
                <X size={24} strokeWidth={3} />
              </button>

              <div className="overflow-y-auto custom-scrollbar">
                <div className="h-48 sm:h-64 bg-primary relative overflow-hidden flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/40 opacity-50" />
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
                  
                  <div className="absolute -bottom-10 left-10 sm:left-16 z-10">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[40px] bg-white border-[8px] border-white flex items-center justify-center text-primary text-5xl font-black italic shadow-2xl overflow-hidden font-title relative">
                      {selectedCustomer.profile_picture ? (
                        <img 
                          src={getMediaUrl(selectedCustomer.profile_picture)} 
                          className="w-full h-full object-cover" 
                          alt={selectedCustomer.name} 
                        />
                      ) : (
                        selectedCustomer.name.charAt(0)
                      )}
                      <div className="absolute inset-0 border border-primary/5 rounded-[40px]" />
                    </div>
                  </div>
                </div>

                <div className="pt-20 sm:pt-24 p-10 sm:p-16">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-10">
                    <div className="w-full">
                      <h3 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-primary mb-4 font-title uppercase leading-none">{selectedCustomer.name}</h3>
                      <div className="flex flex-wrap items-center gap-6 mt-6">
                        <p className="bg-primary/5 px-6 py-3 rounded-2xl text-[10px] font-black italic text-primary uppercase tracking-widest flex items-center gap-3">
                          <Phone size={16} className="text-cta" strokeWidth={3} /> {selectedCustomer.phone}
                        </p>
                        <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-primary/10" />
                        <p className="bg-primary/5 px-6 py-3 rounded-2xl text-[10px] font-black italic text-primary uppercase tracking-widest flex items-center gap-3">
                          <Calendar size={16} className="text-cta" strokeWidth={3} /> Visto em: {selectedCustomer.lastVisit}
                        </p>
                      </div>
                    </div>
                    <div className="w-full lg:w-auto bg-primary p-8 sm:p-12 rounded-[40px] flex-shrink-0 shadow-2xl shadow-primary/20 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
                      <p className="text-[10px] text-white/40 font-black italic uppercase tracking-[0.4em] mb-4 leading-none font-title italic relative z-10">Loyalty Capital</p>
                      <div className="flex items-end gap-3 relative z-10">
                        <span className="text-5xl sm:text-7xl font-black italic text-white leading-none font-title tracking-tighter">{selectedCustomer.points}</span>
                        <span className="text-[10px] font-black italic text-cta uppercase tracking-widest mb-2 font-title">PTS</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-10 sm:gap-16 mt-16 sm:mt-24">
                    <div className="space-y-10">
                      <div className="bg-background/50 border border-primary/5 p-8 sm:p-12 rounded-[48px] relative group/notes">
                        <div className="flex items-center justify-between mb-10">
                          <h4 className="font-black italic flex items-center gap-4 text-[10px] text-primary/30 uppercase tracking-[0.3em] font-title">
                            <MessageSquare size={20} className="text-cta" strokeWidth={3} /> Dossier Técnico
                          </h4>
                          {!isEditingNotes ? (
                            <button onClick={() => setIsEditingNotes(true)} className="text-[10px] text-primary font-black italic uppercase tracking-[0.2em] hover:bg-primary/10 transition-colors py-3 px-6 bg-primary/5 rounded-2xl border border-primary/5 font-title">Refinar Notas</button>
                          ) : (
                            <button onClick={handleSaveNotes} className="text-[10px] text-white font-black italic uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-green-600 transition-colors py-3 px-6 bg-green-500 rounded-2xl shadow-lg shadow-green-500/10 font-title">
                              <Save size={14} strokeWidth={3} /> Consolidar
                            </button>
                          )}
                        </div>
                        
                        {isEditingNotes ? (
                          <div className="space-y-6">
                            <textarea 
                              className="w-full bg-white border-2 border-transparent rounded-[32px] p-8 text-sm text-primary font-black italic uppercase focus:border-cta/20 outline-none transition-all placeholder:text-primary/10 min-h-[160px] font-title shadow-sm"
                              value={tempNotes}
                              placeholder="Notas técnicas, preferências, manifesto de estilo..."
                              onChange={(e) => setTempNotes(e.target.value)}
                            />
                          </div>
                        ) : (
                          <div className="bg-white rounded-[32px] p-8 border border-primary/5 min-h-[140px] shadow-sm flex items-center">
                            <p className="text-sm text-primary font-black italic uppercase leading-relaxed text-primary/60 font-title">
                              {selectedCustomer.notes ? selectedCustomer.notes : "Nenhuma anotação estratégica registrada no dossier."}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-white border border-primary/5 p-12 rounded-[48px] flex items-center justify-between shadow-xl shadow-primary/[0.02] relative overflow-hidden group">
                         <div className="relative z-10">
                            <p className="text-[10px] text-primary/30 font-black italic uppercase tracking-[0.4em] mb-4 leading-none font-title italic">LTV (Lifetime Value)</p>
                            <p className="text-4xl sm:text-5xl font-black italic text-primary font-title tracking-tighter">R$ {selectedCustomer.totalSpent}</p>
                         </div>
                         <Trophy size={64} className="text-primary/[0.03] group-hover:text-cta/10 transition-colors group-hover:scale-110 duration-700" strokeWidth={1.5} />
                      </div>
                    </div>

                  <div className="bg-background/50 border border-primary/5 p-8 sm:p-12 rounded-[48px] relative group/rewards">
                    <h4 className="font-black italic flex items-center gap-4 text-[10px] text-primary/30 uppercase tracking-[0.3em] mb-10 font-title">
                      <Ticket size={24} className="text-cta" strokeWidth={3} /> Recompensas Ativas
                    </h4>
                    <div className="space-y-6">
                      {[
                        { name: 'Corte de Cabelo', cost: 450, icon: Scissors },
                        { name: 'Pomada ou Óleo', cost: 300, icon: Package },
                        { name: 'Barba Completa', cost: 700, icon: Star }
                      ].map(reward => (
                        <button 
                          key={reward.name}
                          disabled={selectedCustomer.points < reward.cost}
                          onClick={() => handleRedeem(reward.cost, reward.name)}
                          className={`w-full flex items-center justify-between p-8 rounded-[32px] border transition-all group font-title ${
                            selectedCustomer.points >= reward.cost 
                              ? 'bg-white border-primary/5 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/[0.03]' 
                              : 'bg-primary/5 border-transparent opacity-40 grayscale-[0.5] cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-8">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${selectedCustomer.points >= reward.cost ? 'bg-cta/10 text-cta group-hover:bg-cta group-hover:text-white' : 'bg-primary/5 text-primary/20'}`}>
                              <reward.icon size={24} strokeWidth={2.5} />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-black italic text-primary uppercase leading-tight">{reward.name}</p>
                              <p className="text-[10px] text-primary/30 font-black italic uppercase tracking-[0.2em] mt-1">{reward.cost} Pontos</p>
                            </div>
                          </div>
                          {selectedCustomer.points >= reward.cost && <ChevronRight size={24} className="text-primary/10 group-hover:text-cta group-hover:translate-x-2 transition-all" strokeWidth={3} />}
                        </button>
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => openWhatsApp(selectedCustomer.phone)}
                      className="w-full flex items-center justify-center gap-4 bg-[#25D366] text-white py-8 rounded-[32px] font-black italic uppercase tracking-[0.4em] text-[10px] hover:shadow-2xl hover:shadow-[#25D366]/20 transition-all mt-10 active:scale-[0.98] font-title"
                    >
                      <MessageCircle size={20} strokeWidth={3} /> Canal Direto (WhatsApp)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Adicionar Novo Cliente */}
      <AnimatePresence>
        {isAddingNew && (
          <div className="fixed inset-0 bg-primary/40 backdrop-blur-xl z-[200] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white border border-primary/5 w-full max-w-2xl rounded-[48px] p-10 sm:p-16 shadow-[0_48px_96px_-12px_rgba(15,76,92,0.3)] relative max-h-[90vh] overflow-y-auto custom-scrollbar-hidden"
            >
              <button 
                onClick={() => setIsAddingNew(false)}
                className="absolute top-10 right-10 w-12 h-12 bg-background text-primary/20 rounded-2xl flex items-center justify-center hover:text-primary transition-all group"
              >
                <X size={24} strokeWidth={3} />
              </button>

              <div className="mb-12">
                <h3 className="text-4xl sm:text-5xl font-black italic uppercase text-primary font-title mb-3 leading-none">Novo Membro</h3>
                <p className="text-[10px] font-black italic text-primary/30 uppercase tracking-[0.3em]">Protocolo de Admissão Elite</p>
              </div>

              <div className="space-y-8 font-title">
                <div className="space-y-4">
                  <label className="text-[10px] font-black italic text-primary/30 uppercase tracking-[0.2em] ml-6 block">Rótulo do Cliente / Nome</label>
                  <input type="text" placeholder="Ex: João da Silva" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-background border-2 border-transparent rounded-[28px] px-8 py-5 text-primary font-black italic uppercase text-sm focus:border-cta/20 focus:bg-white outline-none transition-all placeholder:text-primary/5 shadow-sm" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black italic text-primary/30 uppercase tracking-[0.2em] ml-6 block">Canal de Contato (WhatsApp)</label>
                  <input type="text" placeholder="(00) 00000-0000" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full bg-background border-2 border-transparent rounded-[28px] px-8 py-5 text-primary font-black italic uppercase text-sm focus:border-cta/20 focus:bg-white outline-none transition-all placeholder:text-primary/5 shadow-sm" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black italic text-primary/30 uppercase tracking-[0.2em] ml-6 block">Observações Estratégicas</label>
                  <textarea placeholder="Preferências, estilo de corte ou detalhes para o dossier..." value={newNotes} onChange={e => setNewNotes(e.target.value)} className="w-full bg-background border-2 border-transparent rounded-[32px] px-8 py-6 text-primary font-black italic uppercase text-sm focus:border-cta/20 focus:bg-white outline-none resize-none transition-all placeholder:text-primary/5 shadow-sm" rows={4} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
                <button 
                  onClick={() => setIsAddingNew(false)} 
                  className="w-full py-6 rounded-[28px] border-2 border-primary/5 text-primary/40 text-[10px] font-black italic uppercase tracking-widest hover:bg-primary/5 transition-all font-title"
                >
                  Abortar
                </button>
                <button 
                  onClick={handleAddNewCustomer} 
                  className="w-full py-6 rounded-[28px] bg-primary text-white text-[10px] font-black italic uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all font-title"
                >
                  Confirmar Admissão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomersView;
