'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';

function PhoneApp() {
  return (
    <div
      className="w-[300px] rounded-[48px] p-3"
      style={{
        background: '#111',
        boxShadow: '0 50px 100px -20px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.08) inset, 0 1px 0 rgba(255,255,255,.12) inset',
      }}
    >
      {/* Screen */}
      <div className="relative overflow-hidden rounded-[38px] bg-[#F8F8F2]" style={{ aspectRatio: '9/19.5' }}>
        {/* Notch */}
        <div className="absolute left-1/2 top-0 z-10 h-7 w-24 -translate-x-1/2 rounded-b-[18px] bg-[#111]" aria-hidden="true" />

        {/* App bar */}
        <div className="flex items-center justify-between border-b border-[#E8E8E0] bg-[#F8F8F2] px-4 pb-2.5 pt-11">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="#18191A" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <line x1="2" y1="5" x2="14" y2="5" /><line x1="2" y1="8" x2="14" y2="8" /><line x1="2" y1="11" x2="14" y2="11" />
          </svg>
          <Image
            src="/logo.png"
            alt="Dr Wallet"
            width={80}
            height={23}
            className="h-[18px] w-auto object-contain"
          />
          <div className="h-5 w-5 rounded-full bg-[#E4E4DC]" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-2.5 overflow-hidden px-3.5 py-3.5">
          {/* Greeting */}
          <div className="font-serif text-[15px] text-[#18191A]">
            Hola, profesional
            <span className="mt-0.5 block font-sans text-[9px] text-[#6B6F68]">4 prestaciones pendientes este mes</span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: 'Por cobrar', value: '$9.218.585', sub: '9 prestaciones abiertas', color: 'default' },
              { label: 'Cobrado este mes', value: '$533.144', sub: 'neto recibido', color: 'green' },
              { label: 'Sin boleta', value: '43', sub: 'pendientes de emitir', color: 'amber' },
              { label: 'Boleta emitida', value: '66', sub: 'esperando pago', color: 'green' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-[10px] border border-[#E4E4DC] bg-white p-2">
                <div className="mb-0.5 text-[7px] font-semibold uppercase tracking-wide text-[#6B6F68]">{stat.label}</div>
                <div className={`font-serif text-[15px] tracking-tight ${stat.color === 'green' ? 'text-[#2C6E44]' : stat.color === 'amber' ? 'text-[#D97706]' : 'text-[#18191A]'}`}>
                  {stat.value}
                </div>
                <div className="mt-0.5 text-[7px] text-[#A8ACA6]">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Alerts header */}
          <div className="flex items-center justify-between text-[8.5px] font-bold text-[#3A3D38]">
            <span>Alertas · 4</span>
            <span className="text-[#2C6E44]">Ver cobranzas</span>
          </div>

          {/* Alerts */}
          {[
            { dot: '#C0392B', name: 'Clínica Dávila', sub: 'Procedimiento', amount: '$31.286', chip: 'Vencida', chipColor: 'red' },
            { dot: '#D97706', name: 'Clínica Las Condes', sub: 'Cirugía · hoy', amount: '$129.877', chip: 'Hoy', chipColor: 'amber' },
            { dot: '#2C6E44', name: 'Hospital Salvador', sub: 'Turno noche', amount: '$320.000', chip: null, chipColor: null },
          ].map((alert) => (
            <div key={alert.name} className="flex items-center gap-1.5 rounded-[8px] border border-[#E4E4DC] bg-white px-2.5 py-2">
              <div className="h-[5px] w-[5px] flex-shrink-0 rounded-full" style={{ background: alert.dot }} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <b className="block overflow-hidden text-ellipsis whitespace-nowrap text-[9px] font-semibold">{alert.name}</b>
                <span className="text-[7.5px] text-[#6B6F68]">{alert.sub}</span>
              </div>
              <span className="whitespace-nowrap text-[9px] font-semibold text-[#18191A]">{alert.amount}</span>
              {alert.chip && (
                <span className={`rounded-full px-1.5 py-0.5 text-[7px] font-semibold ${alert.chipColor === 'red' ? 'bg-[#FEEAEA] text-[#C0392B]' : 'bg-[#FEF3C7] text-[#D97706]'}`}>
                  {alert.chip}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Bottom nav */}
        <div className="flex border-t border-[#E4E4DC] bg-white">
          {[
            { label: 'Inicio', active: true },
            { label: 'Cobranzas', active: false },
            { label: 'Lugares', active: false },
          ].map((item) => (
            <div key={item.label} className={`flex flex-1 flex-col items-center gap-1 py-2 text-[7px] font-medium ${item.active ? 'text-[#2C6E44]' : 'text-[#A8ACA6]'}`} aria-current={item.active ? 'page' : undefined}>
              <div className="h-3.5 w-3.5 rounded-sm bg-current opacity-60" aria-hidden="true" />
              {item.label}
              {item.active && <div className="h-[3px] w-[3px] rounded-full bg-[#2C6E44]" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const shouldReduce = useReducedMotion();

  const stagger = (i: number) => ({
    initial: shouldReduce ? {} : { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay: shouldReduce ? 0 : 0.08 + i * 0.1, ease: 'easeOut' as const },
  });

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Dot-grid texture */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, oklch(0.44 0.12 155 / 0.09) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        aria-hidden="true"
      />
      {/* Glow blobs */}
      <div className="pointer-events-none absolute -top-[120px] right-[15%] h-[500px] w-[500px] rounded-full blur-[72px]" style={{ background: 'radial-gradient(circle, oklch(0.65 0.13 155 / 0.2), transparent 70%)' }} aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 right-[3%] h-[320px] w-[320px] rounded-full blur-[72px]" style={{ background: 'radial-gradient(circle, oklch(0.44 0.12 155 / 0.12), transparent 70%)' }} aria-hidden="true" />

      <div className="relative z-10 mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-12 px-8 pb-16 pt-20 md:grid-cols-[1.05fr_1fr] md:pb-16 lg:min-h-[calc(100vh-64px)]">
        {/* Left — copy */}
        <div className="flex flex-col gap-0">
          <motion.div {...stagger(0)}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.44_0.12_155/0.3)] bg-accent px-3 py-1 text-[11.5px] font-semibold text-primary">
              <svg width="9" height="9" viewBox="0 0 9 9" aria-hidden="true"><circle cx="4.5" cy="4.5" r="4.5" fill="currentColor" opacity=".25" /><circle cx="4.5" cy="4.5" r="2" fill="currentColor" /></svg>
              Cobranzas para profesionales independientes
            </span>
          </motion.div>

          <motion.h1 {...stagger(1)} className="mt-4 font-serif text-[clamp(40px,5vw,64px)] leading-[1.08] tracking-[-0.025em] text-foreground">
            Deja de perder<br />
            <span className="italic text-primary-mid">tu tiempo y dinero</span><br />
            cada vez que<br />olvidas una boleta.
          </motion.h1>

          <motion.p {...stagger(2)} className="mt-4 max-w-[500px] text-[17px] leading-[1.65] text-muted-foreground">
            Trabajas en 3–6 lugares distintos con plazos diferentes. Dr. Wallet captura el 100% de tus honorarios, te avisa antes de que venza cada plazo y calcula automáticamente tu presupuesto mensual.
          </motion.p>

          <motion.div {...stagger(3)} className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="btn-shimmer relative inline-flex items-center justify-center gap-2 rounded-[12px] bg-primary px-7 py-[15px] text-[15px] font-bold text-primary-foreground shadow-[0_4px_16px_oklch(0.44_0.12_155/0.3)] transition-all hover:-translate-y-0.5 hover:bg-[oklch(0.348_0.10_155)] hover:shadow-[0_8px_28px_oklch(0.44_0.12_155/0.4)] focus-visible:outline-2 focus-visible:outline-primary"
            >
              Empezar gratis — 30 días
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-foreground px-6 py-[14px] text-[15px] font-semibold text-foreground transition-all hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-primary"
            >
              Ver cómo funciona
            </a>
          </motion.div>

        </div>

        {/* Right — phone mockup */}
        <div className="flex items-center justify-center md:order-last">
          <div className="relative">
            <motion.div
              initial={shouldReduce ? {} : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: shouldReduce ? 0 : 0.2, ease: 'easeOut' }}
              className={`relative ${shouldReduce ? '' : 'animate-float'}`}
            >
              <PhoneApp />

              {/* Live toast */}
              <div
                className="animate-toast-in absolute -left-6 bottom-10 z-10 hidden w-[228px] md:flex items-center gap-2.5 rounded-[16px] border border-border bg-card p-3 shadow-[0_20px_25px_-5px_rgb(0_0_0/0.08),_0_8px_10px_-6px_rgb(0_0_0/0.05)]"
                role="status"
                aria-label="Notificación en tiempo real"
              >
                <div className="animate-pulse-live h-[9px] w-[9px] flex-shrink-0 rounded-full bg-primary-mid" aria-hidden="true" />
                <div className="text-[12px] leading-[1.45] text-[oklch(0.268_0.008_130)]">
                  <strong className="block text-[13px] font-bold text-primary">+$340.000 recuperados</strong>
                  Dr. Martínez acaba de cobrar
                </div>
              </div>
            </motion.div>

            {/* Ground glow */}
            <div className="absolute -bottom-20 left-1/2 h-32 w-[260px] -translate-x-1/2 rounded-full blur-[40px]" style={{ background: 'radial-gradient(ellipse, oklch(0.44 0.12 155 / 0.18) 0%, transparent 70%)' }} aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
