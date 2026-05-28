import type { Metadata } from 'next';
import { SCENARIOS, type ScenarioId } from '@/lib/scenario-config';

interface Props {
  children: React.ReactNode;
  params: Promise<{ scenario: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { scenario } = await params;
  const config = SCENARIOS[scenario as ScenarioId];

  if (!config) {
    return { title: 'Scenario Not Found' };
  }

  return {
    title: `${config.titleEn} — Cultural Compass`,
    description: config.descriptionEn,
    openGraph: {
      title: `${config.titleEn} — Learn ${config.themeEn}`,
      description: config.descriptionEn,
    },
  };
}

export default function ScenarioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
