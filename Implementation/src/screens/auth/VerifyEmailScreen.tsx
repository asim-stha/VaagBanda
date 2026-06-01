import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, // ActivityIndicator used by resend spinner
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Polyline } from 'react-native-svg';

const COLORS = {
  CRIMSON: '#DC143C',
  CRIMSON_DARK: '#A01030',
  BLUE_DARK: '#0F1F4A',
  WHITE: '#FFFFFF',
  GHOST: '#F7F8FB',
  GRAY200: '#E1E5EE',
  GRAY400: '#9AA3B5',
  GRAY600: '#5A6478',
  GRAY800: '#1F2A44',
  GREEN: '#27AE60',
};

interface Props {
  email: string;
  onResend: () => Promise<void>;
  onGoToLogin: () => void;
}

const VerifyEmailScreen: React.FC<Props> = ({ email, onResend, onGoToLogin }) => {
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const handleResend = async () => {

    setResending(true);
    setResendMsg(null);
    try {
      await onResend();
      setResendMsg('Email resent — check your inbox.');
      setResendCooldown(true);
      setTimeout(() => setResendCooldown(false), 30_000);
    } catch (e: any) {
      setResendMsg(e.message || 'Could not resend email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BLUE_DARK} />
      <LinearGradient
        colors={[COLORS.BLUE_DARK, COLORS.CRIMSON_DARK]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />
      </LinearGradient>

      <View style={styles.sheet}>
        {/* Mail icon */}
        <View style={styles.iconWrap}>
          <Svg width={40} height={40} viewBox="0 0 24 24" fill="none"
            stroke={COLORS.CRIMSON} strokeWidth={1.5}
            strokeLinecap="round" strokeLinejoin="round"
          >
            <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <Polyline points="22,6 12,13 2,6" />
          </Svg>
        </View>

        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.sub}>
          We sent a confirmation link to
        </Text>
        <Text style={styles.email}>{email}</Text>
        <Text style={styles.instruction}>
          Click the link in the email to activate your account. This screen will update automatically.
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleResend}
          disabled={resending || resendCooldown}
          style={[styles.btnSecondary, (resending || resendCooldown) && styles.btnSecondaryDisabled]}
        >
          {resending
            ? <ActivityIndicator color={COLORS.CRIMSON} size="small" />
            : <Text style={[styles.btnSecondaryText, (resendCooldown) && { color: COLORS.GRAY400 }]}>
                Resend email
              </Text>
          }
        </TouchableOpacity>

        {resendMsg && (
          <Text style={[styles.resendMsg, resendMsg.startsWith('Email resent') && { color: COLORS.GREEN }]}>
            {resendMsg}
          </Text>
        )}

        <TouchableOpacity onPress={onGoToLogin} activeOpacity={0.6} style={styles.backLink}>
          <Text style={styles.backLinkText}>Back to sign in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BLUE_DARK },
  header: {
    height: 160,
    overflow: 'hidden',
    position: 'relative',
  },
  blob: { position: 'absolute', borderRadius: 999 },
  blob1: { top: -30, right: -30, width: 130, height: 130, backgroundColor: 'rgba(255,255,255,0.08)' },
  blob2: { bottom: -40, left: -20, width: 100, height: 100, backgroundColor: 'rgba(220,20,60,0.25)' },

  sheet: {
    backgroundColor: COLORS.WHITE,
    flex: 1,
    marginTop: -28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 32,
    alignItems: 'center',
  },

  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#FFF0F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.GRAY800,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  sub: {
    fontSize: 14,
    color: COLORS.GRAY600,
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.CRIMSON,
    marginTop: 2,
    marginBottom: 12,
  },
  instruction: {
    fontSize: 13,
    color: COLORS.GRAY400,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },

  errorBox: {
    backgroundColor: '#FFF0F3',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: COLORS.CRIMSON,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  btnPrimaryWrap: { width: '100%', marginBottom: 12 },
  btnPrimary: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: COLORS.CRIMSON,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  btnPrimaryText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  btnSecondary: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.GRAY200,
    marginBottom: 8,
  },
  btnSecondaryDisabled: { borderColor: COLORS.GRAY200 },
  btnSecondaryText: {
    color: COLORS.CRIMSON,
    fontSize: 14,
    fontWeight: '600',
  },

  resendMsg: {
    fontSize: 12,
    color: COLORS.GRAY400,
    marginBottom: 8,
    textAlign: 'center',
  },

  backLink: { marginTop: 16 },
  backLinkText: {
    fontSize: 13,
    color: COLORS.GRAY600,
    fontWeight: '600',
  },
});

export default VerifyEmailScreen;
