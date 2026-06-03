import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';

const C = { CRIMSON: '#DC143C', CRIMSON_DARK: '#A01030', BLUE: '#1A2B5F', BLUE_DARK: '#0F1F4A', WHITE: '#FFFFFF', GHOST: '#F7F8FB', GRAY200: '#E1E5EE', GRAY400: '#9AA3B5', GRAY600: '#5A6478', GRAY800: '#1F2A44' };

const Icon = ({ name, size = 18, color = C.GRAY400 }: { name: string; size?: number; color?: string }) => {
    const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    if (name === 'back') return <Svg {...p}><Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" /></Svg>;
    if (name === 'camera') return <Svg {...p}><Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><Circle cx="12" cy="13" r="4" /></Svg>;
    if (name === 'upload') return <Svg {...p}><Polyline points="16 16 12 12 8 16" /><Line x1="12" y1="12" x2="12" y2="21" /><Path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" /></Svg>;
    if (name === 'edit') return <Svg {...p}><Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><Path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></Svg>;
    return null;
};

interface Props { onBack?: () => void; onCapture?: (uri: string) => void; onManualEntry?: () => void; }

const ScanReceiptScreen: React.FC<Props> = ({ onBack, onCapture, onManualEntry }) => {
    const [scanning, setScanning] = useState(false);

    const handleCapture = () => {
        setScanning(true);
        // Simulated OCR processing delay
        setTimeout(() => {
            setScanning(false);
            onCapture?.('mock://receipt-image.jpg');
        }, 2000);
    };

    return (
        <SafeAreaView style={s.safe}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Camera viewfinder area (dark placeholder) */}
            <View style={s.viewfinder}>
                <View style={s.navRow}>
                    <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.iconBtn}>
                        <Icon name="back" size={18} color={C.WHITE} />
                    </TouchableOpacity>
                    <Text style={s.navTitle}>Scan Receipt</Text>
                    <View style={{ width: 36 }} />
                </View>

                {/* Frame guides */}
                <View style={s.frameArea}>
                    <View style={[s.corner, s.cornerTL]} />
                    <View style={[s.corner, s.cornerTR]} />
                    <View style={[s.corner, s.cornerBL]} />
                    <View style={[s.corner, s.cornerBR]} />

                    {scanning ? (
                        <View style={s.scanningOverlay}>
                            <View style={s.scanLine} />
                            <Text style={s.scanningText}>Scanning receipt...</Text>
                        </View>
                    ) : (
                        <View style={s.hintArea}>
                            <Icon name="camera" size={48} color="rgba(255,255,255,0.50)" />
                            <Text style={s.hintText}>Position the receipt within the frame</Text>
                            <Text style={s.hintSub}>The amount, date, and vendor will be extracted automatically</Text>
                        </View>
                    )}
                </View>

                {/* Bottom controls */}
                <View style={s.controls}>
                    <TouchableOpacity onPress={onManualEntry} activeOpacity={0.7} style={s.secondaryBtn}>
                        <Icon name="edit" size={20} color={C.WHITE} />
                        <Text style={s.secondaryText}>Enter manually</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleCapture} activeOpacity={0.85} disabled={scanning} style={s.captureBtn}>
                        <View style={s.captureInner}>
                            {scanning ? (
                                <Text style={s.captureDots}>···</Text>
                            ) : (
                                <View style={s.captureCircle} />
                            )}
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity activeOpacity={0.7} style={s.secondaryBtn}>
                        <Icon name="upload" size={20} color={C.WHITE} />
                        <Text style={s.secondaryText}>From gallery</Text>
                    </TouchableOpacity>
                </View>

                {/* OCR powered by badge */}
                <View style={s.poweredBy}>
                    <Text style={s.poweredByText}>Powered by Google ML Kit OCR</Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#000' },
    viewfinder: { flex: 1, backgroundColor: '#111', justifyContent: 'space-between' },
    navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16 },
    iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    navTitle: { color: C.WHITE, fontSize: 16, fontWeight: '700' },
    frameArea: { marginHorizontal: 30, aspectRatio: 0.7, position: 'relative', justifyContent: 'center', alignItems: 'center' },
    corner: { position: 'absolute', width: 30, height: 30, borderColor: C.CRIMSON, borderWidth: 3 },
    cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
    hintArea: { alignItems: 'center', paddingHorizontal: 30 },
    hintText: { color: 'rgba(255,255,255,0.70)', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 14 },
    hintSub: { color: 'rgba(255,255,255,0.40)', fontSize: 11, textAlign: 'center', marginTop: 6, lineHeight: 16 },
    scanningOverlay: { alignItems: 'center' },
    scanLine: { width: '80%', height: 2, backgroundColor: C.CRIMSON, borderRadius: 1, marginBottom: 16, shadowColor: C.CRIMSON, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 4 },
    scanningText: { color: C.CRIMSON, fontSize: 14, fontWeight: '700' },
    controls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10 },
    captureBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.WHITE },
    captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.WHITE, alignItems: 'center', justifyContent: 'center' },
    captureCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: C.CRIMSON },
    captureDots: { fontSize: 24, color: C.CRIMSON, fontWeight: '800' },
    secondaryBtn: { alignItems: 'center', gap: 4 },
    secondaryText: { color: 'rgba(255,255,255,0.70)', fontSize: 10, fontWeight: '600' },
    poweredBy: { alignItems: 'center', paddingBottom: 14 },
    poweredByText: { color: 'rgba(255,255,255,0.30)', fontSize: 10 },
});

export default ScanReceiptScreen;