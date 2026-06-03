import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line, Polyline } from 'react-native-svg';
import { apiService, GroupSummary } from '../../services/apiService';

const C = {
    CRIMSON: '#DC143C', CRIMSON_DARK: '#A01030',
    BLUE: '#1A2B5F', BLUE_DARK: '#0F1F4A', BLUE_MID: '#2B3F75',
    WHITE: '#FFFFFF', GHOST: '#F7F8FB',
    GRAY100: '#EEF1F6', GRAY200: '#E1E5EE', GRAY400: '#9AA3B5',
    GRAY600: '#5A6478', GRAY800: '#1F2A44',
    SUCCESS: '#27AE60',
};

const Icon = ({ name, size = 18, color = C.GRAY400 }: { name: string; size?: number; color?: string }) => {
    const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    if (name === 'back') return <Svg {...p}><Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" /></Svg>;
    if (name === 'chevron') return <Svg {...p}><Polyline points="9 18 15 12 9 6" /></Svg>;
    return null;
};

const fmt = (n: number) => Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface GroupInfo {
    groupId: string;
    groupName: string;
    groupCurrency: string;
    members: Array<{ id: string; name: string; avatarColor: string; balance: number }>;
    myUserId: string;
}

interface Props {
    onBack?: () => void;
    onSelect?: (groupInfo: GroupInfo) => void;
}

const SelectGroupScreen: React.FC<Props> = ({ onBack, onSelect }) => {
    const [groups, setGroups] = useState<GroupSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingGroupId, setLoadingGroupId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        apiService.getGroups()
            .then(({ data }) => setGroups(data))
            .catch(err => setError(err.message || 'Failed to load groups'))
            .finally(() => setLoading(false));
    }, []);

    const handleSelect = async (groupId: string) => {
        setLoadingGroupId(groupId);
        try {
            const { data } = await apiService.getGroup(groupId);
            onSelect?.({
                groupId: data.id,
                groupName: data.name,
                groupCurrency: data.currency,
                members: data.members,
                myUserId: data.myUserId,
            });
        } catch (e: any) {
            setError(e.message || 'Failed to load group');
        } finally {
            setLoadingGroupId(null);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor={C.BLUE_DARK} />

            <LinearGradient
                colors={[C.BLUE_DARK, C.BLUE_MID]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.blob} />
                <View style={styles.topRow}>
                    <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.iconBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Icon name="back" size={18} color={C.WHITE} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Add Expense</Text>
                        <Text style={styles.headerSub}>Choose a group</Text>
                    </View>
                    <View style={{ width: 36 }} />
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <View style={styles.centerState}>
                        <ActivityIndicator size="large" color={C.CRIMSON} />
                        <Text style={styles.centerText}>Loading your groups…</Text>
                    </View>
                ) : error ? (
                    <View style={styles.centerState}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : groups.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>👥</Text>
                        <Text style={styles.emptyTitle}>No groups yet</Text>
                        <Text style={styles.emptyDesc}>
                            Create a group first, then you can add shared expenses to it.
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.sectionLabel}>YOUR GROUPS</Text>
                        <View style={styles.groupList}>
                            {groups.map((g, idx) => {
                                const isLoading = loadingGroupId === g.id;
                                const isOwed = g.myBalance > 0;
                                const owes = g.myBalance < 0;
                                const settled = g.myBalance === 0;
                                const balColor = isOwed ? C.SUCCESS : owes ? C.CRIMSON : C.GRAY400;
                                const balLabel = settled ? 'Settled up' : isOwed ? 'You are owed' : 'You owe';
                                const isLast = idx === groups.length - 1;
                                return (
                                    <TouchableOpacity
                                        key={g.id}
                                        onPress={() => handleSelect(g.id)}
                                        activeOpacity={0.7}
                                        disabled={loadingGroupId !== null}
                                        style={[styles.groupRow, !isLast && styles.groupRowBorder]}
                                    >
                                        <View style={styles.groupEmojiWrap}>
                                            <Text style={styles.groupEmoji}>{g.emoji}</Text>
                                        </View>
                                        <View style={styles.groupInfo}>
                                            <Text style={styles.groupName} numberOfLines={1}>{g.name}</Text>
                                            <Text style={styles.groupMeta}>
                                                {g.memberCount} member{g.memberCount !== 1 ? 's' : ''} · {g.currency}
                                            </Text>
                                        </View>
                                        <View style={styles.groupRight}>
                                            <Text style={[styles.balLabel, { color: balColor }]}>{balLabel}</Text>
                                            {!settled && (
                                                <Text style={[styles.balAmount, { color: balColor }]}>
                                                    {fmt(g.myBalance)} {g.currency}
                                                </Text>
                                            )}
                                        </View>
                                        {isLoading ? (
                                            <ActivityIndicator size="small" color={C.CRIMSON} style={{ marginLeft: 8 }} />
                                        ) : (
                                            <Icon name="chevron" size={16} color={C.GRAY400} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.GHOST },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

    header: {
        paddingTop: 20, paddingHorizontal: 24, paddingBottom: 24, overflow: 'hidden',
    },
    blob: {
        position: 'absolute', top: -40, right: -40,
        width: 160, height: 160, borderRadius: 9999,
        backgroundColor: 'rgba(220,20,60,0.15)',
    },
    topRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    iconBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerCenter: { alignItems: 'center' },
    headerTitle: { color: C.WHITE, fontSize: 16, fontWeight: '700' },
    headerSub: { color: 'rgba(255,255,255,0.70)', fontSize: 12, marginTop: 2 },

    sectionLabel: {
        fontSize: 11, fontWeight: '700', color: C.GRAY600,
        letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10,
    },

    groupList: {
        backgroundColor: C.WHITE, borderRadius: 16,
        shadowColor: '#0F2640', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
        overflow: 'hidden',
    },
    groupRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, paddingHorizontal: 16,
    },
    groupRowBorder: {
        borderBottomWidth: 1, borderBottomColor: C.GRAY100,
    },
    groupEmojiWrap: {
        width: 46, height: 46, borderRadius: 13,
        backgroundColor: C.GHOST,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 12,
    },
    groupEmoji: { fontSize: 24 },
    groupInfo: { flex: 1 },
    groupName: { fontSize: 15, fontWeight: '700', color: C.GRAY800, marginBottom: 3 },
    groupMeta: { fontSize: 11, color: C.GRAY400, fontWeight: '500' },
    groupRight: { alignItems: 'flex-end', marginRight: 8 },
    balLabel: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
    balAmount: { fontSize: 12, fontWeight: '800' },

    centerState: {
        alignItems: 'center', paddingTop: 60, gap: 12,
    },
    centerText: { fontSize: 13, color: C.GRAY600 },
    errorText: { fontSize: 13, color: C.CRIMSON, textAlign: 'center' },

    emptyState: {
        alignItems: 'center', paddingTop: 60, paddingHorizontal: 30,
        backgroundColor: C.WHITE, borderRadius: 16, padding: 40,
        shadowColor: '#0F2640', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: C.GRAY800, marginBottom: 6 },
    emptyDesc: {
        fontSize: 13, color: C.GRAY600,
        textAlign: 'center', lineHeight: 18,
    },
});

export default SelectGroupScreen;
