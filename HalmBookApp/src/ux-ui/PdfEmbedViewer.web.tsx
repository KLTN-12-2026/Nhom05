import React from 'react';
import { StyleSheet, View } from 'react-native';

export interface PdfViewerProps {
  uri: string;
  title?: string;
  onClose?: () => void;
  style?: any;
}

// [GIẢI THÍCH CODE]: Trình nhúng PDF trực tiếp trên Web sử dụng thẻ iframe gốc của trình duyệt
export const PdfEmbedViewer: React.FC<PdfViewerProps> = ({ uri, style }) => {
  return (
    <View style={[styles.container, style]}>
      <iframe
        src={uri}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title="HALM BOOK PDF Viewer"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0f172a',
  },
});

