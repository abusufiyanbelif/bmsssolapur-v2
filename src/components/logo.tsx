
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("relative", className)}>
      <Image
        src="https://placehold.co/100x100/16a34a/ffffff.png?text=BMS"
        alt="Baitul Mal Samajik Sanstha (Solapur) Logo"
        fill
        priority
        className="object-contain"
        data-ai-hint="logo"
      />
    </div>
  );
}
