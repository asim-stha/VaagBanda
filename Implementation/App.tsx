import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { authService } from './src/services/authService';
import { apiService, Creditor, GroupDetail, GroupSummary } from './src/services/apiService';

import SplashScreen from './src/screens/auth/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import HomeScreen from './src/screens/home/HomeScreen';
import GroupDetailScreen from './src/screens/groups/GroupDetailScreen';
import CreateGroupScreen from './src/screens/groups/CreateGroupScreen';
import AddExpenseScreen from './src/screens/expenses/AddExpenseScreen';
import SettleUpScreen from './src/screens/expenses/SettleUpScreen';

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

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
 const { user, loading, refreshAuth } = useAuth();
 const [screen, setScreen] = useState<Screen>('splash');
 const [activeTab, setActiveTab] = useState<Tab>('home');
 const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
 const [groups, setGroups] = useState<GroupSummary[]>([]);
 const [groupDetail, setGroupDetail] = useState<GroupDetail | null>(null);
 const [creditors, setCreditors] = useState<Creditor[]>([]);

 const showError = (error: unknown) => {
   const message = error instanceof Error ? error.message : 'Something went wrong.';
   Alert.alert('VaagBanda', message);
 };

 const loadGroups = async () => {
   try {
     const response = await apiService.getGroups();
     setGroups(response.data);
   } catch (error) {
     showError(error);
   }
 };

 const loadGroup = async (groupId: string) => {
   try {
     const [detailResponse, creditorsResponse] = await Promise.all([
       apiService.getGroup(groupId),
       apiService.getCreditors(groupId),
     ]);
     setGroupDetail(detailResponse.data);
     setCreditors(creditorsResponse.data);
   } catch (error) {
     showError(error);
   }
 };

 useEffect(() => {
   if (loading) return;

   if (user) {
     if (['splash', 'login', 'signup', 'forgot'].includes(screen)) {
       setScreen('home');
     }
     loadGroups();
   } else if (!['splash', 'login', 'signup', 'forgot'].includes(screen)) {
     setScreen('login');
   }
 }, [user, loading]);

 if (screen === 'splash') {
   return React.createElement(SplashScreen, {
     onDone: () => setScreen(user ? 'home' : 'login'),
   });
 }

 if (screen === 'signup') {
   return React.createElement(SignupScreen, {
     onGoToLogin: () => setScreen('login'),
     onSignup: async (data: any) => {
       await authService.signUp(data.email, data.password, data.name);
       await refreshAuth();
       await loadGroups();
       setScreen('home');
     },
     onGoogleSignup: () => Alert.alert('VaagBanda', 'Google signup is not connected yet.'),
     onAppleSignup: () => Alert.alert('VaagBanda', 'Apple signup is not connected yet.'),
     onOpenTerms: () => console.log('open terms'),
     onOpenPrivacy: () => console.log('open privacy'),
   });
 }

 if (screen === 'forgot') {
   return React.createElement(ForgotPasswordScreen, {
     onGoToLogin: () => setScreen('login'),
     onSubmit: async (email: string) => {
       await authService.resetPassword(email);
     },
   });
 }

 if (screen === 'add-expense') {
   const activeGroup = groupDetail;
   return React.createElement(AddExpenseScreen, {
     groupName: activeGroup?.name || 'Group',
     groupCurrency: activeGroup?.currency || 'NPR',
     members: activeGroup?.members,
     myUserId: activeGroup?.myUserId || user?.id,
     onBack: () => setScreen('group'),
     onSave: async (expense: any) => {
       if (!activeGroupId) return;
       try {
         const response = await apiService.addExpense(activeGroupId, expense);
         setGroupDetail(response.data);
         await loadGroups();
         await loadGroup(activeGroupId);
         setScreen('group');
       } catch (error) {
         showError(error);
       }
     },
   });
 }

 if (screen === 'settle-up') {
   const activeGroup = groupDetail;
   return React.createElement(SettleUpScreen, {
     groupName: activeGroup?.name || 'Group',
     groupCurrency: activeGroup?.currency || 'NPR',
     creditors,
     onBack: () => setScreen('group'),
     onSettle: async (settlement: any) => {
       if (!activeGroupId) return;
       try {
         const response = await apiService.recordSettlement(activeGroupId, settlement);
         setGroupDetail(response.group);
         await loadGroups();
         await loadGroup(activeGroupId);
       } catch (error) {
         showError(error);
       }
     },
   });
 }

 if (screen === 'create-group') {
   return React.createElement(CreateGroupScreen, {
     onBack: () => setScreen('home'),
     onCreate: async (group: any) => {
       try {
         const response = await apiService.createGroup(group);
         await loadGroups();
         setActiveGroupId(response.data.id);
         await loadGroup(response.data.id);
         setScreen('group');
       } catch (error) {
         showError(error);
       }
     },
   });
 }

 if (screen === 'group') {
   return React.createElement(GroupDetailScreen, {
     group: groupDetail || undefined,
     onBack: () => {
       setScreen('home');
       loadGroups();
     },
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

 if (screen === 'home') {
   return React.createElement(HomeScreen, {
     user: user ? { id: user.id, name: user.name, avatarColor: user.avatarColor } : undefined,
     groups,
     activeTab: activeTab,
     onTabChange: setActiveTab,
     onGroupTap: async (id: string) => {
       setActiveGroupId(id);
       setScreen('group');
       await loadGroup(id);
     },
     onAddExpense: async () => {
       const groupId = activeGroupId || groups[0]?.id;
       if (!groupId) {
         Alert.alert('VaagBanda', 'Create a group first.');
         return;
       }
       setActiveGroupId(groupId);
       await loadGroup(groupId);
       setScreen('add-expense');
     },
     onScanReceipt: () => Alert.alert('VaagBanda', 'Receipt scanning is not connected yet.'),
     onCreateGroup: () => setScreen('create-group'),
     onOpenNotifications: () => setActiveTab('activity'),
   });
 }

 return React.createElement(LoginScreen, {
   onLogin: async () => {
     await refreshAuth();
     await loadGroups();
     setScreen('home');
   },
   onGoToSignup: () => setScreen('signup'),
   onForgotPassword: () => setScreen('forgot'),
   onBiometricLogin: () => Alert.alert('VaagBanda', 'Biometric login is not connected yet.'),
   onGoogleLogin: () => Alert.alert('VaagBanda', 'Google login is not connected yet.'),
   onAppleLogin: () => Alert.alert('VaagBanda', 'Apple login is not connected yet.'),
 });
}
