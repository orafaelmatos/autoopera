
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
  CreditCard
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const FinanceView: React.FC<Props> = ({ transactions, setTransactions }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Cálculos de Resumo
  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingExpense = transactions
    .filter(t => t.type === 'expense' && t.status === 'pending')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Filtro de lista
  const filteredTransactions = transactions.filter(t => 
    filterType === 'all' ? true : t.type === filterType
  );

  const handleToggleStatus = (id: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, status: t.status === 'paid' ? 'pending' : 'paid' } : t
    ));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-oswald font-bold uppercase tracking-tight">Gestão <span className="text-yellow-500">Financeira</span></h2>
          <p className="text-gray-400 mt-1">Controle de fluxo de caixa e resultados.</p>
        </div>
        <div className="flex gap-2">
          <button className="p-3 bg-gray-900 border border-gray-800 text-gray-400 rounded-xl hover:text-white transition-all">
            <Download size={20} />
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20"
          >
            <Plus size={20} /> Nova Transação
          </button>
        </div>
      </header>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowUpCircle size={80} className="text-green-500" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Entradas (Mês)</p>
          <h3 className="text-3xl font-oswald font-bold text-green-500">R$ {totalIncome.toFixed(2)}</h3>
          <p className="text-[10px] text-gray-600 mt-2 flex items-center gap-1">
            <TrendingUp size={12} /> +12% em relação ao mês anterior
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowDownCircle size={80} className="text-red-500" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Saídas Pagas</p>
          <h3 className="text-3xl font-oswald font-bold text-red-500">R$ {totalExpense.toFixed(2)}</h3>
          <p className="text-[10px] text-gray-600 mt-2">Pendente: R$ {pendingExpense.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-3xl shadow-xl shadow-yellow-500/10">
          <p className="text-xs font-bold text-black/60 uppercase tracking-widest mb-2">Saldo em Caixa</p>
          <h3 className="text-3xl font-oswald font-bold text-black">R$ {balance.toFixed(2)}</h3>
          <div className="mt-4 bg-black/10 rounded-xl p-2">
            <p className="text-[10px] text-black/70 font-bold flex items-center gap-1">
              <CreditCard size={12} /> Taxas de cartão previstas: R$ {(totalIncome * 0.03).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Listagem e Filtros */}
      <section className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xl font-oswald font-bold uppercase flex items-center gap-2">
            <DollarSign className="text-yellow-500" size={20} /> Fluxo de Caixa
          </h3>
          <div className="flex bg-black p-1 rounded-xl border border-gray-800">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'all' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Tudo
            </button>
            <button 
              onClick={() => setFilterType('income')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'income' ? 'bg-green-500/20 text-green-500' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Entradas
            </button>
            <button 
              onClick={() => setFilterType('expense')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'expense' ? 'bg-red-500/20 text-red-500' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Saídas
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/50">
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Descrição</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Categoria</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Valor</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredTransactions.map(t => (
                <tr key={t.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Calendar size={12} /> {new Date(t.date).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-semibold text-white">{t.description}</span>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase">
                      <Tag size={10} /> {t.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm font-bold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleToggleStatus(t.id)}
                      className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md transition-all ${
                        t.status === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                      }`}
                    >
                      {t.status === 'paid' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                      {t.status === 'paid' ? 'PAGO' : 'PENDENTE'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-gray-600 hover:text-white transition-all">
                      <Plus size={16} className="rotate-45" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <div className="text-center py-20 text-gray-600 text-sm italic">
              Nenhuma movimentação financeira encontrada para este filtro.
            </div>
          )}
        </div>
      </section>

      {/* Modal Nova Transação */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-oswald font-bold uppercase tracking-wide">Nova <span className="text-yellow-500">Transação</span></h3>
              <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white transition-all">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button className="py-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl font-bold flex items-center justify-center gap-2">
                  <ArrowUpCircle size={18} /> Entrada
                </button>
                <button className="py-3 bg-gray-800 border border-gray-700 text-gray-500 rounded-xl font-bold flex items-center justify-center gap-2">
                  <ArrowDownCircle size={18} /> Saída
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Descrição</label>
                <input type="text" placeholder="Ex: Conta de Luz" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Valor (R$)</label>
                  <input type="number" placeholder="0,00" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Data</label>
                  <input type="date" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Status Inicial</label>
                <select className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none">
                  <option value="paid">Já pago/recebido</option>
                  <option value="pending">Pendente (Lançar no Contas a Pagar)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-4 border border-gray-800 rounded-2xl font-bold text-gray-400 hover:bg-gray-800 transition-all">Cancelar</button>
              <button onClick={() => setIsAdding(false)} className="flex-1 py-4 bg-yellow-500 text-black rounded-2xl font-bold hover:bg-yellow-400 transition-all">Salvar Lançamento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceView;
