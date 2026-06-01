import { useEffect, useState } from 'react';

export function useAnimatedNumber(finalValue: number) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1500;
    let animationFrame = 0;

    const update = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.round(easeOutQuart * finalValue));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(update);
      }
    };

    update();
    return () => cancelAnimationFrame(animationFrame);
  }, [finalValue]);

  return displayValue;
}
