'use client';

import { useCountUp } from '@/lib/hooks/use-count-up';

function CountStat({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const { count, ref } = useCountUp(end, 1400);
  return (
    <div className="text-center">
      <div className="font-serif text-[38px] leading-none tracking-[-0.02em]">
        <span className="text-primary-mid" ref={ref}>{Math.floor(count)}{suffix}</span>
      </div>
      <div className="mt-1 text-[12px] font-medium text-white/50">{label}</div>
    </div>
  );
}

function StaticStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-serif text-[38px] leading-none tracking-[-0.02em] text-primary-mid">{value}</div>
      <div className="mt-1 text-[12px] font-medium text-white/50">{label}</div>
    </div>
  );
}

export default function StatsBar() {
  return (
    <div
      className="relative overflow-hidden bg-surface-dark py-7"
      aria-label="Estadísticas de la plataforma"
    >
      {/* Top line accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-mid/35 to-transparent" aria-hidden="true" />

      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-6 px-8">
        <CountStat end={380} suffix="+" label="Profesionales activos" />
        <div className="hidden h-12 w-px bg-white/10 md:block" aria-hidden="true" />
        <StaticStat value="$2.800M" label="Honorarios gestionados 2025" />
        <div className="hidden h-12 w-px bg-white/10 md:block" aria-hidden="true" />
        <CountStat end={98} suffix="%" label="Tasa de cobro vs. sin plataforma" />
        <div className="hidden h-12 w-px bg-white/10 md:block" aria-hidden="true" />
        <StaticStat value="4.9" label="Calificación satisfacción" />
        <div className="hidden h-12 w-px bg-white/10 md:block" aria-hidden="true" />
        <CountStat end={14} suffix="%" label="Ahorro promedio mensual" />
      </div>
    </div>
  );
}
