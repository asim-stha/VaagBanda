
import React, { useState } from 'react';

// Auth screens
import SplashScreen from './src/screens/auth/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';

// Main screens
import HomeScreen from './src/screens/home/HomeScreen';
import GroupDetailScreen from './src/screens/groups/GroupDetailScreen';
import CreateGroupScreen from './src/screens/groups/CreateGroupScreen';
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
import EditProfileScreen from './src/screens/profile/EditProfileScreen';

// Analytics
import AnalyticsScreen from './src/screens/analytics/AnalyticsScreen';
import ExportScreen from './src/screens/analytics/ExportScreen';

/* ─── ROUTE TYPES ──────────────────────────────────────────── */
type Screen =
  | 'splash'
  | 'login'
  | 'signup'
  | 'forgot'
  | 'home'
  | 'create-group'
  | 'group'
  | 'group-settings'
  | 'member-history'
  | 'add-expense'
  | 'expense-detail'
  | 'edit-expense'
  | 'settle-up'
  | 'scan-receipt'
  | 'notification-settings'
  | 'edit-profile'
  | 'analytics'
  | 'export';

type Tab = 'home' | 'groups' | 'activity' | 'profile';

/* ─── MAIN APP ─────────────────────────────────────────────── */
export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeExpenseId, setActiveExpenseId] = useState<string | null>(null);

  /* ─── AUTH SCREENS ─── */

  if (screen === 'splash') {
    return <SplashScreen onDone={() => setScreen('login')} />;
  }

  if (screen === 'signup') {
    return (
      <SignupScreen
        onGoToLogin={() => setScreen('login')}
        onSignup={(data) => {
          console.log('Signup:', data);
          setScreen('home');
        }}
        onGoogleSignup={() => console.log('google signup')}
        onAppleSignup={() => console.log('apple signup')}
        onOpenTerms={() => console.log('terms')}
        onOpenPrivacy={() => console.log('privacy')}
      />
    );
  }

  if (screen === 'forgot') {
    return (
      <ForgotPasswordScreen
        onGoToLogin={() => setScreen('login')}
        onSubmit={async (email) => {
          console.log('Reset for:', email);
          await new Promise(r => setTimeout(r, 800));
        }}
      />
    );
  }

  /* ─── EXPENSE SCREENS ─── */

  if (screen === 'add-expense') {
    return (
      <AddExpenseScreen
        groupName="Pokhara Trip"
        groupCurrency="NPR"
        onBack={() => setScreen('group')}
        onSave={(expense) => {
          console.log('Expense saved:', expense);
          setScreen('group');
        }}
      />
    );
  }

  if (screen === 'expense-detail') {
    return (
      <ExpenseDetailScreen
        onBack={() => setScreen('group')}
        onEdit={(id) => {
          setActiveExpenseId(id);
          setScreen('edit-expense');
        }}
        onDelete={(id) => {
          console.log('Deleted expense:', id);
          setScreen('group');
        }}
      />
    );
  }

  if (screen === 'edit-expense') {
    return (
      <EditExpenseScreen
        expenseId={activeExpenseId ?? 'e1'}
        onBack={() => setScreen('expense-detail')}
        onSave={(data) => {
          console.log('Expense updated:', data);
          setScreen('group');
        }}
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
        groupName="Pokhara Trip"
        groupCurrency="NPR"
        onBack={() => setScreen('group')}
        onSettle={(settlement) => {
          console.log('Settlement:', settlement);
        }}
      />
    );
  }

  /* ─── GROUP SCREENS ─── */

  if (screen === 'create-group') {
    return (
      <CreateGroupScreen
        onBack={() => setScreen('home')}
        onCreate={(group) => {
          console.log('Group created:', group);
          setScreen('home');
        }}
      />
    );
  }

  if (screen === 'group-settings') {
    return (
      <GroupSettingsScreen
        onBack={() => setScreen('group')}
        onSave={(data) => {
          console.log('Group settings saved:', data);
          setScreen('group');
        }}
        onInviteMember={() => console.log('invite member')}
        onRemoveMember={(id) => console.log('remove member:', id)}
        onPromoteMember={(id) => console.log('promote member:', id)}
        onDeleteGroup={() => {
          console.log('group deleted');
          setScreen('home');
        }}
      />
    );
  }

  if (screen === 'member-history') {
    return (
      <MemberHistoryScreen
        onBack={() => setScreen('group')}
      />
    );
  }

  if (screen === 'group') {
    return (
      <GroupDetailScreen
        onBack={() => setScreen('home')}
        onAddExpense={() => setScreen('add-expense')}
        onSettleUp={() => setScreen('settle-up')}
        onExpenseTap={(id) => {
          setActiveExpenseId(id);
          setScreen('expense-detail');
        }}
        onOpenSettings={() => setScreen('group-settings')}
      />
    );
  }

  /* ─── ANALYTICS ─── */

  if (screen === 'analytics') {
    return (
      <AnalyticsScreen
        onBack={() => setScreen('group')}
        onExport={() => setScreen('export')}
      />
    );
  }

  if (screen === 'export') {
    return (
      <ExportScreen
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
        onGroupTap={(id) => {
          setActiveGroupId(id);
          setScreen('group');
        }}
        onAddExpense={() => setScreen('add-expense')}
        onScanReceipt={() => setScreen('scan-receipt')}
        onCreateGroup={() => setScreen('create-group')}
        onOpenNotifications={() => setActiveTab('activity')}
      />
    );
  }

  /* ─── LOGIN (default) ─── */
  return (
    <LoginScreen
      onLogin={() => {
        console.log('login');
        setScreen('home');
      }}
      onGoToSignup={() => setScreen('signup')}
      onForgotPassword={() => setScreen('forgot')}
      onBiometricLogin={() => {
        console.log('biometric');
        setScreen('home');
      }}
      onGoogleLogin={() => console.log('google login')}
      onAppleLogin={() => console.log('apple login')}
    />
  );
}