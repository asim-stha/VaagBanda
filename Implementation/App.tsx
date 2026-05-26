import React, { useState } from 'react';
import SplashScreen from './src/screens/auth/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';

type Screen = 'splash' | 'login' | 'signup' | 'forgot';

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');

  if (screen === 'splash') {
    return <SplashScreen onDone={() => setScreen('login')} />;
  }
  if (screen === 'signup') {
    return (
      <SignupScreen
        onGoToLogin={() => setScreen('login')}
        onSignup={(data) => console.log('Signup:', data)}
      />
    );
  }
  if (screen === 'forgot') {
    return (
      <ForgotPasswordScreen
        onGoToLogin={() => setScreen('login')}
        onSubmit={async (email) => {
          await new Promise(r => setTimeout(r, 800));
        }}
      />
    );
  }
  return (
    <LoginScreen
      onLogin={() => alert('Logged in! (demo)')}
      onGoToSignup={() => setScreen('signup')}
      onForgotPassword={() => setScreen('forgot')}
    />
  );
}