import axios from './axiosClient.js';
export const getMissions = signal => axios.get('/api/home/missions', { signal }).then(r => r.data);
export const claimMission = missionId => axios.post('/api/home/missions/claim', { missionId }).then(r => r.data);
export const recordMissionVisit = (kind, keyword, signal) => axios.post('/api/home/missions/activity', { kind, ...(keyword ? { keyword } : {}) }, { signal }).then(r => r.data);
export const readingMissionHeartbeat = (bookId, sessionId, signal) => axios.post('/api/home/missions/reading-heartbeat', { bookId, sessionId }, { signal }).then(r => r.data);
export const getAdminMissions = () => axios.get('/api/admin/missions').then(r => r.data);
export const saveAdminMission = mission => (mission.id ? axios.put('/api/admin/missions/' + encodeURIComponent(mission.id), mission) : axios.post('/api/admin/missions', mission)).then(r => r.data);
export const getMissionClaims = (page = 0) => axios.get('/api/admin/missions/claims', { params: { page } }).then(r => r.data);
