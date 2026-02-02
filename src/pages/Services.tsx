
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
  const [duration, setDuration] = useState<number | ''>(45);
  const [bufferTime, setBufferTime] = useState<number | ''>(5);
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
    setBufferTime(service.buffer_time || 0);
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
          duration: typeof duration === 'number' ? duration : 0,
          buffer_time: typeof bufferTime === 'number' ? bufferTime : 0,
          description
        });
        setServices(services.map(s => s.id === editingService.id ? updated : s));
        toast.success("Serviço atualizado!");
      } else {
        const newService = await servicesApi.create({
          name,
          price: numericPrice,
          duration: typeof duration === 'number' ? duration : 0,
          buffer_time: typeof bufferTime === 'number' ? bufferTime : 0,
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
    setBufferTime(5);
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
    <div className="space-y-6 sm:space-y-20 max-w-[1400px] mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-12 px-2 sm:px-0">
        <div>
          <div className="flex items-center gap-3 mb-2 sm:mb-4 text-cta">
            <Scissors size={16} className="sm:size-5" strokeWidth={2.5} />
            <span className="text-[8px] sm:text-[10px] font-black italic uppercase tracking-[0.4em]">Experiências Profissionais</span>
          </div>
          <h2 className="text-3xl sm:text-6xl font-black italic uppercase text-primary font-title tracking-tighter leading-none">
            Catálogo de <span className="text-primary/20">Experiências</span>
          </h2>
          <p className="text-[8px] sm:text-[10px] font-black italic text-primary/30 uppercase mt-2 sm:mt-4 tracking-[0.2em] ml-1">Defina o valor da sua arte no fluxo</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsAdding(true);
          }}
          className="bg-primary text-white px-8 sm:px-10 py-4 sm:py-6 rounded-2xl sm:rounded-[28px] text-[9px] sm:text-[10px] font-black italic uppercase tracking-[0.2em] flex items-center justify-center gap-2 sm:gap-3 hover:bg-primary/[0.95] transition-all shadow-xl shadow-primary/20 active:scale-95 w-full md:w-auto font-title"
        >
          <Plus size={18} sm:size={20} strokeWidth={3} />
          <span>Criar Nova Experiência</span>
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 px-2 sm:px-0">
        {services.map(service => (
          <div key={service.id} className="bg-white border border-primary/5 p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] group relative hover:shadow-[0_48px_96px_-12px_rgba(15,76,92,0.12)] hover:-translate-y-2 transition-all duration-500 flex flex-col min-h-0 sm:min-h-[420px]">
            <div className="flex justify-between items-start mb-6 sm:mb-10">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-background rounded-xl sm:rounded-2xl flex items-center justify-center text-primary/40 border border-primary/5 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                <Scissors size={20} sm:size={28} strokeWidth={2.5} />
              </div>
              <div className="flex gap-2 sm:gap-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => handleOpenEdit(service)}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-white text-primary/30 rounded-lg sm:rounded-xl hover:text-cta hover:bg-cta/5 transition-all shadow-sm flex items-center justify-center border border-primary/5"
                >
                  <Edit2 size={16} sm:size={18} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => removeService(service.id)}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 text-red-500 rounded-lg sm:rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center"
                >
                  <Trash2 size={16} sm:size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <h4 className="text-xl sm:text-2xl font-black italic text-primary uppercase font-title leading-tight mb-2 sm:mb-4 group-hover:text-primary transition-colors">{service.name}</h4>
            <p className="text-primary/30 text-[9px] sm:text-[11px] font-black italic uppercase tracking-widest mb-6 sm:mb-10 line-clamp-2 sm:line-clamp-3 leading-relaxed">{service.description || 'Manifesto de estilo não definido.'}</p>

            <div className="mt-auto pt-6 sm:pt-10 border-t border-primary/5 grid grid-cols-2 gap-4 sm:gap-6">
              <div className="flex flex-col">
                <span className="text-[8px] sm:text-[10px] font-black italic text-primary/20 uppercase tracking-widest mb-2 sm:mb-3 font-title">Investment</span>
                <span className="text-xl sm:text-2xl font-black italic text-primary font-title">R$ {service.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] sm:text-[10px] font-black italic text-primary/20 uppercase tracking-widest mb-2 sm:mb-3 font-title">Dedication</span>
                <span className="text-primary font-black italic text-[12px] sm:text-sm flex items-center gap-1.5 sm:gap-2 font-title">
                  <Clock size={14} sm:size={16} className="text-cta" strokeWidth={3} />
                  {service.duration} MIN
                </span>
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px] sm:rounded-[48px] pointer-events-none" />
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="col-span-full py-24 text-center border-2 border-dashed border-primary/5 rounded-[64px] bg-primary/[0.01]">
          <Scissors size={48} className="text-primary/10 mx-auto mb-6" />
          <p className="text-primary/20 font-black italic uppercase tracking-[0.3em]">Nenhum serviço disponível no fluxo</p>
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-xl z-[200] flex items-center justify-center p-6 sm:p-12">
          <div className="bg-white border border-primary/5 w-full max-w-2xl rounded-[48px] p-10 sm:p-16 shadow-[0_48px_96px_-12px_rgba(15,76,92,0.3)] relative max-h-[90vh] overflow-y-auto custom-scrollbar-hidden">
            <button
              onClick={() => { setIsAdding(false); resetForm(); }}
              className="absolute top-10 right-10 w-12 h-12 bg-background text-primary/20 rounded-2xl flex items-center justify-center hover:text-primary transition-all group"
            >
              <X size={24} className="group-hover:scale-110 transition-transform" strokeWidth={3} />
            </button>

            <div className="mb-12">
              <h3 className="text-3xl sm:text-5xl font-black italic uppercase text-primary font-title leading-none mb-3">
                {editingService ? "Refinar Serviço" : "Novo Serviço"}
              </h3>
              <p className="text-[10px] font-black italic text-primary/30 uppercase tracking-[0.3em]">Protocolo de Atendimento</p>
            </div>

            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black italic text-primary/30 uppercase mb-4 ml-6 block tracking-[0.2em] font-title">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Corte Clássico"
                  className="w-full bg-background border-2 border-transparent rounded-[28px] px-8 py-5 text-primary font-black italic uppercase text-sm focus:border-cta/20 focus:bg-white outline-none transition-all placeholder:text-primary/5 font-title shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div>
                  <label className="text-[10px] font-black italic text-primary/30 uppercase mb-4 ml-6 block tracking-[0.2em] font-title">Valor</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20 font-black italic text-sm">R$</span>
                    <input
                      type="text"
                      value={price}
                      onChange={handlePriceChange}
                      className="w-full bg-background border-2 border-transparent rounded-[28px] pl-16 pr-8 py-5 text-primary font-black italic text-sm focus:border-cta/20 focus:bg-white outline-none transition-all font-title shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black italic text-primary/30 uppercase mb-4 ml-6 block tracking-[0.2em] font-title">Duração (Minutos)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={e => {
                      const val = e.target.value;
                      setDuration(val === '' ? '' : parseInt(val));
                    }}
                    className="w-full bg-background border-2 border-transparent rounded-[28px] px-8 py-5 text-primary font-black italic text-sm focus:border-cta/20 focus:bg-white outline-none transition-all font-title shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black italic text-primary/30 uppercase mb-4 ml-6 block tracking-[0.2em] font-title">Buffer Após (Minutos)</label>
                  <input
                    type="number"
                    value={bufferTime}
                    onChange={e => {
                      const val = e.target.value;
                      setBufferTime(val === '' ? '' : parseInt(val));
                    }}
                    className="w-full bg-background border-2 border-transparent rounded-[28px] px-8 py-5 text-primary font-black italic text-sm focus:border-cta/20 focus:bg-white outline-none transition-all font-title shadow-sm"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black italic text-primary/30 uppercase mb-4 ml-6 block tracking-[0.2em] font-title">Descrição do Serviço</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Descreva detalhes do serviço..."
                  className="w-full bg-background border-2 border-transparent rounded-[32px] px-8 py-6 text-primary font-black italic uppercase text-sm focus:border-cta/20 focus:bg-white outline-none transition-all placeholder:text-primary/5 resize-none font-title shadow-sm"
                />
              </div>

              <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button
                  onClick={() => { setIsAdding(false); resetForm(); }}
                  className="w-full py-6 rounded-[28px] border-2 border-primary/5 text-primary/40 text-[10px] font-black italic uppercase tracking-widest hover:bg-primary/5 transition-all font-title"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveService}
                  className="w-full py-6 rounded-[28px] bg-primary text-white text-[10px] font-black italic uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all font-title"
                >
                  Criar Serviço
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesView;
