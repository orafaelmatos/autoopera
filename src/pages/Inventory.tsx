
import React, { useState } from 'react';
import { Product } from '../types';
import { 
  Package, 
  Plus, 
  AlertTriangle, 
  TrendingUp, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  DollarSign,
  Tag,
  Trash2,
  Edit2,
  X,
  Layers,
  ShoppingBag,
  Box,
  ChevronRight,
  Monitor
} from 'lucide-react';
import { productsApi } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Props {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const InventoryView: React.FC<Props> = ({ products, setProducts }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'consumo' | 'venda' | 'bar'>('all');

  // Form states
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<'consumo' | 'venda' | 'bar'>('venda');
  const [newStock, setNewStock] = useState(0);
  const [newMinStock, setNewMinStock] = useState(2);
  const [newCost, setTotalCost] = useState('');
  const [newSale, setSalePrice] = useState('');
  const [newExpiry, setNewExpiry] = useState('');

  const formatCurrency = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    const number = parseFloat(digits) / 100;
    return number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTotalCost(formatCurrency(e.target.value));
  };

  const handleSaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSalePrice(formatCurrency(e.target.value));
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalInventoryValue = products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  
  const today = new Date();
  const expiringSoonCount = products.filter(p => {
    if (!p.expiryDate) return false;
    const expiry = new Date(p.expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  }).length;

  const handleAddProduct = async () => {
    if (!newName || !newCost) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const numericCost = parseFloat(newCost.replace(/\D/g, "")) / 100;
    const numericSale = newSale ? parseFloat(newSale.replace(/\D/g, "")) / 100 : undefined;
    
    try {
      const product = await productsApi.create({
        name: newName,
        category: newCat,
        stock: newStock,
        minStock: newMinStock,
        costPrice: numericCost,
        salePrice: newCat === 'venda' || newCat === 'bar' ? numericSale : undefined,
        expiryDate: newExpiry || undefined,
        lastRestock: new Date().toISOString().split('T')[0]
      });

      setProducts(prev => [product, ...prev]);
      toast.success("Produto cadastrado!");
      setIsAdding(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      toast.error("Erro ao cadastrar produto");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-gray-900">Excluir este produto permanentemente?</p>
        <div className="flex gap-2 justify-end">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700"
          >
            Não
          </button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await productsApi.delete(id);
                setProducts(products.filter(p => p.id !== id));
                toast.success("Produto removido");
              } catch (error) {
                toast.error("Erro ao excluir");
              }
            }}
            className="px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Sim, Excluir
          </button>
        </div>
      </div>
    ), { duration: 5000, position: 'top-center' });
  };

  const resetForm = () => {
    setNewName('');
    setNewCat('venda');
    setNewStock(0);
    setTotalCost('');
    setSalePrice('');
    setNewExpiry('');
  };

  return (
    <div className="space-y-8 sm:space-y-12 animate-fadeIn max-w-[1200px] mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-1">Meus <span className="text-gray-500">Produtos</span></h2>
          <p className="text-gray-500 font-medium text-xs sm:text-sm">Controle de estoque e insumos.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#007AFF] text-white px-5 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-[11px] sm:text-[13px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#0063CC] transition-all shadow-xl active:scale-95 w-full md:w-auto"
        >
          <Plus size={18} />
          <span>Novo Produto</span>
        </button>
      </header>

      {/* Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <InventoryStatCard title="Total" value={`R$ ${totalInventoryValue.toFixed(0)}`} icon={<DollarSign className="text-green-500" size={18} />} />
        <InventoryStatCard title="Crítico" value={lowStockCount.toString()} icon={<AlertTriangle className={lowStockCount > 0 ? 'text-red-500' : 'text-gray-400'} size={18} />} highlight={lowStockCount > 0} />
        <InventoryStatCard title="Vencimento" value={expiringSoonCount.toString()} icon={<Calendar className={expiringSoonCount > 0 ? 'text-orange-500' : 'text-gray-400'} size={18} />} />
      </div>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
            <input 
              type="text" 
              placeholder="Buscar no inventário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1c1c1e] border border-white/5 rounded-2xl pl-12 pr-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all placeholder:text-gray-700 font-medium"
            />
          </div>
          <div className="flex bg-[#1c1c1e] p-1.5 rounded-2xl border border-white/5 overflow-x-auto whitespace-nowrap">
            {(['all', 'consumo', 'venda', 'bar'] as const).map((cat) => (
              <button 
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-6 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${filterCategory === cat ? 'bg-[#007AFF] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                {cat === 'all' ? 'Ver Todos' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#1c1c1e] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Produto / Categoria</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Nível de Estoque</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Custo / Venda</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Performance</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Controle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => {
                  const isLow = p.stock <= p.minStock;
                  const profit = p.salePrice ? p.salePrice - p.costPrice : 0;
                  const profitMargin = p.salePrice ? (profit / p.salePrice) * 100 : 0;

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-[14px] bg-black/40 border border-white/5 flex items-center justify-center text-gray-400">
                             <Package size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-white tracking-tight">{p.name}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{p.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col items-center">
                          <span className={`text-lg font-bold tracking-tight ${isLow ? 'text-red-500' : 'text-white'}`}>{p.stock}</span>
                          <div className="w-16 h-1.5 bg-black/40 rounded-full mt-2 overflow-hidden border border-white/5">
                             <div 
                               className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-[#007AFF]'}`} 
                               style={{ width: `${Math.min((p.stock / (p.minStock * 2)) * 100, 100)}%` }}
                             />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-medium">
                        <div className="flex flex-col">
                           <span className="text-gray-500 text-[10px] font-bold uppercase mb-0.5">Custo: R$ {p.costPrice.toFixed(2)}</span>
                           <span className="text-white text-sm font-bold tracking-tight">Venda: {p.salePrice ? `R$ ${p.salePrice.toFixed(2)}` : '--'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {p.salePrice ? (
                          <div>
                            <p className="text-sm font-bold text-green-500 tracking-tight">R$ {profit.toFixed(2)} Lucro</p>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{profitMargin.toFixed(0)}% margem</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Insumo</span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                          <button className="p-2 bg-white/5 text-gray-400 rounded-xl hover:text-white border border-white/5"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-500/10 text-red-500/50 rounded-xl hover:text-red-500 border border-red-500/10"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-20 text-gray-600 text-sm font-medium">
                Nenhum produto cadastrado nesta categoria.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Novo Produto */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#1c1c1e] border border-white/5 w-full max-w-2xl rounded-[32px] p-10 shadow-2xl relative"
            >
              <div className="mb-10">
                <h3 className="text-3xl font-bold tracking-tight text-white mb-2">Novo Produto</h3>
                <p className="text-gray-500 font-medium">Cadastre itens para venda ou insumos para o salão.</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Nome do Item</label>
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Pomada Efeito Mate" className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all placeholder:text-gray-700 font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Categoria</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['consumo', 'venda', 'bar'].map((cat: any) => (
                        <button key={cat} onClick={() => setNewCat(cat)} className={`py-4 text-[10px] font-black rounded-2xl border uppercase transition-all ${newCat === cat ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-lg shadow-[#007AFF]/20' : 'bg-black/20 text-gray-600 border-white/5'}`}>{cat}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Estoque Inicial</label>
                      <input type="number" value={newStock} onChange={e => setNewStock(Number(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Mínimo Segura</label>
                      <input type="number" value={newMinStock} onChange={e => setNewMinStock(Number(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Custo Unit.</label>
                      <input 
                        type="text" 
                        value={newCost} 
                        onChange={handleCostChange} 
                        placeholder="0,00" 
                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all font-medium placeholder:text-gray-700" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">PV (Venda)</label>
                      <input 
                        type="text" 
                        value={newSale} 
                        onChange={handleSaleChange} 
                        placeholder="0,00" 
                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all font-medium placeholder:text-gray-700" 
                        disabled={newCat === 'consumo'} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Data de Validade (Opcional)</label>
                       <input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all font-medium" />
                  </div>
                  {newCat !== 'consumo' && (
                    <div className="bg-green-500/5 border border-green-500/10 p-5 rounded-2xl">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Expectativa de Lucro Unit.</p>
                      <p className="text-xl font-bold text-green-500 tracking-tight">
                        R$ {((newSale ? parseFloat(newSale.replace(/\D/g, "")) / 100 : 0) - (newCost ? parseFloat(newCost.replace(/\D/g, "")) / 100 : 0)).toFixed(2)} 
                        <span className="text-xs text-gray-600 ml-1">
                          ({newSale && parseFloat(newSale.replace(/\D/g, "")) > 0 ? (((parseFloat(newSale.replace(/\D/g, "")) - parseFloat(newCost.replace(/\D/g, ""))) / parseFloat(newSale.replace(/\D/g, ""))) * 100).toFixed(0) : 0}% margem)
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-12">
                <button 
                  onClick={handleAddProduct} 
                  className="w-full py-5 bg-[#007AFF] text-white rounded-2xl font-bold hover:bg-[#0063CC] transition-all shadow-xl shadow-[#007AFF]/20 active:scale-[0.98]"
                >
                  Confirmar Cadastro
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

const InventoryStatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, trend?: string, highlight?: boolean, warning?: boolean }> = ({ title, value, icon, trend, highlight, warning }) => (
  <div className={`bg-[#1c1c1e] border border-white/5 p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] hover:bg-[#2c2c2e] transition-all group ${highlight ? 'ring-1 ring-red-500/30' : warning ? 'ring-1 ring-orange-500/30' : ''}`}>
    <div className="flex justify-between items-start mb-4 sm:mb-6">
      <span className="text-gray-500 text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em]">{title}</span>
      <div className="bg-white/5 p-1.5 sm:p-2 rounded-lg sm:rounded-xl group-hover:bg-white/10 transition-colors text-gray-400 group-hover:text-white">
        {React.cloneElement(icon as React.ReactElement, { size: 16, className: "sm:w-5 sm:h-5" })}
      </div>
    </div>
    <div className="flex items-end justify-between">
      <div className={`text-xl sm:text-3xl font-bold tracking-tight ${highlight ? 'text-red-500' : warning ? 'text-orange-500' : 'text-white'}`}>{value}</div>
      {trend && (
        <span className="text-[8px] sm:text-[10px] font-black text-gray-600 uppercase tracking-widest">
          {trend}
        </span>
      )}
    </div>
  </div>
);

export default InventoryView;
