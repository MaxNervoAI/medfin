'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function Footer() {
  const links = [
    { label: 'Términos', href: '/terminos' },
    { label: 'Privacidad', href: '/privacidad' },
    { label: 'Contacto', href: '/contacto' },
  ];

  return (
    <footer className="relative w-full bg-background">
      {/* Gradient Border */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Geographic Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="text-lg text-muted-foreground">
            Usado por médicos y psicólogos en Santiago, Viña del Mar, y Concepción.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Hecho para prestadores chilenos, no software genérico.
          </p>
        </motion.div>

        {/* Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 flex flex-wrap items-center justify-center gap-8"
        >
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </motion.div>

        {/* Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-sm text-muted-foreground"
        >
          © 2025 Dr Wallet
        </motion.div>
      </div>
    </footer>
  );
}
