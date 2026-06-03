import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    KeyboardAvoidingView, Platform, StatusBar, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';

const C = { CRIMSON: '#DC143C', CRIMSON_DARK: '#A01030', BLUE: '#1A2B5F', BLUE_DARK: '#0F1F4A', WHITE: '#FFFFFF', GHOST: '#F7F8FB', GRAY100: '#EEF1F6', GRAY200: '#E1E5EE', GRAY400: '#9AA3B5', GRAY600: '#5A6478', GRAY800: '#1F2A44', SUCCESS: '#27AE60' };

const Icon = ({ name, size = 18, color = C.GRAY400 }: { name: string; size?: number; color?: string }) => {
    const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    if (name === 'back') return <Svg {...p}><Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" /></Svg>;
    if (name === 'camera') return <Svg {...p}><Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><Circle cx="12" cy="13" r="4" /></Svg>;
    if (name === 'check') return <Svg {...p}><Polyline points="20 6 9 17 4 12" /></Svg>;
    return null;
};

const Avatar = ({ name, color, size = 80 }: { name: string; color: string; size?: number }) => (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
        <Text style={[s.avatarText, { fontSize: size * 0.38 }]}>{name.charAt(0).toUpperCase()}</Text>
    </View>
);

interface Props {
    initialName?: string; initialEmail?: string; avatarColor?: string;
    onBack?: () => void;
    onSave?: (data: { name: string; email: string; currentPassword: string; newPassword: string }) => void;
}

const EditProfileScreen: React.FC<Props> = ({
    initialName = 'Asim', initialEmail = 'asim@cybersquadnp.com', avatarColor = C.CRIMSON,
    onBack, onSave,
}) => {
    const [name, setName] = useState(initialName);
    const [email, setEmail] = useState(initialEmail);
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [saved, setSaved] = useState(false);

    const hasChanges = name !== initialName || email !== initialEmail || newPw.length > 0;
    const canSave = hasChanges && name.trim().length > 0 && email.includes('@');

    const handleSave = () => {
        if (!canSave) return;
        onSave?.({ name: name.trim(), email: email.trim(), currentPassword: currentPw, newPassword: newPw });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <SafeAreaView style={s.safe}>
            <StatusBar barStyle="light-content" backgroundColor={C.BLUE_DARK} />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <LinearGradient colors={[C.BLUE_DARK, C.CRIMSON_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
                        <View style={s.topRow}>
                            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.iconBtn}><Icon name="back" size={18} color={C.WHITE} /></TouchableOpacity>
                            <Text style={s.headerTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={handleSave} disabled={!canSave} activeOpacity={0.7} style={[s.saveBtn, !canSave && s.saveBtnDisabled]}>
                                <Text style={[s.saveBtnText, !canSave && s.saveBtnTextDisabled]}>Save</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Avatar with camera overlay */}
                        <View style={s.avatarWrap}>
                            <Avatar name={name} color={avatarColor} size={80} />
                            <TouchableOpacity activeOpacity={0.7} style={s.cameraBadge}>
                                <Icon name="camera" size={14} color={C.WHITE} />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>

                    <View style={s.sheet}>
                        {saved && (
                            <View style={s.successBanner}>
                                <Icon name="check" size={14} color={C.SUCCESS} />
                                <Text style={s.successText}>Profile updated successfully!</Text>
                            </View>
                        )}

                        <Text style={s.sectionLabel}>PERSONAL INFO</Text>

                        <Text style={s.label}>Display Name</Text>
                        <View style={s.field}><TextInput value={name} onChangeText={setName} style={s.fieldInput} maxLength={50} autoCapitalize="words" /></View>

                        <Text style={s.label}>Email Address</Text>
                        <View style={s.field}><TextInput value={email} onChangeText={setEmail} style={s.fieldInput} keyboardType="email-address" autoCapitalize="none" /></View>

                        <Text style={[s.sectionLabel, { marginTop: 24 }]}>CHANGE PASSWORD</Text>
                        <Text style={s.sectionDesc}>Leave blank to keep your current password</Text>

                        <Text style={s.label}>Current Password</Text>
                        <View style={s.field}><TextInput value={currentPw} onChangeText={setCurrentPw} style={s.fieldInput} secureTextEntry placeholder="Enter current password" placeholderTextColor={C.GRAY400} /></View>

                        <Text style={s.label}>New Password</Text>
                        <View style={s.field}><TextInput value={newPw} onChangeText={setNewPw} style={s.fieldInput} secureTextEntry placeholder="Enter new password" placeholderTextColor={C.GRAY400} /></View>

                        {newPw.length > 0 && newPw.length < 8 && (
                            <Text style={s.hintError}>Password must be at least 8 characters</Text>
                        )}

                        {/* Bottom save button */}
                        <TouchableOpacity activeOpacity={0.85} onPress={handleSave} disabled={!canSave} style={{ marginTop: 28 }}>
                            {canSave ? (
                                <LinearGradient colors={[C.CRIMSON, C.CRIMSON_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.btn}>
                                    <Text style={s.btnText}>Save Changes</Text>
                                </LinearGradient>
                            ) : (
                                <View style={[s.btn, s.btnDisabled]}><Text style={s.btnDisabledText}>Save Changes</Text></View>
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
    header: { paddingTop: 20, paddingHorizontal: 24, paddingBottom: 28, alignItems: 'center' },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: C.WHITE, fontSize: 16, fontWeight: '700' },
    saveBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: C.CRIMSON },
    saveBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.15)' },
    saveBtnText: { color: C.WHITE, fontSize: 13, fontWeight: '700' },
    saveBtnTextDisabled: { color: 'rgba(255,255,255,0.50)' },
    avatarWrap: { marginTop: 14, position: 'relative' },
    cameraBadge: { position: 'absolute', bottom: 0, right: -4, width: 30, height: 30, borderRadius: 15, backgroundColor: C.CRIMSON, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.BLUE_DARK },
    sheet: { paddingHorizontal: 22, paddingTop: 22 },
    successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(39,174,96,0.10)', padding: 12, borderRadius: 10, marginBottom: 16 },
    successText: { fontSize: 13, color: C.SUCCESS, fontWeight: '700' },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: C.GRAY600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
    sectionDesc: { fontSize: 12, color: C.GRAY400, marginBottom: 14 },
    label: { fontSize: 11, fontWeight: '700', color: C.GRAY600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
    field: { backgroundColor: C.WHITE, borderWidth: 1.5, borderColor: C.GRAY200, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 },
    fieldInput: { fontSize: 15, color: C.GRAY800, fontWeight: '500', padding: 0 },
    hintError: { fontSize: 11, color: C.CRIMSON, fontWeight: '600', marginTop: -8, marginBottom: 8, marginLeft: 4 },
    btn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
    btnText: { color: C.WHITE, fontSize: 15, fontWeight: '700' },
    btnDisabled: { backgroundColor: C.GRAY200 },
    btnDisabledText: { color: C.GRAY400, fontSize: 15, fontWeight: '700' },
    avatar: { alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.30)' },
    avatarText: { color: C.WHITE, fontWeight: '700' },
});

export default EditProfileScreen;