import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, StatusBar, SafeAreaView, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';

/* ─── BRAND TOKENS ─────────────────────────────────────────── */
const C = {
  CRIMSON: '#DC143C', CRIMSON_DARK: '#A01030',
  BLUE: '#1A2B5F', BLUE_DARK: '#0F1F4A',
  WHITE: '#FFFFFF', GHOST: '#F7F8FB',
  GRAY200: '#E1E5EE', GRAY400: '#9AA3B5',
  GRAY600: '#5A6478', GRAY800: '#1F2A44',
  SUCCESS: '#27AE60', WARN: '#F39C12', ERROR: '#E74C3C',
};

/* ─── ICONS ────────────────────────────────────────────────── */
const Icon = ({ name, size = 18, color = C.GRAY400 }: {
  name: string; size?: number; color?: string;
}) => {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: 2,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  if (name === 'back') return <Svg {...p}><Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" /></Svg>;
  if (name === 'check') return <Svg {...p}><Polyline points="20 6 9 17 4 12" /></Svg>;
  if (name === 'chevron') return <Svg {...p}><Polyline points="9 18 15 12 9 6" /></Svg>;
  if (name === 'tag') return <Svg {...p}><Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><Line x1="7" y1="7" x2="7.01" y2="7" /></Svg>;
  if (name === 'camera') return <Svg {...p}><Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><Circle cx="12" cy="13" r="4" /></Svg>;
  if (name === 'lock') return <Svg {...p}><Path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4" /></Svg>;
  return null;
};

/* ─── MONEY HELPERS (integer cents — avoids floating-point drift) ─── */
/** Parse "8000.50" → 800050 cents */
const toCents = (s: string): number => {
  const n = parseFloat(s.replace(/,/g, ''));
  if (isNaN(n) || n < 0) return 0;
  return Math.round(n * 100);
};

/** 800050 → "8,000.50" */
const fromCents = (c: number): string =>
  (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Display helper */
const fmt = (n: number) => fromCents(Math.round(Math.abs(n) * 100));

/* ─── TYPES ────────────────────────────────────────────────── */
export interface Member {
  id: string;
  name: string;
  avatarColor: string;
}

type SplitMethod = 'equal' | 'exact' | 'percent' | 'shares';

export interface ExpensePayload {
  description: string;
  amount: number;          // in the group's currency unit
  paidBy: string;          // member id
  category: string;
  splitMethod: SplitMethod;
  participants: string[];  // member ids
  shares: Record<string, number>; // memberId → amount owed (in currency unit)
}

/* ─── CATEGORIES ───────────────────────────────────────────── */
const CATEGORIES = [
  { key: 'food', emoji: '🍽️', label: 'Food' },
  { key: 'transport', emoji: '🚕', label: 'Transport' },
  { key: 'hotel', emoji: '🏨', label: 'Stay' },
  { key: 'tickets', emoji: '🎟️', label: 'Tickets' },
  { key: 'shopping', emoji: '🛍️', label: 'Shopping' },
  { key: 'fuel', emoji: '⛽', label: 'Fuel' },
  { key: 'utility', emoji: '🧾', label: 'Utility' },
  { key: 'other', emoji: '📦', label: 'Other' },
];

/* ─── AVATAR ───────────────────────────────────────────────── */
const Avatar = ({ member, size = 36 }: { member: Member; size?: number }) => (
  <View style={[s.avatar, {
    width: size, height: size, borderRadius: size / 2, backgroundColor: member.avatarColor,
  }]}>
    <Text style={[s.avatarText, { fontSize: size * 0.4 }]}>
      {member.name.charAt(0).toUpperCase()}
    </Text>
  </View>
);

/* ─── PROPS ────────────────────────────────────────────────── */
interface Props {
  groupName: string;
  groupCurrency: string;
  members: Member[];       // required — no defaults
  myUserId: string;
  onBack?: () => void;
  onSave?: (expense: ExpensePayload) => void;
}

/* ─── MAIN SCREEN ──────────────────────────────────────────── */
const AddExpenseScreen: React.FC<Props> = ({
  groupName, groupCurrency, members, myUserId, onBack, onSave,
}) => {
  /* ── Form state ── */
  const [amountRaw, setAmountRaw] = useState('');
  const [description, setDescription] = useState('');
  const [paidBy, setPaidBy] = useState(myUserId);
  const [category, setCategory] = useState('food');
  const [method, setMethod] = useState<SplitMethod>('equal');
  const [participants, setParticipants] = useState<string[]>(members.map(m => m.id));
  const [showPayerModal, setShowPayerModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);

  /* Per-person input maps for exact / percent / shares */
  const [exactInputs, setExactInputs] = useState<Record<string, string>>({});
  const [percentInputs, setPercentInputs] = useState<Record<string, string>>({});
  const [shareInputs, setShareInputs] = useState<Record<string, string>>({});

  /* ── Derived: total in cents ── */
  const totalCents = useMemo(() => toCents(amountRaw), [amountRaw]);

  /* ── Computed shares (in cents) for each method ── */
  const computedSharesCents = useMemo((): Record<string, number> => {
    if (totalCents === 0 || participants.length === 0) return {};
    const active = participants; // ids

    if (method === 'equal') {
      const base = Math.floor(totalCents / active.length);
      const remainder = totalCents - base * active.length;
      const out: Record<string, number> = {};
      active.forEach(id => { out[id] = base; });
      // Remainder goes to payer if they're a participant, else first participant
      const remainderTarget = active.includes(paidBy) ? paidBy : active[0];
      out[remainderTarget] += remainder;
      return out;
    }

    if (method === 'exact') {
      const out: Record<string, number> = {};
      active.forEach(id => { out[id] = toCents(exactInputs[id] ?? '0'); });
      return out;
    }

    if (method === 'percent') {
      const out: Record<string, number> = {};
      active.forEach(id => {
        const pct = parseFloat(percentInputs[id] ?? '0') || 0;
        out[id] = Math.round(totalCents * pct / 100);
      });
      // Distribute rounding error to payer
      const distributed = Object.values(out).reduce((a, b) => a + b, 0);
      const diff = totalCents - distributed;
      if (diff !== 0) {
        const target = active.includes(paidBy) ? paidBy : active[0];
        out[target] = (out[target] ?? 0) + diff;
      }
      return out;
    }

    if (method === 'shares') {
      const unitMap: Record<string, number> = {};
      active.forEach(id => {
        unitMap[id] = Math.max(0, parseFloat(shareInputs[id] ?? '1') || 0);
      });
      const totalUnits = Object.values(unitMap).reduce((a, b) => a + b, 0);
      if (totalUnits === 0) return {};
      const out: Record<string, number> = {};
      active.forEach(id => {
        out[id] = Math.floor(totalCents * unitMap[id] / totalUnits);
      });
      const distributed = Object.values(out).reduce((a, b) => a + b, 0);
      const diff = totalCents - distributed;
      if (diff !== 0) {
        const target = active.includes(paidBy) ? paidBy : active[0];
        out[target] = (out[target] ?? 0) + diff;
      }
      return out;
    }

    return {};
  }, [method, totalCents, participants, paidBy, exactInputs, percentInputs, shareInputs]);

  /* ── Validation ── */
  const sumCents = useMemo(() => Object.values(computedSharesCents).reduce((a, b) => a + b, 0), [computedSharesCents]);
  const splitValid = Math.abs(sumCents - totalCents) <= 1 && participants.length > 0;

  const percentSum = useMemo(() => {
    if (method !== 'percent') return 100;
    return participants.reduce((a, id) => a + (parseFloat(percentInputs[id] ?? '0') || 0), 0);
  }, [method, participants, percentInputs]);

  const canSave = totalCents > 0 && description.trim().length > 0 && participants.length > 0 && splitValid;

  /* ── Handlers ── */
  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmountRaw(cleaned);
  };

  const toggleParticipant = useCallback((id: string) => {
    setParticipants(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }, []);

  const handleMethodChange = (m: SplitMethod) => {
    setMethod(m);
    // Pre-fill inputs with sensible defaults when switching
    if (m === 'shares') {
      const defaults: Record<string, string> = {};
      participants.forEach(id => { defaults[id] = shareInputs[id] ?? '1'; });
      setShareInputs(defaults);
    }
    if (m === 'percent') {
      const equalPct = participants.length > 0
        ? (100 / participants.length).toFixed(1)
        : '0';
      const defaults: Record<string, string> = {};
      participants.forEach(id => { defaults[id] = percentInputs[id] ?? equalPct; });
      setPercentInputs(defaults);
    }
  };

  const handleSave = () => {
    if (!canSave) return;
    const sharesInCurrency: Record<string, number> = {};
    Object.entries(computedSharesCents).forEach(([id, c]) => {
      sharesInCurrency[id] = c / 100;
    });
    onSave?.({
      description: description.trim(),
      amount: totalCents / 100,
      paidBy,
      category,
      splitMethod: method,
      participants,
      shares: sharesInCurrency,
    });
  };

  /* ── Lookups ── */
  const paidByMember = members.find(m => m.id === paidBy) ?? members[0];
  const selectedCat = CATEGORIES.find(c => c.key === category) ?? CATEGORIES[0];
  const activeParts = members.filter(m => participants.includes(m.id));

  /* ── Summary indicator text ── */
  const indicatorText = () => {
    if (totalCents === 0) return null;
    if (participants.length === 0) return { text: 'Select at least one participant', color: C.ERROR };

    if (method === 'percent') {
      const diff = 100 - percentSum;
      if (Math.abs(diff) > 0.1) return {
        text: `Percentages sum to ${percentSum.toFixed(1)}% — need ${diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}% more`,
        color: C.WARN,
      };
    }
    if (method === 'exact') {
      const diff = totalCents - sumCents;
      if (Math.abs(diff) > 1) return {
        text: `Amounts sum to ${fromCents(sumCents)} — ${diff > 0 ? `${fromCents(diff)} unallocated` : `${fromCents(-diff)} over`}`,
        color: diff > 0 ? C.WARN : C.ERROR,
      };
    }
    if (splitValid) return { text: `✓ Splits sum to ${fromCents(totalCents)} ${groupCurrency}`, color: C.SUCCESS };
    return null;
  };
  const indicator = indicatorText();

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.BLUE_DARK} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── HEADER ─── */}
          <LinearGradient colors={[C.BLUE_DARK, C.BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
            <View style={s.topRow}>
              <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.iconBtn}>
                <Icon name="back" size={18} color={C.WHITE} />
              </TouchableOpacity>
              <Text style={s.headerTitle}>Add Expense</Text>
              <TouchableOpacity onPress={handleSave} disabled={!canSave} activeOpacity={0.7}
                style={[s.saveBtn, !canSave && s.saveBtnOff]}>
                <Text style={[s.saveBtnText, !canSave && s.saveBtnTextOff]}>Save</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.headerSub}>in {groupName}</Text>

            {/* Amount */}
            <View style={s.amountRow}>
              <Text style={s.currLabel}>{groupCurrency}</Text>
              <TextInput
                value={amountRaw}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.35)"
                keyboardType="decimal-pad"
                style={s.amountInput}
                maxLength={13}
              />
            </View>
          </LinearGradient>

          {/* ─── SHEET ─── */}
          <View style={s.sheet}>

            {/* Description */}
            <Text style={s.label}>DESCRIPTION</Text>
            <View style={s.field}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What was this for?"
                placeholderTextColor={C.GRAY400}
                style={s.fieldInput}
                maxLength={80}
              />
            </View>

            {/* Paid by + Category row */}
            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>PAID BY</Text>
                <TouchableOpacity onPress={() => setShowPayerModal(true)} activeOpacity={0.7} style={s.pickerBtn}>
                  <Avatar member={paidByMember} size={26} />
                  <Text style={s.pickerText} numberOfLines={1}>
                    {paidBy === myUserId ? 'You' : paidByMember.name}
                  </Text>
                  <Icon name="chevron" size={13} color={C.GRAY400} />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>CATEGORY</Text>
                <TouchableOpacity onPress={() => setShowCatModal(true)} activeOpacity={0.7} style={s.pickerBtn}>
                  <Text style={{ fontSize: 18 }}>{selectedCat.emoji}</Text>
                  <Text style={s.pickerText} numberOfLines={1}>{selectedCat.label}</Text>
                  <Icon name="chevron" size={13} color={C.GRAY400} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Receipt (locked until Increment 3) */}
            <TouchableOpacity disabled activeOpacity={0.7} style={s.receiptRow}>
              <Icon name="camera" size={16} color={C.GRAY400} />
              <Text style={s.receiptText}>Attach receipt</Text>
              <View style={s.lockedPill}><Text style={s.lockedText}>Increment 3</Text></View>
            </TouchableOpacity>

            {/* ── Split Method Tabs ── */}
            <Text style={[s.label, { marginTop: 20 }]}>SPLIT METHOD</Text>
            <View style={s.methodTabs}>
              {(['equal', 'exact', 'percent', 'shares'] as SplitMethod[]).map(m => {
                const active = method === m;
                const labels: Record<SplitMethod, string> = {
                  equal: 'Equal', exact: 'Exact', percent: '%', shares: 'Shares',
                };
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => handleMethodChange(m)}
                    activeOpacity={0.7}
                    style={[s.methodTab, active && s.methodTabActive]}
                  >
                    <Text style={[s.methodTabText, active && s.methodTabTextActive]}>
                      {labels[m]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Method description */}
            <Text style={s.methodDesc}>
              {method === 'equal' && 'Divide total evenly. Rounding goes to payer.'}
              {method === 'exact' && 'Enter the exact amount each person owes.'}
              {method === 'percent' && 'Enter each person\'s percentage share. Must total 100%.'}
              {method === 'shares' && 'Enter share units (e.g. 2, 1, 1). Amounts are calculated proportionally.'}
            </Text>

            {/* ── Participants ── */}
            <View style={s.partHeader}>
              <Text style={s.label}>SPLIT BETWEEN</Text>
              <Text style={s.partCount}>{participants.length} / {members.length}</Text>
            </View>

            <View style={s.partList}>
              {members.map((m, idx) => {
                const isActive = participants.includes(m.id);
                const isLast = idx === members.length - 1;
                const shareCents = computedSharesCents[m.id] ?? 0;

                return (
                  <View
                    key={m.id}
                    style={[s.partRow, !isLast && s.partRowBorder]}
                  >
                    {/* Checkbox — tap to toggle */}
                    <TouchableOpacity onPress={() => toggleParticipant(m.id)} activeOpacity={0.7}
                      style={[s.checkbox, isActive && s.checkboxActive]}>
                      {isActive && <Icon name="check" size={12} color={C.WHITE} />}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => toggleParticipant(m.id)}
                      activeOpacity={0.7}
                      style={s.partInfo}
                    >
                      <Avatar member={m} size={36} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[s.partName, !isActive && s.partNameOff]}>
                          {m.id === myUserId ? 'You' : m.name}
                        </Text>
                        {isActive && totalCents > 0 && method === 'equal' && (
                          <Text style={s.partShare}>
                            Owes {fromCents(shareCents)} {groupCurrency}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Right-side input — only shown when participant is active */}
                    {isActive && (
                      <>
                        {method === 'exact' && (
                          <TextInput
                            value={exactInputs[m.id] ?? ''}
                            onChangeText={v => {
                              const cleaned = v.replace(/[^0-9.]/g, '');
                              setExactInputs(prev => ({ ...prev, [m.id]: cleaned }));
                            }}
                            placeholder="0.00"
                            placeholderTextColor={C.GRAY400}
                            keyboardType="decimal-pad"
                            style={s.inlineInput}
                            maxLength={10}
                          />
                        )}
                        {method === 'percent' && (
                          <View style={s.inlineInputWrap}>
                            <TextInput
                              value={percentInputs[m.id] ?? ''}
                              onChangeText={v => {
                                const cleaned = v.replace(/[^0-9.]/g, '');
                                setPercentInputs(prev => ({ ...prev, [m.id]: cleaned }));
                              }}
                              placeholder="0"
                              placeholderTextColor={C.GRAY400}
                              keyboardType="decimal-pad"
                              style={[s.inlineInput, { paddingRight: 22 }]}
                              maxLength={5}
                            />
                            <Text style={s.inlineUnit}>%</Text>
                          </View>
                        )}
                        {method === 'shares' && (
                          <View style={s.inlineInputWrap}>
                            <TextInput
                              value={shareInputs[m.id] ?? '1'}
                              onChangeText={v => {
                                const cleaned = v.replace(/[^0-9.]/g, '');
                                setShareInputs(prev => ({ ...prev, [m.id]: cleaned }));
                              }}
                              placeholder="1"
                              placeholderTextColor={C.GRAY400}
                              keyboardType="decimal-pad"
                              style={s.inlineInput}
                              maxLength={4}
                            />
                            {/* Show calculated amount below the unit input */}
                          </View>
                        )}
                        {/* Computed amount shown for percent/shares */}
                        {(method === 'percent' || method === 'shares') && totalCents > 0 && shareCents > 0 && (
                          <Text style={s.computedAmount}>
                            = {fromCents(shareCents)}
                          </Text>
                        )}
                      </>
                    )}
                  </View>
                );
              })}
            </View>

            {/* ── Sum indicator (SRS §5.5) ── */}
            {indicator && (
              <View style={[s.indicator, { backgroundColor: indicator.color + '15' }]}>
                <Text style={[s.indicatorText, { color: indicator.color }]}>
                  {indicator.text}
                </Text>
              </View>
            )}

            {/* ── Save button ── */}
            <TouchableOpacity activeOpacity={0.85} onPress={handleSave} disabled={!canSave} style={{ marginTop: 22 }}>
              {canSave ? (
                <LinearGradient colors={[C.CRIMSON, C.CRIMSON_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.saveFullBtn}>
                  <Text style={s.saveFullBtnText}>Save Expense</Text>
                </LinearGradient>
              ) : (
                <View style={[s.saveFullBtn, s.saveFullBtnOff]}>
                  <Text style={s.saveFullBtnTextOff}>Save Expense</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── PAYER PICKER MODAL ─── */}
      <Modal visible={showPayerModal} transparent animationType="fade" onRequestClose={() => setShowPayerModal(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setShowPayerModal(false)} style={s.backdrop}>
          <TouchableOpacity activeOpacity={1} style={s.bottomSheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Who paid?</Text>
            {members.map((m, i) => {
              const sel = m.id === paidBy;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => { setPaidBy(m.id); setShowPayerModal(false); }}
                  activeOpacity={0.7}
                  style={[s.sheetRow, i < members.length - 1 && s.sheetRowBorder]}
                >
                  <Avatar member={m} size={38} />
                  <Text style={[s.sheetRowText, sel && s.sheetRowTextSel]}>
                    {m.id === myUserId ? 'You' : m.name}
                  </Text>
                  {sel && <Icon name="check" size={18} color={C.CRIMSON} />}
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ─── CATEGORY PICKER MODAL ─── */}
      <Modal visible={showCatModal} transparent animationType="fade" onRequestClose={() => setShowCatModal(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setShowCatModal(false)} style={s.backdrop}>
          <TouchableOpacity activeOpacity={1} style={s.bottomSheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Choose category</Text>
            <View style={s.catGrid}>
              {CATEGORIES.map(cat => {
                const sel = cat.key === category;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => { setCategory(cat.key); setShowCatModal(false); }}
                    activeOpacity={0.7}
                    style={[s.catTile, sel && s.catTileSel]}
                  >
                    <Text style={s.catEmoji}>{cat.emoji}</Text>
                    <Text style={[s.catTileLabel, sel && s.catTileLabelSel]}>{cat.label}</Text>
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
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.GHOST },

  /* HEADER */
  header: { paddingTop: 20, paddingHorizontal: 24, paddingBottom: 28, overflow: 'hidden' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: C.WHITE, fontSize: 16, fontWeight: '700' },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: C.CRIMSON },
  saveBtnOff: { backgroundColor: 'rgba(255,255,255,0.15)' },
  saveBtnText: { color: C.WHITE, fontSize: 13, fontWeight: '700' },
  saveBtnTextOff: { color: 'rgba(255,255,255,0.45)' },
  headerSub: { color: 'rgba(255,255,255,0.70)', fontSize: 12, textAlign: 'center', marginTop: 6, fontStyle: 'italic' },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 16, gap: 8 },
  currLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 15, fontWeight: '700', letterSpacing: 1 },
  amountInput: { color: C.WHITE, fontSize: 48, fontWeight: '800', letterSpacing: -1, padding: 0, minWidth: 80, textAlign: 'left' },

  /* SHEET */
  sheet: { backgroundColor: C.WHITE, marginTop: -16, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 24 },
  label: { fontSize: 11, fontWeight: '700', color: C.GRAY600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  field: { borderWidth: 1.5, borderColor: C.GRAY200, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14, backgroundColor: C.WHITE },
  fieldInput: { fontSize: 15, color: C.GRAY800, fontWeight: '500', padding: 0 },
  twoCol: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: C.GRAY200, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.WHITE },
  pickerText: { flex: 1, fontSize: 13, color: C.GRAY800, fontWeight: '600' },
  receiptRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: C.GRAY200, borderStyle: 'dashed', backgroundColor: C.GHOST, marginBottom: 6 },
  receiptText: { flex: 1, fontSize: 13, color: C.GRAY600, fontWeight: '600' },
  lockedPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: C.GRAY200 },
  lockedText: { fontSize: 9, color: C.GRAY600, fontWeight: '700', letterSpacing: 0.5 },

  /* METHOD TABS */
  methodTabs: { flexDirection: 'row', backgroundColor: C.GHOST, borderRadius: 12, padding: 4, marginBottom: 10 },
  methodTab: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  methodTabActive: { backgroundColor: C.WHITE, shadowColor: '#0F2640', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  methodTabText: { fontSize: 12, fontWeight: '600', color: C.GRAY600 },
  methodTabTextActive: { color: C.CRIMSON, fontWeight: '800' },
  methodDesc: { fontSize: 11, color: C.GRAY400, fontStyle: 'italic', marginBottom: 18, textAlign: 'center' },

  /* PARTICIPANTS */
  partHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  partCount: { fontSize: 11, color: C.GRAY400, fontWeight: '600' },
  partList: { borderWidth: 1, borderColor: C.GRAY200, borderRadius: 12, overflow: 'hidden', backgroundColor: C.WHITE },
  partRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14, gap: 10, minHeight: 58 },
  partRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  partInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  partName: { fontSize: 14, fontWeight: '700', color: C.GRAY800 },
  partNameOff: { color: C.GRAY400 },
  partShare: { fontSize: 11, color: C.GRAY600, marginTop: 2 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.GRAY400, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: C.CRIMSON, borderColor: C.CRIMSON },

  /* Inline inputs (exact / percent / shares) */
  inlineInputWrap: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  inlineInput: { width: 76, borderWidth: 1.5, borderColor: C.GRAY200, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, fontSize: 13, fontWeight: '700', color: C.GRAY800, textAlign: 'right' },
  inlineUnit: { position: 'absolute', right: 8, fontSize: 13, color: C.GRAY400, fontWeight: '700' },
  computedAmount: { fontSize: 11, color: C.GRAY600, fontWeight: '600', marginLeft: 4, minWidth: 50, textAlign: 'right' },

  /* INDICATOR */
  indicator: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginTop: 12 },
  indicatorText: { fontSize: 12, fontWeight: '700', flex: 1 },

  /* SAVE BUTTON */
  saveFullBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', shadowColor: C.CRIMSON, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 8 },
  saveFullBtnText: { color: C.WHITE, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  saveFullBtnOff: { backgroundColor: C.GRAY200, shadowOpacity: 0, elevation: 0 },
  saveFullBtnTextOff: { color: C.GRAY400, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },

  /* MODALS */
  backdrop: { flex: 1, backgroundColor: 'rgba(15,31,74,0.55)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: C.WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, paddingHorizontal: 22, paddingBottom: 28 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.GRAY200, alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: C.GRAY800, marginBottom: 14 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  sheetRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  sheetRowText: { flex: 1, fontSize: 14, color: C.GRAY800, fontWeight: '500' },
  sheetRowTextSel: { color: C.CRIMSON, fontWeight: '700' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catTile: { width: '22%', aspectRatio: 1, borderRadius: 14, borderWidth: 1.5, borderColor: C.GRAY200, backgroundColor: C.GHOST, alignItems: 'center', justifyContent: 'center', gap: 4 },
  catTileSel: { borderColor: C.CRIMSON, backgroundColor: 'rgba(220,20,60,0.06)' },
  catEmoji: { fontSize: 26 },
  catTileLabel: { fontSize: 10, color: C.GRAY600, fontWeight: '600' },
  catTileLabelSel: { color: C.CRIMSON, fontWeight: '700' },

  /* AVATAR */
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: C.WHITE, fontWeight: '700' },
});

export default AddExpenseScreen;