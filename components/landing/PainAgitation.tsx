'use client';

import { useScrollReveal } from '@/lib/hooks/use-scroll-reveal';

export default function PainAgitation() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="px-4 py-8 md:py-12">
      <div className="mx-auto max-w-4xl">
        <div
          ref={ref}
          className={`transition-opacity duration-700 ${
            isVisible ? 'opacity-100' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="mb-8 font-display text-3xl font-bold text-foreground md:text-4xl">
            El sistema está roto
          </h2>
          <ul className="space-y-4 text-lg text-foreground md:text-xl">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
              <span>Colmena exige boleta dentro de 30 días — pero tu plazo es 45 días</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
              <span>RedSalud tiene 60 días — pero tu plazo es 30 días</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
              <span>Isapre tiene 90 días — pero tu plazo es 45 días</span>
            </li>
          </ul>
          <p className="mt-8 italic text-muted-foreground">
            El promedio de prestadores chilenos tiene 47 Post-it notes con fechas de vencimiento olvidadas en su escritorio.
          </p>
        </div>
      </div>
    </section>
  )
}
