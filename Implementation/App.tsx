import React, { useState } from 'react';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';

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

  return (
    <LoginScreen
      onLogin={() => alert('Logged in! (demo)')}
      onGoToSignup={() => setScreen('signup')}
      onForgotPassword={() => alert('Forgot pw screen coming next')}
    />
  );
}
