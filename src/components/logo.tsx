
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("relative", className)}>
      <Image
        src="/logo.svg"
        alt="Baitul Mal Samajik Sanstha (Solapur) Logo"
        fill
        priority
        className="object-contain"
      />
    </div>
  );
}
