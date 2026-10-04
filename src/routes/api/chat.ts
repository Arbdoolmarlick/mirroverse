import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 4000;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const id = new URL(request.url).searchParams.get("conversationId");
        if (!id || !z.string().uuid().safeParse(id).success)
          return Response.json({ message: "Invalid conversation." }, { status: 400 });
        const { loadMirroChat } = await import("@/lib/mirro-chat.server");
        return Response.json(await loadMirroChat(id));
      },
      POST: async ({ request }) => {
        // Reject oversized payloads (100KB max)
        const contentLength = request.headers.get("content-length");
        if (contentLength && parseInt(contentLength, 10) > 100_000) {
          return Response.json({ message: "Request too large." }, { status: 413 });
        }

        // Validate Content-Type
        const contentType = request.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
          return Response.json({ message: "Invalid content type." }, { status: 415 });
        }

        // Parse and validate body shape
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ message: "Malformed JSON." }, { status: 400 });
        }

        const parsed = body as { messages?: unknown[]; conversationId?: string; context?: unknown };

        // Validate conversationId
        if (!parsed.conversationId || !z.string().uuid().safeParse(parsed.conversationId).success) {
          return Response.json({ message: "Invalid conversation ID." }, { status: 400 });
        }

        // Validate messages array
        if (!Array.isArray(parsed.messages)) {
          return Response.json({ message: "Messages must be an array." }, { status: 400 });
        }
        if (parsed.messages.length > MAX_MESSAGES) {
          return Response.json({ message: `Too many messages. Max ${MAX_MESSAGES}.` }, { status: 400 });
        }

        // Validate individual message sizes
        for (const msg of parsed.messages) {
          const m = msg as { parts?: { text?: string }[] };
          if (m.parts) {
            for (const part of m.parts) {
              if (part.text && part.text.length > MAX_MESSAGE_LENGTH) {
                return Response.json(
                  { message: `Message too long. Max ${MAX_MESSAGE_LENGTH} characters.` },
                  { status: 400 },
                );
              }
            }
          }
        }

        // Re-create request with validated body for downstream handler
        const validatedRequest = new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(parsed),
          signal: request.signal,
        });

        const { handleMirroChat } = await import("@/lib/mirro-chat.server");
        return handleMirroChat(validatedRequest);
      },
    },
  },
});
