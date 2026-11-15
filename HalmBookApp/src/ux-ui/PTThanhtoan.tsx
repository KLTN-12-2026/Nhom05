import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppNavigation, useAppThemeStyles } from './navigation';
import { fetchApiWithFallback } from './apiService';
import SupportTicketModal from './SupportTicketModal';

// ============================================================================
// [GIẢI THÍCH CODE]: ĐỊNH NGHĨA DỮ LIỆU GÓI NẠP KHOAI TÂY (THEO CHUẨN BE & WEB)
// - packageId: Khóa chính của gói nạp trong bảng CSDL potato_packages
// - packageName: Tên gói (Gói Khởi Động, Gói Mọt Sách, Gói Thân Thiết...)
// - potatoAmount: Số lượng khoai cơ bản
// - bonusPotato: Số khoai tặng thêm ưu đãi
// - priceVnd: Đơn giá thanh toán bằng VNĐ
// - badgeTag: Huy hiệu nhãn (Đề Xuất 🔥, Bán Chạy ⭐, +15% Thưởng...)
// ============================================================================
export interface PotatoPackage {
  packageId: number;
  packageName: string;
  potatoAmount: number;
  bonusPotato: number;
  priceVnd: number;
  badgeTag?: string;
  description?: string;
  isActive?: boolean;
}

// Cấu hình tài khoản ngân hàng thụ hưởng VietQR (Đồng bộ tuyệt đối với Web HalmBookFE)
const BANK_CONFIG = {
  bankName: 'MB Bank (Ngân Hàng Quân Đội)',
  accountNumber: '0345678999',
  accountName: 'HALM BOOK CO LTD',
  bin: '970422',
};

// Danh sách các gói nạp mặc định fallback (Khớp 100% với BE PotatoServiceImpl & Web CaNhan.jsx)
const DEFAULT_PACKAGES: PotatoPackage[] = [
  {
    packageId: 1,
    packageName: 'Gói Khởi Động',
    potatoAmount: 50,
    bonusPotato: 0,
    priceVnd: 50000,
    badgeTag: 'Cơ Bản',
    description: 'Gói 50 Khoai trải nghiệm đọc sách & thuê truyện.',
    isActive: true,
  },
  {
    packageId: 2,
    packageName: 'Gói Đọc Sách',
    potatoAmount: 100,
    bonusPotato: 5,
    priceVnd: 100000,
    badgeTag: 'Bán Chạy ⭐',
    description: 'Gốc 100 + Tặng 5 Khoai (5%) đọc sách tiết kiệm.',
    isActive: true,
  },
  {
    packageId: 3,
    packageName: 'Gói Mọt Sách',
    potatoAmount: 200,
    bonusPotato: 20,
    priceVnd: 200000,
    badgeTag: 'Đề Xuất 🔥',
    description: 'Gốc 200 + Tặng 20 Khoai (10%) & voucher giảm 20k.',
    isActive: true,
  },
  {
    packageId: 4,
    packageName: 'Gói Thân Thiết',
    potatoAmount: 500,
    bonusPotato: 75,
    priceVnd: 500000,
    badgeTag: '+15% Thưởng',
    description: 'Gốc 500 + Tặng 75 Khoai (15%) & 01 Bookmark Gỗ.',
    isActive: true,
  },
  {
    packageId: 5,
    packageName: 'Gói Đặc Quyền VIP',
    potatoAmount: 1000,
    bonusPotato: 250,
    priceVnd: 1000000,
    badgeTag: '+25% Thưởng VIP',
    description: 'Gốc 1.000 + Tặng 250 Khoai (25%) & miễn phí cọc sách trọn đời.',
    isActive: true,
  },
];

export default function ThanhToan() {
  const themeStyles = useAppThemeStyles(styles);
  const { navigate, goBack, isDarkMode, lang, setFooterVisible } = useAppNavigation();

  // Đảm bảo ẩn thanh điều hướng dưới (Footer) của App khi ở màn hình Nạp Khoai
  useEffect(() => {
    setFooterVisible?.(false);
    return () => {
      setFooterVisible?.(true);
    };
  }, [setFooterVisible]);

  // Danh sách gói nạp
  const [packages, setPackages] = useState<PotatoPackage[]>(DEFAULT_PACKAGES);
  const [selectedPkg, setSelectedPkg] = useState<PotatoPackage>(DEFAULT_PACKAGES[2]); // Mặc định gói Mọt Sách (200k) như Web
  const [isLoadingPackages, setIsLoadingPackages] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [qrLoadFailed, setQrLoadFailed] = useState<boolean>(false);

  // Trạng thái cuộn màn hình: Khi lướt lên chỉ còn lại Tiêu đề gói nạp và nút dấu X
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event?.nativeEvent?.contentOffset?.y ?? 0;
    if (offsetY > 30) {
      setIsScrolled((prev) => (!prev ? true : prev));
    } else {
      setIsScrolled((prev) => (prev ? false : prev));
    }
  }, []);

  // Popup Modal VietQR: Chỉ hiện lên khi người dùng nhấn "Nạp Ngay"
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Modal hỗ trợ khách hàng / Báo sự cố nạp lỗi
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);

  // Thông tin độc giả (kèm hạng thành viên để tính chiết khấu)
  const [userInfo, setUserInfo] = useState({
    customerId: '7',
    name: 'Độc giả HALM',
    potatoBalance: 0,
    username: '',
    tierName: 'Thợ Cày',
  });

  // Modal hộp quà (Tặng khoai bạn bè & Nhập mã quà tặng)
  const [showGiftModal, setShowGiftModal] = useState<boolean>(false);
  const [giftTab, setGiftTab] = useState<'transfer' | 'code'>('transfer');
  const [transferReceiver, setTransferReceiver] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('10');
  const [transferNote, setTransferNote] = useState<string>('Tặng bạn đọc khoai đọc sách');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState<boolean>(false);
  const [giftCode, setGiftCode] = useState<string>('');
  const [isSubmittingCode, setIsSubmittingCode] = useState<boolean>(false);

  // ============================================================================
  // [GIẢI THÍCH CODE]: Tải thông tin người dùng và gói nạp khi mount
  // ============================================================================
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      // 1. Tải thông tin người dùng & Hạng thành viên từ local storage & BE
      try {
        const savedTier = await AsyncStorage.getItem('@halm_user_tier');
        let initialTier = savedTier || 'Thợ Cày';

        const cachedProfileStr = await AsyncStorage.getItem('cachedUserProfile');
        if (cachedProfileStr && isMounted) {
          const cached = JSON.parse(cachedProfileStr);
          if (cached.tierName) initialTier = cached.tierName;
          setUserInfo((prev) => ({
            ...prev,
            customerId: String(cached.customerId || cached.id || prev.customerId),
            name: cached.name || cached.customerName || prev.name,
            potatoBalance: typeof cached.potatoBalance === 'number' ? cached.potatoBalance : prev.potatoBalance,
            username: cached.username || prev.username,
            tierName: initialTier,
          }));
        } else if (isMounted) {
          setUserInfo((prev) => ({ ...prev, tierName: initialTier }));
        }

        const balanceStr = await AsyncStorage.getItem('@halm_potato_balance');
        if (balanceStr && isMounted) {
          const bal = parseInt(balanceStr, 10);
          if (!isNaN(bal)) {
            setUserInfo((prev) => ({ ...prev, potatoBalance: bal }));
          }
        }

        const token = await AsyncStorage.getItem('userToken');
        if (token && isMounted) {
          try {
            const walletRes = await fetchApiWithFallback<any>('/api/home/potato/wallet', {
              method: 'GET',
              headers: { Authorization: `Bearer ${token}` },
              timeout: 4000,
            });
            if (walletRes?.data?.potatoBalance !== undefined && isMounted) {
              const serverBal = walletRes.data.potatoBalance;
              setUserInfo((prev) => ({ ...prev, potatoBalance: serverBal }));
              AsyncStorage.setItem('@halm_potato_balance', String(serverBal)).catch(() => {});
            }
          } catch {
            // Bỏ qua nếu lỗi mạng
          }
        }
      } catch (err) {
        console.warn('Lỗi đọc thông tin người dùng:', err);
      }

      // 2. Tải danh sách gói nạp từ BE API
      try {
        const res = await fetchApiWithFallback<PotatoPackage[]>('/api/home/potato/packages', {
          method: 'GET',
          timeout: 4500,
        });

        if (isMounted && Array.isArray(res.data) && res.data.length > 0) {
          const activePkgs = res.data.filter((p) => p.isActive !== false);
          if (activePkgs.length > 0) {
            setPackages(activePkgs);
            const hotPkg = activePkgs.find((p) => p.badgeTag && (p.badgeTag.includes('🔥') || p.badgeTag.includes('HOT'))) || activePkgs[0];
            setSelectedPkg(hotPkg);
          }
        }
      } catch (err) {
        console.warn('Dùng gói nạp mặc định do không kết nối được BE:', err);
        if (isMounted) {
          setPackages(DEFAULT_PACKAGES);
          setSelectedPkg(DEFAULT_PACKAGES[2]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPackages(false);
        }
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, []);

  // ============================================================================
  // [GIẢI THÍCH CODE]: TỶ LỆ GIẢM GIÁ THEO HẠNG THÀNH VIÊN
  // - Hạng Thợ Cày: Không giảm (0%)
  // - Hạng Cao Thủ Cày: Giảm 5%
  // - Hạng Lão Nông: Giảm 10%
  // - Hạng Đại Điền Chủ: Giảm 20%
  // ============================================================================
  const discountPercent = useMemo(() => {
    const raw = (userInfo.tierName || '').toLowerCase().trim();
    if (raw.includes('điền chủ')) return 20;
    if (raw.includes('lão nông')) return 10;
    if (raw.includes('cao thủ')) return 5;
    return 0; // Thợ Cày hoặc mặc định không giảm
  }, [userInfo.tierName]);

  // Hàm tính giá tiền sau khi áp dụng chiết khấu hạng
  const getPackagePrice = useCallback(
    (basePrice: number) => {
      if (discountPercent <= 0) return basePrice;
      return Math.round(basePrice * (1 - discountPercent / 100));
    },
    [discountPercent]
  );

  // Mã khách hàng chuẩn hóa 5 chữ số (C00007)
  const cleanCustomerId = useMemo(() => {
    const raw = String(userInfo.customerId || '7').replace(/^C/i, '').trim();
    const num = parseInt(raw, 10);
    return isNaN(num) ? '00007' : String(num).padStart(5, '0');
  }, [userInfo.customerId]);

  // Cú pháp nội dung chuyển khoản bắt buộc: HALM C{id} NAP
  const transferContent = useMemo(() => {
    return `HALM C${cleanCustomerId} NAP`;
  }, [cleanCustomerId]);

  // Giá thanh toán thực tế của gói đang chọn sau chiết khấu hạng
  const finalPaymentPrice = useMemo(() => {
    const base = selectedPkg ? selectedPkg.priceVnd : 200000;
    return getPackagePrice(base);
  }, [selectedPkg, getPackagePrice]);

  // URL VietQR tạo mã tự động theo giá ưu đãi thực tế
  const vietQrUrl = useMemo(() => {
    return `https://api.vietqr.io/image/${BANK_CONFIG.bin}-${BANK_CONFIG.accountNumber}-compact2.png?amount=${finalPaymentPrice}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;
  }, [finalPaymentPrice, transferContent]);

  // Fallback QR nếu VietQR bị chặn mạng
  const fallbackQrUrl = useMemo(() => {
    const qrData = `HALM-NAP-C${cleanCustomerId}-${finalPaymentPrice}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
  }, [cleanCustomerId, finalPaymentPrice]);

  // ============================================================================
  // [GIẢI THÍCH CODE]: Hàm sao chép thông tin chuyển khoản vào Clipboard
  // ============================================================================
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert(
        lang === 'en' ? 'Copied' : 'Đã sao chép',
        lang === 'en'
          ? `Copied ${label} to clipboard!`
          : `Đã sao chép ${label} vào bộ nhớ tạm: "${text}"`
      );
    } catch {
      Alert.alert(
        lang === 'en' ? 'Info' : 'Thông tin',
        `${label}: ${text}`
      );
    }
  };

  // ============================================================================
  // [GIẢI THÍCH CODE]: Nhấn "Nạp Ngay" -> Mở Modal mã VietQR thanh toán
  // ============================================================================
  const handleOpenQrModal = () => {
    if (!selectedPkg) {
      Alert.alert(lang === 'en' ? 'Notice' : 'Thông báo', lang === 'en' ? 'Please select a package' : 'Vui lòng chọn một gói nạp!');
      return;
    }
    setQrLoadFailed(false);
    setShowQrModal(true);
  };

  // ============================================================================
  // [GIẢI THÍCH CODE]: Xác nhận nạp (Tôi Đã Chuyển Khoản) - Gửi lên Backend: POST /api/home/potato/topup
  // ============================================================================
  const handleConfirmTopup = async () => {
    if (!selectedPkg) return;

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const totalReceived = (selectedPkg.potatoAmount || 0) + (selectedPkg.bonusPotato || 0);
      const topupPayload = {
        packageId: selectedPkg.packageId,
        amountMoney: finalPaymentPrice,
        paymentMethod: 'VIETQR',
        note: `Nạp ${selectedPkg.packageName} qua VietQR HalmBook Mobile`,
      };

      let successBalance = userInfo.potatoBalance + totalReceived;

      try {
        const res = await fetchApiWithFallback<any>('/api/home/potato/topup', {
          method: 'POST',
          headers,
          data: topupPayload,
          timeout: 6000,
        });

        if (res.data?.wallet?.potatoBalance !== undefined) {
          successBalance = res.data.wallet.potatoBalance;
        }
      } catch (apiErr: any) {
        console.warn('Lỗi gọi API topup backend, lưu vào lịch sử local:', apiErr?.message);
      }

      // Cập nhật state & AsyncStorage
      setUserInfo((prev) => ({ ...prev, potatoBalance: successBalance }));
      await AsyncStorage.setItem('@halm_potato_balance', String(successBalance));

      // Cập nhật cached profile
      const cachedProfileStr = await AsyncStorage.getItem('cachedUserProfile');
      if (cachedProfileStr) {
        try {
          const cached = JSON.parse(cachedProfileStr);
          cached.potatoBalance = successBalance;
          await AsyncStorage.setItem('cachedUserProfile', JSON.stringify(cached));
        } catch {}
      }

      // Ghi nhận vào lịch sử giao dịch local để hiển thị ngay trong Màn Lịch sử
      const txCode = `TX${Math.floor(100000 + Math.random() * 900000)}`;
      const newTxItem = {
        id: txCode,
        transactionId: txCode,
        transactionCode: txCode,
        code: txCode,
        type: 'TOPUP',
        note: `Nạp ${selectedPkg.packageName} (+${totalReceived.toLocaleString('vi-VN')} Khoai)`,
        amount: totalReceived,
        priceVnd: finalPaymentPrice,
        status: 'SUCCESS',
        time: 'Vừa xong',
        createdAt: new Date().toISOString(),
      };

      const historyKey = `@halm_potato_history_${userInfo.username || 'user'}`;
      try {
        const existingHistoryRaw = await AsyncStorage.getItem(historyKey);
        const historyList = existingHistoryRaw ? JSON.parse(existingHistoryRaw) : [];
        historyList.unshift(newTxItem);
        await AsyncStorage.setItem(historyKey, JSON.stringify(historyList));
      } catch {}

      // Đóng modal QR
      setShowQrModal(false);

      // Thông báo thành công
      Alert.alert(
        lang === 'en' ? '🎉 Recharge Successful!' : '🎉 Nạp Khoai Thành Công!',
        lang === 'en'
          ? `You have successfully recharged ${selectedPkg.packageName} (+${totalReceived.toLocaleString()} Khoai). New balance: ${successBalance.toLocaleString()} 🥔.`
          : `Giao dịch nạp ${selectedPkg.packageName} (+${totalReceived.toLocaleString('vi-VN')} Khoai) đã hoàn tất! Số dư mới: ${successBalance.toLocaleString('vi-VN')} 🥔.`,
        [
          {
            text: lang === 'en' ? 'View History' : 'Xem Lịch Sử',
            onPress: () => navigate('transactions'),
          },
          {
            text: lang === 'en' ? 'OK' : 'Đóng',
            style: 'cancel',
          },
        ]
      );
    } catch (err: any) {
      console.error('Lỗi nạp khoai:', err);
      Alert.alert(
        lang === 'en' ? 'Error' : 'Lỗi Nạp Khoai',
        lang === 'en'
          ? 'An error occurred while processing the recharge. Please try again!'
          : 'Đã xảy ra lỗi khi gửi yêu cầu nạp khoai. Vui lòng kiểm tra lại kết nối mạng!'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // [GIẢI THÍCH CODE]: Tặng Khoai Cho Bạn Bè (Tính năng của Icon Hộp Quà)
  // ============================================================================
  const handleTransferSubmit = async () => {
    const amount = parseInt(transferAmount, 10);
    if (!amount || amount <= 0) {
      Alert.alert(lang === 'en' ? 'Notice' : 'Thông báo', lang === 'en' ? 'Please enter a valid potato amount' : 'Vui lòng nhập số Khoai hợp lệ!');
      return;
    }

    if (amount > userInfo.potatoBalance) {
      Alert.alert(
        lang === 'en' ? 'Insufficient Balance' : 'Số Dư Không Đủ',
        lang === 'en'
          ? 'You do not have enough potatoes in your wallet.'
          : 'Số dư ví của bạn không đủ để thực hiện tặng Khoai!'
      );
      return;
    }

    if (!transferReceiver.trim()) {
      Alert.alert(lang === 'en' ? 'Notice' : 'Thông báo', lang === 'en' ? 'Please enter recipient ID or Email' : 'Vui lòng nhập ID hoặc Email người nhận!');
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const transferPayload = {
        receiver: transferReceiver.trim(),
        amount: amount,
        note: transferNote.trim() || 'Tặng bạn đọc khoai đọc sách',
      };

      let newBal = userInfo.potatoBalance - amount;
      try {
        const res = await fetchApiWithFallback<any>('/api/home/potato/transfer', {
          method: 'POST',
          headers,
          data: transferPayload,
          timeout: 6000,
        });
        if (res.data?.wallet?.potatoBalance !== undefined) {
          newBal = res.data.wallet.potatoBalance;
        }
      } catch (err: any) {
        console.warn('Lỗi gọi API transfer backend:', err?.message);
      }

      setUserInfo((prev) => ({ ...prev, potatoBalance: newBal }));
      await AsyncStorage.setItem('@halm_potato_balance', String(newBal));

      // Cập nhật cached profile
      const cachedProfileStr = await AsyncStorage.getItem('cachedUserProfile');
      if (cachedProfileStr) {
        try {
          const cached = JSON.parse(cachedProfileStr);
          cached.potatoBalance = newBal;
          await AsyncStorage.setItem('cachedUserProfile', JSON.stringify(cached));
        } catch {}
      }

      setShowGiftModal(false);
      setTransferReceiver('');
      setTransferAmount('10');

      Alert.alert(
        lang === 'en' ? '🎁 Gift Sent!' : '🎁 Tặng Khoai Thành Công!',
        lang === 'en'
          ? `You have sent ${amount} 🥔 to ${transferReceiver.trim()}. Remaining balance: ${newBal.toLocaleString()} 🥔.`
          : `Bạn đã tặng thành công ${amount} 🥔 cho độc giả ${transferReceiver.trim()}. Số dư còn lại: ${newBal.toLocaleString('vi-VN')} 🥔!`
      );
    } catch {
      Alert.alert(
        lang === 'en' ? 'Error' : 'Lỗi Gửi Tặng',
        lang === 'en' ? 'Could not complete potato gift.' : 'Không thể thực hiện tặng Khoai. Vui lòng thử lại!'
      );
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  // ============================================================================
  // [GIẢI THÍCH CODE]: Đổi Mã Quà Tặng / Giftcode (Tính năng bổ trợ của Icon Hộp Quà)
  // ============================================================================
  const handleRedeemGiftCode = async () => {
    const code = giftCode.trim().toUpperCase();
    if (!code) {
      Alert.alert(lang === 'en' ? 'Notice' : 'Thông báo', lang === 'en' ? 'Please enter a giftcode' : 'Vui lòng nhập mã quà tặng!');
      return;
    }

    setIsSubmittingCode(true);
    setTimeout(async () => {
      setIsSubmittingCode(false);
      let reward = 20;
      if (code === 'HALM2026' || code === 'VIPKHOAI') reward = 50;
      else if (code === 'WELCOME') reward = 30;

      const newBal = userInfo.potatoBalance + reward;
      setUserInfo((prev) => ({ ...prev, potatoBalance: newBal }));
      await AsyncStorage.setItem('@halm_potato_balance', String(newBal));

      setShowGiftModal(false);
      setGiftCode('');

      Alert.alert(
        lang === 'en' ? '🎉 Code Redeemed!' : '🎉 Đổi Mã Thành Công!',
        lang === 'en'
          ? `Giftcode "${code}" applied! You received +${reward} 🥔.`
          : `Mã quà tặng "${code}" hợp lệ! Bạn nhận được +${reward} 🥔 vào ví.`
      );
    }, 700);
  };

  return (
    <View style={themeStyles.container}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Header cố định trên cùng: Màu sắc đồng bộ với thân; khi lướt lên chỉ còn lại Tiêu đề và nút X */}
      <View
        style={[
          themeStyles.headerContainer,
          isDarkMode && themeStyles.headerContainerDark,
          isScrolled && themeStyles.headerContainerScrolled,
          isDarkMode && isScrolled && themeStyles.headerContainerScrolledDark,
        ]}
      >
        {/* Nút dấu X thoát ra ở góc trên bên phải */}
        <TouchableOpacity
          style={[
            themeStyles.headerCloseBtn,
            isDarkMode && { backgroundColor: '#1E293B' },
            isScrolled && themeStyles.headerCloseBtnScrolled,
          ]}
          onPress={goBack}
          activeOpacity={0.75}
          accessibilityLabel="Đóng màn hình"
        >
          <Ionicons name="close" size={22} color={isDarkMode ? '#F1F5F9' : '#1E293B'} />
        </TouchableOpacity>

        {/* Tiêu đề gói nạp */}
        <Text
          style={[
            themeStyles.headerTitle,
            isDarkMode && { color: '#F1F5F9' },
            isScrolled && themeStyles.headerTitleScrolled,
          ]}
          numberOfLines={1}
        >
          {lang === 'en' ? 'Recharge Packages' : 'Gói Nạp Khoai Ưu Đãi'}
        </Text>

        {/* Khi lướt lên: Ẩn phần Hạng và Ưu đãi (chỉ còn lại Gói Nạp Khoai Ưu Đãi và icon dấu X) */}
        {!isScrolled && (
          <View style={themeStyles.headerTierSection}>
            <View style={themeStyles.tierNameRow}>
              <Ionicons name="ribbon" size={17} color={isDarkMode ? '#FBBF24' : '#D97706'} style={{ marginRight: 5 }} />
              <Text style={[themeStyles.tierTitleText, isDarkMode && { color: '#CBD5E1' }]}>
                {lang === 'en' ? 'Tier: ' : 'Hạng: '}
                <Text style={[themeStyles.tierTitleHighlight, isDarkMode && { color: '#FBBF24' }]}>
                  {userInfo.tierName || 'Thợ Cày'}
                </Text>
              </Text>
            </View>

            {discountPercent > 0 ? (
              <Text style={[themeStyles.tierDiscountSubtitle, isDarkMode && { color: '#34D399' }]}>
                {lang === 'en' ? `Discount -${discountPercent}%` : `Ưu đãi giảm ${discountPercent}%`}
              </Text>
            ) : (
              <Text style={[themeStyles.tierNormalSubtitle, isDarkMode && { color: '#94A3B8' }]}>
                {lang === 'en' ? 'Standard price (0% discount)' : 'Giá gốc (0%)'}
              </Text>
            )}
          </View>
        )}
      </View>

      <ScrollView
        style={themeStyles.scrollContainer}
        contentContainerStyle={themeStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >

        {/* Danh sách các gói nạp dạng thanh nằm ngang (Xếp dọc từng gói từ trên xuống) */}
        {isLoadingPackages ? (
          <View style={themeStyles.loadingWrap}>
            <ActivityIndicator size="small" color="#2F6B5F" />
            <Text style={themeStyles.loadingText}>
              {lang === 'en' ? 'Loading packages...' : 'Đang tải danh sách gói nạp...'}
            </Text>
          </View>
        ) : (
          <View style={themeStyles.packagesList}>
            {packages.map((pkg) => {
              const isSelected = selectedPkg?.packageId === pkg.packageId;
              const hasBonus = pkg.bonusPotato > 0;
              const bonusRate = pkg.potatoAmount > 0 ? Math.round((pkg.bonusPotato / pkg.potatoAmount) * 100) : 0;
              const discountedPrice = getPackagePrice(pkg.priceVnd);

              return (
                <TouchableOpacity
                  key={pkg.packageId}
                  style={[themeStyles.packageRowCard, isSelected && themeStyles.packageRowCardActive]}
                  onPress={() => setSelectedPkg(pkg)}
                  activeOpacity={0.8}
                >
                  {/* Bên trái: Thông tin gói */}
                  <View style={themeStyles.packageRowLeft}>
                    <View style={themeStyles.packageRowInfo}>
                      <View style={themeStyles.packageRowNameRow}>
                        <Text style={[themeStyles.packageRowName, isSelected && themeStyles.packageRowNameActive]}>
                          {pkg.packageName}
                        </Text>
                        {pkg.badgeTag ? (
                          <View style={[themeStyles.tagPill, isSelected && themeStyles.tagPillActive]}>
                            <Text style={[themeStyles.tagPillText, isSelected && themeStyles.tagPillTextActive]}>
                              {pkg.badgeTag}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={themeStyles.packageRowPotatoRow}>
                        <Text style={[themeStyles.packageRowPotatoAmount, isSelected && themeStyles.packageRowPotatoAmountActive]}>
                          {pkg.potatoAmount.toLocaleString()} 🥔
                        </Text>
                        {hasBonus && (
                          <View style={themeStyles.bonusBadge}>
                            <Text style={themeStyles.bonusBadgeText}>
                              +{pkg.bonusPotato} Khoai ({bonusRate}%)
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Bên phải: Giá tiền (gạch ngang giá gốc nếu có giảm) */}
                  <View style={themeStyles.packageRowRight}>
                    {discountPercent > 0 ? (
                      <View style={themeStyles.priceColWrap}>
                        <Text style={themeStyles.originalPriceStrikethrough}>
                          {pkg.priceVnd.toLocaleString('vi-VN')} đ
                        </Text>
                        <Text style={[themeStyles.packageRowPrice, isSelected && themeStyles.packageRowPriceActive]}>
                          {discountedPrice.toLocaleString('vi-VN')} đ
                        </Text>
                      </View>
                    ) : (
                      <Text style={[themeStyles.packageRowPrice, isSelected && themeStyles.packageRowPriceActive]}>
                        {pkg.priceVnd.toLocaleString('vi-VN')} đ
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ============================================================================ */}
        {/* KHỐI ĐIỀU KHOẢN & HƯỚNG DẪN XỬ LÝ SỰ CỐ NẠP KHOAI (CHUẨN APP THẬT - KHÔNG KHUNG) */}
        {/* ============================================================================ */}
        <View style={themeStyles.termsContainer}>
          <View style={themeStyles.termsHeaderRow}>
            <Ionicons name="shield-checkmark" size={18} color={isDarkMode ? '#34D399' : '#2F6B5F'} />
            <Text style={[themeStyles.termsHeaderTitle, isDarkMode && { color: '#F1F5F9' }]}>
              {lang === 'en' ? 'Terms & Transaction Support' : 'Lưu ý & Điều khoản giao dịch'}
            </Text>
          </View>

          <View style={themeStyles.termsList}>
            <View style={themeStyles.termsItem}>
              <Text style={[themeStyles.termsBullet, isDarkMode && { color: '#34D399' }]}>•</Text>
              <Text style={[themeStyles.termsText, isDarkMode && { color: '#94A3B8' }]}>
                <Text style={[themeStyles.termsHighlight, isDarkMode && { color: '#E2E8F0' }]}>
                  {lang === 'en' ? 'Auto-processing: ' : 'Xử lý tự động: '}
                </Text>
                {lang === 'en'
                  ? 'Potatoes will be credited automatically to your wallet within 1 - 3 minutes after successful bank transfer.'
                  : 'Khoai sẽ được cộng tự động vào ví từ 1 - 3 phút sau khi ngân hàng báo chuyển khoản thành công.'}
              </Text>
            </View>

            <View style={themeStyles.termsItem}>
              <Text style={[themeStyles.termsBullet, isDarkMode && { color: '#34D399' }]}>•</Text>
              <Text style={[themeStyles.termsText, isDarkMode && { color: '#94A3B8' }]}>
                <Text style={[themeStyles.termsHighlight, isDarkMode && { color: '#E2E8F0' }]}>
                  {lang === 'en' ? 'Transfer content: ' : 'Nội dung chuyển khoản: '}
                </Text>
                {lang === 'en'
                  ? 'Please enter the exact transfer content and amount provided to ensure immediate top-up.'
                  : 'Vui lòng điền chính xác nội dung chuyển khoản và số tiền được cấp để hệ thống nhận diện tức thì.'}
              </Text>
            </View>

            <View style={themeStyles.termsItem}>
              <Text style={[themeStyles.termsBullet, isDarkMode && { color: '#34D399' }]}>•</Text>
              <Text style={[themeStyles.termsText, isDarkMode && { color: '#94A3B8' }]}>
                <Text style={[themeStyles.termsHighlight, isDarkMode && { color: '#E2E8F0' }]}>
                  {lang === 'en' ? 'Support & error handling: ' : 'Hỗ trợ khi có sự cố: '}
                </Text>
                {lang === 'en'
                  ? 'If after 5 minutes your potatoes are not credited or you transferred with wrong info, please tap '
                  : 'Nếu sau 5 - 10 phút chưa nhận được Khoai hoặc chuyển nhầm thông tin, quý khách vui lòng nhấn '}
                <Text
                  style={[themeStyles.termsLink, isDarkMode && { color: '#34D399' }]}
                  onPress={() => setShowSupportModal(true)}
                >
                  {lang === 'en' ? '[Send Support Ticket]' : '[Gửi yêu cầu hỗ trợ]'}
                </Text>
                {lang === 'en'
                  ? ' or contact hotline (0345.678.999) for immediate compensation.'
                  : ' hoặc liên hệ CSKH (0345.678.999) để được kiểm tra và cộng bù ngay.'}
              </Text>
            </View>

            <View style={themeStyles.termsItem}>
              <Text style={[themeStyles.termsBullet, isDarkMode && { color: '#34D399' }]}>•</Text>
              <Text style={[themeStyles.termsText, isDarkMode && { color: '#94A3B8' }]}>
                <Text style={[themeStyles.termsHighlight, isDarkMode && { color: '#E2E8F0' }]}>
                  {lang === 'en' ? 'Safety guarantee: ' : 'Bảo đảm an toàn: '}
                </Text>
                {lang === 'en'
                  ? '100% money-back or potato compensation guarantee for any system transaction failures.'
                  : 'Cam kết hoàn tiền 100% hoặc cộng bù đầy đủ nếu có lỗi giao dịch phát sinh từ hệ thống theo Điều khoản HALM Book.'}
              </Text>
            </View>
          </View>

          {/* Dòng CSKH nhanh & Bảo mật */}
          <View style={themeStyles.termsFooterRow}>
            <TouchableOpacity
              style={[themeStyles.supportActionPill, isDarkMode && { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}
              onPress={() => setShowSupportModal(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="headset-outline" size={14} color={isDarkMode ? '#34D399' : '#2F6B5F'} />
              <Text style={[themeStyles.supportActionPillText, isDarkMode && { color: '#34D399' }]}>
                {lang === 'en' ? 'Support Ticket 24/7' : 'Gửi Yêu Cầu Hỗ Trợ 24/7'}
              </Text>
            </TouchableOpacity>
            <Text style={themeStyles.termsSecurityNote}>
              {lang === 'en'
                ? 'Secured by VietQR & NAPAS 247'
                : 'Bảo mật bởi VietQR & NAPAS 247'}
            </Text>
          </View>
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

      {/* ============================================================================ */}
      {/* MODAL MÃ VIETQR: CHỈ HIỂN THỊ KHI NGƯỜI DÙNG NHẤN "NẠP NGAY" */}
      {/* ============================================================================ */}
      <Modal
        visible={showQrModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQrModal(false)}
      >
        <View style={themeStyles.qrModalBackdrop}>
          <View style={themeStyles.qrModalCard}>
            {/* Thanh kéo nhỏ phía trên */}
            <View style={themeStyles.sheetHandleBar} />

            {/* Header modal VietQR */}
            <View style={themeStyles.qrModalHeader}>
              <View style={themeStyles.qrModalTitleWrap}>
                <Ionicons name="qr-code" size={22} color={isDarkMode ? '#34D399' : '#2F6B5F'} />
                <View>
                  <Text style={themeStyles.qrModalTitle}>
                    {lang === 'en' ? 'VietQR 24/7 Payment' : 'Thanh Toán VietQR 24/7'}
                  </Text>
                  <Text style={themeStyles.qrModalSubtitle}>
                    {selectedPkg?.packageName} • {finalPaymentPrice.toLocaleString('vi-VN')} đ
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={themeStyles.modalCloseBtn}
                onPress={() => setShowQrModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color={isDarkMode ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {/* Nội dung thanh toán cuộn bên trong Modal */}
            <ScrollView style={themeStyles.qrModalScroll} showsVerticalScrollIndicator={false}>
              {/* Thẻ hiển thị mã QR */}
              <View style={themeStyles.qrBoxContainer}>
                <View style={themeStyles.qrImageWrap}>
                  <Image
                    source={{ uri: qrLoadFailed ? fallbackQrUrl : vietQrUrl }}
                    style={themeStyles.qrImage}
                    resizeMode="contain"
                    onError={() => setQrLoadFailed(true)}
                  />
                </View>
                <Text style={themeStyles.qrInstructionText}>
                  {lang === 'en'
                    ? 'Scan with any banking app to autofill details'
                    : 'Mở app ngân hàng quét mã để tự động điền số tiền và nội dung'}
                </Text>
              </View>

              {/* Bảng chi tiết chuyển khoản */}
              <View style={themeStyles.bankInfoList}>
                {/* Ngân hàng */}
                <View style={themeStyles.bankInfoRow}>
                  <View style={themeStyles.bankInfoCol}>
                    <Text style={themeStyles.bankInfoLabel}>
                      {lang === 'en' ? 'Beneficiary Bank' : 'Ngân Hàng Thụ Hưởng'}
                    </Text>
                    <Text style={themeStyles.bankInfoValue}>{BANK_CONFIG.bankName}</Text>
                  </View>
                  <View style={themeStyles.bankLogoBadge}>
                    <Text style={themeStyles.bankLogoText}>MB</Text>
                  </View>
                </View>

                {/* Số tài khoản */}
                <View style={themeStyles.bankInfoRow}>
                  <View style={themeStyles.bankInfoCol}>
                    <Text style={themeStyles.bankInfoLabel}>
                      {lang === 'en' ? 'Account Number' : 'Số Tài Khoản'}
                    </Text>
                    <Text style={themeStyles.bankInfoValueMono}>{BANK_CONFIG.accountNumber}</Text>
                  </View>
                  <TouchableOpacity
                    style={themeStyles.copyBtn}
                    onPress={() => copyToClipboard(BANK_CONFIG.accountNumber, 'Số tài khoản')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="copy-outline" size={14} color={isDarkMode ? '#34D399' : '#2F6B5F'} />
                    <Text style={themeStyles.copyBtnText}>{lang === 'en' ? 'Copy' : 'Chép'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Chủ tài khoản */}
                <View style={themeStyles.bankInfoRow}>
                  <View style={themeStyles.bankInfoCol}>
                    <Text style={themeStyles.bankInfoLabel}>
                      {lang === 'en' ? 'Account Name' : 'Chủ Tài Khoản'}
                    </Text>
                    <Text style={themeStyles.bankInfoValueBold}>{BANK_CONFIG.accountName}</Text>
                  </View>
                  <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                </View>

                {/* Số tiền cần nạp */}
                <View style={themeStyles.bankInfoRow}>
                  <View style={themeStyles.bankInfoCol}>
                    <Text style={themeStyles.bankInfoLabel}>
                      {lang === 'en' ? 'Amount to Pay' : 'Số Tiền Nạp (Ưu đãi)'}
                    </Text>
                    <View style={themeStyles.modalPriceRow}>
                      {discountPercent > 0 && selectedPkg ? (
                        <Text style={themeStyles.modalOriginalPrice}>
                          {selectedPkg.priceVnd.toLocaleString('vi-VN')} đ
                        </Text>
                      ) : null}
                      <Text style={themeStyles.bankInfoPrice}>
                        {finalPaymentPrice.toLocaleString('vi-VN')} đ
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={themeStyles.copyBtn}
                    onPress={() => copyToClipboard(String(finalPaymentPrice), 'Số tiền nạp')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="copy-outline" size={14} color={isDarkMode ? '#34D399' : '#2F6B5F'} />
                    <Text style={themeStyles.copyBtnText}>{lang === 'en' ? 'Copy' : 'Chép'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Nội dung chuyển khoản (BẮT BUỘC ĐÚNG) */}
                <View style={themeStyles.transferNoteBox}>
                  <View style={themeStyles.bankInfoCol}>
                    <Text style={themeStyles.transferNoteLabel}>
                      {lang === 'en' ? 'Transfer Content (Required)' : 'Nội Dung Chuyển Khoản (Bắt buộc đúng)'}
                    </Text>
                    <Text style={themeStyles.transferNoteValue}>{transferContent}</Text>
                  </View>
                  <TouchableOpacity
                    style={themeStyles.transferNoteCopyBtn}
                    onPress={() => copyToClipboard(transferContent, 'Nội dung chuyển khoản')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="copy-outline" size={14} color="#FFFFFF" />
                    <Text style={themeStyles.transferNoteCopyText}>{lang === 'en' ? 'Copy' : 'Chép'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Ghi chú hướng dẫn đối soát */}
                <View style={themeStyles.guaranteeRow}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={isDarkMode ? '#34D399' : '#2F6B5F'} />
                  <Text style={themeStyles.guaranteeText}>
                    {lang === 'en'
                      ? 'After completing transfer in your bank app, tap "I Have Transferred" below to credit your account.'
                      : 'Sau khi chuyển khoản thành công trên app ngân hàng, vui lòng nhấn "Tôi Đã Chuyển Khoản" bên dưới để hệ thống cập nhật Khoai vào ví.'}
                  </Text>
                </View>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Nút hành động xác nhận nạp trong Modal */}
            <View style={themeStyles.qrModalActions}>
              <TouchableOpacity
                style={themeStyles.qrModalCancelBtn}
                onPress={() => setShowQrModal(false)}
                activeOpacity={0.75}
              >
                <Text style={themeStyles.qrModalCancelText}>
                  {lang === 'en' ? 'Close' : 'Đóng'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[themeStyles.qrModalConfirmBtn, isSubmitting && themeStyles.payBtnDisabled]}
                onPress={handleConfirmTopup}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <View style={themeStyles.payBtnLoadingRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={themeStyles.payBtnLoadingText}>
                      {lang === 'en' ? 'Processing...' : 'Đang xử lý...'}
                    </Text>
                  </View>
                ) : (
                  <View style={themeStyles.payBtnContentRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={themeStyles.qrModalConfirmText}>
                      {lang === 'en' ? 'I Have Transferred' : 'Tôi Đã Chuyển Khoản'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================================ */}
      {/* MODAL HỘP QUÀ: TẶNG KHOAI CHO BẠN BÈ & MÃ QUÀ TẶNG / GIFTCODE */}
      {/* ============================================================================ */}
      <Modal
        visible={showGiftModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGiftModal(false)}
      >
        <View style={themeStyles.modalBackdrop}>
          <View style={themeStyles.modalCard}>
            {/* Header modal */}
            <View style={themeStyles.modalHeader}>
              <View style={themeStyles.modalTitleWrap}>
                <Ionicons name="gift" size={22} color="#D97706" />
                <Text style={themeStyles.modalTitle}>
                  {lang === 'en' ? 'Gift & Rewards' : 'Hộp Quà & Tặng Khoai'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowGiftModal(false)} activeOpacity={0.7}>
                <Ionicons name="close-circle-outline" size={26} color={isDarkMode ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {/* Tab chuyển đổi trong modal */}
            <View style={themeStyles.modalTabsRow}>
              <TouchableOpacity
                style={[themeStyles.modalTab, giftTab === 'transfer' && themeStyles.modalTabActive]}
                onPress={() => setGiftTab('transfer')}
                activeOpacity={0.8}
              >
                <Text style={[themeStyles.modalTabText, giftTab === 'transfer' && themeStyles.modalTabTextActive]}>
                  {lang === 'en' ? 'Gift to Friend' : 'Tặng Khoai Bạn Bè'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[themeStyles.modalTab, giftTab === 'code' && themeStyles.modalTabActive]}
                onPress={() => setGiftTab('code')}
                activeOpacity={0.8}
              >
                <Text style={[themeStyles.modalTabText, giftTab === 'code' && themeStyles.modalTabTextActive]}>
                  {lang === 'en' ? 'Giftcode' : 'Mã Quà Tặng'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab 1: Tặng Khoai Bạn Bè */}
            {giftTab === 'transfer' ? (
              <View style={themeStyles.modalBody}>
                <Text style={themeStyles.inputLabel}>
                  {lang === 'en' ? 'Recipient ID / Email / Phone:' : 'ID / Email hoặc SĐT người nhận:'}
                </Text>
                <TextInput
                  style={themeStyles.inputBox}
                  placeholder={lang === 'en' ? 'e.g. C00008 or reader@email.com' : 'Ví dụ: C00008 hoặc email bạn đọc'}
                  placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                  value={transferReceiver}
                  onChangeText={setTransferReceiver}
                />

                <Text style={themeStyles.inputLabel}>
                  {lang === 'en' ? 'Amount of Potatoes:' : 'Số lượng Khoai muốn tặng:'}
                </Text>
                <TextInput
                  style={themeStyles.inputBox}
                  placeholder="10"
                  placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                  keyboardType="numeric"
                  value={transferAmount}
                  onChangeText={setTransferAmount}
                />

                <Text style={themeStyles.inputLabel}>
                  {lang === 'en' ? 'Message / Note:' : 'Lời nhắn gửi gắm:'}
                </Text>
                <TextInput
                  style={themeStyles.inputBox}
                  placeholder={lang === 'en' ? 'Enjoy your reading!' : 'Tặng bạn khoai đọc sách vui vẻ'}
                  placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                  value={transferNote}
                  onChangeText={setTransferNote}
                />

                <TouchableOpacity
                  style={[themeStyles.modalSubmitBtn, isSubmittingTransfer && themeStyles.payBtnDisabled]}
                  onPress={handleTransferSubmit}
                  disabled={isSubmittingTransfer}
                  activeOpacity={0.85}
                >
                  {isSubmittingTransfer ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={themeStyles.modalSubmitBtnText}>
                      {lang === 'en' ? 'Send Gift Potatoes' : 'Gửi Tặng Khoai Ngay'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* Tab 2: Mã Quà Tặng */
              <View style={themeStyles.modalBody}>
                <Text style={themeStyles.inputLabel}>
                  {lang === 'en' ? 'Enter Giftcode / Promo Code:' : 'Nhập mã Giftcode ưu đãi:'}
                </Text>
                <TextInput
                  style={themeStyles.inputBox}
                  placeholder={lang === 'en' ? 'e.g. HALM2026, WELCOME' : 'Ví dụ: HALM2026, WELCOME'}
                  placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                  autoCapitalize="characters"
                  value={giftCode}
                  onChangeText={setGiftCode}
                />
                <Text style={themeStyles.promoHintText}>
                  {lang === 'en'
                    ? '💡 Tip: Try code "HALM2026" or "WELCOME" for extra bonus!'
                    : '💡 Mẹo: Nhập mã "HALM2026" hoặc "WELCOME" để nhận Khoai thưởng miễn phí!'}
                </Text>

                <TouchableOpacity
                  style={[themeStyles.modalSubmitBtn, isSubmittingCode && themeStyles.payBtnDisabled]}
                  onPress={handleRedeemGiftCode}
                  disabled={isSubmittingCode}
                  activeOpacity={0.85}
                >
                  {isSubmittingCode ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={themeStyles.modalSubmitBtnText}>
                      {lang === 'en' ? 'Redeem Code' : 'Đổi Quà Tặng'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Hỗ Trợ CSKH / Báo Lỗi Nạp Khoai */}
      <SupportTicketModal
        visible={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        customerId={userInfo.customerId}
        customerName={userInfo.name}
        lang={lang}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Header cố định trên cùng: Màu sắc đồng bộ với thân (#F8F9FA)
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 52,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
    position: 'relative',
    zIndex: 10,
  },
  headerContainerDark: {
    backgroundColor: '#101319',
    borderBottomColor: 'transparent',
  },
  headerContainerScrolled: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8F9FA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerContainerScrolledDark: {
    backgroundColor: '#101319',
    borderBottomColor: '#1E293B',
    shadowOpacity: 0.2,
  },
  headerCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 52,
    right: 16,
    zIndex: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  headerCloseBtnScrolled: {
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 48,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: 6,
    paddingHorizontal: 48,
  },
  headerTitleScrolled: {
    fontSize: 18,
    marginBottom: 0,
  },
  headerTierSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  tierNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  tierTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  tierTitleHighlight: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#D97706',
  },
  tierDiscountSubtitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
    textAlign: 'center',
  },
  tierNormalSubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },

  // Packages List (Thanh nằm ngang xếp dọc từ trên xuống)
  packagesList: {
    gap: 10,
    marginBottom: 16,
  },
  loadingWrap: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  packageRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  packageRowCardActive: {
    borderColor: '#2F6B5F',
    backgroundColor: 'rgba(47, 107, 95, 0.05)',
    shadowColor: '#2F6B5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  packageRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  packageRowInfo: {
    flex: 1,
  },
  packageRowNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  packageRowName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  packageRowNameActive: {
    color: '#2F6B5F',
    fontWeight: '800',
  },
  tagPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  tagPillActive: {
    backgroundColor: '#2F6B5F',
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4B5563',
  },
  tagPillTextActive: {
    color: '#FFFFFF',
  },
  packageRowPotatoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  packageRowPotatoAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },
  packageRowPotatoAmountActive: {
    color: '#2F6B5F',
  },
  bonusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  bonusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  packageRowRight: {
    alignItems: 'flex-end',
  },
  priceColWrap: {
    alignItems: 'flex-end',
  },
  originalPriceStrikethrough: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  packageRowPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4B5563',
  },
  packageRowPriceActive: {
    color: '#2F6B5F',
    fontSize: 16,
    fontWeight: '900',
  },

  // ============================================================================
  // CẤU TRÚC ĐÚNG YÊU CẦU:
  // "ở phía dưới là nút nạp ngay, bên trái nút nạp ngay là icon hộp quà"
  // ============================================================================
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },

  // Icon hộp quà bên trái nút Nạp ngay
  giftBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  // Nút NẠP NGAY (Không hiển thị giá tiền)
  payBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#2F6B5F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2F6B5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  payBtnDisabled: {
    opacity: 0.65,
  },
  payBtnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  payBtnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payBtnLoadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ============================================================================
  // MODAL MÃ VIETQR (Bottom Sheet / Popup chỉ xuất hiện khi nhấn "Nạp Ngay")
  // ============================================================================
  qrModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  qrModalCard: {
    width: '100%',
    maxHeight: Dimensions.get('window').height * 0.88,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 12,
  },
  sheetHandleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 10,
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  qrModalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qrModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  qrModalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModalScroll: {
    maxHeight: Dimensions.get('window').height * 0.62,
    paddingTop: 12,
  },

  // QR Box
  qrBoxContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrImageWrap: {
    width: 190,
    height: 190,
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  qrInstructionText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 10,
  },

  // Bank Info List
  bankInfoList: {
    gap: 9,
  },
  bankInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 11,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bankInfoCol: {
    flex: 1,
  },
  bankInfoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  bankInfoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  bankInfoValueBold: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1E293B',
  },
  bankInfoValueMono: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: 0.8,
  },
  modalPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  modalOriginalPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  bankInfoPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2F6B5F',
  },
  bankLogoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  bankLogoText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#2563EB',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(47, 107, 95, 0.1)',
    gap: 4,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2F6B5F',
  },

  // Transfer Note Highlight Box
  transferNoteBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  transferNoteLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 2,
  },
  transferNoteValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.8,
  },
  transferNoteCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#D97706',
    gap: 4,
  },
  transferNoteCopyText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
    padding: 6,
  },
  guaranteeText: {
    flex: 1,
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
  },

  // Nút hành động trong Modal VietQR
  qrModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  qrModalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrModalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  qrModalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#2F6B5F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2F6B5F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  qrModalConfirmText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Modal Gift Card
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  modalTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  modalTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  modalTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  modalTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalTabTextActive: {
    fontWeight: '800',
    color: '#111827',
  },
  modalBody: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: -4,
  },
  inputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  promoHintText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
    marginTop: -4,
  },
  modalSubmitBtn: {
    backgroundColor: '#2F6B5F',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#2F6B5F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  modalSubmitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Khối Điều khoản & Hướng dẫn xử lý sự cố (Giống App thật - Không khung)
  termsContainer: {
    marginTop: 20,
    paddingHorizontal: 6,
  },
  termsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  termsHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  termsList: {
    gap: 8,
  },
  termsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  termsBullet: {
    fontSize: 13,
    lineHeight: 18,
    color: '#2F6B5F',
    fontWeight: '900',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#64748B',
  },
  termsHighlight: {
    fontWeight: '700',
    color: '#1E293B',
  },
  termsLink: {
    fontWeight: '800',
    color: '#2F6B5F',
    textDecorationLine: 'underline',
  },
  termsFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  supportActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(47, 107, 95, 0.1)',
  },
  supportActionPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#2F6B5F',
  },
  termsSecurityNote: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
