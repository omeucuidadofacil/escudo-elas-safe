
-- Allow authenticated users to insert their own roles (needed for admin auto-assignment)
CREATE POLICY "Users can insert their own roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
