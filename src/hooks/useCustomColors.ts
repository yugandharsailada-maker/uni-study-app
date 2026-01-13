import { useEffect } from 'react';

// Helper to convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

// Set CSS variable
function setCssVariable(name: string, value: string) {
  document.documentElement.style.setProperty(name, value);
}

export function useCustomColors() {
  useEffect(() => {
    // Watch for theme changes and reload colors when theme toggles
    const observer = new MutationObserver(() => {
      const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      const savedForegroundHsl = localStorage.getItem(`customForegroundHsl_${theme}`);
      const savedPrimaryHsl = localStorage.getItem(`customPrimaryHsl_${theme}`);
      const savedSubjectCardBgHsl = localStorage.getItem(`customSubjectCardBgHsl_${theme}`);
      const savedSubjectCardFgHsl = localStorage.getItem(`customSubjectCardFgHsl_${theme}`);

      if (savedForegroundHsl) {
        setCssVariable('--foreground', savedForegroundHsl);
        setCssVariable('--card-foreground', savedForegroundHsl);
        setCssVariable('--popover-foreground', savedForegroundHsl);
      }

      if (savedPrimaryHsl) {
        setCssVariable('--primary', savedPrimaryHsl);
        setCssVariable('--accent', savedPrimaryHsl);
        setCssVariable('--ring', savedPrimaryHsl);
        setCssVariable('--glow-primary', savedPrimaryHsl);
      }

      if (savedSubjectCardBgHsl) {
        setCssVariable('--subject-card-bg', savedSubjectCardBgHsl);
      }

      if (savedSubjectCardFgHsl) {
        setCssVariable('--subject-card-fg', savedSubjectCardFgHsl);
      }
    });

    // Observe class changes on documentElement (when theme toggles)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Load colors on initial mount
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const savedForegroundHsl = localStorage.getItem(`customForegroundHsl_${theme}`);
    const savedPrimaryHsl = localStorage.getItem(`customPrimaryHsl_${theme}`);
    const savedSubjectCardBgHsl = localStorage.getItem(`customSubjectCardBgHsl_${theme}`);
    const savedSubjectCardFgHsl = localStorage.getItem(`customSubjectCardFgHsl_${theme}`);

    if (savedForegroundHsl) {
      setCssVariable('--foreground', savedForegroundHsl);
      setCssVariable('--card-foreground', savedForegroundHsl);
      setCssVariable('--popover-foreground', savedForegroundHsl);
    }

    if (savedPrimaryHsl) {
      setCssVariable('--primary', savedPrimaryHsl);
      setCssVariable('--accent', savedPrimaryHsl);
      setCssVariable('--ring', savedPrimaryHsl);
      setCssVariable('--glow-primary', savedPrimaryHsl);
    }

    if (savedSubjectCardBgHsl) {
      setCssVariable('--subject-card-bg', savedSubjectCardBgHsl);
    }

    if (savedSubjectCardFgHsl) {
      setCssVariable('--subject-card-fg', savedSubjectCardFgHsl);
    }

    return () => observer.disconnect();
  }, []);
}

