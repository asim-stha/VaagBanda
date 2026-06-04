import React, { useMemo, useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';

/* ─── BRAND TOKENS ─────────────────────────────────────────── */
const COLORS = {
  CRIMSON: '#DC143C',
  CRIMSON_DARK: '#A01030',
  BLUE: '#1A2B5F',
  BLUE_DARK: '#0F1F4A',
  BLUE_MID: '#2B3F75',
  WHITE: '#FFFFFF',
  GHOST: '#F7F8FB',
  GRAY100: '#EEF1F6',
  GRAY200: '#E1E5EE',
  GRAY400: '#9AA3B5',
  GRAY600: '#5A6478',
  GRAY800: '#1F2A44',
  SUCCESS: '#27AE60',
  SUCCESS_DARK: '#1E8E47',
};

/* ─── ICONS ────────────────────────────────────────────────── */
type IconName = 'back' | 'plus' | 'check' | 'settings' | 'receipt' | 'leave' | 'menu' | 'trash';

const Icon = ({
  name, size = 18, color = COLORS.GRAY400,
}: { name: IconName; size?: number; color?: string }) => {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth: 2,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'back':
      return (
        <Svg {...props}>
          <Line x1="19" y1="12" x2="5" y2="12" />
          <Polyline points="12 19 5 12 12 5" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...props}>
          <Line x1="12" y1="5" x2="12" y2="19" />
          <Line x1="5" y1="12" x2="19" y2="12" />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...props}>
          <Polyline points="20 6 9 17 4 12" />
        </Svg>
      );
    case 'settings':
      return (
        <Svg {...props}>
          <Circle cx="12" cy="12" r="3" />
          <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </Svg>
      );
    case 'receipt':
      return (
        <Svg {...props}>
          <Path d="M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2H4z" />
          <Line x1="8" y1="8" x2="16" y2="8" />
          <Line x1="8" y1="12" x2="16" y2="12" />
          <Line x1="8" y1="16" x2="12" y2="16" />
        </Svg>
      );
    case 'leave':
      return (
        <Svg {...props}>
          <Path d="M17 16l4-4m0 0l-4-4m4 4H7m0-7v12a2 2 0 002 2h10a2 2 0 002-2V3a2 2 0 00-2-2H9a2 2 0 00-2 2" />
        </Svg>
      );
    case 'menu':
      return (
        <Svg {...props}>
          <Circle cx="12" cy="5" r="2" fill={color} />
          <Circle cx="12" cy="12" r="2" fill={color} />
          <Circle cx="12" cy="19" r="2" fill={color} />
        </Svg>
      );
    case 'trash':
      return (
        <Svg {...props}>
          <Polyline points="3 6 5 6 21 6" />
          <Path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          <Line x1="10" y1="11" x2="10" y2="17" />
          <Line x1="14" y1="11" x2="14" y2="17" />
        </Svg>
      );
    default: return null;
  }
};

/* ─── HELPERS ──────────────────────────────────────────────── */
const fmt = (n: number) => Math.abs(n).toLocaleString('en-US', {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});

const sign = (n: number) => (n > 0 ? '+' : n < 0 ? '-' : '');

/* ─── DOMAIN TYPES ─────────────────────────────────────────── */
interface Member {
  id: string;
  name: string;
  avatarColor: string;
  balance: number; // positive = is owed; negative = owes
  role: 'admin' | 'member';
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;       // member id
  paidByName: string;
  date: string;         // formatted "Today" / "Yesterday" / "Mar 12"
  emoji: string;
  myShare: number;      // negative if I owe, positive if I'm owed for this one
  participantCount: number;
}

interface GroupDetail {
  id: string;
  name: string;
  emoji: string;
  currency: string;
  myRole: 'admin' | 'member';
  members: Member[];
  expenses: Expense[];
  myUserId: string;
}


/* ─── AVATAR ───────────────────────────────────────────────── */
const Avatar = ({
  name, color, size = 36,
}: { name: string; color: string; size?: number }) => (
  <View style={[styles.avatar, {
    width: size, height: size, borderRadius: size / 2, backgroundColor: color,
  }]}>
    <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
      {name.charAt(0).toUpperCase()}
    </Text>
  </View>
);

/* ─── EXPENSE CARD ─────────────────────────────────────────── */
const ExpenseCard = ({
  expense, currency, onPress,
}: { expense: Expense; currency: string; onPress?: () => void }) => {
  const isOwed = expense.myShare > 0;
  const owes = expense.myShare < 0;
  const shareColor = isOwed ? COLORS.SUCCESS : owes ? COLORS.CRIMSON : COLORS.GRAY600;
  const shareLabel = isOwed ? 'you lent' : owes ? 'you owe' : 'settled';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.expenseCard}>
      <View style={styles.expenseEmoji}>
        <Text style={styles.expenseEmojiText}>{expense.emoji}</Text>
      </View>
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseDesc} numberOfLines={1}>{expense.description}</Text>
        <Text style={styles.expenseMeta}>
          <Text style={styles.expensePayer}>{expense.paidByName}</Text>
          {' paid · '}
          {expense.date}
        </Text>
      </View>
      <View style={styles.expenseAmount}>
        <Text style={styles.expenseTotal}>
          {fmt(expense.amount)} <Text style={styles.expenseCurrency}>{currency}</Text>
        </Text>
        <Text style={[styles.expenseShare, { color: shareColor }]}>
          {shareLabel} {sign(expense.myShare)}{fmt(expense.myShare)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

/* ─── MEMBER BALANCE ROW ───────────────────────────────────── */
const MemberRow = ({
  member, currency, isMe, isAdmin, onRemove,
}: { member: Member; currency: string; isMe: boolean; isAdmin: boolean; onRemove?: (memberId: string) => void }) => {
  const positive = member.balance > 0;
  const negative = member.balance < 0;
  const settled  = member.balance === 0;
  const color = positive ? COLORS.SUCCESS : negative ? COLORS.CRIMSON : COLORS.GRAY600;
  const label = settled ? 'Settled up' : positive ? 'Gets back' : 'Owes';

  return (
    <View style={styles.memberRow}>
      <Avatar name={member.name} color={member.avatarColor} size={40} />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>
          {isMe ? 'You' : member.name}
        </Text>
        <Text style={styles.memberLabel}>{label}</Text>
      </View>
      <View style={styles.memberBalance}>
        <Text style={[styles.memberAmount, { color }]}>
          {settled ? '—' : `${sign(member.balance)}${fmt(member.balance)}`}
        </Text>
        <Text style={styles.memberCurrency}>{currency}</Text>
      </View>
      {isAdmin && !isMe && (
        <TouchableOpacity
          onPress={() => onRemove?.(member.id)}
          style={styles.memberMenuBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="menu" size={18} color={COLORS.GRAY400} />
        </TouchableOpacity>
      )}
    </View>
  );
};

/* ─── PROPS ────────────────────────────────────────────────── */
interface GroupDetailScreenProps {
  groupId?: string;
  group?: GroupDetail;
  onBack?: () => void;
  onAddExpense?: (groupInfo: { groupId: string; groupName: string; groupCurrency: string; members: Member[]; myUserId: string }) => void;
  onSettleUp?: (info: { groupId: string; groupName: string; groupCurrency: string }) => void;
  onExpenseTap?: (expenseId: string) => void;
  onOpenSettings?: (info: { groupId: string; groupName: string; groupEmoji: string; groupCurrency: string; members: Member[]; myUserId: string }) => void;
}

/* ─── MAIN SCREEN ──────────────────────────────────────────── */
const GroupDetailScreen: React.FC<GroupDetailScreenProps> = ({
  groupId,
  group: groupProp,
  onBack,
  onAddExpense,
  onSettleUp,
  onExpenseTap,
  onOpenSettings,
}) => {
  const [tab, setTab] = useState<'expenses' | 'balances'>('expenses');
  const [group, setGroup] = useState<GroupDetail | null>(groupProp ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [_removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    apiService.getGroup(groupId)
      .then(({ data }) => {
        setGroup({
          id: data.id,
          name: data.name,
          emoji: data.emoji,
          currency: data.currency,
          myUserId: data.myUserId,
          myRole: data.myRole,
          members: data.members,
          expenses: data.expenses as any,
        });
      })
      .catch((err) => setError(err.message || 'Failed to load group'))
      .finally(() => setLoading(false));
  }, [groupId]);

  const myMember = useMemo(
    () => group?.members.find(m => m.id === group?.myUserId),
    [group]
  );
  const myBalance = myMember?.balance ?? 0;

  const handleLeaveGroup = () => {
    if (!group) return;

    Alert.alert(
      'Leave Group?',
      `You're about to leave "${group.name}". Make sure all your expenses are settled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Group',
          style: 'destructive',
          onPress: async () => {
            setIsLeavingGroup(true);
            try {
              await apiService.leaveGroup(group.id);
              Alert.alert('Success', 'You have left the group');
              onBack?.();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to leave group');
            } finally {
              setIsLeavingGroup(false);
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = (memberId: string) => {
    if (!group) return;

    const member = group.members.find(m => m.id === memberId);
    if (!member) return;

    Alert.alert(
      'Remove Member?',
      `You're about to remove "${member.name}" from "${group.name}". Make sure all their expenses are settled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemovingMemberId(memberId);
            try {
              await apiService.removeGroupMember(group.id, memberId);
              // Refresh group data
              const { data } = await apiService.getGroup(group.id);
              setGroup({
                id: data.id,
                name: data.name,
                emoji: data.emoji,
                currency: data.currency,
                myUserId: data.myUserId,
                myRole: data.myRole,
                members: data.members,
                expenses: data.expenses as any,
              });
              Alert.alert('Success', `${member.name} has been removed from the group`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove member');
            } finally {
              setRemovingMemberId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: COLORS.GRAY600, fontSize: 14 }}>Loading group…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: COLORS.CRIMSON, fontSize: 14, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
            <Text style={{ color: COLORS.BLUE, fontWeight: '700' }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: COLORS.GRAY600, fontSize: 14, textAlign: 'center' }}>No group selected</Text>
          <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
            <Text style={{ color: COLORS.BLUE, fontWeight: '700' }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BLUE_DARK} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── HEADER ─── */}
        <LinearGradient
          colors={[COLORS.BLUE_DARK, COLORS.BLUE]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Decorative blob */}
          <View style={styles.blob} />

          {/* Top row: back + settings + leave */}
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              style={styles.iconBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="back" size={18} color={COLORS.WHITE} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={handleLeaveGroup}
                disabled={isLeavingGroup}
                activeOpacity={0.7}
                style={styles.iconBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {isLeavingGroup ? (
                  <ActivityIndicator size={18} color={COLORS.WHITE} />
                ) : (
                  <Icon name="leave" size={18} color={COLORS.WHITE} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onOpenSettings?.({ groupId: group.id, groupName: group.name, groupEmoji: group.emoji, groupCurrency: group.currency, members: group.members, myUserId: group.myUserId })}
                activeOpacity={0.7}
                style={styles.iconBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="settings" size={18} color={COLORS.WHITE} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Group identity row */}
          <View style={styles.groupRow}>
            <Text style={styles.groupEmoji}>{group.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
              <Text style={styles.groupMeta}>
                {group.members.length} members · {group.currency}
              </Text>
            </View>
          </View>

          {/* Balance summary card */}
          <View style={styles.balanceCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.balanceLabel}>YOUR BALANCE</Text>
              <Text style={styles.balanceAmount}>
                {myBalance >= 0 ? '+' : '-'}{fmt(myBalance)}
                {'  '}
                <Text style={styles.balanceCurrency}>{group.currency}</Text>
              </Text>
              <Text style={styles.balanceDesc}>
                {myBalance > 0
                  ? 'Others owe you'
                  : myBalance < 0
                  ? 'You owe others'
                  : "You're all settled"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => onSettleUp?.({ groupId: group.id, groupName: group.name, groupCurrency: group.currency })}
              activeOpacity={0.85}
              style={styles.settleBtn}
            >
              <Icon name="check" size={14} color={COLORS.SUCCESS} />
              <Text style={styles.settleBtnText}>Settle up</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ─── TABS ─── */}
        <View style={styles.tabBar}>
          {(['expenses', 'balances'] as const).map(key => {
            const active = tab === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setTab(key)}
                activeOpacity={0.7}
                style={[styles.tabItem, active && styles.tabItemActive]}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {key === 'expenses' ? 'Expenses' : 'Balances'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── EXPENSES TAB ─── */}
        {tab === 'expenses' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionLabel}>RECENT EXPENSES</Text>

            {group.expenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Text style={styles.emptyDesc}>
                  Add the first expense to get this group going
                </Text>
                <TouchableOpacity activeOpacity={0.85} onPress={() => onAddExpense?.({ groupId: group.id, groupName: group.name, groupCurrency: group.currency, members: group.members, myUserId: group.myUserId })} style={{ marginTop: 16 }}>
                  <LinearGradient
                    colors={[COLORS.CRIMSON, COLORS.CRIMSON_DARK]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.emptyBtn}
                  >
                    <Text style={styles.emptyBtnText}>Add Expense</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              group.expenses.map(e => (
                <ExpenseCard
                  key={e.id}
                  expense={e}
                  currency={group.currency}
                  onPress={() => onExpenseTap?.(e.id)}
                />
              ))
            )}
          </View>
        )}

        {/* ─── BALANCES TAB ─── */}
        {tab === 'balances' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionLabel}>MEMBER BALANCES</Text>

            <View style={styles.balanceList}>
              {group.members.map(m => (
                <MemberRow
                  key={m.id}
                  member={m}
                  currency={group.currency}
                  isMe={m.id === group.myUserId}
                  isAdmin={group.myRole === 'admin'}
                  onRemove={handleRemoveMember}
                />
              ))}
            </View>

            {/* Big settle button at the bottom of balances tab */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onSettleUp?.({ groupId: group.id, groupName: group.name, groupCurrency: group.currency })}
              style={{ marginTop: 18 }}
            >
              <LinearGradient
                colors={[COLORS.SUCCESS, COLORS.SUCCESS_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.recordBtn}
              >
                <Icon name="check" size={16} color={COLORS.WHITE} />
                <Text style={styles.recordBtnText}>Record a settlement</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ─── FLOATING ADD EXPENSE BUTTON ─── */}
      <TouchableOpacity
        onPress={() => onAddExpense?.({ groupId: group.id, groupName: group.name, groupCurrency: group.currency, members: group.members, myUserId: group.myUserId })}
        activeOpacity={0.85}
        style={styles.fab}
      >
        <LinearGradient
          colors={[COLORS.CRIMSON, COLORS.CRIMSON_DARK]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabInner}
        >
          <Icon name="plus" size={26} color={COLORS.WHITE} />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

/* ─── STYLES ───────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.GHOST },
  scroll: { flex: 1 },

  /* HEADER */
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    top: -40, right: -40,
    width: 160, height: 160,
    borderRadius: 9999,
    backgroundColor: 'rgba(220,20,60,0.15)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBtn: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* GROUP ROW */
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  groupEmoji: {
    fontSize: 38,
  },
  groupName: {
    color: COLORS.WHITE,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  groupMeta: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 12,
    marginTop: 2,
  },

  /* BALANCE CARD */
  balanceCard: {
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceAmount: {
    color: COLORS.WHITE,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  balanceCurrency: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 13,
    fontWeight: '600',
  },
  balanceDesc: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    marginTop: 3,
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.WHITE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  settleBtnText: {
    color: COLORS.BLUE_DARK,
    fontSize: 12,
    fontWeight: '700',
  },

  /* AVATAR */
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.WHITE,
    fontWeight: '700',
  },

  /* TAB BAR */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY200,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: COLORS.CRIMSON,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.GRAY600,
  },
  tabLabelActive: {
    color: COLORS.CRIMSON,
  },

  /* TAB CONTENT */
  tabContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.GRAY600,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  /* EXPENSE CARD */
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#0F2640',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  expenseEmoji: {
    width: 44, height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.GHOST,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseEmojiText: {
    fontSize: 22,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDesc: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.GRAY800,
    marginBottom: 3,
  },
  expenseMeta: {
    fontSize: 11,
    color: COLORS.GRAY600,
  },
  expensePayer: {
    fontWeight: '700',
    color: COLORS.GRAY800,
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  expenseTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.GRAY800,
    letterSpacing: -0.2,
  },
  expenseCurrency: {
    fontSize: 9,
    color: COLORS.GRAY400,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  expenseShare: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  /* MEMBER BALANCE */
  balanceList: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    padding: 4,
    shadowColor: '#0F2640',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY100,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.GRAY800,
    marginBottom: 2,
  },
  memberLabel: {
    fontSize: 11,
    color: COLORS.GRAY600,
  },
  memberBalance: {
    alignItems: 'flex-end',
  },
  memberAmount: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  memberCurrency: {
    fontSize: 9,
    color: COLORS.GRAY400,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  memberMenuBtn: {
    marginLeft: 8,
    padding: 8,
  },

  /* RECORD SETTLEMENT BUTTON */
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: COLORS.SUCCESS,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  recordBtnText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* EMPTY STATE */
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 30,
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.GRAY800,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.GRAY600,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* FAB */
  fab: {
    position: 'absolute',
    bottom: 26,
    right: 22,
    width: 58, height: 58,
    borderRadius: 29,
    shadowColor: COLORS.CRIMSON,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  fabInner: {
    flex: 1,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GroupDetailScreen;
