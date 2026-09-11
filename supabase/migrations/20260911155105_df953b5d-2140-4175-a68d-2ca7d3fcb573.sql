CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS "own profile read" ON public.profiles;
DROP POLICY IF EXISTS "own profile update" ON public.profiles;
DROP POLICY IF EXISTS "roles read own" ON public.user_roles;
DROP POLICY IF EXISTS "messages read" ON public.support_messages;
DROP POLICY IF EXISTS "messages insert" ON public.support_messages;
DROP POLICY IF EXISTS "messages update" ON public.support_messages;
DROP POLICY IF EXISTS "farms manage own" ON public.farms;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR private.has_role(auth.uid(),'admin'))
  WITH CHECK (id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "roles read own" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "messages read" ON public.support_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "messages insert" ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK ((sender = 'user' AND user_id = auth.uid()) OR (sender = 'admin' AND private.has_role(auth.uid(),'admin')));
CREATE POLICY "messages update" ON public.support_messages FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "farms manage own" ON public.farms FOR ALL TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid());

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);