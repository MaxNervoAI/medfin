'use client';

import { useEffect, useState } from 'react';

export default function ScrollProgress() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setWidth(total > 0 ? Math.min((scrolled / total) * 100, 100) : 0);
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 z-[200] h-[2.5px] rounded-r-[2px] transition-[width] duration-75 ease-linear"
      style={{
        width: `${width}%`,
        background: 'linear-gradient(90deg, oklch(0.44 0.12 155), oklch(0.65 0.13 155))',
      }}
      aria-hidden="true"
    />
  );
}
