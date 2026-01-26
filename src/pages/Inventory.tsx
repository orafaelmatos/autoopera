
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
  Monitor,
  CheckCircle2
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
    <div className="space-y-16 sm:space-y-24 animate-fadeIn max-w-[1400px] mx-auto px-6 sm:px-12 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <h2 className="text-4xl sm:text-6xl font-black italic uppercase text-primary font-title leading-none">Ativos <span className="text-primary/20">&</span> Insumos</h2>
          <p className="text-[10px] sm:text-xs text-primary/40 mt-6 font-black italic uppercase tracking-[0.4em] font-title italic">Controle patrimonial e gestão de suprimentos premium.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-cta text-white px-10 sm:px-14 py-5 sm:py-6 rounded-[28px] text-[10px] sm:text-xs font-black italic uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-cta/90 transition-all shadow-2xl shadow-cta/20 active:scale-95 w-full md:w-auto font-title"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Novo Ativo</span>
        </button>
      </header>

      {/* Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <InventoryStatCard 
          title="Capital Imobilizado" 
          value={`R$ ${totalInventoryValue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
          icon={<DollarSign className="text-cta" size={28} strokeWidth={3} />} 
        />
        <InventoryStatCard 
          title="Nível de Alerta" 
          value={lowStockCount.toString()} 
          icon={<AlertTriangle className={lowStockCount > 0 ? 'text-cta' : 'text-primary/20'} size={28} strokeWidth={3} />} 
          highlight={lowStockCount > 0} 
        />
        <InventoryStatCard 
          title="Ciclo de Validade" 
          value={expiringSoonCount.toString()} 
          icon={<Calendar className={expiringSoonCount > 0 ? 'text-cta' : 'text-primary/20'} size={28} strokeWidth={3} />} 
          warning={expiringSoonCount > 0} 
        />
      </div>

      <div className="space-y-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="relative flex-1 max-w-xl group">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-cta transition-colors" size={20} strokeWidth={3} />
            <input 
              type="text" 
              placeholder="Rastrear produto no dossier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-transparent rounded-[32px] pl-20 pr-10 py-6 text-primary font-black italic uppercase text-sm focus:border-cta/20 outline-none transition-all placeholder:text-primary/10 font-title shadow-xl shadow-primary/[0.02]"
            />
          </div>
          <div className="flex bg-white p-2 rounded-[24px] border border-primary/5 overflow-x-auto no-scrollbar shadow-xl shadow-primary/[0.02]">
            {(['all', 'consumo', 'venda', 'bar'] as const).map((cat) => (
              <button 
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-8 py-4 rounded-[20px] text-[10px] font-black italic uppercase tracking-[0.2em] transition-all font-title whitespace-nowrap ${filterCategory === cat ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-primary/30 hover:text-primary'}`}
              >
                {cat === 'all' ? 'Ver Todos' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-primary/5 rounded-[48px] overflow-hidden shadow-2xl shadow-primary/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-primary/5 bg-background/30">
                  <th className="px-12 py-8 text-[10px] font-black italic text-primary/30 uppercase tracking-[0.4em] font-title italic">Ativo / Segmento</th>
                  <th className="px-12 py-8 text-[10px] font-black italic text-primary/30 uppercase tracking-[0.4em] text-center font-title italic">Status de Estoque</th>
                  <th className="px-12 py-8 text-[10px] font-black italic text-primary/30 uppercase tracking-[0.4em] font-title italic">Valores (C / V)</th>
                  <th className="px-12 py-8 text-[10px] font-black italic text-primary/30 uppercase tracking-[0.4em] font-title italic">Performance</th>
                  <th className="px-12 py-8 text-[10px] font-black italic text-primary/30 uppercase tracking-[0.4em] text-right font-title italic">Controles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5 font-title italic">
                {filtered.map(p => {
                  const isLow = p.stock <= p.minStock;
                  const profit = p.salePrice ? p.salePrice - p.costPrice : 0;
                  const profitMargin = p.salePrice ? (profit / p.salePrice) * 100 : 0;

                  return (
                    <tr key={p.id} className="hover:bg-primary/[0.01] transition-colors group">
                      <td className="px-12 py-10">
                        <div className="flex items-center gap-8">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500 ${isLow ? 'bg-cta/10 text-cta border-cta/20' : 'bg-background text-primary/20 border-primary/5'}`}>
                             <Package size={24} strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="font-black italic text-primary uppercase text-sm tracking-tight">{p.name}</p>
                            <p className="text-[10px] text-primary/30 font-black italic uppercase tracking-[0.2em] mt-1">{p.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-12 py-10">
                        <div className="flex flex-col items-center">
                          <span className={`text-xl font-black italic tracking-tighter ${isLow ? 'text-cta' : 'text-primary'}`}>{p.stock}</span>
                          <div className="w-24 h-2 bg-background rounded-full mt-4 overflow-hidden border border-primary/5 relative">
                             <div 
                               className={`h-full rounded-full transition-all duration-1000 ${isLow ? 'bg-cta animate-pulse' : 'bg-primary'}`} 
                               style={{ width: `${Math.min((p.stock / (p.minStock * 2)) * 100, 100)}%` }}
                             />
                          </div>
                        </div>
                      </td>
                      <td className="px-12 py-10">
                        <div className="flex flex-col gap-2">
                           <span className="text-primary/30 text-[10px] font-black italic uppercase tracking-widest">C: R$ {p.costPrice.toFixed(2)}</span>
                           <span className="text-primary text-sm font-black italic">V: {p.salePrice ? `R$ ${p.salePrice.toFixed(2)}` : '--'}</span>
                        </div>
                      </td>
                      <td className="px-12 py-10">
                        {p.salePrice ? (
                          <div>
                            <p className="text-sm font-black italic text-green-600 tracking-tight uppercase">+ R$ {profit.toFixed(2)}</p>
                            <span className="text-[10px] text-primary/30 font-black italic uppercase tracking-[0.2em]">{profitMargin.toFixed(0)}% ROI</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-primary/20 font-black italic uppercase tracking-[0.3em]">Patrimonial</span>
                        )}
                      </td>
                      <td className="px-12 py-10 text-right">
                        <div className="flex justify-end gap-4 opacity-0 group-hover:opacity-100 transition-all">
                          <button className="w-12 h-12 flex items-center justify-center bg-background text-primary/20 rounded-2xl hover:text-primary border border-primary/5 shadow-sm transition-all"><Edit2 size={18} strokeWidth={2.5} /></button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="w-12 h-12 flex items-center justify-center bg-cta/10 text-cta rounded-2xl hover:bg-cta hover:text-white border border-cta/10 transition-all shadow-sm"><Trash2 size={18} strokeWidth={2.5} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-40 bg-white">
                <Box size={80} className="text-primary/[0.03] mx-auto mb-8" strokeWidth={1} />
                <p className="text-primary/20 text-[10px] font-black italic uppercase tracking-[0.4em] font-title italic">
                  Nenhum ativo localizado no almoxarifado.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Novo Produto */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-primary/40 backdrop-blur-xl z-[100] flex items-center justify-center p-6 sm:p-12 font-title">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white border border-primary/5 w-full max-w-3xl rounded-[48px] p-12 sm:p-20 shadow-[0_48px_96px_-12px_rgba(15,76,92,0.3)] relative max-h-[90vh] overflow-y-auto custom-scrollbar-hidden"
            >
              <button 
                onClick={() => setIsAdding(false)}
                className="absolute top-10 right-10 w-12 h-12 bg-background text-primary/20 rounded-2xl flex items-center justify-center hover:text-primary transition-all group"
              >
                <X size={24} strokeWidth={3} />
              </button>

              <div className="mb-16">
                <h3 className="text-4xl sm:text-5xl font-black italic uppercase text-primary mb-4 leading-none font-title">Novo Ativo</h3>
                <p className="text-[10px] text-primary/30 font-black italic uppercase tracking-[0.4em] font-title italic">Incorporar novo item ao patrimônio Elite.</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-10 sm:gap-16">
                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-black italic text-primary/30 tracking-[0.4em] ml-8 block">Nomenclatura</label>
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Cera Matte Elite" className="w-full bg-background border-2 border-transparent rounded-[28px] px-10 py-6 text-primary font-black italic uppercase text-sm focus:border-cta/20 focus:bg-white outline-none transition-all placeholder:text-primary/10 shadow-sm" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-black italic text-primary/30 tracking-[0.4em] ml-8 block">Segmento</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['consumo', 'venda', 'bar'].map((cat: any) => (
                        <button key={cat} onClick={() => setNewCat(cat)} className={`py-5 text-[9px] font-black italic rounded-2xl border uppercase transition-all ${newCat === cat ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20' : 'bg-background text-primary/20 border-primary/5 hover:border-primary/10'}`}>{cat}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-black italic text-primary/30 tracking-[0.4em] ml-8 block">Estoque</label>
                      <input type="number" value={newStock} onChange={e => setNewStock(Number(e.target.value))} className="w-full bg-background border-2 border-transparent rounded-[28px] px-10 py-6 text-primary font-black italic uppercase text-sm focus:border-cta/20 focus:bg-white outline-none transition-all shadow-sm" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-black italic text-primary/30 tracking-[0.4em] ml-8 block">Mínimo</label>
                      <input type="number" value={newMinStock} onChange={e => setNewMinStock(Number(e.target.value))} className="w-full bg-background border-2 border-transparent rounded-[28px] px-10 py-6 text-primary font-black italic uppercase text-sm focus:border-cta/20 focus:bg-white outline-none transition-all shadow-sm" />
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-black italic text-primary/30 tracking-[0.4em] ml-8 block">Custo Unit.</label>
                      <input 
                        type="text" 
                        value={newCost} 
                        onChange={handleCostChange} 
                        placeholder="0,00" 
                        className="w-full bg-background border-2 border-transparent rounded-[28px] px-10 py-6 text-primary font-black italic uppercase text-sm focus:border-cta/20 focus:bg-white outline-none transition-all placeholder:text-primary/10 shadow-sm" 
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-black italic text-primary/30 tracking-[0.4em] ml-8 block">PV (Venda)</label>
                      <input 
                        type="text" 
                        value={newSale} 
                        onChange={handleSaleChange} 
                        placeholder="0,00" 
                        className="w-full bg-background border-2 border-transparent rounded-[28px] px-10 py-6 text-primary font-black italic uppercase text-sm focus:border-cta/20 focus:bg-white outline-none transition-all placeholder:text-primary/10 disabled:opacity-10 shadow-sm" 
                        disabled={newCat === 'consumo'} 
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                       <label className="text-[10px] uppercase font-black italic text-primary/30 tracking-[0.4em] ml-8 block">Ciclo de Validade</label>
                       <input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} className="w-full bg-background border-2 border-transparent rounded-[28px] px-10 py-6 text-primary font-black italic uppercase text-sm focus:border-cta/20 focus:bg-white outline-none transition-all shadow-sm" />
                  </div>
                  {newCat !== 'consumo' && (
                    <div className="bg-cta/5 border border-cta/10 p-8 rounded-[32px] shadow-inner relative overflow-hidden group/profit">
                      <p className="text-[10px] text-cta font-black italic uppercase tracking-[0.2em] mb-4 relative z-10">Expectativa de ROI</p>
                      <p className="text-3xl font-black italic text-cta tracking-tighter font-title relative z-10">
                        R$ {((newSale ? parseFloat(newSale.replace(/\D/g, "")) / 100 : 0) - (newCost ? parseFloat(newCost.replace(/\D/g, "")) / 100 : 0)).toFixed(2)} 
                        <span className="text-xs text-cta/40 ml-4 font-black italic uppercase">
                          ({newSale && parseFloat(newSale.replace(/\D/g, "")) > 0 ? (((parseFloat(newSale.replace(/\D/g, "")) - parseFloat(newCost.replace(/\D/g, ""))) / parseFloat(newSale.replace(/\D/g, ""))) * 100).toFixed(0) : 0}% Margem)
                        </span>
                      </p>
                      <TrendingUp size={48} className="absolute -right-4 -bottom-4 text-cta/10 group-hover/profit:scale-110 transition-transform duration-700" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-6 mt-16 sm:mt-20">
                <button 
                  onClick={handleAddProduct} 
                  className="w-full py-10 bg-cta text-white rounded-[32px] font-black italic uppercase tracking-[0.6em] text-sm hover:shadow-2xl hover:shadow-cta/20 transition-all flex items-center justify-center gap-6 group"
                >
                  Confirmar Incorporação <CheckCircle2 size={24} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                </button>
                <button 
                  onClick={() => setIsAdding(false)} 
                  className="w-full py-4 text-primary/20 hover:text-primary font-black italic uppercase tracking-[0.4em] text-[10px] transition-all text-center"
                >
                  Abortar Missão
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
  <div className={`bg-white border p-10 sm:p-12 rounded-[48px] hover:translate-y-[-4px] transition-all group shadow-xl shadow-primary/[0.02] relative overflow-hidden ${highlight ? 'border-cta/30' : warning ? 'border-cta/20' : 'border-primary/5'}`}>
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
    {(highlight || warning) && (
      <div className="absolute top-0 right-0 w-32 h-32 bg-cta/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-cta/10 transition-all duration-700" />
    )}
  </div>
);

export default InventoryView;
