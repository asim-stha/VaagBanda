import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

/**
 * Universal, ultra-robust storage interface for Supabase Auth.
 * Automatically chooses the best storage engine depending on OS and web platforms.
 * Safely falls back to an in-memory dictionary if native modules fail or are not linked.
 */
class RobustStorage {
  private memoryStore: { [key: string]: string } = {};

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return typeof window !== 'undefined' && window.localStorage
          ? window.localStorage.getItem(key)
          : this.memoryStore[key] || null;
      } catch {
        return this.memoryStore[key] || null;
      }
    }

    try {
      // First check if AsyncStorage exists and is ready
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (e) {
      console.warn('AsyncStorage native module unavailable or failing. Using safe in-memory fallback.', e);
      return this.memoryStore[key] || null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
          return;
        }
      } catch {}
      this.memoryStore[key] = value;
      return;
    }

    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn('AsyncStorage.setItem failed. Storing in memory fallback.', e);
      this.memoryStore[key] = value;
    }
  }

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
          return;
        }
      } catch {}
      delete this.memoryStore[key];
      return;
    }

    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn('AsyncStorage.removeItem failed. Removing from memory fallback.', e);
      delete this.memoryStore[key];
    }
  }
}

const robustStorage = new RobustStorage();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: robustStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
