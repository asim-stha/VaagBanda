import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const categoryEmoji: Record<string, string> = {
  food: '🍽️',
  transport: '🚕',
  hotel: '🏨',
  tickets: '🎟️',
  shopping: '🛍️',
  fuel: '⛽',
  utility: '🧾',
  settlement: '✓',
  other: '📦',
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function formatRelativeDate(iso: string): string {
  const diffMs = Math.max(0, Date.now() - new Date(iso).getTime());
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(iso));
}

function avatarColorFromId(id: string): string {
  const palette = ['#DC143C', '#1A2B5F', '#9C27B0', '#FF6F00', '#00838F', '#2E7D32', '#C62828', '#4527A0'];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

interface DbExpense {
  expense_id: string;
  paid_by: string;
  amount: number;
  created_at: string;
  expense_splits: Array<{ user_id: string; amount_owed: number }>;
}

interface DbSettlement {
  payer_id: string;
  payee_id: string;
  amount: number;
  created_at: string;
}

function computeBalance(expenses: DbExpense[], settlements: DbSettlement[], userId: string): number {
  let balance = 0;
  for (const exp of expenses) {
    if (exp.paid_by === userId) balance += Number(exp.amount);
    const split = exp.expense_splits?.find(s => s.user_id === userId);
    if (split) balance -= Number(split.amount_owed);
  }
  for (const s of settlements) {
    if (s.payer_id === userId) balance += Number(s.amount);
    if (s.payee_id === userId) balance -= Number(s.amount);
  }
  return round2(balance);
}

async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const apiService = {
  async getGroups(): Promise<{ data: GroupSummary[] }> {
    const userId = await getCurrentUserId();

    const { data: memberRows, error: mErr } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);
    if (mErr) throw new Error(mErr.message);
    if (!memberRows?.length) return { data: [] };

    const groupIds = memberRows.map((r: any) => r.group_id);

    const { data: groups, error: gErr } = await supabase
      .from('groups')
      .select(`
        group_id, group_name, emoji, default_currency,
        group_members(user_id),
        expenses(expense_id, paid_by, amount, created_at, expense_splits(user_id, amount_owed)),
        settlements(payer_id, payee_id, amount, created_at)
      `)
      .in('group_id', groupIds);
    if (gErr) throw new Error(gErr.message);

    return {
      data: (groups || []).map((g: any) => {
        const expenses: DbExpense[] = g.expenses || [];
        const settlements: DbSettlement[] = g.settlements || [];
        const allEvents = [...expenses, ...settlements];
        const lastTs = allEvents.map(e => e.created_at).sort().at(-1);
        return {
          id: g.group_id,
          name: g.group_name,
          emoji: g.emoji || '👥',
          currency: g.default_currency,
          memberCount: (g.group_members || []).length,
          lastActivity: lastTs ? formatRelativeDate(lastTs) : 'No activity yet',
          myBalance: computeBalance(expenses, settlements, userId),
        };
      }),
    };
  },

  async createGroup(group: {
    name: string;
    emoji: string;
    currency: string;
    memberIds: string[];
  }): Promise<{ data: GroupSummary }> {
    const userId = await getCurrentUserId();

    const { data: newGroup, error: gErr } = await supabase
      .from('groups')
      .insert({
        group_name: group.name.trim(),
        emoji: group.emoji,
        default_currency: group.currency,
        created_by: userId,
      })
      .select('group_id, group_name, emoji, default_currency')
      .single();
    if (gErr || !newGroup) throw new Error(gErr?.message || 'Failed to create group');

    const memberIds = Array.from(new Set([userId, ...group.memberIds]));
    const { error: mErr } = await supabase.from('group_members').insert(
      memberIds.map(uid => ({ group_id: newGroup.group_id, user_id: uid }))
    );
    if (mErr) throw new Error(mErr.message);

    return {
      data: {
        id: newGroup.group_id,
        name: newGroup.group_name,
        emoji: newGroup.emoji || '👥',
        currency: newGroup.default_currency,
        memberCount: memberIds.length,
        lastActivity: 'Just now',
        myBalance: 0,
      },
    };
  },

  async getGroup(groupId: string): Promise<{ data: GroupDetail }> {
    const userId = await getCurrentUserId();

    const { data: g, error } = await supabase
      .from('groups')
      .select(`
        group_id, group_name, emoji, default_currency,
        group_members(user_id, profiles(user_id, full_name, avatar_color)),
        expenses(expense_id, paid_by, title, category, amount, created_at,
          expense_splits(user_id, amount_owed)),
        settlements(settlement_id, payer_id, payee_id, amount, created_at)
      `)
      .eq('group_id', groupId)
      .single();
    if (error || !g) throw new Error(error?.message || 'Group not found');

    const allExpenses: DbExpense[] = (g.expenses || []).map((e: any) => ({
      ...e,
      expense_splits: e.expense_splits || [],
    }));
    const allSettlements: DbSettlement[] = g.settlements || [];

    const members: GroupMember[] = (g.group_members || []).map((gm: any) => {
      const profile = gm.profiles as { full_name?: string; avatar_color?: string } | null;
      return {
        id: gm.user_id,
        name: profile?.full_name || 'Unknown',
        avatarColor: profile?.avatar_color || avatarColorFromId(gm.user_id),
        balance: computeBalance(allExpenses, allSettlements, gm.user_id),
      };
    });

    const expenses: GroupExpense[] = [...allExpenses]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((exp: any) => {
        const payer = members.find(m => m.id === exp.paid_by);
        const mySplit = exp.expense_splits?.find((s: any) => s.user_id === userId);
        const myShare = exp.paid_by === userId
          ? round2(Number(exp.amount) - Number(mySplit?.amount_owed || 0))
          : round2(-Number(mySplit?.amount_owed || 0));
        return {
          id: exp.expense_id,
          description: exp.title,
          amount: Number(exp.amount),
          paidBy: exp.paid_by,
          paidByName: exp.paid_by === userId ? 'You' : payer?.name || 'Unknown',
          date: formatRelativeDate(exp.created_at),
          emoji: categoryEmoji[exp.category] || categoryEmoji.other,
          myShare,
          participantCount: exp.expense_splits?.length || 0,
        };
      });

    return {
      data: {
        id: g.group_id,
        name: g.group_name,
        emoji: g.emoji || '👥',
        currency: g.default_currency,
        myUserId: userId,
        members,
        expenses,
      },
    };
  },

  async addExpense(groupId: string, expense: {
    description: string;
    amount: number;
    paidBy: string;
    category: string;
    participants: string[];
    shares: Record<string, number>;
  }): Promise<{ data: GroupDetail }> {
    const { data: group } = await supabase
      .from('groups')
      .select('default_currency')
      .eq('group_id', groupId)
      .single();

    const { data: newExpense, error: eErr } = await supabase
      .from('expenses')
      .insert({
        group_id: groupId,
        paid_by: expense.paidBy,
        title: expense.description.trim(),
        amount: expense.amount,
        currency: group?.default_currency || 'NPR',
        expense_date: new Date().toISOString().split('T')[0],
        category: expense.category || 'other',
      })
      .select('expense_id')
      .single();
    if (eErr || !newExpense) throw new Error(eErr?.message || 'Failed to add expense');

    const splits = expense.participants.map(pid => ({
      expense_id: newExpense.expense_id,
      user_id: pid,
      amount_owed: expense.shares[pid] ?? round2(expense.amount / expense.participants.length),
    }));
    const { error: sErr } = await supabase.from('expense_splits').insert(splits);
    if (sErr) throw new Error(sErr.message);

    return apiService.getGroup(groupId);
  },

  async getCreditors(groupId: string): Promise<{ data: Creditor[] }> {
    const userId = await getCurrentUserId();

    const { data: g, error } = await supabase
      .from('groups')
      .select(`
        group_members(user_id, profiles(full_name, avatar_color)),
        expenses(expense_id, paid_by, amount, created_at, expense_splits(user_id, amount_owed)),
        settlements(payer_id, payee_id, amount, created_at)
      `)
      .eq('group_id', groupId)
      .single();
    if (error || !g) throw new Error(error?.message || 'Group not found');

    const allExpenses: DbExpense[] = g.expenses || [];
    const allSettlements: DbSettlement[] = g.settlements || [];

    const creditors: Creditor[] = (g.group_members || [])
      .filter((gm: any) => gm.user_id !== userId)
      .map((gm: any) => {
        const profile = gm.profiles as { full_name?: string; avatar_color?: string } | null;
        return {
          id: gm.user_id,
          name: profile?.full_name || 'Unknown',
          avatarColor: profile?.avatar_color || avatarColorFromId(gm.user_id),
          amountOwed: Math.max(0, computeBalance(allExpenses, allSettlements, gm.user_id)),
        };
      })
      .filter((c: Creditor) => c.amountOwed > 0);

    return { data: creditors };
  },

  async recordSettlement(groupId: string, settlement: {
    payeeId: string;
    amount: number;
    method: 'cash' | 'bank' | 'other';
    note: string;
  }): Promise<{ data: unknown; group: GroupDetail }> {
    const userId = await getCurrentUserId();

    const { error } = await supabase.from('settlements').insert({
      group_id: groupId,
      payer_id: userId,
      payee_id: settlement.payeeId,
      amount: settlement.amount,
      method: settlement.method,
      note: settlement.note || '',
    });
    if (error) throw new Error(error.message);

    const { data: group } = await apiService.getGroup(groupId);
    return { data: {}, group };
  },
};
