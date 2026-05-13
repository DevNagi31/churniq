import './globals.css';
import type { Metadata } from 'next';
import { Nav } from '@/components/nav';

export const metadata: Metadata = {
  title: 'ChurnIQ — Customer Lifecycle Analytics',
  description:
    'Cohort retention, RFM segmentation, BG/NBD CLV, calibrated churn prediction, and causal uplift via Difference-in-Differences on real e-commerce data.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-ink-50">
      <body className="bg-ink-50 text-ink-800 antialiased font-sans">
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
