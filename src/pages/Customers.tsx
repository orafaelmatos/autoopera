
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
  ChevronRight
} from 'lucide-react';
import { customersApi } from '../api';
import toast from 'react-hot-toast';

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
    setTempNotes(customer.notes);
    setIsEditingNotes(false);
    setIsRedeeming(false);
  };

  const handleSaveNotes = async () => {
    if (selectedCustomer) {
      try {
        const updatedCustomer = await customersApi.update(selectedCustomer.id, { notes: tempNotes });
        const updatedList = customers.map(c => 
          c.id === selectedCustomer.id ? updatedCustomer : c
        );
        setCustomers(updatedList);
        setSelectedCustomer(updatedCustomer);
        setIsEditingNotes(false);
      } catch (error) {
        console.error("Erro ao salvar notas:", error);
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
    <div className="space-y-6 animate-fadeIn">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-oswald font-bold uppercase tracking-tight">Meus <span className="text-yellow-500">Clientes</span></h2>
          <p className="text-gray-400 mt-1">Gestão de relacionamento e fidelização.</p>
        </div>
        <button 
          onClick={() => setIsAddingNew(true)}
          className="bg-yellow-500 text-black p-3 rounded-xl font-bold hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20 active:scale-95 flex items-center gap-2"
        >
          <UserPlus size={20} />
          <span className="hidden sm:inline">Novo Cliente</span>
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input 
          type="text" 
          placeholder="Buscar por nome ou celular..."
          className="w-full bg-gray-900 border border-gray-800 rounded-2xl pl-12 pr-4 py-4 focus:border-yellow-500 focus:outline-none transition-all placeholder:text-gray-600"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filtered.length > 0 ? filtered.map(customer => (
          <div key={customer.id} className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-yellow-500/20 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500/20 to-gray-800 flex items-center justify-center text-yellow-500 border border-yellow-500/20 group-hover:scale-105 transition-transform">
                <span className="text-xl font-bold font-oswald">{customer.name.charAt(0)}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xl font-bold text-white">{customer.name}</h4>
                  <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded text-yellow-500 text-[10px] font-bold uppercase tracking-tighter">
                    <Trophy size={10} /> {customer.points} Pts
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-gray-500"><Phone size={12} /> {customer.phone}</span>
                  <span className="flex items-center gap-1 text-xs text-gray-500"><Calendar size={12} /> {customer.lastVisit}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => openWhatsApp(customer.phone)}
                className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all"
                title="Conversar no WhatsApp"
              >
                <MessageCircle size={20} />
              </button>
              <button 
                onClick={() => handleOpenProfile(customer)}
                className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                Ver Perfil / Fidelidade
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
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="relative h-32 bg-gradient-to-r from-yellow-600/20 to-black p-6">
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="absolute top-4 right-4 p-2 bg-black/40 rounded-full text-white hover:bg-black"
              >
                <X size={20} />
              </button>
              <div className="absolute -bottom-10 left-8">
                <div className="w-24 h-24 rounded-full bg-gray-900 border-4 border-gray-900 flex items-center justify-center text-yellow-500 text-4xl font-bold font-oswald shadow-xl">
                  {selectedCustomer.name.charAt(0)}
                </div>
              </div>
            </div>

            <div className="pt-14 p-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-3xl font-oswald font-bold">{selectedCustomer.name}</h3>
                  <p className="text-gray-500 flex items-center gap-2 mt-1">
                    <Phone size={14} /> {selectedCustomer.phone}
                  </p>
                </div>
                <div className="text-right">
                  <div className="bg-yellow-500/10 p-4 rounded-2xl border border-yellow-500/20 inline-block">
                    <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest mb-1">Saldo Fidelidade</p>
                    <p className="text-3xl font-oswald text-yellow-500">{selectedCustomer.points} <span className="text-sm">pts</span></p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-8">
                {/* Notas e Info */}
                <div className="space-y-4">
                  <div className="bg-black/40 border border-gray-800 p-4 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold flex items-center gap-2 text-sm text-gray-300">
                        <MessageSquare size={16} className="text-yellow-500" /> Notas Técnicas
                      </h4>
                      {!isEditingNotes ? (
                        <button onClick={() => setIsEditingNotes(true)} className="text-[10px] text-yellow-500 uppercase font-bold hover:underline">Editar</button>
                      ) : (
                        <button onClick={handleSaveNotes} className="text-[10px] text-green-500 uppercase font-bold flex items-center gap-1 hover:underline">
                          <Save size={10} /> Salvar
                        </button>
                      )}
                    </div>
                    {isEditingNotes ? (
                      <textarea 
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition-all"
                        rows={4}
                        value={tempNotes}
                        onChange={(e) => setTempNotes(e.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-gray-400 italic">"{selectedCustomer.notes}"</p>
                    )}
                  </div>
                  <div className="bg-black/40 border border-gray-800 p-4 rounded-2xl">
                     <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Total Investido na Casa</p>
                     <p className="text-xl font-oswald text-white">R$ {selectedCustomer.totalSpent}</p>
                  </div>
                </div>

                {/* Painel de Resgate */}
                <div className="space-y-4">
                  <h4 className="font-bold flex items-center gap-2 text-sm text-gray-300">
                    <Ticket size={16} className="text-yellow-500" /> Resgate de Prêmios
                  </h4>
                  <div className="space-y-2">
                    {[
                      { name: 'Corte Social Grátis', cost: 450 },
                      { name: 'Pomada Matte 150g', cost: 300 },
                      { name: 'Combo Completo Grátis', cost: 700 }
                    ].map(reward => (
                      <button 
                        key={reward.name}
                        disabled={selectedCustomer.points < reward.cost}
                        onClick={() => handleRedeem(reward.cost, reward.name)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          selectedCustomer.points >= reward.cost 
                            ? 'bg-gray-800 border-gray-700 hover:border-yellow-500/50 group' 
                            : 'bg-black/20 border-gray-800/50 opacity-40 grayscale cursor-not-allowed'
                        }`}
                      >
                        <div className="text-left">
                          <p className="text-xs font-bold text-white">{reward.name}</p>
                          <p className="text-[10px] text-gray-500 font-bold">{reward.cost} Pontos</p>
                        </div>
                        {selectedCustomer.points >= reward.cost && <ChevronRight size={14} className="text-yellow-500 group-hover:translate-x-1 transition-transform" />}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => openWhatsApp(selectedCustomer.phone)}
                    className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition-all mt-4"
                  >
                    <MessageCircle size={18} /> Chamar no WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Novo Cliente (Oculto no snippet por brevidade, já existente no original) */}
      {isAddingNew && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-oswald font-bold uppercase tracking-wide">Cadastrar <span className="text-yellow-500">Cliente</span></h3>
              <button onClick={() => setIsAddingNew(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
            </div>
            <div className="space-y-6">
              <input type="text" placeholder="Nome" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" />
              <input type="text" placeholder="Celular" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" />
              <textarea placeholder="Notas" value={newNotes} onChange={e => setNewNotes(e.target.value)} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none resize-none" rows={3} />
            </div>
            <div className="flex gap-3 mt-10">
              <button onClick={() => setIsAddingNew(false)} className="flex-1 py-4 border border-gray-800 rounded-2xl font-bold text-gray-400">Cancelar</button>
              <button onClick={handleAddNewCustomer} className="flex-1 py-4 bg-yellow-500 text-black rounded-2xl font-bold hover:bg-yellow-400">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersView;
