

import React, { useState } from 'react';

import SplashScreen from './src/screens/auth/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import HomeScreen from './src/screens/home/HomeScreen';
import GroupDetailScreen from './src/screens/groups/GroupDetailScreen';
import AddExpenseScreen from './src/screens/expenses/AddExpenseScreen';

/* ─── ROUTE TYPES ──────────────────────────────────────────── */
type Screen =
  | 'splash'
  | 'login'
  | 'signup'
  | 'forgot'
  | 'home'
  | 'group'
  | 'add-expense';

type Tab = 'home' | 'groups' | 'activity' | 'profile';

/* ─── MAIN APP ─────────────────────────────────────────────── */
export default function App() {
  // Active screen
  const [screen, setScreen] = useState<Screen>('splash');

  // Active bottom tab (Home screen)
  const [activeTab, setActiveTab] = useState<Tab>('home');

  // Currently selected group (for GroupDetail and AddExpense)
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  /* ─── 1. SPLASH ─── */
  if (screen === 'splash') {
    return (
      <SplashScreen
        onDone={() => setScreen('login')}
      />
    );
  }

  /* ─── 2. SIGNUP ─── */
  if (screen === 'signup') {
    return (
      <SignupScreen
        onGoToLogin={() => setScreen('login')}
        onSignup={(data) => {
          console.log('Signup data:', data);
          // In production: POST /api/auth/register, store JWT, then route
          setScreen('home');
        }}
        onGoogleSignup={() => console.log('google signup')}
        onAppleSignup={() => console.log('apple signup')}
        onOpenTerms={() => console.log('open terms')}
        onOpenPrivacy={() => console.log('open privacy')}
      />
    );
  }

  /* ─── 3. FORGOT PASSWORD ─── */
  if (screen === 'forgot') {
    return (
      <ForgotPasswordScreen
        onGoToLogin={() => setScreen('login')}
        onSubmit={async (email) => {
          console.log('Password reset requested for:', email);
          // In production: POST /api/auth/forgot-password
          await new Promise((r) => setTimeout(r, 800));
        }}
      />
    );
  }

  /* ─── 4. ADD EXPENSE ─── */
  if (screen === 'add-expense') {
    return (
      <AddExpenseScreen
        groupName="Pokhara Trip"
        groupCurrency="NPR"
        onBack={() => setScreen('group')}
        onSave={(expense) => {
          console.log('New expense saved:', expense);
          // In production: POST /api/expenses, refetch group balances
          setScreen('group');
        }}
      />
    );
  }

  /* ─── 5. GROUP DETAIL ─── */
  if (screen === 'group') {
    return (
      <GroupDetailScreen
        onBack={() => setScreen('home')}
        onAddExpense={() => setScreen('add-expense')}
        onSettleUp={() => {
          console.log('open settle up for group', activeGroupId);
          // Later: setScreen('settle-up')
        }}
        onExpenseTap={(expenseId) => {
          console.log('open expense detail', expenseId);
          // Later: setScreen('expense-detail')
        }}
        onOpenSettings={() => {
          console.log('open group settings');
          // Later: setScreen('group-settings')
        }}
      />
    );
  }

  /* ─── 6. HOME (post-auth main hub) ─── */
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
        onScanReceipt={() => {
          console.log('scan receipt');
          // Increment 3: OCR flow
        }}
        onCreateGroup={() => {
          console.log('create group');
          // Later: setScreen('create-group')
        }}
        onOpenNotifications={() => setActiveTab('activity')}
      />
    );
  }

  /* ─── 7. LOGIN (default) ─── */
  return (
    <LoginScreen
      onLogin={() => {
        console.log('login pressed');
        // In production: POST /api/auth/login, store JWT, then route
        setScreen('home');
      }}
      onGoToSignup={() => setScreen('signup')}
      onForgotPassword={() => setScreen('forgot')}
      onBiometricLogin={() => {
        console.log('biometric login');
        // In production: expo-local-authentication flow
        setScreen('home');
      }}
      onGoogleLogin={() => console.log('google login')}
      onAppleLogin={() => console.log('apple login')}
    />
  );
}