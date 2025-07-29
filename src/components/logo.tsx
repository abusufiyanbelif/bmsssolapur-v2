
import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex items-center justify-center h-10 w-10">
      <Image src="/logo.svg" alt="Baitul Mal Samajik Sanstha (Solapur) Logo" width={32} height={32} />
    </div>
  );
}
