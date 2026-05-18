'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, FileText, Calculator, Calendar, Bell, Shield, Zap } from 'lucide-react';

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
    icon: <FileText className="w-5 h-5" />,
  },
  {
    title: 'Cálculo automático',
    description: 'Calcula retenciones de boleta de honorarios (14.5%) automáticamente sin errores.',
    icon: <Calculator className="w-5 h-5" />,
  },
  {
    title: 'Calendario integrado',
    description: 'Sincroniza tus citas con tu calendario personal y profesional.',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    title: 'Seguridad de datos',
    description: 'Tus datos médicos y financieros están protegidos con encriptación de nivel bancario.',
    icon: <Shield className="w-5 h-5" />,
  },
  {
    title: 'Configuración rápida',
    description: 'Configura tus instituciones y retenciones en minutos, no en horas.',
    icon: <Zap className="w-5 h-5" />,
  },
];

export default function Features({
  sectionLabel = 'Características',
  heading = 'Todo lo que necesitas para controlar tus finanzas médicas en una sola plataforma.',
  subheading = 'El sistema está roto: cada institución tiene plazos diferentes, y olvidar una fecha significa perder $150K-500K CLP.',
  learnMoreHref = '#',
  learnMoreText = 'Ver todas las características',
  features = defaultFeatures,
}: FeaturesProps) {
  return (
    <section className="my-20 lg:my-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {/* Content */}
          <div className="w-11/12 md:w-[87.5%] mx-auto relative py-20 md:py-32 lg:py-40">
            <div className="flex flex-col md:flex-row justify-between gap-10">
              {/* Left Column - Text and Button */}
              <motion.div
                className="w-full md:w-1/2 lg:w-[45%] mb-12 md:mb-0"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                viewport={{ once: true }}
              >
                <div className="text-xs lg:text-sm !leading-none mb-6 text-muted-foreground">
                  {sectionLabel}
                </div>
                <div className="!leading-tight text-lg md:text-lg lg:text-xl xl:text-2xl text-foreground mb-6">
                  {heading}
                </div>
                <p className="text-base text-muted-foreground mb-8">
                  {subheading}
                </p>
                <a
                  className="font-semibold transition-all duration-150 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary py-1.5 px-2.5 text-sm leading-5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                  href={learnMoreHref}
                >
                  {learnMoreText}
                </a>
              </motion.div>

              {/* Right Column - Features */}
              <motion.div
                className="w-full md:w-1/2 lg:w-[55%]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="border-t border-b divide-y border-border [--divide-color:theme(colors.border)]">
                  {features.map((feature, index) => (
                    <FeatureItem
                      key={index}
                      feature={feature}
                      index={index}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface FeatureItemProps {
  feature: Feature;
  index: number;
}

function FeatureItem({ feature, index }: FeatureItemProps) {
  return (
    <motion.div
      className="flex flex-col relative py-7 group"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 + index * 0.1 }}
      viewport={{ once: true }}
    >
      <div className="flex justify-between">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-primary group-hover:text-primary/80 transition-colors duration-200">
            {feature.icon}
          </div>
          <h4 className="!leading-none transition-colors duration-200 ease-linear text-lg xl:text-xl text-foreground group-hover:text-primary">
            {feature.title}
          </h4>
        </div>
        <div className="text-muted-foreground group-hover:text-foreground transition-colors duration-200">
          <ArrowUpRight className="w-5 h-5" />
        </div>
      </div>
      <p className="leading-tight pr-4 transition-colors duration-200 ease-linear text-sm lg:text-sm xl:text-base text-muted-foreground group-hover:text-foreground/80">
        {feature.description}
      </p>
    </motion.div>
  );
}
