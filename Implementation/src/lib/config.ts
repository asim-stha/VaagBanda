declare const process: {
  env?: {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  };
};

const env = typeof process !== 'undefined' ? process.env : undefined;

export const SUPABASE_URL = env?.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = env?.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
