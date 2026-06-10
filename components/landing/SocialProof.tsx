'use client';

import { useScrollReveal } from '@/lib/hooks/use-scroll-reveal';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  city: string;
}

const testimonials: Testimonial[] = [
  {
    quote: 'Perdía entre $200K y $300K CLP por mes en boletas olvidadas. Ahora recibo una alerta cinco días antes de cada vencimiento.',
    name: 'Dra. [Nombre]',
    role: 'Médica internista',
    city: 'Santiago',
  },
  {
    quote: 'Trabajo en cuatro centros. Antes usaba cuatro planillas distintas. Ahora tengo todo en un solo lugar y el cálculo de retenciones es automático.',
    name: 'Dr. [Nombre]',
    role: 'Psicólogo clínico',
    city: 'Viña del Mar',
  },
];

export default function SocialProof() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div
          ref={ref}
          className={`transition-opacity duration-700 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p className="eyebrow text-center mb-10">Lo que dicen los profesionales</p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {testimonials.map((t, i) => (
              <figure key={i} className="space-y-4">
                <blockquote>
                  <p className="text-base text-foreground leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </blockquote>
                <figcaption className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">{t.name}</span>
                  <span className="text-sm text-muted-foreground">{t.role} — {t.city}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
