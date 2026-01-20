
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
import toast from 'react-hot-toast';

interface Props {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const FinanceView: React.FC<Props> = ({ transactions, setTransactions }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Form states
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState('');
  const [method, setMethod] = useState<'cash' | 'card' | 'pix'>('pix');

  const formatCurrency = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    const number = parseFloat(digits) / 100;
    return number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(formatCurrency(e.target.value));
  };

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
      toast.success(`Status atualizado para ${newStatus === 'paid' ? 'efetivado' : 'pendente'}`);
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleAddTransaction = async () => {
    if (!desc || !amount) {
      toast.error("Descrição e valor são obrigatórios");
      return;
    }
    const numericAmount = parseFloat(amount.replace(/\D/g, "")) / 100;
    try {
      const newTrans = await transactionsApi.create({
        description: desc,
        amount: numericAmount,
        type: type,
        category: category,
        date: new Date().toISOString(),
        status: 'paid',
        paymentMethod: method
      });
      setTransactions([newTrans, ...transactions]);
      toast.success("Lançamento realizado!");
      setIsAdding(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao criar transação:", error);
      toast.error("Erro ao salvar lançamento");
    }
  };

  const resetForm = () => {
    setDesc('');
    setAmount('');
    setCategory('');
  };

  return (
    <div className="space-y-8 sm:space-y-12 animate-fadeIn max-w-[1200px] mx-auto px-4 sm:px-0 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">Gestão <span className="text-gray-500">Financeira</span></h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 font-medium">Controle seu fluxo de caixa e monitore seus lucros.</p>
        </div>
        <div className="flex gap-3 sm:gap-4">
          <button className="p-3.5 sm:p-4 bg-white/5 text-gray-400 rounded-xl sm:rounded-2xl hover:text-white hover:bg-white/10 transition-all border border-white/5">
            <Download size={20} className="sm:w-[22px] sm:h-[22px]" />
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex-1 sm:flex-none bg-accent text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-[11px] sm:text-[13px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#0063CC] transition-all shadow-xl shadow-accent/20 active:scale-95"
          >
            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span>Nova Operação</span>
          </button>
        </div>
      </header>

      {/* Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <FinanceStatCard title="Receita (30d)" value={`R$ ${totalIncome.toFixed(2)}`} icon={<ArrowUpCircle className="text-white/40" size={16} />} />
        <FinanceStatCard title="Despesas (30d)" value={`R$ ${totalExpense.toFixed(2)}`} icon={<ArrowDownCircle className="text-red-500" size={16} />} />
        <FinanceStatCard title="Pendente" value={`R$ ${pendingExpense.toFixed(2)}`} icon={<Clock className="text-orange-500" size={16} />} />
        <FinanceStatCard title="Saldo Líquido" value={`R$ ${balance.toFixed(2)}`} icon={<TrendingUp className="text-green-500" size={16} />} highlight />
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white font-medium">Transações Recentes</h3>
          <div className="flex bg-[#1c1c1e] p-1 rounded-xl sm:rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
            <FilterButton active={filterType === 'all'} onClick={() => setFilterType('all')} label="Todas" />
            <FilterButton active={filterType === 'income'} onClick={() => setFilterType('income')} label="Entradas" />
            <FilterButton active={filterType === 'expense'} onClick={() => setFilterType('expense')} label="Saídas" />
          </div>
        </div>

        {/* Listagem de Transações - Mobile First */}
        <div className="space-y-3 sm:space-y-0 sm:bg-[#1c1c1e] sm:border sm:border-white/5 sm:rounded-[32px] sm:overflow-hidden sm:shadow-2xl">
          {/* Card list for Mobile, Table for Desktop */}
          <div className="sm:hidden space-y-3">
            {filteredTransactions.map(t => (
              <div key={t.id} className="bg-[#1c1c1e] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-[10px] text-gray-500 font-bold bg-black/20 w-10 h-10 flex flex-col items-center justify-center rounded-xl border border-white/5 leading-tight shrink-0">
                    <span className="text-xs">{new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit' })}</span>
                    <span className="text-[8px] uppercase">{new Date(t.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">{t.description}</h4>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">{t.category}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className={`text-sm font-bold tracking-tight ${t.type === 'income' ? 'text-white' : 'text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'} R$ {Number(t.amount).toFixed(2)}
                  </span>
                  <button 
                    onClick={() => handleToggleStatus(t.id)}
                    className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${
                      t.status === 'paid' 
                        ? 'bg-green-500/10 text-green-500 border-green-500/10' 
                        : 'bg-orange-500/10 text-orange-500 border-orange-500/10'
                    }`}
                  >
                    {t.status === 'paid' ? 'PAGO' : 'PENDENTE'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block overflow-x-auto">
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
          </div>
          {filteredTransactions.length === 0 && (
            <div className="text-center py-20 text-gray-500 text-sm font-medium">
              Nenhuma movimentação financeira encontrada.
            </div>
          )}
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
              className="bg-[#1c1c1e] border border-white/5 w-full max-w-md rounded-[32px] p-6 sm:p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setIsAdding(false)}
                className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-all"
              >
                <X size={20} />
              </button>

              <div className="mb-8">
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">Novo Lançamento</h3>
                <p className="text-gray-500 text-sm font-medium">Registre uma nova entrada ou saída do caixa.</p>
              </div>
              
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setType('income')}
                    className={`py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-widest ${type === 'income' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-black/20 text-gray-500 border border-white/5'}`}
                  >
                    <ArrowUpCircle size={16} /> Entrada
                  </button>
                  <button 
                    onClick={() => setType('expense')}
                    className={`py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-widest ${type === 'expense' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-black/20 text-gray-500 border border-white/5'}`}
                  >
                    <ArrowDownCircle size={16} /> Saída
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Descrição</label>
                  <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Conta de Luz" className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 sm:py-4 text-white focus:border-white/20 outline-none transition-all placeholder:text-gray-700 font-medium text-base" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Valor (R$)</label>
                    <input 
                      type="text" 
                      value={amount} 
                      onChange={handleAmountChange} 
                      placeholder="0,00" 
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 sm:py-4 text-white focus:border-white/20 outline-none transition-all placeholder:text-gray-700 font-medium text-base" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Categoria</label>
                    <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="Ex: Aluguel" className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 sm:py-4 text-white focus:border-white/20 outline-none transition-all placeholder:text-gray-700 font-medium text-base" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-1">Forma de Pagamento</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['pix', 'card', 'cash'].map((m) => (
                      <button
                        key={m}
                        onClick={() => setMethod(m as any)}
                        className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${method === m ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-gray-500'}`}
                      >
                        {m === 'cash' ? 'Dinheiro' : m.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-10">
                <button 
                  onClick={handleAddTransaction} 
                  className="w-full py-4 sm:py-5 bg-accent text-white rounded-2xl font-bold hover:bg-[#0063CC] transition-all shadow-xl shadow-accent/20 active:scale-[0.98]"
                >
                  Salvar Lançamento
                </button>
                <button 
                  onClick={() => setIsAdding(false)} 
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

const FinanceStatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, trend?: string, highlight?: boolean }> = ({ title, value, icon, trend, highlight }) => (
  <div className={`bg-[#1c1c1e] border border-white/5 p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] hover:bg-[#2c2c2e] transition-all group ${highlight ? 'ring-1 ring-white/10' : ''}`}>
    <div className="flex justify-between items-start mb-4 sm:mb-6">
      <span className="text-gray-500 text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em]">{title}</span>
      <div className="bg-white/5 p-1.5 sm:p-2 rounded-lg sm:rounded-xl group-hover:bg-white/10 transition-colors">
        {React.cloneElement(icon as React.ReactElement, { size: 16, className: "sm:w-5 sm:h-5" })}
      </div>
    </div>
    <div className="flex items-end justify-between">
      <div className={`text-base sm:text-3xl font-bold tracking-tight text-white`}>{value}</div>
      {trend && (
        <span className={`text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg ${trend.startsWith('+') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {trend}
        </span>
      )}
    </div>
  </div>
);

const FilterButton: React.FC<{ active: boolean, onClick: () => void, label: string }> = ({ active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${active ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
  >
    {label}
  </button>
);

export default FinanceView;
