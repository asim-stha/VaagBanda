import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line, Polyline } from 'react-native-svg';

const C = { CRIMSON: '#DC143C', CRIMSON_DARK: '#A01030', BLUE: '#1A2B5F', BLUE_DARK: '#0F1F4A', WHITE: '#FFFFFF', GHOST: '#F7F8FB', GRAY100: '#EEF1F6', GRAY200: '#E1E5EE', GRAY400: '#9AA3B5', GRAY600: '#5A6478', GRAY800: '#1F2A44', SUCCESS: '#27AE60' };

const Icon = ({ name, size = 18, color = C.GRAY400 }: { name: string; size?: number; color?: string }) => {
    const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    if (name === 'back') return <Svg {...p}><Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" /></Svg>;
    if (name === 'check') return <Svg {...p}><Polyline points="20 6 9 17 4 12" /></Svg>;
    if (name === 'download') return <Svg {...p}><Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><Polyline points="7 10 12 15 17 10" /><Line x1="12" y1="15" x2="12" y2="3" /></Svg>;
    if (name === 'file') return <Svg {...p}><Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><Polyline points="14 2 14 8 20 8" /></Svg>;
    return null;
};

type Format = 'pdf' | 'csv';
type Scope = 'all' | 'month' | 'custom';

interface Props { groupName?: string; onBack?: () => void; onExport?: (format: Format, scope: Scope) => void; }

const ExportScreen: React.FC<Props> = ({ groupName = '', onBack, onExport }) => {
    const [format, setFormat] = useState<Format>('pdf');
    const [scope, setScope] = useState<Scope>('all');
    const [exporting, setExporting] = useState(false);
    const [exported, setExported] = useState(false);

    const handleExport = () => {
        setExporting(true);
        setTimeout(() => {
            setExporting(false);
            setExported(true);
            onExport?.(format, scope);
        }, 1500);
    };

    return (
        <SafeAreaView style={s.safe}>
            <StatusBar barStyle="light-content" backgroundColor={C.BLUE_DARK} />
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <LinearGradient colors={[C.BLUE_DARK, C.BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
                    <View style={s.topRow}>
                        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.iconBtn}><Icon name="back" size={18} color={C.WHITE} /></TouchableOpacity>
                        <Text style={s.headerTitle}>Export Report</Text>
                        <View style={{ width: 36 }} />
                    </View>
                    <Text style={s.headerSub}>{groupName}</Text>
                </LinearGradient>

                <View style={s.sheet}>
                    {!exported ? (
                        <>
                            {/* Format selection */}
                            <Text style={s.label}>FORMAT</Text>
                            <View style={s.optionRow}>
                                {([
                                    { key: 'pdf' as Format, emoji: '📄', label: 'PDF Report', desc: 'Formatted report with charts' },
                                    { key: 'csv' as Format, emoji: '📊', label: 'CSV Spreadsheet', desc: 'Raw data for Excel/Sheets' },
                                ]).map(f => (
                                    <TouchableOpacity key={f.key} onPress={() => setFormat(f.key)} activeOpacity={0.7} style={[s.optionCard, format === f.key && s.optionCardActive]}>
                                        <Text style={s.optionEmoji}>{f.emoji}</Text>
                                        <Text style={[s.optionLabel, format === f.key && s.optionLabelActive]}>{f.label}</Text>
                                        <Text style={s.optionDesc}>{f.desc}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Scope selection */}
                            <Text style={[s.label, { marginTop: 20 }]}>TIME PERIOD</Text>
                            <View style={s.scopeCard}>
                                {([
                                    { key: 'all' as Scope, label: 'All time', desc: 'Everything since group creation' },
                                    { key: 'month' as Scope, label: 'This month', desc: 'Current calendar month only' },
                                    { key: 'custom' as Scope, label: 'Custom range', desc: 'Choose start and end dates' },
                                ]).map((sc, i) => (
                                    <TouchableOpacity key={sc.key} onPress={() => setScope(sc.key)} activeOpacity={0.7} style={[s.scopeRow, i < 2 && s.scopeRowBorder]}>
                                        <View style={[s.radio, scope === sc.key && s.radioActive]}>
                                            {scope === sc.key && <View style={s.radioDot} />}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.scopeLabel}>{sc.label}</Text>
                                            <Text style={s.scopeDesc}>{sc.desc}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* What's included */}
                            <Text style={[s.label, { marginTop: 20 }]}>INCLUDES</Text>
                            <View style={s.includesList}>
                                {['Expense list with dates and amounts', 'Split breakdown per member', 'Settlement history', 'Balance summary'].map(item => (
                                    <View key={item} style={s.includeRow}>
                                        <Icon name="check" size={14} color={C.SUCCESS} />
                                        <Text style={s.includeText}>{item}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Export button */}
                            <TouchableOpacity activeOpacity={0.85} onPress={handleExport} disabled={exporting} style={{ marginTop: 24 }}>
                                <LinearGradient colors={[C.CRIMSON, C.CRIMSON_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.exportBtn}>
                                    <Icon name="download" size={16} color={C.WHITE} />
                                    <Text style={s.exportBtnText}>{exporting ? 'Generating...' : `Export as ${format.toUpperCase()}`}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    ) : (
                        /* Success state */
                        <View style={s.successWrap}>
                            <View style={s.successCircle}><Icon name="check" size={36} color={C.SUCCESS} /></View>
                            <Text style={s.successTitle}>Report ready!</Text>
                            <Text style={s.successDesc}>Your {format.toUpperCase()} report for {groupName} has been generated.</Text>
                            <TouchableOpacity activeOpacity={0.85} style={{ marginTop: 20, width: '100%' }}>
                                <LinearGradient colors={[C.SUCCESS, '#1E8E47']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.exportBtn}>
                                    <Icon name="download" size={16} color={C.WHITE} />
                                    <Text style={s.exportBtnText}>Download {format.toUpperCase()}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { setExported(false); }} activeOpacity={0.7} style={s.backLink}>
                                <Text style={s.backLinkText}>Generate another report</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
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
    headerSub: { color: 'rgba(255,255,255,0.70)', fontSize: 12, textAlign: 'center', marginTop: 6 },
    sheet: { paddingHorizontal: 22, paddingTop: 22 },
    label: { fontSize: 11, fontWeight: '700', color: C.GRAY600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
    optionRow: { flexDirection: 'row', gap: 10 },
    optionCard: { flex: 1, backgroundColor: C.WHITE, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: C.GRAY200 },
    optionCardActive: { borderColor: C.CRIMSON, backgroundColor: 'rgba(220,20,60,0.04)' },
    optionEmoji: { fontSize: 32, marginBottom: 8 },
    optionLabel: { fontSize: 13, fontWeight: '700', color: C.GRAY800, marginBottom: 4 },
    optionLabelActive: { color: C.CRIMSON },
    optionDesc: { fontSize: 10, color: C.GRAY600, textAlign: 'center' },
    scopeCard: { backgroundColor: C.WHITE, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.GRAY200 },
    scopeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14, gap: 12 },
    scopeRowBorder: { borderBottomWidth: 1, borderBottomColor: C.GRAY100 },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.GRAY400, alignItems: 'center', justifyContent: 'center' },
    radioActive: { borderColor: C.CRIMSON },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.CRIMSON },
    scopeLabel: { fontSize: 14, fontWeight: '700', color: C.GRAY800 },
    scopeDesc: { fontSize: 11, color: C.GRAY600, marginTop: 2 },
    includesList: { gap: 8 },
    includeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    includeText: { fontSize: 13, color: C.GRAY800 },
    exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14 },
    exportBtnText: { color: C.WHITE, fontSize: 14, fontWeight: '700' },
    successWrap: { alignItems: 'center', paddingTop: 30 },
    successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(39,174,96,0.10)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.SUCCESS, marginBottom: 18 },
    successTitle: { fontSize: 20, fontWeight: '800', color: C.GRAY800 },
    successDesc: { fontSize: 13, color: C.GRAY600, textAlign: 'center', marginTop: 6 },
    backLink: { marginTop: 16 },
    backLinkText: { fontSize: 13, color: C.CRIMSON, fontWeight: '700' },
});

export default ExportScreen;