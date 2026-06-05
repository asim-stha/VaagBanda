import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line, Polyline } from 'react-native-svg';
import { useTheme, ThemeMode } from '../../context/ThemeContext';

interface Props {
    onBack?: () => void;
}

const AppearanceScreen: React.FC<Props> = ({ onBack }) => {
    const { mode, setMode, colors, isDark } = useTheme();

    const themes: { mode: ThemeMode; label: string; desc: string; emoji: string }[] = [
        { mode: 'light', label: 'Light', desc: 'Clean white background', emoji: '☀️' },
        { mode: 'dark', label: 'Dark', desc: 'Easy on the eyes at night', emoji: '🌙' },
        { mode: 'system', label: 'System Default', desc: 'Follows your device setting', emoji: '📱' },
    ];

    return (
        <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" backgroundColor="#0F1F4A" />
            <LinearGradient
                colors={['#0F1F4A', '#A01030']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.header}
            >
                <View style={s.topRow}>
                    <TouchableOpacity onPress={onBack} style={s.backBtn}>
                        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                            stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <Line x1="19" y1="12" x2="5" y2="12" />
                            <Polyline points="12 19 5 12 12 5" />
                        </Svg>
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Appearance</Text>
                    <View style={{ width: 36 }} />
                </View>
                <Text style={s.headerSub}>Choose how VaagBanda looks to you</Text>
            </LinearGradient>

            <View style={s.content}>
                <Text style={[s.sectionLabel, { color: colors.subtext }]}>THEME</Text>
                <View style={[s.card, { backgroundColor: colors.card }]}>
                    {themes.map((t, idx) => (
                        <TouchableOpacity
                            key={t.mode}
                            onPress={() => setMode(t.mode)}
                            activeOpacity={0.7}
                            style={[s.row, idx !== themes.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                        >
                            <Text style={s.emoji}>{t.emoji}</Text>
                            <View style={s.rowText}>
                                <Text style={[s.rowLabel, { color: colors.text }]}>{t.label}</Text>
                                <Text style={[s.rowDesc, { color: colors.subtext }]}>{t.desc}</Text>
                            </View>
                            <View style={[s.radio, mode === t.mode && s.radioSelected]}>
                                {mode === t.mode && <View style={s.radioDot} />}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[s.sectionLabel, { color: colors.subtext }]}>PREVIEW</Text>
                <View style={[s.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[s.previewHeader, { backgroundColor: isDark ? '#1A2B5F' : '#0F1F4A' }]}>
                        <Text style={s.previewHeaderText}>VaagBanda</Text>
                    </View>
                    <View style={s.previewBody}>
                        <Text style={[s.previewText, { color: colors.text }]}>Sample expense: Dinner</Text>
                        <Text style={[s.previewSub, { color: colors.subtext }]}>NPR 1,200 · Split equally</Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    safe: { flex: 1 },
    header: { paddingTop: 16, paddingHorizontal: 24, paddingBottom: 24 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
    headerSub: { color: 'rgba(255,255,255,0.70)', fontSize: 13, marginTop: 8, textAlign: 'center' },
    content: { flex: 1, padding: 20 },
    sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
    card: { borderRadius: 14, overflow: 'hidden', shadowColor: '#0F2640', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    emoji: { fontSize: 22, marginRight: 14 },
    rowText: { flex: 1 },
    rowLabel: { fontSize: 14, fontWeight: '600' },
    rowDesc: { fontSize: 12, marginTop: 2 },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#E1E5EE', alignItems: 'center', justifyContent: 'center' },
    radioSelected: { borderColor: '#DC143C' },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#DC143C' },
    previewCard: { borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
    previewHeader: { padding: 12 },
    previewHeaderText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    previewBody: { padding: 14 },
    previewText: { fontSize: 14, fontWeight: '600' },
    previewSub: { fontSize: 12, marginTop: 4 },
});

export default AppearanceScreen;