
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
  const [tempEmail, setTempEmail] = useState('');
  const [tempCpf, setTempCpf] = useState('');

  // Estados para o novo cliente
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCpf, setNewCpf] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpf?.includes(searchTerm)
  );

  const handleOpenProfile = (customer: Customer) => {
    setSelectedCustomer(customer);
    setTempNotes(customer.notes);
    setTempEmail(customer.email || '');
    setTempCpf(customer.cpf || '');
    setIsEditingNotes(false);
    setIsRedeeming(false);
  };

  const handleSaveNotes = async () => {
    if (selectedCustomer) {
      try {
        const updatedCustomer = await customersApi.update(selectedCustomer.id, { 
          notes: tempNotes,
          email: tempEmail,
          cpf: tempCpf
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
        email: newEmail,
        cpf: newCpf,
        notes: newNotes || 'Sem notas iniciais.',
        points: 0,
        totalSpent: 0,
        lastVisit: 'Primeira vez'
      });

      setCustomers([...customers, newEntry]);
      setIsAddingNew(false);
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewCpf('');
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
    <div className="space-y-12 animate-fadeIn max-w-[1200px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white">Meus <span className="text-gray-500">Clientes</span></h2>
          <p className="text-gray-500 mt-2 font-medium">Gestão de relacionamento e fidelização.</p>
        </div>
        <button 
          onClick={() => setIsAddingNew(true)}
          className="bg-[#007AFF] text-white px-6 py-3 rounded-2xl text-[13px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#0063CC] transition-all shadow-[0_10px_20px_rgba(0,122,255,0.2)] active:scale-95"
        >
          <UserPlus size={18} />
          <span>Novo Cliente</span>
        </button>
      </header>

      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#007AFF] transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nome ou celular..."
          className="w-full bg-[#1c1c1e] border border-white/5 rounded-[24px] pl-16 pr-8 py-5 text-white focus:border-[#007AFF]/50 focus:outline-none transition-all placeholder:text-gray-600 text-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-6">
        {filtered.length > 0 ? filtered.map(customer => (
          <div key={customer.id} className="bg-[#1c1c1e] border border-white/5 p-6 rounded-[32px] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-[#2c2c2e] transition-all group">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[24px] bg-black/40 flex items-center justify-center text-[#007AFF] border border-white/5 group-hover:scale-105 transition-transform">
                <span className="text-2xl font-bold">{customer.name.charAt(0)}</span>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h4 className="text-xl font-bold text-white tracking-tight">{customer.name}</h4>
                  <div className="flex items-center gap-1 bg-[#007AFF]/10 px-2.5 py-1 rounded-full text-[#007AFF] text-[10px] font-bold uppercase tracking-wider border border-[#007AFF]/20">
                    <Trophy size={12} /> {customer.points} Pts
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-sm text-gray-500 font-medium"><Phone size={14} className="text-gray-600" /> {customer.phone}</span>
                  <span className="flex items-center gap-1.5 text-sm text-gray-500 font-medium"><Calendar size={14} className="text-gray-600" /> {customer.lastVisit}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => openWhatsApp(customer.phone)}
                className="p-4 bg-white/5 text-gray-400 rounded-2xl hover:bg-green-500/10 hover:text-green-500 transition-all border border-transparent hover:border-green-500/20"
                title="Conversar no WhatsApp"
              >
                <MessageCircle size={22} />
              </button>
              <button 
                onClick={() => handleOpenProfile(customer)}
                className="px-6 py-4 bg-[#1c1c1e] border border-white/5 hover:border-[#007AFF]/50 text-white rounded-[20px] text-[13px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-lg"
              >
                Ver Perfil
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
              className="bg-[#1c1c1e] border border-white/5 w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="absolute top-6 right-6 p-3 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all z-10"
              >
                <X size={20} />
              </button>

              <div className="h-40 bg-gradient-to-br from-[#007AFF] to-[#004BB3] relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute -bottom-12 left-10">
                  <div className="w-24 h-24 rounded-[32px] bg-[#1c1c1e] border-[6px] border-[#1c1c1e] flex items-center justify-center text-[#007AFF] text-4xl font-bold shadow-2xl">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                </div>
              </div>

              <div className="pt-16 p-10">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  <div>
                    <h3 className="text-3xl font-bold tracking-tight text-white">{selectedCustomer.name}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-3">
                      <p className="text-gray-500 font-medium flex items-center gap-2">
                        <Phone size={14} className="text-gray-600" /> {selectedCustomer.phone}
                      </p>
                      <div className="w-1 h-1 rounded-full bg-white/10"></div>
                      <p className="text-gray-500 font-medium flex items-center gap-2">
                        <Calendar size={14} className="text-gray-600" /> Última visita: {selectedCustomer.lastVisit}
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#007AFF]/10 p-6 rounded-[28px] border border-[#007AFF]/20 min-w-[200px]">
                    <p className="text-[10px] text-[#007AFF] font-bold uppercase tracking-[0.2em] mb-2 leading-none">Pontos Acumulados</p>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold text-[#007AFF] leading-none">{selectedCustomer.points}</span>
                      <span className="text-sm font-bold text-[#007AFF]/60 uppercase tracking-widest mb-1">pts</span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mt-12">
                  <div className="space-y-6">
                    <div className="bg-black/20 border border-white/5 p-6 rounded-[24px]">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold flex items-center gap-2 text-sm text-gray-400 uppercase tracking-wider">
                          <MessageSquare size={16} className="text-[#007AFF]" /> Perfil Técnico
                        </h4>
                        {!isEditingNotes ? (
                          <button onClick={() => setIsEditingNotes(true)} className="text-[10px] text-[#007AFF] uppercase font-bold tracking-widest hover:text-[#0063CC] transition-colors">Editar</button>
                        ) : (
                          <button onClick={handleSaveNotes} className="text-[10px] text-green-500 uppercase font-bold tracking-widest flex items-center gap-1 hover:text-green-400 transition-colors">
                            <Save size={12} /> Salvar
                          </button>
                        )}
                      </div>
                      
                      {isEditingNotes ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Email</label>
                              <input 
                                type="email" 
                                value={tempEmail}
                                onChange={(e) => setTempEmail(e.target.value)}
                                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#007AFF]/50"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">CPF</label>
                              <input 
                                type="text" 
                                value={tempCpf}
                                onChange={(e) => setTempCpf(e.target.value)}
                                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#007AFF]/50"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Observações</label>
                            <textarea 
                              className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-[#007AFF]/50 transition-all placeholder:text-gray-700"
                              rows={3}
                              value={tempNotes}
                              placeholder="Observações do cliente..."
                              onChange={(e) => setTempNotes(e.target.value)}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">Email</p>
                                <p className="text-xs text-white truncate">{selectedCustomer.email || 'Não informado'}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">CPF</p>
                                <p className="text-xs text-white">{selectedCustomer.cpf || 'Não informado'}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">Observações</p>
                            <p className="text-sm text-gray-400 leading-relaxed italic">
                              {selectedCustomer.notes ? `"${selectedCustomer.notes}"` : "Nenhuma observação registrada."}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-black/20 border border-white/5 p-6 rounded-[24px] flex items-center justify-between">
                       <div>
                         <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Total Vitalício</p>
                         <p className="text-2xl font-bold text-white tracking-tight">R$ {selectedCustomer.totalSpent}</p>
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
              className="bg-[#1c1c1e] border border-white/5 w-full max-w-md rounded-[32px] p-10 shadow-2xl relative"
            >
              <div className="mb-10">
                <h3 className="text-3xl font-bold tracking-tight text-white mb-2">Novo Cliente</h3>
                <p className="text-gray-500 font-medium">Cadastre um novo cliente na sua base.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Nome do Cliente</label>
                  <input type="text" placeholder="Ex: João da Silva" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all placeholder:text-gray-700" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">WhatsApp / Telefone</label>
                  <input type="text" placeholder="(00) 00000-0000" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all placeholder:text-gray-700" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Email</label>
                    <input type="email" placeholder="cliente@email.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all placeholder:text-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">CPF</label>
                    <input type="text" placeholder="000.000.000-00" value={newCpf} onChange={e => setNewCpf(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all placeholder:text-gray-700" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Observações Iniciais</label>
                  <textarea placeholder="Preferências, endereço ou detalhes extras..." value={newNotes} onChange={e => setNewNotes(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none resize-none transition-all placeholder:text-gray-700" rows={3} />
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-12">
                <button 
                  onClick={handleAddNewCustomer} 
                  className="w-full py-5 bg-[#007AFF] text-white rounded-2xl font-bold hover:bg-[#0063CC] transition-all shadow-xl shadow-[#007AFF]/20 active:scale-[0.98]"
                >
                  Finalizar Cadastro
                </button>
                <button 
                  onClick={() => setIsAddingNew(false)} 
                  className="w-full py-4 text-gray-500 hover:text-white font-bold transition-colors text-sm uppercase tracking-[0.2em]"
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
