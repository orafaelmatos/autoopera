import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Clock, CheckCircle2, ArrowRight, X, LayoutDashboard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

interface OnboardingProps {
  onComplete: () => void;
  barbershopSlug: string;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, barbershopSlug }) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const steps = [
    {
      title: "Pequeno Tour",
      description: "Olá! Vamos te mostrar onde ficam as principais funções para você começar com tudo.",
      icon: <CheckCircle2 className="text-cta" size={48} />,
      actionLabel: "Iniciar Tour",
      target: null,
      position: 'center',
      action: () => setStep(1)
    },
    {
      title: "Seus Serviços",
      description: "Neste menu você visualiza e cadastra seus serviços, definindo preços e tempo de duração de cada um.",
      icon: <Scissors className="text-primary" size={32} />,
      actionLabel: "Próximo",
      target: 'nav-services',
      position: 'bottom-right',
      onEnter: () => navigate(`/b/${barbershopSlug}/services`),
      action: () => setStep(2)
    },
    {
      title: "Seus Horários",
      description: "Aqui é onde você configura sua jornada de trabalho, definindo seus dias de folga e horários de atendimento.",
      icon: <Clock className="text-primary" size={32} />,
      actionLabel: "Entendi",
      target: 'nav-schedule',
      position: 'bottom-right',
      onEnter: () => navigate(`/b/${barbershopSlug}/settings?tab=schedule`),
      action: () => setStep(3)
    },
    {
      title: "Tudo Pronto!",
      description: "Agora você já sabe o caminho! Vamos te levar para sua agenda para você começar os trabalhos.",
      icon: <LayoutDashboard className="text-cta" size={48} />,
      actionLabel: "Finalizar e ir para Agenda",
      target: null,
      position: 'center',
      onEnter: () => navigate(`/b/${barbershopSlug}/dashboard`),
      action: async () => {
        try {
          console.log("Chamando API para finalizar onboarding...");
          await api.patch('config/', { onboarding_completed: true });
          console.log("API OK, atualizando usuário...");
          await refreshUser();
          console.log("Usuário atualizado, redirecionando...");
          navigate(`/b/${barbershopSlug}`);
          onComplete();
        } catch (error) {
          console.error("Erro ao finalizar:", error);
          navigate(`/b/${barbershopSlug}`);
          onComplete();
        }
      }
    }
  ];

  const currentStep = steps[step];

  React.useEffect(() => {
    if (steps[step].onEnter) {
      steps[step].onEnter();
    }
  }, [step]);

  const isCenter = currentStep.position === 'center';

  return (
    <AnimatePresence>
      <motion.div 
        key="onboarding-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-[10001] flex items-center justify-center p-6 ${isCenter ? 'bg-black/80 backdrop-blur-sm' : 'pointer-events-none'}`}
      >
        <motion.div 
          layout
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className={`bg-white shadow-[0_32px_128px_rgba(0,0,0,0.5)] relative overflow-hidden pointer-events-auto
            ${isCenter 
              ? 'rounded-[40px] p-10 md:p-14 max-w-lg w-full text-center' 
              : 'fixed bottom-28 md:bottom-10 right-4 left-4 md:left-auto md:right-10 rounded-[30px] p-8 max-w-[340px] border-2 border-cta'
            }`}
        >
          <div className="relative z-10">
            <motion.div 
              key={`icon-${step}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${isCenter ? 'w-20 h-20 mx-auto mb-8' : 'w-12 h-12 mb-4'} bg-background rounded-2xl flex items-center justify-center shadow-xl border border-primary/5`}
            >
              {React.cloneElement(currentStep.icon as React.ReactElement, { size: isCenter ? 40 : 24 })}
            </motion.div>

            <motion.div
              key={`text-${step}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={isCenter ? 'text-center' : 'text-left'}
            >
              <h2 className={`${isCenter ? 'text-2xl md:text-3xl' : 'text-xl'} font-black font-title text-primary italic uppercase tracking-tighter mb-4 leading-tight`}>
                {currentStep.title}
              </h2>
              <p className={`text-primary/60 ${isCenter ? 'text-base mb-10 max-w-sm mx-auto' : 'text-sm mb-8'} font-medium leading-relaxed`}>
                {currentStep.description}
              </p>
            </motion.div>

            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                currentStep.action();
              }}
              className={`w-full bg-primary text-white ${isCenter ? 'py-5 px-8 rounded-2xl' : 'py-4 px-6 rounded-xl text-xs'} font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-xl active:scale-95 cursor-pointer`}
            >
              {currentStep.actionLabel}
              <ArrowRight size={isCenter ? 18 : 14} />
            </button>

            <div className={`flex ${isCenter ? 'justify-center mt-10' : 'justify-start mt-6'} gap-2`}>
              {steps.map((_, i) => (
                <div 
                  key={i}
                  className={`h-1 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-cta' : 'w-2 bg-primary/10'}`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* CSS para o efeito de destaque via id */}
        <style dangerouslySetInnerHTML={{ __html: `
          ${currentStep.target ? `
            #${currentStep.target}, #mobile-${currentStep.target} {
              position: relative !important;
              z-index: 10002 !important;
              box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.8), 0 0 40px rgba(230, 126, 34, 1) !important;
              border: 3px solid #E67E22 !important;
              background-color: white !important;
              color: #0F4C5C !important;
              transform: scale(1.1) !important;
              transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
            }
          ` : ''}
        ` }} />
      </motion.div>
    </AnimatePresence>
  );
};

export default Onboarding;
