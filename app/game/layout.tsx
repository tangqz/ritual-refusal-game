import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scenario Map — Choose Your Journey',
  description:
    'Explore Chinese social scenarios: from red envelope etiquette to dinner table diplomacy. Each scenario teaches a different cultural skill.',
};

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
