import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line, Polyline } from 'react-native-svg';

/* ─── BRAND TOKENS ─────────────────────────────────────────── */
const COLORS = {
  CRIMSON: '#DC143C',
  CRIMSON_DARK: '#A01030',
  BLUE: '#1A2B5F',
  BLUE_DARK: '#0F1F4A',
  BLUE_MID: '#2B3F75',
  WHITE: '#FFFFFF',
  GHOST: '#F7F8FB',
  GRAY100: '#EEF1F6',
  GRAY200: '#E1E5EE',
  GRAY400: '#9AA3B5',
  GRAY600: '#5A6478',
  GRAY800: '#1F2A44',
  SUCCESS: '#27AE60',
  SUCCESS_BG: 'rgba(39,174,96,0.10)',
};

/* ─── ICONS ────────────────────────────────────────────────── */
type IconName = 'mail' | 'back' | 'check' | 'send' | 'shield';

const Icon = ({
  name,
  size = 18,
  color = COLORS.GRAY400,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) => {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    pointerEvents: 'none' as const,
  };

  switch (name) {
    case 'mail':
      return (
        <Svg {...props}>
          <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <Polyline points="22,6 12,13 2,6" />
        </Svg>
      );
    case 'back':
      return (
        <Svg {...props}>
          <Line x1="19" y1="12" x2="5" y2="12" />
          <Polyline points="12 19 5 12 12 5" />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...props}>
          <Polyline points="20 6 9 17 4 12" />
        </Svg>
      );
    case 'send':
      return (
        <Svg {...props}>
          <Line x1="22" y1="2" x2="11" y2="13" />
          <Path d="M22 2L15 22l-4-9-9-4 20-7z" />
        </Svg>
      );
    case 'shield':
      return (
        <Svg {...props}>
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </Svg>
      );
    default:
      return null;
  }
};

/* ─── EMAIL VALIDATION ─────────────────────────────────────── */
const isValidEmail = (email: string): boolean => {
  // Simple RFC-5322-ish check (good enough for client-side UX)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/* ─── PROPS ────────────────────────────────────────────────── */
interface ForgotPasswordScreenProps {
  /** Called when user submits valid email — backend hook later */
  onSubmit?: (email: string) => Promise<void> | void;
  /** Navigation back to LoginScreen */
  onGoToLogin?: () => void;
}

/* ─── MAIN SCREEN ──────────────────────────────────────────── */
const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onSubmit,
  onGoToLogin,
}) => {
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const canSubmit = isValidEmail(email) && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // Hook to AuthDB.PasswordReset insert via API call — wired later
      await onSubmit?.(email);
      setSent(true);
    } catch (e) {
      // Error toast/state handled by parent later
      console.warn('Password reset request failed', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = () => {
    setSent(false);
    setEmail('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BLUE_DARK} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* ─── HEADER (gradient + back btn + small logo + title) ─── */}
          <LinearGradient
            colors={[COLORS.BLUE_DARK, COLORS.BLUE, COLORS.BLUE_MID]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={[styles.blob, styles.blob1]} />
            <View style={[styles.blob, styles.blob2]} />

            <TouchableOpacity
              onPress={onGoToLogin}
              activeOpacity={0.7}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="back" size={18} color={COLORS.WHITE} />
            </TouchableOpacity>

            <View style={styles.headerRow}>
              <View style={styles.logoPill}>
                <Image
                  source={require('../../../assets/logo/vaagbanda-logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.welcomeTitle}>
                  {sent ? 'Check your email' : 'Forgot password?'}
                </Text>
                <Text style={styles.welcomeSub}>
                  {sent
                    ? 'A reset link is on its way'
                    : "No worries — we'll send you a reset link"}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* ─── SHEET ─── */}
          <View style={styles.sheet}>
            {!sent ? (
              <>
                {/* FORM STATE */}
                <View style={styles.infoCard}>
                  <View style={styles.infoIconWrap}>
                    <Icon name="shield" size={18} color={COLORS.BLUE} />
                  </View>
                  <Text style={styles.infoText}>
                    Enter the email address linked to your account. We'll send
                    you a secure link to reset your password.
                  </Text>
                </View>

                <Text style={styles.label}>Email Address</Text>
                <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
                  <View style={[styles.field, focused && styles.fieldFocused]}>
                    <Icon
                      name="mail"
                      size={18}
                      color={focused ? COLORS.CRIMSON : COLORS.GRAY400}
                    />
                    <TextInput
                      ref={inputRef}
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@example.com"
                      placeholderTextColor={COLORS.GRAY400}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={true}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      onSubmitEditing={handleSubmit}
                      returnKeyType="send"
                    />
                  </View>
                </TouchableWithoutFeedback>

                {/* Validation hint */}
                {email.length > 0 && !isValidEmail(email) && (
                  <Text style={styles.hintError}>
                    Please enter a valid email address
                  </Text>
                )}

                {/* Send button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  style={{ marginTop: 20 }}
                >
                  {canSubmit ? (
                    <LinearGradient
                      colors={[COLORS.CRIMSON, COLORS.CRIMSON_DARK]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.btnPrimary}
                    >
                      <Icon name="send" size={16} color={COLORS.WHITE} />
                      <Text style={styles.btnPrimaryText}>
                        {submitting ? 'Sending…' : 'Send Reset Link'}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.btnPrimary, styles.btnDisabled]}>
                      <Text style={styles.btnDisabledText}>
                        {submitting ? 'Sending…' : 'Send Reset Link'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Back to login link */}
                <TouchableOpacity
                  onPress={onGoToLogin}
                  activeOpacity={0.6}
                  style={styles.backToLogin}
                >
                  <Icon name="back" size={14} color={COLORS.GRAY600} />
                  <Text style={styles.backToLoginText}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* SUCCESS STATE */}
                <View style={styles.successWrap}>
                  <View style={styles.successCircle}>
                    <Icon name="check" size={36} color={COLORS.SUCCESS} />
                  </View>

                  <Text style={styles.successTitle}>Reset link sent!</Text>
                  <Text style={styles.successSub}>
                    We've sent a password reset link to
                  </Text>
                  <Text style={styles.successEmail}>{email}</Text>

                  <View style={styles.tipsCard}>
                    <Text style={styles.tipsHeader}>What to do next:</Text>
                    <View style={styles.tipRow}>
                      <View style={styles.tipDot} />
                      <Text style={styles.tipText}>
                        Check your inbox (and spam folder)
                      </Text>
                    </View>
                    <View style={styles.tipRow}>
                      <View style={styles.tipDot} />
                      <Text style={styles.tipText}>
                        Tap the reset link within 30 minutes
                      </Text>
                    </View>
                    <View style={styles.tipRow}>
                      <View style={styles.tipDot} />
                      <Text style={styles.tipText}>
                        Create a new, strong password
                      </Text>
                    </View>
                  </View>

                  {/* Back to Sign In button */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={onGoToLogin}
                    style={{ marginTop: 24, width: '100%' }}
                  >
                    <LinearGradient
                      colors={[COLORS.CRIMSON, COLORS.CRIMSON_DARK]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.btnPrimary}
                    >
                      <Text style={styles.btnPrimaryText}>Back to Sign In</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Resend link */}
                  <View style={styles.resendRow}>
                    <Text style={styles.resendText}>Didn't get the email? </Text>
                    <TouchableOpacity onPress={handleResend} activeOpacity={0.6}>
                      <Text style={styles.resendLinkText}>Try again</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ─── STYLES ───────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.BLUE_DARK },
  scroll: { flex: 1, backgroundColor: COLORS.GHOST },
  scrollContent: { flexGrow: 1 },

  /* HEADER */
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 48,
    overflow: 'hidden',
    position: 'relative',
  },
  blob: { position: 'absolute', borderRadius: 999 },
  blob1: {
    top: -30,
    right: -30,
    width: 130,
    height: 130,
    backgroundColor: 'rgba(220,20,60,0.20)',
  },
  blob2: {
    bottom: -40,
    left: -20,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 16,
    zIndex: 1,
  },
  logoPill: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logoImage: { width: 56, height: 64 },
  welcomeTitle: {
    color: COLORS.WHITE,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  welcomeSub: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },

  /* SHEET */
  sheet: {
    backgroundColor: COLORS.WHITE,
    marginTop: -28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    flexGrow: 1,
    shadowColor: '#0F2640',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 30,
    elevation: 6,
  },

  /* INFO CARD (form state) */
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(26,43,95,0.04)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.BLUE,
    borderRadius: 10,
    padding: 14,
    marginBottom: 22,
  },
  infoIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(26,43,95,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.GRAY600,
    lineHeight: 18,
  },

  /* LABEL & FIELD */
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.GRAY600,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY200,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldFocused: {
    borderColor: COLORS.CRIMSON,
    shadowColor: COLORS.CRIMSON,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.GRAY800,
    fontWeight: '500',
    padding: 0,
    minHeight: 20,
  },
  hintError: {
    fontSize: 11,
    color: COLORS.CRIMSON,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '600',
  },

  /* PRIMARY BUTTON */
  btnPrimary: {
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.CRIMSON,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  btnPrimaryText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  btnDisabled: {
    backgroundColor: COLORS.GRAY200,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnDisabledText: {
    color: COLORS.GRAY400,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* BACK TO LOGIN */
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 22,
    paddingVertical: 8,
  },
  backToLoginText: {
    fontSize: 13,
    color: COLORS.GRAY600,
    fontWeight: '600',
  },

  /* SUCCESS STATE */
  successWrap: {
    alignItems: 'center',
    paddingTop: 12,
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.SUCCESS_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.SUCCESS,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.GRAY800,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  successSub: {
    fontSize: 13,
    color: COLORS.GRAY600,
    textAlign: 'center',
    lineHeight: 18,
  },
  successEmail: {
    fontSize: 14,
    color: COLORS.CRIMSON,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 24,
  },

  /* TIPS CARD */
  tipsCard: {
    width: '100%',
    backgroundColor: COLORS.GHOST,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.GRAY200,
  },
  tipsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.GRAY600,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.CRIMSON,
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.GRAY800,
    lineHeight: 19,
  },

  /* RESEND */
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  resendText: { fontSize: 13, color: COLORS.GRAY600 },
  resendLinkText: { fontSize: 13, color: COLORS.CRIMSON, fontWeight: '700' },
});

export default ForgotPasswordScreen;
