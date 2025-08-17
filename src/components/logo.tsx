
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("relative", className)}>
      <Image
        src="https://firebasestorage.googleapis.com/v0/b/baitul-mal-connect-visualizer.firebasestorage.app/o/app_assets%2FIMG-20250816-WA0000.jpg?alt=media"
        alt="Baitul Mal Samajik Sanstha (Solapur) Logo"
        fill
        priority
        className="object-contain"
        data-ai-hint="logo"
      />
    </div>
  );
}
