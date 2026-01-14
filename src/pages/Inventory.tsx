
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
  ShoppingBag
} from 'lucide-react';
import { productsApi } from '../api';

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
  const [newCost, setTotalCost] = useState(0);
  const [newSale, setSalePrice] = useState(0);
  const [newExpiry, setNewExpiry] = useState('');

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
    if (!newName || newStock < 0 || newCost < 0) return;
    
    try {
      const product = await productsApi.create({
        name: newName,
        category: newCat,
        stock: newStock,
        minStock: newMinStock,
        costPrice: newCost,
        salePrice: newCat === 'venda' || newCat === 'bar' ? newSale : undefined,
        expiryDate: newExpiry || undefined,
        lastRestock: new Date().toISOString().split('T')[0]
      });

      setProducts(prev => [product, ...prev]);
      setIsAdding(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este produto?")) {
      try {
        await productsApi.delete(id);
        setProducts(products.filter(p => p.id !== id));
      } catch (error) {
        console.error("Erro ao excluir produto:", error);
      }
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewCat('venda');
    setNewStock(0);
    setTotalCost(0);
    setSalePrice(0);
    setNewExpiry('');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-oswald font-bold uppercase tracking-tight">Gestão de <span className="text-yellow-500">Estoque</span></h2>
          <p className="text-gray-400 mt-1">Produtos, insumos e lucratividade.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20 active:scale-95 w-full sm:w-auto justify-center"
        >
          <Plus size={20} /> Novo Produto
        </button>
      </header>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Valor em Estoque</span>
            <DollarSign size={16} className="text-green-500" />
          </div>
          <h3 className="text-3xl font-oswald font-bold text-white">R$ {totalInventoryValue.toFixed(2)}</h3>
          <p className="text-[10px] text-gray-500 mt-2 uppercase font-bold tracking-wider">Inventário atualizado</p>
        </div>

        <div className={`bg-gray-900 border p-6 rounded-3xl group transition-colors ${lowStockCount > 0 ? 'border-red-500/30 shadow-lg shadow-red-500/5' : 'border-gray-800'}`}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Baixo Estoque</span>
            <AlertTriangle size={16} className={lowStockCount > 0 ? 'text-red-500' : 'text-gray-600'} />
          </div>
          <h3 className={`text-3xl font-oswald font-bold ${lowStockCount > 0 ? 'text-red-500' : 'text-white'}`}>{lowStockCount}</h3>
          <p className="text-[10px] text-gray-500 mt-2 uppercase font-bold tracking-wider">Itens abaixo do mínimo</p>
        </div>

        <div className={`bg-gray-900 border p-6 rounded-3xl group transition-colors ${expiringSoonCount > 0 ? 'border-yellow-500/30 shadow-lg shadow-yellow-500/5' : 'border-gray-800'}`}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Próximos do Vencimento</span>
            <Calendar size={16} className={expiringSoonCount > 0 ? 'text-yellow-500' : 'text-gray-600'} />
          </div>
          <h3 className={`text-3xl font-oswald font-bold ${expiringSoonCount > 0 ? 'text-yellow-500' : 'text-white'}`}>{expiringSoonCount}</h3>
          <p className="text-[10px] text-gray-500 mt-2 uppercase font-bold tracking-wider">Vencendo em 30 dias</p>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome do produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-2xl pl-12 pr-4 py-4 focus:border-yellow-500 outline-none transition-all text-sm"
          />
        </div>
        <div className="flex bg-gray-900 border border-gray-800 p-1 rounded-2xl w-full md:w-auto overflow-x-auto whitespace-nowrap scrollbar-hide">
          {(['all', 'consumo', 'venda', 'bar'] as const).map((cat) => (
            <button 
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${filterCategory === cat ? 'bg-yellow-500 text-black' : 'text-gray-500 hover:text-white'}`}
            >
              {cat === 'all' ? 'Todos' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Produtos */}
      <section className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-black/50 border-b border-gray-800">
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Produto</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Estoque</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Custo Unit.</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Preço Venda</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Lucro Est.</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Validade</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map(p => {
                const isLow = p.stock <= p.minStock;
                const profit = p.salePrice ? p.salePrice - p.costPrice : 0;
                const profitMargin = p.salePrice ? (profit / p.salePrice) * 100 : 0;

                return (
                  <tr key={p.id} className="hover:bg-gray-800/30 transition-colors group">
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-bold text-white">{p.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1">
                          <Tag size={8} /> {p.category}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-center">
                        <span className={`text-sm font-bold ${isLow ? 'text-red-500' : 'text-white'}`}>{p.stock}</span>
                        <span className="text-[8px] text-gray-600 uppercase font-bold">Mín: {p.minStock}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-400">R$ {p.costPrice.toFixed(2)}</td>
                    <td className="p-4 text-sm font-medium text-white">
                      {p.salePrice ? `R$ ${p.salePrice.toFixed(2)}` : '--'}
                    </td>
                    <td className="p-4">
                      {p.salePrice ? (
                        <div>
                          <p className="text-xs font-bold text-green-500">R$ {profit.toFixed(2)}</p>
                          <p className="text-[8px] text-gray-500 uppercase font-bold">{profitMargin.toFixed(0)}% margem</p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-600 uppercase font-bold italic">Insumo</span>
                      )}
                    </td>
                    <td className="p-4">
                      {p.expiryDate ? (
                        <div className="flex items-center gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${new Date(p.expiryDate) < today ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                           <span className="text-xs text-gray-400">{new Date(p.expiryDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                      ) : (
                        <span className="text-gray-700">--</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 bg-gray-800 text-gray-400 rounded-lg hover:text-white"><Edit2 size={14} /></button>
                        <button 
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-2 bg-gray-800 text-red-500/50 rounded-lg hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-20 text-gray-600 text-sm italic">
              Nenhum produto encontrado.
            </div>
          )}
        </div>
      </section>

      {/* Modal Novo Produto */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-2xl rounded-3xl p-8 shadow-2xl animate-scaleIn my-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-oswald font-bold uppercase tracking-wide">Novo <span className="text-yellow-500">Produto</span></h3>
              <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Nome do Produto</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Ex: Cerveja IPA 500ml"
                    className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Categoria</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setNewCat('consumo')} className={`py-2 text-[8px] font-bold rounded-lg border uppercase ${newCat === 'consumo' ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-black text-gray-500 border-gray-800'}`}>Consumo</button>
                    <button onClick={() => setNewCat('venda')} className={`py-2 text-[8px] font-bold rounded-lg border uppercase ${newCat === 'venda' ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-black text-gray-500 border-gray-800'}`}>Venda</button>
                    <button onClick={() => setNewCat('bar')} className={`py-2 text-[8px] font-bold rounded-lg border uppercase ${newCat === 'bar' ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-black text-gray-500 border-gray-800'}`}>Bar</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Estoque Atual</label>
                    <input type="number" value={newStock} onChange={e => setNewStock(Number(e.target.value))} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Estoque Mín.</label>
                    <input type="number" value={newMinStock} onChange={e => setNewMinStock(Number(e.target.value))} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Preço de Custo (R$)</label>
                  <input type="number" step="0.01" value={newCost} onChange={e => setNewCost(Number(e.target.value))} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" />
                </div>
                {newCat !== 'consumo' && (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Preço de Venda (R$)</label>
                    <input type="number" step="0.01" value={newSale} onChange={e => setNewSale(Number(e.target.value))} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none border-yellow-500/50" />
                  </div>
                )}
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Validade (Opcional)</label>
                  <input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-4 border border-gray-800 rounded-2xl font-bold text-gray-400 hover:bg-gray-800 transition-all uppercase text-xs tracking-widest">Cancelar</button>
              <button onClick={handleAddProduct} className="flex-1 py-4 bg-yellow-500 text-black rounded-2xl font-bold hover:bg-yellow-400 transition-all uppercase text-xs tracking-widest shadow-lg shadow-yellow-500/20">Salvar Produto</button>
            </div>
          </div>
        </div>
      )}

      {/* Rodapé de Movimentação */}
      <div className="flex justify-between items-center text-[10px] text-gray-500 uppercase font-bold tracking-widest px-4">
        <p>Última atualização: Agora mesmo</p>
        <button className="hover:text-yellow-500 transition-colors flex items-center gap-1">
          Ver Histórico Completo de Movimentações <ArrowUpRight size={10} />
        </button>
      </div>
    </div>
  );
};

export default InventoryView;
