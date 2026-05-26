import { supabase } from '../lib/supabase';

export const authService = {
  /**
   * Signs up a new user with email and password, and inserts their profile
   */
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user data returned from signup.');

    // Direct insertion into the profiles table to match the user schema.
    // If you have a Supabase database trigger doing this automatically, this will just be a safe backup
    // or upsert. Let's do an upsert.
    const { error: profileError } = await supabase.from('profiles').upsert({
      user_id: data.user.id,
      full_name: fullName,
      email: email,
    });

    if (profileError) {
      console.warn('Profile creation failed or profile already exists:', profileError.message);
      // We don't throw here because the user is successfully created in auth.users
    }

    return data;
  },

  /**
   * Signs in an existing user
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Signs out the current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Resets password for an email
   */
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'vaagbanda://reset-password',
    });
    if (error) throw error;
    return data;
  },

  /**
   * Gets the current session
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  /**
   * Gets the current user profile from public.profiles
   */
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data;
  },
};
