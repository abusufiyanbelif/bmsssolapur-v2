
import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';
import { Toaster } from "@/components/ui/toaster";
import { Inter, Space_Grotesk } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-space-grotesk',
});


export const metadata: Metadata = {
  title: 'Baitul Mal Samajik Sanstha (Solapur)',
  description: 'Visualize your Firebase and external service configurations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={cn("font-body antialiased h-full bg-background", inter.variable, spaceGrotesk.variable)}>
        <AppShell>
          {children}
        </AppShell>
        <Toaster />
      </body>
    </html>
  );
}
