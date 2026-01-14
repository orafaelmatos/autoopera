
import React, { useState } from 'react';
import { Service } from '../types';
import { Plus, Scissors, DollarSign, Clock, Trash2, Edit2, Percent } from 'lucide-react';
import { servicesApi } from '../api';
import toast from 'react-hot-toast';

interface Props {
  services: Service[];
  setServices: (s: Service[]) => void;
}

const ServicesView: React.FC<Props> = ({ services, setServices }) => {
  const [isAdding, setIsAdding] = useState(false);
  
  // Estados para o novo serviço
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [duration, setDuration] = useState(45);
  const [description, setDescription] = useState('');

  const handleAddService = async () => {
    try {
      const newService = await servicesApi.create({
        name,
        price,
        duration,
        description
      });
      setServices([...services, newService]);
      setIsAdding(false);
      resetForm();
      toast.success("Serviço criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar serviço:", error);
      toast.error("Erro ao criar serviço");
    }
  };

  const resetForm = () => {
    setName('');
    setPrice(0);
    setDuration(45);
    setDescription('');
  };

  const removeService = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este serviço?")) {
      try {
        await servicesApi.delete(id);
        setServices(services.filter(s => s.id !== id));
      } catch (error) {
        console.error("Erro ao remover serviço:", error);
      }
    }
  };

  return (
    <div className="space-y-12 animate-fadeIn max-w-[1200px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white">Nossos <span className="text-gray-500">Serviços</span></h2>
          <p className="text-gray-500 mt-2 font-medium">Configure preços, durações e descrições dos serviços.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#007AFF] text-white px-6 py-3 rounded-2xl text-[13px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#0063CC] transition-all shadow-[0_10px_20_rgba(0,122,255,0.2)] active:scale-95"
        >
          <Plus size={18} />
          <span>Novo Serviço</span>
        </button>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map(service => (
          <div key={service.id} className="bg-[#1c1c1e] border border-white/5 p-8 rounded-[32px] group relative hover:bg-[#2c2c2e] transition-all flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div className="bg-[#007AFF]/10 p-4 rounded-2xl text-[#007AFF] border border-[#007AFF]/20">
                <Scissors size={28} />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                <button className="p-3 bg-white/5 text-gray-400 rounded-xl hover:text-white hover:bg-white/10 transition-all"><Edit2 size={18} /></button>
                <button onClick={() => removeService(service.id)} className="p-3 bg-red-500/10 text-red-500/50 rounded-xl hover:text-red-500 hover:bg-red-500/20 transition-all"><Trash2 size={18} /></button>
              </div>
            </div>
            
            <h4 className="text-2xl font-bold text-white tracking-tight mb-2 group-hover:text-[#007AFF] transition-colors">{service.name}</h4>
            <p className="text-gray-500 text-sm mb-8 line-clamp-2 leading-relaxed">{service.description || 'Nenhuma descrição informada.'}</p>
            
            <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-auto">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-1">Preço</span>
                <span className="text-2xl font-bold text-white tracking-tight">R$ {service.price}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-1">Tempo</span>
                <span className="text-gray-300 font-bold flex items-center gap-2">
                   <Clock size={16} className="text-[#007AFF]/50" />
                   {service.duration} min
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1c1c1e] border border-white/5 w-full max-w-md rounded-[32px] p-10 shadow-2xl relative">
            <div className="mb-10">
              <h3 className="text-3xl font-bold tracking-tight text-white mb-2">Novo Serviço</h3>
              <p className="text-gray-500 font-medium">Defina os detalhes do novo serviço oferecido.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Nome do Serviço</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Corte Navalhado" 
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all placeholder:text-gray-700" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Preço (R$)</label>
                  <input 
                    type="number" 
                    value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    placeholder="50" 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all placeholder:text-gray-700" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Minutos</label>
                  <input 
                    type="number" 
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    placeholder="45" 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all placeholder:text-gray-700" 
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
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none resize-none transition-all placeholder:text-gray-700"
                ></textarea>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-12">
              <button 
                onClick={handleAddService} 
                className="w-full py-5 bg-[#007AFF] text-white rounded-2xl font-bold hover:bg-[#0063CC] transition-all shadow-xl shadow-[#007AFF]/20 active:scale-[0.98]"
              >
                Criar Serviço
              </button>
              <button 
                onClick={() => { setIsAdding(false); resetForm(); }} 
                className="w-full py-4 text-gray-500 hover:text-white font-bold transition-colors text-sm uppercase tracking-[0.2em]"
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
