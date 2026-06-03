import React, { useEffect, useMemo, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    KeyboardAvoidingView, Platform, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiService } from '../../services/apiService';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line, Polyline } from 'react-native-svg';

const C = {
    CRIMSON: '#DC143C', CRIMSON_DARK: '#A01030',
    BLUE: '#1A2B5F', BLUE_DARK: '#0F1F4A',
    WHITE: '#FFFFFF', GHOST: '#F7F8FB',
    GRAY100: '#EEF1F6', GRAY200: '#E1E5EE', GRAY400: '#9AA3B5',
    GRAY600: '#5A6478', GRAY800: '#1F2A44', SUCCESS: '#27AE60',
};

const Icon = ({ name, size = 18, color = C.GRAY400 }: { name: string; size?: number; color?: string }) => {
    const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    if (name === 'back') return <Svg {...p}><Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" /></Svg>;
    if (name === 'check') return <Svg {...p}><Polyline points="20 6 9 17 4 12" /></Svg>;
    return null;
};

const Avatar = ({ name, color, size = 36 }: { name: string; color: string; size?: number }) => (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
        <Text style={[s.avatarText, { fontSize: size * 0.4 }]}>{name.charAt(0).toUpperCase()}</Text>
    </View>
);

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const round2 = (n: number) => Math.round(n * 100) / 100;

interface Member { id: string; name: string; avatarColor: string; }

interface Props {
    expenseId?: string;
    groupCurrency?: string;
    members?: Member[];
    myUserId?: string;
    onBack?: () => void;
    onSave?: (data: { id: string; amount: number; description: string; participants: string[] }) => void;
}

const EditExpenseScreen: React.FC<Props> = ({
    expenseId = '',
    groupCurrency = 'NPR',
    members = [],
    myUserId = '',
    onBack, onSave,
}) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('other');
    const [participants, setParticipants] = useState<string[]>([]);
    const [loadingExpense, setLoadingExpense] = useState(true);

    useEffect(() => {
        if (!expenseId) { setLoadingExpense(false); return; }
        setLoadingExpense(true);
        apiService.getExpense(expenseId)
            .then(({ data }) => {
                setAmount(String(data.amount));
                setDescription(data.description);
                setCategory(data.category);
                setParticipants(data.splits.map(s => {
                    const member = members.find(m => {
                        const firstName = m.name.split(' ')[0];
                        return firstName === s.name || s.name === 'You' && m.id === myUserId;
                    });
                    return member?.id || '';
                }).filter(Boolean));
            })
            .catch(() => {})
            .finally(() => setLoadingExpense(false));
    }, [expenseId]);

    const amountNum = useMemo(() => { const p = parseFloat(amount.replace(/,/g, '')); return isNaN(p) ? 0 : p; }, [amount]);
    const perPerson = participants.length > 0 ? round2(amountNum / participants.length) : 0;
    const canSave = amountNum > 0 && description.trim().length > 0 && participants.length > 0;

    if (loadingExpense) {
        return (
            <SafeAreaView style={s.safe}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: C.GRAY600, fontSize: 14 }}>Loading…</Text>
                </View>
            </SafeAreaView>
        );
    }

    const toggleParticipant = (id: string) => {
        setParticipants(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    const handleAmountChange = (text: string) => {
        const cleaned = text.replace(/[^0-9.]/g, '');
        const parts = cleaned.split('.');
        if (parts.length > 2) return;
        if (parts[1] && parts[1].length > 2) return;
        setAmount(cleaned);
    };

    const handleSave = async () => {
        if (!canSave) return;
        const shares: Record<string, number> = {};
        participants.forEach(pid => { shares[pid] = perPerson; });
        try {
            await apiService.updateExpense(expenseId, {
                description: description.trim(),
                amount: amountNum,
                category,
                participants,
                shares,
            });
            onBack?.();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to update expense');
        }
    };

    return (
        <SafeAreaView style={s.safe}>
            <StatusBar barStyle="light-content" backgroundColor={C.BLUE_DARK} />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <LinearGradient colors={[C.BLUE_DARK, C.BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
                        <View style={s.topRow}>
                            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.iconBtn}><Icon name="back" size={18} color={C.WHITE} /></TouchableOpacity>
                            <Text style={s.headerTitle}>Edit Expense</Text>
                            <TouchableOpacity onPress={handleSave} disabled={!canSave} activeOpacity={0.7} style={[s.saveBtn, !canSave && s.saveBtnDisabled]}>
                                <Text style={[s.saveBtnText, !canSave && s.saveBtnTextDisabled]}>Save</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={s.amountWrap}>
                            <Text style={s.currencyLabel}>{groupCurrency}</Text>
                            <TextInput value={amount} onChangeText={handleAmountChange} keyboardType="decimal-pad" style={s.amountInput} maxLength={12} />
                        </View>
                    </LinearGradient>

                    <View style={s.sheet}>
                        <Text style={s.label}>Description</Text>
                        <View style={s.field}><TextInput value={description} onChangeText={setDescription} style={s.fieldInput} maxLength={80} /></View>

                        <View style={s.participantsHeader}>
                            <Text style={s.label}>Split between</Text>
                            <Text style={s.count}>{participants.length} of {members.length}</Text>
                        </View>
                        <View style={s.list}>
                            {members.map((m, i) => {
                                const sel = participants.includes(m.id);
                                return (
                                    <TouchableOpacity key={m.id} onPress={() => toggleParticipant(m.id)} activeOpacity={0.7} style={[s.row, i < members.length - 1 && s.rowBorder]}>
                                        <Avatar name={m.name} color={m.avatarColor} size={36} />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={s.rowName}>{m.id === myUserId ? 'You' : m.name}</Text>
                                            {sel && amountNum > 0 && <Text style={s.rowShare}>Owes {fmt(perPerson)} {groupCurrency}</Text>}
                                        </View>
                                        <View style={[s.checkbox, sel && s.checkboxChecked]}>
                                            {sel && <Icon name="check" size={12} color={C.WHITE} />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {amountNum > 0 && participants.length > 0 && (
                            <View style={s.sumBar}>
                                <Icon name="check" size={14} color={C.SUCCESS} />
                                <Text style={s.sumText}>Equal split: {fmt(perPerson)} each × {participants.length} = {fmt(round2(perPerson * participants.length))}</Text>
                            </View>
                        )}

                        <TouchableOpacity activeOpacity={0.85} onPress={handleSave} disabled={!canSave} style={{ marginTop: 22 }}>
                            {canSave ? (
                                <LinearGradient colors={[C.CRIMSON, C.CRIMSON_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.btn}><Text style={s.btnText}>Update Expense</Text></LinearGradient>
                            ) : (
                                <View style={[s.btn, s.btnDisabled]}><Text style={s.btnDisabledText}>Update Expense</Text></View>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.GHOST },
    header: { paddingTop: 20, paddingHorizontal: 24, paddingBottom: 30 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: C.WHITE, fontSize: 16, fontWeight: '700' },
    saveBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: C.CRIMSON },
    saveBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.15)' },
    saveBtnText: { color: C.WHITE, fontSize: 13, fontWeight: '700' },
    saveBtnTextDisabled: { color: 'rgba(255,255,255,0.50)' },
    amountWrap: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 18, gap: 8 },
    currencyLabel: { color: 'rgba(255,255,255,0.70)', fontSize: 15, fontWeight: '700', letterSpacing: 1 },
    amountInput: { color: C.WHITE, fontSize: 46, fontWeight: '800', letterSpacing: -1, padding: 0, minWidth: 100 },
    sheet: { backgroundColor: C.WHITE, marginTop: -16, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 24, flex: 1 },
    label: { fontSize: 11, fontWeight: '700', color: C.GRAY600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
    field: { backgroundColor: C.WHITE, borderWidth: 1.5, borderColor: C.GRAY200, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 },
    fieldInput: { fontSize: 15, color: C.GRAY800, fontWeight: '500', padding: 0 },
    participantsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    count: { fontSize: 11, color: C.GRAY400, fontWeight: '600' },
    list: { backgroundColor: C.WHITE, borderRadius: 12, borderWidth: 1, borderColor: C.GRAY200, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: C.GRAY100 },
    rowName: { fontSize: 14, fontWeight: '700', color: C.GRAY800 },
    rowShare: { fontSize: 11, color: C.GRAY600, marginTop: 2 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.GRAY400, alignItems: 'center', justifyContent: 'center' },
    checkboxChecked: { backgroundColor: C.CRIMSON, borderColor: C.CRIMSON },
    sumBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'rgba(39,174,96,0.10)', marginTop: 14 },
    sumText: { fontSize: 11, fontWeight: '700', color: C.SUCCESS },
    btn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
    btnText: { color: C.WHITE, fontSize: 15, fontWeight: '700' },
    btnDisabled: { backgroundColor: C.GRAY200 },
    btnDisabledText: { color: C.GRAY400, fontSize: 15, fontWeight: '700' },
    avatar: { alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: C.WHITE, fontWeight: '700' },
});

export default EditExpenseScreen;