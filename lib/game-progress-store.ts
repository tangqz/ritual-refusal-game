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

let storageAvailable: boolean | null = null;

/** Check whether localStorage is available and writable on this device. */
export function isStorageAvailable(): boolean {
  if (storageAvailable !== null) return storageAvailable;
  if (typeof window === 'undefined') return false;
  try {
    const testKey = `${STORAGE_KEY}--test`;
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

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
  } catch (e) {
    console.error('[CulturalCompass] Progress data corrupted, attempting recovery:', e);
    // Save a backup of the corrupted data for debugging
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        localStorage.setItem(`${STORAGE_KEY}-corrupted-backup`, raw);
      }
    } catch {
      // Can't even save backup — storage may be full
    }
    // Try to recover partial data by parsing individual fields
    try {
      const partial = recoverPartialProgress();
      if (partial) {
        console.warn('[CulturalCompass] Partial progress recovered.');
        saveProgress(partial);
        return partial;
      }
    } catch {
      // Recovery failed
    }
    // Last resort: reset and start fresh
    localStorage.removeItem(STORAGE_KEY);
    console.warn('[CulturalCompass] Progress reset due to unrecoverable corruption.');
    return emptyProgress();
  }
}

function recoverPartialProgress(): GameProgress | null {
  // Attempt to salvage what we can from individual localStorage keys
  // This is a best-effort recovery — if the main key is corrupted,
  // we fall back to an empty state rather than guessing
  const backup = localStorage.getItem(`${STORAGE_KEY}-backup`);
  if (backup) {
    try {
      const parsed = JSON.parse(backup) as GameProgress;
      return { ...emptyProgress(), ...parsed };
    } catch {
      // Backup also corrupted
    }
  }
  return null;
}

export function saveProgress(progress: GameProgress): void {
  if (typeof window === 'undefined') return;
  if (!isStorageAvailable()) {
    console.warn('[CulturalCompass] Cannot save progress — localStorage is not available on this device.');
    return;
  }
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
