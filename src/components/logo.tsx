
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("relative", className)}>
      <Image
        src="https://firebasestorage.googleapis.com/v0/b/baitul-mal-connect.appspot.com/o/app_assets%2Flogo.png?alt=media&token=143585ad-4977-4d32-901b-3b02e3b835ca"
        alt="Baitul Mal Samajik Sanstha (Solapur) Logo"
        fill
        priority
        className="object-contain"
        data-ai-hint="logo"
      />
    </div>
  );
}
