'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, FileText, Calculator, Calendar, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface FeaturesProps {
  sectionLabel?: string;
  heading?: string;
  subheading?: string;
  learnMoreHref?: string;
  learnMoreText?: string;
  features?: Feature[];
}

const defaultFeatures: Feature[] = [
  {
    title: 'Captura de boletas',
    description: 'Registra tus prestaciones en segundos. Sube fotos o ingresa los datos manualmente.',
    icon: <FileText className="w-5 h-5" aria-hidden="true" />,
  },
  {
    title: 'Cálculo automático',
    description: 'Calcula retenciones de boleta de honorarios (14.5%) automáticamente sin errores.',
    icon: <Calculator className="w-5 h-5" aria-hidden="true" />,
  },
  {
    title: 'Calendario integrado',
    description: 'Sincroniza tus citas con tu calendario personal y profesional.',
    icon: <Calendar className="w-5 h-5" aria-hidden="true" />,
  },
  {
    title: 'Seguridad de datos',
    description: 'Tus datos profesionales y financieros están protegidos con encriptación de nivel bancario.',
    icon: <Shield className="w-5 h-5" aria-hidden="true" />,
  },
  {
    title: 'Configuración rápida',
    description: 'Configura tus instituciones y retenciones en minutos, no en horas.',
    icon: <Zap className="w-5 h-5" aria-hidden="true" />,
  },
];

export default function Features({
  sectionLabel = 'Características',
  heading = 'Todo lo que necesitas para controlar tus finanzas como profesional de la salud, en una sola plataforma.',
  subheading = 'El sistema está roto: cada institución tiene plazos diferentes, y olvidar una fecha significa perder $150K–500K CLP.',
  learnMoreHref = '/login',
  learnMoreText = 'Empezar gratis',
  features = defaultFeatures,
}: FeaturesProps) {
  const shouldReduce = useReducedMotion();
  const duration = shouldReduce ? 0 : 0.6;

  return (
    <section className="my-20 lg:my-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between gap-10 py-0 md:py-8">
          {/* Left Column */}
          <motion.div
            className="w-full md:w-1/2 lg:w-[45%] mb-12 md:mb-0"
            initial={shouldReduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration, ease: 'easeOut' }}
            viewport={{ once: true }}
          >
            <p className="eyebrow mb-6">{sectionLabel}</p>
            <h2 className="leading-tight text-xl lg:text-2xl text-foreground mb-6 font-display font-semibold">
              {heading}
            </h2>
            <p className="text-base text-muted-foreground mb-8">
              {subheading}
            </p>
            <Link
              href={learnMoreHref}
              className="font-semibold transition-all duration-150 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary py-1.5 px-2.5 text-sm leading-5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {learnMoreText}
            </Link>
          </motion.div>

          {/* Right Column - Features */}
          <motion.div
            className="w-full md:w-1/2 lg:w-[55%]"
            initial={shouldReduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration, ease: 'easeOut', delay: shouldReduce ? 0 : 0.2 }}
            viewport={{ once: true }}
          >
            <div className="border-t border-b divide-y border-border">
              {features.map((feature, index) => (
                <FeatureItem
                  key={index}
                  feature={feature}
                  index={index}
                  shouldReduce={!!shouldReduce}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

interface FeatureItemProps {
  feature: Feature;
  index: number;
  shouldReduce: boolean;
}

function FeatureItem({ feature, index, shouldReduce }: FeatureItemProps) {
  return (
    <motion.div
      className="flex flex-col relative py-7 group"
      initial={shouldReduce ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduce ? 0 : 0.4, ease: 'easeOut', delay: shouldReduce ? 0 : 0.3 + index * 0.1 }}
      viewport={{ once: true }}
    >
      <div className="flex justify-between">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-primary group-hover:text-primary/80 transition-colors duration-200" aria-hidden="true">
            {feature.icon}
          </div>
          <h3 className="!leading-none transition-colors duration-200 ease-linear text-lg xl:text-xl text-foreground group-hover:text-primary">
            {feature.title}
          </h3>
        </div>
        <div className="text-muted-foreground group-hover:text-foreground transition-colors duration-200" aria-hidden="true">
          <ArrowUpRight className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>
      <p className="leading-tight pr-4 transition-colors duration-200 ease-linear text-sm lg:text-sm xl:text-base text-muted-foreground group-hover:text-foreground/80">
        {feature.description}
      </p>
    </motion.div>
  );
}
