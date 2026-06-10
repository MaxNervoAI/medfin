'use client';

import { motion, useReducedMotion } from 'framer-motion';

const cards = [
  {
    label: 'Misión',
    title: 'Que ningún profesional pierda un honorario que ya ganó.',
    body: 'Automatizamos el control de cobranzas, boletas y pagos para que los profesionales independientes puedan enfocarse en lo que mejor saben hacer: ejercer su profesión.',
  },
  {
    label: 'Visión',
    title: 'La plataforma financiera de referencia para profesionales independientes en Latinoamérica.',
    body: 'En 2030, queremos que cada profesional independiente tenga acceso a herramientas de clase mundial: cobranzas, inversiones, previsión y crédito, todo en un solo lugar.',
  },
  {
    label: 'Propósito',
    title: 'Dignificar la relación entre la medicina y el dinero.',
    body: 'Los profesionales independientes cuidan del bienestar de otros, pero nadie cuida el suyo. Dr. Wallet existe para cerrar esa brecha con transparencia, tecnología y respeto.',
  },
];

export default function MissionVision() {
  const shouldReduce = useReducedMotion();

  return (
    <section
      id="mision"
      className="relative overflow-hidden bg-surface-dark px-8 py-24 lg:py-28"
      aria-labelledby="mission-heading"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-[200px] -right-[80px] h-[600px] w-[600px] rounded-full" style={{ background: 'radial-gradient(circle, oklch(0.44 0.12 155 / 0.07), transparent 60%)' }} aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-[1160px]">
        {/* Header */}
        <motion.div
          className="mb-16 max-w-[580px]"
          initial={shouldReduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        >
          <div className="eyebrow eyebrow-light mb-3">Quiénes somos</div>
          <h2 id="mission-heading" className="font-serif text-[clamp(30px,3.5vw,46px)] leading-[1.12] tracking-[-0.02em] text-white">
            Construimos la capa financiera que los profesionales independientes nunca tuvieron.
          </h2>
          <p className="mt-3.5 text-[16px] leading-[1.7] text-white/50">
            Nacimos de la frustración real de un profesional que nunca tuvo control financiero real. Hoy construimos el copiloto financiero para profesionales independientes en Chile.
          </p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          className="grid grid-cols-1 overflow-hidden rounded-[20px] md:grid-cols-3"
          style={{ background: 'rgba(255,255,255,0.08)', gap: '1px' }}
          initial={shouldReduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: shouldReduce ? 0 : 0.1, ease: 'easeOut' }}
        >
          {cards.map((card) => (
            <div
              key={card.label}
              className="bg-[rgba(255,255,255,0.035)] p-10 transition-colors duration-250 hover:bg-[rgba(255,255,255,0.07)]"
            >
              <div className="mb-[18px] text-[10px] font-bold uppercase tracking-[0.18em] text-primary-mid">{card.label}</div>
              <h3 className="mb-4 font-serif text-[26px] leading-[1.25] tracking-[-0.01em] text-white">{card.title}</h3>
              <p className="text-[14px] leading-[1.75] text-white/48">{card.body}</p>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
