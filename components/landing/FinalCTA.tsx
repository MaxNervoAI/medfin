import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden px-8 py-24 text-center lg:py-28">
      {/* Animated gradient background */}
      <div
        className="animate-cta-gradient absolute inset-0"
        style={{ background: 'linear-gradient(135deg, oklch(0.44 0.12 155) 0%, oklch(0.35 0.10 155) 40%, oklch(0.55 0.14 155) 100%)' }}
        aria-hidden="true"
      />
      {/* Radial light overlay */}
      <div
        className="pointer-events-none absolute -top-[200px] left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.07), transparent 60%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-[640px]">
        <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11.5px] font-semibold text-white/85">
          Sin tarjeta de crédito
        </span>

        <h2 className="font-serif text-[clamp(32px,4vw,56px)] leading-[1.1] tracking-[-0.02em] text-white">
          Empieza hoy.<br />
          <em className="not-italic text-white/60">Recupera lo que ya ganaste.</em>
        </h2>

        <p className="mx-auto mt-4 max-w-[480px] text-[16px] leading-[1.65] text-white/75">
          30 días gratis, sin límites. Después desde <strong className="text-white">$9.990/mes</strong> — menos de lo que pierdes en una sola boleta olvidada.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-[12px] bg-white px-7 py-[15px] text-[15px] font-bold text-primary shadow-[0_4px_16px_rgba(0,0,0,0.14)] transition-all hover:-translate-y-0.5 hover:bg-[oklch(0.974_0.006_95)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.2)] focus-visible:outline-2 focus-visible:outline-white"
          >
            Crear cuenta gratis
          </Link>
          <a
            href="#como-funciona"
            className="inline-flex items-center justify-center rounded-[12px] border-[1.5px] border-white/25 bg-white/10 px-6 py-[14px] text-[15px] font-semibold text-white transition-all hover:border-white/45 hover:bg-white/18 focus-visible:outline-2 focus-visible:outline-white"
          >
            Ver cómo funciona
          </a>
        </div>

        <p className="mt-6 text-[12px] text-white/42">Sin compromiso · Cancela cuando quieras · Datos encriptados</p>
      </div>
    </section>
  );
}
