import React, { useState } from 'react';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';

type Screen = 'login' | 'signup' | 'forgot';

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');

export default function App() {
  const [screen, setScreen] = useState<'login' | 'signup'>('login');

  if (screen === 'signup') {
    return (
      <SignupScreen
        onGoToLogin={() => setScreen('login')}
        onSignup={(data) => {
          console.log('Signup:', data);
          alert('Account created! (demo)');
        }}
      />
    );
  }

  if (screen === 'forgot') {
    return (
      <ForgotPasswordScreen
        onGoToLogin={() => setScreen('login')}
        onSubmit={async (email) => {
          console.log('Reset requested for:', email);
          // Simulate API delay
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
      onForgotPassword={() => alert('Forgot pw screen coming next')}
    />
  );
}
