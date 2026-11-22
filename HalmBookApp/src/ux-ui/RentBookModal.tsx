import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BookOpen, Check, ChevronDown, Clock, Infinity as InfinityIcon, RefreshCw } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchApiWithFallback } from './apiService';
import { getBookCoverSource } from './bookCovers';
import {
  CommercePolicy,
  fetchCommercePolicy,
  RentalPlan,
  rentalPlanPrice,
} from './commercePolicy';
import {
  CheckoutLineItem,
  checkoutBooksApi,
  fetchBookDetailFromApi,
  fetchWalletBalanceApi,
  resolveCoverUrlWithBase,
} from './rentalService';

export interface RentCurrentBookInput {
  bookId: string;
  title: string;
  author: string;
  coverUrl?: string | null;
  rentPrice?: number | null;
}

export interface RentSuccessPayload {
  rentedCurrentBook: boolean;
  rentedCount: number;
  totalKhoaiPaid?: number;
  remainingPotatoBalance?: number;
  message: string;
}

export interface RentBookModalProps {
  visible: boolean;
  isDarkMode: boolean;
  currentBook: RentCurrentBookInput;
  onClose: () => void;
  onRentSuccess: (result: RentSuccessPayload) => Promise<void> | void;
  onRequireLogin: (message: string) => void;
  onTopUpKhoai: () => void;
}

interface RentSelectableItem {
  key: string;
  bookId: string;
  title: string;
  author: string;
  coverUrl?: string | null;
  rentPrice: number | null;
  cartItemId: number | null;
  offerId: string | null;
  offerName: string | null;
  fixedOfferPrice: number | null;
  planKey: string;
  durationDays: number;
  selected: boolean;
  isCurrentBook: boolean;
  inCart: boolean;
}

const normalizePlanKey = (rawKey?: string | null, rawDays?: number | null): string => {
  const cleaned = String(rawKey || '').trim().toLowerCase();
  if (cleaned === 'forever' || rawDays === 36500) return 'forever';
  if (['1', '3', '7', '14', '15', '30', '90'].includes(cleaned)) return cleaned;
  if (typeof rawDays === 'number' && [1, 3, 7, 14, 15, 30, 90].includes(rawDays)) {
    return String(rawDays);
  }
  return '7';
};

const formatPlanLabel = (plan: RentalPlan): string => {
  if (plan.key === 'forever' || plan.durationDays >= 36500) {
    return 'Thuê vĩnh viễn';
  }
  return plan.label || `${plan.durationDays} ngày`;
};

const formatLockedDurationLabel = (planKey: string, durationDays: number, plans: RentalPlan[]): string => {
  const matched = plans.find((p) => p.key === planKey);
  if (matched) return formatPlanLabel(matched);
  if (planKey === 'forever' || durationDays >= 36500) return 'Thuê vĩnh viễn';
  return `${durationDays} ngày`;
};

export default function RentBookModal({
  visible,
  isDarkMode,
  currentBook,
  onClose,
  onRentSuccess,
  onRequireLogin,
  onTopUpKhoai,
}: RentBookModalProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const styles = useMemo(() => createStyles(isDarkMode), [isDarkMode]);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [policy, setPolicy] = useState<CommercePolicy | null>(null);
  const [items, setItems] = useState<RentSelectableItem[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [tierDiscountPercent, setTierDiscountPercent] = useState(0);
  const [tierName, setTierName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  // Dropdown states for Duration and Voucher/Offer
  const [openDurationDropdownKey, setOpenDurationDropdownKey] = useState<string | null>(null);
  const [openVoucherDropdownKey, setOpenVoucherDropdownKey] = useState<string | null>(null);
  const [voucherType, setVoucherType] = useState<'tier' | 'custom' | 'none'>('tier');
  const [customVoucherCode, setCustomVoucherCode] = useState('');
  const [voucherInputText, setVoucherInputText] = useState('');

  const submitGuardRef = useRef(false);

  const activePlans = useMemo(() => {
    if (!policy) return [];
    return policy.plans
      .filter((p) => p.active)
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [policy]);

  const loadModalData = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setLoadError(null);
      setSubmitError(null);

      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          if (!signal.aborted) {
            onClose();
            onRequireLogin('Vui lòng đăng nhập để thuê sách bằng Khoai.');
          }
          return;
        }

        const authHeaders = { Authorization: `Bearer ${token}` };

        // 1. Bắt buộc lấy biểu giá chính thức từ Backend (không tự suy đoán giá)
        const loadedPolicy = await fetchCommercePolicy(signal);
        if (signal.aborted) return;

        const enabledPlans = loadedPolicy.plans
          .filter((p) => p.active)
          .slice()
          .sort((a, b) => a.orderIndex - b.orderIndex);

        if (enabledPlans.length === 0) {
          setPolicy(loadedPolicy);
          setLoadError('Hiện chưa có gói thuê sách nào đang mở trên hệ thống.');
          return;
        }

        const fallbackPlan = enabledPlans.find((p) => p.key === '7') || enabledPlans[0];

        // 2. Nạp song song: giỏ hàng hiện tại, thông tin sách gốc (nếu thiếu rent_price), hạng & số dư Khoai
        const [cartResult, bookDetailResult, tierResult] = await Promise.allSettled([
          fetchApiWithFallback<any[]>('/api/cart', {
            method: 'GET',
            headers: authHeaders,
            timeout: 6000,
            signal,
          }).catch(() =>
            fetchApiWithFallback<any[]>('/api/home/cart/items', {
              method: 'GET',
              headers: authHeaders,
              timeout: 6000,
              signal,
            })
          ),
          typeof currentBook.rentPrice === 'number' && currentBook.rentPrice > 0
            ? Promise.resolve(null)
            : fetchBookDetailFromApi(currentBook.bookId),
          fetchApiWithFallback<any>('/api/home/membership/my-tier', {
            method: 'GET',
            headers: authHeaders,
            timeout: 5000,
            signal,
          }),
        ]);

        if (signal.aborted) return;

        // Cập nhật số dư ví & % giảm giá hạng thành viên từ Backend
        let resolvedBalance: number | null = null;
        let resolvedDiscount = 0;
        let resolvedTierName: string | null = null;

        if (tierResult.status === 'fulfilled' && tierResult.value?.data) {
          const tierData = tierResult.value.data;
          if (typeof tierData.potatoBalance === 'number') {
            resolvedBalance = tierData.potatoBalance;
          }
          if (typeof tierData.discountPercent === 'number' && tierData.discountPercent > 0) {
            resolvedDiscount = Math.min(100, Math.max(0, tierData.discountPercent));
          }
          if (tierData.currentTier?.tierName) {
            resolvedTierName = String(tierData.currentTier.tierName);
          }
        }

        if (resolvedBalance === null) {
          resolvedBalance = await fetchWalletBalanceApi();
          if (signal.aborted) return;
        }

        const rawDetail = bookDetailResult.status === 'fulfilled' ? bookDetailResult.value : null;
        const resolvedCurrentRentPrice =
          typeof currentBook.rentPrice === 'number' && currentBook.rentPrice > 0
            ? currentBook.rentPrice
            : typeof rawDetail?.rent_price === 'number' && rawDetail.rent_price > 0
            ? rawDetail.rent_price
            : null;

        const cartBaseUrl =
          cartResult.status === 'fulfilled' ? cartResult.value?.baseUrl : undefined;
        const rawCartItems =
          cartResult.status === 'fulfilled' && Array.isArray(cartResult.value?.data)
            ? cartResult.value.data
            : [];

        const currentBookIdUpper = currentBook.bookId.trim().toUpperCase();
        const currentTitleLower = currentBook.title.trim().toLowerCase();

        // Kiểm tra xem cuốn sách đang mở có nằm sẵn trong giỏ hay không (tránh trùng lặp)
        const matchingCartRow = rawCartItems.find((row: any) => {
          const rowBookId = String(row.bookId || row.book_id || '').trim().toUpperCase();
          const rowTitle = String(row.title || row.bookName || '').trim().toLowerCase();
          return (
            (rowBookId && rowBookId === currentBookIdUpper) ||
            (rowTitle && rowTitle === currentTitleLower)
          );
        });

        const resolveValidPlan = (rawKey?: string | null, rawDays?: number | null, hasOffer?: boolean) => {
          const normalized = normalizePlanKey(rawKey, rawDays);
          if (hasOffer) {
            const matchedAny = loadedPolicy.plans.find((p) => p.key === normalized);
            return {
              planKey: normalized,
              durationDays: matchedAny?.durationDays ?? (normalized === 'forever' ? 36500 : Number(normalized) || 7),
            };
          }
          const matchedActive = enabledPlans.find((p) => p.key === normalized) || fallbackPlan;
          return {
            planKey: matchedActive.key,
            durationDays: matchedActive.durationDays,
          };
        };

        const currentHasOffer = Boolean(matchingCartRow?.offerId);
        const currentPlan = matchingCartRow
          ? resolveValidPlan(matchingCartRow.planKey, matchingCartRow.rentalDays, currentHasOffer)
          : { planKey: fallbackPlan.key, durationDays: fallbackPlan.durationDays };

        const currentOfferId = matchingCartRow?.offerId ? String(matchingCartRow.offerId) : null;

        const currentEntry: RentSelectableItem = {
          key: `current-${currentBook.bookId}`,
          bookId: currentBook.bookId,
          title: currentBook.title,
          author: currentBook.author || 'Tác giả HALM BOOK',
          coverUrl:
            currentBook.coverUrl ||
            (matchingCartRow
              ? resolveCoverUrlWithBase(
                  matchingCartRow.coverUrl || matchingCartRow.imgUrl,
                  currentBook.bookId,
                  cartBaseUrl
                )
              : null),
          rentPrice:
            resolvedCurrentRentPrice ??
            (typeof matchingCartRow?.rentPrice === 'number' && matchingCartRow.rentPrice > 0
              ? matchingCartRow.rentPrice
              : null),
          cartItemId: matchingCartRow ? Number(matchingCartRow.cartItemId ?? matchingCartRow.id) || null : null,
          offerId: currentOfferId,
          offerName: matchingCartRow?.offerName ? String(matchingCartRow.offerName) : null,
          fixedOfferPrice:
            currentHasOffer && typeof matchingCartRow?.priceKhoai === 'number'
              ? Math.round(matchingCartRow.priceKhoai)
              : null,
          planKey: currentPlan.planKey,
          durationDays: currentPlan.durationDays,
          selected: true, // Cuốn đang mở luôn được chọn mặc định
          isCurrentBook: true,
          inCart: Boolean(matchingCartRow),
        };

        // Các sách khác đã có trong giỏ hàng
        const otherCartEntries: RentSelectableItem[] = [];
        const seenBookIds = new Set<string>([currentBookIdUpper]);

        for (const row of rawCartItems) {
          const rowBookId = String(row.bookId || row.book_id || '').trim();
          const rowBookIdUpper = rowBookId.toUpperCase();
          if (!rowBookId || seenBookIds.has(rowBookIdUpper)) continue;
          if (matchingCartRow && Number(row.cartItemId ?? row.id) === Number(matchingCartRow.cartItemId ?? matchingCartRow.id)) {
            continue;
          }
          seenBookIds.add(rowBookIdUpper);

          const rowOfferId = row.offerId ? String(row.offerId) : null;
          const rowHasOffer = Boolean(rowOfferId);
          const rowPlan = resolveValidPlan(row.planKey, row.rentalDays, rowHasOffer);
          const rowCartItemId = Number(row.cartItemId ?? row.id) || null;

          // Nếu sách giỏ hàng cùng combo với sách đang mở, tự chọn kèm để combo hợp lệ
          const autoSelectedWithCombo = Boolean(currentOfferId && rowOfferId && currentOfferId === rowOfferId);

          otherCartEntries.push({
            key: `cart-${rowCartItemId ?? rowBookId}`,
            bookId: rowBookId,
            title: String(row.title || row.bookName || 'Tác phẩm HALM BOOK'),
            author: String(row.author || 'Tác giả HALM BOOK'),
            coverUrl: resolveCoverUrlWithBase(row.coverUrl || row.imgUrl, rowBookId, cartBaseUrl),
            rentPrice: typeof row.rentPrice === 'number' && row.rentPrice > 0 ? row.rentPrice : null,
            cartItemId: rowCartItemId,
            offerId: rowOfferId,
            offerName: row.offerName ? String(row.offerName) : null,
            fixedOfferPrice:
              rowHasOffer && typeof row.priceKhoai === 'number'
                ? Math.round(row.priceKhoai)
                : null,
            planKey: rowPlan.planKey,
            durationDays: rowPlan.durationDays,
            selected: autoSelectedWithCombo,
            isCurrentBook: false,
            inCart: true,
          });
        }

        setPolicy(loadedPolicy);
        setItems([currentEntry, ...otherCartEntries]);
        setWalletBalance(resolvedBalance);
        setTierDiscountPercent(resolvedDiscount);
        setTierName(resolvedTierName);
      } catch (err: any) {
        if (signal.aborted) return;
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Không thể tải biểu giá và thông tin giỏ hàng từ máy chủ. Vui lòng thử lại.';
        setLoadError(message);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [currentBook.author, currentBook.bookId, currentBook.coverUrl, currentBook.rentPrice, currentBook.title, onClose, onRequireLogin]
  );

  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    void loadModalData(controller.signal);
    return () => {
      controller.abort();
    };
  }, [visible, reloadTick, loadModalData]);

  const getItemPriceKhoai = useCallback(
    (item: RentSelectableItem): number | null => {
      if (item.offerId && typeof item.fixedOfferPrice === 'number') {
        return item.fixedOfferPrice;
      }
      if (!policy) return null;
      const matchedPlan = policy.plans.find((p) => p.key === item.planKey && p.active);
      if (!matchedPlan) return null;
      return rentalPlanPrice(matchedPlan, item.rentPrice);
    },
    [policy]
  );

  const toggleItemSelection = (targetKey: string) => {
    if (submitting) return;
    setSubmitError(null);
    setItems((prev) => {
      const target = prev.find((it) => it.key === targetKey);
      if (!target) return prev;
      const nextSelected = !target.selected;
      if (target.offerId) {
        return prev.map((it) =>
          it.offerId === target.offerId ? { ...it, selected: nextSelected } : it
        );
      }
      return prev.map((it) =>
        it.key === targetKey ? { ...it, selected: nextSelected } : it
      );
    });
  };

  const selectItemPlan = (targetKey: string, plan: RentalPlan) => {
    if (submitting) return;
    setSubmitError(null);
    setItems((prev) =>
      prev.map((it) =>
        it.key === targetKey && !it.offerId
          ? { ...it, planKey: plan.key, durationDays: plan.durationDays }
          : it
      )
    );
  };

  const selectedItems = useMemo(() => items.filter((it) => it.selected), [items]);
  const selectedCount = selectedItems.length;

  const displayTierName = tierName || 'Đại Điền Chủ';
  const displayTierDiscount = tierDiscountPercent > 0 ? tierDiscountPercent : 15;
  const activeDiscountPercent =
    voucherType === 'tier'
      ? displayTierDiscount
      : voucherType === 'custom' && customVoucherCode
      ? 20
      : 0;

  const { subtotalKhoai, totalKhoai, savingsKhoai, allPricesValid } = useMemo(() => {
    if (!policy || selectedItems.length === 0) {
      return { subtotalKhoai: 0, totalKhoai: 0, savingsKhoai: 0, allPricesValid: Boolean(policy) };
    }
    let sub = 0;
    let netSum = 0;
    let valid = true;

    for (const item of selectedItems) {
      const price = getItemPriceKhoai(item);
      if (price === null) {
        valid = false;
        continue;
      }
      sub += price;
      const reduction = (price * activeDiscountPercent) / 100;
      netSum += price - reduction;
    }

    const finalTotal = Math.max(0, Math.round(netSum));
    const savings = Math.max(0, sub - finalTotal);
    return {
      subtotalKhoai: sub,
      totalKhoai: finalTotal,
      savingsKhoai: savings,
      allPricesValid: valid,
    };
  }, [policy, selectedItems, getItemPriceKhoai, activeDiscountPercent]);

  const insufficientBalance =
    walletBalance !== null && selectedCount > 0 && allPricesValid && totalKhoai > walletBalance;

  const canConfirm =
    !loading &&
    !loadError &&
    !submitting &&
    Boolean(policy) &&
    selectedCount > 0 &&
    allPricesValid;

  const handleConfirmRent = async () => {
    if (!canConfirm || submitGuardRef.current || !policy) return;

    const checkoutLines: CheckoutLineItem[] = [];
    for (const item of selectedItems) {
      const price = getItemPriceKhoai(item);
      if (price === null) {
        setSubmitError(`Gói thuê của "${item.title}" hiện không còn khả dụng. Vui lòng chọn lại kỳ hạn.`);
        return;
      }
      checkoutLines.push({
        bookId: item.bookId,
        cartItemId: item.cartItemId,
        planKey: item.planKey,
        durationDays: item.durationDays,
        offerId: item.offerId,
        price,
      });
    }

    submitGuardRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await checkoutBooksApi(checkoutLines, undefined, {
        policyRevision: policy.revision,
        couponCode: voucherType === 'custom' ? customVoucherCode.trim() : '',
      });

      if (!result.success) {
        if (result.requireLogin) {
          onClose();
          onRequireLogin(result.message);
          return;
        }
        setSubmitError(result.message);
        if (result.statusCode === 409) {
          setReloadTick((v) => v + 1);
        }
        return;
      }

      if (typeof result.remainingPotatoBalance === 'number') {
        setWalletBalance(result.remainingPotatoBalance);
      }

      const rentedCurrentBook = selectedItems.some((it) => it.isCurrentBook);
      await onRentSuccess({
        rentedCurrentBook,
        rentedCount: selectedItems.length,
        totalKhoaiPaid: result.totalKhoaiPaid ?? totalKhoai,
        remainingPotatoBalance: result.remainingPotatoBalance,
        message: result.message,
      });
    } catch (err: any) {
      setSubmitError(err?.message || 'Đã xảy ra sự cố khi xác nhận thuê sách. Vui lòng thử lại.');
    } finally {
      submitGuardRef.current = false;
      setSubmitting(false);
    }
  };

  const currentBookItems = useMemo(() => items.filter((it) => it.isCurrentBook), [items]);
  const cartBookItems = useMemo(() => items.filter((it) => !it.isCurrentBook), [items]);

  const renderBookItem = (item: RentSelectableItem) => {
    const coverSource = getBookCoverSource(item.bookId, item.coverUrl || undefined);
    const itemPrice = getItemPriceKhoai(item);
    const activePlanObj = policy?.plans.find((p) => p.key === item.planKey);
    const currentDurationLabel = activePlanObj
      ? formatPlanLabel(activePlanObj)
      : formatLockedDurationLabel(item.planKey, item.durationDays, policy?.plans || []);

    return (
      <View
        key={item.key}
        style={[
          styles.bookRowCard,
          item.selected ? styles.bookRowCardSelected : styles.bookRowCardUnselected,
        ]}
      >
        {/* Hàng chính: Checkbox + Ảnh bìa + Tên/Tác giả + Giá */}
        <TouchableOpacity
          style={styles.bookRowMain}
          activeOpacity={0.78}
          disabled={submitting}
          onPress={() => toggleItemSelection(item.key)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.selected, disabled: submitting }}
          accessibilityLabel={`${item.selected ? 'Bỏ chọn' : 'Chọn'} sách ${item.title}`}
        >
          <View style={[styles.checkbox, item.selected && styles.checkboxChecked]}>
            {item.selected && (
              <Check size={13} color={isDarkMode ? '#111210' : '#ffffff'} strokeWidth={3} />
            )}
          </View>

          <View style={styles.coverThumb}>
            {coverSource ? (
              <Image source={coverSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <View style={styles.coverFallback}>
                <BookOpen size={16} color="#ffffff" />
              </View>
            )}
          </View>

          <View style={styles.bookMeta}>
            <View style={styles.bookTitleLine}>
              <Text
                style={[styles.bookTitle, !item.selected && styles.bookTitleMuted]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
            </View>
            <Text style={styles.bookAuthor} numberOfLines={1}>
              {item.author}
            </Text>

            <View style={styles.bookSubtitleRow}>
              <Text style={styles.bookContextText} numberOfLines={1}>
                {item.isCurrentBook
                  ? item.inCart
                    ? 'Sách đang xem · Có trong giỏ'
                    : 'Sách đang xem'
                  : item.offerName
                  ? `Ưu đãi: ${item.offerName}`
                  : 'Trong giỏ hàng'}
              </Text>
            </View>
          </View>

          <View style={styles.priceCol}>
            <Text style={[styles.itemPriceText, !item.selected && styles.itemPriceMuted]}>
              {itemPrice !== null ? `${itemPrice}` : '--'}
            </Text>
            <Text style={styles.itemPriceUnit}>Khoai</Text>
          </View>
        </TouchableOpacity>

        {/* Khu vực chọn thời hạn thuê (Dropdown bên trái) & Ưu đãi / Voucher (Dropdown bên phải) */}
        {item.selected && (
          <View style={styles.bookControlsContainer}>
            <View style={styles.bookControlsRow}>
              {/* Dropdown bên trái: Thời gian thuê */}
              <View style={styles.bookControlCol}>
                <Text style={styles.controlLabel}>Thời gian thuê</Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    openDurationDropdownKey === item.key && styles.dropdownTriggerActive,
                    Boolean(item.offerId) && styles.dropdownTriggerDisabled,
                  ]}
                  activeOpacity={0.8}
                  disabled={submitting || Boolean(item.offerId)}
                  onPress={() => {
                    setOpenVoucherDropdownKey(null);
                    setOpenDurationDropdownKey((prev) => (prev === item.key ? null : item.key));
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Chọn thời gian thuê, hiện tại là ${currentDurationLabel}`}
                >
                  <View style={styles.dropdownTriggerContent}>
                    {item.planKey === 'forever' ? (
                      <InfinityIcon size={13} color={isDarkMode ? '#F3DA7A' : '#387367'} />
                    ) : (
                      <Clock size={13} color={isDarkMode ? '#F3DA7A' : '#387367'} />
                    )}
                    <Text style={styles.dropdownTriggerText} numberOfLines={1}>
                      {currentDurationLabel}
                    </Text>
                  </View>
                  {!item.offerId && (
                    <ChevronDown
                      size={14}
                      color={isDarkMode ? '#A39F99' : '#64748B'}
                      style={{
                        transform: [{ rotate: openDurationDropdownKey === item.key ? '180deg' : '0deg' }],
                      }}
                    />
                  )}
                </TouchableOpacity>
              </View>

              {/* Dropdown bên phải: Ưu đãi & Nhập Voucher */}
              <View style={styles.bookControlCol}>
                <Text style={styles.controlLabel}>Ưu đãi / Voucher</Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    openVoucherDropdownKey === item.key && styles.dropdownTriggerActive,
                  ]}
                  activeOpacity={0.8}
                  disabled={submitting}
                  onPress={() => {
                    setOpenDurationDropdownKey(null);
                    setOpenVoucherDropdownKey((prev) => (prev === item.key ? null : item.key));
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Chọn ưu đãi hoặc nhập voucher"
                >
                  <View style={styles.dropdownTriggerContent}>
                    <Ionicons
                      name={voucherType === 'tier' ? 'ribbon' : voucherType === 'custom' ? 'pricetag' : 'ticket-outline'}
                      size={13}
                      color={isDarkMode ? '#F3DA7A' : '#387367'}
                    />
                    <Text style={styles.dropdownTriggerText} numberOfLines={1}>
                      {voucherType === 'tier'
                        ? `${displayTierName}`
                        : voucherType === 'custom'
                        ? customVoucherCode || 'Voucher'
                        : 'Không ưu đãi'}
                    </Text>
                  </View>
                  <ChevronDown
                    size={14}
                    color={isDarkMode ? '#A39F99' : '#64748B'}
                    style={{
                      transform: [{ rotate: openVoucherDropdownKey === item.key ? '180deg' : '0deg' }],
                    }}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Menu Dropdown Thời hạn thuê */}
            {openDurationDropdownKey === item.key && !item.offerId && (
              <View style={styles.dropdownMenuCard}>
                {activePlans.map((plan) => {
                  const isPlanSelected = item.planKey === plan.key;
                  const planCost = rentalPlanPrice(plan, item.rentPrice);
                  return (
                    <TouchableOpacity
                      key={plan.key}
                      style={[
                        styles.dropdownMenuItem,
                        isPlanSelected && styles.dropdownMenuItemActive,
                      ]}
                      onPress={() => {
                        selectItemPlan(item.key, plan);
                        setOpenDurationDropdownKey(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.dropdownMenuItemLeft}>
                        <View style={[styles.radioCircle, isPlanSelected && styles.radioCircleActive]}>
                          {isPlanSelected && <View style={styles.radioDot} />}
                        </View>
                        <Text
                          style={[
                            styles.dropdownMenuItemTitle,
                            isPlanSelected && styles.dropdownMenuItemTitleActive,
                          ]}
                        >
                          {formatPlanLabel(plan)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.dropdownMenuItemPrice,
                          isPlanSelected && styles.dropdownMenuItemPriceActive,
                        ]}
                      >
                        {planCost} Khoai
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Menu Dropdown Ưu đãi / Voucher */}
            {openVoucherDropdownKey === item.key && (
              <View style={styles.dropdownMenuCard}>
                {/* 1. Ưu đãi Đại Điền Chủ (mặc định chọn sẵn) */}
                <TouchableOpacity
                  style={[
                    styles.dropdownMenuItem,
                    voucherType === 'tier' && styles.dropdownMenuItemActive,
                  ]}
                  onPress={() => {
                    setVoucherType('tier');
                    setOpenVoucherDropdownKey(null);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.dropdownMenuItemLeft}>
                    <View style={[styles.radioCircle, voucherType === 'tier' && styles.radioCircleActive]}>
                      {voucherType === 'tier' && <View style={styles.radioDot} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.dropdownMenuItemTitle,
                          voucherType === 'tier' && styles.dropdownMenuItemTitleActive,
                        ]}
                      >
                        👑 Ưu đãi {displayTierName}
                      </Text>
                      <Text style={styles.dropdownMenuItemSub}>
                        Đặc quyền thành viên (Giảm {displayTierDiscount}%)
                      </Text>
                    </View>
                  </View>
                  <View style={styles.badgeDiscount}>
                    <Text style={styles.badgeDiscountText}>-{displayTierDiscount}%</Text>
                  </View>
                </TouchableOpacity>

                {/* 2. Nhập mã voucher */}
                <View style={styles.voucherInputWrapper}>
                  <Text style={styles.voucherInputSectionTitle}>Nhập mã voucher khác:</Text>
                  <View style={styles.voucherInputRow}>
                    <TextInput
                      style={styles.voucherTextInput}
                      placeholder="Mã voucher (VD: HALM20)"
                      placeholderTextColor={isDarkMode ? '#8A8780' : '#94A3B8'}
                      value={voucherInputText}
                      onChangeText={setVoucherInputText}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={[
                        styles.voucherApplyBtn,
                        !voucherInputText.trim() && styles.voucherApplyBtnDisabled,
                      ]}
                      disabled={!voucherInputText.trim()}
                      onPress={() => {
                        if (voucherInputText.trim()) {
                          setCustomVoucherCode(voucherInputText.trim().toUpperCase());
                          setVoucherType('custom');
                          setOpenVoucherDropdownKey(null);
                        }
                      }}
                    >
                      <Text style={styles.voucherApplyBtnText}>Áp dụng</Text>
                    </TouchableOpacity>
                  </View>
                  {voucherType === 'custom' && customVoucherCode && (
                    <View style={styles.activeCustomVoucherRow}>
                      <Text style={styles.activeCustomVoucherText}>
                        Đang áp dụng: <Text style={{ fontWeight: '700' }}>{customVoucherCode}</Text>
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setVoucherType('tier');
                          setCustomVoucherCode('');
                          setVoucherInputText('');
                        }}
                      >
                        <Text style={styles.voucherRemoveText}>Gỡ bỏ</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const handleRequestClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  const maxSheetHeight = Math.min(Math.max(420, windowHeight * 0.84), 680);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleRequestClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleRequestClose}
          accessibilityRole="button"
          accessibilityLabel="Đóng cửa sổ thuê sách"
        />

        <View style={[styles.sheet, { maxHeight: maxSheetHeight }]}>
          {/* Thanh nắm đầu sheet */}
          <View style={styles.handleBar} />

          {/* Header cố định: Tiêu đề bên trái, Số dư ví góc phải, bỏ dấu X */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Thuê sách</Text>
            {walletBalance !== null && (
              <View style={styles.headerWalletBadge}>
                <Text style={styles.walletHeaderLabel}>Số dư ví:</Text>
                <Text style={styles.walletHeaderValue}>{walletBalance} Khoai 🥔</Text>
              </View>
            )}
          </View>

          {/* Phần thân cuộn được */}
          {loading ? (
            <View style={styles.centerStateBox}>
              <ActivityIndicator size="large" color={isDarkMode ? '#D4AF37' : '#387367'} />
              <Text style={styles.centerStateText}>Đang tải biểu giá và danh sách giỏ hàng...</Text>
            </View>
          ) : loadError ? (
            <View style={styles.centerStateBox}>
              <Ionicons
                name="cloud-offline-outline"
                size={34}
                color={isDarkMode ? '#F87171' : '#DC2626'}
              />
              <Text style={styles.errorStateTitle}>Chưa tải được dữ liệu thuê sách</Text>
              <Text style={styles.centerStateText}>{loadError}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => setReloadTick((v) => v + 1)}
                activeOpacity={0.8}
              >
                <RefreshCw size={15} color={isDarkMode ? '#111210' : '#ffffff'} />
                <Text style={styles.retryBtnText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={styles.listScroll}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
              {/* Khu vực 1: Sách đang mở Chi tiết sách */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeading}>Sách đang xem</Text>
                {currentBookItems.map(renderBookItem)}
              </View>

              {/* Khu vực 2: Sách đã có trong giỏ hàng trước đó */}
              {cartBookItems.length > 0 && (
                <View style={styles.sectionBlock}>
                  <View style={styles.sectionHeaderInline}>
                    <Text style={styles.sectionHeading}>
                      Sách trong giỏ hàng ({cartBookItems.length})
                    </Text>
                    <Text style={styles.sectionHint}>Tích chọn để thuê cùng</Text>
                  </View>
                  {cartBookItems.map(renderBookItem)}
                </View>
              )}
            </ScrollView>
          )}

          {/* Thông báo lỗi thanh toán (nếu có) */}
          {submitError && (
            <View style={styles.submitErrorBar}>
              <Text style={styles.submitErrorText}>{submitError}</Text>
              {submitError.toLowerCase().includes('khoai') && (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onTopUpKhoai();
                  }}
                  style={styles.topUpInlineBtn}
                >
                  <Text style={styles.topUpInlineText}>Nạp Khoai</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Thanh tổng kết cố định phía dưới + Safe Area iPhone */}
          <View style={[styles.footerBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryCount}>
                Đã chọn <Text style={styles.summaryCountStrong}>{selectedCount}</Text> cuốn
              </Text>
              <View style={styles.summaryPriceRow}>
                <Text style={styles.summaryTotal}>
                  {policy && allPricesValid ? `${totalKhoai} Khoai 🥔` : '-- Khoai'}
                </Text>
                {savingsKhoai > 0 && (
                  <Text style={styles.summarySubtotalStrike}>{subtotalKhoai} Khoai</Text>
                )}
              </View>
              {savingsKhoai > 0 && (
                <Text style={styles.savingsMutedText} numberOfLines={1}>
                  Bạn vừa tiết kiệm được {savingsKhoai} khoai 🎉
                </Text>
              )}
              {insufficientBalance && (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onTopUpKhoai();
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.insufficientText} numberOfLines={1}>
                    Số dư chưa đủ · Nạp thêm Khoai ›
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
              onPress={handleConfirmRent}
              disabled={!canConfirm}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Thuê ngay ${selectedCount} cuốn sách`}
            >
              {submitting ? (
                <View style={styles.confirmLoadingRow}>
                  <ActivityIndicator
                    size="small"
                    color={isDarkMode ? '#111210' : '#ffffff'}
                  />
                  <Text style={styles.confirmBtnText}>Đang xử lý...</Text>
                </View>
              ) : (
                <Text style={styles.confirmBtnText}>Thuê ngay</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(isDarkMode: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.62)',
      justifyContent: 'flex-end',
    },
    sheet: {
      width: '100%',
      backgroundColor: isDarkMode ? '#181A20' : '#ffffff',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: isDarkMode ? '#2B303B' : '#E5E7EB',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: isDarkMode ? 0.45 : 0.16,
      shadowRadius: 18,
      elevation: 16,
    },
    handleBar: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDarkMode ? '#3A404D' : '#CBD5E1',
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 4,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#262A34' : '#F1F5F9',
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: isDarkMode ? '#FAF7F0' : '#0F172A',
    },
    headerWalletBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.12)' : 'rgba(56, 115, 103, 0.08)',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.25)' : 'rgba(56, 115, 103, 0.18)',
    },
    walletHeaderLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: isDarkMode ? '#C8C3B8' : '#64748B',
    },
    walletHeaderValue: {
      fontSize: 13,
      fontWeight: '800',
      color: isDarkMode ? '#F3DA7A' : '#9A5A16',
    },

    centerStateBox: {
      paddingHorizontal: 24,
      paddingVertical: 42,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    errorStateTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: isDarkMode ? '#FAF7F0' : '#0F172A',
      textAlign: 'center',
    },
    centerStateText: {
      fontSize: 13.5,
      lineHeight: 19,
      color: isDarkMode ? '#A39F99' : '#64748B',
      textAlign: 'center',
    },
    retryBtn: {
      marginTop: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: isDarkMode ? '#D4AF37' : '#387367',
    },
    retryBtnText: {
      fontSize: 13.5,
      fontWeight: '800',
      color: isDarkMode ? '#111210' : '#ffffff',
    },

    listScroll: {
      flexShrink: 1,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 20,
      gap: 16,
    },
    sectionBlock: {
      gap: 10,
    },
    sectionHeaderInline: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    sectionHeading: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.2,
      color: isDarkMode ? '#C8C3B8' : '#475569',
      textTransform: 'uppercase',
    },
    sectionHint: {
      fontSize: 12,
      color: isDarkMode ? '#8A8780' : '#94A3B8',
    },

    bookRowCard: {
      borderRadius: 14,
      borderWidth: 1,
      overflow: 'hidden',
    },
    bookRowCardSelected: {
      backgroundColor: isDarkMode ? '#20242E' : '#F8FCFB',
      borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.55)' : '#387367',
    },
    bookRowCardUnselected: {
      backgroundColor: isDarkMode ? '#1A1D24' : '#F8FAFC',
      borderColor: isDarkMode ? '#282D38' : '#E2E8F0',
      opacity: 0.82,
    },
    bookRowMain: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      gap: 10,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#525866' : '#CBD5E1',
      backgroundColor: isDarkMode ? '#16181E' : '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: isDarkMode ? '#D4AF37' : '#387367',
      borderColor: isDarkMode ? '#D4AF37' : '#387367',
    },
    coverThumb: {
      width: 44,
      height: 62,
      borderRadius: 7,
      overflow: 'hidden',
      backgroundColor: '#3b7a6d',
    },
    coverFallback: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#3b7a6d',
    },
    bookMeta: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    bookTitleLine: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bookTitle: {
      fontSize: 14.5,
      fontWeight: '700',
      lineHeight: 19,
      color: isDarkMode ? '#FAF7F0' : '#0F172A',
    },
    bookTitleMuted: {
      color: isDarkMode ? '#C8C3B8' : '#334155',
    },
    bookAuthor: {
      fontSize: 12.5,
      color: isDarkMode ? '#A39F99' : '#64748B',
    },
    bookSubtitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    bookContextText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: isDarkMode ? '#D4AF37' : '#387367',
    },
    priceCol: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingLeft: 4,
    },
    itemPriceText: {
      fontSize: 16,
      fontWeight: '800',
      color: isDarkMode ? '#F3DA7A' : '#9A5A16',
    },
    itemPriceMuted: {
      color: isDarkMode ? '#8A8780' : '#94A3B8',
    },
    itemPriceUnit: {
      fontSize: 11,
      fontWeight: '600',
      color: isDarkMode ? '#A39F99' : '#64748B',
    },

    bookControlsContainer: {
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#E6EFEA',
    },
    bookControlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 12,
    },
    bookControlCol: {
      flex: 1,
      minWidth: 0,
      gap: 5,
    },
    controlLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: isDarkMode ? '#A39F99' : '#64748B',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    dropdownTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 10,
      paddingVertical: 9,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDarkMode ? '#333946' : '#CBD5E1',
      backgroundColor: isDarkMode ? '#171A21' : '#FFFFFF',
      gap: 6,
    },
    dropdownTriggerActive: {
      borderColor: isDarkMode ? '#D4AF37' : '#387367',
      backgroundColor: isDarkMode ? '#222631' : '#F4F9F7',
    },
    dropdownTriggerDisabled: {
      opacity: 0.6,
    },
    dropdownTriggerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
      minWidth: 0,
    },
    dropdownTriggerText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDarkMode ? '#EDE9DF' : '#1E293B',
      flex: 1,
    },
    dropdownMenuCard: {
      marginHorizontal: 12,
      marginBottom: 12,
      padding: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#333946' : '#E2E8F0',
      backgroundColor: isDarkMode ? '#171A21' : '#FFFFFF',
      gap: 6,
    },
    dropdownMenuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 8,
    },
    dropdownMenuItemActive: {
      backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.14)' : 'rgba(56, 115, 103, 0.1)',
    },
    dropdownMenuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      minWidth: 0,
    },
    radioCircle: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#64748B' : '#94A3B8',
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioCircleActive: {
      borderColor: isDarkMode ? '#D4AF37' : '#387367',
    },
    radioDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: isDarkMode ? '#D4AF37' : '#387367',
    },
    dropdownMenuItemTitle: {
      fontSize: 12.5,
      fontWeight: '600',
      color: isDarkMode ? '#C8C3B8' : '#334155',
    },
    dropdownMenuItemTitleActive: {
      fontWeight: '800',
      color: isDarkMode ? '#FAF7F0' : '#0F172A',
    },
    dropdownMenuItemSub: {
      fontSize: 10.5,
      color: isDarkMode ? '#8A8780' : '#64748B',
      marginTop: 1,
    },
    dropdownMenuItemPrice: {
      fontSize: 12,
      fontWeight: '700',
      color: isDarkMode ? '#A39F99' : '#64748B',
    },
    dropdownMenuItemPriceActive: {
      color: isDarkMode ? '#F3DA7A' : '#9A5A16',
    },
    badgeDiscount: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: isDarkMode ? 'rgba(52, 211, 153, 0.18)' : '#DCFCE7',
    },
    badgeDiscountText: {
      fontSize: 11,
      fontWeight: '800',
      color: isDarkMode ? '#34D399' : '#15803D',
    },
    voucherInputWrapper: {
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#282D38' : '#F1F5F9',
      paddingTop: 8,
      gap: 6,
    },
    voucherInputSectionTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: isDarkMode ? '#A39F99' : '#64748B',
      marginBottom: 2,
    },
    voucherInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    voucherTextInput: {
      flex: 1,
      height: 36,
      paddingHorizontal: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? '#333946' : '#CBD5E1',
      backgroundColor: isDarkMode ? '#12141A' : '#F8FAFC',
      fontSize: 12,
      color: isDarkMode ? '#FAF7F0' : '#0F172A',
    },
    voucherApplyBtn: {
      height: 36,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#D4AF37' : '#387367',
      alignItems: 'center',
      justifyContent: 'center',
    },
    voucherApplyBtnDisabled: {
      opacity: 0.5,
    },
    voucherApplyBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: isDarkMode ? '#111210' : '#ffffff',
    },
    activeCustomVoucherRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      paddingTop: 2,
    },
    activeCustomVoucherText: {
      fontSize: 11,
      color: isDarkMode ? '#34D399' : '#059669',
    },
    voucherRemoveText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDarkMode ? '#F87171' : '#DC2626',
    },

    submitErrorBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: isDarkMode ? 'rgba(185, 28, 28, 0.2)' : '#FEF2F2',
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? 'rgba(248, 113, 113, 0.35)' : '#FECACA',
    },
    submitErrorText: {
      flex: 1,
      fontSize: 12.5,
      lineHeight: 17,
      fontWeight: '600',
      color: isDarkMode ? '#FCA5A5' : '#B91C1C',
    },
    topUpInlineBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#D4AF37' : '#387367',
    },
    topUpInlineText: {
      fontSize: 12,
      fontWeight: '800',
      color: isDarkMode ? '#111210' : '#ffffff',
    },

    footerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: isDarkMode ? '#1D2028' : '#ffffff',
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#2B303B' : '#E2E8F0',
    },
    summaryLeft: {
      flex: 1,
      minWidth: 0,
    },
    summaryCount: {
      fontSize: 12.5,
      color: isDarkMode ? '#A39F99' : '#64748B',
    },
    summaryCountStrong: {
      fontWeight: '800',
      color: isDarkMode ? '#FAF7F0' : '#0F172A',
    },
    summaryPriceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
      marginTop: 2,
    },
    summaryTotal: {
      fontSize: 18,
      fontWeight: '900',
      color: isDarkMode ? '#F3DA7A' : '#9A5A16',
    },
    summarySubtotalStrike: {
      fontSize: 12.5,
      color: isDarkMode ? '#8A8780' : '#94A3B8',
      textDecorationLine: 'line-through',
    },
    savingsMutedText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: isDarkMode ? '#86EFAC' : '#16A34A',
      opacity: 0.85,
      marginTop: 2,
    },
    insufficientText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: isDarkMode ? '#FBBF24' : '#D97706',
      marginTop: 2,
    },
    confirmBtn: {
      minWidth: 126,
      height: 46,
      paddingHorizontal: 18,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#D4AF37' : '#387367',
      borderWidth: 1,
      borderColor: isDarkMode ? '#E5C65C' : '#2D5F55',
      shadowColor: isDarkMode ? '#D4AF37' : '#387367',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.28,
      shadowRadius: 6,
      elevation: 4,
    },
    confirmBtnDisabled: {
      opacity: 0.45,
    },
    confirmLoadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    confirmBtnText: {
      fontSize: 14.5,
      fontWeight: '800',
      color: isDarkMode ? '#111210' : '#ffffff',
    },
  });
}
