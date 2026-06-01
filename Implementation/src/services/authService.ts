import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, ApiUser } from './apiService';

const TOKEN_KEY = 'vaagbanda_token';
const USER_KEY = 'vaagbanda_user';

async function persistAuth(token: string, user: ApiUser) {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
}

export const authService = {
  async signUp(email: string, password: string, fullName: string) {
    const data = await apiService.request<{ token: string; user: ApiUser }>('/auth/signup', {
      method: 'POST',
      body: { email, password, name: fullName },
      token: null,
    });
    await persistAuth(data.token, data.user);
    return data;
  },

  async signIn(email: string, password: string) {
    const data = await apiService.request<{ token: string; user: ApiUser }>('/auth/login', {
      method: 'POST',
      body: { email, password },
      token: null,
    });
    await persistAuth(data.token, data.user);
    return data;
  },

  async signOut() {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  },

  async resetPassword(email: string) {
    return apiService.request('/auth/forgot-password', {
      method: 'POST',
      body: { email },
      token: null,
    });
  },

  async getSession() {
    const [token, userRaw] = await Promise.all([
      AsyncStorage.getItem(TOKEN_KEY),
      AsyncStorage.getItem(USER_KEY),
    ]);

    if (!token || !userRaw) return null;
    return {
      access_token: token,
      user: JSON.parse(userRaw) as ApiUser,
    };
  },

  async getProfile() {
    const userRaw = await AsyncStorage.getItem(USER_KEY);
    return userRaw ? JSON.parse(userRaw) as ApiUser : null;
  },
};
