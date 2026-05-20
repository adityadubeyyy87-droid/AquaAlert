import { useEffect, useState } from "react";

export function useCountUp(end: number, duration = 1100) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (end === 0) { setValue(0); return; }
    let startTime: number | null = null;

    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(end * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);

  return value;
}
