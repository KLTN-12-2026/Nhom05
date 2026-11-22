import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAxiosError } from 'axios';
import * as Clipboard from 'expo-clipboard';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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

// Fallback packages giống hệt màn Ưu đãi nếu CSDL chưa tải kịp
const FALLBACK_PACKAGES: PotatoPackage[] = [
  {
    packageId: 1,
    packageName: 'Gói Khởi Đầu',
    potatoAmount: 50,
    bonusPotato: 0,
    priceVnd: 50000,
    badgeTag: 'Cơ bản',
    description: 'Phù hợp trải nghiệm thuê sách nhanh.',
  },
  {
    packageId: 2,
    packageName: 'Gói Tiêu Chuẩn',
    potatoAmount: 200,
    bonusPotato: 20,
    priceVnd: 200000,
    badgeTag: 'Đề Xuất 🔥',
    description: 'Gốc 200 + Tặng 20 Khoai & voucher giảm 20k.',
  },
  {
    packageId: 3,
    packageName: 'Gói Thân Thiết',
    potatoAmount: 500,
    bonusPotato: 75,
    priceVnd: 500000,
    badgeTag: '+15% Thưởng',
    description: 'Gốc 500 + Tặng 75 Khoai & Bookmark Gỗ.',
  },
  {
    packageId: 4,
    packageName: 'Gói Đặc Quyền',
    potatoAmount: 1000,
    bonusPotato: 250,
    priceVnd: 1000000,
    badgeTag: '+25% VIP',
    description: 'Gốc 1.000 + Tặng 250 Khoai & miễn phí cọc sách.',
  },
];

const BANK_CODE = '970422'; // MB Bank
const BANK_ACCOUNT_NO = '0345678999';
const BANK_ACCOUNT_NAME = 'HALM BOOK CO LTD';

const formatCurrency = (amount: number) =>
  `${new Intl.NumberFormat('vi-VN').format(amount || 0)} đ`;

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
// MAIN COMPONENT: MÀN HÌNH NẠP KHOAI (GÓI ƯU ĐÃI + MODAL VIETQR CHUẨN WEB)
// ==============================================================
export default function ThanhToan() {
  const { goBack, navigate, isDarkMode, isLoggedIn, showLoginAlert, navigateTab } =
    useAppNavigation();

  const colors = useMemo(
    () => ({
      screenBg: isDarkMode ? '#181716' : '#F7F5F0',
      cardBg: isDarkMode ? '#242321' : '#FFFFFF',
      cardBorder: isDarkMode ? '#383633' : '#E6E1D8',
      textPrimary: isDarkMode ? '#F7F5F0' : '#242321',
      textSecondary: isDarkMode ? '#A39F99' : '#85817A',
      wine: isDarkMode ? '#E5A93C' : '#8B4A3C',
      wineBtnText: isDarkMode ? '#181716' : '#FFFFFF',
      wineLight: isDarkMode ? 'rgba(229, 169, 60, 0.16)' : 'rgba(139, 74, 60, 0.1)',
      potatoColor: isDarkMode ? '#FB923C' : '#EA580C',
      potatoGold: isDarkMode ? '#FBBF24' : '#D97706',
      goldLight: isDarkMode ? 'rgba(251, 191, 36, 0.15)' : 'rgba(217, 119, 6, 0.1)',
      emerald: isDarkMode ? '#34D399' : '#059669',
      emeraldLight: isDarkMode ? 'rgba(52, 211, 153, 0.15)' : 'rgba(5, 150, 105, 0.1)',
      amberBg: isDarkMode ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB',
      amberBorder: isDarkMode ? 'rgba(245, 158, 11, 0.35)' : '#FCD34D',
      amberText: isDarkMode ? '#FBBF24' : '#B45309',
      chipBg: isDarkMode ? '#1E1D1B' : '#F7F5F0',
    }),
    [isDarkMode]
  );

  // State danh sách gói & số dư
  const [packages, setPackages] = useState<PotatoPackage[]>(FALLBACK_PACKAGES);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState<string>('7');
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // State Modal QR & Biên lai
  const [selectedPackage, setSelectedPackage] = useState<PotatoPackage | null>(
    FALLBACK_PACKAGES[0]
  );
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrUseFallback, setQrUseFallback] = useState(false);
  const [qrLoading, setQrLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // State Modal Tặng Khoai Bạn Đọc (giống Web CaNhan.jsx)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferReceiver, setTransferReceiver] = useState('');
  const [transferAmount, setTransferAmount] = useState('10');
  const [transferNote, setTransferNote] = useState('');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ show: boolean; title: string; msg: string }>({
    show: false,
    title: '',
    msg: '',
  });

  const showToast = (title: string, msg: string) => {
    setToast({ show: true, title, msg });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2800);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      showToast('Đã sao chép!', `${label}: ${text}`);
    } catch {
      Alert.alert('Đã sao chép', text);
    }
  };

  // 1. Tải Gói Nạp, Số Dư Ví & Mã khách hàng từ Backend / Storage
  useEffect(() => {
    let cancelled = false;

    const loadPaymentData = async () => {
      setLoading(true);
      try {
        const [token, profileRaw] = await Promise.all([
          AsyncStorage.getItem('userToken'),
          AsyncStorage.getItem('userProfile'),
        ]);

        if (!cancelled && profileRaw) {
          try {
            const parsed = JSON.parse(profileRaw);
            const cid = parsed?.customerId || parsed?.customer_id || parsed?.id;
            if (cid) setCustomerId(String(cid));
          } catch {
            // Bỏ qua lỗi parse
          }
        }

        const config = token
          ? { headers: { Authorization: `Bearer ${token}` }, timeout: 8000 }
          : { timeout: 8000 };

        const [packageResponse, walletResponse] = await Promise.allSettled([
          fetchApiWithFallback<PotatoPackage[]>('/api/home/potato/packages', config),
          token
            ? fetchApiWithFallback<WalletResponse>('/api/home/potato/wallet', config)
            : Promise.reject(),
        ]);

        if (!cancelled) {
          if (
            packageResponse.status === 'fulfilled' &&
            Array.isArray(packageResponse.value.data) &&
            packageResponse.value.data.length > 0
          ) {
            setPackages(packageResponse.value.data);
            setSelectedPackage(packageResponse.value.data[0]);
          }
          if (
            walletResponse.status === 'fulfilled' &&
            walletResponse.value.data?.potatoBalance !== undefined
          ) {
            setWalletBalance(Number(walletResponse.value.data.potatoBalance));
          }
        }
      } catch {
        // Giữ fallback packages nếu lỗi mạng
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

  // Nội dung chuyển khoản chuẩn giống Web (CaNhan.jsx)
  const customerCode = useMemo(() => {
    const clean = String(customerId || '7').replace(/^C/i, '').padStart(5, '0');
    return `C${clean}`;
  }, [customerId]);

  const transferContent = useMemo(
    () => `HALM ${customerCode} NAP`,
    [customerCode]
  );

  const qrImageUrl = useMemo(() => {
    if (!selectedPackage) return '';
    const amount = selectedPackage.priceVnd || 0;
    if (qrUseFallback) {
      return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
        `HALM-NAP-${customerCode}-${amount}`
      )}`;
    }
    return `https://api.vietqr.io/image/${BANK_CODE}-${BANK_ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
      transferContent
    )}&accountName=${encodeURIComponent(BANK_ACCOUNT_NAME)}`;
  }, [selectedPackage, qrUseFallback, customerCode, transferContent]);

  // Mở Modal QR khi nhấn nạp gói
  const handleOpenQrForPackage = (pkg?: PotatoPackage | null) => {
    const targetPkg = pkg || selectedPackage || packages[0] || FALLBACK_PACKAGES[0];
    setSelectedPackage(targetPkg);
    setQrUseFallback(false);
    setQrLoading(true);
    setIsQrModalOpen(true);
  };

  // Xác nhận "Tôi Đã Chuyển Khoản" -> Gửi yêu cầu nạp lên backend (giống Web CaNhan.jsx)
  const handleConfirmTopup = async () => {
    if (!selectedPackage || isProcessing) return;

    const token = await AsyncStorage.getItem('userToken');
    if (!isLoggedIn && !token) {
      setIsQrModalOpen(false);
      showLoginAlert('Vui lòng đăng nhập để thực hiện nạp Khoai vào ví!');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetchApiWithFallback<{
        message?: string;
        order?: {
          id?: number;
          transactionNo?: string;
          totalAmount?: number;
          paymentStatus?: string;
        };
        wallet?: { potatoBalance?: number };
      }>('/api/home/potato/topup', {
        method: 'POST',
        data: {
          packageId: selectedPackage.packageId,
          amountMoney: selectedPackage.priceVnd,
          paymentMethod: 'VIETQR',
          note: `Nạp ${selectedPackage.packageName}`,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        timeout: 15000,
      });

      const serverOrder = res.data?.order;
      const orderCode =
        serverOrder?.transactionNo ||
        `HLM-TOPUP-${Math.floor(10000 + Math.random() * 90000)}`;
      const expectedKhoai =
        selectedPackage.potatoAmount + (selectedPackage.bonusPotato || 0);

      if (res.data?.wallet?.potatoBalance !== undefined) {
        setWalletBalance(res.data.wallet.potatoBalance);
      }

      setReceiptData({
        transCode: orderCode,
        gatewayName: 'VietQR 24/7 (MB Bank)',
        packName: selectedPackage.packageName,
        price: selectedPackage.priceVnd,
        addedKhoai: expectedKhoai,
        newBalance: res.data?.wallet?.potatoBalance ?? walletBalance ?? 0,
        status: serverOrder?.paymentStatus || 'PENDING',
      });

      setIsQrModalOpen(false);
      setIsSuccessModalOpen(true);
      showToast('Yêu cầu nạp đã gửi đi!', 'Đơn hàng đang chờ Admin đối soát.');
    } catch (err: unknown) {
      Alert.alert('Không thể gửi yêu cầu nạp', getErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  // Xử lý Tặng Khoai cho bạn đọc (giống Web CaNhan.jsx: POST /api/home/potato/transfer)
  const handleTransferSubmit = async () => {
    if (isSubmittingTransfer) return;

    const token = await AsyncStorage.getItem('userToken');
    if (!isLoggedIn && !token) {
      setIsTransferModalOpen(false);
      showLoginAlert('Vui lòng đăng nhập để thực hiện tặng Khoai!');
      return;
    }

    const amount = parseInt(transferAmount, 10);
    if (!amount || amount <= 0) {
      showToast('Thông Báo', 'Vui lòng nhập số Khoai hợp lệ!');
      return;
    }
    const currentBal = walletBalance ?? 0;
    if (amount > currentBal) {
      showToast('Số Dư Không Đủ', 'Bạn không có đủ số Khoai trong ví để thực hiện tặng!');
      return;
    }
    if (!transferReceiver.trim()) {
      showToast('Thông Báo', 'Vui lòng nhập Mã Bạn Đọc hoặc Email người nhận!');
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      const res = await fetchApiWithFallback<{
        wallet?: { potatoBalance?: number };
      }>('/api/home/potato/transfer', {
        method: 'POST',
        data: {
          receiver: transferReceiver.trim(),
          amount,
          note: transferNote.trim() || 'Tặng bạn đọc khoai đọc sách',
        },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        timeout: 15000,
      });

      if (res.data?.wallet?.potatoBalance !== undefined) {
        setWalletBalance(Number(res.data.wallet.potatoBalance));
      } else {
        setWalletBalance(Math.max(0, currentBal - amount));
      }

      const receiverLabel = transferReceiver.trim();
      setIsTransferModalOpen(false);
      setTransferReceiver('');
      setTransferAmount('10');
      setTransferNote('');
      showToast(
        'Tặng Khoai Thành Công!',
        `Đã chuyển ${amount.toLocaleString('vi-VN')} Khoai tới ${receiverLabel}.`
      );
    } catch (err: unknown) {
      showToast('Tặng Khoai Thất Bại', getErrorMessage(err));
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.screenBg }]}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Toast Notification */}
      {toast.show && (
        <View
          style={[
            styles.toastPill,
            { backgroundColor: colors.cardBg, borderColor: colors.potatoGold },
          ]}
        >
          <View style={[styles.toastIconCircle, { backgroundColor: colors.goldLight }]}>
            <Ionicons name="checkmark" size={13} color={colors.potatoGold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toastTitleText, { color: colors.textPrimary }]}>
              {toast.title}
            </Text>
            <Text style={[styles.toastSubText, { color: colors.textSecondary }]}>
              {toast.msg}
            </Text>
          </View>
        </View>
      )}

      {/* Nút Icon Thoát Màn Nạp (Nổi góc trái trên, không có thanh Header) */}
      <TouchableOpacity
        style={[
          styles.floatingExitBtn,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          },
        ]}
        onPress={goBack}
        activeOpacity={0.78}
        accessibilityRole="button"
        accessibilityLabel="Thoát màn nạp"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
      </TouchableOpacity>

      {/* ========================================================
          CÂU SLOGAN Ở GIỮA + DANH SÁCH GÓI NẠP + ĐIỀU KHOẢN
          ======================================================== */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => setReloadKey((p) => p + 1)}
            colors={[colors.potatoColor, colors.potatoGold]}
            tintColor={colors.potatoGold}
          />
        }
      >
        {/* Câu Slogan Nghệ Thuật Hiển Thị Ở Chính Giữa (Không khung viền, không icon củ khoai) */}
        <View style={styles.centerSloganWrap}>
          <Text
            style={[styles.sloganOverlineText, { color: colors.potatoGold }]}
          >
            HALM BOOK • KHO SÁCH BẢN QUYỀN
          </Text>

          <Text
            style={[styles.centerSloganLine1, { color: colors.textPrimary }]}
          >
            Nạp khoai mỗi ngày,
          </Text>

          <View style={styles.centerSloganLine2Row}>
            <View
              style={[
                styles.sloganOrnamentLine,
                { backgroundColor: colors.potatoColor },
              ]}
            />
            <Text
              style={[styles.centerSloganLine2, { color: colors.potatoColor }]}
            >
              Sách hay đầy tay
            </Text>
            <View
              style={[
                styles.sloganOrnamentLine,
                { backgroundColor: colors.potatoColor },
              ]}
            />
          </View>

          <Text
            style={[styles.centerSloganSub, { color: colors.textSecondary }]}
          >
            Tích lũy Khoai vàng — Mở khóa trọn vẹn thế giới tri thức
          </Text>
        </View>

        {loading && packages.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.potatoColor} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Đang tải các gói nạp...
            </Text>
          </View>
        ) : (
          <View style={styles.potatoVerticalList}>
            {packages.map((item, index) => {
              const bonus = item.bonusPotato || 0;
              const totalPotatoes = item.potatoAmount + bonus;
              const priceFormatted = formatCurrency(item.priceVnd);
              const isSelected = selectedPackage?.packageId === item.packageId;

              return (
                <TouchableOpacity
                  key={item.packageId || index}
                  style={[
                    styles.potatoVerticalCard,
                    {
                      backgroundColor: isSelected
                        ? isDarkMode
                          ? 'rgba(251, 146, 60, 0.1)'
                          : '#FFFBF5'
                        : colors.cardBg,
                      borderColor: isSelected
                        ? colors.potatoColor
                        : colors.cardBorder,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                  onPress={() => setSelectedPackage(item)}
                  activeOpacity={0.85}
                >
                  {/* Cột trái: Tên gói, Badge, Số Khoai, Khoai thưởng */}
                  <View style={styles.potatoLeftCol}>
                    <View style={styles.potatoTitleRow}>
                      <Text
                        style={[styles.potatoPackageName, { color: colors.textPrimary }]}
                        numberOfLines={1}
                      >
                        {item.packageName}
                      </Text>
                      {item.badgeTag ? (
                        <View
                          style={[
                            styles.potatoBadge,
                            { backgroundColor: colors.goldLight },
                          ]}
                        >
                          <Text
                            style={[
                              styles.potatoBadgeText,
                              { color: colors.potatoGold },
                            ]}
                          >
                            {item.badgeTag}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.potatoAmountRow}>
                      <Text style={styles.potatoEmoji}>🥔</Text>
                      <Text
                        style={[styles.potatoAmountNum, { color: colors.textPrimary }]}
                      >
                        {totalPotatoes.toLocaleString('vi-VN')}
                      </Text>
                      <Text style={[styles.potatoUnit, { color: colors.potatoGold }]}>
                        Khoai
                      </Text>
                    </View>

                    {bonus > 0 ? (
                      <Text
                        style={[styles.potatoBonusTag, { color: colors.potatoColor }]}
                      >
                        +{bonus.toLocaleString('vi-VN')} Khoai thưởng (Gốc{' '}
                        {item.potatoAmount.toLocaleString('vi-VN')})
                      </Text>
                    ) : (
                      <Text
                        style={[styles.potatoBonusTag, { color: colors.textSecondary }]}
                      >
                        Mệnh giá nạp cơ bản
                      </Text>
                    )}
                  </View>

                  {/* Cột phải: Giá tiền & Nút Nạp ngay */}
                  <View style={styles.potatoRightCol}>
                    <Text style={[styles.potatoPrice, { color: colors.textPrimary }]}>
                      {priceFormatted}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.potatoBtn,
                        { backgroundColor: colors.potatoColor },
                      ]}
                      onPress={() => handleOpenQrForPackage(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.potatoBtnText}>Nạp ngay</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Khối chữ nhỏ Điều khoản & Lưu ý nạp Khoai */}
        <View style={styles.termsSection}>
          <Text style={[styles.termsHeading, { color: colors.textSecondary }]}>
            Lưu ý & Điều khoản nạp Khoai:
          </Text>
          <Text style={[styles.termsItemText, { color: colors.textSecondary }]}>
            • Khoai nạp thành công sẽ được cộng trực tiếp vào ví tài khoản sau khi hệ thống xác nhận giao dịch VietQR 24/7.
          </Text>
          <Text style={[styles.termsItemText, { color: colors.textSecondary }]}>
            • Khoai dùng để thuê sách, mở khóa combo ưu đãi trên ứng dụng HALM BOOK và không có giá trị quy đổi ngược thành tiền mặt.
          </Text>
          <Text style={[styles.termsItemText, { color: colors.textSecondary }]}>
            • Bằng việc nhấn Nạp khoai, bạn xác nhận đã đọc và đồng ý với Điều khoản sử dụng & Chính sách thanh toán của HALM BOOK.
          </Text>
        </View>
      </ScrollView>

      {/* ========================================================
          FOOTER CỐ ĐỊNH: BÊN TRÁI NÚT HỘP QUÀ, BÊN PHẢI NÚT NẠP KHOAI
          ======================================================== */}
      <View
        style={[
          styles.fixedFooterBar,
          {
            backgroundColor: colors.cardBg,
            borderTopColor: colors.cardBorder,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.giftBoxBtn,
            {
              backgroundColor: colors.chipBg,
              borderColor: colors.potatoColor,
            },
          ]}
          onPress={() => setIsTransferModalOpen(true)}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Tặng khoai bạn đọc"
        >
          <Ionicons name="gift" size={22} color={colors.potatoColor} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.mainTopupBtn,
            { backgroundColor: colors.potatoColor },
          ]}
          onPress={() => handleOpenQrForPackage(selectedPackage)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Nạp khoai"
        >
          <Text style={styles.mainTopupBtnText}>Nạp khoai</Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================
          MODAL HIỂN THỊ MÃ VIETQR (CHUẨN GIAO DIỆN WEB CaNhan.jsx)
          ======================================================== */}
      <Modal
        visible={isQrModalOpen && !!selectedPackage}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isProcessing) setIsQrModalOpen(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.qrModalCard,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
            ]}
          >
            {/* Modal Header */}
            <View
              style={[
                styles.qrModalHeader,
                {
                  backgroundColor: colors.chipBg,
                  borderBottomColor: colors.cardBorder,
                },
              ]}
            >
              <View style={[styles.qrHeaderIcon, { backgroundColor: colors.wine }]}>
                <MaterialCommunityIcons
                  name="qrcode-scan"
                  size={20}
                  color={colors.wineBtnText}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.qrModalTitle, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  Nạp Khoai Siêu Tốc (VietQR 24/7)
                </Text>
                <Text
                  style={[styles.qrModalSubtitle, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  Quét mã bằng app ngân hàng bất kỳ để nhận khoai tự động
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.qrModalCloseBtn,
                  { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                ]}
                onPress={() => !isProcessing && setIsQrModalOpen(false)}
                disabled={isProcessing}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Modal Scrollable Content */}
            {selectedPackage && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.qrModalBody}
              >
                {/* Tóm tắt gói đang chọn */}
                <View
                  style={[
                    styles.selectedPkgBanner,
                    {
                      backgroundColor: colors.wineLight,
                      borderColor: colors.wine,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.selectedPkgName,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {selectedPackage.packageName}
                    </Text>
                    <Text
                      style={[
                        styles.selectedPkgKhoai,
                        { color: colors.emerald },
                      ]}
                    >
                      Nhận{' '}
                      {(
                        selectedPackage.potatoAmount +
                        (selectedPackage.bonusPotato || 0)
                      ).toLocaleString('vi-VN')}{' '}
                      🥔
                      {selectedPackage.bonusPotato
                        ? ` (gồm +${selectedPackage.bonusPotato} thưởng)`
                        : ''}
                    </Text>
                  </View>
                  <Text style={[styles.selectedPkgPrice, { color: colors.wine }]}>
                    {formatCurrency(selectedPackage.priceVnd)}
                  </Text>
                </View>

                {/* Khung Ảnh Mã QR */}
                <View style={styles.qrImageSection}>
                  <View style={styles.qrWhiteFrame}>
                    {qrLoading && (
                      <View style={styles.qrLoadingOverlay}>
                        <ActivityIndicator size="small" color="#8B4A3C" />
                      </View>
                    )}
                    <Image
                      source={{ uri: qrImageUrl }}
                      style={styles.qrImage}
                      resizeMode="contain"
                      onLoadEnd={() => setQrLoading(false)}
                      onError={() => {
                        if (!qrUseFallback) {
                          setQrUseFallback(true);
                        } else {
                          setQrLoading(false);
                        }
                      }}
                    />
                  </View>
                  <View style={styles.qrInstantHintRow}>
                    <Ionicons name="flash" size={13} color="#F59E0B" />
                    <Text
                      style={[
                        styles.qrInstantHintText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Xử lý & cộng khoai tức thì
                    </Text>
                  </View>
                </View>

                {/* Thông tin chuyển khoản chi tiết (giống hệt Web) */}
                <View style={styles.bankInfoList}>
                  {/* Ngân hàng */}
                  <View
                    style={[
                      styles.bankInfoCard,
                      {
                        backgroundColor: colors.chipBg,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.bankInfoLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Ngân Hàng Thụ Hưởng
                      </Text>
                      <Text
                        style={[
                          styles.bankInfoVal,
                          { color: colors.textPrimary },
                        ]}
                      >
                        MB Bank (Ngân Hàng Quân Đội)
                      </Text>
                    </View>
                    <View style={styles.mbTagBadge}>
                      <Text style={styles.mbTagText}>MB</Text>
                    </View>
                  </View>

                  {/* Số tài khoản */}
                  <View
                    style={[
                      styles.bankInfoCard,
                      {
                        backgroundColor: colors.chipBg,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.bankInfoLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Số Tài Khoản
                      </Text>
                      <Text
                        style={[
                          styles.bankInfoMonoVal,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {BANK_ACCOUNT_NO}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.copyPillBtn,
                        { backgroundColor: colors.wineLight },
                      ]}
                      onPress={() =>
                        copyToClipboard(BANK_ACCOUNT_NO, 'Số tài khoản')
                      }
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name="copy-outline"
                        size={13}
                        color={colors.wine}
                      />
                      <Text style={[styles.copyPillText, { color: colors.wine }]}>
                        Chép
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Chủ tài khoản */}
                  <View
                    style={[
                      styles.bankInfoCard,
                      {
                        backgroundColor: colors.chipBg,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.bankInfoLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Chủ Tài Khoản
                      </Text>
                      <Text
                        style={[
                          styles.bankInfoVal,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {BANK_ACCOUNT_NAME}
                      </Text>
                    </View>
                    <Ionicons
                      name="shield-checkmark"
                      size={19}
                      color={colors.emerald}
                    />
                  </View>

                  {/* Số tiền nạp */}
                  <View
                    style={[
                      styles.bankInfoCard,
                      {
                        backgroundColor: colors.chipBg,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.bankInfoLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Số Tiền Nạp
                      </Text>
                      <Text
                        style={[styles.bankInfoPriceVal, { color: colors.wine }]}
                      >
                        {formatCurrency(selectedPackage.priceVnd)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.copyPillBtn,
                        { backgroundColor: colors.wineLight },
                      ]}
                      onPress={() =>
                        copyToClipboard(
                          String(selectedPackage.priceVnd),
                          'Số tiền nạp'
                        )
                      }
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name="copy-outline"
                        size={13}
                        color={colors.wine}
                      />
                      <Text style={[styles.copyPillText, { color: colors.wine }]}>
                        Chép
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Nội dung chuyển khoản */}
                  <View
                    style={[
                      styles.bankInfoCard,
                      {
                        backgroundColor: colors.amberBg,
                        borderColor: colors.amberBorder,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.bankInfoLabel,
                          { color: colors.amberText, fontWeight: '700' },
                        ]}
                      >
                        Nội Dung Chuyển Khoản (Bắt buộc đúng)
                      </Text>
                      <Text
                        style={[
                          styles.bankInfoMonoVal,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {transferContent}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.copyPillBtn,
                        { backgroundColor: '#F59E0B' },
                      ]}
                      onPress={() =>
                        copyToClipboard(
                          transferContent,
                          'Nội dung chuyển khoản'
                        )
                      }
                      activeOpacity={0.75}
                    >
                      <Ionicons name="copy-outline" size={13} color="#FFFFFF" />
                      <Text style={[styles.copyPillText, { color: '#FFFFFF' }]}>
                        Chép
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Ghi chú xác nhận 2 bước */}
                  <View
                    style={[
                      styles.safeStepBox,
                      {
                        backgroundColor: colors.chipBg,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={16}
                      color={colors.wine}
                      style={{ marginTop: 1 }}
                    />
                    <Text
                      style={[
                        styles.safeStepText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      <Text
                        style={{
                          fontWeight: '800',
                          color: colors.textPrimary,
                        }}
                      >
                        Xác nhận 2 bước an toàn:{' '}
                      </Text>
                      Sau khi bạn nhấn{' '}
                      <Text style={{ fontWeight: '700', color: colors.wine }}>
                        "Tôi Đã Chuyển Khoản"
                      </Text>
                      , yêu cầu sẽ được gửi tới hệ thống để đối soát và cộng
                      Khoai vào ví.
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            {/* Modal Footer */}
            {selectedPackage && (
              <View
                style={[
                  styles.qrModalFooter,
                  {
                    backgroundColor: colors.chipBg,
                    borderTopColor: colors.cardBorder,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.qrCancelBtn,
                    { borderColor: colors.cardBorder, backgroundColor: colors.cardBg },
                  ]}
                  onPress={() => setIsQrModalOpen(false)}
                  disabled={isProcessing}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.qrCancelBtnText,
                      { color: colors.textPrimary },
                    ]}
                  >
                    Đóng
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.qrConfirmBtn,
                    {
                      backgroundColor: colors.wine,
                      opacity: isProcessing ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleConfirmTopup}
                  disabled={isProcessing}
                  activeOpacity={0.85}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color={colors.wineBtnText} />
                  ) : (
                    <Ionicons
                      name="checkmark-circle"
                      size={17}
                      color={colors.wineBtnText}
                    />
                  )}
                  <Text
                    style={[
                      styles.qrConfirmBtnText,
                      { color: colors.wineBtnText },
                    ]}
                  >
                    {isProcessing ? 'Đang gửi...' : 'Tôi Đã Chuyển Khoản'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ========================================================
          MODAL BIÊN LAI GIAO DỊCH SAU KHI XÁC NHẬN CHUYỂN KHOẢN
          ======================================================== */}
      <Modal
        visible={isSuccessModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSuccessModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.receiptModalBox,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.receiptTopCircle}>
              <View
                style={[
                  styles.receiptIconInner,
                  { backgroundColor: colors.emeraldLight },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={44}
                  color={colors.emerald}
                />
              </View>
            </View>

            <Text style={[styles.receiptTitle, { color: colors.textPrimary }]}>
              Yêu Cầu Nạp Khoai Đã Gửi Đi!
            </Text>
            <Text
              style={[styles.receiptSubtitle, { color: colors.textSecondary }]}
            >
              Giao dịch đã được ghi nhận và gửi đến Ban Quản Trị để đối soát &
              cộng Khoai tự động.
            </Text>

            {receiptData && (
              <View
                style={[
                  styles.receiptDetailsBox,
                  {
                    backgroundColor: colors.chipBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View style={styles.receiptRow}>
                  <Text
                    style={[styles.receiptLabel, { color: colors.textSecondary }]}
                  >
                    Mã giao dịch:
                  </Text>
                  <Text
                    style={[
                      styles.receiptVal,
                      { color: colors.potatoGold, fontWeight: '800' },
                    ]}
                  >
                    {receiptData.transCode}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text
                    style={[styles.receiptLabel, { color: colors.textSecondary }]}
                  >
                    Gói nạp:
                  </Text>
                  <Text
                    style={[styles.receiptVal, { color: colors.textPrimary }]}
                  >
                    {receiptData.packName}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text
                    style={[styles.receiptLabel, { color: colors.textSecondary }]}
                  >
                    Số tiền thanh toán:
                  </Text>
                  <Text
                    style={[
                      styles.receiptVal,
                      { color: colors.wine, fontWeight: '800' },
                    ]}
                  >
                    {formatCurrency(receiptData.price)}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text
                    style={[styles.receiptLabel, { color: colors.textSecondary }]}
                  >
                    Số Khoai nhận được:
                  </Text>
                  <Text
                    style={[
                      styles.receiptVal,
                      { color: colors.emerald, fontWeight: '800' },
                    ]}
                  >
                    +{receiptData.addedKhoai.toLocaleString('vi-VN')} 🥔
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text
                    style={[styles.receiptLabel, { color: colors.textSecondary }]}
                  >
                    Trạng thái:
                  </Text>
                  <View
                    style={[
                      styles.statusPendingPill,
                      { backgroundColor: colors.goldLight },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPendingText,
                        { color: colors.potatoGold },
                      ]}
                    >
                      Đang Chờ Duyệt
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.receiptBtnRow}>
              <TouchableOpacity
                style={[
                  styles.receiptCloseBtn,
                  { borderColor: colors.cardBorder },
                ]}
                onPress={() => setIsSuccessModalOpen(false)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.receiptCloseBtnText,
                    { color: colors.textPrimary },
                  ]}
                >
                  Đóng
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.receiptActionBtn,
                  { backgroundColor: colors.wine },
                ]}
                onPress={() => {
                  setIsSuccessModalOpen(false);
                  navigateTab('bookshelf');
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.receiptActionBtnText,
                    { color: colors.wineBtnText },
                  ]}
                >
                  Xem Tủ Sách
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================
          MODAL TẶNG KHOAI CHO BẠN BÈ (GIỮA MÀN HÌNH GIỐNG WEB CaNhan.jsx)
          ======================================================== */}
      <Modal
        visible={isTransferModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isSubmittingTransfer) setIsTransferModalOpen(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.transferModalCard,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
            ]}
          >
            {/* Modal Header */}
            <View
              style={[
                styles.qrModalHeader,
                {
                  backgroundColor: colors.chipBg,
                  borderBottomColor: colors.cardBorder,
                },
              ]}
            >
              <View
                style={[
                  styles.qrHeaderIcon,
                  { backgroundColor: '#F59E0B' },
                ]}
              >
                <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.qrModalTitle, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  Tặng Khoai Bạn Đọc
                </Text>
                <Text
                  style={[
                    styles.qrModalSubtitle,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={2}
                >
                  Gửi tặng khoai đọc sách tới bạn bè trong cộng đồng HALM
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.qrModalCloseBtn,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
                onPress={() =>
                  !isSubmittingTransfer && setIsTransferModalOpen(false)
                }
                disabled={isSubmittingTransfer}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.transferModalBody}
            >
              {/* Số Dư Hiện Tại */}
              <View
                style={[
                  styles.transferBalanceBanner,
                  {
                    backgroundColor: colors.amberBg,
                    borderColor: colors.amberBorder,
                  },
                ]}
              >
                <View style={styles.transferBalanceLeft}>
                  <Text style={{ fontSize: 18 }}>🥔</Text>
                  <Text
                    style={[
                      styles.transferBalanceLabel,
                      { color: colors.amberText },
                    ]}
                  >
                    Số Dư Hiện Tại Của Bạn:
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transferBalanceVal,
                    { color: colors.amberText },
                  ]}
                >
                  {(walletBalance ?? 0).toLocaleString('vi-VN')} Khoai
                </Text>
              </View>

              {/* Mã Bạn Đọc hoặc Email Người Nhận */}
              <View style={styles.transferFieldGroup}>
                <Text
                  style={[
                    styles.transferFieldLabel,
                    { color: colors.textPrimary },
                  ]}
                >
                  Mã Bạn Đọc hoặc Email Người Nhận{' '}
                  <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.transferInput,
                    {
                      backgroundColor: colors.chipBg,
                      borderColor: colors.cardBorder,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Ví dụ: C00008 hoặc ban@email.com"
                  placeholderTextColor={colors.textSecondary}
                  value={transferReceiver}
                  onChangeText={setTransferReceiver}
                  autoCapitalize="none"
                />
              </View>

              {/* Số Khoai Muốn Tặng */}
              <View style={styles.transferFieldGroup}>
                <Text
                  style={[
                    styles.transferFieldLabel,
                    { color: colors.textPrimary },
                  ]}
                >
                  Số Khoai Muốn Tặng <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <View
                  style={[
                    styles.transferAmountInputWrap,
                    {
                      backgroundColor: colors.chipBg,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.transferAmountInput,
                      { color: colors.textPrimary },
                    ]}
                    keyboardType="numeric"
                    value={transferAmount}
                    onChangeText={setTransferAmount}
                    placeholder="10"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.transferAmountSuffix,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Khoai 🥔
                  </Text>
                </View>

                {/* Quick Chips: +10, +20, +50, +100, Tối Đa */}
                <View style={styles.transferQuickChipsRow}>
                  {[10, 20, 50, 100].map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      style={[
                        styles.transferQuickChip,
                        {
                          backgroundColor: colors.chipBg,
                          borderColor: colors.cardBorder,
                        },
                      ]}
                      onPress={() => setTransferAmount(String(amt))}
                      activeOpacity={0.78}
                    >
                      <Text
                        style={[
                          styles.transferQuickChipText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        +{amt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[
                      styles.transferQuickChip,
                      {
                        backgroundColor: colors.wineLight,
                        borderColor: colors.wine,
                      },
                    ]}
                    onPress={() =>
                      setTransferAmount(String(walletBalance ?? 0))
                    }
                    activeOpacity={0.78}
                  >
                    <Text
                      style={[
                        styles.transferQuickChipText,
                        { color: colors.wine },
                      ]}
                    >
                      Tối Đa
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Lời Nhắn Gửi Tặng */}
              <View style={styles.transferFieldGroup}>
                <Text
                  style={[
                    styles.transferFieldLabel,
                    { color: colors.textPrimary },
                  ]}
                >
                  Lời Nhắn Gửi Tặng
                </Text>
                <TextInput
                  style={[
                    styles.transferTextarea,
                    {
                      backgroundColor: colors.chipBg,
                      borderColor: colors.cardBorder,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Chúc bạn đọc sách vui vẻ!"
                  placeholderTextColor={colors.textSecondary}
                  value={transferNote}
                  onChangeText={setTransferNote}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Nút Hủy & Xác Nhận Tặng */}
              <View style={styles.transferActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.qrCancelBtn,
                    {
                      borderColor: colors.cardBorder,
                      backgroundColor: colors.chipBg,
                    },
                  ]}
                  onPress={() => setIsTransferModalOpen(false)}
                  disabled={isSubmittingTransfer}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.qrCancelBtnText,
                      { color: colors.textPrimary },
                    ]}
                  >
                    Hủy
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.transferSubmitBtn,
                    {
                      backgroundColor: colors.wine,
                      opacity:
                        isSubmittingTransfer ||
                        !transferReceiver.trim() ||
                        Number(transferAmount) <= 0
                          ? 0.55
                          : 1,
                    },
                  ]}
                  onPress={handleTransferSubmit}
                  disabled={
                    isSubmittingTransfer ||
                    !transferReceiver.trim() ||
                    Number(transferAmount) <= 0
                  }
                  activeOpacity={0.85}
                >
                  {isSubmittingTransfer ? (
                    <ActivityIndicator size="small" color={colors.wineBtnText} />
                  ) : (
                    <Ionicons
                      name="paper-plane"
                      size={15}
                      color={colors.wineBtnText}
                    />
                  )}
                  <Text
                    style={[
                      styles.qrConfirmBtnText,
                      { color: colors.wineBtnText },
                    ]}
                  >
                    {isSubmittingTransfer ? 'Đang Xử Lý...' : 'Xác Nhận Tặng'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
  headerCenterWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  headerSloganText: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 20,
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
    top: 94,
    left: 16,
    right: 16,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
    elevation: 6,
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

  floatingExitBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 50,
    left: 16,
    zIndex: 50,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 56 : 94,
    paddingBottom: 110,
  },
  centerSloganWrap: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sloganOverlineText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  centerSloganLine1: {
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 27,
  },
  centerSloganLine2Row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 2,
    marginBottom: 6,
  },
  sloganOrnamentLine: {
    width: 22,
    height: 2,
    borderRadius: 1,
    opacity: 0.55,
  },
  centerSloganLine2: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  centerSloganSub: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 17,
  },
  termsSection: {
    marginTop: 18,
    paddingHorizontal: 4,
    gap: 5,
  },
  termsHeading: {
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  termsItemText: {
    fontSize: 11,
    lineHeight: 16.5,
  },
  fixedFooterBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 10,
  },
  giftBoxBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTopupBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  mainTopupBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // ---- GÓI NẠP KHOAI HÀNG DỌC (ĐỒNG BỘ VỚI MÀN ƯU ĐÃI) ----
  potatoVerticalList: {
    gap: 10,
  },
  potatoVerticalCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  potatoLeftCol: {
    flex: 1,
    paddingRight: 10,
  },
  potatoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  potatoPackageName: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  potatoBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  potatoBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  potatoAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  potatoEmoji: {
    fontSize: 16,
  },
  potatoAmountNum: {
    fontSize: 18,
    fontWeight: '800',
  },
  potatoUnit: {
    fontSize: 12,
    fontWeight: '700',
  },
  potatoBonusTag: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 2,
  },
  potatoRightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  potatoPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  potatoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  potatoBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // ---- MODAL VIETQR (CHUẨN WEB) ----
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  qrModalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  qrModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 11,
  },
  qrHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrModalTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  qrModalSubtitle: {
    fontSize: 11,
    marginTop: 1,
    lineHeight: 15,
  },
  qrModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrModalBody: {
    padding: 16,
    gap: 14,
  },
  selectedPkgBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  selectedPkgName: {
    fontSize: 14,
    fontWeight: '800',
  },
  selectedPkgKhoai: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  selectedPkgPrice: {
    fontSize: 16,
    fontWeight: '900',
  },
  qrImageSection: {
    alignItems: 'center',
  },
  qrWhiteFrame: {
    width: 230,
    height: 230,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E6E1D8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  qrLoadingOverlay: {
    position: 'absolute',
    zIndex: 2,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  qrInstantHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  qrInstantHintText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  bankInfoList: {
    gap: 8,
  },
  bankInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  bankInfoLabel: {
    fontSize: 10.5,
    marginBottom: 2,
  },
  bankInfoVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  bankInfoMonoVal: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  bankInfoPriceVal: {
    fontSize: 15,
    fontWeight: '900',
  },
  mbTagBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  mbTagText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1D4ED8',
  },
  copyPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  copyPillText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  safeStepBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 2,
  },
  safeStepText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
  },
  qrModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  qrCancelBtn: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  qrConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  qrConfirmBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
  },

  // ---- MODAL BIÊN LAI GIAO DỊCH ----
  receiptModalBox: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
  },
  receiptTopCircle: {
    marginBottom: 12,
  },
  receiptIconInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  receiptSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  receiptDetailsBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginBottom: 18,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  receiptLabel: {
    fontSize: 12,
  },
  receiptVal: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  statusPendingPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPendingText: {
    fontSize: 11,
    fontWeight: '800',
  },
  receiptBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  receiptCloseBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptCloseBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  receiptActionBtn: {
    flex: 1.3,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptActionBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
  },

  // ---- MODAL TẶNG KHOAI BẠN ĐỌC (CHUẨN WEB CaNhan.jsx) ----
  transferModalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  transferModalBody: {
    padding: 18,
    gap: 14,
  },
  transferBalanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  transferBalanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transferBalanceLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  transferBalanceVal: {
    fontSize: 13.5,
    fontWeight: '900',
  },
  transferFieldGroup: {
    gap: 6,
  },
  transferFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  transferInput: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
    fontSize: 12.5,
  },
  transferAmountInputWrap: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  transferAmountInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '800',
    paddingVertical: 0,
  },
  transferAmountSuffix: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  transferQuickChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  transferQuickChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  transferQuickChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  transferTextarea: {
    minHeight: 58,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 12.5,
    textAlignVertical: 'top',
  },
  transferActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  transferSubmitBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
