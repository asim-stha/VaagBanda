import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, StatusBar, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line, Polyline } from 'react-native-svg';

const C = { CRIMSON: '#DC143C', BLUE: '#1A2B5F', BLUE_DARK: '#0F1F4A', WHITE: '#FFFFFF', GHOST: '#F7F8FB', GRAY100: '#EEF1F6', GRAY200: '#E1E5EE', GRAY400: '#9AA3B5', GRAY600: '#5A6478', GRAY800: '#1F2A44' };

const Icon = ({ name, size = 18, color = C.GRAY400 }: { name: string; size?: number; color?: string }) => {
    const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    if (name === 'back') return <Svg {...p}><Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" /></Svg>;
    return null;
};

interface Pref { key: string; emoji: string; label: string; desc: string; }

const PREFS: Pref[] = [
    { key: 'expenses', emoji: '💰', label: 'New Expenses', desc: 'When someone adds an expense to your group' },
    { key: 'settlements', emoji: '✅', label: 'Settlements', desc: 'When someone records a payment to you' },
    { key: 'invites', emoji: '👋', label: 'Group Invitations', desc: 'When you get invited to join a group' },
    { key: 'reminders', emoji: '🔔', label: 'Payment Reminders', desc: 'Periodic reminders for outstanding balances' },
    { key: 'members', emoji: '👥', label: 'Member Changes', desc: 'When someone joins or leaves your group' },
    { key: 'updates', emoji: '📝', label: 'Expense Edits', desc: 'When an expense you participated in is edited' },
];

interface Props { onBack?: () => void; onSave?: (prefs: Record<string, boolean>) => void; }

const NotificationSettingsScreen: React.FC<Props> = ({ onBack, onSave }) => {
    const [prefs, setPrefs] = useState<Record<string, boolean>>(
        Object.fromEntries(PREFS.map(p => [p.key, true]))
    );

    const toggle = (key: string) => {
        setPrefs(prev => {
            const next = { ...prev, [key]: !prev[key] };
            onSave?.(next);
            return next;
        });
    };

    const allOn = Object.values(prefs).every(v => v);

    return (
        <SafeAreaView style={s.safe}>
            <StatusBar barStyle="light-content" backgroundColor={C.BLUE_DARK} />
            <LinearGradient colors={[C.BLUE_DARK, C.BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
                <View style={s.topRow}>
                    <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.iconBtn}><Icon name="back" size={18} color={C.WHITE} /></TouchableOpacity>
                    <Text style={s.headerTitle}>Notifications</Text>
                    <View style={{ width: 36 }} />
                </View>
                <Text style={s.headerSub}>Choose what you'd like to be notified about</Text>
            </LinearGradient>

            <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
                {/* Master toggle */}
                <View style={s.masterRow}>
                    <Text style={s.masterLabel}>ALL NOTIFICATIONS</Text>
                    <Switch
                        value={allOn}
                        onValueChange={() => {
                            const newVal = !allOn;
                            setPrefs(Object.fromEntries(PREFS.map(p => [p.key, newVal])));
                        }}
                        trackColor={{ false: C.GRAY200, true: C.CRIMSON + '60' }}
                        thumbColor={allOn ? C.CRIMSON : C.GRAY400}
                    />
                </View>

                <View style={s.card}>
                    {PREFS.map((p, i) => (
                        <View key={p.key} style={[s.prefRow, i < PREFS.length - 1 && s.prefRowBorder]}>
                            <Text style={s.prefEmoji}>{p.emoji}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={s.prefLabel}>{p.label}</Text>
                                <Text style={s.prefDesc}>{p.desc}</Text>
                            </View>
                            <Switch
                                value={prefs[p.key]}
                                onValueChange={() => toggle(p.key)}
                                trackColor={{ false: C.GRAY200, true: C.CRIMSON + '60' }}
                                thumbColor={prefs[p.key] ? C.CRIMSON : C.GRAY400}
                            />
                        </View>
                    ))}
                </View>

                <Text style={s.footerNote}>
                    Push notifications are delivered via Firebase Cloud Messaging (FCM).
                    You can also disable notifications in your device settings.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.GHOST },
    header: { paddingTop: 20, paddingHorizontal: 24, paddingBottom: 20 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: C.WHITE, fontSize: 16, fontWeight: '700' },
    headerSub: { color: 'rgba(255,255,255,0.70)', fontSize: 12, marginTop: 8, textAlign: 'center' },
    scroll: { flex: 1, paddingHorizontal: 20, paddingTop: 18 },
    masterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.WHITE, borderRadius: 14, padding: 16, marginBottom: 14, shadowColor: '#0F2640', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    masterLabel: { fontSize: 12, fontWeight: '800', color: C.GRAY800, letterSpacing: 1 },
    card: { backgroundColor: C.WHITE, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.GRAY200 },
    prefRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
    prefRowBorder: { borderBottomWidth: 1, borderBottomColor: C.GRAY100 },
    prefEmoji: { fontSize: 22 },
    prefLabel: { fontSize: 14, fontWeight: '700', color: C.GRAY800, marginBottom: 2 },
    prefDesc: { fontSize: 11, color: C.GRAY600, lineHeight: 15 },
    footerNote: { fontSize: 11, color: C.GRAY400, textAlign: 'center', marginTop: 20, lineHeight: 16, paddingHorizontal: 10 },
});

export default NotificationSettingsScreen;