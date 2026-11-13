import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Maximize2, RefreshCw } from 'lucide-react-native';
import { File } from 'expo-file-system';

// [GIẢI THÍCH CODE]: Định nghĩa props cho bộ nhúng tài liệu PDF trực tiếp trong Expo
export interface PdfViewerProps {
  uri: string;
  title?: string;
  onClose?: () => void;
  style?: any;
}

export const PdfEmbedViewer: React.FC<PdfViewerProps> = ({ uri, title, style }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Chuẩn hóa đường dẫn URI an toàn không bị lỗi ký tự Unicode hoặc khoảng trắng
  const safeUri = React.useMemo(() => {
    if (!uri) return '';
    try {
      return encodeURI(decodeURI(uri));
    } catch {
      return uri;
    }
  }, [uri]);

  // [GIẢI THÍCH CODE]: Mở xem toàn màn hình qua Quick Look gốc của hệ điều hành (nếu thiết bị hỗ trợ)
  const handleNativeQuickLook = async () => {
    try {
      if (Platform.OS === 'ios' && safeUri.startsWith('file://')) {
        const file = new File(safeUri);
        const canPrev = await File.canPreview(file);
        if (canPrev) {
          await File.preview(file, { title: title || 'Tài liệu PDF' });
          return;
        }
      }
      Alert.alert(
        'Xem tài liệu',
        'Tài liệu đang được hiển thị trực tiếp trên màn hình.'
      );
    } catch (err) {
      console.warn('[PdfEmbedViewer] Lỗi QuickLook:', err);
    }
  };

  if (!safeUri) {
    return (
      <View style={[styles.container, styles.centerBox, style]}>
        <Text style={styles.errorText}>Không tìm thấy đường dẫn tệp PDF để hiển thị.</Text>
      </View>
    );
  }

  // ============================================================================
  // [GIẢI THÍCH CODE]: 1. TRÊN HỆ ĐIỀU HÀNH iOS (iPhone / iPad)
  // Apple WKWebView tích hợp sẵn PDFKit - Hiển thị 100% trang PDF gốc cực mượt,
  // hỗ trợ cuộn trang, phóng to thu nhỏ (zoom), và đọc trực tiếp trong ứng dụng Expo.
  // ============================================================================
  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.container, style]}>
        <WebView
          key={reloadKey}
          source={{ uri: safeUri }}
          originWhitelist={['*']}
          allowingReadAccessToURL={safeUri}
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          scalesPageToFit={true}
          bounces={true}
          scrollEnabled={true}
          style={styles.webview}
          onLoadStart={() => {
            setLoading(true);
            setError(null);
          }}
          onLoadEnd={() => setLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('[PdfEmbedViewer iOS] WebView error:', nativeEvent);
            setError(nativeEvent.description || 'Không thể hiển thị tệp PDF');
            setLoading(false);
          }}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#f1c40f" />
              <Text style={styles.loadingText}>Đang tải trang sách PDF trực tiếp trong Expo...</Text>
            </View>
          )}
        />

        {/* Thanh công cụ phụ trợ (Toàn màn hình / Tải lại) */}
        <View style={styles.floatingBar}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleNativeQuickLook}
            accessibilityLabel="Mở toàn màn hình Quick Look"
          >
            <Maximize2 size={16} color="#0f172a" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setReloadKey((k) => k + 1)}
            accessibilityLabel="Tải lại trang"
          >
            <RefreshCw size={16} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#f1c40f" />
            <Text style={styles.loadingText}>Đang tải trang sách PDF trực tiếp trong Expo...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorTitle}>Không thể tải nội dung PDF</Text>
            <Text style={styles.errorDesc}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                setError(null);
                setReloadKey((k) => k + 1);
              }}
            >
              <Text style={styles.retryBtnText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ============================================================================
  // [GIẢI THÍCH CODE]: 2. TRÊN HỆ ĐIỀU HÀNH ANDROID
  // Nếu là URL trực tuyến (http/https), sử dụng Google Docs PDF Viewer.
  // Nếu là file cục bộ (file:///), nạp qua WebView với quyền truy cập file.
  // ============================================================================
  const isRemote = safeUri.startsWith('http://') || safeUri.startsWith('https://');
  const androidSource = isRemote
    ? { uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(safeUri)}` }
    : { uri: safeUri };

  return (
    <View style={[styles.container, style]}>
      <WebView
        key={reloadKey}
        source={androidSource}
        originWhitelist={['*']}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        domStorageEnabled={true}
        javaScriptEnabled={true}
        scalesPageToFit={true}
        style={styles.webview}
        onLoadStart={() => {
          setLoading(true);
          setError(null);
        }}
        onLoadEnd={() => setLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('[PdfEmbedViewer Android] WebView error:', nativeEvent);
          setError(nativeEvent.description || 'Không thể hiển thị tệp PDF');
          setLoading(false);
        }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#f1c40f" />
            <Text style={styles.loadingText}>Đang tải trang sách PDF trực tiếp trong Expo...</Text>
          </View>
        )}
      />

      <View style={styles.floatingBar}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setReloadKey((k) => k + 1)}
          accessibilityLabel="Tải lại trang"
        >
          <RefreshCw size={16} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#f1c40f" />
          <Text style={styles.loadingText}>Đang tải trang sách PDF trực tiếp trong Expo...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorTitle}>Không thể tải nội dung PDF</Text>
          <Text style={styles.errorDesc}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setError(null);
              setReloadKey((k) => k + 1);
            }}
          >
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centerBox: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#f1c40f',
  },
  floatingBar: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    flexDirection: 'row',
    gap: 8,
    zIndex: 20,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1c40f',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: '#0f172a',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 30,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f87171',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDesc: {
    fontSize: 13,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#f87171',
    textAlign: 'center',
    fontWeight: '700',
  },
  retryBtn: {
    backgroundColor: '#f1c40f',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#0f172a',
  },
  retryBtnText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 14,
  },
});
