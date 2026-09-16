import React from 'react';
import { WheelMode } from '../types';
import { ArrowRight, Sparkles } from 'lucide-react';

interface HeroHomeProps {
  currentMode: WheelMode;
  onSelectMode: (mode: WheelMode) => void;
  onScrollToWheel: () => void;
}

interface InteractiveToolOption {
  id: WheelMode;
  icon: string;
  title: string;
  description: string;
}

const TOOL_OPTIONS: InteractiveToolOption[] = [
  {
    id: 'classic',
    icon: '🎡',
    title: 'Girar una ruleta',
    description: 'Ruleta interactiva con física realista',
  },
  {
    id: 'teams',
    icon: '👥',
    title: 'Crear equipos',
    description: 'Grupos equilibrados al instante o con ruleta',
  },
  {
    id: 'pairs',
    icon: '👫',
    title: 'Crear parejas',
    description: 'Parejas aleatorias con gestión de impares',
  },
  {
    id: 'multiple-winners',
    icon: '🏆',
    title: 'Elegir ganadores',
    description: 'Sortea 1, 2, 3 o más ganadores únicos',
  },
  {
    id: 'order',
    icon: '🔀',
    title: 'Crear orden aleatorio',
    description: 'Mezcla y clasifica listas completas en un clic',
  },
  {
    id: 'tournament',
    icon: '⚔️',
    title: 'Crear torneo',
    description: 'Cuadros de eliminatorias y duelos directos',
  },
];

export const HeroHome: React.FC<HeroHomeProps> = ({
  currentMode,
  onSelectMode,
  onScrollToWheel,
}) => {
  return (
    <section id="hero-section" className="pt-6 pb-4 sm:pt-10 sm:pb-6 text-center">
      <div className="max-w-3xl mx-auto px-4">
        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-900 tracking-tight leading-tight">
          ¿Qué quieres sortear?
        </h1>

        {/* Subtitle */}
        <p className="mt-2.5 sm:mt-3 text-base sm:text-lg text-neutral-500 max-w-xl mx-auto font-normal">
          Ruletas, equipos, parejas y sorteos en segundos.
        </p>

        {/* Primary CTA button */}
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            id="hero-create-wheel-cta"
            onClick={() => {
              onSelectMode('classic');
              onScrollToWheel();
            }}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] flex items-center gap-2 cursor-pointer"
          >
            <span>Crear una ruleta</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Large Interactive Options Grid */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {TOOL_OPTIONS.map((tool) => {
            const isActive = currentMode === tool.id;
            return (
              <button
                key={tool.id}
                id={`hero-tool-${tool.id}`}
                type="button"
                onClick={() => {
                  onSelectMode(tool.id);
                  onScrollToWheel();
                }}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xs flex flex-col justify-between cursor-pointer ${
                  isActive
                    ? 'bg-white border-indigo-600 ring-2 ring-indigo-100 shadow-xs'
                    : 'bg-white/80 hover:bg-white border-neutral-200/80 hover:border-neutral-300'
                }`}
              >
                <div>
                  <span className="text-2xl sm:text-3xl block mb-2">{tool.icon}</span>
                  <span className="font-bold text-xs sm:text-sm text-neutral-900 block leading-snug">
                    {tool.title}
                  </span>
                </div>
                <span className="text-2xs text-neutral-400 mt-2 line-clamp-2 hidden sm:block">
                  {tool.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
