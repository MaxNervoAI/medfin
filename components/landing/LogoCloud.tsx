'use client';

import { useRef, useEffect, useState } from 'react';

interface Logo {
  name: string;
  logo: string;
  width?: number;
}

interface LogoCloudProps {
  mode?: 'light' | 'dark';
  title?: string;
  logos?: Logo[];
}

const DEFAULT_LOGOS: Logo[] = [
  {
    name: 'Colmena',
    logo: 'https://framerusercontent.com/images/eziJbtVdIE4oo9IJIKWO4QuTa8.png',
    width: 85,
  },
  {
    name: 'RedSalud',
    logo: 'https://framerusercontent.com/images/vLH1BeYFnn9sXQl0IKTfquKlc.png',
    width: 105,
  },
  {
    name: 'Isapre',
    logo: 'https://framerusercontent.com/images/Q1570nHFlUQJyGOPWAR3haGlTVs.png',
    width: 140,
  },
  {
    name: 'Clinica 1',
    logo: 'https://framerusercontent.com/images/ekKmFyCz3wVQPGPBddI3lfpdc.png',
    width: 76,
  },
  {
    name: 'Clinica 2',
    logo: 'https://framerusercontent.com/images/mVExnTqDYhJaFKlowys7oUCTEh4.png',
    width: 89,
  },
  {
    name: 'Clinica 3',
    logo: 'https://framerusercontent.com/images/LEztpKm1mPRtm1h4kpY6pLZkchk.png',
    width: 120,
  },
];

export default function LogoCloud({
  mode = 'light',
  title = 'Usado en',
  logos = DEFAULT_LOGOS,
}: LogoCloudProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let scrollPosition = 0;
    const speed = 0.5;

    const animate = () => {
      if (!isHovered) {
        scrollPosition += speed;
        const firstChild = scrollContainer.firstElementChild as HTMLElement;
        if (firstChild && scrollPosition >= firstChild.offsetWidth + 10) {
          scrollPosition = 0;
        }
        scrollContainer.style.transform = `translateX(-${scrollPosition}px)`;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [isHovered]);

  const tripleLogos = [...logos, ...logos, ...logos];

  return (
    <section className="py-10 bg-background">
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex-1 h-px bg-border" />
          <p className="text-sm font-medium whitespace-nowrap text-muted-foreground">
            {title}
          </p>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div
          className="relative overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgb(0,0,0) 12.5%, rgb(0,0,0) 87.5%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgb(0,0,0) 12.5%, rgb(0,0,0) 87.5%, rgba(0,0,0,0) 100%)',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            ref={scrollRef}
            className="flex items-center gap-8"
            style={{ willChange: 'transform' }}
          >
            {tripleLogos.map((logo, index) => (
              <div
                key={`${logo.name}-${index}`}
                className="flex-shrink-0 h-8 flex items-center opacity-70"
                style={{ width: logo.width || 100 }}
              >
                <img
                  src={logo.logo}
                  alt={logo.name}
                  className="h-full w-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
