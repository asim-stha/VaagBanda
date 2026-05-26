import React, { useState } from 'react';
import SplashScreen from './src/screens/auth/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import HomeScreen from './src/screens/home/HomeScreen';
import GroupDetailScreen from './src/screens/groups/GroupDetailScreen';

type Screen = 'splash' | 'login' | 'signup' | 'forgot' | 'home' | 'group';

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  if (screen === 'splash') {
    return <SplashScreen onDone={() => setScreen('login')} />;
  }
  if (screen === 'signup') {
    return (
      <SignupScreen
        onGoToLogin={() => setScreen('login')}
        onSignup={() => setScreen('home')}
      />
    );
  }
  if (screen === 'forgot') {
    return (
      <ForgotPasswordScreen
        onGoToLogin={() => setScreen('login')}
        onSubmit={async () => { await new Promise(r => setTimeout(r, 800)); }}
      />
    );
  }
  if (screen === 'group') {
    return (
      <GroupDetailScreen
        onBack={() => setScreen('home')}
        onAddExpense={() => console.log('add expense', activeGroupId)}
        onSettleUp={() => console.log('settle up', activeGroupId)}
        onExpenseTap={(id) => console.log('expense tap', id)}
        onOpenSettings={() => console.log('group settings')}
      />
    );
  }
  if (screen === 'home') {
    return (
      <HomeScreen
        onGroupTap={(id) => {
          setActiveGroupId(id);
          setScreen('group');
        }}
        onAddExpense={() => console.log('add expense')}
        onScanReceipt={() => console.log('scan')}
        onCreateGroup={() => console.log('create group')}
      />
    );
  }
  return (
    <LoginScreen
      onLogin={() => setScreen('home')}
      onGoToSignup={() => setScreen('signup')}
      onForgotPassword={() => setScreen('forgot')}
    />
  );
}