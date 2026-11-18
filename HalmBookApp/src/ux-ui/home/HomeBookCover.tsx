import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { getBookCoverSource } from '../bookCovers';
import { BookData, useAppNavigation } from '../navigation';

// Used only by Home and its editorial modules, never recolors the book artwork.
export default function HomeBookCover({ book }: { book: BookData }) {
  const { isDarkMode } = useAppNavigation();
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const localCover = book.coverUri || book.coverImage;
  const source = getBookCoverSource(book.id, localCover || book.img_url);
  const identity = book.id + ':' + (localCover || book.img_url || '');
  return (
    <View style={[StyleSheet.absoluteFill, styles.fallback]}>
      {source && failedSource !== identity ? (
        <Image source={source} style={StyleSheet.absoluteFill} resizeMode="contain"
          onError={() => setFailedSource(identity)} accessibilityLabel={`Bìa sách ${book.title}`} />
      ) : (
        <>
          <Ionicons name="book-outline" size={25} color={isDarkMode ? '#E5A93C' : '#4B8176'} />
          <Text numberOfLines={2} style={[styles.title, { color: isDarkMode ? '#A39F99' : '#77736C' }]}>{book.title}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center', padding: 6 },
  title: { fontSize: 12, textAlign: 'center', marginTop: 6 },
});
