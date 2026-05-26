/**
 * VaagBanda — HomeScreen.tsx
 * React Native main hub after login — groups list, overall balance, quick actions
 *
 * Project: VaagBanda · Smart Mobile Expense-Splitting Application
 * Team: CyberSquadNp · Dongshin University
 *
 * Maps to:
 *   • SRS §3.1: tab-based navigation (Home, Groups, Activity, Profile)
 *   • SRS §4.4: overall balance summary across all groups
 *   • SRS §4.2: group management (create, list, navigate to detail)
 *   • AuthDB.Users, SharedExpenseDB.Groups, GroupMembers, Expenses, Splits, Settlements
 *
 * ─── Required dependencies ───
 *   npx expo install expo-linear-gradient react-native-svg
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';

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
};

/* ─── ICONS ────────────────────────────────────────────────── */
type IconName =
  | 'home' | 'groups' | 'activity' | 'profile'
  | 'plus' | 'scan' | 'addGroup' | 'bell' | 'chevron';

const Icon = ({
  name, size = 22, color = COLORS.GRAY400,
}: { name: IconName; size?: number; color?: string }) => {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth: 2,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'home':
      return (
        <Svg {...props}>
          <Path d="M3 12l9-9 9 9M5 10v10h14V10" />
        </Svg>
      );
    case 'groups':
      return (
        <Svg {...props}>
          <Path d="M17 21v-2a4 4 0 00-3-3.87" />
          <Path d="M9 7a4 4 0 100 8 4 4 0 000-8z" />
          <Path d="M1 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" />
          <Path d="M16 3.13a4 4 0 010 7.75" />
        </Svg>
      );
    case 'activity':
      return (
        <Svg {...props}>
          <Polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </Svg>
      );
    case 'profile':
      return (
        <Svg {...props}>
          <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <Circle cx="12" cy="7" r="4" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...props}>
          <Line x1="12" y1="5" x2="12" y2="19" />
          <Line x1="5" y1="12" x2="19" y2="12" />
        </Svg>
      );
    case 'scan':
      return (
        <Svg {...props}>
          <Path d="M3 7V5a2 2 0 012-2h2" />
          <Path d="M17 3h2a2 2 0 012 2v2" />
          <Path d="M21 17v2a2 2 0 01-2 2h-2" />
          <Path d="M7 21H5a2 2 0 01-2-2v-2" />
          <Line x1="3" y1="12" x2="21" y2="12" />
        </Svg>
      );
    case 'addGroup':
      return (
        <Svg {...props}>
          <Path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <Circle cx="8.5" cy="7" r="4" />
          <Line x1="20" y1="8" x2="20" y2="14" />
          <Line x1="23" y1="11" x2="17" y2="11" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg {...props}>
          <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <Path d="M13.73 21a2 2 0 01-3.46 0" />
        </Svg>
      );
    case 'chevron':
      return (
        <Svg {...props}>
          <Polyline points="9 18 15 12 9 6" />
        </Svg>
      );
    default: return null;
  }
};

/* ─── HELPERS ──────────────────────────────────────────────── */
const fmt = (n: number) => Math.abs(n).toLocaleString('en-US', {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});

/* ─── DOMAIN TYPES (mirror class diagram + AuthDB/SharedExpenseDB) ─── */
interface User {
  id: string;
  name: string;
  avatarColor: string;
}

interface Group {
  id: string;
  name: string;
  emoji: string;
  currency: string;
  memberCount: number;
  lastActivity: string;
  myBalance: number; // derived from SUM(Splits.amount_owed) - SUM(Settlements.amount)
}

/* ─── MOCK DATA (replace with API/store wiring later) ─── */
const ME: User = { id: 'u1', name: 'Asim', avatarColor: COLORS.CRIMSON };

const MOCK_GROUPS: Group[] = [
  { id: 'g1', name: 'Pokhara Trip',     emoji: '🏔️', currency: 'NPR', memberCount: 5, lastActivity: '2 hours ago',  myBalance:  2_450 },
  { id: 'g2', name: 'Apartment 304',    emoji: '🏠', currency: 'NPR', memberCount: 3, lastActivity: 'Yesterday',    myBalance:   -890 },
  { id: 'g3', name: 'Friday Pizza Club', emoji: '🍕', currency: 'NPR', memberCount: 6, lastActivity: '3 days ago',  myBalance:    520 },
  { id: 'g4', name: 'Seoul Vacation',   emoji: '✈️', currency: 'KRW', memberCount: 4, lastActivity: 'Last week',    myBalance:      0 },
];

/* ─── AVATAR ───────────────────────────────────────────────── */
const Avatar = ({ user, size = 42 }: { user: User; size?: number }) => (
  <View style={[styles.avatar, {
    width: size, height: size, borderRadius: size / 2,
    backgroundColor: user.avatarColor,
  }]}>
    <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
      {user.name.charAt(0).toUpperCase()}
    </Text>
  </View>
);

/* ─── PROPS ────────────────────────────────────────────────── */
interface HomeScreenProps {
  user?: User;
  groups?: Group[];
  onGroupTap?: (groupId: string) => void;
  onAddExpense?: () => void;
  onScanReceipt?: () => void;
  onCreateGroup?: () => void;
  onOpenNotifications?: () => void;
  onTabChange?: (tab: 'home' | 'groups' | 'activity' | 'profile') => void;
  activeTab?: 'home' | 'groups' | 'activity' | 'profile';
  hasUnreadNotifications?: boolean;
}

/* ─── QUICK ACTION CARD ────────────────────────────────────── */
const QuickAction = ({
  icon, label, color, onPress,
}: {
  icon: IconName; label: string; color: string; onPress?: () => void;
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.quickAction}>
    <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
      <Icon name={icon} size={22} color={color} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

/* ─── GROUP CARD ───────────────────────────────────────────── */
const GroupCard = ({ group, onPress }: { group: Group; onPress?: () => void }) => {
  const isOwed = group.myBalance > 0;
  const owes = group.myBalance < 0;
  const settled = group.myBalance === 0;
  const balanceColor = isOwed ? COLORS.SUCCESS : owes ? COLORS.CRIMSON : COLORS.GRAY600;
  const balanceLabel = settled ? 'Settled up' : isOwed ? 'You are owed' : 'You owe';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.groupCard}>
      <View style={styles.groupEmojiWrap}>
        <Text style={styles.groupEmoji}>{group.emoji}</Text>
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
        <Text style={styles.groupMeta}>
          {group.memberCount} members · {group.lastActivity}
        </Text>
      </View>
      <View style={styles.groupBalance}>
        <Text style={styles.groupBalanceLabel}>{balanceLabel}</Text>
        <Text style={[styles.groupBalanceAmount, { color: balanceColor }]}>
          {settled ? '—' : `${isOwed ? '+' : '-'}${fmt(group.myBalance)}`}
        </Text>
        <Text style={styles.groupBalanceCurrency}>{group.currency}</Text>
      </View>
    </TouchableOpacity>
  );
};

/* ─── TAB BAR ──────────────────────────────────────────────── */
const TabBar = ({
  active = 'home',
  onTabChange,
  hasUnread = false,
}: {
  active?: 'home' | 'groups' | 'activity' | 'profile';
  onTabChange?: (tab: 'home' | 'groups' | 'activity' | 'profile') => void;
  hasUnread?: boolean;
}) => {
  const tabs: { key: 'home' | 'groups' | 'activity' | 'profile'; label: string; icon: IconName }[] = [
    { key: 'home',     label: 'Home',     icon: 'home' },
    { key: 'groups',   label: 'Groups',   icon: 'groups' },
    { key: 'activity', label: 'Activity', icon: 'activity' },
    { key: 'profile',  label: 'Profile',  icon: 'profile' },
  ];
  return (
    <View style={styles.tabBar}>
      {tabs.map(t => {
        const isActive = active === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => onTabChange?.(t.key)}
            activeOpacity={0.7}
            style={styles.tabItem}
          >
            <View style={styles.tabIconWrap}>
              <Icon
                name={t.icon}
                size={22}
                color={isActive ? COLORS.CRIMSON : COLORS.GRAY400}
              />
              {t.key === 'activity' && hasUnread && <View style={styles.tabDot} />}
            </View>
            <Text style={[
              styles.tabLabel,
              { color: isActive ? COLORS.CRIMSON : COLORS.GRAY400, fontWeight: isActive ? '700' : '500' },
            ]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

/* ─── MAIN SCREEN ──────────────────────────────────────────── */
const HomeScreen: React.FC<HomeScreenProps> = ({
  user = ME,
  groups = MOCK_GROUPS,
  onGroupTap,
  onAddExpense,
  onScanReceipt,
  onCreateGroup,
  onOpenNotifications,
  onTabChange,
  activeTab = 'home',
  hasUnreadNotifications = true,
}) => {
  const { signOut, user: authUser } = useAuth();
  
  const displayUser = useMemo(() => {
    return {
      id: authUser?.id || user.id,
      name: authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || user.name,
      email: authUser?.email || '',
      avatarColor: user.avatarColor,
    };
  }, [authUser, user]);

  // Compute overall balance (sum across all groups)
  // Note: in production, you'd convert each group to a common currency first.
  // For now this is a simple sum, assuming a single base currency.
  const overallBalance = useMemo(
    () => groups.reduce((acc, g) => acc + g.myBalance, 0),
    [groups]
  );

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const renderContent = () => {
    if (activeTab === 'profile') {
      return (
        <View style={[styles.section, { marginTop: 24 }]}>
          {/* Profile Details Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Avatar user={displayUser} size={80} />
              <Text style={styles.profileName}>{displayUser.name}</Text>
              <Text style={styles.profileEmail}>{displayUser.email}</Text>
            </View>
            
            <View style={styles.profileDivider} />
            
            <View style={styles.profileDetailsRow}>
              <Text style={styles.profileDetailsLabel}>Account ID</Text>
              <Text style={styles.profileDetailsValue} numberOfLines={1}>
                {displayUser.id}
              </Text>
            </View>
          </View>

          {/* Sign Out Action Button */}
          <TouchableOpacity activeOpacity={0.85} onPress={signOut} style={{ marginTop: 24 }}>
            <LinearGradient
              colors={[COLORS.CRIMSON, COLORS.CRIMSON_DARK]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.signOutBtn}
            >
              <Text style={styles.signOutBtnText}>Sign Out</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        {/* ─── HEADER ─── */}
        <LinearGradient
          colors={[COLORS.BLUE_DARK, COLORS.BLUE, COLORS.BLUE_MID]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Decorative blobs */}
          <View style={[styles.blob, styles.blob1]} />
          <View style={[styles.blob, styles.blob2]} />

          {/* Top row: greeting + bell icon */}
          <View style={styles.topRow}>
            <View style={styles.greetingRow}>
              <Avatar user={displayUser} size={42} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.greetingLabel}>{getGreeting()}</Text>
                <Text style={styles.greetingName}>{displayUser.name}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onOpenNotifications}
              activeOpacity={0.7}
              style={styles.bellBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="bell" size={20} color={COLORS.WHITE} />
              {hasUnreadNotifications && <View style={styles.bellDot} />}
            </TouchableOpacity>
          </View>

          {/* Overall balance card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>OVERALL BALANCE</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>
                {overallBalance >= 0 ? '+' : '-'}{fmt(overallBalance)}
              </Text>
              <Text style={styles.balanceCurrency}>NPR</Text>
            </View>
            <Text style={styles.balanceDesc}>
              {overallBalance > 0
                ? "You're owed across your groups"
                : overallBalance < 0
                ? 'You owe across your groups'
                : "You're all settled up"}
            </Text>
          </View>
        </LinearGradient>

        {/* ─── QUICK ACTIONS ─── */}
        <View style={styles.quickActionsRow}>
          <QuickAction icon="plus"     label="Add Expense"  color={COLORS.CRIMSON} onPress={onAddExpense} />
          <QuickAction icon="scan"     label="Scan Receipt" color={COLORS.BLUE}    onPress={onScanReceipt} />
          <QuickAction icon="addGroup" label="New Group"    color={COLORS.CRIMSON_DARK} onPress={onCreateGroup} />
        </View>

        {/* ─── GROUPS SECTION ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Groups</Text>
            <TouchableOpacity onPress={() => onTabChange?.('groups')} activeOpacity={0.6}>
              <Text style={styles.sectionAction}>See all</Text>
            </TouchableOpacity>
          </View>

          {groups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptyDesc}>
                Create your first group to start tracking shared expenses
              </Text>
              <TouchableOpacity activeOpacity={0.85} onPress={onCreateGroup} style={{ marginTop: 16 }}>
                <LinearGradient
                  colors={[COLORS.CRIMSON, COLORS.CRIMSON_DARK]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyBtn}
                >
                  <Text style={styles.emptyBtnText}>Create Group</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            groups.map(g => (
              <GroupCard key={g.id} group={g} onPress={() => onGroupTap?.(g.id)} />
            ))
          )}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BLUE_DARK} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {renderContent()}
      </ScrollView>

      {/* ─── FLOATING ADD BUTTON ─── */}
      {activeTab !== 'profile' && (
        <TouchableOpacity
          onPress={onAddExpense}
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
      )}

      {/* ─── BOTTOM TAB BAR ─── */}
      <TabBar
        active={activeTab}
        onTabChange={onTabChange}
        hasUnread={hasUnreadNotifications}
      />
    </SafeAreaView>
  );
};

/* ─── STYLES ───────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.GHOST,
  },
  scroll: {
    flex: 1,
  },

  /* HEADER */
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  blob1: {
    top: -30, right: -30, width: 120, height: 120,
    backgroundColor: 'rgba(220,20,60,0.18)',
  },
  blob2: {
    bottom: -20, left: -20, width: 80, height: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  /* TOP ROW */
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingLabel: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  greetingName: {
    color: COLORS.WHITE,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.CRIMSON,
    borderWidth: 2,
    borderColor: COLORS.BLUE_DARK,
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

  /* BALANCE CARD */
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 6,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  balanceAmount: {
    color: COLORS.WHITE,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  balanceCurrency: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceDesc: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 12,
    marginTop: 4,
  },

  /* QUICK ACTIONS */
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 10,
    marginTop: -14, // overlap into the header for a "card lift" effect
  },
  quickAction: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#0F2640',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.GRAY800,
  },

  /* SECTIONS */
  section: {
    paddingHorizontal: 20,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.GRAY800,
    letterSpacing: -0.3,
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.CRIMSON,
  },

  /* GROUP CARD */
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#0F2640',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  groupEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.GHOST,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupEmoji: {
    fontSize: 24,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.GRAY800,
    marginBottom: 3,
  },
  groupMeta: {
    fontSize: 11,
    color: COLORS.GRAY400,
    fontWeight: '500',
  },
  groupBalance: {
    alignItems: 'flex-end',
  },
  groupBalanceLabel: {
    fontSize: 10,
    color: COLORS.GRAY400,
    fontWeight: '600',
    marginBottom: 2,
  },
  groupBalanceAmount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  groupBalanceCurrency: {
    fontSize: 9,
    color: COLORS.GRAY400,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 1,
  },

  /* EMPTY STATE */
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 30,
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    marginTop: 8,
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
    bottom: 88,
    right: 22,
    width: 58,
    height: 58,
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

  /* TAB BAR */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY100,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 8,
    shadowColor: '#0F2640',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabIconWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  tabDot: {
    position: 'absolute',
    top: -3,
    right: -5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.CRIMSON,
    borderWidth: 2,
    borderColor: COLORS.WHITE,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.3,
  },

  /* PROFILE VIEW STYLES */
  profileCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0F2640',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.GRAY800,
    marginTop: 12,
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.GRAY600,
    marginTop: 4,
  },
  profileDivider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.GRAY100,
    marginVertical: 16,
  },
  profileDetailsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileDetailsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.GRAY600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileDetailsValue: {
    fontSize: 12,
    color: COLORS.GRAY400,
    maxWidth: '60%',
  },
  signOutBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: COLORS.CRIMSON,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  signOutBtnText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default HomeScreen;