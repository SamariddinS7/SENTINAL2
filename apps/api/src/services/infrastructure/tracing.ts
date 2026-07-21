/**
 * OpenTelemetry Tracing Setup — Sentinel VMS (Mocked for offline compatibility)
 */

export function setupTracing(): void {
  console.info('[tracing] Tracing is disabled in this environment.');
}

export function getVmsMeter() {
  return {
    createCounter: () => ({ add: () => {} }),
    createUpDownCounter: () => ({ add: () => {} }),
    createHistogram: () => ({ record: () => {} }),
  };
}

