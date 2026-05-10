
import React, { useState } from 'react';
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
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path,
  Rect,
  Circle,
  Line,
  Polyline,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';

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
};

/* ─── ICONS (react-native-svg) ─────────────────────────────── */
type IconName =
  | 'mail'
  | 'lock'
  | 'eye'
  | 'eyeOff'
  | 'fingerprint';

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
  };

  switch (name) {
    case 'mail':
      return (
        <Svg {...props}>
          <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <Polyline points="22,6 12,13 2,6" />
        </Svg>
      );
    case 'lock':
      return (
        <Svg {...props}>
          <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <Path d="M7 11V7a5 5 0 0110 0v4" />
        </Svg>
      );
    case 'eye':
      return (
        <Svg {...props}>
          <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <Circle cx="12" cy="12" r="3" />
        </Svg>
      );
    case 'eyeOff':
      return (
        <Svg {...props}>
          <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
          <Line x1="1" y1="1" x2="23" y2="23" />
        </Svg>
      );
    case 'fingerprint':
      return (
        <Svg {...props}>
          <Path d="M12 11c0 5-3 7-3 7" />
          <Path d="M14 13c0 2-1 4-1 4" />
          <Path d="M9 4.5C10 4 11 4 12 4c4 0 7 3 7 7v3" />
          <Path d="M5 9c0-2 2-4 4-4.5" />
        </Svg>
      );
    default:
      return null;
  }
};

/* ─── LOGO MARK ────────────────────────────────────────────── */
const LogoMark = ({ size = 72 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 96 96">
    <Defs>
      <SvgLinearGradient id="frameGrad" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor={COLORS.CRIMSON} />
        <Stop offset="1" stopColor={COLORS.BLUE} />
      </SvgLinearGradient>
    </Defs>

    {/* Scanner corner brackets */}
    <Path d="M 12 24 L 12 12 L 24 12" stroke="url(#frameGrad)" strokeWidth={3} fill="none" />
    <Path d="M 72 12 L 84 12 L 84 24" stroke="url(#frameGrad)" strokeWidth={3} fill="none" />
    <Path d="M 12 72 L 12 84 L 24 84" stroke="url(#frameGrad)" strokeWidth={3} fill="none" />
    <Path d="M 72 84 L 84 84 L 84 72" stroke="url(#frameGrad)" strokeWidth={3} fill="none" />

    {/* Barcode bars */}
    <Rect x="22" y="28" width="3" height="40" fill={COLORS.BLUE} />
    <Rect x="28" y="28" width="2" height="40" fill={COLORS.BLUE} />
    <Rect x="33" y="28" width="4" height="40" fill={COLORS.BLUE} />
    <Rect x="40" y="28" width="2" height="40" fill={COLORS.BLUE} />
    <Rect x="45" y="28" width="3" height="40" fill={COLORS.BLUE} />
    <Rect x="51" y="28" width="2" height="40" fill={COLORS.BLUE} />
    <Rect x="56" y="28" width="4" height="40" fill={COLORS.BLUE} />
    <Rect x="63" y="28" width="2" height="40" fill={COLORS.BLUE} />
    <Rect x="68" y="28" width="3" height="40" fill={COLORS.BLUE} />

    {/* Crimson laser */}
    <Rect x="18" y="46" width="60" height="3" fill={COLORS.CRIMSON} rx={1.5} />
  </Svg>
);

/* ─── SOCIAL ICONS ─────────────────────────────────────────── */
const GoogleIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 48 48">
    <Path
      fill="#FFC107"
      d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 8 3l5.7-5.7C33.8 6.1 29.1 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"
    />
    <Path
      fill="#FF3D00"
      d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 8 3l5.7-5.7C33.8 6.1 29.1 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
    />
    <Path
      fill="#4CAF50"
      d="M24 44c5 0 9.6-1.9 13-5l-6-5c-2 1.4-4.4 2-7 2-5.2 0-9.6-3.3-11.3-8L6.1 32.6C9.4 39.6 16.1 44 24 44z"
    />
    <Path
      fill="#1976D2"
      d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6 5c-.4.4 6.4-4.7 6.4-14.7 0-1.3-.1-2.7-.4-3.9z"
    />
  </Svg>
);

const AppleIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path
      fill="#000"
      d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
    />
  </Svg>
);

/* ─── PROPS ────────────────────────────────────────────────── */
interface LoginScreenProps {
  onLogin?: () => void;
  onGoToSignup?: () => void;
  onForgotPassword?: () => void;
  onBiometricLogin?: () => void;
  onGoogleLogin?: () => void;
  onAppleLogin?: () => void;
}

/* ─── INPUT FIELD COMPONENT ────────────────────────────────── */
interface InputFieldProps {
  icon: IconName;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
  rightSlot?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  rightSlot,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.field,
        focused && styles.fieldFocused,
      ]}
    >
      <Icon
        name={icon}
        size={18}
        color={focused ? COLORS.CRIMSON : COLORS.GRAY400}
      />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.GRAY400}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {rightSlot}
    </View>
  );
};

/* ─── MAIN SCREEN ──────────────────────────────────────────── */
const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onGoToSignup,
  onForgotPassword,
  onBiometricLogin,
  onGoogleLogin,
  onAppleLogin,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

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
          {/* ─── HEADER (gradient + logo) ─── */}
          <LinearGradient
            colors={[COLORS.BLUE_DARK, COLORS.BLUE, COLORS.BLUE_MID]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            {/* Decorative blobs */}
            <View style={[styles.blob, styles.blob1]} />
            <View style={[styles.blob, styles.blob2]} />

            <View style={styles.headerInner}>
              <View style={styles.logoPill}>
                <LogoMark size={72} />
              </View>
              <Text style={styles.welcomeTitle}>Welcome back</Text>
              <Text style={styles.welcomeSub}>
                Sign in to keep your splits in sync
              </Text>
            </View>
          </LinearGradient>

          {/* ─── SHEET (white card) ─── */}
          <View style={styles.sheet}>
            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <InputField
              icon="mail"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
            />

            <View style={{ height: 14 }} />

            {/* Password */}
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={onForgotPassword} activeOpacity={0.6}>
                <Text style={styles.forgot}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <InputField
              icon="lock"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPwd}
              rightSlot={
                <TouchableOpacity
                  onPress={() => setShowPwd(!showPwd)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon
                    name={showPwd ? 'eyeOff' : 'eye'}
                    size={18}
                    color={COLORS.GRAY400}
                  />
                </TouchableOpacity>
              }
            />

            {/* Sign In Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onLogin}
              style={{ marginTop: 20 }}
            >
              <LinearGradient
                colors={[COLORS.CRIMSON, COLORS.CRIMSON_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.btnPrimary}
              >
                <Text style={styles.btnPrimaryText}>Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Biometric (SRS 4.1.3 + AuthDB.BiometricAuth) */}
            <TouchableOpacity
              style={styles.biometric}
              onPress={onBiometricLogin}
              activeOpacity={0.7}
            >
              <Icon name="fingerprint" size={16} color={COLORS.BLUE} />
              <Text style={styles.biometricText}>
                Use Face ID / Fingerprint
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons (SRS 4.1.3) */}
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={onGoogleLogin}
                activeOpacity={0.7}
              >
                <GoogleIcon />
                <Text style={styles.socialLabel}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={onAppleLogin}
                activeOpacity={0.7}
              >
                <AppleIcon />
                <Text style={styles.socialLabel}>Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Footer link to signup */}
            <View style={styles.footerLink}>
              <Text style={styles.footerText}>New to VaagBanda? </Text>
              <TouchableOpacity onPress={onGoToSignup} activeOpacity={0.6}>
                <Text style={styles.footerLinkText}>Create an account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ─── STYLES ───────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BLUE_DARK,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.GHOST,
  },
  scrollContent: {
    flexGrow: 1,
  },

  /* HEADER */
  header: {
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 64,
    overflow: 'hidden',
    position: 'relative',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blob1: {
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    backgroundColor: 'rgba(220,20,60,0.20)',
  },
  blob2: {
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerInner: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoPill: {
    backgroundColor: COLORS.WHITE,
    padding: 14,
    borderRadius: 22,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  welcomeTitle: {
    color: COLORS.WHITE,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    // fontFamily: 'PlayfairDisplay_800ExtraBold', // uncomment after loading fonts
  },
  welcomeSub: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 13,
    marginTop: 4,
    // fontFamily: 'DMSans_500Medium',
  },

  /* SHEET */
  sheet: {
    backgroundColor: COLORS.WHITE,
    marginTop: -36,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    flex: 1,
    shadowColor: '#0F2640',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 30,
    elevation: 6,
    zIndex: 2,
  },

  /* LABEL */
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.GRAY600,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    // fontFamily: 'DMSans_700Bold',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgot: {
    fontSize: 11,
    color: COLORS.CRIMSON,
    fontWeight: '600',
    // fontFamily: 'DMSans_600SemiBold',
  },

  /* INPUT FIELD */
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
    // fontFamily: 'DMSans_500Medium',
  },

  /* PRIMARY BUTTON */
  btnPrimary: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
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
    // fontFamily: 'DMSans_700Bold',
  },

  /* BIOMETRIC */
  biometric: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(26,43,95,0.04)',
    borderRadius: 12,
  },
  biometricText: {
    fontSize: 12,
    color: COLORS.BLUE,
    fontWeight: '600',
    // fontFamily: 'DMSans_600SemiBold',
  },

  /* DIVIDER */
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 22,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.GRAY200,
  },
  dividerText: {
    fontSize: 11,
    color: COLORS.GRAY400,
    fontWeight: '500',
    letterSpacing: 1,
    // fontFamily: 'DMSans_500Medium',
  },

  /* SOCIAL */
  socialRow: {
    flexDirection: 'row',
    gap: 10,
  },
  socialBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY200,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.GRAY800,
    // fontFamily: 'DMSans_600SemiBold',
  },

  /* FOOTER LINK */
  footerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 26,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.GRAY600,
    // fontFamily: 'DMSans_500Medium',
  },
  footerLinkText: {
    fontSize: 13,
    color: COLORS.CRIMSON,
    fontWeight: '700',
    // fontFamily: 'DMSans_700Bold',
  },
});

export default LoginScreen;
