import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import { apiService, MemberTransaction } from '../../services/apiService';
import Svg, { Line, Polyline } from 'react-native-svg';

const C = { CRIMSON: '#DC143C', CRIMSON_DARK: '#A01030', BLUE: '#1A2B5F', BLUE_DARK: '#0F1F4A', WHITE: '#FFFFFF', GHOST: '#F7F8FB', GRAY100: '#EEF1F6', GRAY200: '#E1E5EE', GRAY400: '#9AA3B5', GRAY600: '#5A6478', GRAY800: '#1F2A44', SUCCESS: '#27AE60' };

const Icon = ({ name, size = 18, color = C.GRAY400 }: { name: string; size?: number; color?: string }) => {
    const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    if (name === 'back') return <Svg {...p}><Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" /></Svg>;
    return null;
};

const Avatar = ({ name, color, size = 36 }: { name: string; color: string; size?: number }) => (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
        <Text style={[s.avatarText, { fontSize: size * 0.4 }]}>{name.charAt(0).toUpperCase()}</Text>
    </View>
);

const fmt = (n: number) => Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
    groupId?: string; memberId?: string;
    memberName?: string; memberColor?: string; currency?: string;
    onBack?: () => void;
}

const MemberHistoryScreen: React.FC<Props> = ({
    groupId = '', memberId = '',
    memberName = '', memberColor = C.BLUE, currency = 'NPR',
    onBack,
}) => {
    const [transactions, setTransactions] = useState<MemberTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!groupId || !memberId) { setLoading(false); return; }
        apiService.getMemberHistory(groupId, memberId)
            .then(({ data }) => setTransactions(data))
            .catch(() => setTransactions([]))
            .finally(() => setLoading(false));
    }, [groupId, memberId]);

    const netBalance = transactions.reduce((acc, t) => acc + t.amount, 0);
    const isOwed = netBalance > 0;
    const owes = netBalance < 0;
    const balColor = isOwed ? C.SUCCESS : owes ? C.CRIMSON : C.GRAY600;

    return (
        <SafeAreaView style={s.safe}>
            <StatusBar barStyle="light-content" backgroundColor={C.BLUE_DARK} />
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <LinearGradient colors={[C.BLUE_DARK, C.BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
                    <View style={s.topRow}>
                        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.iconBtn}><Icon name="back" size={18} color={C.WHITE} /></TouchableOpacity>
                        <Text style={s.headerTitle}>History</Text>
                        <View style={{ width: 36 }} />
                    </View>
                    <View style={s.profileCard}>
                        <Avatar name={memberName} color={memberColor} size={56} />
                        <Text style={s.profileName}>You & {memberName}</Text>
                        <View style={s.netRow}>
                            <Text style={[s.netAmount, { color: balColor }]}>
                                {netBalance === 0 ? 'Settled up' : `${isOwed ? 'They owe you' : 'You owe'} ${fmt(netBalance)} ${currency}`}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={s.sheet}>
                    <Text style={s.sectionLabel}>ALL TRANSACTIONS</Text>
                    {loading ? (
                        <Text style={{ color: C.GRAY600, fontSize: 13, textAlign: 'center', marginTop: 20 }}>Loading…</Text>
                    ) : transactions.length === 0 ? (
                        <Text style={{ color: C.GRAY600, fontSize: 13, textAlign: 'center', marginTop: 20 }}>No transactions yet</Text>
                    ) : transactions.map((t, i) => {
                        const isPositive = t.amount > 0;
                        return (
                            <View key={t.id} style={[s.txRow, i < transactions.length - 1 && s.txRowBorder]}>
                                <Text style={s.txEmoji}>{t.emoji}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.txDesc}>{t.description}</Text>
                                    <Text style={s.txMeta}>{t.type === 'settlement' ? 'Settlement' : 'Expense'} · {t.date}</Text>
                                </View>
                                <Text style={[s.txAmount, { color: isPositive ? C.SUCCESS : C.CRIMSON }]}>
                                    {isPositive ? '+' : '-'}{fmt(t.amount)} {currency}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.GHOST },
    header: { paddingTop: 20, paddingHorizontal: 24, paddingBottom: 24 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: C.WHITE, fontSize: 16, fontWeight: '700' },
    profileCard: { alignItems: 'center', marginTop: 18 },
    profileName: { color: C.WHITE, fontSize: 18, fontWeight: '800', marginTop: 10 },
    netRow: { marginTop: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' },
    netAmount: { fontSize: 13, fontWeight: '700' },
    sheet: { paddingHorizontal: 22, paddingTop: 22 },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: C.GRAY600, letterSpacing: 1, marginBottom: 12 },
    txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
    txRowBorder: { borderBottomWidth: 1, borderBottomColor: C.GRAY100 },
    txEmoji: { fontSize: 24 },
    txDesc: { fontSize: 14, fontWeight: '700', color: C.GRAY800 },
    txMeta: { fontSize: 11, color: C.GRAY600, marginTop: 2 },
    txAmount: { fontSize: 14, fontWeight: '800' },
    avatar: { alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: C.WHITE, fontWeight: '700' },
});

export default MemberHistoryScreen;