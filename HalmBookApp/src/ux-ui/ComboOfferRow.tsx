import { ScrollView, View } from 'react-native';
import type { ComponentType, ReactNode } from 'react';
import { BookOffer, offerRow } from './offersService';

/** The only additional row in Offers; cards and section styles are supplied by the existing screen. */
export default function ComboOfferRow({ offers, styles, colors, SectionHeader, renderCard }: {
  offers: BookOffer[]; styles: any; colors: any; SectionHeader: ComponentType<any>; renderCard: (book: any, index: number) => ReactNode;
}) {
  if (!offers.length) return null;
  return <View style={styles.sectionWrap}>
    <SectionHeader icon="bookshelf" iconColor={colors.bannerPink} label="Combo sách" textColor={colors.bannerPink} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
      {offers.map((offer, index) => <View key={offer.id}>{renderCard(offerRow(offer), index)}</View>)}
    </ScrollView>
  </View>;
}
