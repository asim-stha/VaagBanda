

import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
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
    GRAY600: '#5A6478', GRAY800: '#1F2A44', WARN: '#F39C12',
};

const Icon = ({ name, size = 18, color = C.GRAY400 }: { name: string; size?: number; color?: string }) => {
    const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    if (name === 'back') return <Svg {...p}><Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" /></Svg>;
    if (name === 'trash') return <Svg {...p}><Polyline points="3 6 5 6 21 6" /><Path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></Svg>;
    if (name === 'x') return <Svg {...p}><Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" /></Svg>;
    if (name === 'shield') return <Svg {...p}><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Svg>;
    if (name === 'plus') return <Svg {...p}><Line x1="12" y1="5" x2="12" y2="19" /><Line x1="5" y1="12" x2="19" y2="12" /></Svg>;
    return null;
};

const Avatar = ({ name, color, size = 36 }: { name: string; color: string; size?: number }) => (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
        <Text style={[s.avatarText, { fontSize: size * 0.4 }]}>{name.charAt(0).toUpperCase()}</Text>
    </View>
);

interface Member { id: string; name: string; avatarColor: string; role: 'admin' | 'member'; }

const MOCK_MEMBERS: Member[] = [
    { id: 'u1', name: 'Asim', avatarColor: C.CRIMSON, role: 'admin' },
    { id: 'u2', name: 'Krishna', avatarColor: C.BLUE, role: 'member' },
    { id: 'u3', name: 'Riya', avatarColor: '#9C27B0', role: 'member' },
    { id: 'u4', name: 'Bibek', avatarColor: '#FF6F00', role: 'member' },
    { id: 'u5', name: 'Sita', avatarColor: '#00838F', role: 'member' },
];

interface Props {
    groupId?: string;
    groupName?: string; groupEmoji?: string; groupCurrency?: string;
    members?: Member[]; myUserId?: string;
    onBack?: () => void; onSave?: (data: { name: string }) => void;
    onInviteMember?: () => void; onRemoveMember?: (id: string) => void;
    onPromoteMember?: (id: string) => void; onDeleteGroup?: () => void;
}

const GroupSettingsScreen: React.FC<Props> = ({
    groupId,
    groupName = 'Pokhara Trip', groupEmoji = '🏔️', groupCurrency = 'NPR',
    members = MOCK_MEMBERS, myUserId = 'u1',
    onBack, onSave, onInviteMember, onRemoveMember, onPromoteMember, onDeleteGroup,
}) => {
    const [name, setName] = useState(groupName);

    const handleDelete = () => {
        Alert.alert('Delete group', 'This will permanently remove the group and all its data. This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await apiService.deleteGroup(groupId!);
                        onBack?.();
                    } catch (e: any) {
                        Alert.alert('Error', e.message || 'Failed to delete group');
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
                        <Text style={s.headerTitle}>Group Settings</Text>
                        <TouchableOpacity onPress={() => onSave?.({ name: name.trim() })} activeOpacity={0.7} style={s.saveBtn}><Text style={s.saveBtnText}>Save</Text></TouchableOpacity>
                    </View>
                    <View style={s.emojiWrap}><Text style={s.emojiBig}>{groupEmoji}</Text></View>
                </LinearGradient>

                <View style={s.sheet}>
                    <Text style={s.label}>GROUP NAME</Text>
                    <View style={s.field}><TextInput value={name} onChangeText={setName} style={s.fieldInput} maxLength={50} /></View>

                    <View style={s.infoRow}>
                        <Text style={s.label}>CURRENCY</Text>
                        <Text style={s.infoValue}>{groupCurrency}</Text>
                    </View>

                    <View style={s.membersHeader}>
                        <Text style={s.label}>MEMBERS ({members.length})</Text>
                        <TouchableOpacity onPress={onInviteMember} activeOpacity={0.7} style={s.inviteBtn}>
                            <Icon name="plus" size={14} color={C.CRIMSON} />
                            <Text style={s.inviteBtnText}>Invite</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={s.memberList}>
                        {members.map((m, i) => {
                            const isMe = m.id === myUserId;
                            const isAdmin = m.role === 'admin';
                            return (
                                <View key={m.id} style={[s.memberRow, i < members.length - 1 && s.memberRowBorder]}>
                                    <Avatar name={m.name} color={m.avatarColor} size={40} />
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={s.memberName}>{isMe ? 'You' : m.name}</Text>
                                        <Text style={s.memberRole}>{isAdmin ? 'Admin' : 'Member'}</Text>
                                    </View>
                                    {isAdmin && (
                                        <View style={s.adminBadge}><Icon name="shield" size={12} color={C.CRIMSON} /></View>
                                    )}
                                    {!isMe && !isAdmin && (
                                        <View style={s.actionRow}>
                                            <TouchableOpacity onPress={() => onPromoteMember?.(m.id)} activeOpacity={0.7} style={s.actionBtn}>
                                                <Icon name="shield" size={13} color={C.BLUE} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => onRemoveMember?.(m.id)} activeOpacity={0.7} style={s.actionBtn}>
                                                <Icon name="x" size={13} color={C.CRIMSON} />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    {/* Danger zone */}
                    <View style={s.dangerZone}>
                        <Text style={s.dangerLabel}>DANGER ZONE</Text>
                        <TouchableOpacity onPress={handleDelete} activeOpacity={0.7} style={s.deleteBtn}>
                            <Icon name="trash" size={16} color={C.CRIMSON} />
                            <Text style={s.deleteBtnText}>Delete this group</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.GHOST },
    header: { paddingTop: 20, paddingHorizontal: 24, paddingBottom: 24, alignItems: 'center' },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: C.WHITE, fontSize: 16, fontWeight: '700' },
    saveBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: C.CRIMSON },
    saveBtnText: { color: C.WHITE, fontSize: 13, fontWeight: '700' },
    emojiWrap: { width: 72, height: 72, borderRadius: 18, backgroundColor: C.WHITE, alignItems: 'center', justifyContent: 'center', marginTop: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 14, elevation: 8 },
    emojiBig: { fontSize: 40 },
    sheet: { paddingHorizontal: 22, paddingTop: 22 },
    label: { fontSize: 11, fontWeight: '700', color: C.GRAY600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
    field: { backgroundColor: C.WHITE, borderWidth: 1.5, borderColor: C.GRAY200, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 18 },
    fieldInput: { fontSize: 15, color: C.GRAY800, fontWeight: '500', padding: 0 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    infoValue: { fontSize: 14, fontWeight: '800', color: C.GRAY800 },
    membersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    inviteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(220,20,60,0.08)' },
    inviteBtnText: { fontSize: 12, color: C.CRIMSON, fontWeight: '700' },
    memberList: { backgroundColor: C.WHITE, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.GRAY200 },
    memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
    memberRowBorder: { borderBottomWidth: 1, borderBottomColor: C.GRAY100 },
    memberName: { fontSize: 14, fontWeight: '700', color: C.GRAY800 },
    memberRole: { fontSize: 11, color: C.GRAY600, marginTop: 2 },
    adminBadge: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(220,20,60,0.08)', alignItems: 'center', justifyContent: 'center' },
    actionRow: { flexDirection: 'row', gap: 6 },
    actionBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: C.GRAY200, alignItems: 'center', justifyContent: 'center' },
    dangerZone: { marginTop: 30, paddingTop: 18, borderTopWidth: 1, borderTopColor: C.GRAY200 },
    dangerLabel: { fontSize: 11, fontWeight: '700', color: C.CRIMSON, letterSpacing: 1, marginBottom: 10 },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: C.CRIMSON, backgroundColor: C.WHITE },
    deleteBtnText: { fontSize: 14, color: C.CRIMSON, fontWeight: '700' },
    avatar: { alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: C.WHITE, fontWeight: '700' },
});

export default GroupSettingsScreen;