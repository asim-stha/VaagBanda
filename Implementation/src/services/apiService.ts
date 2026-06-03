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

// ─── Extended Types ───────────────────────────────────────────────────────────

export interface ExpenseDetail {
  id: string;
  description: string;
  emoji: string;
  amount: number;
  currency: string;
  paidByName: string;
  paidByColor: string;
  date: string;
  category: string;
  groupName: string;
  note: string;
  splits: Array<{ name: string; avatarColor: string; amount: number; isPayer: boolean }>;
}

export interface ActivityItem {
  id: string;
  icon: string;
  text: string;
  time: string;
}

export interface ProfileStats {
  groupCount: number;
  expenseCount: number;
  netBalance: number;
}

export interface MemberTransaction {
  id: string;
  type: 'expense' | 'settlement';
  description: string;
  amount: number;
  date: string;
  emoji: string;
}

export interface AnalyticsData {
  categories: Array<{ emoji: string; label: string; amount: number; color: string }>;
  monthly: Array<{ month: string; amount: number }>;
  currency: string;
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

  async deleteGroup(groupId: string): Promise<void> {
    const { data: expenses, error: fetchErr } = await supabase
      .from('expenses')
      .select('expense_id')
      .eq('group_id', groupId);
    if (fetchErr) throw new Error(fetchErr.message);

    const expenseIds = (expenses || []).map((e: any) => e.expense_id);
    if (expenseIds.length > 0) {
      const { error: esErr } = await supabase
        .from('expense_splits')
        .delete()
        .in('expense_id', expenseIds);
      if (esErr) throw new Error(esErr.message);
    }

    const { error: eErr } = await supabase.from('expenses').delete().eq('group_id', groupId);
    if (eErr) throw new Error(eErr.message);

    const { error: sErr } = await supabase.from('settlements').delete().eq('group_id', groupId);
    if (sErr) throw new Error(sErr.message);

    const { error: mErr } = await supabase.from('group_members').delete().eq('group_id', groupId);
    if (mErr) throw new Error(mErr.message);

    const { error: gErr } = await supabase.from('groups').delete().eq('group_id', groupId);
    if (gErr) throw new Error(gErr.message);
  },

  async deleteExpense(expenseId: string): Promise<void> {
    const { error: esErr } = await supabase
      .from('expense_splits')
      .delete()
      .eq('expense_id', expenseId);
    if (esErr) throw new Error(esErr.message);

    const { error: eErr } = await supabase.from('expenses').delete().eq('expense_id', expenseId);
    if (eErr) throw new Error(eErr.message);
  },

  async updateExpense(expenseId: string, data: {
    description: string;
    amount: number;
    category: string;
    participants: string[];
    shares: Record<string, number>;
  }): Promise<void> {
    const { error: uErr } = await supabase
      .from('expenses')
      .update({
        title: data.description,
        amount: data.amount,
        category: data.category,
      })
      .eq('expense_id', expenseId);
    if (uErr) throw new Error(uErr.message);

    const { error: dErr } = await supabase
      .from('expense_splits')
      .delete()
      .eq('expense_id', expenseId);
    if (dErr) throw new Error(dErr.message);

    const splits = data.participants.map(pid => ({
      expense_id: expenseId,
      user_id: pid,
      amount_owed: data.shares[pid],
    }));
    const { error: iErr } = await supabase.from('expense_splits').insert(splits);
    if (iErr) throw new Error(iErr.message);
  },

  async getExpense(expenseId: string): Promise<{ data: ExpenseDetail }> {
    const userId = await getCurrentUserId();

    const { data: exp, error } = await supabase
      .from('expenses')
      .select(`
        expense_id, title, category, amount, created_at, paid_by, group_id,
        expense_splits(user_id, amount_owed),
        groups(group_name, default_currency)
      `)
      .eq('expense_id', expenseId)
      .single();
    if (error || !exp) throw new Error(error?.message || 'Expense not found');

    const groupData = exp.groups as unknown as { group_name: string; default_currency: string } | null;
    const splits: Array<{ user_id: string; amount_owed: number }> = exp.expense_splits || [];
    const userIds = Array.from(new Set([exp.paid_by, ...splits.map((s: any) => s.user_id)]));

    const { data: profileRows } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_color')
      .in('user_id', userIds);

    const profileMap = new Map(
      (profileRows || []).map((p: any) => [
        p.user_id,
        { name: p.full_name || 'Unknown', color: p.avatar_color || avatarColorFromId(p.user_id) },
      ])
    );

    const payerProfile = profileMap.get(exp.paid_by) ?? {
      name: 'Unknown', color: avatarColorFromId(exp.paid_by),
    };
    const formattedDate = new Date(exp.created_at).toLocaleString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    return {
      data: {
        id: exp.expense_id,
        description: exp.title,
        emoji: categoryEmoji[exp.category] || categoryEmoji.other,
        amount: Number(exp.amount),
        currency: groupData?.default_currency || 'NPR',
        paidByName: exp.paid_by === userId ? 'You' : payerProfile.name,
        paidByColor: payerProfile.color,
        date: formattedDate,
        category: exp.category,
        groupName: groupData?.group_name || '',
        note: '',
        splits: splits.map((s: any) => {
          const profile = profileMap.get(s.user_id) ?? {
            name: 'Unknown', color: avatarColorFromId(s.user_id),
          };
          return {
            name: s.user_id === userId ? 'You' : profile.name,
            avatarColor: profile.color,
            amount: Number(s.amount_owed),
            isPayer: s.user_id === exp.paid_by,
          };
        }),
      },
    };
  },

  async getActivity(): Promise<{ data: ActivityItem[] }> {
    const userId = await getCurrentUserId();

    const { data: memberRows } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);
    if (!memberRows?.length) return { data: [] };

    const groupIds = memberRows.map((r: any) => r.group_id);

    const [expResult, setResult] = await Promise.all([
      supabase
        .from('expenses')
        .select('expense_id, title, amount, paid_by, created_at, group_id, category, groups(group_name)')
        .in('group_id', groupIds)
        .order('created_at', { ascending: false })
        .limit(15),
      supabase
        .from('settlements')
        .select('settlement_id, amount, payer_id, payee_id, created_at, group_id, groups(group_name)')
        .in('group_id', groupIds)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const expenses = expResult.data || [];
    const settlements = setResult.data || [];

    const userIds = Array.from(new Set([
      ...expenses.map((e: any) => e.paid_by),
      ...settlements.flatMap((s: any) => [s.payer_id, s.payee_id]),
    ]));

    const profileRows = userIds.length
      ? (await supabase.from('profiles').select('user_id, full_name').in('user_id', userIds)).data || []
      : [];

    const nameOf = (id: string) =>
      id === userId ? 'You' : ((profileRows as any[]).find(p => p.user_id === id)?.full_name || 'Someone');

    type Raw = { ts: string; item: ActivityItem };
    const raw: Raw[] = [
      ...expenses.map((e: any): Raw => ({
        ts: e.created_at,
        item: {
          id: `exp-${e.expense_id}`,
          icon: categoryEmoji[e.category] || '💰',
          text: `${nameOf(e.paid_by)} added "${e.title}" to ${(e.groups as any)?.group_name || 'a group'}`,
          time: formatRelativeDate(e.created_at),
        },
      })),
      ...settlements.map((s: any): Raw => ({
        ts: s.created_at,
        item: {
          id: `set-${s.settlement_id}`,
          icon: '✅',
          text: `${nameOf(s.payer_id)} settled with ${nameOf(s.payee_id)} in ${(s.groups as any)?.group_name || 'a group'}`,
          time: formatRelativeDate(s.created_at),
        },
      })),
    ];

    raw.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    return { data: raw.map(r => r.item) };
  },

  async getProfileStats(): Promise<{ data: ProfileStats }> {
    const userId = await getCurrentUserId();

    const { data: memberRows } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    const groupIds = (memberRows || []).map((r: any) => r.group_id);
    if (!groupIds.length) return { data: { groupCount: 0, expenseCount: 0, netBalance: 0 } };

    const { data: groups } = await supabase
      .from('groups')
      .select('group_id, expenses(expense_id, paid_by, amount, expense_splits(user_id, amount_owed)), settlements(payer_id, payee_id, amount)')
      .in('group_id', groupIds);

    let netBalance = 0;
    let expenseCount = 0;

    for (const g of (groups || [])) {
      const exps: DbExpense[] = (g.expenses || []).map((e: any) => ({
        ...e, expense_splits: e.expense_splits || [],
      }));
      const setts: DbSettlement[] = (g.settlements || []).map((s: any) => ({ ...s, created_at: s.created_at || '' }));
      netBalance += computeBalance(exps, setts, userId);
      expenseCount += exps.filter((e: any) =>
        e.paid_by === userId || e.expense_splits.some((s: any) => s.user_id === userId)
      ).length;
    }

    return { data: { groupCount: groupIds.length, expenseCount, netBalance: round2(netBalance) } };
  },

  async getMemberHistory(groupId: string, memberId: string): Promise<{ data: MemberTransaction[] }> {
    const userId = await getCurrentUserId();

    const { data: g, error } = await supabase
      .from('groups')
      .select('default_currency, expenses(expense_id, paid_by, title, category, amount, created_at, expense_splits(user_id, amount_owed)), settlements(settlement_id, payer_id, payee_id, amount, created_at)')
      .eq('group_id', groupId)
      .single();
    if (error || !g) throw new Error(error?.message || 'Group not found');

    type RawTx = { ts: string; tx: MemberTransaction };
    const raw: RawTx[] = [];

    for (const e of (g.expenses || [])) {
      const splits: Array<{ user_id: string; amount_owed: number }> = e.expense_splits || [];
      const userIn = splits.some(s => s.user_id === userId);
      const memberIn = splits.some(s => s.user_id === memberId);
      if (!userIn || !memberIn) continue;

      const mySplit = splits.find(s => s.user_id === userId);
      const amount = e.paid_by === userId
        ? round2(Number(e.amount) - Number(mySplit?.amount_owed || 0))
        : round2(-Number(mySplit?.amount_owed || 0));

      raw.push({
        ts: e.created_at,
        tx: {
          id: e.expense_id,
          type: 'expense',
          description: e.title,
          amount,
          date: new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          emoji: categoryEmoji[e.category] || categoryEmoji.other,
        },
      });
    }

    for (const s of (g.settlements || [])) {
      const relevant =
        (s.payer_id === userId && s.payee_id === memberId) ||
        (s.payer_id === memberId && s.payee_id === userId);
      if (!relevant) continue;

      raw.push({
        ts: s.created_at,
        tx: {
          id: s.settlement_id,
          type: 'settlement',
          description: 'Settlement',
          amount: s.payer_id === userId ? Number(s.amount) : -Number(s.amount),
          date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          emoji: '💵',
        },
      });
    }

    raw.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    return { data: raw.map(r => r.tx) };
  },

  async getAnalytics(groupId: string): Promise<{ data: AnalyticsData }> {
    const userId = await getCurrentUserId();

    const { data: g, error } = await supabase
      .from('groups')
      .select('default_currency, expenses(expense_id, category, amount, created_at, expense_splits(user_id, amount_owed))')
      .eq('group_id', groupId)
      .single();
    if (error || !g) throw new Error(error?.message || 'Group not found');

    const catColors: Record<string, string> = {
      food: '#FF6F00', transport: '#1A2B5F', hotel: '#DC143C',
      tickets: '#9C27B0', shopping: '#00838F', fuel: '#E65100', utility: '#455A64', other: '#5A6478',
    };
    const catLabels: Record<string, string> = {
      food: 'Food', transport: 'Transport', hotel: 'Stay', tickets: 'Tickets',
      shopping: 'Shopping', fuel: 'Fuel', utility: 'Utility', other: 'Other',
    };

    const catTotals: Record<string, number> = {};
    const monthTotals: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthTotals[d.toLocaleDateString('en-US', { month: 'short' })] = 0;
    }

    for (const exp of (g.expenses || [])) {
      const split = (exp.expense_splits || []).find((s: any) => s.user_id === userId);
      const myAmt = split ? Number(split.amount_owed) : 0;
      if (myAmt <= 0) continue;

      catTotals[exp.category] = round2((catTotals[exp.category] || 0) + myAmt);

      const d = new Date(exp.created_at);
      const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
      if (monthsAgo >= 0 && monthsAgo < 6) {
        const key = d.toLocaleDateString('en-US', { month: 'short' });
        monthTotals[key] = round2((monthTotals[key] || 0) + myAmt);
      }
    }

    const categories = Object.entries(catTotals)
      .filter(([, v]) => v > 0)
      .map(([key, amount]) => ({
        emoji: categoryEmoji[key] || '📦',
        label: catLabels[key] || key,
        amount,
        color: catColors[key] || '#5A6478',
      }))
      .sort((a, b) => b.amount - a.amount);

    const monthly = Object.entries(monthTotals).map(([month, amount]) => ({ month, amount }));

    return { data: { categories, monthly, currency: g.default_currency } };
  },
};
