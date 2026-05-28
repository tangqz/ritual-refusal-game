import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Cultural Compass — Chinese Social Navigation Game',
    template: '%s | Cultural Compass',
  },
  description:
    'An interactive game for Chinese adoptees to explore Chinese social etiquette through roleplay. Learn the art of ritual refusal, face, and guanxi — one conversation at a time.',
  keywords: [
    'Chinese culture', 'social etiquette', 'adoptee', 'heritage',
    'guanxi', 'face', 'ritual refusal', 'cultural education',
    'language learning', 'roleplay game',
  ],
  authors: [{ name: 'Cultural Compass' }],
  creator: 'Cultural Compass',
  publisher: 'Cultural Compass',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'zh_CN',
    siteName: 'Cultural Compass',
    title: 'Cultural Compass — Learn Chinese Social Etiquette Through Play',
    description:
      'An interactive roleplay game for Chinese adoptees reconnecting with their heritage. Learn the art of ritual refusal, face, and guanxi.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Cultural Compass — Chinese Social Navigation Game',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cultural Compass — Learn Chinese Social Etiquette',
    description:
      'Interactive roleplay game for Chinese adoptees reconnecting with heritage.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Cultural Compass',
              description:
                'An interactive game for Chinese adoptees to explore Chinese social etiquette through roleplay.',
              applicationCategory: 'EducationalApplication',
              operatingSystem: 'Web',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
              author: { '@type': 'Organization', name: 'Cultural Compass' },
              inLanguage: ['en', 'zh'],
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
