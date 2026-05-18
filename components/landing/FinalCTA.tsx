'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FinalCTA() {
  const router = useRouter();

  return (
    <section className="w-full px-6 py-20 lg:px-12 lg:py-32 bg-background">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl bg-primary p-12 md:p-16 text-center"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 font-display text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-primary-foreground"
          >
            Deja de ser contador. Vuelve a ser médico.
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-lg font-medium transition-colors bg-background text-foreground hover:bg-background/90"
              onClick={() => {
                router.push('/login');
              }}
            >
              Empezar gratis — 14 días de prueba
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
