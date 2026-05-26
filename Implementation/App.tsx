import React, { useState } from 'react';
import SplashScreen from './src/screens/auth/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import HomeScreen from './src/screens/home/HomeScreen';

type Screen = 'splash' | 'login' | 'signup' | 'forgot' | 'home';
type Tab = 'home' | 'groups' | 'activity' | 'profile';

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [activeTab, setActiveTab] = useState<Tab>('home');

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
  if (screen === 'home') {
    return (
      <HomeScreen
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onGroupTap={(id) => console.log('open group', id)}
        onAddExpense={() => console.log('add expense')}
        onScanReceipt={() => console.log('scan')}
        onCreateGroup={() => console.log('create group')}
        onOpenNotifications={() => setActiveTab('activity')}
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