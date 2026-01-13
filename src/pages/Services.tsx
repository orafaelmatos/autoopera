
import React, { useState } from 'react';
import { Service } from '../types';
import { Plus, Scissors, DollarSign, Clock, Trash2, Edit2, Percent } from 'lucide-react';

interface Props {
  services: Service[];
  setServices: (s: Service[]) => void;
}

const ServicesView: React.FC<Props> = ({ services, setServices }) => {
  const [isAdding, setIsAdding] = useState(false);

  const removeService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-oswald font-bold uppercase tracking-tight">Meus <span className="text-yellow-500">Serviços</span></h2>
          <p className="text-gray-400 mt-1">Configure preços e comissões.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-yellow-500 text-black p-2 md:px-4 md:py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-400 transition-colors"
        >
          <Plus size={20} /> <span className="hidden md:inline">Novo Serviço</span>
        </button>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        {services.map(service => (
          <div key={service.id} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl group relative hover:border-yellow-500/40 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-gray-800 p-3 rounded-xl text-yellow-500">
                <Scissors size={24} />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-gray-800 text-gray-400 rounded-lg hover:text-white"><Edit2 size={16} /></button>
                <button onClick={() => removeService(service.id)} className="p-2 bg-gray-800 text-red-500/50 rounded-lg hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            </div>
            
            <h4 className="text-xl font-bold mb-1">{service.name}</h4>
            <p className="text-gray-500 text-sm mb-6 line-clamp-2">{service.description || 'Nenhuma descrição informada.'}</p>
            
            <div className="flex flex-wrap items-center gap-4 border-t border-gray-800 pt-4">
              <div className="flex items-center gap-2">
                <div className="text-yellow-500"><DollarSign size={16} /></div>
                <span className="font-oswald text-lg">R$ {service.price}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-blue-500"><Percent size={16} /></div>
                <span className="text-gray-300 text-sm">{service.commission}% Comiss.</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-gray-500"><Clock size={16} /></div>
                <span className="text-gray-300 text-sm">{service.duration} min</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md p-6 rounded-3xl shadow-2xl animate-scaleIn">
            <h3 className="text-2xl font-oswald font-bold mb-6">NOVO SERVIÇO</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome do Serviço</label>
                <input type="text" placeholder="Ex: Corte Navalhado" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 focus:border-yellow-500 transition-colors focus:outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Preço (R$)</label>
                  <input type="number" placeholder="50" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 focus:border-yellow-500 transition-colors focus:outline-none" />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Comissão (%)</label>
                  <input type="number" placeholder="50" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 focus:border-yellow-500 transition-colors focus:outline-none" />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Minutos</label>
                  <input type="number" placeholder="45" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 focus:border-yellow-500 transition-colors focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Descrição</label>
                <textarea rows={3} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 focus:border-yellow-500 transition-colors focus:outline-none"></textarea>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsAdding(false)} className="flex-1 px-4 py-3 border border-gray-800 rounded-xl font-bold hover:bg-gray-800 transition-colors">Cancelar</button>
              <button onClick={() => setIsAdding(false)} className="flex-1 px-4 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition-colors">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesView;
