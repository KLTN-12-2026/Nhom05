import axiosClient from './axiosClient.js';
import { decodeJwtPayload, getValidAuthToken } from './authToken.js';
import { readStorage, writeStorage, readStoredJson } from '../utils/browserStorage.js';

export function getChatOwner() {
    const token = getValidAuthToken();
    return token ? `account:${decodeJwtPayload(token)?.sub || token}` : 'guest';
}

let guestId;
export function getGuestConversationId() {
    guestId ||= readStorage('halm_guest_chat_id', false) || crypto.randomUUID();
    writeStorage('halm_guest_chat_id', guestId, false);
    return guestId;
}

export const sendChatMessage = async (message) => {
    const owner = getChatOwner();
    const response = await axiosClient.post('/api/chat', {
        message, conversationId: getGuestConversationId(),
    }, { timeout: 120000 });
    const reply = response.data?.reply;
    if (typeof reply !== 'string' || !reply.trim()) throw new Error('AI chưa trả về câu trả lời.');
    if (owner === 'guest' && getChatOwner() === owner) {
        const stored = readStoredJson('halm_guest_chat_history', [], false);
        const history = Array.isArray(stored) ? stored : [];
        const sentAt = new Date().toISOString();
        history.push({ id: crypto.randomUUID(), sender: 'user', content: message, sentAt },
            { id: crypto.randomUUID(), sender: 'bot', content: reply, sentAt });
        writeStorage('halm_guest_chat_history', JSON.stringify(history.slice(-100)), false);
    }
    return reply;
};

export const getChatHistory = async () => {
    if (getChatOwner() === 'guest') {
        const history = readStoredJson('halm_guest_chat_history', [], false);
        return Array.isArray(history) ? history : [];
    }
    const response = await axiosClient.get('/api/chat/history');
    if (!Array.isArray(response.data)) throw new Error('Lịch sử chat không hợp lệ.');
    return response.data;
};

export const clearChatHistory = async () => {
    const owner = getChatOwner();
    await axiosClient.delete('/api/chat/history', { params: { conversationId: getGuestConversationId() } });
    if (owner === 'guest' && getChatOwner() === owner) writeStorage('halm_guest_chat_history', null, false);
};

export function formatChatTime(value) {
    if (!value) return '';
    if (/^\d{2}:\d{2}$/.test(value)) return value;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
