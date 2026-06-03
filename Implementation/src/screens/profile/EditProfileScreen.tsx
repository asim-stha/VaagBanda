import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    KeyboardAvoidingView, Platform, StatusBar, Image, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../../lib/supabase';

const C = {
    CRIMSON: '#DC143C', CRIMSON_DARK: '#A01030',
    BLUE: '#1A2B5F', BLUE_DARK: '#0F1F4A',
    WHITE: '#FFFFFF', GHOST: '#F7F8FB',
    GRAY100: '#EEF1F6', GRAY200: '#E1E5EE',
    GRAY400: '#9AA3B5', GRAY600: '#5A6478', GRAY800: '#1F2A44',
    SUCCESS: '#27AE60',
};

/* ─── base64 → Uint8Array (React Native has no atob for binary) ─── */
function decode(base64: string): Uint8Array {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const bytes: number[] = [];
    for (let i = 0; i < base64.length; i += 4) {
        const a = chars.indexOf(base64[i]);
        const b = chars.indexOf(base64[i + 1]);
        const c = chars.indexOf(base64[i + 2]);
        const d = chars.indexOf(base64[i + 3]);
        bytes.push((a << 2) | (b >> 4));
        if (base64[i + 2] !== '=') bytes.push(((b & 15) << 4) | (c >> 2));
        if (base64[i + 3] !== '=') bytes.push(((c & 3) << 6) | d);
    }
    return new Uint8Array(bytes);
}

const Icon = ({ name, size = 18, color = C.GRAY400 }: { name: string; size?: number; color?: string }) => {
    const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    if (name === 'back') return <Svg {...p}><Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" /></Svg>;
    if (name === 'camera') return <Svg {...p}><Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><Circle cx="12" cy="13" r="4" /></Svg>;
    if (name === 'check') return <Svg {...p}><Polyline points="20 6 9 17 4 12" /></Svg>;
    return null;
};

const LetterAvatar = ({ name, color, size = 80 }: { name: string; color: string; size?: number }) => (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
        <Text style={[s.avatarText, { fontSize: size * 0.38 }]}>{name.charAt(0).toUpperCase()}</Text>
    </View>
);

interface Props {
    initialName?: string;
    initialEmail?: string;
    avatarColor?: string;
    avatarUrl?: string;
    onBack?: () => void;
    onSave?: (data: { name: string; email: string; avatarUri?: string }) => Promise<void>;
}

const EditProfileScreen: React.FC<Props> = ({
    initialName, initialEmail, avatarColor = C.CRIMSON, avatarUrl,
    onBack, onSave,
}) => {
    const { user: authUser } = useAuth();
    const resolvedName = initialName ?? authUser?.name ?? authUser?.email?.split('@')[0] ?? '';
    const resolvedEmail = initialEmail ?? authUser?.email ?? '';

    const [name, setName] = useState(resolvedName);
    const [email, setEmail] = useState(resolvedEmail);
    const [imageUri, setImageUri] = useState<string | null>(avatarUrl ?? authUser?.avatarUrl ?? null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [deletedAvatar, setDeletedAvatar] = useState(false);
    const originalAvatarUrl = useRef<string | null>(avatarUrl ?? authUser?.avatarUrl ?? null);

    useEffect(() => {
        const fetchAvatar = async () => {
            const { data: { user: supaUser } } = await supabase.auth.getUser();
            if (!supaUser) return;
            const { data } = await supabase
                .from('profiles')
                .select('avatar_url')
                .eq('user_id', supaUser.id)
                .single();
            if (data?.avatar_url) {
                setImageUri(data.avatar_url);
                originalAvatarUrl.current = data.avatar_url;
            }
        };
        fetchAvatar();
    }, []);

    const canSave = name.trim().length > 0 && email.includes('@');

    const pickFromLibrary = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Please allow photo library access in your device settings.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
            setDeletedAvatar(false);
        }
    };

    const pickFromCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Please allow camera access in your device settings.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
            setDeletedAvatar(false);
        }
    };

    const handlePickImage = () => {
        Alert.alert('Change Profile Photo', '', [
            { text: 'Take Photo', onPress: pickFromCamera },
            { text: 'Choose from Library', onPress: pickFromLibrary },
            ...(imageUri ? [{ text: 'Remove Photo', style: 'destructive' as const, onPress: () => { setImageUri(null); setDeletedAvatar(true); } }] : []),
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handleSave = async () => {
        if (!canSave || saving) return;
        setSaving(true);
        try {
            let finalAvatarUri = imageUri ?? undefined;

            if (deletedAvatar && !imageUri) {
                const { data: { user: supaUser } } = await supabase.auth.getUser();
                if (supaUser) {
                    await supabase.from('profiles').update({ avatar_url: null }).eq('user_id', supaUser.id);
                    if (originalAvatarUrl.current) {
                        const marker = '/public/avatars/';
                        const idx = originalAvatarUrl.current.indexOf(marker);
                        if (idx !== -1) {
                            const storagePath = originalAvatarUrl.current.slice(idx + marker.length);
                            await supabase.storage.from('avatars').remove([storagePath]);
                        }
                    }
                }
                finalAvatarUri = undefined;

            } else if (imageUri && !imageUri.startsWith('http')) {
                const { data: { user: supaUser } } = await supabase.auth.getUser();
                if (supaUser) {
                    const ext = imageUri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg';
                    const filePath = `${supaUser.id}/avatar_${Date.now()}.${ext}`;
                    const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

                    // Read file as base64 — required in React Native (blob upload doesn't work)
                    const base64 = await FileSystem.readAsStringAsync(imageUri, {
                        encoding:'base64',
                    });

                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(filePath, decode(base64), {
                            contentType,
                            upsert: true,
                        });

                    if (uploadError) {
                        console.error('Upload error:', uploadError.message);
                        Alert.alert('Upload failed', uploadError.message);
                    } else {
                        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
                        // Cache-bust so React Native shows the new image immediately
                        const bustUrl = `${urlData.publicUrl}?t=${Date.now()}`;
                        console.log('Avatar uploaded:', bustUrl);
                        finalAvatarUri = bustUrl;
                        setImageUri(bustUrl);
                    }
                }
            }

            await onSave?.({ name: name.trim(), email: email.trim(), avatarUri: finalAvatarUri });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err: any) {
            console.error('Save error:', err.message);
            Alert.alert('Error', 'Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={s.safe}>
            <StatusBar barStyle="light-content" backgroundColor={C.BLUE_DARK} />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <LinearGradient colors={[C.BLUE_DARK, C.CRIMSON_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
                        <View style={s.topRow}>
                            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.iconBtn}>
                                <Icon name="back" size={18} color={C.WHITE} />
                            </TouchableOpacity>
                            <Text style={s.headerTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={handleSave} disabled={!canSave || saving} activeOpacity={0.7} style={[s.saveBtn, (!canSave || saving) && s.saveBtnDisabled]}>
                                {saving
                                    ? <ActivityIndicator size="small" color={C.WHITE} />
                                    : <Text style={[s.saveBtnText, !canSave && s.saveBtnTextDisabled]}>Save</Text>
                                }
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity activeOpacity={0.85} onPress={handlePickImage} style={s.avatarWrap}>
                        <View style={{ width: 80, height: 80, borderRadius: 40, overflow: 'hidden', backgroundColor: avatarColor }}>
                                   {imageUri ? (
                         <Image
                      source={{ uri: imageUri }}
                      style={{ width: 80, height: 80 }}
                      onLoad={() => console.log('Image loaded OK')}
                     onError={(e) => console.log('Image error:', e.nativeEvent.error)}
                           />
                         ) : (
            <LetterAvatar name={name || 'U'} color={avatarColor} size={80} />
                         )}
                     </View>
                      <View style={s.cameraBadge}>
        <Icon name="camera" size={14} color={C.WHITE} />
                     </View>
                         </TouchableOpacity>
                        <Text style={s.changePhotoHint}>Tap to change photo</Text>
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
                        <View style={s.field}>
                            <TextInput value={name} onChangeText={setName} style={s.fieldInput} maxLength={50} autoCapitalize="words" />
                        </View>

                        <Text style={s.label}>Email Address</Text>
                        <View style={s.field}>
                            <TextInput value={email} onChangeText={setEmail} style={s.fieldInput} keyboardType="email-address" autoCapitalize="none" />
                        </View>

                        <TouchableOpacity activeOpacity={0.85} onPress={handleSave} disabled={!canSave || saving} style={{ marginTop: 28 }}>
                            {canSave ? (
                                <LinearGradient colors={[C.CRIMSON, C.CRIMSON_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.btn}>
                                    {saving
                                        ? <ActivityIndicator color={C.WHITE} size="small" />
                                        : <Text style={s.btnText}>Save Changes</Text>
                                    }
                                </LinearGradient>
                            ) : (
                                <View style={[s.btn, s.btnDisabled]}>
                                    <Text style={s.btnDisabledText}>Save Changes</Text>
                                </View>
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
    saveBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: C.CRIMSON, minWidth: 56, alignItems: 'center' },
    saveBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.15)' },
    saveBtnText: { color: C.WHITE, fontSize: 13, fontWeight: '700' },
    saveBtnTextDisabled: { color: 'rgba(255,255,255,0.50)' },
    avatarWrap: { marginTop: 14, position: 'relative', width: 80, height: 80 },
    avatarImgWrap: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', borderWidth: 3, borderColor: 'rgba(255,255,255,0.30)' },
    avatarImg: { width: 80, height: 80 },
    cameraBadge: { position: 'absolute', bottom: 0, right: -4, width: 30, height: 30, borderRadius: 15, backgroundColor: C.CRIMSON, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.BLUE_DARK },
    changePhotoHint: { color: 'rgba(255,255,255,0.60)', fontSize: 11, marginTop: 6, fontWeight: '500' },
    sheet: { paddingHorizontal: 22, paddingTop: 22 },
    successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(39,174,96,0.10)', padding: 12, borderRadius: 10, marginBottom: 16 },
    successText: { fontSize: 13, color: C.SUCCESS, fontWeight: '700' },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: C.GRAY600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
    label: { fontSize: 11, fontWeight: '700', color: C.GRAY600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
    field: { backgroundColor: C.WHITE, borderWidth: 1.5, borderColor: C.GRAY200, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 },
    fieldInput: { fontSize: 15, color: C.GRAY800, fontWeight: '500', padding: 0 },
    btn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
    btnText: { color: C.WHITE, fontSize: 15, fontWeight: '700' },
    btnDisabled: { backgroundColor: C.GRAY200 },
    btnDisabledText: { color: C.GRAY400, fontSize: 15, fontWeight: '700' },
    avatar: { alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.30)' },
    avatarText: { color: C.WHITE, fontWeight: '700' },
});

export default EditProfileScreen;
