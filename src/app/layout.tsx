
import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';
import { Toaster } from "@/components/ui/toaster";
import { Inter, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';

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
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} h-full`}>
      <body className="font-body antialiased h-full bg-background">
        {/* Payment Gateway SDKs */}
        <Script async src="https://pay.google.com/gp/p/js/pay.js" />
        <Script src="https://mercury.phonepe.com/transact/sdk-v1.js" />
        
        <AppShell>
          {children}
        </AppShell>
        <Toaster />
      </body>
    </html>
  );
}
