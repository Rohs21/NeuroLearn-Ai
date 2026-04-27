'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export function AnimateSection({ children, className = '', delay = 0, direction = 'up' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const translate =
    direction === 'up'    ? 'translate-y-8'  :
    direction === 'down'  ? '-translate-y-8' :
    direction === 'left'  ? 'translate-x-8'  :
    direction === 'right' ? '-translate-x-8' : '';

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? `opacity-100 translate-x-0 translate-y-0` : `opacity-0 ${translate}`
      } ${className}`}
    >
      {children}
    </div>
  );
}
