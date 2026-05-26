import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/* ─── BRAND TOKENS ─────────────────────────────────────────── */
const COLORS = {
  CRIMSON: '#DC143C',
  CRIMSON_DARK: '#A01030',
  BLUE: '#1A2B5F',
  BLUE_DARK: '#0F1F4A',
  BLUE_MID: '#2B3F75',
  WHITE: '#FFFFFF',
};

/* ─── PROPS ────────────────────────────────────────────────── */
interface SplashScreenProps {
  onDone?: () => void;
  duration?: number;
}

/* ─── MAIN SCREEN ──────────────────────────────────────────── */
const SplashScreen: React.FC<SplashScreenProps> = ({
  onDone,
  duration = 2200,
}) => {
  // Animated values
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  const titleY = useRef(new Animated.Value(12)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  const taglineY = useRef(new Animated.Value(12)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  const progress = useRef(new Animated.Value(0)).current;

  /* ─── RUN ONCE ───────────────────────────────────────────── */
  useEffect(() => {
    Animated.parallel([
      // Logo animation
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),

        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),

      // Title animation
      Animated.sequence([
        Animated.delay(300),

        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),

          Animated.timing(titleY, {
            toValue: 0,
            duration: 700,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),

      // Tagline animation
      Animated.sequence([
        Animated.delay(500),

        Animated.parallel([
          Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),

          Animated.timing(taglineY, {
            toValue: 0,
            duration: 700,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),

      // Progress animation
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();

    // Navigate after splash duration
    const timer = setTimeout(() => {
      onDone?.();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  // Progress width animation
  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.BLUE_DARK}
      />

      <LinearGradient
        colors={[COLORS.BLUE_DARK, COLORS.BLUE, COLORS.CRIMSON_DARK]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative blobs */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      {/* Main content */}
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoPill,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('../../../assets/logo/vaagbanda-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Wordmark */}
        <Animated.Text
          style={[
            styles.wordmark,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleY }],
            },
          ]}
        >
          VaagBanda
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineY }],
            },
          ]}
        >
          SCAN · SPLIT · SETTLE
        </Animated.Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[styles.progressFill, { width: progressWidth }]}
        />
      </View>

      {/* Footer */}
      <Text style={styles.footer}>BY CYBERSQUADNP</Text>
    </View>
  );
};

/* ─── STYLES ───────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.BLUE_DARK,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },

  blob1: {
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(220,20,60,0.25)',
  },

  blob2: {
    bottom: -80,
    left: -80,
    width: 240,
    height: 240,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  content: {
    alignItems: 'center',
    zIndex: 2,
  },

  logoPill: {
    backgroundColor: COLORS.WHITE,
    padding: 22,
    borderRadius: 28,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.3,
    shadowRadius: 35,

    elevation: 20,
  },

  logoImage: {
    width: 140,
    height: 162,
  },

  wordmark: {
    marginTop: 28,
    color: COLORS.WHITE,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },

  tagline: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 5,
    textTransform: 'uppercase',
  },

  progressTrack: {
    position: 'absolute',
    bottom: 80,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 2,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: COLORS.WHITE,
    borderRadius: 2,
  },

  footer: {
    position: 'absolute',
    bottom: 32,
    color: 'rgba(255,255,255,0.50)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
});

export default SplashScreen;