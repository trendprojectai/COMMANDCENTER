let state = globalThis.__commandCenterPrismaState;
if (!state) {
  state = { client: null, initPromise: null, lastError: null };
  globalThis.__commandCenterPrismaState = state;
}

export function getPrismaInitError() {
  return state.lastError;
}

export async function getPrisma() {
  if (state.client) return state.client;
  if (state.initPromise) return state.initPromise;

  state.initPromise = (async () => {
    try {
      const mod = await import('@prisma/client');
      const PrismaClient = mod?.PrismaClient;
      if (!PrismaClient) throw new Error('PrismaClient export not found');

      const client = new PrismaClient();
      // If connect fails (missing env, missing generated client, etc), treat as unavailable.
      await client.$connect();

      state.client = client;
      state.lastError = null;
      return client;
    } catch (err) {
      state.client = null;
      state.lastError = err;
      return null;
    } finally {
      state.initPromise = null;
    }
  })();

  return state.initPromise;
}

// Keep a default export for backwards compatibility with older imports.
// Note: this is intentionally `null` until `getPrisma()` is awaited.
export default null;
