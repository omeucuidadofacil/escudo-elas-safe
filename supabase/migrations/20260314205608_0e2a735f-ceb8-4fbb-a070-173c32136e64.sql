CREATE POLICY "Authenticated users can read active API keys"
ON public.api_keys FOR SELECT
TO authenticated
USING (ativo = true);