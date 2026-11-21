import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { isAxiosError } from 'axios';
import * as WebBrowser from 'expo-web-browser';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { fetchApiWithFallback } from './apiService';
import { useAppNavigation } from './navigation';

// ==============================================================
// TYPE DEFINITIONS
// ==============================================================
export interface PotatoPackage {
  packageId: number;
  packageName: string;
  potatoAmount: number;
  bonusPotato: number | null;
  priceVnd: number;
  badgeTag?: string | null;
  description?: string | null;
}

export type PaymentGateway = 'vietqr' | 'ewallet' | 'atm';
export type EwalletProvider = 'momo' | 'zalopay' | 'vnpay';

export interface PaymentStatus {
  orderId: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  packageName: string;
  amountVnd: number;
  potatoAmount: number;
  gatewayTransactionId?: string | null;
}

export type MomoPayment = PaymentStatus & {
  payUrl: string;
  redirectUrl: string;
  deeplink?: string;
};

export interface WalletResponse {
  potatoBalance: number;
}

export interface ReceiptData {
  transCode: string;
  gatewayName: string;
  packName: string;
  price: number;
  addedKhoai: number;
  newBalance: number;
  status: string;
}

// Fallback packages nếu CSDL chưa tải kịp
const FALLBACK_PACKAGES: PotatoPackage[] = [
  {
    packageId: 1,
    packageName: 'Gói VIP 1 Tháng',
    potatoAmount: 99000,
    bonusPotato: 10000,
    priceVnd: 99000,
    badgeTag: 'PHỔ BIẾN',
    description: 'Đọc sách không giới hạn 30 ngày',
  },
  {
    packageId: 2,
    packageName: 'Gói VIP 6 Tháng',
    potatoAmount: 499000,
    bonusPotato: 60000,
    priceVnd: 499000,
    badgeTag: 'BÁN CHẠY',
    description: 'Đặc quyền VIP 180 ngày (Tiết kiệm 15%)',
  },
  {
    packageId: 3,
    packageName: 'Gói VIP 1 Năm',
    potatoAmount: 899000,
    bonusPotato: 200000,
    priceVnd: 899000,
    badgeTag: 'TIẾT KIỆM 25%',
    description: '365 ngày trọn vẹn + Tặng 200 Khoai quà tặng',
  },
  {
    packageId: 4,
    packageName: 'Gói Nạp Cơ Bản',
    potatoAmount: 20000,
    bonusPotato: 2000,
    priceVnd: 20000,
    badgeTag: 'CƠ BẢN',
    description: 'Bổ sung Khoai thuê sách lẻ nhanh chóng',
  },
];

const ATM_BANKS = [
  'MB Bank',
  'Vietcombank',
  'Techcombank',
  'ACB',
  'VPBank',
  'TPBank',
  'BIDV',
  'Agribank',
];

const EWALLET_CONFIG: Record<
  EwalletProvider,
  { name: string; color: string; letter: string; tag: string; desc: string }
> = {
  momo: {
    name: 'Ví MoMo Official',
    color: '#A50064',
    letter: 'M',
    tag: 'Hoàn 10%',
    desc: 'Quét mã QR bằng ứng dụng Ví MoMo trên điện thoại hoặc bấm nút mở ví',
  },
  zalopay: {
    name: 'ZaloPay Official',
    color: '#0068FF',
    letter: 'Z',
    tag: 'Quét nhanh',
    desc: 'Mở ứng dụng ZaloPay hoặc Zalo để quét mã xác thực thanh toán',
  },
  vnpay: {
    name: 'VNPAY-QR Đa Ngân Hàng',
    color: '#005BAA',
    letter: 'VN',
    tag: '34+ Bank',
    desc: 'Hỗ trợ quét qua ứng dụng của 34+ ngân hàng (Vietcombank, MB, Techcombank,...)',
  },
};

const formatCurrency = (amount: number) =>
  `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;

const getErrorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    const body = error.response?.data;
    if (body && typeof body === 'object') {
      const errorBody = body as Record<string, unknown>;
      for (const key of ['detail', 'message', 'error']) {
        const message = errorBody[key];
        if (typeof message === 'string' && message.trim()) {
          return message;
        }
      }
    }
    return error.message || 'Không thể kết nối máy chủ.';
  }
  return error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
};

// ==============================================================
// MAIN COMPONENT: CỔNG THANH TOÁN & NẠP KHOAI (CHUẨN BẢN WEB)
// ==============================================================
export default function ThanhToan() {
  const { goBack, isDarkMode, lang, setFooterVisible, isLoggedIn, showLoginAlert, navigateTab } =
    useAppNavigation();
  const isEnglish = lang === 'en';
  const { width: windowWidth } = useWindowDimensions();

  // Color Palette theo Paper & Ink / Wine & Gold của bản Web
  const colors = {
    screenBg: isDarkMode ? '#111210' : '#F7F4EE',
    cardBg: isDarkMode ? '#1E1F1D' : '#FFFFFF',
    cardBorder: isDarkMode ? '#2C2E29' : '#E3DDD0',
    textPrimary: isDarkMode ? '#EDE9DF' : '#1E1F1D',
    textSecondary: isDarkMode ? '#96938B' : '#66645E',
    wine: isDarkMode ? '#C2545F' : '#8E3038',
    wineLight: isDarkMode ? 'rgba(194, 84, 95, 0.15)' : 'rgba(142, 48, 56, 0.08)',
    gold: isDarkMode ? '#E5B94E' : '#B8860B',
    goldLight: isDarkMode ? 'rgba(229, 185, 78, 0.15)' : 'rgba(184, 134, 11, 0.1)',
    emerald: isDarkMode ? '#34D399' : '#059669',
    emeraldLight: isDarkMode ? 'rgba(52, 211, 153, 0.15)' : 'rgba(5, 150, 105, 0.1)',
    chipBg: isDarkMode ? '#252623' : '#EFECE6',
    danger: isDarkMode ? '#F87171' : '#DC2626',
    white: '#FFFFFF',
  };

  // State
  const [packages, setPackages] = useState<PotatoPackage[]>(FALLBACK_PACKAGES);
  const [selectedPackageId, setSelectedPackageId] = useState<number>(FALLBACK_PACKAGES[0].packageId);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>('vietqr');
  const [currentEwallet, setCurrentEwallet] = useState<EwalletProvider>('momo');
  const [currentAtmBank, setCurrentAtmBank] = useState<string>('MB Bank');

  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Giao dịch & Xử lý thanh toán
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [activePayment, setActivePayment] = useState<MomoPayment | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Chiều rộng thẻ gói nạp (4 gói trên 1 hàng ngang)
  const cardWidth = useMemo(() => {
    const horizontalPadding = 32;
    const gap = 8;
    const count = packages.length || 4;
    const calculated = (windowWidth - horizontalPadding - (count - 1) * gap) / count;
    return Math.max(calculated, 78);
  }, [windowWidth, packages.length]);

  // Toast
  const [toast, setToast] = useState<{ show: boolean; title: string; msg: string }>({
    show: false,
    title: '',
    msg: '',
  });

  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  // Gói nạp đang được chọn
  const selectedPackage = useMemo(() => {
    return packages.find(p => p.packageId === selectedPackageId) || packages[0] || FALLBACK_PACKAGES[0];
  }, [packages, selectedPackageId]);

  // Mã giao dịch nội bộ cố định theo gói nạp
  const transCode = useMemo(() => {
    const rnd = Math.floor(10000 + Math.random() * 90000);
    return `HLM-TOPUP-${rnd}`;
  }, [selectedPackageId]);

  const showToast = (title: string, msg: string) => {
    setToast({ show: true, title, msg });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      showToast('Đã sao chép!', `${label}: ${text}`);
    } catch {
      Alert.alert('Đã sao chép', text);
    }
  };

  // 1. Tải Gói Nạp & Số Dư Ví từ Backend
  useEffect(() => {
    let cancelled = false;

    const loadPaymentData = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const token = await AsyncStorage.getItem('userToken');
        const config = token ? { headers: { Authorization: `Bearer ${token}` }, timeout: 8000 } : { timeout: 8000 };

        const [packageResponse, walletResponse] = await Promise.allSettled([
          fetchApiWithFallback<PotatoPackage[]>('/api/home/potato/packages', config),
          token ? fetchApiWithFallback<WalletResponse>('/api/home/potato/wallet', config) : Promise.reject(),
        ]);

        if (!cancelled) {
          if (packageResponse.status === 'fulfilled' && Array.isArray(packageResponse.value.data) && packageResponse.value.data.length > 0) {
            setPackages(packageResponse.value.data);
            setSelectedPackageId(packageResponse.value.data[0].packageId);
          }
          if (walletResponse.status === 'fulfilled' && walletResponse.value.data?.potatoBalance !== undefined) {
            setWalletBalance(Number(walletResponse.value.data.potatoBalance));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPaymentData();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // 2. Xử lý thanh toán MoMo mở WebBrowser
  const openMomoPayment = useCallback(
    async (payment: MomoPayment) => {
      setPaymentError('');
      try {
        const result = await WebBrowser.openAuthSessionAsync(payment.payUrl, payment.redirectUrl);
        if (result.type === 'success') {
          showToast('Đang kiểm tra kết quả MoMo...', 'Vui lòng chờ xác thực');
        }
      } catch (error) {
        setPaymentError(getErrorMessage(error));
      }
    },
    []
  );

  // 3. Tiến hành xử lý thanh toán / Gửi yêu cầu nạp tiền
  const handleProcessPayment = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (!isLoggedIn && !token) {
      showLoginAlert('Vui lòng đăng nhập để thực hiện nạp Khoai vào ví!');
      return;
    }

    setIsProcessing(true);
    setPaymentError('');

    try {
      let gatewayName = 'VietQR (MB Bank 24/7)';
      let payMethodCode = 'VIETQR';

      if (paymentGateway === 'ewallet') {
        gatewayName = `Ví Điện Tử ${currentEwallet.toUpperCase()}`;
        payMethodCode = `EWALLET_${currentEwallet.toUpperCase()}`;
      } else if (paymentGateway === 'atm') {
        gatewayName = `Thẻ ATM Nội Địa (${currentAtmBank})`;
        payMethodCode = `ATM_${currentAtmBank}`;
      }

      // Xử lý riêng cho MoMo nếu người dùng chọn cổng MoMo
      if (paymentGateway === 'ewallet' && currentEwallet === 'momo') {
        try {
          const momoRes = await fetchApiWithFallback<MomoPayment>('/api/home/potato/momo/create', {
            method: 'POST',
            data: { packageId: selectedPackage.packageId },
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            timeout: 15000,
          });
          setActivePayment(momoRes.data);
          setPaymentStatus(momoRes.data);
          await openMomoPayment(momoRes.data);
          return;
        } catch (momoErr) {
          console.warn('MoMo direct failed, fallback to topup request:', momoErr);
        }
      }

      // Gửi yêu cầu nạp tiền chuẩn lên backend (/api/home/potato/topup)
      const res = await fetchApiWithFallback<{
        message?: string;
        order?: { id?: number; transactionNo?: string; totalAmount?: number; paymentStatus?: string };
        wallet?: { potatoBalance?: number };
      }>('/api/home/potato/topup', {
        method: 'POST',
        data: {
          packageId: selectedPackage.packageId,
          amountMoney: selectedPackage.priceVnd,
          paymentMethod: payMethodCode,
          note: `Nạp gói ${selectedPackage.packageName} qua ${gatewayName}`,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        timeout: 15000,
      });

      const serverOrder = res.data?.order;
      const orderCode = serverOrder?.transactionNo || transCode;
      const expectedKhoai =
        selectedPackage.potatoAmount + (selectedPackage.bonusPotato || 0);

      if (res.data?.wallet?.potatoBalance !== undefined) {
        setWalletBalance(res.data.wallet.potatoBalance);
      }

      setReceiptData({
        transCode: orderCode,
        gatewayName,
        packName: selectedPackage.packageName,
        price: selectedPackage.priceVnd,
        addedKhoai: expectedKhoai,
        newBalance: walletBalance ?? 0,
        status: serverOrder?.paymentStatus || 'PENDING',
      });

      setIsSuccessModalOpen(true);
      showToast('Yêu Cầu Nạp Đã Gửi Đi!', 'Đơn hàng đang chờ khớp lệnh hệ thống.');
    } catch (err: any) {
      const errMsg = getErrorMessage(err);
      setPaymentError(errMsg);
      Alert.alert('Không thể hoàn tất thanh toán', errMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPayButtonText = () => {
    const formatted = formatCurrency(selectedPackage.priceVnd);
    if (paymentGateway === 'vietqr') {
      return `XÁC NHẬN ĐÃ CHUYỂN KHOẢN (${formatted})`;
    } else if (paymentGateway === 'ewallet') {
      return `THANH TOÁN QUA VÍ ${currentEwallet.toUpperCase()} (${formatted})`;
    } else if (paymentGateway === 'atm') {
      return `TÔI ĐÃ CHUYỂN KHOẢN ATM (${formatted})`;
    }
    return `XÁC NHẬN THANH TOÁN (${formatted})`;
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.screenBg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* ========================================================
          NAVBAR: CỔNG THANH TOÁN VIP MEMBERSHIP GATEWAY
          ======================================================== */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: colors.screenBg,
            borderBottomColor: colors.cardBorder,
            paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 48,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
          onPress={goBack}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerMainTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            CỔNG THANH TOÁN
          </Text>
          <Text style={[styles.headerSubTitle, { color: colors.textSecondary }]}>
            VIP MEMBERSHIP & NẠP KHOAI
          </Text>
        </View>

        <View style={[styles.walletBalanceBadge, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={styles.walletEmoji}>🥔</Text>
          <Text style={[styles.walletBalanceText, { color: colors.textPrimary }]}>
            {walletBalance === null ? '--' : walletBalance.toLocaleString('vi-VN')}
          </Text>
        </View>
      </View>

      {/* Toast Notification */}
      {toast.show && (
        <View style={[styles.toastPill, { backgroundColor: colors.cardBg, borderColor: colors.gold }]}>
          <View style={[styles.toastIconCircle, { backgroundColor: colors.goldLight }]}>
            <Ionicons name="checkmark" size={13} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toastTitleText, { color: colors.textPrimary }]}>{toast.title}</Text>
            <Text style={[styles.toastSubText, { color: colors.textSecondary }]}>{toast.msg}</Text>
          </View>
        </View>
      )}

      {/* Main Content Scroll */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => setReloadKey(p => p + 1)}
            colors={[colors.gold, colors.wine]}
            tintColor={colors.gold}
          />
        }
      >
        {/* ========================================================
            BANNER PHÂN HỆ VÍ KHOAI TÂY (CHUYÊN BIỆT & MINH BẠCH)
            ======================================================== */}
        <View
          style={[
            styles.noticeBanner,
            {
              backgroundColor: colors.cardBg,
              borderColor: isDarkMode ? 'rgba(229, 185, 78, 0.4)' : 'rgba(184, 134, 11, 0.35)',
            },
          ]}
        >
          <View style={styles.noticeBannerLeft}>
            <View
              style={[
                styles.noticeIconBox,
                {
                  backgroundColor: colors.goldLight,
                  borderColor: isDarkMode ? 'rgba(229, 185, 78, 0.4)' : 'rgba(184, 134, 11, 0.3)',
                },
              ]}
            >
              <Text style={{ fontSize: 24 }}>🥔</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.noticeTagRow}>
                <View style={[styles.noticeBadge, { backgroundColor: colors.goldLight }]}>
                  <Text style={[styles.noticeBadgeText, { color: colors.gold }]}>PHÂN HỆ MINH BẠCH</Text>
                </View>
                <Text style={[styles.noticeTitle, { color: colors.textPrimary }]}>
                  Bạn muốn nạp Khoai vào ví?
                </Text>
              </View>
              <Text style={[styles.noticeDesc, { color: colors.textSecondary }]}>
                Nạp Khoai Tây để mở khóa, thuê sách và hưởng đặc quyền hội viên bản quyền cao cấp.
              </Text>
            </View>
          </View>
        </View>

        {/* ========================================================
            1. CHỌN GÓI HỘI VIÊN & NẠP KHOAI (LƯỚI THẺ TRỰC QUAN)
            ======================================================== */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="crown" size={20} color={colors.gold} />
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                1. Chọn Gói Nạp Phù Hợp:
              </Text>
            </View>
            <Text style={[styles.sectionInstantBadge, { color: colors.emerald }]}>
              Kích hoạt tức thì
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={colors.gold} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Đang tải các gói nạp từ máy chủ...
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.packageCardsRow,
                { minWidth: '100%', justifyContent: 'space-between' },
              ]}
            >
              {packages.map(pkg => {
                const isSelected = selectedPackage.packageId === pkg.packageId;
                const totalPotatoes = pkg.potatoAmount + (pkg.bonusPotato || 0);

                return (
                  <TouchableOpacity
                    key={pkg.packageId}
                    style={[
                      styles.packageCardCompact,
                      {
                        width: cardWidth,
                        backgroundColor: isSelected ? colors.wineLight : colors.cardBg,
                        borderColor: isSelected ? colors.wine : colors.cardBorder,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => {
                      setSelectedPackageId(pkg.packageId);
                      showToast('Đã chọn gói', `Bạn đã chọn ${pkg.packageName}`);
                    }}
                    activeOpacity={0.85}
                  >
                    {pkg.badgeTag ? (
                      <View
                        style={[
                          styles.compactBadgeTag,
                          {
                            backgroundColor:
                              pkg.badgeTag.includes('BÁN CHẠY') ||
                              pkg.badgeTag.includes('Đề Xuất') ||
                              pkg.badgeTag.includes('HOT')
                                ? colors.wine
                                : colors.gold,
                          },
                        ]}
                      >
                        <Text style={styles.compactBadgeTagText} numberOfLines={1}>
                          {pkg.badgeTag.replace('Thưởng', '').trim()}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.compactBadgePlaceholder} />
                    )}

                    <View style={styles.compactPotatoBox}>
                      <Text style={styles.compactPotatoEmoji}>🥔</Text>
                      <Text style={[styles.compactPotatoNum, { color: colors.textPrimary }]} numberOfLines={1}>
                        +{totalPotatoes.toLocaleString('vi-VN')}
                      </Text>
                      {pkg.bonusPotato && pkg.bonusPotato > 0 ? (
                        <Text style={[styles.compactBonusNum, { color: colors.emerald }]} numberOfLines={1}>
                          (+{pkg.bonusPotato})
                        </Text>
                      ) : null}
                    </View>

                    <Text style={[styles.compactPackName, { color: colors.textSecondary }]} numberOfLines={1}>
                      {pkg.packageName.replace('Gói ', '')}
                    </Text>

                    <View style={[styles.compactPriceBox, { borderTopColor: colors.cardBorder }]}>
                      <Text style={[styles.compactPriceText, { color: colors.wine }]} numberOfLines={1}>
                        {formatCurrency(pkg.priceVnd)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ========================================================
            2. DẢI TÓM TẮT GIAO DỊCH VIP
            ======================================================== */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.summaryTopRow}>
            <View style={[styles.summaryIconBox, { backgroundColor: colors.goldLight, borderColor: colors.gold }]}>
              <MaterialCommunityIcons name="shield-check" size={24} color={colors.gold} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.summaryPackTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {selectedPackage.packageName}
                </Text>
                <View style={[styles.safeTagBadge, { backgroundColor: colors.emeraldLight }]}>
                  <Text style={[styles.safeTagText, { color: colors.emerald }]}>AN TOÀN 100%</Text>
                </View>
              </View>
              <Text style={[styles.summaryBenefitText, { color: colors.textSecondary }]}>
                +{selectedPackage.potatoAmount + (selectedPackage.bonusPotato || 0)} Khoai vào ví đọc sách
              </Text>
              {selectedPackage.description ? (
                <Text style={[styles.summaryDescText, { color: colors.textSecondary }]} numberOfLines={2}>
                  {selectedPackage.description}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={[styles.summaryDivider, { backgroundColor: colors.cardBorder }]} />

          <View style={styles.summaryBottomRow}>
            <View style={{ gap: 2 }}>
              <Text style={[styles.summaryFeeText, { color: colors.textSecondary }]}>
                Phí giao dịch: <Text style={{ color: colors.emerald, fontWeight: '700' }}>0đ (Miễn phí)</Text>
              </Text>
              <Text style={[styles.summaryFeeText, { color: colors.textSecondary }]}>
                Tự động khớp lệnh sau 15 giây
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.summaryTotalLabel, { color: colors.textSecondary }]}>TỔNG TIỀN THANH TOÁN</Text>
              <Text style={[styles.summaryTotalValue, { color: colors.wine }]}>
                {formatCurrency(selectedPackage.priceVnd)}
              </Text>
            </View>
          </View>
        </View>

        {/* ========================================================
            3. KHỐI KÊNH THANH TOÁN AN TOÀN (3 TABS GIỐNG BẢN WEB)
            ======================================================== */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="lock-check" size={20} color={colors.wine} />
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                Chọn Kênh Thanh Toán An Toàn:
              </Text>
            </View>
            <Text style={[styles.sslBadgeText, { color: colors.textSecondary }]}>
              SSL 256-bit
            </Text>
          </View>

          {/* 3 Tabs */}
          <View style={styles.gatewayTabsRow}>
            <TouchableOpacity
              style={[
                styles.gatewayTabBtn,
                {
                  backgroundColor: paymentGateway === 'vietqr' ? colors.wineLight : colors.cardBg,
                  borderColor: paymentGateway === 'vietqr' ? colors.wine : colors.cardBorder,
                  borderWidth: paymentGateway === 'vietqr' ? 2 : 1,
                },
              ]}
              onPress={() => setPaymentGateway('vietqr')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="bank-transfer"
                size={22}
                color={paymentGateway === 'vietqr' ? colors.wine : colors.textSecondary}
              />
              <Text
                style={[
                  styles.gatewayTabBtnText,
                  { color: paymentGateway === 'vietqr' ? colors.wine : colors.textPrimary },
                ]}
              >
                Chuyển Khoản 24/7
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.gatewayTabBtn,
                {
                  backgroundColor: paymentGateway === 'ewallet' ? colors.wineLight : colors.cardBg,
                  borderColor: paymentGateway === 'ewallet' ? colors.wine : colors.cardBorder,
                  borderWidth: paymentGateway === 'ewallet' ? 2 : 1,
                },
              ]}
              onPress={() => setPaymentGateway('ewallet')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="wallet"
                size={20}
                color={paymentGateway === 'ewallet' ? colors.wine : colors.textSecondary}
              />
              <Text
                style={[
                  styles.gatewayTabBtnText,
                  { color: paymentGateway === 'ewallet' ? colors.wine : colors.textPrimary },
                ]}
              >
                Ví MoMo/Zalo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.gatewayTabBtn,
                {
                  backgroundColor: paymentGateway === 'atm' ? colors.wineLight : colors.cardBg,
                  borderColor: paymentGateway === 'atm' ? colors.wine : colors.cardBorder,
                  borderWidth: paymentGateway === 'atm' ? 2 : 1,
                },
              ]}
              onPress={() => setPaymentGateway('atm')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="bank"
                size={20}
                color={paymentGateway === 'atm' ? colors.wine : colors.textSecondary}
              />
              <Text
                style={[
                  styles.gatewayTabBtnText,
                  { color: paymentGateway === 'atm' ? colors.wine : colors.textPrimary },
                ]}
              >
                Thẻ ATM/Napas
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: CHUYỂN KHOẢN MB BANK 24/7 (ĐÃ BỎ MÃ QR) */}
          {paymentGateway === 'vietqr' && (
            <View
              style={[
                styles.gatewayContentCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              {/* Bank Header Info Banner */}
              <View style={styles.bankHeaderBanner}>
                <View style={[styles.bankLogoCircle, { backgroundColor: '#002B66' }]}>
                  <MaterialCommunityIcons name="bank" size={20} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.bankBrandTitle, { color: colors.textPrimary }]}>
                    Ngân Hàng MB Bank (Quân Đội)
                  </Text>
                  <Text style={[styles.bankBrandSub, { color: colors.textSecondary }]}>
                    Chuyển khoản 24/7 tự động xác thực và cộng Khoai
                  </Text>
                </View>
              </View>

              {/* Bank Details With Copy Buttons */}
              <View style={[styles.bankDetailsBox, { borderTopColor: colors.cardBorder }]}>
                <View style={styles.bankDetailRow}>
                  <Text style={[styles.bankDetailLabel, { color: colors.textSecondary }]}>Ngân hàng:</Text>
                  <Text style={[styles.bankDetailValBold, { color: colors.textPrimary }]}>MB Bank (Quân Đội)</Text>
                </View>

                <View style={styles.bankDetailRow}>
                  <Text style={[styles.bankDetailLabel, { color: colors.textSecondary }]}>Số tài khoản:</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.bankDetailValBold, { color: colors.textPrimary, letterSpacing: 0.5 }]}>
                      0909090909
                    </Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard('0909090909', 'Số tài khoản')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="copy-outline" size={16} color={colors.gold} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.bankDetailRow}>
                  <Text style={[styles.bankDetailLabel, { color: colors.textSecondary }]}>Chủ tài khoản:</Text>
                  <Text style={[styles.bankDetailValBold, { color: colors.textPrimary }]}>HALM BOOK CORP</Text>
                </View>

                <View style={styles.bankDetailRow}>
                  <Text style={[styles.bankDetailLabel, { color: colors.textSecondary }]}>Số tiền:</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.bankDetailValBold, { color: colors.wine, fontSize: 15 }]}>
                      {formatCurrency(selectedPackage.priceVnd)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(selectedPackage.priceVnd.toString(), 'Số tiền')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="copy-outline" size={16} color={colors.gold} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.bankDetailRow}>
                  <Text style={[styles.bankDetailLabel, { color: colors.textSecondary }]}>Nội dung CK:</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.bankDetailValBold, { color: colors.gold, letterSpacing: 0.5 }]}>
                      {transCode}
                    </Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(transCode, 'Nội dung chuyển khoản')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="copy-outline" size={16} color={colors.gold} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={[styles.qrNoticeBox, { backgroundColor: colors.chipBg }]}>
                <Ionicons name="information-circle-outline" size={16} color={colors.gold} style={{ marginTop: 1 }} />
                <Text style={[styles.qrNoticeText, { color: colors.textSecondary }]}>
                  Vui lòng chuyển khoản chính xác thông tin trên và giữ nguyên mã nội dung <Text style={{ color: colors.gold, fontWeight: '700' }}>{transCode}</Text> để hệ thống tự động cộng Khoai sau 15s.
                </Text>
              </View>
            </View>
          )}

          {/* TAB 2: VÍ ĐIỆN TỬ (MOMO / ZALOPAY / VNPAY) */}
          {paymentGateway === 'ewallet' && (
            <View
              style={[
                styles.gatewayContentCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <View style={styles.ewalletSelectorRow}>
                {(['momo', 'zalopay', 'vnpay'] as EwalletProvider[]).map(key => {
                  const conf = EWALLET_CONFIG[key];
                  const isSelected = currentEwallet === key;

                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.ewalletBtn,
                        {
                          backgroundColor: isSelected ? colors.wineLight : colors.chipBg,
                          borderColor: isSelected ? colors.wine : colors.cardBorder,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                      onPress={() => setCurrentEwallet(key)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.ewalletBadgeLetter, { backgroundColor: conf.color }]}>
                        <Text style={styles.ewalletBadgeLetterText}>{conf.letter}</Text>
                      </View>
                      <Text style={[styles.ewalletBtnName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {conf.name.replace(' Official', '')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.ewalletInfoBox}>
                <Text style={[styles.ewalletHeading, { color: colors.wine }]}>
                  {EWALLET_CONFIG[currentEwallet].name}
                </Text>
                <Text style={[styles.ewalletDesc, { color: colors.textSecondary }]}>
                  {EWALLET_CONFIG[currentEwallet].desc}
                </Text>
              </View>
            </View>
          )}

          {/* TAB 3: THẺ ATM NỘI ĐỊA (NAPAS) */}
          {paymentGateway === 'atm' && (
            <View
              style={[
                styles.gatewayContentCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.atmSectionTitle, { color: colors.textPrimary }]}>
                Chọn Ngân Hàng Bạn Đang Sử Dụng:
              </Text>
              <View style={styles.atmBanksGrid}>
                {ATM_BANKS.map(bank => {
                  const isSelected = currentAtmBank === bank;
                  return (
                    <TouchableOpacity
                      key={bank}
                      style={[
                        styles.atmBankBtn,
                        {
                          backgroundColor: isSelected ? colors.wineLight : colors.chipBg,
                          borderColor: isSelected ? colors.wine : colors.cardBorder,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                      onPress={() => setCurrentAtmBank(bank)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name="bank-outline"
                        size={16}
                        color={isSelected ? colors.wine : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.atmBankBtnText,
                          { color: isSelected ? colors.wine : colors.textPrimary, fontWeight: isSelected ? '800' : '600' },
                        ]}
                        numberOfLines={1}
                      >
                        {bank}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[styles.qrNoticeBox, { backgroundColor: colors.chipBg, marginTop: 12 }]}>
                <Ionicons name="information-circle-outline" size={16} color={colors.gold} style={{ marginTop: 1 }} />
                <Text style={[styles.qrNoticeText, { color: colors.textSecondary }]}>
                  Chuyển khoản từ <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{currentAtmBank}</Text> sang STK <Text style={{ fontWeight: '700', color: colors.gold }}>0909090909</Text> (MB Bank). Khoai sẽ cộng sau khi kiểm tra giao dịch.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ========================================================
            4. KHUNG NHẬP MÃ GIẢM GIÁ (VOUCHER)
            ======================================================== */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginBottom: 8 }]}>
            Mã Giảm Giá / Voucher:
          </Text>
          <View style={[styles.promoBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={[styles.promoInputWrap, { backgroundColor: colors.chipBg }]}>
              <Ionicons name="pricetag-outline" size={16} color={colors.gold} />
              <TextInput
                style={[styles.promoInput, { color: colors.textPrimary }]}
                placeholder="Nhập mã ưu đãi (ví dụ: HALM20, P001...)"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
                value={promoCode}
                onChangeText={v => {
                  setPromoCode(v);
                  setPromoMessage('');
                }}
              />
            </View>
            <TouchableOpacity
              style={[styles.promoApplyBtn, { backgroundColor: colors.wine }]}
              onPress={() => {
                Keyboard.dismiss();
                if (promoCode.trim()) {
                  setPromoMessage(`Đã ghi nhận mã "${promoCode.trim().toUpperCase()}". Mức chiết khấu sẽ được kiểm tra khi tạo đơn.`);
                } else {
                  setPromoMessage('Vui lòng nhập mã giảm giá trước.');
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.promoApplyBtnText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
          {promoMessage ? (
            <Text style={[styles.promoMsgText, { color: colors.gold }]}>{promoMessage}</Text>
          ) : null}
        </View>

        {/* Khoảng trống dưới cùng để không bị nút thanh toán che */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ========================================================
          BOTTOM BAR: NÚT THANH TOÁN LỚN
          ======================================================== */}
      <View
        style={[
          styles.bottomActionBar,
          {
            backgroundColor: colors.cardBg,
            borderTopColor: colors.cardBorder,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.mainPayBtn,
            {
              backgroundColor: isProcessing ? colors.chipBg : colors.wine,
            },
          ]}
          disabled={isProcessing}
          onPress={handleProcessPayment}
          activeOpacity={0.85}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialCommunityIcons name="shield-lock-outline" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.mainPayBtnText}>
            {isProcessing ? 'ĐANG XỬ LÝ GIAO DỊCH...' : getPayButtonText()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================
          MODAL BIÊN LAI GIAO DỊCH (RECEIPT MODAL - CHUẨN BẢN WEB)
          ======================================================== */}
      <Modal
        visible={isSuccessModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSuccessModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.receiptModalBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            {/* Header Modal */}
            <View style={styles.receiptTopCircle}>
              <View style={[styles.receiptIconInner, { backgroundColor: colors.emeraldLight }]}>
                <Ionicons name="checkmark-circle" size={44} color={colors.emerald} />
              </View>
            </View>

            <Text style={[styles.receiptTitle, { color: colors.textPrimary }]}>
              Yêu Cầu Nạp Khoai Đã Gửi Đi!
            </Text>
            <Text style={[styles.receiptSubtitle, { color: colors.textSecondary }]}>
              Giao dịch đã được hệ thống ghi nhận và gửi đến Ban Quản Trị để đối soát & cộng Khoai tự động.
            </Text>

            {receiptData && (
              <View style={[styles.receiptDetailsBox, { backgroundColor: colors.chipBg, borderColor: colors.cardBorder }]}>
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Mã giao dịch:</Text>
                  <Text style={[styles.receiptVal, { color: colors.gold, fontWeight: '800' }]}>
                    {receiptData.transCode}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Gói nạp:</Text>
                  <Text style={[styles.receiptVal, { color: colors.textPrimary }]}>
                    {receiptData.packName}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Số tiền thanh toán:</Text>
                  <Text style={[styles.receiptVal, { color: colors.wine, fontWeight: '800' }]}>
                    {formatCurrency(receiptData.price)}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Số Khoai nhận được:</Text>
                  <Text style={[styles.receiptVal, { color: colors.emerald, fontWeight: '800' }]}>
                    +{receiptData.addedKhoai.toLocaleString('vi-VN')} 🥔
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Kênh thanh toán:</Text>
                  <Text style={[styles.receiptVal, { color: colors.textPrimary }]} numberOfLines={1}>
                    {receiptData.gatewayName}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Trạng thái:</Text>
                  <View style={[styles.statusPendingPill, { backgroundColor: colors.goldLight }]}>
                    <Text style={[styles.statusPendingText, { color: colors.gold }]}>Đang Chờ Duyệt</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.receiptBtnRow}>
              <TouchableOpacity
                style={[styles.receiptCloseBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setIsSuccessModalOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.receiptCloseBtnText, { color: colors.textPrimary }]}>Đóng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.receiptActionBtn, { backgroundColor: colors.wine }]}
                onPress={() => {
                  setIsSuccessModalOpen(false);
                  navigateTab('bookshelf');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.receiptActionBtnText}>Xem Tủ Sách</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ==============================================================
// STYLES
// ==============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    gap: 1,
  },
  headerMainTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  headerSubTitle: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  walletBalanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  walletEmoji: {
    fontSize: 14,
  },
  walletBalanceText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // Toast
  toastPill: {
    position: 'absolute',
    top: 90,
    left: 16,
    right: 16,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
    elevation: 4,
  },
  toastIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastTitleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  toastSubText: {
    fontSize: 11,
    marginTop: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 16,
  },

  // Notice Banner
  noticeBanner: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
  },
  noticeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noticeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  noticeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  noticeBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  noticeTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  noticeDesc: {
    fontSize: 11,
    lineHeight: 15,
  },

  // Section
  sectionWrap: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  sectionInstantBadge: {
    fontSize: 11,
    fontWeight: '800',
  },
  sslBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  loadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },

  // Package Cards 1 Row (4 Gói Trên 1 Hàng)
  packageCardsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
    paddingVertical: 4,
  },
  packageCardCompact: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 116,
    position: 'relative',
    overflow: 'hidden',
  },
  compactBadgeTag: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactBadgeTagText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  compactBadgePlaceholder: {
    height: 12,
  },
  compactPotatoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 1,
  },
  compactPotatoEmoji: {
    fontSize: 18,
  },
  compactPotatoNum: {
    fontSize: 13,
    fontWeight: '900',
  },
  compactBonusNum: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  compactPackName: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  compactPriceBox: {
    borderTopWidth: 1,
    paddingTop: 6,
    marginTop: 6,
    width: '100%',
    alignItems: 'center',
  },
  compactPriceText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  // Summary Card
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryPackTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  safeTagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  safeTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  summaryBenefitText: {
    fontSize: 11.5,
  },
  summaryDescText: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  summaryDivider: {
    height: 1,
  },
  summaryBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryFeeText: {
    fontSize: 11,
  },
  summaryTotalLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  // Gateway Tabs
  gatewayTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gatewayTabBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  gatewayTabBtnText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },

  // Gateway Content
  gatewayContentCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  bankHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bankLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankBrandTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  bankBrandSub: {
    fontSize: 11,
    lineHeight: 15,
  },

  bankDetailsBox: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 8,
  },
  bankDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankDetailLabel: {
    fontSize: 12,
  },
  bankDetailValBold: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  qrNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 12,
    gap: 8,
  },
  qrNoticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },

  // E-Wallet
  ewalletSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ewalletBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  ewalletBadgeLetter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ewalletBadgeLetterText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  ewalletBtnName: {
    fontSize: 11,
    fontWeight: '800',
  },
  ewalletInfoBox: {
    gap: 4,
  },
  ewalletHeading: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  ewalletDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },

  // ATM
  atmSectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  atmBanksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  atmBankBtn: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 6,
  },
  atmBankBtnText: {
    fontSize: 11.5,
  },

  // Promo
  promoBox: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 6,
    gap: 8,
  },
  promoInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 8,
  },
  promoInput: {
    flex: 1,
    fontSize: 12,
    height: 38,
  },
  promoApplyBtn: {
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  promoMsgText: {
    fontSize: 11,
    marginTop: 4,
  },

  // Bottom Action Bar
  bottomActionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
  },
  mainPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  mainPayBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  // Receipt Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  receiptModalBox: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    gap: 12,
  },
  receiptTopCircle: {
    marginTop: -8,
  },
  receiptIconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptTitle: {
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  receiptSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  receiptDetailsBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontSize: 11.5,
  },
  receiptVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusPendingPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPendingText: {
    fontSize: 10,
    fontWeight: '800',
  },
  receiptBtnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
  receiptCloseBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptCloseBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  receiptActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
