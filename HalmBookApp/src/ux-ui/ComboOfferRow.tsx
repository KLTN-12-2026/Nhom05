import { ScrollView, TouchableOpacity, View } from 'react-native';
import type { ComponentType, ReactNode } from 'react';
import { BookOffer, offerRow } from './offersService';

/** The only additional row in Offers; cards and section styles are supplied by the existing screen. */
export default function ComboOfferRow({
  offers,
  styles,
  colors,
  SectionHeader,
  renderCard,
  onSelectCombo,
}: {
  offers: BookOffer[];
  styles: any;
  colors: any;
  SectionHeader: ComponentType<any>;
  renderCard: (book: any, index: number) => ReactNode;
  onSelectCombo?: (offer: BookOffer) => void;
}) {
  if (!offers.length) return null;
  return (
    <View style={styles.sectionWrap}>
      <SectionHeader icon="bookshelf" iconColor={colors.bannerPink} label="Combo sách" textColor={colors.bannerPink} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
        {offers.map((offer, index) => (
          <TouchableOpacity
            key={offer.id}
            activeOpacity={0.88}
            onPress={() => onSelectCombo?.(offer)}
            disabled={!onSelectCombo}
          >
            <View pointerEvents={onSelectCombo ? 'none' : 'auto'}>
              {renderCard(offerRow(offer), index)}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
