import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Framily Squares',
  description: 'Friendship is a wildly underrated medication.',
  openGraph: {
    images: [
      {
        url: 'https://static.www.nfl.com/image/upload/q_auto,f_auto,dpr_2.0/league/etzmsk3i8zqm3fn9ydl7',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://static.www.nfl.com/image/upload/q_auto,f_auto,dpr_2.0/league/etzmsk3i8zqm3fn9ydl7',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
