ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS descricao text DEFAULT '';
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS ambiente text DEFAULT 'producao';
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS url_base text DEFAULT '';