/**
 * Hybrid progress store: tries server API first, falls back to localStorage.
 *
 * Requires a sessionId (generated once and stored in localStorage).
 * On first load, generates a UUID session ID.
 * On each save, syncs to server if available.
 * localStorage always serves as the local cache and offline fallback.
 */

import { loadProgress, saveProgress } from './game-progress-store';
import type { GameProgress, ScenarioProgress } from './game-progress-store';
import type { ScenarioId, LearningStage } from './scenario-config';

const SESSION_KEY = 'cultural-compass-session';

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID?.() ?? `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

async function syncToServer(progress: GameProgress): Promise<boolean> {
  try {
    const sessionId = getSessionId();
    if (!sessionId) return false;

    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        onboardingCompleted: progress.onboardingCompleted,
        completedScenarios: progress.completedScenarios,
        totalInsightsCollected: progress.totalInsightsCollected,
      }),
    });
    return res.ok;
  } catch {
    return false; // Server unavailable — localStorage is the fallback
  }
}

export async function syncScenarioToServer(
  scenarioId: ScenarioId,
  stage: LearningStage,
  roundsPlayed: number,
  endReason: string,
): Promise<boolean> {
  try {
    const sessionId = getSessionId();
    if (!sessionId) return false;

    const localProgress = loadProgress();
    const sp = localProgress.scenarioProgress[scenarioId];

    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        scenarioId,
        completedStages: sp?.completedStages ?? [stage],
        insightsCollected: sp?.insightsCollected ?? [],
        bestRoundsPlayed: roundsPlayed,
        bestEndReason: endReason,
        totalInsightsCollected: localProgress.totalInsightsCollected,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Load progress — always from localStorage (fast, always available).
 * Server sync happens on save, not on load.
 */
export function loadProgressHybrid(): GameProgress {
  return loadProgress();
}

/**
 * Save progress — save to localStorage immediately, then sync to server in background.
 */
export function saveProgressHybrid(progress: GameProgress): void {
  saveProgress(progress);
  // Fire-and-forget server sync
  syncToServer(progress).catch(() => {});
}

export { getSessionId as ensureSession };
