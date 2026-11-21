import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Text, TouchableOpacity, View } from 'react-native';
import { claimMission, getMissions, MissionDashboard, ReaderMission } from './missionService';
type MissionDestination = 'bookshelf' | 'chatbot' | 'search' | 'offers';

export default function MissionPanel({ dark, checkedIn, onCheckin, onNavigate, onReward }: {
  dark: boolean; checkedIn?: boolean; onCheckin: () => Promise<void>; onNavigate: (screen: MissionDestination) => void; onReward: () => Promise<void>;
}) {
  const [data, setData] = useState<MissionDashboard | null>(null);
  const [error, setError] = useState(''); const [busy, setBusy] = useState('');
  const pending = useRef(false); const alive = useRef(true); const sequence = useRef(0);
  const text = dark ? '#F1F5F9' : '#1E293B'; const muted = dark ? '#CBD5E1' : '#64748B';
  const refresh = useCallback(async () => {
    const request = ++sequence.current;
    try { const result = await getMissions(); if (alive.current && sequence.current === request) { setData(result); setError(''); } }
    catch (reason: any) { if (alive.current && sequence.current === request) setError(reason?.response?.data?.message || reason.message || 'Không tải được nhiệm vụ.'); }
  }, []);
  useEffect(() => {
    alive.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Load authoritative mission progress over HTTP when the panel opens.
    void refresh();
    const timer = setInterval(() => { if (AppState.currentState === 'active') void refresh(); }, 30000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- This ref is a request generation counter, not a DOM or native view ref.
    return () => { alive.current = false; sequence.current++; clearInterval(timer); listener.remove(); };
  }, [refresh, checkedIn]);
  const act = async (mission: ReaderMission) => {
    if (pending.current || mission.claimed) return;
    if (!mission.completed && mission.condition !== 'CHECKIN') {
      const destination: Record<string, MissionDestination> = { READING_SECONDS: 'bookshelf', CHAT: 'chatbot', SEARCH: 'search', OFFERS: 'offers', BOOKSHELF: 'bookshelf' };
      if (destination[mission.condition]) onNavigate(destination[mission.condition]);
      return;
    }
    pending.current = true; sequence.current++; setBusy(mission.id);
    try {
      if (!mission.completed) await onCheckin();
      else { const receipt = await claimMission(mission.id); Alert.alert('Nhiệm vụ', receipt.message); await onReward(); }
      await refresh();
    } catch (reason: any) { Alert.alert('Nhiệm vụ', reason?.response?.data?.message || reason.message || 'Không nhận được thưởng. Hãy tải lại danh sách.'); await refresh(); }
    finally { pending.current = false; if (alive.current) setBusy(''); }
  };
  return <View style={{ gap: 12, marginTop: 20 }}>
    <Text style={{ fontSize: 20, fontWeight: '700', color: text }}>Nhiệm vụ & thành tựu</Text>
    <Text style={{ color: muted }}>Nhiệm vụ ngày đặt lại lúc 00:00 giờ Việt Nam. Thành tựu nhận một lần.</Text>
    <TouchableOpacity accessibilityRole="button" onPress={() => { void refresh(); }}><Text style={{ color: '#D97706' }}>↻ Tải lại tiến độ</Text></TouchableOpacity>
    {!!error && <Text style={{ color: '#EF4444' }}>{error}</Text>}
    {!data && !error && <ActivityIndicator />}
    {data && data.missions.length === 0 && <Text style={{ color: muted }}>Hiện chưa có nhiệm vụ đang mở.</Text>}
    {(['DAILY', 'MILESTONE'] as const).map(period => <View key={period} style={{ gap: 12 }}>
      <Text style={{ color: text, fontWeight: '700', marginTop: 8 }}>{period === 'DAILY' ? 'Hằng ngày' : 'Thành tựu'}</Text>
      {data?.missions.filter(m => m.period === period).map(m => <View key={m.id} style={{ padding: 16, borderRadius: 16, backgroundColor: dark ? '#1E293B' : '#FFFFFF', gap: 8 }}>
        <Text style={{ color: text, fontWeight: '700', fontSize: 16 }}>{m.title}</Text>
        <Text style={{ color: muted }}>{m.description}</Text>
        <Text style={{ color: '#D97706', fontWeight: '700' }}>+{m.rewardPotato} Khoai · +{m.rewardXp} XP</Text>
        <Text style={{ color: muted }}>{m.progress}/{m.targetValue}{m.condition === 'READING_SECONDS' ? ' giây' : ''}</Text>
        <View style={{ height: 5, backgroundColor: dark ? '#334155' : '#E2E8F0', borderRadius: 5 }}><View style={{ height: 5, width: `${Math.min(100, m.progress / m.targetValue * 100)}%`, backgroundColor: '#D97706', borderRadius: 5 }} /></View>
        <TouchableOpacity accessibilityRole="button" disabled={!!busy || m.claimed || (!m.completed && period === 'MILESTONE')} onPress={() => { void act(m); }} style={{ padding: 12, borderRadius: 10, backgroundColor: m.claimed ? '#475569' : '#9A5B30', opacity: busy || (!m.completed && period === 'MILESTONE') ? 0.5 : 1 }}>
          {busy === m.id ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', textAlign: 'center', fontWeight: '700' }}>{m.claimed ? 'Đã nhận thưởng' : m.completed ? 'Nhận thưởng' : period === 'MILESTONE' ? 'Đang tích lũy' : m.condition === 'CHECKIN' ? 'Điểm danh' : 'Thực hiện'}</Text>}
        </TouchableOpacity>
      </View>)}
    </View>)}
  </View>;
}
