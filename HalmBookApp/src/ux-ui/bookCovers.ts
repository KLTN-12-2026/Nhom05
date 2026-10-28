// Cấu hình URL ảnh bìa sách từ Backend cho App Expo
const API_BASE_URL = 'http://192.168.2.77:8082';

export const getBookCoverSource = (bookId?: string, remoteUrl?: string): any => {
  if (remoteUrl && typeof remoteUrl === 'string' && remoteUrl.trim().length > 0) {
    if (remoteUrl.startsWith('http://') || remoteUrl.startsWith('https://')) {
      return { uri: remoteUrl };
    }
    const cleanPath = remoteUrl.startsWith('/') ? remoteUrl : `/${remoteUrl}`;
    return { uri: `${API_BASE_URL}${cleanPath}` };
  }
  if (bookId && typeof bookId === 'string' && bookId.trim().length > 0) {
    return { uri: `${API_BASE_URL}/api/home/covers/${bookId}.jpg` };
  }
  return null;
};
