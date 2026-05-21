import type { ScenarioId, LearningStage } from './scenario-config';

export interface StagePerformance {
  roundsPlayed: number;
  endReason: string;
}

export interface ScenarioProgress {
  completedStages: LearningStage[];
  bestPerformance: StagePerformance | null;
  insightsCollected: string[];
  lastPlayedAt: string | null;
}

export interface GameProgress {
  onboardingCompleted: boolean;
  completedScenarios: ScenarioId[];
  scenarioProgress: Partial<Record<ScenarioId, ScenarioProgress>>;
  totalInsightsCollected: number;
  lastActiveAt: string;
}

const STORAGE_KEY = 'cultural-compass-progress';

function emptyProgress(): GameProgress {
  return {
    onboardingCompleted: false,
    completedScenarios: [],
    scenarioProgress: {},
    totalInsightsCollected: 0,
    lastActiveAt: new Date().toISOString(),
  };
}

export function loadProgress(): GameProgress {
  if (typeof window === 'undefined') return emptyProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as GameProgress;
    return {
      ...emptyProgress(),
      ...parsed,
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress: GameProgress): void {
  if (typeof window === 'undefined') return;
  progress.lastActiveAt = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

export function completeOnboarding(): GameProgress {
  const progress = loadProgress();
  progress.onboardingCompleted = true;
  saveProgress(progress);
  return progress;
}

export function getScenarioProgress(scenarioId: ScenarioId): ScenarioProgress {
  const progress = loadProgress();
  return (
    progress.scenarioProgress[scenarioId] ?? {
      completedStages: [],
      bestPerformance: null,
      insightsCollected: [],
      lastPlayedAt: null,
    }
  );
}

export function completeScenarioStage(
  scenarioId: ScenarioId,
  stage: LearningStage,
  performance: StagePerformance
): GameProgress {
  const progress = loadProgress();
  const sp = progress.scenarioProgress[scenarioId] ?? {
    completedStages: [],
    bestPerformance: null,
    insightsCollected: [],
    lastPlayedAt: null,
  };

  if (!sp.completedStages.includes(stage)) {
    sp.completedStages.push(stage);
  }
  sp.bestPerformance = performance;
  sp.lastPlayedAt = new Date().toISOString();

  if (!progress.completedScenarios.includes(scenarioId)) {
    progress.completedScenarios.push(scenarioId);
  }

  progress.scenarioProgress[scenarioId] = sp;
  saveProgress(progress);
  return progress;
}

export function collectInsight(scenarioId: ScenarioId, insightId: string): GameProgress {
  const progress = loadProgress();
  const sp = progress.scenarioProgress[scenarioId] ?? {
    completedStages: [],
    bestPerformance: null,
    insightsCollected: [],
    lastPlayedAt: null,
  };

  if (!sp.insightsCollected.includes(insightId)) {
    sp.insightsCollected.push(insightId);
    progress.totalInsightsCollected += 1;
  }

  progress.scenarioProgress[scenarioId] = sp;
  saveProgress(progress);
  return progress;
}

export function getAllCollectedInsightIds(): string[] {
  const progress = loadProgress();
  const ids: string[] = [];
  for (const sp of Object.values(progress.scenarioProgress)) {
    if (sp?.insightsCollected) {
      ids.push(...sp.insightsCollected);
    }
  }
  return ids;
}

export function resetProgress(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function hasProgress(): boolean {
  const progress = loadProgress();
  return progress.completedScenarios.length > 0 || progress.totalInsightsCollected > 0;
}
