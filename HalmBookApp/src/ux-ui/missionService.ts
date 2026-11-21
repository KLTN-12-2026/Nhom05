import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchApiWithFallback } from './apiService';

export interface ReaderMission {
  id: string; title: string; description: string; condition: string; period: 'DAILY' | 'MILESTONE';
  targetValue: number; progress: number; completed: boolean; claimed: boolean; rewardPotato: number; rewardXp: number;
}
export interface MissionDashboard { missions: ReaderMission[]; today: string; resetAt: string; potatoBalance: number; totalXp: number }
async function request<T>(path = '', data?: unknown, signal?: AbortSignal): Promise<T> {
  const token = await AsyncStorage.getItem('userToken');
  if (!token) throw new Error('Vui lòng đăng nhập để sử dụng nhiệm vụ.');
  return (await fetchApiWithFallback<T>('/api/home/missions' + path, {
    method: data === undefined ? 'GET' : 'POST', data, signal, headers: { Authorization: 'Bearer ' + token },
  })).data;
}
export const getMissions = (signal?: AbortSignal) => request<MissionDashboard>('', undefined, signal);
export const claimMission = (missionId: string) => request<{ message: string; newBalance: number; alreadyClaimed: boolean }>('/claim', { missionId });
export const recordMissionVisit = (kind: 'OFFERS' | 'BOOKSHELF' | 'SEARCH', keyword?: string, signal?: AbortSignal) =>
  request('/activity', { kind, ...(keyword ? { keyword } : {}) }, signal);
export const readingMissionHeartbeat = (bookId: string, sessionId: string, signal?: AbortSignal) =>
  request('/reading-heartbeat', { bookId, sessionId }, signal);
