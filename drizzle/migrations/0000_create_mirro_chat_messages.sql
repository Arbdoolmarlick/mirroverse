CREATE TABLE public.mirro_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.mirro_chat_messages TO service_role;
ALTER TABLE public.mirro_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX mirro_chat_messages_conversation_created_idx ON public.mirro_chat_messages (conversation_id, created_at);