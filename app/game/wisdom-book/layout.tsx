import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wisdom Book — Collected Cultural Insights',
  description:
    'Your collection of Chinese cultural wisdom cards. Review the insights you have gathered through your journey across all scenarios.',
};

export default function WisdomBookLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
