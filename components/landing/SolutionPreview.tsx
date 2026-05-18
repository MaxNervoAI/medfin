'use client';

import { useScrollReveal } from '@/lib/hooks/use-scroll-reveal';

export default function SolutionPreview() {
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
          <p className="text-center text-lg text-foreground md:text-xl lg:max-w-2xl lg:mx-auto">
            Dr Wallet rastrea automáticamente tus prestaciones, calcula retenciones de boleta de honorarios (14.5%), y te alerta antes de que venza cada plazo. Nunca más pierdes dinero por fechas olvidadas.
          </p>
          <p className="mt-8 text-center font-bold text-primary">
            Si te encanta hacer Excel los fines de semana, este producto no es para ti.
          </p>
        </div>
      </div>
    </section>
  );
}
