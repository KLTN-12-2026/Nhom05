import { API_BASE_URL } from './apiService';

export { API_BASE_URL };

export const getBookCoverSource = (bookId?: string, remoteUrl?: string): any => {
  if (remoteUrl && typeof remoteUrl === 'string' && remoteUrl.trim().length > 0) {
    if (
      remoteUrl.startsWith('http://') ||
      remoteUrl.startsWith('https://') ||
      remoteUrl.startsWith('data:') ||
      remoteUrl.startsWith('file://')
    ) {
      return { uri: remoteUrl };
    }
    const cleanPath = remoteUrl.startsWith('/') ? remoteUrl : `/${remoteUrl}`;
    return { uri: `${API_BASE_URL}${cleanPath}` };
  }
  if (bookId && typeof bookId === 'string' && bookId.trim().length > 0) {
    if (!bookId.startsWith('upload') && !bookId.startsWith('tmp')) {
      return { uri: `${API_BASE_URL}/api/home/covers/${bookId}.jpg` };
    }
  }
  return null;
};
