-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Chat rooms policies
CREATE POLICY "Users can view public rooms" ON public.chat_rooms FOR SELECT USING (NOT is_private OR id IN (
  SELECT room_id FROM public.room_members WHERE user_id = auth.uid()
));
CREATE POLICY "Admins can manage rooms" ON public.chat_rooms FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Users can create rooms" ON public.chat_rooms FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Messages policies
CREATE POLICY "Users can view messages in accessible rooms" ON public.messages FOR SELECT USING (
  room_id IN (
    SELECT id FROM public.chat_rooms WHERE NOT is_private OR id IN (
      SELECT room_id FROM public.room_members WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "Users can send messages to accessible rooms" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  room_id IN (
    SELECT id FROM public.chat_rooms WHERE NOT is_private OR id IN (
      SELECT room_id FROM public.room_members WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING (auth.uid() = user_id);

-- Violations policies (admin only)
CREATE POLICY "Admins can view all violations" ON public.violations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can create violations" ON public.violations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Punishments policies
CREATE POLICY "Users can view own punishments" ON public.punishments FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can manage punishments" ON public.punishments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Warnings policies
CREATE POLICY "Users can view own warnings" ON public.warnings FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Users can acknowledge own warnings" ON public.warnings FOR UPDATE USING (
  user_id = auth.uid() AND acknowledged = false
);
CREATE POLICY "Admins can create warnings" ON public.warnings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Activity logs policies (admin only)
CREATE POLICY "Admins can view activity logs" ON public.activity_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "System can insert activity logs" ON public.activity_logs FOR INSERT WITH CHECK (true);

-- Room members policies
CREATE POLICY "Users can view room members for accessible rooms" ON public.room_members FOR SELECT USING (
  room_id IN (
    SELECT id FROM public.chat_rooms WHERE NOT is_private OR id IN (
      SELECT room_id FROM public.room_members WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "Room admins can manage members" ON public.room_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) OR
  EXISTS (SELECT 1 FROM public.room_members WHERE room_id = room_members.room_id AND user_id = auth.uid() AND role IN ('admin', 'moderator'))
);
