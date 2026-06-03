
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';

/* ─── BRAND TOKENS ─────────────────────────────────────────── */
const COLORS = {
  CRIMSON: '#DC143C',
  CRIMSON_DARK: '#A01030',
  BLUE: '#1A2B5F',
  BLUE_DARK: '#0F1F4A',
  BLUE_MID: '#2B3F75',
  WHITE: '#FFFFFF',
  GHOST: '#F7F8FB',
  GRAY100: '#EEF1F6',
  GRAY200: '#E1E5EE',
  GRAY400: '#9AA3B5',
  GRAY600: '#5A6478',
  GRAY800: '#1F2A44',
  SUCCESS: '#27AE60',
  WARN: '#F39C12',
};

/* ─── ICONS ────────────────────────────────────────────────── */
type IconName = 'back' | 'check' | 'chevron' | 'tag' | 'calendar' | 'camera' | 'lock';

const Icon = ({
  name, size = 18, color = COLORS.GRAY400,
}: { name: IconName; size?: number; color?: string }) => {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth: 2,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'back':
      return (
        <Svg {...props}>
          <Line x1="19" y1="12" x2="5" y2="12" />
          <Polyline points="12 19 5 12 12 5" />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...props}>
          <Polyline points="20 6 9 17 4 12" />
        </Svg>
      );
    case 'chevron':
      return (
        <Svg {...props}>
          <Polyline points="9 18 15 12 9 6" />
        </Svg>
      );
    case 'tag':
      return (
        <Svg {...props}>
          <Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
          <Line x1="7" y1="7" x2="7.01" y2="7" />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg {...props}>
          <Path d="M3 6h18M5 6v14a2 2 0 002 2h10a2 2 0 002-2V6M8 2v4M16 2v4" />
        </Svg>
      );
    case 'camera':
      return (
        <Svg {...props}>
          <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
          <Circle cx="12" cy="13" r="4" />
        </Svg>
      );
    case 'lock':
      return (
        <Svg {...props}>
          <Path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4" />
        </Svg>
      );
    default: return null;
  }
};

/* ─── HELPERS ──────────────────────────────────────────────── */
/** Format a number with thousands separators and 2 decimals */
const fmt = (n: number) => n.toLocaleString('en-US', {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});

/** Round to 2 decimals reliably (avoids floating-point drift per SRS §5.5) */
const round2 = (n: number) => Math.round(n * 100) / 100;

/* ─── DOMAIN TYPES ─────────────────────────────────────────── */
interface Member {
  id: string;
  name: string;
  avatarColor: string;
}

type SplitMethod = 'equal' | 'exact' | 'percent' | 'shares';

interface CategoryOption {
  key: string;
  emoji: string;
  label: string;
}

const CATEGORIES: CategoryOption[] = [
  { key: 'food',      emoji: '🍽️', label: 'Food' },
  { key: 'transport', emoji: '🚕', label: 'Transport' },
  { key: 'hotel',     emoji: '🏨', label: 'Stay' },
  { key: 'tickets',   emoji: '🎟️', label: 'Tickets' },
  { key: 'shopping',  emoji: '🛍️', label: 'Shopping' },
  { key: 'fuel',      emoji: '⛽', label: 'Fuel' },
  { key: 'utility',   emoji: '🧾', label: 'Utility' },
  { key: 'other',     emoji: '📦', label: 'Other' },
];

/* ─── MOCK DATA ────────────────────────────────────────────── */
const MOCK_MEMBERS: Member[] = [
  { id: 'u1', name: 'Asim',    avatarColor: COLORS.CRIMSON },
  { id: 'u2', name: 'Krishna', avatarColor: COLORS.BLUE    },
  { id: 'u3', name: 'Riya',    avatarColor: '#9C27B0'      },
  { id: 'u4', name: 'Bibek',   avatarColor: '#FF6F00'      },
  { id: 'u5', name: 'Sita',    avatarColor: '#00838F'      },
];

const MY_USER_ID = 'u1';

/* ─── AVATAR ───────────────────────────────────────────────── */
const Avatar = ({
  member, size = 36,
}: { member: Member; size?: number }) => (
  <View style={[styles.avatar, {
    width: size, height: size, borderRadius: size / 2,
    backgroundColor: member.avatarColor,
  }]}>
    <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
      {member.name.charAt(0).toUpperCase()}
    </Text>
  </View>
);

/* ─── PROPS ────────────────────────────────────────────────── */
interface AddExpenseScreenProps {
  groupName?: string;
  groupCurrency?: string;
  members?: Member[];
  myUserId?: string;
  onBack?: () => void;
  onSave?: (expense: {
    amount: number;
    description: string;
    paidBy: string;
    category: string;
    splitMethod: SplitMethod;
    participants: string[]; // member ids
    shares: { [memberId: string]: number }; // each person's owed amount
  }) => void;
}

/* ─── MAIN SCREEN ──────────────────────────────────────────── */
const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({
  groupName = 'Pokhara Trip',
  groupCurrency = 'NPR',
  members = MOCK_MEMBERS,
  myUserId = MY_USER_ID,
  onBack,
  onSave,
}) => {
  // ── State ──
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paidBy, setPaidBy] = useState(myUserId);
  const [category, setCategory] = useState('food');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [participants, setParticipants] = useState<string[]>(members.map(m => m.id));
  const [showPayerPicker, setShowPayerPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // ── Derived ──
  const amountNum = useMemo(() => {
    const parsed = parseFloat(amount.replace(/,/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }, [amount]);

  /** Per-SRS §4.3.3 equal split: divide evenly; payer absorbs the rounding remainder. */
  const shares = useMemo((): { [memberId: string]: number } => {
    if (splitMethod !== 'equal' || participants.length === 0 || amountNum <= 0) {
      return {};
    }
    const baseShare = round2(amountNum / participants.length);
    const distributed = round2(baseShare * participants.length);
    const remainder = round2(amountNum - distributed);

    const out: { [memberId: string]: number } = {};
    participants.forEach(pid => {
      out[pid] = baseShare;
    });
    // Assign rounding remainder to payer (per SRS §4.3.3)
    if (remainder !== 0 && out[paidBy] !== undefined) {
      out[paidBy] = round2(out[paidBy] + remainder);
    } else if (remainder !== 0) {
      // Payer not a participant — give remainder to first participant
      out[participants[0]] = round2(out[participants[0]] + remainder);
    }
    return out;
  }, [splitMethod, participants, amountNum, paidBy]);

  const sharesSum = useMemo(
    () => Object.values(shares).reduce((acc, v) => acc + v, 0),
    [shares]
  );

  const splitMatchesTotal = useMemo(
    () => Math.abs(sharesSum - amountNum) < 0.01,
    [sharesSum, amountNum]
  );

  const canSave = (
    amountNum > 0 &&
    description.trim().length > 0 &&
    participants.length > 0 &&
    splitMatchesTotal
  );

  const paidByMember = members.find(m => m.id === paidBy) ?? members[0];
  const selectedCategory = CATEGORIES.find(c => c.key === category) ?? CATEGORIES[0];

  // ── Handlers ──
  const toggleParticipant = (id: string) => {
    setParticipants(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!canSave) return;
    onSave?.({
      amount: amountNum,
      description: description.trim(),
      paidBy,
      category,
      splitMethod,
      participants,
      shares,
    });
  };

  // Format amount as user types (basic input filtering — allow digits + one dot)
  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return; // ignore extra dots
    if (parts[1] && parts[1].length > 2) return; // max 2 decimals
    setAmount(cleaned);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BLUE_DARK} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── HEADER ─── */}
          <LinearGradient
            colors={[COLORS.BLUE_DARK, COLORS.BLUE]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.blob} />

            <View style={styles.topRow}>
              <TouchableOpacity
                onPress={onBack}
                activeOpacity={0.7}
                style={styles.iconBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="back" size={18} color={COLORS.WHITE} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Add Expense</Text>
              <TouchableOpacity
                onPress={handleSave}
                disabled={!canSave}
                activeOpacity={0.7}
                style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.groupContext} numberOfLines={1}>
              in {groupName}
            </Text>

            {/* Amount input — the focal point */}
            <View style={styles.amountWrap}>
              <Text style={styles.currencyLabel}>{groupCurrency}</Text>
              <TextInput
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.40)"
                keyboardType="decimal-pad"
                style={styles.amountInput}
                maxLength={12}
              />
            </View>
          </LinearGradient>

          {/* ─── SHEET ─── */}
          <View style={styles.sheet}>
            {/* ── Description ── */}
            <Text style={styles.label}>Description</Text>
            <View style={styles.field}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What was this for?"
                placeholderTextColor={COLORS.GRAY400}
                style={styles.fieldInput}
                maxLength={80}
              />
            </View>

            {/* ── Paid By + Category row ── */}
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Paid by</Text>
                <TouchableOpacity
                  onPress={() => setShowPayerPicker(true)}
                  activeOpacity={0.7}
                  style={styles.pickerField}
                >
                  <Avatar member={paidByMember} size={28} />
                  <Text style={styles.pickerText} numberOfLines={1}>
                    {paidBy === myUserId ? 'You' : paidByMember.name}
                  </Text>
                  <Icon name="chevron" size={14} color={COLORS.GRAY400} />
                </TouchableOpacity>
              </View>

              <View style={styles.rowItem}>
                <Text style={styles.label}>Category</Text>
                <TouchableOpacity
                  onPress={() => setShowCategoryPicker(true)}
                  activeOpacity={0.7}
                  style={styles.pickerField}
                >
                  <Text style={styles.categoryEmoji}>{selectedCategory.emoji}</Text>
                  <Text style={styles.pickerText} numberOfLines={1}>
                    {selectedCategory.label}
                  </Text>
                  <Icon name="chevron" size={14} color={COLORS.GRAY400} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Receipt placeholder (Increment 3) ── */}
            <TouchableOpacity activeOpacity={0.7} style={styles.receiptBtn} disabled>
              <Icon name="camera" size={18} color={COLORS.GRAY400} />
              <Text style={styles.receiptBtnText}>Attach receipt</Text>
              <View style={styles.comingSoonPill}>
                <Text style={styles.comingSoonText}>Coming in v3</Text>
              </View>
            </TouchableOpacity>

            {/* ── Split Method Tabs ── */}
            <Text style={[styles.label, { marginTop: 22 }]}>Split method</Text>
            <View style={styles.splitTabs}>
              {(['equal', 'exact', 'percent', 'shares'] as SplitMethod[]).map(m => {
                const active = splitMethod === m;
                const locked = m !== 'equal'; // only equal works in Increment 1
                const labels: Record<SplitMethod, string> = {
                  equal:   'Equal',
                  exact:   'Exact',
                  percent: 'Percent',
                  shares:  'Shares',
                };
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => !locked && setSplitMethod(m)}
                    activeOpacity={locked ? 1 : 0.7}
                    disabled={locked}
                    style={[
                      styles.splitTab,
                      active && styles.splitTabActive,
                      locked && styles.splitTabLocked,
                    ]}
                  >
                    {locked && (
                      <Icon name="lock" size={10} color={COLORS.GRAY400} />
                    )}
                    <Text style={[
                      styles.splitTabText,
                      active && styles.splitTabTextActive,
                      locked && styles.splitTabTextLocked,
                    ]}>
                      {labels[m]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Participant List ── */}
            <View style={styles.participantsHeader}>
              <Text style={styles.label}>Split between</Text>
              <Text style={styles.participantsCount}>
                {participants.length} of {members.length}
              </Text>
            </View>

            <View style={styles.participantList}>
              {members.map((m, idx) => {
                const isParticipant = participants.includes(m.id);
                const share = shares[m.id] ?? 0;
                const isLast = idx === members.length - 1;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => toggleParticipant(m.id)}
                    activeOpacity={0.7}
                    style={[
                      styles.participantRow,
                      !isLast && styles.participantRowBorder,
                    ]}
                  >
                    <Avatar member={m} size={36} />
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>
                        {m.id === myUserId ? 'You' : m.name}
                      </Text>
                      {isParticipant && amountNum > 0 && (
                        <Text style={styles.participantShare}>
                          Owes {fmt(share)} {groupCurrency}
                        </Text>
                      )}
                    </View>
                    <View style={[
                      styles.checkbox,
                      isParticipant && styles.checkboxChecked,
                    ]}>
                      {isParticipant && (
                        <Icon name="check" size={12} color={COLORS.WHITE} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Split Sum Indicator (SRS §5.5 Business Rule) ── */}
            {amountNum > 0 && participants.length > 0 && (
              <View style={[
                styles.sumIndicator,
                splitMatchesTotal ? styles.sumOk : styles.sumWarn,
              ]}>
                <Icon
                  name={splitMatchesTotal ? 'check' : 'tag'}
                  size={14}
                  color={splitMatchesTotal ? COLORS.SUCCESS : COLORS.WARN}
                />
                <Text style={[
                  styles.sumText,
                  { color: splitMatchesTotal ? COLORS.SUCCESS : COLORS.WARN },
                ]}>
                  Splits sum to {fmt(sharesSum)} / {fmt(amountNum)} {groupCurrency}
                  {splitMatchesTotal ? ' ✓' : ''}
                </Text>
              </View>
            )}

            {/* ── Save Button (also at the bottom for easy reach) ── */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={!canSave}
              style={{ marginTop: 22 }}
            >
              {canSave ? (
                <LinearGradient
                  colors={[COLORS.CRIMSON, COLORS.CRIMSON_DARK]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.bottomBtn}
                >
                  <Text style={styles.bottomBtnText}>Save Expense</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.bottomBtn, styles.bottomBtnDisabled]}>
                  <Text style={styles.bottomBtnTextDisabled}>Save Expense</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── PAYER PICKER MODAL ─── */}
      <Modal
        visible={showPayerPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPayerPicker(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowPayerPicker(false)}
          style={styles.modalBackdrop}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Who paid?</Text>
            {members.map((m, idx) => {
              const selected = m.id === paidBy;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => {
                    setPaidBy(m.id);
                    setShowPayerPicker(false);
                  }}
                  activeOpacity={0.7}
                  style={[
                    styles.modalRow,
                    idx !== members.length - 1 && styles.modalRowBorder,
                  ]}
                >
                  <Avatar member={m} size={36} />
                  <Text style={[
                    styles.modalRowText,
                    selected && { color: COLORS.CRIMSON, fontWeight: '700' },
                  ]}>
                    {m.id === myUserId ? 'You' : m.name}
                  </Text>
                  {selected && (
                    <Icon name="check" size={18} color={COLORS.CRIMSON} />
                  )}
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ─── CATEGORY PICKER MODAL ─── */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}
          style={styles.modalBackdrop}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Choose a category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(c => {
                const selected = c.key === category;
                return (
                  <TouchableOpacity
                    key={c.key}
                    onPress={() => {
                      setCategory(c.key);
                      setShowCategoryPicker(false);
                    }}
                    activeOpacity={0.7}
                    style={[
                      styles.categoryTile,
                      selected && styles.categoryTileSelected,
                    ]}
                  >
                    <Text style={styles.categoryTileEmoji}>{c.emoji}</Text>
                    <Text style={[
                      styles.categoryTileLabel,
                      selected && { color: COLORS.CRIMSON, fontWeight: '700' },
                    ]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

/* ─── STYLES ───────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.GHOST },
  scroll: { flex: 1 },

  /* HEADER */
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 30,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    top: -40, right: -40,
    width: 160, height: 160,
    borderRadius: 9999,
    backgroundColor: 'rgba(220,20,60,0.18)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBtn: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.CRIMSON,
  },
  saveBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  saveBtnText: {
    color: COLORS.WHITE,
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtnTextDisabled: {
    color: 'rgba(255,255,255,0.50)',
  },
  groupContext: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },

  /* AMOUNT INPUT */
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: 18,
    gap: 8,
  },
  currencyLabel: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
  amountInput: {
    color: COLORS.WHITE,
    fontSize: 46,
    fontWeight: '800',
    letterSpacing: -1,
    padding: 0,
    minWidth: 100,
    textAlign: 'left',
  },

  /* SHEET */
  sheet: {
    backgroundColor: COLORS.WHITE,
    marginTop: -16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 24,
    flex: 1,
  },

  /* LABEL */
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.GRAY600,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  /* TEXT FIELD */
  field: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  fieldInput: {
    fontSize: 15,
    color: COLORS.GRAY800,
    fontWeight: '500',
    padding: 0,
  },

  /* ROW */
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  rowItem: {
    flex: 1,
  },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY200,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.GRAY800,
    fontWeight: '600',
  },
  categoryEmoji: {
    fontSize: 20,
  },

  /* AVATAR */
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.WHITE,
    fontWeight: '700',
  },

  /* RECEIPT */
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY200,
    borderStyle: 'dashed',
    backgroundColor: COLORS.GHOST,
  },
  receiptBtnText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.GRAY600,
  },
  comingSoonPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.GRAY200,
  },
  comingSoonText: {
    fontSize: 9,
    color: COLORS.GRAY600,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  /* SPLIT TABS */
  splitTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.GHOST,
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  splitTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  splitTabActive: {
    backgroundColor: COLORS.WHITE,
    shadowColor: '#0F2640',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  splitTabLocked: {
    opacity: 0.5,
  },
  splitTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.GRAY600,
  },
  splitTabTextActive: {
    color: COLORS.CRIMSON,
    fontWeight: '800',
  },
  splitTabTextLocked: {
    color: COLORS.GRAY400,
  },

  /* PARTICIPANTS */
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantsCount: {
    fontSize: 11,
    color: COLORS.GRAY400,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  participantList: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.GRAY200,
    overflow: 'hidden',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  participantRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY100,
  },
  participantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.GRAY800,
  },
  participantShare: {
    fontSize: 11,
    color: COLORS.GRAY600,
    marginTop: 2,
  },
  checkbox: {
    width: 22, height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.GRAY400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.CRIMSON,
    borderColor: COLORS.CRIMSON,
  },

  /* SUM INDICATOR */
  sumIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  sumOk: {
    backgroundColor: 'rgba(39,174,96,0.10)',
  },
  sumWarn: {
    backgroundColor: 'rgba(243,156,18,0.10)',
  },
  sumText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* BOTTOM BUTTON */
  bottomBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: COLORS.CRIMSON,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  bottomBtnText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bottomBtnDisabled: {
    backgroundColor: COLORS.GRAY200,
    shadowOpacity: 0,
    elevation: 0,
  },
  bottomBtnTextDisabled: {
    color: COLORS.GRAY400,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* MODAL */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,31,74,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: 22,
    paddingBottom: 28,
  },
  modalHandle: {
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.GRAY200,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.GRAY800,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  modalRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY100,
  },
  modalRowText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.GRAY800,
    fontWeight: '500',
  },

  /* CATEGORY GRID */
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryTile: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY200,
    backgroundColor: COLORS.GHOST,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  categoryTileSelected: {
    borderColor: COLORS.CRIMSON,
    backgroundColor: 'rgba(220,20,60,0.06)',
  },
  categoryTileEmoji: {
    fontSize: 26,
  },
  categoryTileLabel: {
    fontSize: 11,
    color: COLORS.GRAY600,
    fontWeight: '600',
  },
});

export default AddExpenseScreen;