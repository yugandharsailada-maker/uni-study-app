import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <div
      className={cn(
        "bg-current", // Uses the current text color
        className
      )}
      style={{
        maskImage: "url('/logo_mask.png')",
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskImage: "url('/logo_mask.png')",
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
      }}
      {...props}
    />
  );
}
