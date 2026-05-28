import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  upsertUser, getScenarioProgress, saveScenarioProgress,
  getGameProgress, saveGameProgress, deleteProgress,
} from '@/lib/progress-store-server';
import type { ProgressRecord, GameProgressRecord } from '@/lib/db-schema';

const syncSchema = z.object({
  sessionId: z.string().min(1).max(100),
  scenarioId: z.string().min(1).max(50).optional(),
  completedStages: z.array(z.string()).optional(),
  insightsCollected: z.array(z.string()).optional(),
  bestRoundsPlayed: z.number().int().min(1).optional(),
  bestEndReason: z.string().max(50).optional(),
  onboardingCompleted: z.boolean().optional(),
  completedScenarios: z.array(z.string()).optional(),
  totalInsightsCollected: z.number().int().min(0).optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const scenarioId = searchParams.get('scenarioId');

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Missing sessionId' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  await upsertUser(sessionId);

  if (scenarioId) {
    const sp = await getScenarioProgress(sessionId, scenarioId);
    return new Response(JSON.stringify({ scenarioProgress: sp }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  const gp = await getGameProgress(sessionId);
  return new Response(JSON.stringify({ gameProgress: gp }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = syncSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { sessionId, scenarioId, completedStages, insightsCollected,
    bestRoundsPlayed, bestEndReason, onboardingCompleted,
    completedScenarios, totalInsightsCollected } = parsed.data;

  await upsertUser(sessionId);

  // Save scenario-level progress
  if (scenarioId) {
    const existing = await getScenarioProgress(sessionId, scenarioId);
    const record: ProgressRecord = {
      userId: sessionId,
      scenarioId,
      completedStages: completedStages ?? existing?.completedStages ?? [],
      insightsCollected: insightsCollected ?? existing?.insightsCollected ?? [],
      bestRoundsPlayed: bestRoundsPlayed ?? existing?.bestRoundsPlayed ?? 0,
      bestEndReason: bestEndReason ?? existing?.bestEndReason ?? '',
      lastPlayedAt: new Date().toISOString(),
    };
    await saveScenarioProgress(sessionId, record);
  }

  // Save game-level progress
  const existingGame = await getGameProgress(sessionId);
  const gameRecord: GameProgressRecord = {
    userId: sessionId,
    onboardingCompleted: onboardingCompleted ?? existingGame?.onboardingCompleted ?? false,
    completedScenarios: completedScenarios ?? existingGame?.completedScenarios ?? [],
    totalInsightsCollected: totalInsightsCollected ?? existingGame?.totalInsightsCollected ?? 0,
    lastActiveAt: new Date().toISOString(),
  };
  await saveGameProgress(gameRecord);

  return new Response(JSON.stringify({
    success: true,
    gameProgress: gameRecord,
  }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Missing sessionId' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  await deleteProgress(sessionId);
  return new Response(JSON.stringify({ success: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}
