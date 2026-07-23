import './globals.css';
import type { Metadata } from 'next';
import { Nav } from '@/components/nav';

export const metadata: Metadata = {
  title: 'ChurnIQ · Customer Lifecycle Analytics',
  description:
    'Cohort retention, RFM segmentation, BG/NBD CLV, calibrated churn prediction, and causal uplift via Difference-in-Differences on real e-commerce data.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-ink-50">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-ink-50 font-sans text-ink-800 antialiased">
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
