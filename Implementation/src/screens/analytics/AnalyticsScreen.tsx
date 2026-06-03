/**
 * VaagBanda — AnalyticsScreen.tsx
 * Spending pattern charts by category and time period.
 * Maps to SRS §4.8. Increment 3 feature.
 * Uses simple bar chart rendered with Views (no chart library needed).
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line, Polyline } from 'react-native-svg';

const C = { CRIMSON: '#DC143C', CRIMSON_DARK: '#A01030', BLUE: '#1A2B5F', BLUE_DARK: '#0F1F4A', BLUE_MID: '#2B3F75', WHITE: '#FFFFFF', GHOST: '#F7F8FB', GRAY100: '#EEF1F6', GRAY200: '#E1E5EE', GRAY400: '#9AA3B5', GRAY600: '#5A6478', GRAY800: '#1F2A44', SUCCESS: '#27AE60' };

const Icon = ({ name, size = 18, color = C.GRAY400 }: { name: string; size?: number; color?: string }) => {
    const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    if (name === 'back') return <Svg {...p}><Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" /></Svg>;
    return null;
};

const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });

interface CategorySpend { emoji: string; label: string; amount: number; color: string; }
interface MonthSpend { month: string; amount: number; }

const CATEGORIES: CategorySpend[] = [
    { emoji: '🏨', label: 'Stay', amount: 8000, color: C.CRIMSON },
    { emoji: '🍽️', label: 'Food', amount: 4200, color: '#FF6F00' },
    { emoji: '🚕', label: 'Transport', amount: 2800, color: C.BLUE },
    { emoji: '🎟️', label: 'Tickets', amount: 6000, color: '#9C27B0' },
    { emoji: '🛍️', label: 'Shopping', amount: 1200, color: '#00838F' },
    { emoji: '📦', label: 'Other', amount: 600, color: C.GRAY600 },
];

const MONTHLY: MonthSpend[] = [
    { month: 'Jan', amount: 3200 },
    { month: 'Feb', amount: 4800 },
    { month: 'Mar', amount: 2100 },
    { month: 'Apr', amount: 6500 },
    { month: 'May', amount: 8400 },
];

const maxCat = Math.max(...CATEGORIES.map(c => c.amount));
const maxMonth = Math.max(...MONTHLY.map(m => m.amount));
const totalSpent = CATEGORIES.reduce((a, c) => a + c.amount, 0);

interface Props { groupName?: string; currency?: string; onBack?: () => void; onExport?: () => void; }

const AnalyticsScreen: React.FC<Props> = ({ groupName = 'Pokhara Trip', currency = 'NPR', onBack, onExport }) => {
    const [period, setPeriod] = useState<'month' | 'all'>('all');

    return (
        <SafeAreaView style={s.safe}>
            <StatusBar barStyle="light-content" backgroundColor={C.BLUE_DARK} />
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <LinearGradient colors={[C.BLUE_DARK, C.BLUE_MID]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
                    <View style={s.topRow}>
                        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.iconBtn}><Icon name="back" size={18} color={C.WHITE} /></TouchableOpacity>
                        <Text style={s.headerTitle}>Analytics</Text>
                        <TouchableOpacity onPress={onExport} activeOpacity={0.7} style={s.exportBtn}><Text style={s.exportText}>Export</Text></TouchableOpacity>
                    </View>
                    <Text style={s.headerSub}>{groupName}</Text>

                    {/* Big total */}
                    <View style={s.totalCard}>
                        <Text style={s.totalLabel}>TOTAL SPENT</Text>
                        <Text style={s.totalAmount}>{fmt(totalSpent)} <Text style={s.totalCurrency}>{currency}</Text></Text>
                        <Text style={s.totalSub}>{CATEGORIES.length} categories · {MONTHLY.length} months</Text>
                    </View>
                </LinearGradient>

                <View style={s.sheet}>
                    {/* Category breakdown */}
                    <Text style={s.sectionLabel}>BY CATEGORY</Text>
                    <View style={s.card}>
                        {CATEGORIES.map((c, i) => {
                            const pct = (c.amount / maxCat) * 100;
                            return (
                                <View key={c.label} style={[s.catRow, i < CATEGORIES.length - 1 && s.catRowBorder]}>
                                    <Text style={s.catEmoji}>{c.emoji}</Text>
                                    <View style={{ flex: 1 }}>
                                        <View style={s.catHeader}>
                                            <Text style={s.catLabel}>{c.label}</Text>
                                            <Text style={s.catAmount}>{fmt(c.amount)} {currency}</Text>
                                        </View>
                                        <View style={s.barTrack}>
                                            <View style={[s.barFill, { width: `${pct}%`, backgroundColor: c.color }]} />
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Monthly trend */}
                    <Text style={[s.sectionLabel, { marginTop: 24 }]}>MONTHLY TREND</Text>
                    <View style={s.card}>
                        <View style={s.barChart}>
                            {MONTHLY.map(m => {
                                const pct = (m.amount / maxMonth) * 100;
                                return (
                                    <View key={m.month} style={s.barCol}>
                                        <Text style={s.barAmount}>{(m.amount / 1000).toFixed(1)}k</Text>
                                        <View style={s.barOuter}>
                                            <LinearGradient colors={[C.CRIMSON, C.CRIMSON_DARK]} style={[s.barInner, { height: `${pct}%` }]} />
                                        </View>
                                        <Text style={s.barLabel}>{m.month}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
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
    exportBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.18)' },
    exportText: { color: C.WHITE, fontSize: 12, fontWeight: '700' },
    headerSub: { color: 'rgba(255,255,255,0.70)', fontSize: 12, textAlign: 'center', marginTop: 6 },
    totalCard: { alignItems: 'center', marginTop: 16, backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 14, padding: 18 },
    totalLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.70)', letterSpacing: 1.5 },
    totalAmount: { fontSize: 32, fontWeight: '800', color: C.WHITE, letterSpacing: -0.5, marginTop: 4 },
    totalCurrency: { fontSize: 14, color: 'rgba(255,255,255,0.60)' },
    totalSub: { fontSize: 11, color: 'rgba(255,255,255,0.60)', marginTop: 4 },
    sheet: { paddingHorizontal: 20, paddingTop: 20 },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: C.GRAY600, letterSpacing: 1, marginBottom: 10 },
    card: { backgroundColor: C.WHITE, borderRadius: 14, padding: 14, shadowColor: '#0F2640', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
    catRowBorder: { borderBottomWidth: 1, borderBottomColor: C.GRAY100 },
    catEmoji: { fontSize: 24 },
    catHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    catLabel: { fontSize: 13, fontWeight: '700', color: C.GRAY800 },
    catAmount: { fontSize: 13, fontWeight: '800', color: C.GRAY800 },
    barTrack: { height: 6, backgroundColor: C.GRAY100, borderRadius: 3, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 3 },
    barChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 160, paddingTop: 20 },
    barCol: { alignItems: 'center', flex: 1 },
    barAmount: { fontSize: 9, color: C.GRAY600, fontWeight: '700', marginBottom: 4 },
    barOuter: { width: 28, height: 110, backgroundColor: C.GRAY100, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
    barInner: { width: '100%', borderRadius: 6 },
    barLabel: { fontSize: 11, color: C.GRAY600, fontWeight: '600', marginTop: 6 },
});

export default AnalyticsScreen;