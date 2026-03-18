import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import Script from 'next/script';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mandi Monitor | Rice Mill Management',
  description: 'Professional Rice Mill Management System for seamless Mandi and Private operations.',
  appleWebApp: {
    capable: true,
    title: 'Mandi Monitor',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: 'https://placehold.co/32x32/0b3d1e/ffffff.png?text=M',
    apple: 'https://placehold.co/180x180/0b3d1e/ffffff.png?text=MILL',
  }
};

export const viewport: Viewport = {
  themeColor: '#0b3d1e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="font-body antialiased min-h-screen overscroll-none">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(reg) {
                  console.log('Mandi Monitor: Standalone Engine Active.');
                }).catch(function(err) {
                  console.warn('Mandi Monitor: Offline Engine initialization pending.', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
