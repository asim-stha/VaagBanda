import AsyncStorage from '@react-native-async-storage/async-storage';

declare const process: {
  env?: {
    EXPO_PUBLIC_API_URL?: string;
  };
};

const envApiUrl = typeof process !== 'undefined'
  ? process.env?.EXPO_PUBLIC_API_URL
  : undefined;

export const API_BASE_URL = envApiUrl || 'http://172.19.22.126:4000';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

async function getStoredToken() {
  return AsyncStorage.getItem('vaagbanda_token');
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = options.token ?? await getStoredToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }

  return payload as T;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

export interface GroupSummary {
  id: string;
  name: string;
  emoji: string;
  currency: string;
  memberCount: number;
  lastActivity: string;
  myBalance: number;
}

export interface GroupMember {
  id: string;
  name: string;
  avatarColor: string;
  balance: number;
}

export interface GroupExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  paidByName: string;
  date: string;
  emoji: string;
  myShare: number;
  participantCount: number;
}

export interface GroupDetail {
  id: string;
  name: string;
  emoji: string;
  currency: string;
  myUserId: string;
  members: GroupMember[];
  expenses: GroupExpense[];
}

export interface Creditor {
  id: string;
  name: string;
  avatarColor: string;
  amountOwed: number;
}

export const apiService = {
  request,

  getMe() {
    return request<{ data: ApiUser }>('/me');
  },

  getGroups() {
    return request<{ data: GroupSummary[] }>('/groups');
  },

  createGroup(group: {
    name: string;
    emoji: string;
    currency: string;
    memberIds: string[];
  }) {
    return request<{ data: GroupSummary }>('/groups', {
      method: 'POST',
      body: group,
    });
  },

  getGroup(groupId: string) {
    return request<{ data: GroupDetail }>(`/groups/${groupId}`);
  },

  addExpense(groupId: string, expense: {
    description: string;
    amount: number;
    paidBy: string;
    category: string;
    participants: string[];
    shares: Record<string, number>;
  }) {
    return request<{ data: GroupDetail }>(`/groups/${groupId}/expenses`, {
      method: 'POST',
      body: expense,
    });
  },

  getCreditors(groupId: string) {
    return request<{ data: Creditor[] }>(`/groups/${groupId}/creditors`);
  },

  recordSettlement(groupId: string, settlement: {
    payeeId: string;
    amount: number;
    method: 'cash' | 'bank' | 'other';
    note: string;
  }) {
    return request<{ data: unknown; group: GroupDetail }>(`/groups/${groupId}/settlements`, {
      method: 'POST',
      body: settlement,
    });
  },
};
