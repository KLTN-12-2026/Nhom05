import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

/**
 * ============================================================================
 * [GIẢI THÍCH CODE]: ĐỊNH NGHĨA DTO HẠNG THÀNH VIÊN ĐỒNG BỘ CHUẨN THIẾT KẾ
 * Quyền lợi của 4 cấp bậc khớp 100% với thiết kế ảnh người dùng cung cấp:
 * 1. Thợ Cày (Cấp I • Mầm Đọc) 🌱
 * 2. Cao Thủ Cày (Cấp II • Tri Thức) 🚜
 * 3. Lão Nông (Cấp III • Tinh Hoa) 🌾
 * 4. Đại Điền Chủ (Cấp IV • Tối Thượng) 👑
 * ============================================================================
 */
export interface TierDto {
  tierId: number;
  tierName: string;
  badgeSubtitle: string;
  requirementsText: string;
  minBooksRequired: number;
  minPotatoRequired: number;
  discountPercent: number;
  badgeIcon: string;
  description: string;
  benefits: string[];
}

export interface CustomerTierSummaryDto {
  customerId: string;
  formattedMemberCode: string;
  customerName: string;
  avatarUrl: string;
  currentTier: TierDto;
  nextTier?: TierDto | null;
  isMaxTier: boolean;
  booksReadCount: number;
  booksRequiredForNext: number;
  booksRemainingForNext: number;
  progressPercentBooks: number;
  totalPoints: number;
  pointsRequiredForNext: number;
  pointsRemainingForNext: number;
  progressPercentPoints: number;
  overallProgressPercent: number;
  streakDays: number;
  hasCheckedInToday: boolean;
  discountPercent: number;
  potatoBalance: number;
  isPermanentProtected: boolean;
  allTiers: TierDto[];
}

interface MembershipModalProps {
  visible: boolean;
  onClose: () => void;
  summary: CustomerTierSummaryDto | null;
  allTiers?: TierDto[];
  isCheckingIn?: boolean;
  onCheckinStreak?: () => void;
  lang?: 'vi' | 'en';
}

/**
 * ============================================================================
 * [GIẢI THÍCH CODE]: 4 CẤP BẬC VỚI ĐẶC QUYỀN CHUẨN 100% NHƯ TRONG ẢNH THIẾT KẾ
 * ============================================================================
 */
export const PHOTO_EXACT_TIERS: TierDto[] = [
  {
    tierId: 1,
    tierName: 'Thợ Cày',
    badgeSubtitle: 'Cấp I • Mầm Đọc',
    requirementsText: 'Yêu cầu: Tạo tài khoản mới',
    minBooksRequired: 0,
    minPotatoRequired: 0,
    discountPercent: 0,
    badgeIcon: '🌱',
    description: 'Cấp bậc khởi đầu của độc giả HALM BOOK. Trải nghiệm hệ sinh thái đọc thử và mượn sách linh hoạt.',
    benefits: [
      'Thuê và đọc toàn bộ kho sách mở tiêu chuẩn',
      'Mở khóa Ví Khoai Tây tích lũy điểm thưởng',
      'Có thể khám phá và trải nghiệm toàn bộ hệ sinh thái của HALM BOOK',
      '3 lượt Upload file free cho người mới',
    ],
  },
  {
    tierId: 2,
    tierName: 'Cao Thủ Cày',
    badgeSubtitle: 'Cấp II • Tri Thức',
    requirementsText: 'Yêu cầu: Đọc 10 Cuốn (hoặc 500 Khoai)',
    minBooksRequired: 10,
    minPotatoRequired: 500,
    discountPercent: 5,
    badgeIcon: '🚜',
    description: 'Hạng Bạc Tri Thức. Giảm 5% phí thuê sách trọn đời, mở khóa huy hiệu Bạc danh dự.',
    benefits: [
      'Giảm 5% phí thuê & mua mọi đầu sách',
      'Huy hiệu Cao Thủ Bạc danh vị nổi bật bên cạnh tên',
      'Đọc trước các tác phẩm mới xuất bản trước 3 ngày',
      'Ưu tiên hàng đợi hỗ trợ CSKH trong vòng 2 giờ',
    ],
  },
  {
    tierId: 3,
    tierName: 'Lão Nông',
    badgeSubtitle: 'Cấp III • Tinh Hoa',
    requirementsText: 'Yêu cầu: Đọc 50 Cuốn (hoặc 2.500 Khoai)',
    minBooksRequired: 50,
    minPotatoRequired: 2500,
    discountPercent: 10,
    badgeIcon: '🌾',
    description: 'Hạng Vàng Tinh Hoa. Giảm 10% phí thuê sách trọn đời, miễn phí 1 cuốn mỗi tháng và hỗ trợ VIP 24/7.',
    benefits: [
      'Giảm 10% toàn bộ chi phí thuê sách',
      'Miễn phí 1 cuốn sách mỗi tháng (1 trong 5 sách do web cho phép)',
      'Khung Avatar Tinh Hoa hào quang vàng kim',
      'Đọc trước các tác phẩm mới xuất bản trước 7 ngày',
    ],
  },
  {
    tierId: 4,
    tierName: 'Đại Điền Chủ',
    badgeSubtitle: 'Cấp IV • Tối Thượng',
    requirementsText: 'Yêu cầu: Đọc 150 Cuốn (hoặc 10.000 Khoai)',
    minBooksRequired: 150,
    minPotatoRequired: 10000,
    discountPercent: 20,
    badgeIcon: '👑',
    description: 'Hạng Hoàng Gia VIP Tối Thượng. Giảm 20% phí thuê sách trọn đời, miễn cọc trọn đời và đặc quyền chăm sóc 1-1.',
    benefits: [
      'Giảm 20% toàn bộ dịch vụ và thuê sách trọn đời',
      'Thuê KHÔNG GIỚI HẠN toàn bộ kho sách VIP',
      'Tặng ấn phẩm sách bìa cứng độc quyền tận nhà hàng năm',
      'Chuyên viên chăm sóc khách hàng VIP riêng biệt (1-on-1)',
    ],
  },
];

// Alias để tương thích ngược với trangcanhan.tsx
export const DEFAULT_TIERS_LIST: TierDto[] = PHOTO_EXACT_TIERS;

export default function MembershipModal({
  visible,
  onClose,
  summary,
}: MembershipModalProps) {
  // Modal hiển thị chính sách bảo lưu
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // [GIẢI THÍCH CODE]: Luôn đảm bảo 4 thẻ cấp bậc hiển thị chính xác quyền lợi như trong ảnh
  const tiersToRender = PHOTO_EXACT_TIERS;

  const currentTierId = summary?.currentTier?.tierId || 1;
  const currentTier = tiersToRender.find((t) => t.tierId === currentTierId) || tiersToRender[0];
  const nextTierId = currentTierId + 1;
  const nextTier = tiersToRender.find((t) => t.tierId === nextTierId) || null;
  const isMaxTier = summary?.isMaxTier ?? (currentTierId >= 4);

  // [GIẢI THÍCH CODE]: Tính toán tiến trình theo điểm XP dạng (25/500 XP) theo yêu cầu người dùng
  const currentXP = summary?.totalPoints ?? 0;
  const targetXP = summary?.pointsRequiredForNext ?? nextTier?.minPotatoRequired ?? 500;
  const xpPercent = isMaxTier
    ? 100
    : Math.min(100, Math.max(0, Math.round((currentXP / (targetXP || 1)) * 100)));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <ExpoStatusBar style="dark" />

        {/* ================================================================ */}
        {/* HEADER SÁNG RÕ RÀNG VỚI NÚT QUAY LẠI RÕ NÉT */}
        {/* ================================================================ */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.headerBackBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="arrow-back" size={26} color="#1a1a1a" />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Hạng Thành Viên & Đặc Quyền</Text>
            <Text style={styles.headerSubtitle}>HALM BOOK • Hệ Thống Danh Dự Độc Giả</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowPolicyModal(true)}
            style={styles.headerInfoBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="shield-checkmark-outline" size={22} color="#27ae60" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollBody}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* ================================================================ */}
          {/* 1. THẺ HỘI VIÊN VIP (SANG TRỌNG, NỔI BẬT TRÊN NỀN SÁNG) */}
          {/* ================================================================ */}
          <View style={styles.vipCard}>
            <View style={styles.vipCardTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.vipCardLogo}>🥔 HALM BOOK</Text>
                <View style={styles.vipCardBadgePill}>
                  <Text style={styles.vipCardBadgeText}>READER PASS</Text>
                </View>
              </View>
              {/* Chip thẻ SIM kim loại */}
              <View style={styles.chipSimBox}>
                <View style={styles.chipSimLine} />
              </View>
            </View>

            <View style={styles.vipCardMid}>
              <View style={styles.vipBadgeCircle}>
                <Text style={{ fontSize: 28 }}>{currentTier.badgeIcon || '🌱'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.vipTierName}>
                    {currentTier.tierName.toUpperCase()}
                  </Text>
                  <View style={styles.vipTierNumberPill}>
                    <Text style={styles.vipTierNumberText}>TIER {currentTier.tierId}</Text>
                  </View>
                </View>
                <Text style={styles.vipDiscountText}>
                  Chiết khấu {summary?.discountPercent ?? currentTier.discountPercent ?? 0}% toàn bộ dịch vụ trọn đời
                </Text>
              </View>
            </View>

            <View style={styles.vipCardBottom}>
              <View>
                <Text style={styles.vipLabel}>PHÙ HIỆU THÀNH VIÊN</Text>
                <Text style={styles.vipName}>
                  {summary?.customerName || 'AN TRẦN'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.vipLabel}>MÃ HỘI VIÊN</Text>
                <Text style={styles.vipCode}>
                  {summary?.formattedMemberCode || `HALM-ID#C${String(summary?.customerId || '00007').padStart(5, '0')}_VN`}
                </Text>
              </View>
            </View>

            <View style={styles.vipGuaranteeFooter}>
              <Ionicons name="shield-checkmark" size={13} color="#2ecc71" />
              <Text style={styles.vipGuaranteeText}>
                Bảo lưu vĩnh viễn • Không bao giờ bị hạ cấp
              </Text>
            </View>
          </View>

          {/* ================================================================ */}
          {/* 2. HÀNH TRÌNH THĂNG HẠNG (THANH TIẾN TRÌNH THEO ĐIỂM XP) */}
          {/* ================================================================ */}
          <View style={styles.progressCard}>
            <Text style={styles.progressCardPreTitle}>HÀNH TRÌNH THĂNG HẠNG</Text>

            {/* [GIẢI THÍCH CODE]: Mục tiêu kế tiếp chiếm trọn dòng để hiển thị trọn vẹn trên 1 dòng */}
            <Text style={styles.progressCardTargetName} numberOfLines={1}>
              {isMaxTier
                ? 'Mục tiêu: Đạt Cấp Bậc Tối Thượng 👑'
                : `Mục tiêu kế tiếp: ${nextTier?.tierName || 'Cao Thủ Cày'} ${nextTier?.badgeIcon || '🚜'}`}
            </Text>

            {/* [GIẢI THÍCH CODE]: Đưa phần trăm hoàn thành thấp xuống trên thanh tiến trình */}
            <View style={styles.progressSubHeaderRow}>
              <Text style={styles.progressSubLabel}>Tiến độ thăng hạng</Text>
              <View style={styles.progressCardPercentBadge}>
                <Text style={styles.progressCardPercentText}>
                  {isMaxTier ? '100%' : `${xpPercent}% Hoàn Thành`}
                </Text>
              </View>
            </View>

            {/* Thanh tiến trình */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, Math.max(isMaxTier ? 100 : 5, xpPercent))}%` },
                ]}
              />
            </View>

            {/* [GIẢI THÍCH CODE]: Hiển thị tiến trình dạng (25/500 XP) chuẩn theo yêu cầu */}
            <View style={styles.progressValueRow}>
              <Text style={styles.progressValueText}>
                {isMaxTier
                  ? `Đã đạt cấp tối đa (${currentXP} XP)`
                  : `(${currentXP}/${targetXP} XP)`}
              </Text>
              {!isMaxTier && (
                <Text style={styles.progressRemainingText}>
                  Còn thiếu {Math.max(0, targetXP - currentXP)} XP
                </Text>
              )}
            </View>
          </View>

          {/* ================================================================ */}
          {/* 3. HỆ THỐNG CẤP BẬC & LỘ TRÌNH ĐẶC QUYỀN (GIỐNG 100% ẢNH THIẾT KẾ) */}
          {/* ================================================================ */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Hệ Thống Cấp Bậc & Lộ Trình Đặc Quyền</Text>
            <Text style={styles.sectionSubtitle}>
              Khám phá 4 nấc thang tri thức từ Thợ Cày đến Đại Điền Chủ với những quyền lợi độc bản tăng dần
            </Text>
          </View>

          <View style={styles.tierList}>
            {tiersToRender.map((tier) => {
              const isCurrent = tier.tierId === currentTier.tierId;
              const isNext = tier.tierId === nextTierId;

              const isTier1 = tier.tierId === 1;
              const isTier2 = tier.tierId === 2;
              const isTier3 = tier.tierId === 3;
              const isTier4 = tier.tierId === 4;

              return (
                <View
                  key={tier.tierId}
                  style={[
                    styles.tierItemCard,
                    isCurrent && styles.tierItemCardCurrent,
                    isTier3 && !isCurrent && styles.tierItemCardPopular,
                    isTier4 && styles.tierItemCardVip,
                  ]}
                >
                  {/* Top Tag: Hạng hiện tại / Mục tiêu tiếp theo / Phổ biến nhất / Hoàng Gia VIP */}
                  <View style={styles.tierPillRow}>
                    {isCurrent ? (
                      <View style={styles.tagBadgeEmerald}>
                        <Text style={styles.tagBadgeText}>HẠNG HIỆN TẠI</Text>
                      </View>
                    ) : isNext ? (
                      <View style={styles.tagBadgeSlate}>
                        <Text style={styles.tagBadgeText}>MỤC TIÊU TIẾP THEO</Text>
                      </View>
                    ) : isTier3 ? (
                      <View style={styles.tagBadgeGold}>
                        <Text style={styles.tagBadgeText}>PHỔ BIẾN NHẤT ★</Text>
                      </View>
                    ) : isTier4 ? (
                      <View style={styles.tagBadgeAmber}>
                        <Text style={styles.tagBadgeText}>HOÀNG GIA VIP 👑</Text>
                      </View>
                    ) : (
                      <View style={styles.tagBadgeUnlocked}>
                        <Text style={styles.tagBadgeUnlockedText}>ĐÃ MỞ KHÓA</Text>
                      </View>
                    )}
                  </View>

                  {/* Header thẻ cấp bậc */}
                  <View style={styles.tierItemTop}>
                    <View
                      style={[
                        styles.tierItemIconCircle,
                        isTier1 && { backgroundColor: '#eafaf1' },
                        isTier2 && { backgroundColor: '#f1f5f9' },
                        isTier3 && { backgroundColor: '#fef9e7' },
                        isTier4 && { backgroundColor: '#fff3cd' },
                      ]}
                    >
                      <Text style={{ fontSize: 26 }}>{tier.badgeIcon}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.tierItemName, isTier4 && { color: '#854d0e' }]}>
                          {tier.tierName}
                        </Text>
                        <View
                          style={[
                            styles.tierBadgeSubtitlePill,
                            isTier1 && { backgroundColor: '#eafaf1' },
                            isTier2 && { backgroundColor: '#f1f5f9' },
                            isTier3 && { backgroundColor: '#fef9e7' },
                            isTier4 && { backgroundColor: '#fef08a' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.tierBadgeSubtitleText,
                              isTier1 && { color: '#27ae60' },
                              isTier2 && { color: '#475569' },
                              isTier3 && { color: '#b45309' },
                              isTier4 && { color: '#854d0e' },
                            ]}
                          >
                            {tier.badgeSubtitle}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.tierItemReq}>
                        {tier.requirementsText}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tierDivider} />

                  {/* 4 ĐẶC QUYỀN CHUẨN 100% NHƯ TRONG ẢNH */}
                  <View style={styles.perksList}>
                    {tier.benefits.map((benefit, bIdx) => (
                      <View key={bIdx} style={styles.perkRow}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={
                            isTier4 ? '#d97706' : isTier3 ? '#b45309' : isTier2 ? '#475569' : '#16a34a'
                          }
                          style={{ marginTop: 2 }}
                        />
                        <Text style={styles.perkText}>{benefit}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Nút hành động của thẻ */}
                  <View style={{ marginTop: 14 }}>
                    {isCurrent ? (
                      <View style={styles.cardStatusBtnCurrent}>
                        <Ionicons name="checkmark-circle" size={15} color="#15803d" />
                        <Text style={styles.cardStatusBtnCurrentText}>Đang Sử Dụng</Text>
                      </View>
                    ) : isNext ? (
                      <View style={styles.cardStatusBtnNext}>
                        <Text style={styles.cardStatusBtnNextText}>Xem Lộ Trình Thăng Cấp ➔</Text>
                      </View>
                    ) : isTier3 ? (
                      <View style={styles.cardStatusBtnGold}>
                        <Text style={styles.cardStatusBtnGoldText}>Xem Chi Tiết Đặc Quyền ➔</Text>
                      </View>
                    ) : isTier4 ? (
                      <View style={styles.cardStatusBtnVip}>
                        <Text style={styles.cardStatusBtnVipText}>Gia Nhập Giới Tinh Hoa 👑</Text>
                      </View>
                    ) : (
                      <View style={styles.cardStatusBtnUnlocked}>
                        <Ionicons name="shield-checkmark" size={14} color="#15803d" />
                        <Text style={styles.cardStatusBtnUnlockedText}>Đã Hoàn Thành</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* ================================================================ */}
          {/* 4. NÚT QUAY LẠI TRANG CÁ NHÂN DƯỚI CHÂN TRANG */}
          {/* ================================================================ */}
          <TouchableOpacity
            style={styles.bottomBackBtn}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={18} color="#2c3a7a" />
            <Text style={styles.bottomBackBtnText}>Quay lại trang cá nhân</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ================================================================ */}
        {/* POPUP CHÍNH SÁCH BẢO LƯU VĨNH VIỄN */}
        {/* ================================================================ */}
        <Modal
          visible={showPolicyModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPolicyModal(false)}
        >
          <View style={styles.popupOverlay}>
            <View style={styles.popupCard}>
              <View style={styles.popupHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="shield-checkmark" size={22} color="#27ae60" />
                  <Text style={styles.popupTitle}>Chính Sách Bảo Lưu Vĩnh Viễn</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowPolicyModal(false)}
                  style={{ padding: 4 }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={22} color="#888" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.popupParagraph}>
                  Khác biệt với các nền tảng thông thường yêu cầu tích lũy lại sau mỗi chu kỳ 12 tháng, HALM BOOK cam kết <Text style={{ fontWeight: '800', color: '#27ae60' }}>BẢO LƯU TRỌN ĐỜI</Text> thứ hạng thành viên của bạn:
                </Text>
                <View style={styles.popupBullet}>
                  <Text style={styles.popupBulletDot}>✓</Text>
                  <Text style={styles.popupBulletText}>
                    Khi đạt bất kỳ thứ hạng nào (Thợ Cày, Cao Thủ Cày, Lão Nông, Đại Điền Chủ), thứ hạng của bạn được bảo lưu vĩnh viễn.
                  </Text>
                </View>
                <View style={styles.popupBullet}>
                  <Text style={styles.popupBulletDot}>✓</Text>
                  <Text style={styles.popupBulletText}>
                    Không bao giờ bị giáng cấp kể cả khi bạn tạm ngưng đọc sách trong thời gian dài.
                  </Text>
                </View>
                <View style={styles.popupBullet}>
                  <Text style={styles.popupBulletDot}>✓</Text>
                  <Text style={styles.popupBulletText}>
                    Mức chiết khấu và huy hiệu danh dự luôn được duy trì liên tục trên toàn bộ hệ thống.
                  </Text>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.popupCloseBtn}
                onPress={() => setShowPolicyModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.popupCloseBtnText}>Đã Hiểu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // NỀN SÁNG CHUẨN APP (LIGHT MODE)
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfoBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#666666',
    marginTop: 2,
  },
  scrollBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // 1. VIP CARD
  vipCard: {
    backgroundColor: '#1c1f26',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  vipCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  vipCardLogo: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  vipCardBadgePill: {
    backgroundColor: 'rgba(241, 196, 15, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(241, 196, 15, 0.4)',
  },
  vipCardBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#f1c40f',
  },
  chipSimBox: {
    width: 34,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipSimLine: {
    width: 22,
    height: 1,
    backgroundColor: '#8c7014',
  },
  vipCardMid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vipBadgeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vipTierName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  vipTierNumberPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vipTierNumberText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  vipDiscountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f1c40f',
    marginTop: 3,
  },
  vipCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  vipLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8c93a4',
    letterSpacing: 0.5,
  },
  vipName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  vipCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f1c40f',
    marginTop: 2,
  },
  vipGuaranteeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(46, 204, 113, 0.12)',
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  vipGuaranteeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2ecc71',
  },

  // 2. PROGRESS CARD
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  progressCardPreTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#888888',
    letterSpacing: 0.8,
  },
  progressCardTargetName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1a1a1a',
    marginTop: 3,
  },
  progressSubHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  progressSubLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
  },
  progressCardPercentBadge: {
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  progressCardPercentText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#2980b9',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: '#f0f2f5',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2c3a7a',
    borderRadius: 5,
  },
  progressValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  progressValueText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#e67e22',
  },
  progressRemainingText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b',
  },

  // 3. TIERS LIST
  sectionTitleRow: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1a1a1a',
  },
  sectionSubtitle: {
    fontSize: 11.5,
    color: '#666666',
    marginTop: 3,
    lineHeight: 16,
  },
  tierList: {
    gap: 16,
    marginBottom: 20,
  },
  tierItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  tierItemCardCurrent: {
    borderColor: '#10b981',
    borderWidth: 2,
    backgroundColor: '#fcfdfd',
  },
  tierItemCardPopular: {
    borderColor: '#f59e0b',
    borderWidth: 1.5,
  },
  tierItemCardVip: {
    borderColor: '#eab308',
    borderWidth: 2,
    backgroundColor: '#fffdf5',
  },
  tierPillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tagBadgeEmerald: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
  },
  tagBadgeSlate: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
  },
  tagBadgeGold: {
    backgroundColor: '#d97706',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
  },
  tagBadgeAmber: {
    backgroundColor: '#b45309',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
  },
  tagBadgeUnlocked: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  tagBadgeUnlockedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  tierItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tierItemIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierItemName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1a1a1a',
  },
  tierBadgeSubtitlePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tierBadgeSubtitleText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  tierItemReq: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  tierDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  perksList: {
    gap: 9,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  perkText: {
    flex: 1,
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '500',
  },
  cardStatusBtnCurrent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingVertical: 9,
    borderRadius: 10,
  },
  cardStatusBtnCurrentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
  },
  cardStatusBtnNext: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 9,
    borderRadius: 10,
  },
  cardStatusBtnNextText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  cardStatusBtnGold: {
    alignItems: 'center',
    backgroundColor: '#fefce8',
    borderWidth: 1,
    borderColor: '#fde047',
    paddingVertical: 9,
    borderRadius: 10,
  },
  cardStatusBtnGoldText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#a16207',
  },
  cardStatusBtnVip: {
    alignItems: 'center',
    backgroundColor: '#fef08a',
    paddingVertical: 9,
    borderRadius: 10,
  },
  cardStatusBtnVipText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#713f12',
  },
  cardStatusBtnUnlocked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 9,
    borderRadius: 10,
  },
  cardStatusBtnUnlockedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },

  // 4. BOTTOM BACK BUTTON
  bottomBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d6d9e0',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  bottomBackBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3a7a',
  },

  // POPUP
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  popupCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  popupTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  popupParagraph: {
    fontSize: 13,
    color: '#333333',
    lineHeight: 19,
    marginBottom: 10,
  },
  popupBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  popupBulletDot: {
    fontSize: 13,
    fontWeight: '800',
    color: '#27ae60',
  },
  popupBulletText: {
    flex: 1,
    fontSize: 12,
    color: '#555555',
    lineHeight: 17,
  },
  popupCloseBtn: {
    backgroundColor: '#2c3a7a',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 14,
  },
  popupCloseBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
