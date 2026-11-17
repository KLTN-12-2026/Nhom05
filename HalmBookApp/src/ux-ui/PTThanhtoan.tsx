import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import * as WebBrowser from 'expo-web-browser';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { fetchApiWithFallback } from './apiService';
import { useAppNavigation } from './navigation';

type PotatoPackage = {
  packageId: number;
  packageName: string;
  potatoAmount: number;
  bonusPotato: number | null;
  priceVnd: number;
  badgeTag?: string | null;
  description?: string | null;
};

type PaymentStatus = {
  orderId: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  packageName: string;
  amountVnd: number;
  potatoAmount: number;
  gatewayTransactionId?: string | null;
};

type MomoPayment = PaymentStatus & {
  payUrl: string;
  redirectUrl: string;
  deeplink?: string;
};

type WalletResponse = {
  potatoBalance: number;
};

type PaymentMethod = 'qr' | 'momo' | 'bank';

const formatMoney = (amount: number) => `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;

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

export default function ThanhToan() {
  const { goBack, isDarkMode, lang, setFooterVisible, isLoggedIn, showLoginAlert } = useAppNavigation();
  const isEnglish = lang === 'en';
  const colors = {
    screenBg: isDarkMode ? '#181716' : '#F7F5F0',
    cardBg: isDarkMode ? '#242321' : '#FFFFFF',
    cardBorder: isDarkMode ? '#383633' : '#E6E1D8',
    textPrimary: isDarkMode ? '#F7F5F0' : '#242321',
    textSecondary: isDarkMode ? '#A39F99' : '#85817A',
    accent: isDarkMode ? '#E5A93C' : '#8B4A3C',
    accentText: isDarkMode ? '#181716' : '#FFFFFF',
    chipBg: isDarkMode ? '#2D2B28' : '#EFECE6',
    disabledBg: isDarkMode ? '#33312E' : '#D9D4CA',
    disabledText: isDarkMode ? '#78746E' : '#9E9A92',
    success: isDarkMode ? '#8DCB9A' : '#2F7A45',
    danger: isDarkMode ? '#F0A39A' : '#A63D32',
  };

  const [packages, setPackages] = useState<PotatoPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('momo');
  const [packageDropdownOpen, setPackageDropdownOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [activePayment, setActivePayment] = useState<MomoPayment | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [statusError, setStatusError] = useState('');
  const statusCheckInProgress = useRef(false);
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const scrollOffset = useRef(0);
  const restoreScrollOffset = useRef<number | null>(null);
  const promoInputFocused = useRef(false);
  const restoreScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedPackage = packages.find(item => item.packageId === selectedPackageId);

  useEffect(() => {
    let cancelled = false;

    const loadPaymentData = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          throw new Error(isEnglish ? 'Please sign in to continue.' : 'Vui lòng đăng nhập để tiếp tục.');
        }

        const config = {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        };
        const [packageResponse, walletResponse] = await Promise.all([
          fetchApiWithFallback<PotatoPackage[]>('/api/home/potato/packages', config),
          fetchApiWithFallback<WalletResponse>('/api/home/potato/wallet', config),
        ]);
        if (!Array.isArray(packageResponse.data) || packageResponse.data.length === 0) {
          throw new Error(isEnglish ? 'No top-up packages are currently available.' : 'Hiện chưa có gói nạp Khoai khả dụng.');
        }

        if (!cancelled) {
          setPackages(packageResponse.data);
          setSelectedPackageId(current =>
            packageResponse.data.some(item => item.packageId === current)
              ? current
              : packageResponse.data[0].packageId
          );
          setWalletBalance(Number(walletResponse.data.potatoBalance));
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(getErrorMessage(error));
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
  }, [isEnglish, reloadKey]);

  const refreshPaymentStatus = useCallback(async (orderId: string) => {
    if (statusCheckInProgress.current) {
      return;
    }
    statusCheckInProgress.current = true;
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error(isEnglish ? 'Please sign in again.' : 'Vui lòng đăng nhập lại.');
      }
      const response = await fetchApiWithFallback<PaymentStatus>(
        `/api/home/potato/momo/status/${encodeURIComponent(orderId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );
      setPaymentStatus(response.data);
      setStatusError('');

      if (response.data.status === 'PAID') {
        const walletResponse = await fetchApiWithFallback<WalletResponse>('/api/home/potato/wallet', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        setWalletBalance(Number(walletResponse.data.potatoBalance));
      }
    } catch (error) {
      setStatusError(getErrorMessage(error));
    } finally {
      statusCheckInProgress.current = false;
    }
  }, [isEnglish]);

  useEffect(() => {
    if (!activePayment || paymentStatus?.status !== 'PENDING') {
      return;
    }

    const timer = setInterval(() => {
      void refreshPaymentStatus(activePayment.orderId);
    }, 5000);
    return () => clearInterval(timer);
  }, [activePayment, paymentStatus?.status, refreshPaymentStatus]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      if (promoInputFocused.current) {
        setKeyboardVisible(true);
        setFooterVisible?.(false);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
      }
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      const previousOffset = restoreScrollOffset.current;
      restoreScrollOffset.current = null;
      promoInputFocused.current = false;
      setKeyboardVisible(false);
      setFooterVisible?.(true);
      if (previousOffset !== null) {
        restoreScrollTimer.current = setTimeout(() => {
          scrollRef.current?.scrollTo({ y: previousOffset, animated: false });
        }, 150);
      }
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      if (restoreScrollTimer.current) {
        clearTimeout(restoreScrollTimer.current);
      }
      setFooterVisible?.(true);
    };
  }, [setFooterVisible]);

  const openMomoPayment = useCallback(async (payment: MomoPayment) => {
    setPaymentError('');
    try {
      const result = await WebBrowser.openAuthSessionAsync(payment.payUrl, payment.redirectUrl);
      if (result.type === 'success') {
        await refreshPaymentStatus(payment.orderId);
      }
    } catch (error) {
      setPaymentError(getErrorMessage(error));
    }
  }, [refreshPaymentStatus]);

  const createMomoPayment = useCallback(async () => {
    if (!selectedPackage) {
      return;
    }
    const token = await AsyncStorage.getItem('userToken');
    if (!isLoggedIn && !token) {
      showLoginAlert(isEnglish ? 'Sign in to recharge your potato wallet.' : 'Đăng nhập để nạp Khoai vào ví.');
      return;
    }
    setCreatingPayment(true);
    setPaymentError('');
    setStatusError('');
    try {
      if (!token) {
        throw new Error(isEnglish ? 'Please sign in to continue.' : 'Vui lòng đăng nhập để tiếp tục.');
      }
      const response = await fetchApiWithFallback<MomoPayment>('/api/home/potato/momo/create', {
        method: 'POST',
        data: { packageId: selectedPackage.packageId },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 20000,
      });
      setActivePayment(response.data);
      setPaymentStatus(response.data);
      await openMomoPayment(response.data);
    } catch (error) {
      setPaymentError(getErrorMessage(error));
    } finally {
      setCreatingPayment(false);
    }
  }, [isEnglish, isLoggedIn, openMomoPayment, selectedPackage, showLoginAlert]);

  const actionDisabled = loading || Boolean(loadError) || !selectedPackage || creatingPayment;
  const isPending = paymentStatus?.status === 'PENDING' && Boolean(activePayment);
  const actionDisabledForMethod = actionDisabled || paymentMethod !== 'momo';
  const actionLabel = paymentMethod === 'qr'
    ? (isEnglish ? 'QR setup required' : 'Chờ cấu hình tạo QR')
    : paymentMethod === 'bank'
      ? (isEnglish ? 'Bank list unavailable' : 'Chưa có danh sách ngân hàng')
      : creatingPayment
        ? (isEnglish ? 'Connecting to MoMo...' : 'Đang kết nối MoMo...')
        : isPending
          ? (isEnglish ? 'Continue with MoMo' : 'Tiếp tục thanh toán MoMo')
          : paymentStatus?.status === 'PAID'
            ? (isEnglish ? 'Top up another package' : 'Nạp thêm gói khác')
            : (isEnglish ? 'Pay with MoMo' : 'Thanh toán qua MoMo');
  const actionIcon = paymentMethod === 'qr'
    ? 'qr-code-outline'
    : paymentMethod === 'bank'
      ? 'business-outline'
      : isPending
        ? 'open-outline'
        : 'lock-closed';
  const paymentMethods: { id: PaymentMethod; title: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
    { id: 'qr', title: 'QR Code', icon: 'qr-code-outline' },
    { id: 'momo', title: 'MoMo', icon: 'wallet-outline' },
    { id: 'bank', title: isEnglish ? 'Bank' : 'Ngân hàng', icon: 'business-outline' },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.screenBg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />

      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel={isEnglish ? 'Go back' : 'Quay lại'}
        >
          <Ionicons name="arrow-back" size={21} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {isEnglish ? 'Top up potatoes' : 'Nạp Khoai'}
          </Text>
        </View>
        <View style={[styles.balanceChip, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Ionicons name="nutrition-outline" size={15} color={colors.accent} />
          <Text style={[styles.balanceValue, { color: colors.textPrimary }]}>
            {walletBalance === null ? '--' : new Intl.NumberFormat('vi-VN').format(walletBalance)}
          </Text>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ============================================================================ */}
      {/* THANH THAO TÁC DÍNH DƯỚI ĐÁY (HỘP QUÀ & NẠP NGAY) */}
      {/* "ở phía dưới là nút nạp ngay, bên trái nút nạp ngay là icon hộp quà" */}
      {/* ============================================================================ */}
      <View style={themeStyles.bottomBar}>
        {/* Nút icon hộp quà (Bên trái nút Nạp ngay) */}
        <TouchableOpacity
          style={themeStyles.giftBtn}
          onPress={() => setShowGiftModal(true)}
          activeOpacity={0.8}
          accessibilityLabel="Hộp quà & Tặng khoai"
        >
          <Ionicons name="gift-outline" size={24} color={isDarkMode ? '#FBBF24' : '#D97706'} />
        </TouchableOpacity>

        {/* Nút NẠP NGAY (Bên phải icon hộp quà) - Nhấn vào sẽ hiển thị mã VietQR */}
        <TouchableOpacity
          style={themeStyles.payBtn}
          onPress={handleOpenQrModal}
          activeOpacity={0.85}
        >
          <View style={themeStyles.payBtnContentRow}>
            <Ionicons name="flash" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={themeStyles.payBtnText}>
              {lang === 'en' ? 'Recharge Now' : 'Nạp Ngay'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.methodSelector}>
        {paymentMethods.map(method => {
          const isSelected = paymentMethod === method.id;
          return (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodTab,
                {
                  backgroundColor: isSelected ? colors.accent : colors.cardBg,
                  borderColor: isSelected ? colors.accent : colors.cardBorder,
                  opacity: isPending && !isSelected ? 0.55 : 1,
                },
              ]}
              onPress={() => {
                setPaymentMethod(method.id);
                setPackageDropdownOpen(false);
                setPaymentError('');
              }}
              disabled={Boolean(isPending && !isSelected)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={method.icon}
                size={17}
                color={isSelected ? colors.accentText : colors.textSecondary}
              />
              <Text
                style={[
                  styles.methodTabText,
                  { color: isSelected ? colors.accentText : colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {method.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          keyboardVisible && styles.scrollContentKeyboard,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onScroll={event => {
          scrollOffset.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => setReloadKey(value => value + 1)}
            tintColor={colors.accent}
          />
        }
      >
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>
              {isEnglish ? 'Loading your wallet...' : 'Đang tải thông tin ví...'}
            </Text>
          </View>
        ) : loadError ? (
          <View style={[styles.messageCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Ionicons name="alert-circle-outline" size={26} color={colors.danger} />
            <Text style={[styles.messageText, { color: colors.textPrimary }]}>{loadError}</Text>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.cardBorder }]}
              onPress={() => setReloadKey(value => value + 1)}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>
                {isEnglish ? 'Try again' : 'Thử lại'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.methodInfoCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <View style={[styles.methodInfoIcon, { backgroundColor: paymentMethod === 'momo' ? '#A50064' : colors.chipBg }]}>
                <Ionicons
                  name={paymentMethod === 'qr' ? 'qr-code-outline' : paymentMethod === 'bank' ? 'business-outline' : 'wallet-outline'}
                  size={21}
                  color={paymentMethod === 'momo' ? '#FFFFFF' : colors.accent}
                />
              </View>
              <View style={styles.methodInfoText}>
                <Text style={[styles.methodInfoTitle, { color: colors.textPrimary }]}>
                  {paymentMethod === 'qr' ? 'QR Code' : paymentMethod === 'bank' ? (isEnglish ? 'Bank transfer' : 'Chuyển khoản ngân hàng') : 'MoMo'}
                </Text>
                <Text style={[styles.methodInfoDescription, { color: colors.textSecondary }]}>
                  {paymentMethod === 'qr'
                    ? (isEnglish
                      ? 'A generated QR will be valid for 15 minutes. QR creation is not connected yet, so no sample code is shown.'
                      : 'Mã QR thật sẽ có hiệu lực 15 phút sau khi tạo. API tạo mã chưa được kết nối nên không hiển thị QR giả.')
                    : paymentMethod === 'bank'
                      ? (isEnglish
                        ? 'The bank list will appear here after the system bank catalog is connected.'
                        : 'Danh sách ngân hàng sẽ hiển thị tại đây sau khi có API danh mục ngân hàng.')
                      : (isEnglish
                        ? 'MoMo confirms the payment before potatoes are credited.'
                        : 'Khoai chỉ được cộng sau khi máy chủ xác nhận thanh toán MoMo.')}
                </Text>
              </View>
            </View>

            {paymentMethod === 'bank' ? (
              <View style={[styles.unavailableCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <Ionicons name="business-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.unavailableText, { color: colors.textSecondary }]}>
                  {isEnglish ? 'No bank list is configured yet.' : 'Chưa có ngân hàng nào được cấu hình.'}
                </Text>
              </View>
            ) : null}

            <View style={styles.sectionHeading}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {isEnglish ? 'Choose top-up amount' : 'Chọn số tiền nạp'}
              </Text>
              <Text style={[styles.sectionCaption, { color: colors.textSecondary }]}>
                {isEnglish ? 'Amounts and potato rewards are set by the system' : 'Mốc tiền và số Khoai theo gói hệ thống'}
              </Text>
            </View>

            <View style={[styles.packageDropdown, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setPackageDropdownOpen(open => !open)}
                disabled={Boolean(isPending)}
                activeOpacity={0.8}
              >
                <View style={styles.dropdownSelectedInfo}>
                  <Text style={[styles.dropdownTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {selectedPackage?.packageName || (isEnglish ? 'Select an amount' : 'Chọn mệnh giá')}
                  </Text>
                  <Text style={[styles.dropdownSubtitle, { color: colors.textSecondary }]}>
                    {selectedPackage
                      ? `${new Intl.NumberFormat('vi-VN').format(
                        selectedPackage.potatoAmount + (selectedPackage.bonusPotato || 0)
                      )} 🥔`
                      : (isEnglish ? 'System top-up packages' : 'Các gói nạp của hệ thống')}
                  </Text>
                </View>
                <View style={styles.dropdownPrice}>
                  <Text style={[styles.dropdownPriceText, { color: colors.accent }]}>
                    {selectedPackage ? formatMoney(selectedPackage.priceVnd) : '--'}
                  </Text>
                  <Ionicons
                    name={packageDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>

              {packageDropdownOpen ? (
                <View style={[styles.dropdownOptions, { borderTopColor: colors.cardBorder }]}>
                  {packages.map(item => {
                    const isSelected = item.packageId === selectedPackageId;
                    const totalPotatoes = item.potatoAmount + (item.bonusPotato || 0);
                    return (
                      <TouchableOpacity
                        key={item.packageId}
                        style={[
                          styles.dropdownOption,
                          isSelected && { backgroundColor: colors.chipBg },
                          { borderBottomColor: colors.cardBorder },
                        ]}
                        onPress={() => {
                          setSelectedPackageId(item.packageId);
                          setPackageDropdownOpen(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.dropdownSelectedInfo}>
                          <Text style={[styles.dropdownTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                            {item.packageName}
                          </Text>
                          <Text style={[styles.dropdownSubtitle, { color: colors.textSecondary }]}>
                            {new Intl.NumberFormat('vi-VN').format(totalPotatoes)} 🥔
                            {item.badgeTag ? ` · ${item.badgeTag}` : ''}
                          </Text>
                        </View>
                        <Text style={[styles.dropdownPriceText, { color: colors.accent }]}>
                          {formatMoney(item.priceVnd)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
            </View>

            {paymentStatus && paymentMethod === 'momo' ? (
              <View style={[
                styles.statusCard,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}>
                <Ionicons
                  name={paymentStatus.status === 'PAID' ? 'checkmark-circle' : paymentStatus.status === 'FAILED' ? 'close-circle' : 'time'}
                  size={25}
                  color={paymentStatus.status === 'PAID' ? colors.success : paymentStatus.status === 'FAILED' ? colors.danger : colors.accent}
                />
                <View style={styles.statusInfo}>
                  <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>
                    {paymentStatus.status === 'PAID'
                      ? (isEnglish ? 'Payment confirmed' : 'Thanh toán thành công')
                      : paymentStatus.status === 'FAILED'
                        ? (isEnglish ? 'Payment was not completed' : 'Thanh toán chưa thành công')
                        : (isEnglish ? 'Waiting for MoMo confirmation' : 'Đang chờ MoMo xác nhận')}
                  </Text>
                  <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
                    {paymentStatus.status === 'PAID'
                      ? (isEnglish ? `${paymentStatus.potatoAmount} potatoes were added.` : `Đã cộng ${paymentStatus.potatoAmount} Khoai vào ví.`)
                      : paymentStatus.status === 'FAILED'
                        ? (isEnglish ? 'You can start a new payment.' : 'Bạn có thể tạo giao dịch mới.')
                        : (isEnglish ? 'Your balance updates automatically after confirmation.' : 'Số dư sẽ tự cập nhật sau khi giao dịch được xác nhận.')}
                  </Text>
                  <Text style={[styles.orderReference, { color: colors.textSecondary }]}>
                    {isEnglish ? 'Order' : 'Mã đơn'}: {paymentStatus.orderId}
                  </Text>
                  {statusError ? (
                    <Text style={[styles.statusError, { color: colors.danger }]}>{statusError}</Text>
                  ) : null}
                </View>
                {paymentStatus.status === 'PENDING' ? (
                  <TouchableOpacity
                    onPress={() => void refreshPaymentStatus(paymentStatus.orderId)}
                    accessibilityRole="button"
                    accessibilityLabel={isEnglish ? 'Refresh payment status' : 'Làm mới trạng thái thanh toán'}
                  >
                    <Ionicons name="refresh" size={20} color={colors.accent} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            {paymentError ? (
              <View style={[styles.errorBanner, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <Ionicons name="alert-circle-outline" size={19} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{paymentError}</Text>
              </View>
            ) : null}

            <View style={styles.sectionHeading}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {isEnglish ? 'Discount code' : 'Mã giảm giá'}
              </Text>
            </View>
            <View style={[styles.promoCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <View style={[styles.promoInputWrap, { backgroundColor: colors.chipBg }]}>
                <Ionicons name="pricetag-outline" size={17} color={colors.textSecondary} />
                <TextInput
                  style={[styles.promoInput, { color: colors.textPrimary }]}
                  placeholder={isEnglish ? 'Enter discount code' : 'Nhập mã giảm giá'}
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="characters"
                  returnKeyType="done"
                  value={promoCode}
                  onFocus={() => {
                    restoreScrollOffset.current = scrollOffset.current;
                    promoInputFocused.current = true;
                  }}
                  onSubmitEditing={() => Keyboard.dismiss()}
                  onChangeText={value => {
                    setPromoCode(value);
                    setPromoMessage('');
                  }}
                />
              </View>
              <TouchableOpacity
                style={[styles.promoButton, { backgroundColor: colors.chipBg }]}
                onPress={() => {
                  setPromoMessage(
                    promoCode.trim()
                      ? (isEnglish
                        ? 'Discount codes are not enabled for top-ups yet; no discount was applied.'
                        : 'Mã giảm giá chưa áp dụng cho nạp Khoai; hệ thống chưa trừ tiền.')
                      : (isEnglish ? 'Enter a code first.' : 'Vui lòng nhập mã trước.')
                  );
                  Keyboard.dismiss();
                }}
              >
                <Text style={[styles.promoButtonText, { color: colors.accent }]}>
                  {isEnglish ? 'Apply' : 'Áp dụng'}
                </Text>
              </TouchableOpacity>
              {promoMessage ? (
                <Text style={[styles.promoMessage, { color: colors.textSecondary }]}>{promoMessage}</Text>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>

      {!keyboardVisible ? (
        <View style={[styles.bottomBar, { backgroundColor: colors.cardBg, borderTopColor: colors.cardBorder }]}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
              {isEnglish ? 'Total payment' : 'Tổng thanh toán'}
            </Text>
            <Text style={[styles.totalValue, { color: colors.textPrimary }]}>
              {selectedPackage ? formatMoney(selectedPackage.priceVnd) : '--'}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.payButton,
              { backgroundColor: actionDisabledForMethod ? colors.disabledBg : colors.accent },
            ]}
            disabled={actionDisabledForMethod}
            onPress={() => {
              if (isPending && activePayment) {
                void openMomoPayment(activePayment);
              } else {
                void createMomoPayment();
              }
            }}
            activeOpacity={0.85}
          >
            {creatingPayment ? (
              <ActivityIndicator size="small" color={colors.accentText} />
            ) : (
              <Ionicons
                name={actionIcon}
                size={18}
                color={actionDisabledForMethod ? colors.disabledText : colors.accentText}
              />
            )}
            <Text style={[styles.payButtonText, { color: actionDisabledForMethod ? colors.disabledText : colors.accentText }]}>
              {actionLabel}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 52,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  balanceValue: { fontSize: 13, fontWeight: '800' },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 21, fontWeight: '800' },
  methodSelector: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 4,
  },
  methodTab: {
    flex: 1,
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 7,
    borderWidth: 1,
    borderRadius: 13,
  },
  methodTabText: { fontSize: 12, fontWeight: '800' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 150 },
  scrollContentKeyboard: { paddingBottom: 16 },
  centerState: { alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 12 },
  stateText: { fontSize: 14, fontWeight: '600' },
  messageCard: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
    gap: 12,
  },
  messageText: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  secondaryButton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  secondaryButtonText: { fontSize: 14, fontWeight: '700' },
  methodInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 11,
  },
  methodInfoIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  methodInfoText: { flex: 1 },
  methodInfoTitle: { fontSize: 14, fontWeight: '800' },
  methodInfoDescription: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  unavailableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 13,
    padding: 12,
    marginTop: 10,
    gap: 8,
  },
  unavailableText: { flex: 1, fontSize: 12, lineHeight: 17 },
  sectionHeading: { marginTop: 23, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  sectionCaption: { fontSize: 12, marginTop: 3 },
  packageDropdown: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  dropdownTrigger: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownSelectedInfo: { flex: 1, marginRight: 10 },
  dropdownTitle: { fontSize: 14, fontWeight: '800' },
  dropdownSubtitle: { fontSize: 11, marginTop: 4 },
  dropdownPrice: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  dropdownPriceText: { fontSize: 13, fontWeight: '800' },
  dropdownOptions: { borderTopWidth: 1 },
  dropdownOption: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  promoCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 16,
    padding: 11,
    flexWrap: 'wrap',
    gap: 8,
  },
  promoInputWrap: {
    flex: 1,
    minWidth: 180,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 11,
    paddingHorizontal: 10,
    gap: 7,
  },
  promoInput: { flex: 1, minHeight: 40, fontSize: 13 },
  promoButton: { minHeight: 42, borderRadius: 11, justifyContent: 'center', paddingHorizontal: 14 },
  promoButtonText: { fontSize: 12, fontWeight: '800' },
  promoMessage: { flexBasis: '100%', fontSize: 11, lineHeight: 16, marginTop: 2 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 18,
    gap: 10,
  },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 14, fontWeight: '800' },
  statusDescription: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  orderReference: { fontSize: 10, marginTop: 6 },
  statusError: { fontSize: 11, lineHeight: 15, marginTop: 5 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 11, gap: 8, marginTop: 12 },
  errorText: { flex: 1, fontSize: 12, lineHeight: 17 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
  },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  totalLabel: { fontSize: 13, fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: '800' },
  payButton: { minHeight: 50, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  payButtonText: { fontSize: 14, fontWeight: '800' },
});
