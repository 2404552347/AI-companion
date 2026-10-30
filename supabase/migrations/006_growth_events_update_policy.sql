-- Allow review updates to refresh the user's existing growth event.
CREATE POLICY "Users can update own growth_events" ON public.growth_events
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
