import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { getBookCoverSource } from '../bookCovers';
import { BookData, useAppNavigation } from '../navigation';

// Used only by Home and its editorial modules, never recolors the book artwork.
export default function HomeBookCover({ book }: { book: BookData }) {
  const { isDarkMode } = useAppNavigation();
  const [failed, setFailed] = useState(false);
  const localCover = book.coverUri || book.coverImage;
  const source = getBookCoverSource(book.id, localCover || book.img_url);
  useEffect(() => setFailed(false), [book.id, book.img_url, localCover]);
  return (
    <View style={[StyleSheet.absoluteFill, styles.fallback]}>
      {source && !failed ? (
        <Image source={source} style={StyleSheet.absoluteFill} resizeMode="contain"
          onError={() => setFailed(true)} accessibilityLabel={`Bìa sách ${book.title}`} />
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
