'use client';

import { motion, useReducedMotion } from 'framer-motion';

const problems = [
  {
    num: '01',
    icon: (
      <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 9h18" />
        <circle cx="17" cy="14" r="1" fill="currentColor" />
      </svg>
    ),
    title: 'Boletas olvidadas',
    body: 'Cada institución tiene su propio plazo. Sin un sistema, 1 de cada 4 boletas se emite fuera de plazo o simplemente no se emite. El dinero se queda en la clínica.',
    highlight: '1 de cada 4 boletas',
  },
  {
    num: '02',
    icon: (
      <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" />
      </svg>
    ),
    title: 'Prestaciones no pagadas',
    body: 'Instituciones o pacientes que por distintos motivos no pagan a tiempo. Diferencia de millones en tus ingresos anuales.',
    highlight: null,
  },
  {
    num: '03',
    icon: (
      <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-4 4" />
      </svg>
    ),
    title: 'Cero proyección financiera',
    body: 'Sin visibilidad de cuándo llega cada pago, es imposible planificar. El 68% de los profesionales independientes no sabe cuánto ganará el próximo mes.',
    highlight: 'El 68% de los profesionales',
  },
];

export default function ProblemCards() {
  const shouldReduce = useReducedMotion();

  return (
    <section className="px-8 py-24 lg:py-28" aria-labelledby="problems-heading">
      <div className="mx-auto max-w-[1160px]">
        {/* Section header */}
        <motion.div
          className="mb-14 max-w-[620px]"
          initial={shouldReduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        >
          <div className="eyebrow mb-3">El problema</div>
          <h2 id="problems-heading" className="font-serif text-[clamp(30px,3.5vw,46px)] leading-[1.12] tracking-[-0.02em] text-foreground">
            El sistema actual le cuesta caro a tu bolsillo
          </h2>
          <p className="mt-3.5 text-[16px] leading-[1.7] text-muted-foreground">
            Los profesionales independientes trabajan en múltiples instituciones con plazos distintos, emiten boletas al SII y no tienen visibilidad de sus ingresos reales.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {problems.map((p, i) => (
            <motion.div
              key={p.num}
              className="group relative overflow-hidden rounded-[20px] border border-border bg-card p-8 shadow-[0_1px_3px_rgb(0_0_0/0.07),_0_1px_2px_-1px_rgb(0_0_0/0.04)] transition-all duration-300 hover:-translate-y-[5px] hover:border-[oklch(0.44_0.12_155/0.25)] hover:shadow-[0_20px_25px_-5px_rgb(0_0_0/0.08),_0_8px_10px_-6px_rgb(0_0_0/0.05)]"
              initial={shouldReduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: shouldReduce ? 0 : i * 0.12, ease: 'easeOut' }}
            >
              {/* Watermark number */}
              <span
                className="pointer-events-none absolute -top-[10px] right-5 select-none font-serif text-[96px] italic leading-none text-secondary"
                aria-hidden="true"
              >
                {p.num}
              </span>

              {/* Icon chip */}
              <div className="mb-[18px] grid h-10 w-10 place-items-center rounded-[12px] bg-accent text-primary">
                {p.icon}
              </div>

              <h3 className="mb-2.5 text-[16px] font-bold tracking-[-0.01em] text-foreground">{p.title}</h3>
              <p className="text-[14px] leading-[1.7] text-muted-foreground">
                {p.highlight
                  ? p.body.split(p.highlight).map((part, j) =>
                      j === 0 ? (
                        <span key={j}>
                          {part}
                          <span className="font-semibold text-destructive">{p.highlight}</span>
                        </span>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )
                  : p.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
