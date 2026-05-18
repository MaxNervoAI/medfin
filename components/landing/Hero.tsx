'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCountUp } from '@/lib/hooks/use-count-up';
import { motion } from 'framer-motion';

export default function Hero() {
  const router = useRouter();
  const { count: countLow, ref: refLow } = useCountUp(150000, 2000);
  const { count: countHigh, ref: refHigh } = useCountUp(500000, 2000);
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCTA(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatCLP = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${num}`;
  };

  return (
    <>
      {/* Mobile sticky CTA */}
      {showStickyCTA && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm p-4 md:hidden">
          <button
            className="w-full inline-flex items-center justify-center rounded-lg bg-primary px-6 py-4 text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 font-display font-bold text-lg"
            aria-label="Empezar prueba gratis de 14 días"
            onClick={() => {
              // Analytics: Track sticky CTA click
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'conversion', {
                  send_to: 'AW-CONVERSION_ID',
                  event_category: 'landing',
                  event_label: 'sticky_cta_click',
                });
              }
              router.push('/login');
            }}
          >
            Empezar gratis — 14 días de prueba
          </button>
        </div>
      )}

      <section className="relative px-4 pt-8 pb-12 md:pt-12 md:pb-16 lg:pt-16 lg:pb-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[60%_40%]">
          {/* Left side - Text */}
          <div className="flex flex-col justify-center space-y-6">
            <h1 className="font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-7xl">
              Deja de perder <span className="font-mono-feature text-primary" ref={refLow}>{formatCLP(countLow)}</span>-<span className="font-mono-feature text-primary" ref={refHigh}>{formatCLP(countHigh)} CLP</span> cada vez que olvides una boleta
            </h1>
            <p className="text-lg text-foreground md:text-xl lg:text-2xl">
              Trabajas en 3-6 clínicas, cada una con plazos diferentes...
            </p>
            <p className="text-base text-muted-foreground md:text-lg">
              Dr Wallet captura el 100% de tus honorarios, calcula retenciones automáticamente, y te devuelve tu tiempo.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-4 text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 font-display font-bold text-lg"
                aria-label="Empezar prueba gratis de 14 días"
                onClick={() => {
                  // Analytics: Track CTA click
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'conversion', {
                      send_to: 'AW-CONVERSION_ID',
                      event_category: 'landing',
                      event_label: 'hero_cta_click',
                    });
                  }
                  router.push('/login');
                }}
              >
                Empezar gratis — 14 días de prueba
              </button>
              <button
                className="inline-flex items-center justify-center text-foreground underline transition-all hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-lg"
                aria-label="Ver video de demostración de 30 segundos"
                onClick={() => {
                  // Analytics: Track demo click
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'click', {
                      event_category: 'landing',
                      event_label: 'hero_demo_click',
                    });
                  }
                }}
              >
                Ver cómo funciona (30 segundos)
              </button>
            </div>
          </div>

          {/* Right side - Visual */}
          <div className="flex items-center justify-center">
            <div className="relative h-full w-full max-w-[300px]">
              {/* iPhone Frame */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative mx-auto h-[600px] w-full rounded-[3rem] border-8 border-gray-900 bg-gray-900 shadow-2xl shadow-primary/20 shadow-black/50 overflow-hidden"
              >
                {/* Screen */}
                <div className="relative h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-gray-900 rounded-b-xl" />
                  
                  {/* Screenshot */}
                  <div className="absolute inset-0 top-6">
                    <img 
                      src="/hero.png" 
                      alt="Dr Wallet app screenshot" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </motion.div>
              
              {/* Shadow */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 h-6 w-[80%] bg-primary/30 blur-2xl rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Background pattern */}
      <div className="absolute inset-0 -z-10 opacity-[0.03]">
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </section>
    </>
  )
}
