
import React, { useState } from 'react';
import { Transaction } from '../types';
import { 
  Plus, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  TrendingUp, 
  Filter, 
  Download,
  Calendar,
  DollarSign,
  Tag,
  CheckCircle2,
  Clock,
  X,
  CreditCard,
  ChevronRight
} from 'lucide-react';
import { transactionsApi } from '../api';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const FinanceView: React.FC<Props> = ({ transactions, setTransactions }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Form states
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState('');
  const [method, setMethod] = useState<'cash' | 'card' | 'pix'>('pix');

  // Cálculos de Resumo
  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.status === 'paid')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense' && t.status === 'paid')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const pendingExpense = transactions
    .filter(t => t.type === 'expense' && t.status === 'pending')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  // Filtro de lista
  const filteredTransactions = transactions.filter(t => 
    filterType === 'all' ? true : t.type === filterType
  );

  const handleToggleStatus = async (id: string) => {
    const current = transactions.find(t => t.id === id);
    if (!current) return;
    
    try {
      const newStatus = current.status === 'paid' ? 'pending' : 'paid';
      const updated = await transactionsApi.update(id, { status: newStatus });
      setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    }
  };

  const handleAddTransaction = async () => {
    try {
      const newTrans = await transactionsApi.create({
        description: desc,
        amount: Number(amount),
        type: type,
        category: category,
        date: new Date().toISOString(),
        status: 'paid',
        paymentMethod: method
      });
      setTransactions([newTrans, ...transactions]);
      setIsAdding(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao criar transação:", error);
    }
  };

  const resetForm = () => {
    setDesc('');
    setAmount(0);
    setCategory('');
  };

  return (
    <div className="space-y-12 animate-fadeIn max-w-[1200px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white">Gestão <span className="text-gray-500">Financeira</span></h2>
          <p className="text-gray-500 mt-2 font-medium">Controle seu fluxo de caixa e monitore seus lucros.</p>
        </div>
        <div className="flex gap-4">
          <button className="p-4 bg-white/5 text-gray-400 rounded-2xl hover:text-white hover:bg-white/10 transition-all border border-white/5">
            <Download size={22} />
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-[#007AFF] text-white px-8 py-4 rounded-2xl text-[13px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#0063CC] transition-all shadow-xl shadow-[#007AFF]/20 active:scale-95"
          >
            <Plus size={18} />
            <span>Nova Operação</span>
          </button>
        </div>
      </header>

      {/* Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <FinanceStatCard title="Receita (30d)" value={`R$ ${totalIncome.toFixed(2)}`} icon={<ArrowUpCircle className="text-[#007AFF]" size={20} />} trend="+12%" />
        <FinanceStatCard title="Despesas (30d)" value={`R$ ${totalExpense.toFixed(2)}`} icon={<ArrowDownCircle className="text-red-500" size={20} />} trend="-5%" />
        <FinanceStatCard title="Pendente" value={`R$ ${pendingExpense.toFixed(2)}`} icon={<Clock className="text-orange-500" size={20} />} />
        <FinanceStatCard title="Saldo Líquido" value={`R$ ${balance.toFixed(2)}`} icon={<TrendingUp className="text-green-500" size={20} />} highlight />
      </div>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold tracking-tight text-white font-medium">Transações Recentes</h3>
          <div className="flex bg-[#1c1c1e] p-1.5 rounded-2xl border border-white/5">
            <FilterButton active={filterType === 'all'} onClick={() => setFilterType('all')} label="Todas" />
            <FilterButton active={filterType === 'income'} onClick={() => setFilterType('income')} label="Entradas" />
            <FilterButton active={filterType === 'expense'} onClick={() => setFilterType('expense')} label="Saídas" />
          </div>
        </div>

        <div className="bg-[#1c1c1e] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left order-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data / Descrição</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Valor</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                         <div className="text-xs text-gray-500 font-bold bg-black/20 px-3 py-2 rounded-xl border border-white/5">
                            {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                         </div>
                         <div>
                            <p className="font-bold text-white tracking-tight">{t.description}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">{t.category}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className={`text-lg font-bold tracking-tight ${t.type === 'income' ? 'text-white' : 'text-red-400'}`}>
                        {t.type === 'income' ? '+' : '-'} R$ {Number(t.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                        <button 
                          onClick={() => handleToggleStatus(t.id)}
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                            t.status === 'paid' 
                              ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' 
                              : 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20'
                          }`}
                        >
                          {t.status === 'paid' ? 'Efetivado' : 'Pendente'}
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                        <button className="p-2 text-gray-600 hover:text-white transition-all bg-white/5 rounded-lg opacity-0 group-hover:opacity-100">
                          <Plus size={16} className="rotate-45" />
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTransactions.length === 0 && (
              <div className="text-center py-20 text-gray-500 text-sm font-medium">
                Nenhuma movimentação financeira encontrada.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Nova Transação */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#1c1c1e] border border-white/5 w-full max-w-md rounded-[32px] p-10 shadow-2xl relative"
            >
              <div className="mb-10">
                <h3 className="text-3xl font-bold tracking-tight text-white mb-2">Novo Lançamento</h3>
                <p className="text-gray-500 font-medium">Registre uma nova entrada ou saída do caixa.</p>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setType('income')}
                    className={`py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${type === 'income' ? 'bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/20' : 'bg-black/20 text-gray-500 border border-white/5'}`}
                  >
                    <ArrowUpCircle size={18} /> Entrada
                  </button>
                  <button 
                    onClick={() => setType('expense')}
                    className={`py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${type === 'expense' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-black/20 text-gray-500 border border-white/5'}`}
                  >
                    <ArrowDownCircle size={18} /> Saída
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Descrição</label>
                  <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Conta de Luz" className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all placeholder:text-gray-700" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Valor (R$)</label>
                    <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} placeholder="0,00" className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all placeholder:text-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Categoria</label>
                    <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="Ex: Aluguel" className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all placeholder:text-gray-700" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Método</label>
                  <select 
                    value={method} 
                    onChange={e => setMethod(e.target.value as any)} 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all"
                  >
                    <option value="pix">PIX</option>
                    <option value="card">Cartão</option>
                    <option value="cash">Dinheiro</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-12">
                <button 
                  onClick={handleAddTransaction} 
                  className="w-full py-5 bg-[#007AFF] text-white rounded-2xl font-bold hover:bg-[#0063CC] transition-all shadow-xl shadow-[#007AFF]/20 active:scale-[0.98]"
                >
                  Salvar Lançamento
                </button>
                <button 
                  onClick={() => setIsAdding(false)} 
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

const FinanceStatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, trend?: string, highlight?: boolean }> = ({ title, value, icon, trend, highlight }) => (
  <div className={`bg-[#1c1c1e] border border-white/5 p-8 rounded-[32px] hover:bg-[#2c2c2e] transition-all group ${highlight ? 'ring-1 ring-[#007AFF]/30 shadow-[0_10px_40px_rgba(0,122,255,0.1)]' : ''}`}>
    <div className="flex justify-between items-start mb-6">
      <span className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">{title}</span>
      <div className="bg-white/5 p-2 rounded-xl group-hover:bg-white/10 transition-colors">
        {icon}
      </div>
    </div>
    <div className="flex items-end justify-between">
      <div className={`text-3xl font-bold tracking-tight ${highlight ? 'text-[#007AFF]' : 'text-white'}`}>{value}</div>
      {trend && (
        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${trend.startsWith('+') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {trend}
        </span>
      )}
    </div>
  </div>
);

const FilterButton: React.FC<{ active: boolean, onClick: () => void, label: string }> = ({ active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${active ? 'bg-[#007AFF] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
  >
    {label}
  </button>
);

export default FinanceView;
