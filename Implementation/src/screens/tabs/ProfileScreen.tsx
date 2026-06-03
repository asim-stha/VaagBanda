import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Modal,
    Alert,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Svg, { Path, Line, Polyline } from 'react-native-svg';

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
            return <Svg {...props}><Polyline points="9 18 15 12 9 6" /></Svg>;
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

// Module-level cache keyed by userId — survives tab switches (unmount/remount)
// without re-fetching. Invalidates automatically when a different user signs in.
let _avatarCache: { userId: string; url: string } | null = null;

/* ─── AVATAR ───────────────────────────────────────────────── */
const Avatar = React.memo(({
    name, color, size = 64, imageUrl,
}: { name: string; color: string; size?: number; imageUrl?: string | null }) => {
    // displayUrl: what is actually visible. Only advances to a new value after
    // the new Image's onLoad fires — prevents any blank flash during transitions.
    const [displayUrl, setDisplayUrl] = useState<string | null>(imageUrl ?? null);
    const pending = !!imageUrl && imageUrl !== displayUrl;

    if (imageUrl || displayUrl) {
        return (
            <View style={[styles.avatarImgWrap, {
                width: size, height: size, borderRadius: size / 2,
                overflow: 'hidden', backgroundColor: color,
                justifyContent: 'center', alignItems: 'center',
            }]}>
                {displayUrl ? (
                    <Image source={{ uri: displayUrl }} style={{ width: size, height: size }} />
                ) : (
                    // No displayUrl yet (first load) — show letter while image arrives
                    <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
                        {name.charAt(0).toUpperCase()}
                    </Text>
                )}

                {/* Preload incoming URL at opacity 0; swap displayUrl only on success */}
                {pending && (
                    <Image
                        source={{ uri: imageUrl! }}
                        style={[StyleSheet.absoluteFillObject, { opacity: 0 }]}
                        onLoad={() => setDisplayUrl(imageUrl!)}
                        onError={() => setDisplayUrl(imageUrl!)}
                    />
                )}

                {/* Spinner on top of the existing image while new one loads */}
                {pending && (
                    <View style={[StyleSheet.absoluteFillObject, styles.avatarOverlay]}>
                        <ActivityIndicator size="small" color={COLORS.WHITE} />
                    </View>
                )}
            </View>
        );
    }

    return (
        <View style={[styles.avatar, {
            width: size, height: size, borderRadius: size / 2, backgroundColor: color,
        }]}>
            <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
                {name.charAt(0).toUpperCase()}
            </Text>
        </View>
    );
});

/* ─── TYPES ────────────────────────────────────────────────── */
interface UserInfo {
    name: string;
    email: string;
    avatarColor: string;
    avatarUrl?: string;
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

/* ─── CURRENCIES ───────────────────────────────────────────── */
const CURRENCIES = [
    { code: 'NPR', label: 'Nepalese Rupee' },
    { code: 'USD', label: 'US Dollar' },
    { code: 'EUR', label: 'Euro' },
    { code: 'INR', label: 'Indian Rupee' },
    { code: 'KRW', label: 'Korean Won' },
    { code: 'JPY', label: 'Japanese Yen' },
];

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
    const { user: authUser } = useAuth();
    const [stats, setStats] = useState({ groupCount: 0, expenseCount: 0, netBalance: 0 });
    const [defaultCurrency, setDefaultCurrency] = useState('NPR');
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);

    // avatarUrlRef persists across re-renders without triggering extra fetches.
    // Seed it from the module-level cache (survives tab switches) if the cached
    // entry belongs to the current user, otherwise fall back to authUser.
    const cachedForUser = _avatarCache?.userId === authUser?.id ? _avatarCache.url : null;
    const avatarUrlRef = useRef<string | null>(cachedForUser ?? authUser?.avatarUrl ?? null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(avatarUrlRef.current);

    // Sync whenever AuthContext delivers a fresh avatarUrl (e.g. after refreshAuth
    // following an upload). A one-time ?t= bust is added here — computed once in
    // the effect, stored in state, and never recalculated during render.
    useEffect(() => {
        const incoming = authUser?.avatarUrl;
        if (!incoming) return;
        const base = incoming.split('?')[0];
        const busted = `${base}?t=${Date.now()}`;
        if (busted === avatarUrlRef.current) return;
        _avatarCache = { userId: authUser!.id, url: busted };
        avatarUrlRef.current = busted;
        setAvatarUrl(busted);
    }, [authUser?.avatarUrl]);

    // Fallback: if AuthContext still hasn't populated avatarUrl (e.g. column
    // name mismatch caused fetchProfile to return undefined), do a single direct
    // DB fetch on mount. Guarded by the ref so it never runs more than once
    // per user session regardless of how many times the tab is focused.
    useEffect(() => {
        if (avatarUrlRef.current) return;
        let cancelled = false;
        (async () => {
            const { data: { user: supaUser } } = await supabase.auth.getUser();
            if (!supaUser || cancelled) return;
            const { data } = await supabase
                .from('profiles')
                .select('avatar_url')
                .eq('user_id', supaUser.id)
                .single();
            if (!cancelled && data?.avatar_url) {
                const busted = `${data.avatar_url.split('?')[0]}?t=${Date.now()}`;
                _avatarCache = { userId: supaUser.id, url: busted };
                avatarUrlRef.current = busted;
                setAvatarUrl(busted);
            }
        })();
        return () => { cancelled = true; };
    }, [authUser?.id]);

    useEffect(() => {
        apiService.getProfileStats()
            .then(({ data }) => setStats(data))
            .catch(() => {});
        AsyncStorage.getItem('default_currency').then((val) => {
            if (val) setDefaultCurrency(val);
        });
    }, []);

    const handleSelectCurrency = async (code: string) => {
        setDefaultCurrency(code);
        setShowCurrencyModal(false);
        try {
            await AsyncStorage.setItem('default_currency', code);
        } catch (err) {
            console.error('Failed to save currency', err);
        }
    };

    const settingsItems: (SettingsItem & { isLast?: boolean })[] = [
        { icon: '👤', label: 'Edit Profile', onPress: onEditProfile },
        { icon: '🔔', label: 'Notification Preferences', onPress: onNotificationPrefs },
        { icon: '💱', label: 'Default Currency', value: defaultCurrency, onPress: () => setShowCurrencyModal(true) },
        { icon: '🎨', label: 'Appearance', value: 'Coming Soon', onPress: () => Alert.alert('Coming Soon', 'Light, Dark, and System Default themes will be available in a future update.') },
        { icon: '🔒', label: 'Security & Privacy', onPress: onSecurityPrivacy },
        { icon: 'ℹ️', label: 'About VaagBanda', onPress: onAbout, isLast: true },
    ];

    return (
        <View style={styles.root}>
            <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={[COLORS.BLUE_DARK, COLORS.CRIMSON_DARK]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.blob} />
                    <Avatar
                        name={user?.name || 'User'}
                        color={user?.avatarColor || COLORS.CRIMSON}
                        size={72}
                        imageUrl={avatarUrl}
                    />
                    <Text style={styles.headerName}>{user?.name || 'User'}</Text>
                    <Text style={styles.headerEmail}>{user?.email || ''}</Text>
                    <TouchableOpacity onPress={onEditProfile} activeOpacity={0.7} style={styles.editPill}>
                        <Text style={styles.editPillText}>Edit Profile</Text>
                    </TouchableOpacity>
                </LinearGradient>

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

                <View style={styles.settingsCard}>
                    <Text style={styles.settingsHeader}>SETTINGS</Text>
                    {settingsItems.map((item, idx) => (
                        <SettingsRow key={item.label} {...item} isLast={idx === settingsItems.length - 1} />
                    ))}
                </View>

                <View style={styles.versionCard}>
                    <Image
                        source={require('../../../assets/logo/vaagbanda-logo.png')}
                        style={styles.versionLogo}
                        resizeMode="contain"
                    />
                    <Text style={styles.versionText}>VaagBanda v1.0.0</Text>
                    <Text style={styles.versionSub}>Scan · Split · Settle</Text>
                </View>

                <TouchableOpacity onPress={onLogout} activeOpacity={0.85} style={styles.logoutBtn}>
                    <Icon name="logout" size={18} color={COLORS.CRIMSON} />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={styles.footer}>Made with ❤️ by Team CyberSquadNp</Text>
            </ScrollView>

            <Modal
                visible={showCurrencyModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCurrencyModal(false)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowCurrencyModal(false)}
                    style={styles.modalBackdrop}
                >
                    <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Choose Default Currency</Text>
                        {CURRENCIES.map((c, idx) => {
                            const isSelected = c.code === defaultCurrency;
                            return (
                                <TouchableOpacity
                                    key={c.code}
                                    onPress={() => handleSelectCurrency(c.code)}
                                    style={[styles.currencyRow, idx !== CURRENCIES.length - 1 && styles.currencyRowBorder]}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.currencyInfo}>
                                        <Text style={[styles.currencyCode, isSelected && { color: COLORS.CRIMSON }]}>{c.code}</Text>
                                        <Text style={styles.currencyLabelModal}>{c.label}</Text>
                                    </View>
                                    {isSelected && <Text style={{ fontSize: 16 }}>✅</Text>}
                                </TouchableOpacity>
                            );
                        })}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
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
    avatarImgWrap: {
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.30)',
    },
    avatarOverlay: {
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
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
    statItem: { flex: 1, alignItems: 'center' },
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
    settingsIcon: { fontSize: 20, marginRight: 14 },
    settingsLabel: { flex: 1, fontSize: 14, color: COLORS.GRAY800, fontWeight: '600' },
    settingsRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    settingsValue: { fontSize: 12, color: COLORS.GRAY400, fontWeight: '600' },

    /* VERSION CARD */
    versionCard: { alignItems: 'center', marginTop: 24, paddingHorizontal: 20 },
    versionLogo: { width: 50, height: 56, opacity: 0.5 },
    versionText: { fontSize: 12, color: COLORS.GRAY400, fontWeight: '700', marginTop: 6 },
    versionSub: { fontSize: 10, color: COLORS.GRAY400, letterSpacing: 2, marginTop: 2, textTransform: 'uppercase' },

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
    logoutText: { fontSize: 14, color: COLORS.CRIMSON, fontWeight: '700' },

    /* FOOTER */
    footer: { textAlign: 'center', fontSize: 11, color: COLORS.GRAY400, marginTop: 16 },

    /* MODAL */
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15,38,64,0.6)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: COLORS.WHITE,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 22,
        paddingTop: 16,
        paddingBottom: 32,
    },
    modalHandle: {
        width: 40, height: 5,
        backgroundColor: COLORS.GRAY200,
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.GRAY800,
        marginBottom: 16,
        textAlign: 'center',
    },
    currencyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    currencyRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.GRAY100 },
    currencyInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    currencyCode: { fontSize: 16, fontWeight: '700', color: COLORS.GRAY800, width: 40 },
    currencyLabelModal: { fontSize: 14, color: COLORS.GRAY600, fontWeight: '500' },
});

export default React.memo(ProfileScreen);
