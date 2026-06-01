import { supabase } from '../lib/supabase';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

function avatarColorFromId(id: string): string {
  const palette = ['#DC143C', '#1A2B5F', '#9C27B0', '#FF6F00', '#00838F', '#2E7D32', '#C62828', '#4527A0'];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

async function fetchProfile(userId: string): Promise<AppUser | null> {
  const { data } = await supabase
    .from('profiles')
    .select('user_id, full_name, email, avatar_color')
    .eq('user_id', userId)
    .single();
  if (!data) return null;
  return {
    id: data.user_id,
    name: data.full_name || 'User',
    email: data.email || '',
    avatarColor: data.avatar_color || avatarColorFromId(userId),
  };
}

export const authService = {
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Signup failed — please try again');

    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: data.user.id,
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      avatar_color: avatarColorFromId(data.user.id),
    });
    if (profileError) throw new Error(profileError.message);
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
    const user = await fetchProfile(session.user.id);
    if (!user) return null;
    return { access_token: session.access_token, user };
  },

  async getProfile(): Promise<AppUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return fetchProfile(user.id);
  },
};
