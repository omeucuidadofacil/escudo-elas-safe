ALTER TABLE public.contatos_emergencia ADD COLUMN IF NOT EXISTS email text DEFAULT '' NULL;
ALTER TABLE public.contatos_emergencia ADD COLUMN IF NOT EXISTS telegram_chat_id text DEFAULT '' NULL;