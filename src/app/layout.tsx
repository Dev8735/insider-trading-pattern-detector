import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Insider Trading Pattern Detector',
  description: 'Advanced dashboard for detecting insider trading patterns',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-background">
      <body className="text-foreground">
        {children}
      </body>
    </html>
  );
}
