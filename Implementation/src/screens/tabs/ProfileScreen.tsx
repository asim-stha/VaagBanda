/**
 * VaagBanda — ProfileScreen.tsx
 * User profile and settings — matching the mockup exactly.
 *
 * Maps to SRS §3.1 (Profile tab: user settings and preferences)
 * Renders as a tab view inside HomeScreen.
 *
 * ─── Required dependencies ───
 *   npx expo install expo-linear-gradient react-native-svg
 */

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/apiService';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';

/* ─── BRAND TOKENS ─────────────────────────────────────────── */
const COLORS = {
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
};

/* ─── ICONS ────────────────────────────────────────────────── */
type IconName = 'chevron' | 'logout';

const Icon = ({
    name, size = 18, color = COLORS.GRAY400,
}: { name: IconName; size?: number; color?: string }) => {
    const props = {
        width: size, height: size, viewBox: '0 0 24 24',
        fill: 'none', stroke: color, strokeWidth: 2,
        strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    };
    switch (name) {
        case 'chevron':
            return (
                <Svg {...props}>
                    <Polyline points="9 18 15 12 9 6" />
                </Svg>
            );
        case 'logout':
            return (
                <Svg {...props}>
                    <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <Polyline points="16 17 21 12 16 7" />
                    <Line x1="21" y1="12" x2="9" y2="12" />
                </Svg>
            );
        default: return null;
    }
};

/* ─── AVATAR ───────────────────────────────────────────────── */
const Avatar = ({
    name, color, size = 64,
}: { name: string; color: string; size?: number }) => (
    <View style={[styles.avatar, {
        width: size, height: size, borderRadius: size / 2, backgroundColor: color,
    }]}>
        <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
            {name.charAt(0).toUpperCase()}
        </Text>
    </View>
);

/* ─── TYPES ────────────────────────────────────────────────── */
interface UserInfo {
    name: string;
    email: string;
    avatarColor: string;
}

interface SettingsItem {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
}


/* ─── PROPS ────────────────────────────────────────────────── */
interface ProfileScreenProps {
    user?: UserInfo;
    onEditProfile?: () => void;
    onNotificationPrefs?: () => void;
    onDefaultCurrency?: () => void;
    onSecurityPrivacy?: () => void;
    onAbout?: () => void;
    onLogout?: () => void;
}

/* ─── SETTINGS ROW ─────────────────────────────────────────── */
const SettingsRow = ({
    icon, label, value, onPress, isLast = false,
}: SettingsItem & { isLast?: boolean }) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.settingsRow, !isLast && styles.settingsRowBorder]}
    >
        <Text style={styles.settingsIcon}>{icon}</Text>
        <Text style={styles.settingsLabel}>{label}</Text>
        <View style={styles.settingsRight}>
            {value && <Text style={styles.settingsValue}>{value}</Text>}
            <Icon name="chevron" size={16} color={COLORS.GRAY400} />
        </View>
    </TouchableOpacity>
);

/* ─── MAIN COMPONENT ───────────────────────────────────────── */
const ProfileScreen: React.FC<ProfileScreenProps> = ({
    user,
    onEditProfile,
    onNotificationPrefs,
    onDefaultCurrency,
    onSecurityPrivacy,
    onAbout,
    onLogout,
}) => {
    const [stats, setStats] = useState({ groupCount: 0, expenseCount: 0, netBalance: 0 });

    useEffect(() => {
        apiService.getProfileStats()
            .then(({ data }) => setStats(data))
            .catch(() => {});
    }, []);
    const settingsItems: (SettingsItem & { isLast?: boolean })[] = [
        { icon: '👤', label: 'Edit Profile', onPress: onEditProfile },
        { icon: '🔔', label: 'Notification Preferences', onPress: onNotificationPrefs },
        { icon: '💱', label: 'Default Currency', value: 'NPR', onPress: onDefaultCurrency },
        { icon: '🔒', label: 'Security & Privacy', onPress: onSecurityPrivacy },
        { icon: 'ℹ️', label: 'About VaagBanda', onPress: onAbout, isLast: true },
    ];

    return (
        <View style={styles.root}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: 30 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header — diagonal crimson/navy gradient (matches mockup) */}
                <LinearGradient
                    colors={[COLORS.BLUE_DARK, COLORS.CRIMSON_DARK]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    {/* Decorative blob */}
                    <View style={styles.blob} />

                    <Avatar name={user?.name || 'User'} color={user?.avatarColor || COLORS.CRIMSON} size={72} />
                    <Text style={styles.headerName}>{user?.name || 'User'}</Text>
                    <Text style={styles.headerEmail}>{user?.email || ''}</Text>

                    {/* Edit profile pill */}
                    <TouchableOpacity
                        onPress={onEditProfile}
                        activeOpacity={0.7}
                        style={styles.editPill}
                    >
                        <Text style={styles.editPillText}>Edit Profile</Text>
                    </TouchableOpacity>
                </LinearGradient>

                {/* Stats row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{stats.groupCount}</Text>
                        <Text style={styles.statLabel}>Groups</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{stats.expenseCount}</Text>
                        <Text style={styles.statLabel}>Expenses</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: stats.netBalance >= 0 ? '#27AE60' : '#DC143C' }]}>
                            {stats.netBalance >= 0 ? '+' : ''}{stats.netBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </Text>
                        <Text style={styles.statLabel}>Net balance</Text>
                    </View>
                </View>

                {/* Settings list */}
                <View style={styles.settingsCard}>
                    <Text style={styles.settingsHeader}>SETTINGS</Text>
                    {settingsItems.map((item, idx) => (
                        <SettingsRow
                            key={item.label}
                            {...item}
                            isLast={idx === settingsItems.length - 1}
                        />
                    ))}
                </View>

                {/* App version */}
                <View style={styles.versionCard}>
                    <Image
                        source={require('../../../assets/logo/vaagbanda-logo.png')}
                        style={styles.versionLogo}
                        resizeMode="contain"
                    />
                    <Text style={styles.versionText}>VaagBanda v1.0.0</Text>
                    <Text style={styles.versionSub}>
                        Scan · Split · Settle
                    </Text>
                </View>

                {/* Sign out button */}
                <TouchableOpacity
                    onPress={onLogout}
                    activeOpacity={0.85}
                    style={styles.logoutBtn}
                >
                    <Icon name="logout" size={18} color={COLORS.CRIMSON} />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>

                {/* Footer credit */}
                <Text style={styles.footer}>
                    Made with ❤️ by Team CyberSquadNp
                </Text>
            </ScrollView>
        </View>
    );
};

/* ─── STYLES ───────────────────────────────────────────────── */
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.GHOST },

    /* HEADER */
    header: {
        paddingTop: 32,
        paddingBottom: 28,
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    blob: {
        position: 'absolute',
        top: -50, left: -50,
        width: 180, height: 180,
        borderRadius: 9999,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    headerName: {
        color: COLORS.WHITE,
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.3,
        marginTop: 12,
    },
    headerEmail: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 12,
        marginTop: 4,
    },
    editPill: {
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.20)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.30)',
    },
    editPillText: {
        color: COLORS.WHITE,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    /* AVATAR */
    avatar: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.30)',
    },
    avatarText: {
        color: COLORS.WHITE,
        fontWeight: '700',
    },

    /* STATS ROW */
    statsRow: {
        flexDirection: 'row',
        backgroundColor: COLORS.WHITE,
        marginHorizontal: 20,
        marginTop: -18,
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 12,
        shadowColor: '#0F2640',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        zIndex: 2,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.GRAY800,
        letterSpacing: -0.3,
    },
    statLabel: {
        fontSize: 10,
        color: COLORS.GRAY600,
        fontWeight: '600',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: COLORS.GRAY200,
        alignSelf: 'center',
    },

    /* SETTINGS CARD */
    settingsCard: {
        backgroundColor: COLORS.WHITE,
        marginHorizontal: 20,
        marginTop: 18,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#0F2640',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    settingsHeader: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.GRAY600,
        letterSpacing: 1.5,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 8,
    },
    settingsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    settingsRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.GRAY100,
    },
    settingsIcon: {
        fontSize: 20,
        marginRight: 14,
    },
    settingsLabel: {
        flex: 1,
        fontSize: 14,
        color: COLORS.GRAY800,
        fontWeight: '600',
    },
    settingsRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    settingsValue: {
        fontSize: 12,
        color: COLORS.GRAY400,
        fontWeight: '600',
    },

    /* VERSION CARD */
    versionCard: {
        alignItems: 'center',
        marginTop: 24,
        paddingHorizontal: 20,
    },
    versionLogo: {
        width: 50,
        height: 56,
        opacity: 0.5,
    },
    versionText: {
        fontSize: 12,
        color: COLORS.GRAY400,
        fontWeight: '700',
        marginTop: 6,
    },
    versionSub: {
        fontSize: 10,
        color: COLORS.GRAY400,
        letterSpacing: 2,
        marginTop: 2,
        textTransform: 'uppercase',
    },

    /* LOGOUT */
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 20,
        marginTop: 22,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: COLORS.WHITE,
        borderWidth: 1.5,
        borderColor: COLORS.CRIMSON,
    },
    logoutText: {
        fontSize: 14,
        color: COLORS.CRIMSON,
        fontWeight: '700',
    },

    /* FOOTER */
    footer: {
        textAlign: 'center',
        fontSize: 11,
        color: COLORS.GRAY400,
        marginTop: 16,
    },
});

export default ProfileScreen;