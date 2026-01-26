
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
    <div className="space-y-16 sm:space-y-24 animate-fadeIn max-w-[1400px] mx-auto px-6 sm:px-12 pb-32">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-10">
        <div>
          <h2 className="text-4xl sm:text-6xl font-black italic uppercase text-primary font-title leading-none">Capital <span className="text-primary/20">&</span> Fluxo</h2>
          <p className="text-[10px] sm:text-xs text-primary/40 mt-6 font-black italic uppercase tracking-[0.4em] font-title italic">Gestão estratégica de ativos e performance financeira.</p>
        </div>
        <div className="flex gap-4">
          <button className="w-16 h-16 sm:w-20 sm:h-20 bg-white text-primary/20 rounded-[28px] flex items-center justify-center hover:text-primary transition-all shadow-xl shadow-primary/[0.02] border border-primary/5">
            <Download size={24} strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex-1 sm:flex-none bg-cta text-white px-10 sm:px-14 py-5 sm:py-6 rounded-[28px] text-[10px] sm:text-xs font-black italic uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-cta/90 transition-all shadow-2xl shadow-cta/20 active:scale-95 font-title"
          >
            <Plus size={20} strokeWidth={3} />
            <span>Nova Operação</span>
          </button>
        </div>
      </header>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        <FinanceStatCard 
          title="Receita Operacional" 
          value={`R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={<ArrowUpCircle className="text-cta" size={28} strokeWidth={3} />} 
          trend="+12%"
        />
        <FinanceStatCard 
          title="Deduções e Custos" 
          value={`R$ ${totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={<ArrowDownCircle className="text-primary/20" size={28} strokeWidth={3} />} 
          trend="-4%"
        />
        <FinanceStatCard 
          title="Capital Pendente" 
          value={`R$ ${pendingExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={<Clock className="text-cta" size={28} strokeWidth={3} />} 
        />
        <FinanceStatCard 
          title="Saldo Líquido" 
          value={`R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={<TrendingUp className="text-primary" size={28} strokeWidth={3} />} 
          highlight 
        />
      </div>

      <div className="space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 border-b border-primary/5 pb-10">
          <h3 className="text-xl sm:text-2xl font-black italic uppercase text-primary font-title italic">Histórico de Lançamentos</h3>
          <div className="flex bg-white p-2 rounded-[24px] border border-primary/5 shadow-xl shadow-primary/[0.02]">
            <FilterButton active={filterType === 'all'} onClick={() => setFilterType('all')} label="Consolidado" />
            <FilterButton active={filterType === 'income'} onClick={() => setFilterType('income')} label="Entradas" />
            <FilterButton active={filterType === 'expense'} onClick={() => setFilterType('expense')} label="Saídas" />
          </div>
        </div>

        {/* Listagem de Transações - Mobile & Desktop */}
        <div className="space-y-6 sm:space-y-0 sm:bg-white/80 sm:backdrop-blur-xl sm:border sm:border-primary/5 sm:rounded-[48px] sm:overflow-hidden sm:shadow-2xl sm:shadow-primary/[0.02]">
          <div className="sm:hidden space-y-6">
            {filteredTransactions.map(t => (
              <div key={t.id} className="bg-white border border-primary/5 p-8 rounded-[40px] flex items-center justify-between shadow-xl shadow-primary/[0.02]">
                <div className="flex items-center gap-6">
                  <div className="text-[10px] text-primary/30 font-black italic uppercase bg-background w-14 h-14 flex flex-col items-center justify-center rounded-2xl border border-primary/5 leading-none shrink-0 font-title">
                    <span className="text-sm text-primary">{new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit' })}</span>
                    <span className="text-[8px] mt-1 tracking-widest">{new Date(t.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black italic text-primary uppercase leading-tight font-title">{t.description}</h4>
                    <p className="text-[9px] text-primary/30 font-black italic uppercase tracking-[0.2em] mt-1 font-title">{t.category}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-3">
                  <span className={`text-sm font-black italic tracking-tighter font-title ${t.type === 'income' ? 'text-cta' : 'text-primary/40'}`}>
                    {t.type === 'income' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <button 
                    onClick={() => handleToggleStatus(t.id)}
                    className={`px-4 py-2 rounded-xl text-[8px] font-black italic uppercase tracking-[0.2em] border transition-all font-title ${
                      t.status === 'paid' 
                        ? 'bg-cta/5 text-cta border-cta/10' 
                        : 'bg-primary/5 text-primary/30 border-primary/5'
                    }`}
                  >
                    {t.status === 'paid' ? 'Efetivado' : 'Pendente'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-primary/5 bg-background/30">
                  <th className="px-12 py-8 text-[10px] font-black italic text-primary/30 uppercase tracking-[0.4em] font-title italic">Data / Dossier</th>
                  <th className="px-12 py-8 text-[10px] font-black italic text-primary/30 uppercase tracking-[0.4em] text-right font-title italic">Montante</th>
                  <th className="px-12 py-8 text-[10px] font-black italic text-primary/30 uppercase tracking-[0.4em] text-center font-title italic">Status Operacional</th>
                  <th className="px-12 py-8 text-[10px] font-black italic text-primary/30 uppercase tracking-[0.4em] text-right font-title italic">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-primary/[0.01] transition-colors group">
                    <td className="px-12 py-10">
                      <div className="flex items-center gap-8">
                         <div className="text-xs text-primary/30 font-black italic uppercase bg-background px-5 py-3 rounded-2xl border border-primary/5 font-title italic">
                            {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                         </div>
                         <div>
                            <p className="font-black italic text-primary uppercase text-sm tracking-tight font-title">{t.description}</p>
                            <p className="text-[10px] text-primary/30 font-black italic uppercase tracking-[0.2em] mt-1 font-title">{t.category}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-12 py-10 text-right">
                      <span className={`text-xl font-black italic tracking-tighter font-title ${t.type === 'income' ? 'text-cta' : 'text-primary/20'}`}>
                        {t.type === 'income' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-12 py-10">
                      <div className="flex justify-center">
                        <button 
                          onClick={() => handleToggleStatus(t.id)}
                          className={`px-6 py-3 rounded-2xl text-[10px] font-black italic uppercase tracking-[0.2em] border transition-all font-title ${
                            t.status === 'paid' 
                              ? 'bg-cta/5 text-cta border-cta/10 hover:bg-cta hover:text-white' 
                              : 'bg-primary/5 text-primary/20 border-primary/5 hover:bg-primary/10'
                          }`}
                        >
                          {t.status === 'paid' ? 'Efetivado' : 'Pendente'}
                        </button>
                      </div>
                    </td>
                    <td className="px-12 py-10 text-right">
                        <button className="w-12 h-12 flex items-center justify-center text-primary/10 hover:text-red-500 transition-all bg-background rounded-2xl opacity-0 group-hover:opacity-100 border border-primary/5 shadow-sm">
                          <X size={20} strokeWidth={3} />
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredTransactions.length === 0 && (
            <div className="text-center py-32 text-primary/20 text-[10px] font-black italic uppercase tracking-[0.4em] font-title italic">
              Nenhuma movimentação identificada nos registros.
            </div>
          )}
        </div>
      </div>

      {/* Modal Nova Transação */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-primary/40 backdrop-blur-xl z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white border border-primary/5 w-full max-w-2xl rounded-[48px] p-12 sm:p-20 shadow-[0_48px_96px_-12px_rgba(15,76,92,0.3)] relative max-h-[90vh] overflow-y-auto custom-scrollbar-hidden"
            >
              <button 
                onClick={() => setIsAdding(false)}
                className="absolute top-10 right-10 w-12 h-12 bg-background text-primary/20 rounded-2xl flex items-center justify-center hover:text-primary transition-all group"
              >
                <X size={24} strokeWidth={3} />
              </button>

              <div className="mb-16">
                <h3 className="text-4xl sm:text-5xl font-black italic uppercase text-primary mb-4 font-title leading-none">Novo Lançamento</h3>
                <p className="text-[10px] text-primary/30 font-black italic uppercase tracking-[0.4em] font-title italic">Registre uma nova movimentação no capital.</p>
              </div>
              
              <div className="space-y-12">
                <div className="grid grid-cols-2 gap-6">
                  <button 
                    onClick={() => setType('income')}
                    className={`py-8 rounded-[32px] font-black italic uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all text-[10px] font-title ${type === 'income' ? 'bg-cta text-white shadow-2xl shadow-cta/20' : 'bg-background text-primary/20 border border-primary/5'}`}
                  >
                    <ArrowUpCircle size={20} strokeWidth={3} /> Entrada
                  </button>
                  <button 
                    onClick={() => setType('expense')}
                    className={`py-8 rounded-[32px] font-black italic uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all text-[10px] font-title ${type === 'expense' ? 'bg-primary text-white shadow-2xl shadow-primary/20' : 'bg-background text-primary/20 border border-primary/5'}`}
                  >
                    <ArrowDownCircle size={20} strokeWidth={3} /> Saída
                  </button>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-black italic text-primary/30 tracking-[0.4em] ml-8 font-title italic">Dossier / Descrição</label>
                  <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Aquisição de Suprimentos Premium" className="w-full bg-background border-2 border-transparent rounded-[28px] px-10 py-6 text-primary font-black italic uppercase text-sm focus:border-cta/20 focus:bg-white outline-none transition-all placeholder:text-primary/10 font-title shadow-sm" />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-black italic text-primary/30 tracking-[0.4em] ml-8 font-title italic">Montante (R$)</label>
                    <input type="text" value={amount} onChange={handleAmountChange} placeholder="0,00" className="w-full bg-background border-2 border-transparent rounded-[28px] px-10 py-6 text-primary font-black italic uppercase text-sm focus:border-cta/20 focus:bg-white outline-none transition-all placeholder:text-primary/10 font-title shadow-sm" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-black italic text-primary/30 tracking-[0.4em] ml-8 font-title italic">Categoria</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-background border-2 border-transparent rounded-[28px] px-10 py-6 text-primary font-black italic uppercase text-sm focus:border-cta/20 focus:bg-white outline-none transition-all font-title shadow-sm appearance-none">
                      <option value="">Selecionar</option>
                      <option value="Produtos">Produtos</option>
                      <option value="Operacional">Operacional</option>
                      <option value="Equipe">Equipe</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-black italic text-primary/30 tracking-[0.4em] ml-8 font-title italic">Protocolo de Pagamento</label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['pix', 'card', 'cash'] as const).map(m => (
                      <button 
                        key={m}
                        onClick={() => setMethod(m)}
                        className={`py-5 rounded-2xl font-black italic uppercase tracking-[0.2em] text-[9px] border transition-all font-title ${method === m ? 'bg-cta/10 text-cta border-cta/20' : 'bg-background text-primary/20 border-primary/5 hover:border-primary/10'}`}
                      >
                        {m === 'pix' ? 'PIX' : m === 'card' ? 'CARTÃO' : 'ESPÉCIE'}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleAddTransaction}
                  className="w-full py-8 bg-cta text-white rounded-[28px] font-black italic uppercase tracking-[0.4em] text-sm hover:shadow-2xl hover:shadow-cta/20 transition-all font-title flex items-center justify-center gap-4 mt-8 group"
                >
                  Confirmar Lançamento <CheckCircle2 size={24} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
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
  <div className={`bg-white border p-10 sm:p-12 rounded-[48px] hover:translate-y-[-4px] transition-all group shadow-xl shadow-primary/[0.02] relative overflow-hidden ${highlight ? 'border-primary/20' : 'border-primary/5'}`}>
    <div className="flex justify-between items-start mb-10 relative z-10">
      <span className="text-primary/30 text-[10px] sm:text-xs font-black italic uppercase tracking-[0.3em] font-title italic leading-none">{title}</span>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all bg-background border border-primary/5 group-hover:scale-110 duration-500`}>
        {icon}
      </div>
    </div>
    <div className="flex items-end justify-between relative z-10">
      <div className={`text-3xl sm:text-5xl font-black italic tracking-tighter text-primary font-title`}>{value}</div>
      {trend && (
        <span className={`text-[10px] font-black italic px-4 py-2 rounded-xl h-fit border ${trend.startsWith('+') ? 'bg-cta/5 text-cta border-cta/10' : 'bg-primary/5 text-primary/20 border-primary/5'} font-title`}>
          {trend}
        </span>
      )}
    </div>
    {highlight && (
      <div className="absolute top-0 right-0 w-32 h-32 bg-cta/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-cta/10 transition-all duration-700" />
    )}
  </div>
);

const FilterButton: React.FC<{ active: boolean, onClick: () => void, label: string }> = ({ active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={`px-8 sm:px-12 py-4 rounded-[20px] text-[10px] font-black italic uppercase tracking-[0.2em] transition-all font-title ${active ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-primary/30 hover:text-primary hover:bg-background'}`}
  >
    {label}
  </button>
);

export default FinanceView;
