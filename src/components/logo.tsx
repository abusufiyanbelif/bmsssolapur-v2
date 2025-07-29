
import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export const Logo = ({ className, width = 32, height = 32 }: LogoProps) => {
  return (
    <Image
      src="/logo.svg" // Assuming your logo is named logo.svg in the /public directory
      alt="Baitul Mal Samajik Sanstha Logo"
      width={width}
      height={height}
      className={cn(className)}
      priority // Add priority to load the logo faster as it's in the LCP (Largest Contentful Paint)
    />
  );
};
