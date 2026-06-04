import { supabase } from '../lib/supabase';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  avatarUrl?: string;
}

function avatarColorFromId(id: string): string {
  const palette = ['#DC143C', '#1A2B5F', '#9C27B0', '#FF6F00', '#00838F', '#2E7D32', '#C62828', '#4527A0'];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

async function fetchProfile(userId: string): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, full_name, email, avatar_color, avatar_url')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    // avatar_url column may not exist yet — fall back to base columns so login still works
    const { data: base } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, avatar_color')
      .eq('user_id', userId)
      .single();
    if (!base) return null;
    return {
      id: base.user_id,
      name: base.full_name || 'User',
      email: base.email || '',
      avatarColor: base.avatar_color || avatarColorFromId(userId),
    };
  }

  return {
    id: data.user_id,
    name: data.full_name || 'User',
    email: data.email || '',
    avatarColor: data.avatar_color || avatarColorFromId(userId),
    avatarUrl: data.avatar_url || undefined,
  };
}

export const authService = {
  async signUp(email: string, password: string, fullName: string): Promise<{ needsVerification: boolean }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Signup failed — please try again');
    return { needsVerification: data.session === null };
  },

  async resendVerification(email: string) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw new Error(error.message);
  },

  async signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) throw new Error(error.message);
  },

  async getSession(): Promise<{ access_token: string; user: AppUser } | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const profile = await fetchProfile(session.user.id);
    const user: AppUser = profile ?? {
      id: session.user.id,
      name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
      email: session.user.email ?? '',
      avatarColor: avatarColorFromId(session.user.id),
    };
    return { access_token: session.access_token, user };
  },

  async getProfile(): Promise<AppUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return fetchProfile(user.id);
  },
};
