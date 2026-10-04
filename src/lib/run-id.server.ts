const HEADER = "X-Lovable-AIG-Run-ID";
export function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  let resolveRunId: (value: string | undefined) => void = () => {};
  let resolved = false;
  const ready = new Promise<string | undefined>((resolve) => {
    resolveRunId = resolve;
  });
  const publish = (value?: string) => {
    const next = value?.trim() || undefined;
    if (!runId && next) runId = next;
    if (!resolved) {
      resolved = true;
      resolveRunId(runId);
    }
  };
  if (runId) publish(runId);
  return {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set(HEADER, runId);
      try {
        const response = await fetch(input, { ...init, headers });
        publish(response.headers.get(HEADER) ?? undefined);
        return response;
      } catch (error) {
        publish();
        throw error;
      }
    },
    getRunId: () => runId,
    waitForRunId: () => (runId ? Promise.resolve(runId) : ready),
  };
}
export function getLovableAiGatewayRunId(request: Request) {
  return request.headers.get(HEADER)?.trim() || undefined;
}
export async function withLovableAiGatewayRunIdHeader(
  response: Response,
  gateway: { getRunId: () => string | undefined; waitForRunId: () => Promise<string | undefined> },
) {
  const headers = new Headers(response.headers);
  const runId = gateway.getRunId() ?? (await gateway.waitForRunId());
  if (runId) headers.set(HEADER, runId);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
