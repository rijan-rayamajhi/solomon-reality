import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/layout/Providers';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Covenant Realty - Luxury Real Estate Platform',
  description: 'Discover premium residential and commercial properties across India',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      </head>
      <body className="min-h-screen flex flex-col bg-gradient-to-b from-white to-[#f8f9fb]">
        <Providers>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#FFFFFF',
                color: '#1E1E1E',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
                padding: '16px',
              },
              success: {
                iconTheme: {
                  primary: '#6EC1A6',
                  secondary: '#FFFFFF',
                },
                duration: 3000,
              },
              error: {
                iconTheme: {
                  primary: '#EF7C79',
                  secondary: '#FFFFFF',
                },
                duration: 5000,
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

