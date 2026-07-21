/**
 * Enterprise Prometheus Metrics (Mocked for offline compatibility)
 */

import type { Request, Response } from 'express';

class MockMetric {
  inc(_labels?: any, _value?: number) {}
  dec(_labels?: any, _value?: number) {}
  set(_labels?: any, _value?: number) {}
  observe(_labels?: any, _value?: number) {}
  labels(..._args: any[]) { return this; }
  startTimer(..._args: any[]) { return () => 0; }
}

const register = {
  contentType: 'text/plain',
  metrics: async () => '# Metrics disabled in offline mode.',
};

// ── HTTP metrics ──────────────────────────────────────────────────────────────
export const httpRequestDuration = new MockMetric();
export const httpRequestsTotal = new MockMetric();
export const httpRequestSizeBytes = new MockMetric();

// ── AI / Inference metrics ────────────────────────────────────────────────────
export const aiInferenceDuration = new MockMetric();
export const aiDetectionsTotal = new MockMetric();
export const aiModelsLoaded = new MockMetric();
export const aiQueueDepth = new MockMetric();

// ── Camera metrics ────────────────────────────────────────────────────────────
export const cameraConnectionsActive = new MockMetric();
export const cameraFramesProcessed = new MockMetric();
export const cameraFrameRate = new MockMetric();
export const cameraStreamLatency = new MockMetric();

// ── Security / Operations metrics ─────────────────────────────────────────────
export const activeAlarmsGauge = new MockMetric();
export const incidentsOpenGauge = new MockMetric();
export const evidenceStoredGauge = new MockMetric();

// ── Identity / Person intelligence metrics ────────────────────────────────────
export const identitiesTrackedGauge = new MockMetric();
export const faceRecognitionsTotal = new MockMetric();

// ── WebSocket / Streaming metrics ─────────────────────────────────────────────
export const wsConnectionsActive = new MockMetric();
export const wsMessagesTotal = new MockMetric();

// ── Infrastructure metrics ────────────────────────────────────────────────────
export const cacheHitsTotal = new MockMetric();
export const dbQueryDuration = new MockMetric();
export const messageBusPublished = new MockMetric();
export const storageOperationsTotal = new MockMetric();

// ── Metrics HTTP handler ──────────────────────────────────────────────────────
export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}

export { register };

