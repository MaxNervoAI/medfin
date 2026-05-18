'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex max-w-6xl items-center px-4 py-2">
        {/* Logo + Brand */}
        <Link href="/" className="flex items-center gap-1 transition-opacity hover:opacity-80">
          <img 
            src="/logotemp2.png" 
            alt="Dr Wallet Logo" 
            className="h-6 w-6 object-contain"
          />
          <span className="font-display text-base font-bold text-foreground">
            Dr Wallet
          </span>
        </Link>
      </div>
    </header>
  );
}
