'use client';

import { useScrollReveal } from '@/lib/hooks/use-scroll-reveal';

export default function SocialProof() {
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
          <p className="text-center text-lg text-primary md:text-xl">
            Hecho para prestadores chilenos, no software genérico.
          </p>
        </div>
      </div>
    </section>
  );
}
