import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';

const COLORS = {
  CRIMSON: '#DC143C',
  CRIMSON_DARK: '#A01030',
  BLUE: '#1A2B5F',
  BLUE_DARK: '#0F1F4A',
  BLUE_MID: '#2B3F75',
  WHITE: '#FFFFFF',
  GHOST: '#F7F8FB',
  GRAY400: '#9AA3B5',
  GRAY600: '#5A6478',
  GRAY200: '#E1E5EE',
};

const FingerprintIcon = ({ size = 64, color = COLORS.WHITE }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Path
      d="M32 8C19 8 10 18 10 30c0 8 2 14 5 20"
      stroke={color} strokeWidth={3} strokeLinecap="round"
    />
    <Path
      d="M54 30c0-12-9-22-22-22"
      stroke={color} strokeWidth={3} strokeLinecap="round"
    />
    <Path
      d="M32 20c-6 0-11 5-11 11 0 7 2 13 4 18"
      stroke={color} strokeWidth={3} strokeLinecap="round"
    />
    <Path
      d="M43 31c0-6-5-11-11-11"
      stroke={color} strokeWidth={3} strokeLinecap="round"
    />
    <Path
      d="M32 30c0 6 1 12 3 17"
      stroke={color} strokeWidth={3} strokeLinecap="round"
    />
    <Circle cx="32" cy="30" r="2.5" fill={color} />
  </Svg>
);

interface BiometricLockScreenProps {
  userName: string;
  onUnlocked: () => void;
  onUsePassword: () => void;
}

const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({
  userName,
  onUnlocked,
  onUsePassword,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoTriggered, setAutoTriggered] = useState(false);

  const handleBiometric = async () => {
    setLoading(true);
    setError(null);
    try {
      await onUnlocked();
    } catch {
      setError('Biometric authentication failed. Try again or use your password.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-prompt on mount
  useEffect(() => {
    if (!autoTriggered) {
      setAutoTriggered(true);
      const timer = setTimeout(handleBiometric, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  const firstName = userName.split(' ')[0] || 'back';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BLUE_DARK} />
      <LinearGradient
        colors={[COLORS.BLUE_DARK, COLORS.BLUE, COLORS.BLUE_MID]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bg}
      >
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />

        <View style={styles.content}>
          <View style={styles.logoPill}>
            <Image
              source={require('../../../assets/logo/vaagbanda-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{firstName}</Text>

          <View style={styles.iconRing}>
            <View style={styles.iconRingInner}>
              <FingerprintIcon size={56} color={COLORS.WHITE} />
            </View>
          </View>

          <Text style={styles.hint}>
            Use your fingerprint or Face ID{'\n'}to unlock VaagBanda
          </Text>

          {error && (
            <Text style={styles.error}>{error}</Text>
          )}

          <TouchableOpacity
            style={styles.btnPrimaryWrapper}
            onPress={handleBiometric}
            activeOpacity={0.85}
            disabled={loading}
          >
            <LinearGradient
              colors={[COLORS.CRIMSON, COLORS.CRIMSON_DARK]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btnPrimary}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.WHITE} size="small" />
              ) : (
                <Text style={styles.btnPrimaryText}>Unlock with Biometrics</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={onUsePassword}
            activeOpacity={0.7}
          >
            <Text style={styles.btnSecondaryText}>Use Password Instead</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.BLUE_DARK },
  bg: { flex: 1 },

  blob: { position: 'absolute', borderRadius: 999 },
  blob1: { top: -60, right: -60, width: 220, height: 220, backgroundColor: 'rgba(220,20,60,0.18)' },
  blob2: { bottom: -60, left: -60, width: 180, height: 180, backgroundColor: 'rgba(255,255,255,0.06)' },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 0,
  },

  logoPill: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  logoImage: { width: 90, height: 106 },

  greeting: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  name: {
    color: COLORS.WHITE,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 32,
  },

  iconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconRingInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  hint: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 12,
  },

  error: {
    color: '#FF8A9B',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },

  btnPrimaryWrapper: {
    width: '100%',
    marginTop: 16,
    shadowColor: COLORS.CRIMSON,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  btnPrimary: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  btnSecondary: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  btnSecondaryText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default BiometricLockScreen;
