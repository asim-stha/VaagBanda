import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, SafeAreaView, Alert,
} from 'react-native';
import { apiService } from '../../services/apiService';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line, Polyline, Circle } from 'react-native-svg';

const C = {
    CRIMSON: '#DC143C', CRIMSON_DARK: '#A01030',
    BLUE: '#1A2B5F', BLUE_DARK: '#0F1F4A',
    WHITE: '#FFFFFF', GHOST: '#F7F8FB',
    GRAY100: '#EEF1F6', GRAY200: '#E1E5EE', GRAY400: '#9AA3B5',
    GRAY600: '#5A6478', GRAY800: '#1F2A44',
    SUCCESS: '#27AE60',
};

const Icon = ({ name, size = 18, color = C.GRAY400 }: { name: string; size?: number; color?: string }) => {
    const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    if (name === 'back') return <Svg {...p}><Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" /></Svg>;
    if (name === 'edit') return <Svg {...p}><Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><Path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></Svg>;
    if (name === 'trash') return <Svg {...p}><Polyline points="3 6 5 6 21 6" /><Path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></Svg>;
    return null;
};

const Avatar = ({ name, color, size = 36 }: { name: string; color: string; size?: number }) => (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
        <Text style={[s.avatarText, { fontSize: size * 0.4 }]}>{name.charAt(0).toUpperCase()}</Text>
    </View>
);

const fmt = (n: number) => Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Split { name: string; avatarColor: string; amount: number; isPayer: boolean; }
interface ExpenseData {
    id: string; description: string; emoji: string; amount: number; currency: string;
    paidByName: string; paidByColor: string; date: string; category: string;
    groupName: string; splits: Split[]; note?: string;
}

const MOCK: ExpenseData = {
    id: 'e1', description: 'Hotel — 2 nights', emoji: '🏨', amount: 8000, currency: 'NPR',
    paidByName: 'Asim', paidByColor: C.CRIMSON, date: 'May 25, 2026 · 3:42 PM',
    category: 'Stay', groupName: 'Pokhara Trip',
    splits: [
        { name: 'Asim', avatarColor: C.CRIMSON, amount: 1600, isPayer: true },
        { name: 'Krishna', avatarColor: C.BLUE, amount: 1600, isPayer: false },
        { name: 'Riya', avatarColor: '#9C27B0', amount: 1600, isPayer: false },
        { name: 'Bibek', avatarColor: '#FF6F00', amount: 1600, isPayer: false },
        { name: 'Sita', avatarColor: '#00838F', amount: 1600, isPayer: false },
    ],
    note: 'Booked via Agoda. Confirmation #AG-28491.',
};

interface Props {
    expense?: ExpenseData;
    onBack?: () => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
}

const ExpenseDetailScreen: React.FC<Props> = ({ expense = MOCK, onBack, onEdit, onDelete }) => {
    const handleDelete = () => {
        Alert.alert('Delete expense', `Remove "${expense.description}"? This cannot be undone.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await apiService.deleteExpense(expense.id);
                        onBack?.();
                    } catch (e: any) {
                        Alert.alert('Error', e.message || 'Failed to delete expense');
                    }
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={s.safe}>
            <StatusBar barStyle="light-content" backgroundColor={C.BLUE_DARK} />
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <LinearGradient colors={[C.BLUE_DARK, C.BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
                    <View style={s.topRow}>
                        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.iconBtn}><Icon name="back" size={18} color={C.WHITE} /></TouchableOpacity>
                        <Text style={s.headerTitle}>Expense Detail</Text>
                        <TouchableOpacity onPress={() => onEdit?.(expense.id)} activeOpacity={0.7} style={s.iconBtn}><Icon name="edit" size={18} color={C.WHITE} /></TouchableOpacity>
                    </View>
                    <View style={s.heroCard}>
                        <Text style={s.heroEmoji}>{expense.emoji}</Text>
                        <Text style={s.heroDesc}>{expense.description}</Text>
                        <Text style={s.heroAmount}>{fmt(expense.amount)} <Text style={s.heroCurrency}>{expense.currency}</Text></Text>
                        <Text style={s.heroMeta}>{expense.category} · {expense.groupName}</Text>
                    </View>
                </LinearGradient>

                <View style={s.sheet}>
                    {/* Paid by */}
                    <View style={s.infoRow}>
                        <Text style={s.infoLabel}>PAID BY</Text>
                        <View style={s.infoValue}>
                            <Avatar name={expense.paidByName} color={expense.paidByColor} size={28} />
                            <Text style={s.infoText}>{expense.paidByName}</Text>
                        </View>
                    </View>
                    <View style={s.divider} />
                    <View style={s.infoRow}>
                        <Text style={s.infoLabel}>DATE</Text>
                        <Text style={s.infoText}>{expense.date}</Text>
                    </View>
                    <View style={s.divider} />
                    <View style={s.infoRow}>
                        <Text style={s.infoLabel}>SPLIT METHOD</Text>
                        <Text style={s.infoText}>Equal ({expense.splits.length} people)</Text>
                    </View>
                    {expense.note && (
                        <>
                            <View style={s.divider} />
                            <View style={s.infoRow}>
                                <Text style={s.infoLabel}>NOTE</Text>
                                <Text style={[s.infoText, { flex: 1, textAlign: 'right' }]}>{expense.note}</Text>
                            </View>
                        </>
                    )}

                    {/* Split breakdown */}
                    <Text style={[s.sectionLabel, { marginTop: 22 }]}>SPLIT BREAKDOWN</Text>
                    <View style={s.splitCard}>
                        {expense.splits.map((sp, i) => (
                            <View key={sp.name} style={[s.splitRow, i < expense.splits.length - 1 && s.splitRowBorder]}>
                                <Avatar name={sp.name} color={sp.avatarColor} size={36} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={s.splitName}>{sp.name}{sp.isPayer ? ' (payer)' : ''}</Text>
                                    <Text style={s.splitSub}>{sp.isPayer ? 'Paid, owes self' : 'Owes payer'}</Text>
                                </View>
                                <Text style={[s.splitAmount, { color: sp.isPayer ? C.GRAY600 : C.CRIMSON }]}>
                                    {fmt(sp.amount)} {expense.currency}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Delete button */}
                    <TouchableOpacity onPress={handleDelete} activeOpacity={0.7} style={s.deleteBtn}>
                        <Icon name="trash" size={16} color={C.CRIMSON} />
                        <Text style={s.deleteBtnText}>Delete this expense</Text>
                    </TouchableOpacity>
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
    heroCard: { alignItems: 'center', marginTop: 18 },
    heroEmoji: { fontSize: 48 },
    heroDesc: { color: C.WHITE, fontSize: 20, fontWeight: '800', marginTop: 10, textAlign: 'center' },
    heroAmount: { color: C.WHITE, fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginTop: 6 },
    heroCurrency: { fontSize: 14, color: 'rgba(255,255,255,0.70)' },
    heroMeta: { color: 'rgba(255,255,255,0.70)', fontSize: 12, marginTop: 4 },
    sheet: { paddingHorizontal: 22, paddingTop: 22 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    infoLabel: { fontSize: 10, fontWeight: '700', color: C.GRAY600, letterSpacing: 1.5 },
    infoValue: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoText: { fontSize: 13, fontWeight: '700', color: C.GRAY800 },
    divider: { height: 1, backgroundColor: C.GRAY100 },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: C.GRAY600, letterSpacing: 1, marginBottom: 10 },
    splitCard: { backgroundColor: C.WHITE, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.GRAY200 },
    splitRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    splitRowBorder: { borderBottomWidth: 1, borderBottomColor: C.GRAY100 },
    splitName: { fontSize: 14, fontWeight: '700', color: C.GRAY800 },
    splitSub: { fontSize: 11, color: C.GRAY600, marginTop: 2 },
    splitAmount: { fontSize: 14, fontWeight: '800' },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: C.CRIMSON, backgroundColor: C.WHITE },
    deleteBtnText: { fontSize: 14, color: C.CRIMSON, fontWeight: '700' },
    avatar: { alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: C.WHITE, fontWeight: '700' },
});

export default ExpenseDetailScreen;