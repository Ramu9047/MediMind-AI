import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import DisclaimerBanner from '@/components/DisclaimerBanner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'MediMind AI - Clinical Healthcare Coordination Platform',
  description: 'Unified healthcare coordination platform connecting symptom evaluation, physician appointments, and diagnostic lab reports with LLM explanations.',
  icons: {
    icon: '/icon.svg?v=3',
    shortcut: '/icon.svg?v=3',
    apple: '/icon.svg?v=3',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg?v=3" />
        <link rel="shortcut icon" href="/icon.svg?v=3" />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <ThemeProvider>
          <AuthProvider>
            <DisclaimerBanner />
            <Navbar />
            <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
