'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <header
      className={`sticky top-0 z-[100] w-full border-b border-border transition-[box-shadow,background] duration-250 ${
        scrolled
          ? 'bg-background/96 shadow-[0_1px_18px_rgb(0_0_0/0.07)]'
          : 'bg-background/82 backdrop-blur-[18px]'
      } supports-[backdrop-filter]:backdrop-saturate-180`}
    >
      <div className="mx-auto flex h-16 max-w-[1160px] items-center gap-10 px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
          <Image
            src="/logo.png"
            alt="Dr Wallet"
            width={120}
            height={35}
            className="h-[30px] w-auto object-contain"
            priority
          />
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-7 md:flex" aria-label="Secciones principales">
          {[
            { href: '#mision', label: 'Misión' },
            { href: '#como-funciona', label: 'Cómo funciona' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="group relative pb-0.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
              <span className="absolute bottom-0 left-0 h-[1.5px] w-0 rounded-full bg-primary transition-[width] duration-250 group-hover:w-full" aria-hidden="true" />
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2.5">
          <Link
            href="/login"
            className="hidden rounded-[10px] border border-border px-[18px] py-[9px] text-[13.5px] font-semibold text-foreground/80 transition-all hover:border-foreground/30 hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary md:inline-flex"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/login"
            className="inline-flex rounded-[10px] bg-primary px-[18px] py-[9px] text-[13.5px] font-semibold text-primary-foreground shadow-[0_1px_4px_oklch(0.44_0.12_155/0.2)] transition-all hover:-translate-y-px hover:bg-[oklch(0.348_0.10_155)] hover:shadow-[0_4px_12px_oklch(0.44_0.12_155/0.3)] focus-visible:outline-2 focus-visible:outline-primary"
          >
            Empezar gratis
          </Link>
        </div>
      </div>
    </header>
  );
}
