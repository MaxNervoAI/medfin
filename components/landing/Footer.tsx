import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background px-8 py-8" aria-label="Pie de página">
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-4">
        <Link href="/" className="transition-opacity hover:opacity-70">
          <Image
            src="/logo.png"
            alt="Dr Wallet"
            width={100}
            height={29}
            className="h-[26px] w-auto object-contain"
          />
        </Link>

        <nav className="flex flex-wrap items-center gap-6" aria-label="Legal">
          <Link href="/terminos" className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">Términos</Link>
          <Link href="/privacidad" className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">Privacidad</Link>
          <Link href="/contacto" className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">Contacto</Link>
        </nav>

        <span className="text-[12px] text-muted-foreground">© 2026 Dr. Wallet SpA · Santiago, Chile</span>
      </div>
    </footer>
  );
}
