
import React, { useState } from 'react';
import { Service } from '../types';
import { Plus, Scissors, DollarSign, Clock, Trash2, Edit2, Percent, X } from 'lucide-react';
import { servicesApi } from '../api';
import toast from 'react-hot-toast';

interface Props {
  services: Service[];
  setServices: (s: Service[]) => void;
}

const ServicesView: React.FC<Props> = ({ services, setServices }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // Estados para o novo/editado serviço
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState(45);
  const [description, setDescription] = useState('');

  const formatCurrency = (value: string | number) => {
    const valStr = typeof value === 'number' ? (value * 100).toFixed(0) : value;
    const digits = valStr.toString().replace(/\D/g, "");
    if (!digits) return "";
    const number = parseFloat(digits) / 100;
    return number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(formatCurrency(e.target.value));
  };

  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setPrice(formatCurrency(service.price));
    setDuration(service.duration);
    setDescription(service.description || '');
    setIsAdding(true);
  };

  const handleSaveService = async () => {
    if (!name) {
      toast.error("O nome do serviço é obrigatório");
      return;
    }

    const numericPrice = parseFloat(price.replace(/\D/g, "")) / 100;

    try {
      if (editingService) {
        const updated = await servicesApi.update(editingService.id, {
          name,
          price: numericPrice,
          duration,
          description
        });
        setServices(services.map(s => s.id === editingService.id ? updated : s));
        toast.success("Serviço atualizado!");
      } else {
        const newService = await servicesApi.create({
          name,
          price: numericPrice,
          duration,
          description
        });
        setServices([...services, newService]);
        toast.success("Serviço criado com sucesso!");
      }
      setIsAdding(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar serviço:", error);
      toast.error("Erro ao salvar serviço");
    }
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setDuration(45);
    setDescription('');
    setEditingService(null);
  };

  const removeService = async (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-gray-900">Deseja realmente excluir este serviço?</p>
        <div className="flex gap-2 justify-end">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await servicesApi.delete(id);
                setServices(services.filter(s => s.id !== id));
                toast.success("Serviço removido");
              } catch (error) {
                toast.error("Erro ao remover serviço");
              }
            }}
            className="px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-center',
      style: {
        background: '#fff',
        padding: '16px',
        borderRadius: '16px',
        border: '1px solid #f3f4f6',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      }
    });
  };

  return (
    <div className="space-y-8 sm:space-y-12 animate-fadeIn max-w-[1200px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white line-clamp-1">Nossos <span className="text-gray-500">Serviços</span></h2>
          <p className="text-gray-500 mt-1 sm:mt-2 font-medium text-xs sm:text-base">Configure preços, durações e descrições.</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setIsAdding(true);
          }}
          className="bg-accent text-white px-5 sm:px-6 py-3.5 sm:py-3 rounded-2xl text-[11px] sm:text-[13px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#0063CC] transition-all shadow-[0_10px_20px_rgba(0,122,255,0.2)] active:scale-95 w-full md:w-auto"
        >
          <Plus size={18} />
          <span>Novo Serviço</span>
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {services.map(service => (
          <div key={service.id} className="bg-[#1c1c1e] border border-white/5 p-4 sm:p-6 rounded-[24px] sm:rounded-[28px] group relative hover:bg-[#2c2c2e] transition-all flex flex-col">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="bg-white/5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-white/40 border border-white/5">
                <Scissors size={18} className="sm:hidden" />
                <Scissors size={22} className="hidden sm:block" />
              </div>
              <div className="flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-all transform translate-y-0 sm:translate-y-2 group-hover:translate-y-0">
                <button 
                  onClick={() => handleOpenEdit(service)}
                  className="p-2 sm:p-2 bg-white/5 text-gray-400 rounded-lg sm:rounded-xl hover:text-white hover:bg-white/10 transition-all"
                >
                  <Edit2 size={14} sm:size={16} />
                </button>
                <button 
                  onClick={() => removeService(service.id)} 
                  className="p-2 sm:p-2 bg-red-500/10 text-red-500/50 rounded-lg sm:rounded-xl hover:text-red-500 hover:bg-red-500/20 transition-all"
                >
                  <Trash2 size={14} sm:size={16} />
                </button>
              </div>
            </div>
            
            <h4 className="text-lg sm:text-xl font-bold text-white tracking-tight mb-0.5 sm:mb-1">{service.name}</h4>
            <p className="text-gray-500 text-[11px] sm:text-[12px] mb-3 sm:mb-4 line-clamp-2 leading-relaxed">{service.description || 'Nenhuma descrição informada.'}</p>
            
            <div className="flex items-center justify-between border-t border-white/5 pt-3 sm:pt-4 mt-auto">
              <div className="flex flex-col">
                <span className="text-[8px] sm:text-[9px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-0.5 sm:mb-1">Preço</span>
                <span className="text-lg sm:text-xl font-bold text-white tracking-tight">R$ {service.price}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] sm:text-[9px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-0.5 sm:mb-1">Tempo</span>
                <span className="text-gray-300 font-bold flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm">
                   <Clock size={12} className="text-white/20" />
                   {service.duration} min
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1c1c1e] border border-white/5 w-full max-w-md rounded-[32px] p-6 sm:p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => {
                setIsAdding(false);
                resetForm();
              }}
              className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-all"
            >
              <X size={20} />
            </button>

            <div className="mb-8 sm:mb-10">
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                {editingService ? "Editar Serviço" : "Novo Serviço"}
              </h3>
              <p className="text-gray-500 text-sm sm:text-base font-medium">
                {editingService ? "Altere os detalhes do serviço." : "Defina os detalhes do novo serviço oferecido."}
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Nome do Serviço</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Corte Navalhado" 
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 sm:py-4 text-white focus:border-accent/50 outline-none transition-all placeholder:text-gray-700" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Preço (R$)</label>
                  <input 
                    type="text" 
                    value={price}
                    onChange={handlePriceChange}
                    placeholder="50,00" 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 sm:py-4 text-white focus:border-accent/50 outline-none transition-all placeholder:text-gray-700 font-medium" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Minutos</label>
                  <input 
                    type="number" 
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    placeholder="45" 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 sm:py-4 text-white focus:border-accent/50 outline-none transition-all placeholder:text-gray-700" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Descrição (Opcional)</label>
                <textarea 
                  rows={3} 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Descreva o que está incluso no serviço..."
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 sm:py-4 text-white focus:border-accent/50 outline-none resize-none transition-all placeholder:text-gray-700"
                ></textarea>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-10">
              <button 
                onClick={handleSaveService} 
                className="w-full py-4 sm:py-5 bg-accent text-white rounded-2xl font-bold hover:bg-[#0063CC] transition-all shadow-xl shadow-accent/20 active:scale-[0.98]"
              >
                {editingService ? "Salvar Alterações" : "Criar Serviço"}
              </button>
              <button 
                onClick={() => { setIsAdding(false); resetForm(); }} 
                className="w-full py-3 text-gray-500 hover:text-white font-bold transition-colors text-sm uppercase tracking-[0.2em]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesView;
