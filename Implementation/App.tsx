import LoginScreen from './src/screens/auth/LoginScreen';

export default function App() {
  return (
    <LoginScreen
      onLogin={() => console.log('login pressed')}
      onGoToSignup={() => console.log('signup pressed')}
      onForgotPassword={() => console.log('forgot pressed')}
    />
  );
}