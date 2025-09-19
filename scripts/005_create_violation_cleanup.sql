-- Function to automatically clean up expired punishments
CREATE OR REPLACE FUNCTION public.cleanup_expired_punishments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark expired punishments as inactive
  UPDATE public.punishments
  SET is_active = false
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at < NOW();

  -- Unban users whose ban has expired
  UPDATE public.profiles
  SET is_banned = false
  WHERE is_banned = true
    AND id IN (
      SELECT user_id
      FROM public.punishments
      WHERE punishment_type = 'ban'
        AND is_active = false
        AND expires_at IS NOT NULL
        AND expires_at < NOW()
    );
END;
$$;

-- Function to get user's current active punishments
CREATE OR REPLACE FUNCTION public.get_active_punishments(p_user_id UUID)
RETURNS TABLE (
  punishment_type TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.punishment_type, p.expires_at, p.reason
  FROM public.punishments p
  WHERE p.user_id = p_user_id
    AND p.is_active = true
    AND (p.expires_at IS NULL OR p.expires_at > NOW())
  ORDER BY p.created_at DESC;
END;
$$;

-- Function to check if user can send messages
CREATE OR REPLACE FUNCTION public.can_user_send_message(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_banned BOOLEAN;
  is_muted BOOLEAN;
BEGIN
  -- Check if user is banned
  SELECT profiles.is_banned INTO is_banned
  FROM public.profiles
  WHERE id = p_user_id;

  IF is_banned THEN
    RETURN FALSE;
  END IF;

  -- Check if user is currently muted
  SELECT EXISTS(
    SELECT 1
    FROM public.punishments
    WHERE user_id = p_user_id
      AND punishment_type = 'mute'
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO is_muted;

  RETURN NOT is_muted;
END;
$$;
