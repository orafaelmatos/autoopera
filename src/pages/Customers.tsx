
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
import { customersApi } from '../api';
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
    <div className="space-y-8 sm:space-y-12 animate-fadeIn max-w-[1200px] mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white line-clamp-1">Meus <span className="text-gray-500">Clientes</span></h2>
          <p className="text-gray-500 mt-1 sm:mt-2 font-medium text-xs sm:text-sm">Gestão de relacionamento e fidelidade.</p>
        </div>
        <button 
          onClick={() => setIsAddingNew(true)}
          className="bg-[#007AFF] text-white px-5 sm:px-6 py-3.5 sm:py-3 rounded-2xl text-[11px] sm:text-[13px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#0063CC] transition-all shadow-xl active:scale-95 w-full md:w-auto"
        >
          <UserPlus size={18} />
          <span>Novo Cliente</span>
        </button>
      </header>

      <div className="relative group mx-1">
        <Search className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#007AFF] transition-colors" size={18} />
        <input 
          type="text" 
          placeholder="Buscar cliente..."
          className="w-full bg-[#1c1c1e] border border-white/5 rounded-[20px] sm:rounded-[24px] pl-12 sm:pl-16 pr-6 sm:pr-8 py-4 sm:py-5 text-white focus:border-[#007AFF]/50 focus:outline-none transition-all placeholder:text-gray-600 text-base sm:text-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:gap-6">
        {filtered.length > 0 ? filtered.map(customer => (
          <div key={customer.id} className="bg-[#1c1c1e] border border-white/5 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 hover:bg-[#2c2c2e] transition-all group">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] sm:rounded-[24px] bg-black/40 flex items-center justify-center text-[#007AFF] border border-white/5 group-hover:scale-105 transition-transform overflow-hidden">
                {customer.profile_picture ? (
                  <img 
                    src={customer.profile_picture.startsWith('http') ? customer.profile_picture : `http://127.0.0.1:8000${customer.profile_picture}`} 
                    className="w-full h-full object-cover" 
                    alt={customer.name} 
                  />
                ) : (
                  <span className="text-xl sm:text-2xl font-bold">{customer.name.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <h4 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">{customer.name}</h4>
                  <div className="flex items-center gap-1 bg-[#007AFF]/10 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[#007AFF] text-[8px] sm:text-[10px] font-bold uppercase tracking-wider border border-[#007AFF]/20 whitespace-nowrap">
                    <Trophy size={10} sm:size={12} /> {customer.points} Pts
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 sm:mt-2">
                  <span className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 font-medium"><Phone size={12} sm:size={14} className="text-gray-600" /> {customer.phone}</span>
                  <span className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 font-medium"><Calendar size={12} sm:size={14} className="text-gray-600" /> {customer.lastVisit}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={() => openWhatsApp(customer.phone)}
                className="flex-1 md:flex-none p-3.5 sm:p-4 bg-white/5 text-gray-400 rounded-xl sm:rounded-2xl hover:bg-green-500/10 hover:text-green-500 transition-all border border-transparent hover:border-green-500/20 flex items-center justify-center"
                title="Conversar no WhatsApp"
              >
                <MessageCircle size={20} sm:size={22} />
              </button>
              <button 
                onClick={() => handleOpenProfile(customer)}
                className="flex-[2] md:flex-none px-5 sm:px-6 py-3.5 sm:py-4 bg-[#1c1c1e] border border-white/5 hover:border-[#007AFF]/50 text-white rounded-xl sm:rounded-[20px] text-[11px] sm:text-[13px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-lg"
              >
                Detalhes
              </button>
            </div>
          </div>
        )) : (
          <div className="text-center py-20 bg-gray-900/50 rounded-3xl border border-dashed border-gray-800">
            <p className="text-gray-500">Nenhum cliente encontrado.</p>
          </div>
        )}
      </div>

      {/* Modal: Perfil Detalhado & Fidelidade */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1c1c1e] border border-white/5 w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
            >
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="absolute top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all z-10"
              >
                <X size={20} />
              </button>

              <div className="overflow-y-auto custom-scrollbar">
                <div className="h-32 md:h-40 bg-gradient-to-br from-[#007AFF] to-[#004BB3] relative overflow-hidden flex-shrink-0">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute -bottom-8 md:-bottom-12 left-6 md:left-10">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-[28px] md:rounded-[32px] bg-[#1c1c1e] border-[4px] md:border-[6px] border-[#1c1c1e] flex items-center justify-center text-[#007AFF] text-3xl md:text-4xl font-bold shadow-2xl overflow-hidden">
                      {selectedCustomer.profile_picture ? (
                        <img 
                          src={selectedCustomer.profile_picture.startsWith('http') ? selectedCustomer.profile_picture : `http://127.0.0.1:8000${selectedCustomer.profile_picture}`} 
                          className="w-full h-full object-cover" 
                          alt={selectedCustomer.name} 
                        />
                      ) : (
                        selectedCustomer.name.charAt(0)
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-12 md:pt-16 p-6 md:p-10">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                    <div className="w-full">
                      <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">{selectedCustomer.name}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                        <p className="text-gray-500 text-sm font-medium flex items-center gap-2">
                          <Phone size={14} className="text-[#007AFF]" /> {selectedCustomer.phone}
                        </p>
                        <div className="hidden sm:block w-1 h-1 rounded-full bg-white/10"></div>
                        <p className="text-gray-500 text-sm font-medium flex items-center gap-2">
                          <Calendar size={14} className="text-[#007AFF]" /> Visto em: {selectedCustomer.lastVisit}
                        </p>
                      </div>
                    </div>
                    <div className="w-full lg:w-auto bg-[#007AFF]/10 p-5 md:p-6 rounded-[24px] md:rounded-[28px] border border-[#007AFF]/20 flex-shrink-0">
                      <p className="text-[10px] text-[#007AFF] font-bold uppercase tracking-[0.2em] mb-2 leading-none">Pontos Acumulados</p>
                      <div className="flex items-end gap-2">
                        <span className="text-3xl md:text-4xl font-bold text-[#007AFF] leading-none">{selectedCustomer.points}</span>
                        <span className="text-sm font-bold text-[#007AFF]/60 uppercase tracking-widest mb-1">pts</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 md:gap-8 mt-10 md:mt-12">
                    <div className="space-y-6">
                      <div className="bg-black/20 border border-white/5 p-5 md:p-6 rounded-[24px]">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold flex items-center gap-2 text-xs md:text-sm text-gray-400 uppercase tracking-wider">
                            <MessageSquare size={16} className="text-[#007AFF]" /> Perfil Técnico
                          </h4>
                          {!isEditingNotes ? (
                            <button onClick={() => setIsEditingNotes(true)} className="text-[10px] text-[#007AFF] uppercase font-bold tracking-[0.15em] hover:text-[#0063CC] transition-colors py-1 px-3 bg-[#007AFF]/5 rounded-lg border border-[#007AFF]/10">Editar</button>
                          ) : (
                            <button onClick={handleSaveNotes} className="text-[10px] text-green-500 uppercase font-bold tracking-[0.15em] flex items-center gap-1 hover:text-green-400 transition-colors py-1 px-3 bg-green-500/5 rounded-lg border border-green-500/10">
                              <Save size={12} /> Salvar
                            </button>
                          )}
                        </div>
                        
                        {isEditingNotes ? (
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Observações</label>
                              <textarea 
                                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-[#007AFF]/50 transition-all placeholder:text-gray-700 min-h-[100px] font-medium"
                                value={tempNotes}
                                placeholder="Notas técnicas, preferências, alergias..."
                                onChange={(e) => setTempNotes(e.target.value)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-5">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1.5">Observações</p>
                                <div className="bg-black/20 rounded-xl p-3 border border-white/5 min-h-[60px]">
                                  <p className="text-sm text-gray-400 leading-relaxed italic">
                                    {selectedCustomer.notes ? selectedCustomer.notes : "Nenhuma observação técnica registrada."}
                                  </p>
                                </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-black/20 border border-white/5 p-5 md:p-6 rounded-[24px] flex items-center justify-between">
                         <div>
                           <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Total Vitalício</p>
                           <p className="text-2xl md:text-3xl font-bold text-white tracking-tight">R$ {selectedCustomer.totalSpent}</p>
                         </div>
                         <Trophy size={40} className="text-white/5" />
                      </div>
                    </div>

                  <div className="space-y-6">
                    <h4 className="font-bold flex items-center gap-2 text-sm text-gray-300 uppercase tracking-widest">
                      <Ticket size={16} className="text-[#007AFF]" /> Prêmios Disponíveis
                    </h4>
                    <div className="space-y-3">
                      {[
                        { name: 'Corte Social', cost: 450, icon: Scissors },
                        { name: 'Pomada Matte', cost: 300, icon: Package },
                        { name: 'Combo Especial', cost: 700, icon: Star }
                      ].map(reward => (
                        <button 
                          key={reward.name}
                          disabled={selectedCustomer.points < reward.cost}
                          onClick={() => handleRedeem(reward.cost, reward.name)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all group ${
                            selectedCustomer.points >= reward.cost 
                              ? 'bg-[#1c1c1e] border-white/5 hover:border-[#007AFF]/50 hover:bg-[#2c2c2e]' 
                              : 'bg-black/20 border-white/5 opacity-40 grayscale cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl ${selectedCustomer.points >= reward.cost ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'bg-gray-800 text-gray-500'}`}>
                              <reward.icon size={18} />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-bold text-white tracking-tight">{reward.name}</p>
                              <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">{reward.cost} Pontos</p>
                            </div>
                          </div>
                          {selectedCustomer.points >= reward.cost && <ChevronRight size={18} className="text-white/20 group-hover:text-[#007AFF] group-hover:translate-x-1 transition-all" />}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => openWhatsApp(selectedCustomer.phone)}
                      className="w-full flex items-center justify-center gap-3 bg-[#25D366] text-white py-4 rounded-[20px] font-bold hover:brightness-110 transition-all mt-4 shadow-lg shadow-[#25D366]/10 active:scale-[0.98]"
                    >
                      <MessageCircle size={20} /> Entrar em Contato
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#1c1c1e] border border-white/5 w-full max-w-md rounded-[32px] p-6 sm:p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setIsAddingNew(false)}
                className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-all"
              >
                <X size={20} />
              </button>

              <div className="mb-8">
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">Novo Cliente</h3>
                <p className="text-gray-500 text-sm font-medium">Cadastre um novo cliente na sua base.</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Nome do Cliente</label>
                  <input type="text" placeholder="Ex: João da Silva" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 sm:py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all placeholder:text-gray-700" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">WhatsApp / Telefone</label>
                  <input type="text" placeholder="(00) 00000-0000" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 sm:py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all placeholder:text-gray-700" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Observações Iniciais</label>
                  <textarea placeholder="Preferências, endereço ou detalhes extras..." value={newNotes} onChange={e => setNewNotes(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 sm:py-4 text-white focus:border-[#007AFF]/50 outline-none resize-none transition-all placeholder:text-gray-700" rows={3} />
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-10">
                <button 
                  onClick={handleAddNewCustomer} 
                  className="w-full py-4 sm:py-5 bg-[#007AFF] text-white rounded-2xl font-bold hover:bg-[#0063CC] transition-all shadow-xl shadow-[#007AFF]/20 active:scale-[0.98]"
                >
                  Finalizar Cadastro
                </button>
                <button 
                  onClick={() => setIsAddingNew(false)} 
                  className="w-full py-3 text-gray-500 hover:text-white font-bold transition-colors text-sm uppercase tracking-[0.2em]"
                >
                  Cancelar
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
