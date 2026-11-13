import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchApiWithFallback } from './apiService';

export type RankingPeriod = 'week' | 'month';
export const RANK_REWARDS = [50, 40, 30, 25, 20, 15, 12, 10, 7, 5] as const;
export const rewardForRank = (rank: number) => RANK_REWARDS[rank - 1] ?? 0;
export interface RankedReader {
  customerId: string;
  name: string;
  avatarUrl: string | null;
  rank: number;
  points: number;
}
export interface LeaderboardData {
  period: RankingPeriod;
  startsAt: string;
  endsAt: string;
  top: RankedReader[];
  me: RankedReader | null;
  above: RankedReader | null;
}

/** Calendar boundaries in Asia/Ho_Chi_Minh; Monday starts the week. */
export function rankingWindow(period: RankingPeriod, now = Date.now()) {
  const offset = 7 * 60 * 60 * 1000;
  const date = new Date(now + offset);
  date.setUTCHours(0, 0, 0, 0);
  if (period === 'week') date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  else date.setUTCDate(1);
  const startsAt = new Date(date.getTime() - offset).toISOString();
  if (period === 'week') date.setUTCDate(date.getUTCDate() + 7);
  else date.setUTCMonth(date.getUTCMonth() + 1);
  return { startsAt, endsAt: new Date(date.getTime() - offset).toISOString() };
}

const configuredPath = process.env.EXPO_PUBLIC_LEADERBOARD_PATH?.trim();
export const hasLeaderboardSource = Boolean(configuredPath);

function isReader(value: unknown): value is RankedReader {
  if (!value || typeof value !== 'object') return false;
  const reader = value as RankedReader;
  return typeof reader.customerId === 'string' && typeof reader.name === 'string'
    && reader.name.trim().length > 0 && Number.isSafeInteger(reader.rank) && reader.rank > 0
    && Number.isSafeInteger(reader.points) && reader.points >= 0
    && (reader.avatarUrl === null || typeof reader.avatarUrl === 'string');
}

export function parseLeaderboard(value: unknown, period: RankingPeriod): LeaderboardData {
  const data = value as LeaderboardData;
  if (!data || data.period !== period || !Array.isArray(data.top)
    || data.top.length > 10 || !data.top.every(isReader)
    || !(data.me === null || isReader(data.me)) || !(data.above === null || isReader(data.above))
    || !Number.isFinite(Date.parse(data.startsAt)) || !Number.isFinite(Date.parse(data.endsAt))
    || Date.parse(data.startsAt) >= Date.parse(data.endsAt)) {
    throw new Error('Dữ liệu bảng xếp hạng không hợp lệ.');
  }
  const ids = new Set<string>();
  data.top.forEach((reader, index) => {
    if (reader.rank !== index + 1 || ids.has(reader.customerId)
      || (index > 0 && reader.points > data.top[index - 1].points)) {
      throw new Error('Thứ hạng từ máy chủ không hợp lệ.');
    }
    ids.add(reader.customerId);
  });
  if (data.above && (!data.me || data.above.rank !== data.me.rank - 1 || data.above.points < data.me.points)) {
    throw new Error('Tiến độ cá nhân từ máy chủ không hợp lệ.');
  }
  if (data.me && ((data.me.rank === 1 && data.above !== null) || (data.me.rank > 1 && data.above === null))) {
    throw new Error('Thiếu dữ liệu người đứng ngay phía trên.');
  }
  if (data.me && data.me.rank <= 10) {
    const listed = data.top[data.me.rank - 1];
    if (!listed || listed.customerId !== data.me.customerId || listed.points !== data.me.points) {
      throw new Error('Điểm cá nhân chưa đồng bộ với bảng xếp hạng.');
    }
  }
  return data;
}

export async function getLeaderboard(period: RankingPeriod, signal: AbortSignal): Promise<LeaderboardData> {
  if (!configuredPath || !configuredPath.startsWith('/') || configuredPath.startsWith('//') || configuredPath.includes('?')) {
    throw new Error('Chưa kết nối nguồn dữ liệu xếp hạng.');
  }
  const token = await AsyncStorage.getItem('userToken');
  const result = await fetchApiWithFallback<unknown>(`${configuredPath}?period=${period}`, {
    signal,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return parseLeaderboard(result.data, period);
}
