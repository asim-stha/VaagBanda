import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line, Polyline, Circle, Rect } from 'react-native-svg';
import { supabase } from '../../lib/supabase';

/* ─── BRAND TOKENS ─────────────────────────────────────────── */
const C = {
  CRIMSON: '#DC143C',
  CRIMSON_DARK: '#A01030',
  BLUE: '#1A2B5F',
  BLUE_DARK: '#0F1F4A',
  WHITE: '#FFFFFF',
  GHOST: '#F7F8FB',
  GRAY100: '#EEF1F6',
  GRAY200: '#E1E5EE',
  GRAY400: '#9AA3B5',
  GRAY600: '#5A6478',
  GRAY800: '#1F2A44',
  SUCCESS: '#27AE60',
  WARN: '#E67E22',
};

/* ─── ICONS ─────────────────────────────────────────────────── */
type IconName =
  | 'back' | 'lock' | 'eye' | 'eyeOff' | 'check'
  | 'logout' | 'trash' | 'shield' | 'globe' | 'info';

const Icon = ({ name, size = 18, color = C.GRAY400 }: {
  name: IconName; size?: number; color?: string;
}) => {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth: 2,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'back':
      return <Svg {...p}><Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" /></Svg>;
    case 'lock':
      return <Svg {...p}><Rect x="3" y="11" width="18" height="11" rx="2" /><Path d="M7 11V7a5 5 0 0110 0v4" /></Svg>;
    case 'eye':
      return <Svg {...p}><Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><Circle cx="12" cy="12" r="3" /></Svg>;
    case 'eyeOff':
      return <Svg {...p}><Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><Line x1="1" y1="1" x2="23" y2="23" /></Svg>;
    case 'check':
      return <Svg {...p}><Polyline points="20 6 9 17 4 12" /></Svg>;
    case 'logout':
      return <Svg {...p}><Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><Polyline points="16 17 21 12 16 7" /><Line x1="21" y1="12" x2="9" y2="12" /></Svg>;
    case 'trash':
      return <Svg {...p}><Polyline points="3 6 5 6 21 6" /><Path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></Svg>;
    case 'shield':
      return <Svg {...p}><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Svg>;
    case 'globe':
      return <Svg {...p}><Circle cx="12" cy="12" r="10" /><Line x1="2" y1="12" x2="22" y2="12" /><Path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></Svg>;
    case 'info':
      return <Svg {...p}><Circle cx="12" cy="12" r="10" /><Line x1="12" y1="16" x2="12" y2="12" /><Line x1="12" y1="8" x2="12.01" y2="8" /></Svg>;
    default: return null;
  }
};

/* ─── TYPES ─────────────────────────────────────────────────── */
interface PrivacySettings {
  show_email_to_group: boolean;
  show_balance_to_group: boolean;
}

interface Props {
  onBack?: () => void;
  onLogout?: () => void;
}

/* ─── SECTION HEADER ─────────────────────────────────────────── */
const SectionHeader = ({ title }: { title: string }) => (
  <Text style={s.sectionHeader}>{title}</Text>
);

/* ─── MAIN SCREEN ─────────────────────────────────────────────── */
const SecurityPrivacyScreen: React.FC<Props> = ({ onBack, onLogout }) => {
  // ── Password change state ──
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  // ── Privacy settings state ──
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    show_email_to_group: true,
    show_balance_to_group: true,
  });
  const [privacyLoading, setPrivacyLoading] = useState(true);
  const [privacySaving, setPrivacySaving] = useState(false);

  // ── Danger zone ──
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [signOutAllLoading, setSignOutAllLoading] = useState(false);

  // ── Current user email (for display) ──
  const [userEmail, setUserEmail] = useState('');

  /* ── Load privacy settings & user info on mount ── */
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserEmail(user.email ?? '');

        const { data, error } = await supabase
          .from('profiles')
          .select('show_email_to_group, show_balance_to_group')
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          setPrivacy({
            show_email_to_group: data.show_email_to_group ?? true,
            show_balance_to_group: data.show_balance_to_group ?? true,
          });
        }
      } catch (e) {
        // silently ignore — columns may not exist yet if migration hasn't run
      } finally {
        setPrivacyLoading(false);
      }
    })();
  }, []);

  /* ── Password change ── */
  const handleChangePassword = useCallback(async () => {
    setPwError(null);
    setPwSuccess(false);

    if (!currentPw || !newPw || !confirmPw) {
      setPwError('Please fill in all password fields.');
      return;
    }
    if (newPw.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('New passwords do not match.');
      return;
    }
    if (newPw === currentPw) {
      setPwError('New password must differ from your current password.');
      return;
    }

    setPwLoading(true);
    try {
      // Re-authenticate with current password first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Session expired. Please sign in again.');

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPw,
      });
      if (signInErr) throw new Error('Current password is incorrect.');

      // Now update to new password
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPw });
      if (updateErr) throw new Error(updateErr.message);

      setPwSuccess(true);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (e: any) {
      setPwError(e.message || 'Failed to update password.');
    } finally {
      setPwLoading(false);
    }
  }, [currentPw, newPw, confirmPw]);

  /* ── Privacy toggle ── */
  const handlePrivacyToggle = useCallback(async (
    key: keyof PrivacySettings,
    value: boolean,
  ) => {
    const updated = { ...privacy, [key]: value };
    setPrivacy(updated);
    setPrivacySaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ [key]: value })
        .eq('user_id', user.id);

      if (error) {
        // Revert on failure
        setPrivacy(privacy);
        Alert.alert('Error', 'Could not save privacy setting. Please try again.');
      }
    } catch (e) {
      setPrivacy(privacy);
    } finally {
      setPrivacySaving(false);
    }
  }, [privacy]);

  /* ── Sign out all devices ── */
  const handleSignOutAll = useCallback(() => {
    Alert.alert(
      'Sign out everywhere?',
      'You will be signed out on this device and all other sessions will be invalidated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out all',
          style: 'destructive',
          onPress: async () => {
            setSignOutAllLoading(true);
            try {
              // scope: 'global' signs out all sessions
              const { error } = await supabase.auth.signOut({ scope: 'global' });
              if (error) throw new Error(error.message);
              onLogout?.();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to sign out all sessions.');
            } finally {
              setSignOutAllLoading(false);
            }
          },
        },
      ],
    );
  }, [onLogout]);

  /* ── Delete account ── */
  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete account?',
      'This permanently removes your profile and all group memberships. Expenses you recorded will remain in groups for other members. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete my account',
          style: 'destructive',
          onPress: async () => {
            setDeleteLoading(true);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('Not authenticated.');

              // Remove from all group_members rows
              await supabase
                .from('group_members')
                .delete()
                .eq('user_id', user.id);

              // Delete profile (auth.users cascade handles the auth side
              // if the DB has ON DELETE CASCADE on profiles.user_id)
              await supabase
                .from('profiles')
                .delete()
                .eq('user_id', user.id);

              // Delete auth user via admin or signOut
              // Supabase JS v2 doesn't expose admin.deleteUser client-side;
              // sign out so the session is cleared, then rely on the cascade
              // or a server-side Edge Function / webhook for hard deletion.
              await supabase.auth.signOut();
              onLogout?.();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete account. Please try again.');
            } finally {
              setDeleteLoading(false);
            }
          },
        },
      ],
    );
  }, [onLogout]);

  /* ── Password strength ── */
  const pwStrength = (() => {
    if (!newPw) return null;
    let score = 0;
    if (newPw.length >= 8) score++;
    if (/[A-Z]/.test(newPw)) score++;
    if (/[0-9]/.test(newPw)) score++;
    if (/[^A-Za-z0-9]/.test(newPw)) score++;
    if (score <= 1) return { label: 'Weak', color: C.CRIMSON };
    if (score <= 2) return { label: 'Fair', color: C.WARN };
    return { label: 'Strong', color: C.SUCCESS };
  })();

  /* ─────────── RENDER ─────────── */
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.BLUE_DARK} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <LinearGradient
          colors={[C.BLUE_DARK, C.BLUE]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.header}
        >
          <View style={s.topRow}>
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.iconBtn}>
              <Icon name="back" size={18} color={C.WHITE} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Security & Privacy</Text>
            <View style={{ width: 36 }} />
          </View>
          {userEmail ? (
            <Text style={s.headerSub}>{userEmail}</Text>
          ) : null}
        </LinearGradient>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.sheet}>
            {/* ── CHANGE PASSWORD ── */}
            <View style={s.card}>
              <View style={s.cardIconRow}>
                <Icon name="lock" size={16} color={C.BLUE} />
                <SectionHeader title="Change Password" />
              </View>

              {pwSuccess && (
                <View style={s.successBanner}>
                  <Icon name="check" size={14} color={C.SUCCESS} />
                  <Text style={s.successText}>Password updated successfully.</Text>
                </View>
              )}

              {/* Current password */}
              <Text style={s.label}>Current password</Text>
              <View style={s.fieldRow}>
                <TextInput
                  value={currentPw}
                  onChangeText={setCurrentPw}
                  secureTextEntry={!showCurrent}
                  placeholder="Enter current password"
                  placeholderTextColor={C.GRAY400}
                  style={s.fieldInput}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowCurrent(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name={showCurrent ? 'eyeOff' : 'eye'} size={18} color={C.GRAY400} />
                </TouchableOpacity>
              </View>

              {/* New password */}
              <Text style={[s.label, { marginTop: 12 }]}>New password</Text>
              <View style={s.fieldRow}>
                <TextInput
                  value={newPw}
                  onChangeText={setNewPw}
                  secureTextEntry={!showNew}
                  placeholder="At least 8 characters"
                  placeholderTextColor={C.GRAY400}
                  style={s.fieldInput}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowNew(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name={showNew ? 'eyeOff' : 'eye'} size={18} color={C.GRAY400} />
                </TouchableOpacity>
              </View>

              {/* Strength bar */}
              {pwStrength && (
                <View style={s.strengthRow}>
                  <View style={s.strengthTrack}>
                    {[1, 2, 3].map(i => (
                      <View
                        key={i}
                        style={[
                          s.strengthBar,
                          {
                            backgroundColor:
                              (pwStrength.label === 'Weak' && i === 1) ||
                                (pwStrength.label === 'Fair' && i <= 2) ||
                                (pwStrength.label === 'Strong')
                                ? pwStrength.color
                                : C.GRAY200,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[s.strengthLabel, { color: pwStrength.color }]}>
                    {pwStrength.label}
                  </Text>
                </View>
              )}

              {/* Confirm password */}
              <Text style={[s.label, { marginTop: 12 }]}>Confirm new password</Text>
              <View style={s.fieldRow}>
                <TextInput
                  value={confirmPw}
                  onChangeText={setConfirmPw}
                  secureTextEntry
                  placeholder="Repeat new password"
                  placeholderTextColor={C.GRAY400}
                  style={s.fieldInput}
                  autoCapitalize="none"
                />
              </View>

              {pwError && <Text style={s.errorText}>{pwError}</Text>}

              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={pwLoading || !currentPw || !newPw || !confirmPw}
                activeOpacity={0.85}
                style={{ marginTop: 16 }}
              >
                {pwLoading ? (
                  <View style={[s.btn, s.btnOutline]}>
                    <ActivityIndicator size="small" color={C.CRIMSON} />
                  </View>
                ) : (
                  <LinearGradient
                    colors={[C.CRIMSON, C.CRIMSON_DARK]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[s.btn, (!currentPw || !newPw || !confirmPw) && s.btnDisabled]}
                  >
                    <Text style={s.btnText}>Update Password</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>

            {/* ── PRIVACY SETTINGS ── */}
            <View style={[s.card, { marginTop: 18 }]}>
              <View style={s.cardIconRow}>
                <Icon name="globe" size={16} color={C.BLUE} />
                <SectionHeader title="Privacy" />
              </View>

              {privacyLoading ? (
                <ActivityIndicator color={C.CRIMSON} style={{ paddingVertical: 16 }} />
              ) : (
                <>
                  <View style={s.toggleRow}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={s.toggleLabel}>Show email to group members</Text>
                      <Text style={s.toggleDesc}>
                        Other members in your groups can see your email address.
                      </Text>
                    </View>
                    <Switch
                      value={privacy.show_email_to_group}
                      onValueChange={v => handlePrivacyToggle('show_email_to_group', v)}
                      disabled={privacySaving}
                      trackColor={{ false: C.GRAY200, true: C.CRIMSON + '60' }}
                      thumbColor={privacy.show_email_to_group ? C.CRIMSON : C.GRAY400}
                    />
                  </View>

                  <View style={[s.toggleRow, { borderTopWidth: 1, borderTopColor: C.GRAY100, marginTop: 4, paddingTop: 14 }]}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={s.toggleLabel}>Show balance to group members</Text>
                      <Text style={s.toggleDesc}>
                        Others in your groups can see how much you owe or are owed.
                      </Text>
                    </View>
                    <Switch
                      value={privacy.show_balance_to_group}
                      onValueChange={v => handlePrivacyToggle('show_balance_to_group', v)}
                      disabled={privacySaving}
                      trackColor={{ false: C.GRAY200, true: C.CRIMSON + '60' }}
                      thumbColor={privacy.show_balance_to_group ? C.CRIMSON : C.GRAY400}
                    />
                  </View>
                </>
              )}
            </View>

            {/* ── DATA & SESSIONS ── */}
            <View style={[s.card, { marginTop: 18 }]}>
              <View style={s.cardIconRow}>
                <Icon name="shield" size={16} color={C.BLUE} />
                <SectionHeader title="Sessions & Data" />
              </View>

              <View style={s.infoCard}>
                <Icon name="info" size={14} color={C.BLUE} />
                <Text style={s.infoText}>
                  VaagBanda stores your data securely on Supabase with row-level security. Your password is hashed and never stored in plaintext.
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleSignOutAll}
                disabled={signOutAllLoading}
                activeOpacity={0.7}
                style={s.actionRow}
              >
                {signOutAllLoading
                  ? <ActivityIndicator size="small" color={C.WARN} />
                  : <Icon name="logout" size={18} color={C.WARN} />
                }
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[s.actionLabel, { color: C.WARN }]}>Sign out all devices</Text>
                  <Text style={s.actionDesc}>Invalidates all active sessions immediately.</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* ── DANGER ZONE ── */}
            <View style={[s.card, s.dangerCard, { marginTop: 18 }]}>
              <Text style={s.dangerLabel}>DANGER ZONE</Text>

              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={deleteLoading}
                activeOpacity={0.7}
                style={s.actionRow}
              >
                {deleteLoading
                  ? <ActivityIndicator size="small" color={C.CRIMSON} />
                  : <Icon name="trash" size={18} color={C.CRIMSON} />
                }
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[s.actionLabel, { color: C.CRIMSON }]}>Delete account</Text>
                  <Text style={s.actionDesc}>
                    Permanently removes your profile and all memberships. Cannot be undone.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ─── STYLES ─────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.GHOST },
  header: { paddingTop: 20, paddingHorizontal: 24, paddingBottom: 22 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: C.WHITE, fontSize: 16, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, textAlign: 'center', marginTop: 6 },

  sheet: { paddingHorizontal: 20, paddingTop: 20 },

  card: {
    backgroundColor: C.WHITE,
    borderRadius: 14,
    padding: 18,
    shadowColor: '#0F2640',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dangerCard: {
    borderWidth: 1.5,
    borderColor: C.CRIMSON + '40',
    backgroundColor: '#fff8f8',
  },
  cardIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionHeader: { fontSize: 14, fontWeight: '800', color: C.GRAY800, letterSpacing: -0.2 },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(39,174,96,0.10)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  successText: { fontSize: 13, color: C.SUCCESS, fontWeight: '700' },

  label: { fontSize: 11, fontWeight: '700', color: C.GRAY600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },

  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.WHITE,
    borderWidth: 1.5,
    borderColor: C.GRAY200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  fieldInput: { flex: 1, fontSize: 14, color: C.GRAY800, fontWeight: '500', padding: 0 },

  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  strengthTrack: { flex: 1, flexDirection: 'row', gap: 4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700' },

  errorText: { fontSize: 12, color: C.CRIMSON, fontWeight: '600', marginTop: 8 },

  btn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: C.WHITE, fontSize: 14, fontWeight: '700' },
  btnOutline: { backgroundColor: C.GHOST, borderWidth: 1.5, borderColor: C.GRAY200 },
  btnDisabled: { opacity: 0.4 },

  toggleRow: { flexDirection: 'row', alignItems: 'center' },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: C.GRAY800, marginBottom: 2 },
  toggleDesc: { fontSize: 12, color: C.GRAY600, lineHeight: 16 },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(26,43,95,0.05)',
    borderLeftWidth: 3,
    borderLeftColor: C.BLUE,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  infoText: { flex: 1, fontSize: 12, color: C.GRAY600, lineHeight: 17 },

  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  actionLabel: { fontSize: 14, fontWeight: '700' },
  actionDesc: { fontSize: 12, color: C.GRAY600, marginTop: 2, lineHeight: 16 },

  dangerLabel: { fontSize: 11, fontWeight: '800', color: C.CRIMSON, letterSpacing: 1.5, marginBottom: 14 },
});

export default SecurityPrivacyScreen;