import React, { useState } from 'react';
 
import SplashScreen from './src/screens/auth/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import HomeScreen from './src/screens/home/HomeScreen';
import GroupDetailScreen from './src/screens/groups/GroupDetailScreen';
import CreateGroupScreen from './src/screens/groups/CreateGroupScreen';
import AddExpenseScreen from './src/screens/expenses/AddExpenseScreen';
import SettleUpScreen from './src/screens/expenses/SettleUpScreen';
 
/* ─── ROUTE TYPES ──────────────────────────────────────────── */
type Screen =
 | 'splash'
 | 'login'
 | 'signup'
 | 'forgot'
 | 'home'
 | 'create-group'
 | 'group'
 | 'add-expense'
 | 'settle-up';
 
type Tab = 'home' | 'groups' | 'activity' | 'profile';
 
/* ─── MAIN APP ─────────────────────────────────────────────── */
export default function App() {
 const [screen, setScreen] = useState<Screen>('splash');
 const [activeTab, setActiveTab] = useState<Tab>('home');
 const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
 
 /* ─── 1. SPLASH ─── */
 if (screen === 'splash') {
 return React.createElement(SplashScreen, { onDone: () => setScreen('login') });
 }
 
 /* ─── 2. SIGNUP ─── */
 if (screen === 'signup') {
 return React.createElement(SignupScreen, {
 onGoToLogin: () => setScreen('login'),
 onSignup: (data: any) => {
 console.log('Signup data:', data);
 setScreen('home');
 },
 onGoogleSignup: () => console.log('google signup'),
 onAppleSignup: () => console.log('apple signup'),
 onOpenTerms: () => console.log('open terms'),
 onOpenPrivacy: () => console.log('open privacy'),
 });
 }
 
 /* ─── 3. FORGOT PASSWORD ─── */
 if (screen === 'forgot') {
 return React.createElement(ForgotPasswordScreen, {
 onGoToLogin: () => setScreen('login'),
 onSubmit: async (email: string) => {
 console.log('Password reset requested for:', email);
 await new Promise((r) => setTimeout(r, 800));
 },
 });
 }
 
 /* ─── 4. ADD EXPENSE ─── */
 if (screen === 'add-expense') {
 return React.createElement(AddExpenseScreen, {
 groupName: 'Pokhara Trip',
 groupCurrency: 'NPR',
 onBack: () => setScreen('group'),
 onSave: (expense: any) => {
 console.log('New expense saved:', expense);
 setScreen('group');
 },
 });
 }
 
 /* ─── 5. SETTLE UP ─── */
 if (screen === 'settle-up') {
 return React.createElement(SettleUpScreen, {
 groupName: 'Pokhara Trip',
 groupCurrency: 'NPR',
 onBack: () => setScreen('group'),
 onSettle: (settlement: any) => {
 console.log('Settlement recorded:', settlement);
 },
 });
 }
 
 /* ─── 6. CREATE GROUP ─── */
 if (screen === 'create-group') {
 return React.createElement(CreateGroupScreen, {
 onBack: () => setScreen('home'),
 onCreate: (group: any) => {
 console.log('Group created:', group);
 setScreen('home');
 },
 });
 }
 
 /* ─── 7. GROUP DETAIL ─── */
 if (screen === 'group') {
 return React.createElement(GroupDetailScreen, {
 onBack: () => setScreen('home'),
 onAddExpense: () => setScreen('add-expense'),
 onSettleUp: () => setScreen('settle-up'),
 onExpenseTap: (expenseId: string) => {
 console.log('open expense detail', expenseId);
 },
 onOpenSettings: () => {
 console.log('open group settings');
 },
 });
 }
 
 /* ─── 8. HOME ─── */
 if (screen === 'home') {
 return React.createElement(HomeScreen, {
 activeTab: activeTab,
 onTabChange: setActiveTab,
 onGroupTap: (id: string) => {
 setActiveGroupId(id);
 setScreen('group');
 },
 onAddExpense: () => setScreen('add-expense'),
 onScanReceipt: () => console.log('scan receipt'),
 onCreateGroup: () => setScreen('create-group'),
 onOpenNotifications: () => setActiveTab('activity'),
 });
 }
 
 /* ─── 9. LOGIN (default) ─── */
 return React.createElement(LoginScreen, {
 onLogin: () => {
 console.log('login pressed');
 setScreen('home');
 },
 onGoToSignup: () => setScreen('signup'),
 onForgotPassword: () => setScreen('forgot'),
 onBiometricLogin: () => {
 console.log('biometric login');
 setScreen('home');
 },
 onGoogleLogin: () => console.log('google login'),
 onAppleLogin: () => console.log('apple login'),
 });
}