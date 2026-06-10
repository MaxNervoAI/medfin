'use client';

import { motion, useReducedMotion } from 'framer-motion';

const steps = [
  {
    n: 1,
    icon: (
      <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 21V6a2 2 0 0 1 2-2h6v17" />
        <path d="M12 8h6a2 2 0 0 1 2 2v11" />
      </svg>
    ),
    title: 'Registra tus lugares de trabajo',
    desc: 'Agrega cada clínica u hospital con su RUT y define las reglas de plazo por tipo de prestación.',
    note: 'Tarda ~3 minutos por institución',
  },
  {
    n: 2,
    icon: (
      <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" />
      </svg>
    ),
    title: 'Registra cada prestación',
    desc: 'Cirugía, consulta, procedimiento o turno. Dr. Wallet calcula automáticamente la fecha límite y el monto neto.',
    note: 'Menos de 30 segundos por prestación',
  },
  {
    n: 3,
    icon: (
      <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="m9 16 2 2 4-4" />
      </svg>
    ),
    title: 'Visualiza tus vencimientos y cobra a tiempo',
    desc: 'Consulta todos tus plazos de cobro en un solo panel. Tu historial queda ordenado y disponible cuando lo necesitas.',
    note: 'Cero boletas perdidas',
  },
];

export default function HowItWorks() {
  const shouldReduce = useReducedMotion();

  return (
    <section
      id="como-funciona"
      className="px-8 py-24 lg:py-28"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto max-w-[1160px]">
        {/* Section header */}
        <motion.div
          className="mb-16 text-center"
          initial={shouldReduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        >
          <div className="eyebrow mb-3 justify-center">Proceso</div>
          <h2 id="how-heading" className="font-serif text-[clamp(30px,3.5vw,46px)] leading-[1.12] tracking-[-0.02em] text-foreground">
            Tres pasos y ya estás al día
          </h2>
          <p className="mx-auto mt-3.5 max-w-[540px] text-[16px] leading-[1.7] text-muted-foreground">
            Sin migración de datos, sin papeleo. En menos de 10 minutos tienes el control total de tus honorarios.
          </p>
        </motion.div>

        {/* Stepper */}
        <div className="relative mx-auto grid max-w-[1000px] grid-cols-1 gap-0 md:grid-cols-3">
          {/* Connecting line */}
          <div
            className="pointer-events-none absolute left-[calc(100%/6)] right-[calc(100%/6)] top-6 hidden h-px md:block"
            style={{ background: 'linear-gradient(90deg, oklch(0.952 0.035 148), oklch(0.65 0.13 155) 50%, oklch(0.952 0.035 148))' }}
            aria-hidden="true"
          />

          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              className="group relative z-10 px-6 pb-8"
              initial={shouldReduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: shouldReduce ? 0 : i * 0.15, ease: 'easeOut' }}
            >
              {/* Step number */}
              <div
                className="relative z-20 mx-auto mb-7 grid h-12 w-12 place-items-center rounded-full bg-primary text-[16px] font-bold text-primary-foreground transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:scale-110"
                style={{ boxShadow: '0 0 0 6px var(--background), 0 0 0 7px oklch(0.44 0.12 155 / 0.25)' }}
                aria-label={`Paso ${step.n}`}
              >
                {step.n}
              </div>

              {/* Step card */}
              <div className="rounded-[20px] border border-border bg-card p-7 shadow-[0_1px_3px_rgb(0_0_0/0.07),_0_1px_2px_-1px_rgb(0_0_0/0.04)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_10px_15px_-3px_rgb(0_0_0/0.07),_0_4px_6px_-4px_rgb(0_0_0/0.04)]">
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-[12px] bg-accent text-primary">
                  {step.icon}
                </div>
                <h3 className="mb-2 text-[16px] font-bold tracking-[-0.01em] text-foreground">{step.title}</h3>
                <p className="text-[13.5px] leading-[1.65] text-muted-foreground">{step.desc}</p>
                <div className="mt-3.5 flex items-center gap-1.5 text-[12px] font-semibold text-primary">
                  <span aria-hidden="true">✓</span>
                  {step.note}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
