
import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { authService } from './src/services/authService';
import { apiService } from './src/services/apiService';

// Auth screens
import SplashScreen from './src/screens/auth/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import VerifyEmailScreen from './src/screens/auth/VerifyEmailScreen';

// Main screens
import HomeScreen from './src/screens/home/HomeScreen';
import GroupDetailScreen from './src/screens/groups/GroupDetailScreen';
import CreateGroupScreen from './src/screens/groups/CreateGroupScreen';
import SelectGroupScreen from './src/screens/groups/SelectGroupScreen';
import GroupSettingsScreen from './src/screens/groups/GroupSettingsScreen';
import MemberHistoryScreen from './src/screens/groups/MemberHistoryScreen';

// Expense screens
import AddExpenseScreen from './src/screens/expenses/AddExpenseScreen';
import ExpenseDetailScreen from './src/screens/expenses/ExpenseDetailScreen';
import EditExpenseScreen from './src/screens/expenses/EditExpenseScreen';
import ScanReceiptScreen from './src/screens/expenses/ScanReceiptScreen';

// Settlement
import SettleUpScreen from './src/screens/expenses/SettleUpScreen';

// Tab screens (rendered inside HomeScreen)
import ActivityScreen from './src/screens/tabs/ActivityScreen';
import ProfileScreen from './src/screens/tabs/ProfileScreen';

// Settings & Profile
import NotificationSettingsScreen from './src/screens/settings/NotificationSettingsScreen';
import SecurityPrivacyScreen from './src/screens/settings/SecurityPrivacyScreen';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';

// Analytics
import AnalyticsScreen from './src/screens/analytics/AnalyticsScreen';
import ExportScreen from './src/screens/analytics/ExportScreen';

/* ─── ROUTE TYPES ──────────────────────────────────────────── */
type Screen =
  | 'splash'
  | 'login'
  | 'signup'
  | 'verify-email'
  | 'forgot'
  | 'home'
  | 'create-group'
  | 'group'
  | 'group-settings'
  | 'member-history'
  | 'select-group'
  | 'add-expense'
  | 'expense-detail'
  | 'edit-expense'
  | 'settle-up'
  | 'scan-receipt'
  | 'notification-settings'
  | 'security-privacy'
  | 'edit-profile'
  | 'analytics'
  | 'export';

type Tab = 'home' | 'groups' | 'activity' | 'profile';

interface GroupContext {
  groupId: string;
  groupName: string;
  groupEmoji?: string;
  groupCurrency: string;
  members: Array<{ id: string; name: string; avatarColor: string; balance: number }>;
  myUserId: string;
}

/* ─── INNER NAVIGATOR ──────────────────────────────────────── */
function AppNavigator() {
  const { user, loading, signOut } = useAuth();
  const [screen, setScreen] = useState<Screen>('splash');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeExpenseId, setActiveExpenseId] = useState<string | null>(null);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [activeMemberName, setActiveMemberName] = useState<string>('');
  const [activeMemberColor, setActiveMemberColor] = useState<string>('#1A2B5F');
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState<string>('');
  const [groupContext, setGroupContext] = useState<GroupContext | null>(null);
  const [addExpenseSource, setAddExpenseSource] = useState<'group' | 'select-group'>('group');
  const [refreshKey, setRefreshKey] = useState(0);

  // Once Supabase finishes loading the session, go to the right screen
  useEffect(() => {
    if (!loading) {
      if (user) {
        setScreen('home');
      } else {
        setScreen('login');
      }
    }
  }, [user, loading]);

  /* ─── SPLASH shown while auth loads ─── */
  if (screen === 'splash' || loading) {
    return <SplashScreen onDone={() => {}} />;
  }

  /* ─── AUTH SCREENS ─── */

  if (screen === 'signup') {
    return (
      <SignupScreen
        onGoToLogin={() => setScreen('login')}
        onSignup={async (data) => {
          const { needsVerification } = await authService.signUp(
            data.email,
            data.password,
            data.name,
          );
          if (needsVerification) {
            setPendingVerifyEmail(data.email);
            setScreen('verify-email');
          }
          // If needsVerification is false, useEffect above detects session and goes to 'home'
        }}
        onGoogleSignup={() => console.log('google signup')}
        onAppleSignup={() => console.log('apple signup')}
        onOpenTerms={() => console.log('terms')}
        onOpenPrivacy={() => console.log('privacy')}
      />
    );
  }

  if (screen === 'verify-email') {
    return (
      <VerifyEmailScreen
        email={pendingVerifyEmail}
        onGoToLogin={() => setScreen('login')}
        onResend={async () => {
          await authService.resendVerification(pendingVerifyEmail);
        }}
      />
    );
  }

  if (screen === 'forgot') {
    return (
      <ForgotPasswordScreen
        onGoToLogin={() => setScreen('login')}
        onSubmit={async (email) => {
          await authService.resetPassword(email);
        }}
      />
    );
  }

  /* ─── EXPENSE SCREENS ─── */

  if (screen === 'select-group') {
    return (
      <SelectGroupScreen
        onBack={() => setScreen('home')}
        onSelect={(info) => {
          setGroupContext(info);
          setAddExpenseSource('select-group');
          setScreen('add-expense');
        }}
      />
    );
  }

  if (screen === 'add-expense') {
    return (
      <AddExpenseScreen
        groupName={groupContext?.groupName ?? ''}
        groupCurrency={groupContext?.groupCurrency ?? 'NPR'}
        members={groupContext?.members ?? []}
        myUserId={groupContext?.myUserId ?? ''}
        onBack={() => setScreen(addExpenseSource === 'select-group' ? 'select-group' : 'group')}
        onSave={async (expense) => {
          if (!groupContext) return;
          try {
            await apiService.addExpense(groupContext.groupId, expense);
          } catch (err: any) {
            console.error('Failed to save expense:', err.message);
          }
          setScreen(addExpenseSource === 'select-group' ? 'home' : 'group');
        }}
      />
    );
  }

  if (screen === 'expense-detail') {
    return (
      <ExpenseDetailScreen
        expenseId={activeExpenseId ?? ''}
        onBack={() => setScreen('group')}
        onEdit={(id) => {
          setActiveExpenseId(id);
          setScreen('edit-expense');
        }}
        onDelete={() => setScreen('group')}
      />
    );
  }

  if (screen === 'edit-expense') {
    return (
      <EditExpenseScreen
        expenseId={activeExpenseId ?? ''}
        groupCurrency={groupContext?.groupCurrency ?? 'NPR'}
        members={groupContext?.members ?? []}
        myUserId={groupContext?.myUserId ?? ''}
        onBack={() => setScreen('expense-detail')}
        onSave={() => setScreen('group')}
      />
    );
  }

  if (screen === 'scan-receipt') {
    return (
      <ScanReceiptScreen
        onBack={() => setScreen('home')}
        onCapture={(uri) => {
          console.log('Receipt captured:', uri);
          setScreen('add-expense');
        }}
        onManualEntry={() => setScreen('add-expense')}
      />
    );
  }

  /* ─── SETTLEMENT ─── */

  if (screen === 'settle-up') {
    return (
      <SettleUpScreen
        groupId={groupContext?.groupId ?? activeGroupId ?? ''}
        groupName={groupContext?.groupName ?? ''}
        groupCurrency={groupContext?.groupCurrency ?? 'NPR'}
        onBack={() => setScreen('group')}
        onSettle={async (settlement) => {
          const gid = groupContext?.groupId ?? activeGroupId;
          if (!gid) return;
          try {
            await apiService.recordSettlement(gid, settlement);
          } catch (err: any) {
            console.error('Failed to record settlement:', err.message);
          }
          setScreen('group');
        }}
      />
    );
  }

  /* ─── GROUP SCREENS ─── */

  if (screen === 'create-group') {
    return (
      <CreateGroupScreen
        onBack={() => setScreen('home')}
        onCreate={async (group) => {
          try {
            await apiService.createGroup({
              name: group.name,
              emoji: group.emoji,
              currency: group.currency,
              memberIds: group.memberIds,
            });
          } catch (err: any) {
            console.error('Failed to create group:', err.message);
          }
          setRefreshKey(k => k + 1);
          setScreen('home');
        }}
      />
    );
  }

  if (screen === 'group-settings') {
    return (
      <GroupSettingsScreen
        groupId={groupContext?.groupId ?? activeGroupId ?? ''}
        groupName={groupContext?.groupName ?? ''}
        groupEmoji={groupContext?.groupEmoji ?? '👥'}
        groupCurrency={groupContext?.groupCurrency ?? 'NPR'}
        members={(groupContext?.members ?? []).map(m => ({ ...m, role: (m.id === groupContext?.myUserId ? 'admin' : 'member') as 'admin' | 'member' }))}
        myUserId={groupContext?.myUserId ?? ''}
        onBack={() => setScreen('group')}
        onSave={() => setScreen('group')}
        onInviteMember={() => {}}
        onRemoveMember={() => {}}
        onPromoteMember={() => {}}
        onDeleteGroup={() => {
          setRefreshKey(k => k + 1);
          setScreen('home');
        }}
      />
    );
  }

  if (screen === 'member-history') {
    return (
      <MemberHistoryScreen
        groupId={groupContext?.groupId ?? activeGroupId ?? ''}
        memberId={activeMemberId ?? ''}
        memberName={activeMemberName}
        memberColor={activeMemberColor}
        currency={groupContext?.groupCurrency ?? 'NPR'}
        onBack={() => setScreen('group')}
      />
    );
  }

  if (screen === 'group') {
    return (
      <GroupDetailScreen
        groupId={activeGroupId ?? undefined}
        onBack={() => setScreen('home')}
        onAddExpense={(info) => {
          setGroupContext(info);
          setAddExpenseSource('group');
          setScreen('add-expense');
        }}
        onSettleUp={(info) => {
          setGroupContext(prev => prev
            ? { ...prev, ...info }
            : { ...info, members: [], myUserId: '' }
          );
          setScreen('settle-up');
        }}
        onExpenseTap={(id) => {
          setActiveExpenseId(id);
          setScreen('expense-detail');
        }}
        onOpenSettings={(info) => {
          setGroupContext({
            groupId: info.groupId,
            groupName: info.groupName,
            groupEmoji: info.groupEmoji,
            groupCurrency: info.groupCurrency,
            members: info.members,
            myUserId: info.myUserId,
          });
          setScreen('group-settings');
        }}
      />
    );
  }

  /* ─── ANALYTICS ─── */

  if (screen === 'analytics') {
    return (
      <AnalyticsScreen
        groupId={groupContext?.groupId ?? activeGroupId ?? ''}
        groupName={groupContext?.groupName ?? ''}
        onBack={() => setScreen('group')}
        onExport={() => setScreen('export')}
      />
    );
  }

  if (screen === 'export') {
    return (
      <ExportScreen
        groupName={groupContext?.groupName ?? ''}
        onBack={() => setScreen('analytics')}
        onExport={(format, scope) => {
          console.log('Export:', format, scope);
        }}
      />
    );
  }

  /* ─── SETTINGS & PROFILE ─── */

  if (screen === 'notification-settings') {
    return (
      <NotificationSettingsScreen
        onBack={() => setScreen('home')}
        onSave={(prefs) => console.log('Notification prefs:', prefs)}
      />
    );
  }

  if (screen === 'security-privacy') {
    return (
      <SecurityPrivacyScreen
        onBack={() => setScreen('home')}
      />
    );
  }

  if (screen === 'edit-profile') {
    return (
      <EditProfileScreen
        onBack={() => setScreen('home')}
        onSave={(data) => {
          console.log('Profile updated:', data);
          setScreen('home');
        }}
      />
    );
  }

  /* ─── HOME (with tab handling) ─── */

  if (screen === 'home') {
    return (
      <HomeScreen
        activeTab={activeTab}
        onTabChange={setActiveTab}
        refreshKey={refreshKey}
        onGroupTap={(id) => {
          setActiveGroupId(id);
          setScreen('group');
        }}
        onAddExpense={() => {
          setGroupContext(null);
          setScreen('select-group');
        }}
        onScanReceipt={() => setScreen('scan-receipt')}
        onCreateGroup={() => setScreen('create-group')}
        onOpenNotifications={() => setActiveTab('activity')}
        onEditProfile={() => setScreen('edit-profile')}
        onNotificationSettings={() => setScreen('notification-settings')}
        onSecurityPrivacy={() => setScreen('security-privacy')}
        onLogout={async () => {
          await signOut();
          // useEffect above detects user → null and goes to 'login'
        }}
      />
    );
  }

  /* ─── LOGIN (default fallback) ─── */
  return (
    <LoginScreen
      onLogin={() => {
        // Navigation handled automatically by useEffect when session is detected
      }}
      onGoToSignup={() => setScreen('signup')}
      onForgotPassword={() => setScreen('forgot')}
      onBiometricLogin={() => console.log('biometric — not implemented')}
      onGoogleLogin={() => console.log('google login — not implemented')}
      onAppleLogin={() => console.log('apple login — not implemented')}
    />
  );
}

/* ─── ROOT ─────────────────────────────────────────────────── */
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}