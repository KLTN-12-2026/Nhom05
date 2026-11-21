import { API_BASE_URL, CANDIDATE_API_URLS as CANDIDATE_URLS } from './apiService';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import * as Clipboard from "expo-clipboard";
import * as Font from "expo-font";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getBookCoverSource } from "./bookCovers";
import { useAppNavigation, useAutoHideFooter } from "./navigation";
import ScallopDiscountBadge from "./ScallopDiscountBadge";
import {
  calculateDynamicKhoai,
  checkoutBooksApi,
  fetchWalletBalanceApi,
  RENTAL_DURATION_OPTIONS,
  RentalDurationDays,
} from "./rentalService";

// ==============================================================
// TYPOGRAPHY SYSTEM
// ==============================================================
const FONTS = {
  jakarta: "Plus Jakarta Sans",
  inter: "Inter",
  roboto: "Roboto",
} as const;

// ==============================================================
// API CONFIG — Fallback đa IP mạng LAN & localhost
// ==============================================================





// ==============================================================
// 1. TYPE DEFINITIONS CHO CSDL THẬT
// ==============================================================
type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

// Bảng: potato_package trong CSDL
export interface PotatoPackageItem {
  packageId: number;
  packageName: string;
  potatoAmount: number;
  bonusPotato: number;
  priceVnd: number;
  badgeTag: string | null;
  description: string | null;
  isActive?: boolean;
}

// Bảng: promotion trong CSDL
export interface PromotionItem {
  promotion_id: string;
  promotion_name: string;
  discount_percent: number;
  discount_amount: number;
  category_id?: number | null;
  category?: {
    category_id: number;
    category_name: string;
  } | null;
  book_id?: string | null;
  status?: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

// Bảng: book trong CSDL
export interface RealBook {
  book_id: string;
  bookName: string;
  author: string;
  img_url: string | null;
  rent_price: number | null;
  description: string | null;
  category_id: number | null;
  category_name: string | null;
  readCount: number;
}

// ==============================================================
// 2. DỮ LIỆU DỰ PHÒNG CHUẨN XÁC TỪ CSDL (KHI OFFLINE / KHỞI ĐỘNG)
// ==============================================================
const FALLBACK_POTATO_PACKAGES: PotatoPackageItem[] = [
  {
    packageId: 1,
    packageName: "Gói Trải Nghiệm",
    potatoAmount: 50,
    bonusPotato: 0,
    priceVnd: 50000,
    badgeTag: "Cơ Bản",
    description: "Đọc thử 3-5 cuốn sách văn học hoặc thiếu nhi.",
    isActive: true,
  },
  {
    packageId: 2,
    packageName: "Gói Tiêu Chuẩn",
    potatoAmount: 200,
    bonusPotato: 20,
    priceVnd: 200000,
    badgeTag: "Đề Xuất 🔥",
    description: "Gốc 200 + Tặng 20 Khoai & voucher giảm 20k.",
    isActive: true,
  },
  {
    packageId: 3,
    packageName: "Gói Thân Thiết",
    potatoAmount: 500,
    bonusPotato: 75,
    priceVnd: 500000,
    badgeTag: "+15% Thưởng",
    description: "Gốc 500 + Tặng 75 Khoai & Bookmark Gỗ.",
    isActive: true,
  },
  {
    packageId: 4,
    packageName: "Gói Đặc Quyền",
    potatoAmount: 1000,
    bonusPotato: 250,
    priceVnd: 1000000,
    badgeTag: "+25% VIP",
    description: "Gốc 1.000 + Tặng 250 Khoai & miễn phí cọc sách.",
    isActive: true,
  },
];

// ==============================================================
// SECTION HEADER COMPONENT — TINH GỌN, KHÔNG CHỮ THỪA
// ==============================================================
function CleanSectionHeader({
  icon,
  iconColor,
  label,
  textColor,
}: {
  icon: IconName;
  iconColor: string;
  label: string;
  textColor: string;
}) {
  return (
    <View style={sectionHeaderStyles.row}>
      <View style={[sectionHeaderStyles.iconBadge, { backgroundColor: `${iconColor}14` }]}>
        <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={[sectionHeaderStyles.label, { color: textColor }]}>
        {label}
      </Text>
    </View>
  );
}

const sectionHeaderStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: FONTS.jakarta,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
});

// ==============================================================
// MAIN OFFERS SCREEN
// ==============================================================
export default function OffersScreen() {
  const { navigate, navigateTab, isDarkMode, isLoggedIn, showLoginAlert, lang } =
    useAppNavigation();
  const { onScroll: handleFooterScroll, showFooter } = useAutoHideFooter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const bookCardWidth = 175;
  const voucherCardWidth = Math.min(Math.round(windowWidth * 0.76), 280);

  // Sizing & Animation cho Carousel sách ưu đãi hình cánh quạt
  const posterWidth = Math.min(240, Math.round(windowWidth * 0.60));
  const posterHeight = Math.round(posterWidth * 1.48);
  const posterSpacing = 14;
  const posterItemSize = posterWidth + posterSpacing;
  const posterSideSpacer = Math.max(0, (windowWidth - posterWidth) / 2);

  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeDot, setActiveDot] = useState(0);
  const hasInitializedOffset = useRef(false);

  // State: Số dư khoai
  const [khoaiBalance, setKhoaiBalance] = useState<number | null>(null);

  // State: Gói nạp Khoai từ CSDL
  const [potatoPackages, setPotatoPackages] = useState<PotatoPackageItem[]>(FALLBACK_POTATO_PACKAGES);

  // State: Chương trình khuyến mãi từ bảng promotion
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);

  // State: Sách từ CSDL
  const [realBooks, setRealBooks] = useState<RealBook[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState<string | null>(null);

  // Modal State cho Thuê Sách
  const [modalItem, setModalItem] = useState<{
    title: string;
    description: string;
    price: string;
    priceNumeric: number;
    actionText: string;
    bookId?: string;
    basePrice?: number;
  } | null>(null);
  const [selectedRentalDays, setSelectedRentalDays] = useState<RentalDurationDays>(7);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    showFooter();
  }, [showFooter]);

  // Load Typography Fonts
  useEffect(() => {
    const loadTypographyFonts = async () => {
      try {
        await Font.loadAsync({
          "Plus Jakarta Sans":
            "https://fonts.gstatic.com/s/plusjakartasans/v8/L0xTDF4xlVMF-BfR8bXMIjhGq3-cXbKDO1w.ttf",
          Inter:
            "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.ttf",
          Roboto:
            "https://fonts.gstatic.com/s/roboto/v32/KFOmCnqEu92Fr1Mu4mxP.ttf",
        });
      } catch {
        // Fallback an toàn
      }
    };
    loadTypographyFonts();
  }, []);

  // Load Khoai balance từ ví live
  useEffect(() => {
    let isMounted = true;
    const loadBalance = async () => {
      try {
        const liveBal = await fetchWalletBalanceApi();
        if (isMounted && liveBal !== null) {
          setKhoaiBalance(liveBal);
          return;
        }
        const raw = await AsyncStorage.getItem("cachedUserProfile");
        if (isMounted && raw) {
          const profile = JSON.parse(raw);
          if (typeof profile?.potatoBalance === "number") {
            setKhoaiBalance(profile.potatoBalance);
          }
        }
      } catch {
        // Silent
      }
    };
    loadBalance();
    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Fetch Potato Packages từ GET /api/home/potato/packages
  const fetchPackages = async (signal?: AbortSignal) => {
    for (const baseUrl of CANDIDATE_URLS) {
      try {
        const res = await axios.get(`${baseUrl}/api/home/potato/packages`, {
          timeout: 5000,
          signal,
        });
        if (Array.isArray(res.data) && res.data.length > 0) {
          setPotatoPackages(res.data);
          return;
        }
      } catch {
        // Thử candidate URL tiếp theo
      }
    }
  };

  // 2. Fetch Promotions từ CSDL qua endpoint public /api/home/promotions
  const fetchPromotions = async (signal?: AbortSignal) => {
    for (const baseUrl of CANDIDATE_URLS) {
      try {
        const res = await axios.get(`${baseUrl}/api/home/promotions`, {
          timeout: 5000,
          signal,
        });
        if (Array.isArray(res.data) && res.data.length > 0) {
          setPromotions(res.data);
          return;
        }
      } catch {
        // Thử tiếp endpoint fallback
      }
      try {
        const res = await axios.get(`${baseUrl}/api/promotions`, {
          timeout: 5000,
          signal,
        });
        if (Array.isArray(res.data) && res.data.length > 0) {
          setPromotions(res.data);
          return;
        }
      } catch {
        // Thử candidate URL tiếp theo
      }
    }
  };

  // 3. Fetch Real Books từ GET /api/home/books
  const fetchBooks = async (signal?: AbortSignal) => {
    setBooksLoading(true);
    setBooksError(null);
    let data: any = null;
    let successfulBaseUrl: string | null = null;
    for (const baseUrl of CANDIDATE_URLS) {
      try {
        const res = await axios.get(`${baseUrl}/api/home/books`, {
          params: { page: 0, size: 150 },
          timeout: 8000,
          signal,
        });
        data = res.data;
        if (data) {
          successfulBaseUrl = baseUrl;
          break;
        }
      } catch (err: any) {
        if (axios.isCancel(err) || err?.name === "CanceledError") return;
      }
    }
    if (data) {
      const rawList: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data.content)
          ? data.content
          : [];
      const mapped: RealBook[] = rawList
        .filter((b) => b.status !== "DELETED")
        .map((b) => {
          let imgUrl = b.img_url || null;
          if (imgUrl && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(imgUrl)) {
            const imagePath = imgUrl.startsWith("/") ? imgUrl : `/${imgUrl}`;
            imgUrl = (successfulBaseUrl || API_BASE_URL) + imagePath;
          }
          return {
            book_id: String(b.book_id || ""),
            bookName: b.bookName || "Chưa có tiêu đề",
            author: b.author || "HALM BOOK",
            img_url: imgUrl,
            rent_price: b.rent_price !== null && b.rent_price !== undefined ? b.rent_price : 15,
            description: b.description || null,
            category_id: b.category_id !== undefined && b.category_id !== null ? Number(b.category_id) : null,
            category_name: b.category_name || null,
            readCount: b.readCount || 0,
          };
        });
      setRealBooks(mapped);
      setBooksLoading(false);
    } else {
      setBooksError("Không thể kết nối backend để lấy danh sách sách.");
      setBooksLoading(false);
    }
  };

  // Nạp dữ liệu lần đầu khi vào màn hình
  useEffect(() => {
    const controller = new AbortController();
    fetchPackages(controller.signal);
    fetchPromotions(controller.signal);
    fetchBooks(controller.signal);
    return () => controller.abort();
  }, []);

  // Kéo xuống để làm mới (Pull-to-refresh) dữ liệu từ Database
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchPackages(),
        fetchPromotions(),
        fetchBooks(),
        isLoggedIn
          ? fetchWalletBalanceApi().then((bal) => {
              if (bal !== null) setKhoaiBalance(bal);
            })
          : Promise.resolve(),
      ]);
    } catch {
      // Silent
    } finally {
      setIsRefreshing(false);
    }
  };

  // System Colors
  const isDark = isDarkMode;
  const potatoColor = isDark ? "#FB923C" : "#EA580C";
  const potatoGold = isDark ? "#FBBF24" : "#D97706";
  const promoBookColor = isDark ? "#FB7185" : "#E11D48";
  const bannerPink = isDark ? "#F472B6" : "#EC4899";

  const colors = {
    screenBg: isDark ? "#101319" : "#FFFFFF",
    cardBg: isDark ? "#1A1E26" : "#FFFFFF",
    cardBorder: isDark ? "#282E3B" : "#E2E8F0",
    textPrimary: isDark ? "#F8FAFC" : "#0F172A",
    textSecondary: isDark ? "#94A3B8" : "#64748B",
    accent: promoBookColor,
    accentLight: isDark ? "rgba(251, 113, 133, 0.15)" : "rgba(225, 29, 72, 0.1)",
    accentText: "#FFFFFF",
    gold: potatoGold,
    goldLight: isDark ? "rgba(251, 191, 36, 0.15)" : "rgba(217, 119, 6, 0.1)",
    chipBg: isDark ? "#232A38" : "#F8FAFC",
    discountBadgeBg: isDark ? "#BE123C" : "#E11D48",
    potatoColor,
    potatoGold,
    promoBookColor,
    bannerPink,
  };

  const showToast = (title: string, message: string) => {
    setToast({ visible: true, title, message });
    setTimeout(() => setToast((p) => ({ ...p, visible: false })), 3000);
  };

  // Bản đồ quy ước book_id cho các mã promotion (được cấu hình trong DB)
  const PROMO_BOOK_ID_MAP: Record<string, string> = {
    P001: "B001",
    P002: "B002",
    P003: "B003",
    P004: "B004",
    P005: "B005",
    P006: "B009",
  };

  // ==============================================================
  // 1. SÁCH ƯU ĐÃI CHO HERO BANNER CÁNH QUẠT (Các cuốn sách được gán khuyến mãi theo book_id)
  // ==============================================================
  const promotionalBooks = useMemo(() => {
    if (promotions.length === 0 || realBooks.length === 0) return [];

    const activePromos = promotions.filter(
      (p) => !p.status || p.status.toUpperCase() === "ACTIVE"
    );
    if (activePromos.length === 0) return [];

    // 1. Bản đồ book_id trực tiếp
    const promoByBookId = new Map<string, PromotionItem>();
    activePromos.forEach((p) => {
      if (p.book_id) {
        promoByBookId.set(String(p.book_id).trim().toUpperCase(), p);
      }
      if (p.promotion_id) {
        const pid = String(p.promotion_id).trim().toUpperCase();
        const mappedBookId =
          PROMO_BOOK_ID_MAP[pid] || (pid.startsWith("P") ? "B" + pid.slice(1) : null);
        if (mappedBookId && !promoByBookId.has(mappedBookId)) {
          promoByBookId.set(mappedBookId, p);
        }
      }
    });

    const result: any[] = [];
    realBooks.forEach((book) => {
      const bid = String(book.book_id || "").trim().toUpperCase();
      const promo = promoByBookId.get(bid);
      if (promo) {
        const pct = promo.discount_percent > 0 ? promo.discount_percent : 20;
        const base = book.rent_price ?? 15;
        const discPrice = Math.max(1, Math.round((base * (100 - pct)) / 100));
        result.push({
          ...book,
          rent_price: discPrice,
          original_price: base,
          discount_percent: pct,
          promo_name: promo.promotion_name || `Giảm ${pct}%`,
        });
      }
    });

    return result;
  }, [realBooks, promotions]);

  // ==============================================================
  // 2. SÁCH ƯU ĐÃI THEO THỂ LOẠI (Cho mục "Sách ưu đãi" phía dưới)
  // Chỉ áp dụng khi người dùng thêm khuyến mãi cho THỂ LOẠI (category_id)
  // ==============================================================
  const categoryPromotionalBooks = useMemo(() => {
    if (promotions.length === 0 || realBooks.length === 0) return [];

    // Lọc các khuyến mãi có áp dụng thể loại (category_id)
    const categoryPromos = promotions.filter((p) => {
      const isActive = !p.status || p.status.toUpperCase() === "ACTIVE";
      const catId = p.category_id || p.category?.category_id;
      return isActive && !!catId;
    });

    if (categoryPromos.length === 0) return [];

    const promoByCatId = new Map<number, PromotionItem>();
    categoryPromos.forEach((p) => {
      const catId = Number(p.category_id || p.category?.category_id);
      if (catId) {
        const existing = promoByCatId.get(catId);
        if (!existing || (p.discount_percent || 0) > (existing.discount_percent || 0)) {
          promoByCatId.set(catId, p);
        }
      }
    });

    const result: any[] = [];
    realBooks.forEach((book) => {
      const cid = book.category_id !== null ? Number(book.category_id) : null;
      if (cid !== null && promoByCatId.has(cid)) {
        const promo = promoByCatId.get(cid)!;
        const pct = promo.discount_percent > 0 ? promo.discount_percent : 20;
        const base = book.rent_price ?? 15;
        const discPrice = Math.max(1, Math.round((base * (100 - pct)) / 100));
        result.push({
          ...book,
          rent_price: discPrice,
          original_price: base,
          discount_percent: pct,
          promo_name: promo.promotion_name || `Ưu đãi thể loại -${pct}%`,
        });
      }
    });

    return result;
  }, [realBooks, promotions]);

  // ==============================================================
  // 3. TOÀN BỘ SÁCH ƯU ĐÃI (DÀNH CHO MỤC "SÁCH ƯU ĐÃI")
  // Tổng hợp tất cả các sách được giảm giá: theo từng sách (book_id)
  // và theo thể loại (category_id), lọc trùng lặp và lấy % giảm tốt nhất.
  // ==============================================================
  const displayDiscountBooks = useMemo(() => {
    const map = new Map<string, any>();

    // 1. Thêm từ promotionalBooks (sách được gán khuyến mãi trực tiếp qua book_id)
    promotionalBooks.forEach((book) => {
      const bid = String(book.book_id || "").trim();
      if (bid) {
        map.set(bid, book);
      }
    });

    // 2. Thêm từ categoryPromotionalBooks (sách được giảm giá theo thể loại)
    categoryPromotionalBooks.forEach((book) => {
      const bid = String(book.book_id || "").trim();
      if (bid) {
        if (!map.has(bid)) {
          map.set(bid, book);
        } else {
          const existing = map.get(bid);
          if ((book.discount_percent || 0) > (existing.discount_percent || 0)) {
            map.set(bid, book);
          }
        }
      }
    });

    return Array.from(map.values());
  }, [promotionalBooks, categoryPromotionalBooks]);

  // Chia danh sách sách ưu đãi thành các line (mỗi line hiển thị tối đa 10 cuốn sách, hết 10 cuốn tự động xuống line 2)
  const discountBookRows = useMemo(() => {
    const rows: any[][] = [];
    const chunkSize = 10;
    for (let i = 0; i < displayDiscountBooks.length; i += chunkSize) {
      rows.push(displayDiscountBooks.slice(i, i + chunkSize));
    }
    return rows;
  }, [displayDiscountBooks]);

  // ==============================================================
  // VOUCHER & TIỆN ÍCH ĐỘC QUYỀN (ĐỒNG BỘ TỪ PROMOTION TABLE TRONG CSDL)
  // Khi admin thêm voucher/khuyến mãi trên Web thì sẽ tự động hiện ở đây
  // ==============================================================
  const voucherOffers = useMemo(() => {
    if (promotions.length === 0) return [];
    return promotions.map((p) => {
      const code = String(p.promotion_id || "VOUCHER").trim().toUpperCase();
      const title =
        p.promotion_name && p.promotion_name.trim().length > 0
          ? p.promotion_name
          : `Voucher Ưu Đãi ${code}`;
      const pct = p.discount_percent || 0;
      const amt = p.discount_amount || 0;
      const desc =
        p.description && p.description.trim().length > 0
          ? p.description
          : "Áp dụng cho mọi độc giả của HALM BOOK";
      const costPotato =
        amt > 0 ? Math.max(1, Math.round(amt / 1000)) : pct > 0 ? 5 : 10;

      const features: string[] = [
        desc,
        `Mã kích hoạt: ${code}`,
        pct > 0
          ? `Chiết khấu ${pct}% khi thuê sách`
          : amt > 0
          ? `Giảm ngay ${amt.toLocaleString("vi-VN")} đ`
          : "Ưu đãi độc quyền toàn hệ thống",
      ];

      return {
        id: code,
        code,
        title,
        discountPercent: pct,
        discountAmount: amt,
        description: desc,
        costPotato,
        tag: pct > 0 ? `GIẢM ${pct}%` : "VOUCHER",
        category: "Ưu Đãi Đặc Quyền",
        features,
        action: "Nhận Mã",
      };
    });
  }, [promotions]);

  // Sách hiển thị trên Hero Banner: Ưu tiên promotionalBooks (theo book_id), nếu ít thì lấy thêm từ displayDiscountBooks
  const heroBannerBooks = useMemo(() => {
    if (promotionalBooks.length >= 3) return promotionalBooks;
    if (displayDiscountBooks.length > 0) return displayDiscountBooks.slice(0, 10);
    return promotionalBooks;
  }, [promotionalBooks, displayDiscountBooks]);

  // ==============================================================
  // CẤU HÌNH CAROUSEL CÁNH QUẠT & VÒNG LẶP VÔ TẬN TỪ SÁCH DATABASE
  // ==============================================================
  const promoCount = heroBannerBooks.length;
  const loopCopies = 7;
  const middleCopyIdx = 3;
  const startIndex = promoCount > 0 ? middleCopyIdx * promoCount : 0;

  const loopBooks = useMemo(() => {
    if (promoCount === 0) return [];
    return Array.from({ length: loopCopies }).flatMap((_, copyIdx) =>
      heroBannerBooks.map((book, itemIdx) => ({
        ...book,
        loopKey: `copy-${copyIdx}-book-${book.book_id}-${itemIdx}`,
        originalIndex: itemIdx,
      }))
    );
  }, [heroBannerBooks, promoCount]);

  // Căn giữa sách đầu tiên ngay khi danh sách sách khuyến mãi được tải xong
  useEffect(() => {
    if (promoCount > 0) {
      const initialX = startIndex * posterItemSize;
      (scrollRef.current as any)?.scrollTo({ x: initialX, animated: false });
      scrollX.setValue(initialX);
    }
  }, [promoCount, startIndex, posterItemSize]);

  // Lắng nghe scrollX để đồng bộ chấm Pagination
  useEffect(() => {
    if (promoCount === 0) return;
    let lastIndex = 0;
    const listenerId = scrollX.addListener(({ value }) => {
      const rawIndex = Math.round(value / posterItemSize);
      const realIndex = ((rawIndex % promoCount) + promoCount) % promoCount;
      if (realIndex !== lastIndex) {
        lastIndex = realIndex;
        setActiveDot(realIndex);
      }
    });
    return () => {
      scrollX.removeListener(listenerId);
    };
  }, [posterItemSize, promoCount]);

  const handleFanLayout = () => {
    if (!hasInitializedOffset.current && promoCount > 0) {
      hasInitializedOffset.current = true;
      (scrollRef.current as any)?.scrollTo({
        x: startIndex * posterItemSize,
        animated: false,
      });
      scrollX.setValue(startIndex * posterItemSize);
    }
  };

  const handleMomentumScrollEnd = (e: any) => {
    if (promoCount === 0) return;
    const currentX = e.nativeEvent?.contentOffset?.x ?? 0;
    const rawIdx = Math.round(currentX / posterItemSize);
    const realIdx = ((rawIdx % promoCount) + promoCount) % promoCount;

    const lowerBound = promoCount * 2;
    const upperBound = promoCount * (loopCopies - 2);

    if (rawIdx < lowerBound || rawIdx >= upperBound) {
      const targetIdx = startIndex + realIdx;
      const targetX = targetIdx * posterItemSize;
      (scrollRef.current as any)?.scrollTo({ x: targetX, animated: false });
      scrollX.setValue(targetX);
    }
  };

  const goToPoster = (targetRealIdx: number) => {
    if (promoCount === 0) return;
    const currentVal = (scrollX as any)._value ?? startIndex * posterItemSize;
    const currentRaw = Math.round(currentVal / posterItemSize);
    const currentReal = ((currentRaw % promoCount) + promoCount) % promoCount;
    let diff = targetRealIdx - currentReal;
    const half = Math.floor(promoCount / 2);
    if (diff > half) diff -= promoCount;
    if (diff < -half) diff += promoCount;
    const targetX = (currentRaw + diff) * posterItemSize;
    (scrollRef.current as any)?.scrollTo({ x: targetX, animated: true });
  };

  const handleOpenBookModal = (book: any) => {
    const rentPrice = book.rent_price ?? 11;
    setSelectedRentalDays(7);
    if (isLoggedIn) {
      fetchWalletBalanceApi().then((bal) => {
        if (bal !== null) setKhoaiBalance(bal);
      });
    }
    setModalItem({
      title: book.bookName,
      description: book.description || "Sách đọc trực tuyến ưu đãi tại HalmBook.",
      price: `${rentPrice} 🥔`,
      priceNumeric: rentPrice,
      actionText: "Thuê Sách",
      bookId: book.book_id,
      basePrice: rentPrice,
    });
  };

  // Cuốn sách đang được chọn / nằm ở trung tâm của Carousel cánh quạt
  const activeBook = heroBannerBooks[activeDot] || heroBannerBooks[0] || null;

  // Thuê sách thật từ catalog DB
  const handleConfirmAction = async () => {
    if (!modalItem || isSubmittingModal) return;

    if (modalItem.bookId) {
      if (!isLoggedIn) {
        setModalItem(null);
        showLoginAlert("Bạn phải đăng nhập để thuê sách và đồng bộ vào Tủ sách!");
        return;
      }

      const base = modalItem.basePrice ?? modalItem.priceNumeric;
      const finalPrice = calculateDynamicKhoai(base, selectedRentalDays);
      const balance = khoaiBalance ?? 0;

      if (balance < finalPrice) {
        Alert.alert(
          "Số dư Khoai không đủ",
          `Bạn cần ${finalPrice} 🥔 cho gói ${selectedRentalDays} ngày (hiện có ${balance} 🥔). Bạn có muốn nạp thêm Khoai không?`,
          [
            { text: "Đóng", style: "cancel" },
            {
              text: "Nạp Khoai",
              onPress: () => {
                setModalItem(null);
                navigate("payment");
              },
            },
          ]
        );
        return;
      }

      setIsSubmittingModal(true);
      try {
        const res = await checkoutBooksApi([
          {
            bookId: modalItem.bookId,
            durationDays: selectedRentalDays,
            price: finalPrice,
          },
        ]);

        if (res.requireLogin) {
          setModalItem(null);
          showLoginAlert(res.message);
          return;
        }
        if (!res.success) {
          Alert.alert("Không thể thuê sách", res.message);
          return;
        }

        if (typeof res.remainingPotatoBalance === "number") {
          setKhoaiBalance(res.remainingPotatoBalance);
        } else {
          const freshBal = await fetchWalletBalanceApi();
          if (freshBal !== null) setKhoaiBalance(freshBal);
        }

        const bookTitle = modalItem.title;
        setModalItem(null);
        showToast("Thuê Sách Thành Công!", `Đã thêm "${bookTitle}" (${selectedRentalDays} ngày) vào Tủ sách.`);
        Alert.alert(
          "Thuê sách thành công!",
          `Đã thanh toán ${res.totalKhoaiPaid ?? finalPrice} 🥔 để thuê "${bookTitle}" trong ${selectedRentalDays} ngày.`,
          [
            { text: "Xem Tủ sách", onPress: () => navigateTab("bookshelf") },
            { text: "Đóng", style: "cancel" },
          ]
        );
      } finally {
        setIsSubmittingModal(false);
      }
      return;
    }

    setModalItem(null);
  };

  // ==============================================================
  // 1. RENDER GÓI NẠP KHOAI ƯU ĐÃI (HÀNG DỌC TINH GỌN)
  // ==============================================================
  const renderPotatoVerticalCard = (item: PotatoPackageItem, index: number) => {
    const totalPotatoes = item.potatoAmount + (item.bonusPotato || 0);
    const priceFormatted = (item.priceVnd || 0).toLocaleString("vi-VN") + " đ";

    return (
      <View
        key={item.packageId || index}
        style={[
          styles.potatoVerticalCard,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        {/* Cột trái: Tên gói, số Khoai, Khoai thưởng */}
        <View style={styles.potatoLeftCol}>
          <View style={styles.potatoTitleRow}>
            <Text style={[styles.potatoPackageName, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.packageName}
            </Text>
            {item.badgeTag ? (
              <View style={[styles.potatoBadge, { backgroundColor: colors.goldLight }]}>
                <Text style={[styles.potatoBadgeText, { color: colors.gold }]}>
                  {item.badgeTag}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.potatoAmountRow}>
            <Text style={styles.potatoEmoji}>🥔</Text>
            <Text style={[styles.potatoAmountNum, { color: colors.textPrimary }]}>
              {totalPotatoes.toLocaleString("vi-VN")}
            </Text>
            <Text style={[styles.potatoUnit, { color: colors.potatoGold }]}>Khoai</Text>
          </View>

          {item.bonusPotato > 0 ? (
            <Text style={[styles.potatoBonusTag, { color: colors.potatoColor }]}>
              +{item.bonusPotato} Khoai thưởng (Gốc {item.potatoAmount.toLocaleString("vi-VN")})
            </Text>
          ) : (
            <Text style={[styles.potatoBonusTag, { color: colors.textSecondary }]}>
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
            style={[styles.potatoBtn, { backgroundColor: colors.potatoColor }]}
            onPress={() => navigate("payment")}
            activeOpacity={0.8}
          >
            <Text style={[styles.potatoBtnText, { color: "#FFFFFF" }]}>
              Nạp ngay
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Sao chép mã voucher vào clipboard & thông báo
  const handleCopyVoucher = async (code: string, title: string) => {
    try {
      await Clipboard.setStringAsync(code);
    } catch {
      // Fallback
    }
    showToast("Đã lưu mã giảm giá!", `Mã "${code}" đã được sao chép vào bộ nhớ tạm.`);
    Alert.alert(
      "Nhận Mã Ưu Đãi Thành Công!",
      `Đã sao chép mã "${code}" (${title}).\nBạn có thể áp dụng mã này khi thuê sách hoặc nạp Khoai!`,
      [{ text: "Tuyệt vời", style: "default" }]
    );
  };

  // ==============================================================
  // 1.5. RENDER THẺ MÃ GIẢM GIÁ & TIỆN ÍCH ĐỘC QUYỀN (GIỐNG BẢN WEB)
  // ==============================================================
  const renderVoucherCard = (item: any, index: number) => {
    return (
      <View
        key={item.id || index}
        style={[
          styles.voucherCard,
          {
            width: voucherCardWidth,
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        {/* Phần trên: Icon vé + Tag chiết khấu */}
        <View style={styles.voucherTopArea}>
          <View
            style={[
              styles.voucherBannerBox,
              {
                backgroundColor: isDark
                  ? "rgba(251, 191, 36, 0.12)"
                  : "rgba(217, 119, 6, 0.08)",
              },
            ]}
          >
            <View
              style={[
                styles.voucherIconCircle,
                {
                  backgroundColor: isDark
                    ? "rgba(251, 191, 36, 0.22)"
                    : "rgba(217, 119, 6, 0.15)",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="ticket-percent"
                size={28}
                color={colors.gold}
              />
            </View>
            {item.tag ? (
              <View
                style={[
                  styles.voucherTagBadge,
                  { backgroundColor: colors.gold },
                ]}
              >
                <Text style={styles.voucherTagBadgeText}>{item.tag}</Text>
              </View>
            ) : null}
          </View>

          {/* Danh mục & Tiêu đề Voucher */}
          <View style={styles.voucherMetaWrap}>
            <Text
              style={[
                styles.voucherCategoryText,
                { color: colors.textSecondary },
              ]}
            >
              {item.category}
            </Text>
            <Text
              numberOfLines={2}
              style={[styles.voucherTitleText, { color: colors.textPrimary }]}
            >
              {item.title}
            </Text>
          </View>

          {/* Danh sách đặc quyền / điều kiện */}
          <View
            style={[
              styles.voucherFeaturesList,
              { borderTopColor: colors.cardBorder },
            ]}
          >
            {item.features.map((feat: string, fIdx: number) => (
              <View key={fIdx} style={styles.voucherFeatureRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color="#10B981"
                  style={{ marginRight: 6 }}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.voucherFeatureText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {feat}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Phần dưới: Mã Code + Nút Nhận Mã */}
        <View
          style={[
            styles.voucherBottomArea,
            { borderTopColor: colors.cardBorder },
          ]}
        >
          <View style={styles.voucherCodeRow}>
            <View
              style={[
                styles.voucherCodeBox,
                {
                  backgroundColor: colors.chipBg,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="tag"
                size={12}
                color={colors.gold}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.voucherCodeText, { color: colors.gold }]}>
                {item.code}
              </Text>
            </View>

            <View style={styles.voucherCostRow}>
              <Text style={styles.voucherCostEmoji}>🥔</Text>
              <Text
                style={[styles.voucherCostNum, { color: colors.textPrimary }]}
              >
                {item.costPotato}
              </Text>
              <Text
                style={[styles.voucherCostLabel, { color: colors.gold }]}
              >
                Khoai
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.voucherActionBtn,
              { backgroundColor: colors.potatoColor },
            ]}
            onPress={() => handleCopyVoucher(item.code, item.title)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="content-copy"
              size={14}
              color="#FFFFFF"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.voucherActionBtnText}>
              {item.action || "Nhận Mã"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ==============================================================
  // 2. RENDER SÁCH ƯU ĐÃI (BẢNG BOOK — GIẢM GIÁ THEO CATEGORY TỪ DB)
  // ==============================================================
  const renderDiscountBookCard = (book: any, _index: number) => {
    const rentPrice = book.rent_price ?? 15;
    const originalPrice = book.original_price ?? Math.round(rentPrice * 1.3);
    const discountPct = book.discount_percent ?? 20;
    const coverSource = getBookCoverSource(book.book_id, book.img_url || undefined);

    return (
      <TouchableOpacity
        key={`${book.book_id}-${_index}`}
        style={[
          styles.bookCard,
          {
            width: bookCardWidth,
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          },
        ]}
        onPress={async () => {
          setSelectedRentalDays(7);
          if (isLoggedIn) {
            fetchWalletBalanceApi().then((bal) => {
              if (bal !== null) setKhoaiBalance(bal);
            });
          }
          setModalItem({
            title: book.bookName,
            description: book.description || "Sách đọc trực tuyến ưu đãi tại HalmBook.",
            price: `${rentPrice} 🥔`,
            priceNumeric: rentPrice,
            actionText: "Thuê Sách",
            bookId: book.book_id,
            basePrice: rentPrice,
          });
        }}
        activeOpacity={0.85}
      >
        <View style={styles.bookCoverFrame}>
          <View style={styles.bookCoverImgWrap}>
            {coverSource ? (
              <Image source={coverSource} style={styles.bookCoverImg} resizeMode="cover" />
            ) : (
              <View style={[styles.bookCoverPlaceholder, { backgroundColor: colors.chipBg }]}>
                <MaterialCommunityIcons name="book-open-variant" size={26} color={colors.textSecondary} />
              </View>
            )}
          </View>

          {/* Badge giảm giá hoa thị ngay đầu góc cuốn sách */}
          <ScallopDiscountBadge
            percent={discountPct}
            size={40}
            style={styles.bookDiscountBadge}
          />
        </View>

        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.bookTitle, { color: colors.textPrimary }]}
        >
          {book.bookName}
        </Text>

        <View style={styles.bookFooterRow}>
          <View style={styles.bookPriceWrap}>
            <Text style={[styles.bookOldPrice, { color: colors.textSecondary }]}>
              {originalPrice} 🥔
            </Text>
            <Text style={[styles.bookPrice, { color: colors.promoBookColor }]}>
              {rentPrice} 🥔
            </Text>
          </View>
          <View style={[styles.bookRentBtn, { backgroundColor: colors.promoBookColor }]}>
            <Text style={[styles.bookRentBtnText, { color: "#FFFFFF" }]}>
              Thuê
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ==============================================================
  // RENDER GIAO DIỆN CHÍNH
  // ==============================================================
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.screenBg,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <ExpoStatusBar style={isDarkMode ? "light" : "dark"} />

      {/* ============================================================
          HEADER BAR: Tiêu đề màn hình & dòng phụ Khuyến mãi sách hay
          ============================================================ */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: colors.screenBg,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {lang === "en" ? "Deals & Offers" : "Ưu đãi & khuyến mãi"}
        </Text>
      </View>

      {/* Toast */}
      {toast.visible && (
        <View
          style={[
            styles.toastPill,
            { backgroundColor: colors.cardBg, borderColor: colors.accent, top: insets.top + 58 },
          ]}
        >
          <View style={[styles.toastIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name="checkmark" size={13} color={colors.accentText} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toastTitle, { color: colors.textPrimary }]}>{toast.title}</Text>
            <Text style={[styles.toastMsg, { color: colors.textSecondary }]}>{toast.message}</Text>
          </View>
        </View>
      )}

      {/* ============================================================
          MAIN SCROLL: 2 Mục duy nhất (Gói nạp khoai dọc + Sách ưu đãi)
          ============================================================ */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleFooterScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.gold, colors.potatoColor]}
            tintColor={colors.gold}
          />
        }
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: 110 + Math.max(insets.bottom, 16),
        }}
      >
        {/* ============================================================
            CAROUSEL SÁCH ƯU ĐÃI DATABASE — HÌNH CÁNH QUẠT & VÒNG LẶP VÔ TẬN
            - Nguồn dữ liệu: Các cuốn sách ưu đãi đã thêm vào database (heroBannerBooks)
            - Góc trên bên phải: Mức giá cũ bị gạch đi và mức giá giảm giá bên cạnh
            - Phía dưới: Tên sách nổi bật, tác giả và nút thuê
            - Hiệu ứng: Cánh quạt 3D xòe vòng cung, lướt nối tiếp vô tận
            ============================================================ */}
        {heroBannerBooks.length > 0 && (
          <View style={styles.postersSectionWrap}>
            {/* TIÊU ĐỀ NẰM TRÊN MẤY CUỐN SÁCH BANNER */}
            <View style={styles.bannerSectionHeaderWrap}>
              <Ionicons name="sparkles" size={18} color={isDark ? "#F472B6" : "#EC4899"} style={{ marginRight: 6 }} />
              <Text style={[styles.bannerSectionTitle, { color: isDark ? "#F472B6" : "#EC4899" }]}>
                Khuyến mãi sách hay
              </Text>
              <Ionicons name="sparkles" size={18} color={isDark ? "#F472B6" : "#EC4899"} style={{ marginLeft: 6 }} />
            </View>

            <Animated.ScrollView
              ref={scrollRef as any}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={posterItemSize}
              decelerationRate="fast"
              snapToAlignment="start"
              bounces={false}
              scrollEventThrottle={16}
              contentOffset={{ x: startIndex * posterItemSize, y: 0 }}
              style={{ overflow: "visible" }}
              contentContainerStyle={{
                paddingHorizontal: posterSideSpacer,
                paddingTop: 32,
                paddingBottom: 22,
              }}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: true }
              )}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              onLayout={handleFanLayout}
            >
              {loopBooks.map((book: any, index: number) => {
                const inputRange = [
                  (index - 2) * posterItemSize,
                  (index - 1) * posterItemSize,
                  index * posterItemSize,
                  (index + 1) * posterItemSize,
                  (index + 2) * posterItemSize,
                ];

                // Phóng to ở giữa, thu nhỏ 2 bên
                const scale = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.78, 0.88, 1.05, 0.88, 0.78],
                  extrapolate: "clamp",
                });

                // Hiệu ứng xòe cánh quạt (Fan rotation)
                const rotateZ = scrollX.interpolate({
                  inputRange,
                  outputRange: ["14deg", "8deg", "0deg", "-8deg", "-14deg"],
                  extrapolate: "clamp",
                });

                // Uốn vòng cung cánh quạt (Fan arc curve: ở giữa nhô cao, 2 bên uốn thấp dần)
                const translateY = scrollX.interpolate({
                  inputRange,
                  outputRange: [24, 10, 0, 10, 24],
                  extrapolate: "clamp",
                });

                // Độ mờ: tấm ở giữa rõ nhất, 2 bên mờ dần
                const opacity = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.4, 0.72, 1.0, 0.72, 0.4],
                  extrapolate: "clamp",
                });

                const coverSource = getBookCoverSource(book.book_id, book.img_url || undefined);
                const rentPrice = book.rent_price ?? 11;
                const originalPrice = book.original_price ?? Math.round(rentPrice * 1.33);
                const discountPct = book.discount_percent ?? 20;

                return (
                  <View
                    key={book.loopKey}
                    style={{
                      width: posterWidth,
                      marginRight: posterSpacing,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingTop: 16,
                      overflow: "visible",
                    }}
                  >
                    <Animated.View
                      style={[
                        styles.posterCard,
                        {
                          width: posterWidth,
                          height: posterHeight,
                          transform: [
                            { translateY },
                            { rotate: rotateZ },
                            { scale },
                          ],
                          opacity,
                          borderColor: colors.cardBorder,
                        },
                      ]}
                    >
                      <View style={styles.posterTouchable}>
                        {/* Ảnh bìa cuốn sách bo tròn */}
                        <View style={styles.posterImageWrap}>
                          {coverSource ? (
                            <Image
                              source={coverSource}
                              style={styles.posterImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={[styles.posterImage, styles.posterFallbackBg]}>
                              <MaterialCommunityIcons name="book-open-page-variant" size={44} color="#94A3B8" />
                            </View>
                          )}
                        </View>

                        {/* GÓC TRÊN BÊN PHẢI: ICON HOA THỊ GIẢM GIÁ NGAY ĐẦU GÓC */}
                        <ScallopDiscountBadge
                          percent={discountPct}
                          size={52}
                          style={styles.fanDiscountCornerBadge}
                        />
                      </View>
                    </Animated.View>
                  </View>
                );
              })}
            </Animated.ScrollView>

            {/* THÔNG TIN CUỐN SÁCH ĐANG ĐƯỢC CHỌN (HIỂN THỊ PHÍA DƯỚI THAY THẾ CHẤM TRÒN) */}
            {activeBook && (
              <View style={styles.activeBookInfoWrap}>
                {activeBook.promo_name ? (
                  <View style={[styles.activePromoTag, { backgroundColor: colors.goldLight }]}>
                    <MaterialCommunityIcons name="sale" size={11} color={colors.gold} />
                    <Text style={[styles.activePromoTagText, { color: colors.gold }]}>
                      {activeBook.promo_name}
                    </Text>
                  </View>
                ) : null}

                {/* TÊN SÁCH NỔI BẬT */}
                <Text
                  style={[styles.activeBookTitle, { color: colors.textPrimary }]}
                  numberOfLines={2}
                >
                  {activeBook.bookName}
                </Text>

                {/* TÁC GIẢ */}
                {activeBook.author ? (
                  <Text
                    style={[styles.activeBookAuthor, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {activeBook.author}
                  </Text>
                ) : null}

                {/* GIÁ KHOAI VỚI GẠCH HIỂN THỊ TẠI CHỖ ƯU ĐÃI NÀY */}
                <View style={styles.activePriceRow}>
                  <Text style={[styles.activeOldPrice, { color: colors.textSecondary }]}>
                    {activeBook.original_price ?? 15} 🥔
                  </Text>
                  <Text style={[styles.activeNewPrice, { color: colors.bannerPink }]}>
                    {activeBook.rent_price ?? 11} 🥔
                  </Text>
                  <View style={styles.activeDiscountPill}>
                    <Text style={styles.activeDiscountPillText}>
                      -{activeBook.discount_percent ?? 20}%
                    </Text>
                  </View>
                </View>

                {/* NÚT THUÊ */}
                <TouchableOpacity
                  style={[styles.activeRentBtn, { backgroundColor: colors.bannerPink }]}
                  onPress={() => handleOpenBookModal(activeBook)}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="bookmark-check"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={[styles.activeRentBtnText, { color: "#FFFFFF" }]}>
                    Thuê ngay
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* MỤC 1: GÓI NẠP KHOAI ƯU ĐÃI (HIỂN THỊ HÀNG DỌC) */}
        <View style={styles.sectionWrap}>
          <CleanSectionHeader
            icon="wallet-giftcard"
            iconColor={colors.potatoColor}
            label="Gói nạp khoai ưu đãi"
            textColor={colors.potatoColor}
          />
          <View style={styles.potatoVerticalList}>
            {potatoPackages.map((item, index) => renderPotatoVerticalCard(item, index))}
          </View>
        </View>

        {/* MỤC 2: MÃ GIẢM GIÁ & TIỆN ÍCH ĐỘC QUYỀN (ĐỒNG BỘ TỪ ADMIN WEB & CSDL) */}
        <View style={styles.sectionWrap}>
          <CleanSectionHeader
            icon="ticket-percent"
            iconColor={colors.gold}
            label="Mã giảm giá & tiện ích độc quyền"
            textColor={colors.gold}
          />

          {voucherOffers.length === 0 ? (
            <View style={styles.booksEmptyBox}>
              <MaterialCommunityIcons
                name="ticket-percent-outline"
                size={28}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.booksEmptyTitle, { color: colors.textPrimary }]}
              >
                Chưa có mã giảm giá
              </Text>
              <Text
                style={[styles.booksEmptySub, { color: colors.textSecondary }]}
              >
                Các mã giảm giá và voucher quà tặng từ hệ thống sẽ hiển thị tại
                đây khi được quản trị viên kích hoạt.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.voucherScrollContent}
              style={{ overflow: "visible" }}
            >
              {voucherOffers.map((item, index) =>
                renderVoucherCard(item, index)
              )}
            </ScrollView>
          )}
        </View>

        {/* MỤC 3: SÁCH ƯU ĐÃI (ĐỒNG BỘ THEO THỂ LOẠI KHUYẾN MÃI TỪ DATABASE) */}
        <View style={styles.sectionWrap}>
          <CleanSectionHeader
            icon="sale"
            iconColor={colors.promoBookColor}
            label="Sách ưu đãi"
            textColor={colors.promoBookColor}
          />

          {booksLoading ? (
            <View style={styles.booksLoadingBox}>
              <ActivityIndicator size="small" color={colors.promoBookColor} />
              <Text style={[styles.booksLoadingText, { color: colors.textSecondary }]}>
                Đang tải sách...
              </Text>
            </View>
          ) : booksError ? (
            <View style={styles.booksErrorBox}>
              <Ionicons name="wifi-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.booksErrorText, { color: colors.textSecondary }]}>
                {booksError}
              </Text>
            </View>
          ) : discountBookRows.length === 0 ? (
            <View style={styles.booksEmptyBox}>
              <MaterialCommunityIcons name="tag-off-outline" size={28} color={colors.textSecondary} />
              <Text style={[styles.booksEmptyTitle, { color: colors.textPrimary }]}>
                Chưa có sách ưu đãi
              </Text>
              <Text style={[styles.booksEmptySub, { color: colors.textSecondary }]}>
                Các chương trình khuyến mãi theo sách hoặc thể loại sẽ hiển thị tại đây khi được thêm vào hệ thống.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {discountBookRows.map((row, rowIndex) => (
                <ScrollView
                  key={`discount-row-${rowIndex}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScrollContent}
                  style={{ overflow: "visible" }}
                >
                  {row.map((book, bookIndex) =>
                    renderDiscountBookCard(book, rowIndex * 10 + bookIndex)
                  )}
                </ScrollView>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ============================================================
          MODAL THUÊ SÁCH
          ============================================================ */}
      <Modal
        visible={!!modalItem}
        transparent
        animationType="fade"
        onRequestClose={() => setModalItem(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            {modalItem && (
              <>
                <View style={[styles.modalHeaderRow, { borderBottomColor: colors.cardBorder }]}>
                  <Text style={[styles.modalHeading, { color: colors.textPrimary, flex: 1 }]}>
                    {modalItem.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setModalItem(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {(() => {
                  const effectiveCost = modalItem.priceNumeric;
                  const effectivePriceLabel = modalItem.price;
                  return (
                    <View style={styles.modalMetaRow}>
                      <View style={[styles.modalMetaCol, { backgroundColor: colors.chipBg, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.modalMetaLabel, { color: colors.textSecondary }]}>Chi phí thuê:</Text>
                        <Text style={[styles.modalMetaVal, { color: colors.accent }]}>
                          {effectivePriceLabel}
                        </Text>
                      </View>
                      <View style={[styles.modalMetaCol, { backgroundColor: colors.chipBg, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.modalMetaLabel, { color: colors.textSecondary }]}>Ví hiện có:</Text>
                        <Text style={[styles.modalMetaVal, { color: colors.textPrimary }]}>
                          {khoaiBalance !== null ? khoaiBalance : "—"} 🥔
                        </Text>
                      </View>
                    </View>
                  );
                })()}

                {(() => {
                  const effectiveCost = modalItem.priceNumeric;
                  const canAfford = !modalItem.bookId || !isLoggedIn || (khoaiBalance ?? 0) >= effectiveCost;
                  return (
                    <View style={styles.modalBtnRow}>
                      <TouchableOpacity
                        style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]}
                        onPress={() => !isSubmittingModal && setModalItem(null)}
                        disabled={isSubmittingModal}
                      >
                        <Text style={[styles.modalCancelText, { color: colors.textPrimary }]}>Hủy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modalConfirmBtn,
                          {
                            backgroundColor: colors.accent,
                            opacity: isSubmittingModal ? 0.7 : 1,
                          },
                        ]}
                        disabled={isSubmittingModal}
                        onPress={handleConfirmAction}
                      >
                        {isSubmittingModal ? (
                          <ActivityIndicator size="small" color={colors.accentText} />
                        ) : (
                          <Text style={[styles.modalConfirmText, { color: colors.accentText }]}>
                            {modalItem.bookId && isLoggedIn && !canAfford
                              ? `Nạp Khoai`
                              : `Thuê ngay (${modalItem.price})`}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })()}
              </>
            )}
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
  container: { flex: 1 },

  // ---- Header Bar: Chuẩn chữ to 24px như Tủ sách cá nhân, không gạch chân ----
  headerBar: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: FONTS.jakarta,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  bannerSectionHeaderWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  bannerSectionTitle: {
    fontFamily: FONTS.jakarta,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
    textAlign: "center",
  },

  // ---- Carousel Sách Ưu Đãi Cánh Quạt Hero ----
  postersSectionWrap: {
    marginTop: 14,
    marginBottom: 10,
    overflow: "visible",
  },
  posterCard: {
    borderRadius: 18,
    overflow: "visible",
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  posterImageWrap: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
    overflow: "hidden",
  },
  posterTouchable: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  posterImage: {
    width: "100%",
    height: "100%",
  },
  posterFallbackBg: {
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  posterOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.25)",
    justifyContent: "space-between",
  },
  fanDiscountCornerBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    zIndex: 50,
  },
  fanDiscountIconWrap: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: "rgba(0, 0, 0, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  fanDiscountCornerText: {
    fontFamily: FONTS.inter,
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  activePriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  activeOldPrice: {
    fontFamily: FONTS.roboto,
    fontSize: 13,
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  activeNewPrice: {
    fontFamily: FONTS.inter,
    fontSize: 16,
    fontWeight: "900",
  },
  activeDiscountPill: {
    backgroundColor: "rgba(225, 29, 72, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  activeDiscountPillText: {
    fontFamily: FONTS.inter,
    fontSize: 10,
    fontWeight: "900",
    color: "#E11D48",
  },
  activeBookInfoWrap: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 14,
  },
  activePromoTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  activePromoTagText: {
    fontFamily: FONTS.inter,
    fontSize: 10,
    fontWeight: "700",
  },
  activeBookTitle: {
    fontFamily: FONTS.jakarta,
    fontSize: 16.5,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 3,
  },
  activeBookAuthor: {
    fontFamily: FONTS.roboto,
    fontSize: 11.5,
    textAlign: "center",
    marginBottom: 8,
  },
  activeRentBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 9.5,
    borderRadius: 20,
    gap: 6,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  activeRentBtnText: {
    fontFamily: FONTS.jakarta,
    fontSize: 13.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  // ---- Toast ----
  toastPill: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  toastIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toastTitle: { fontFamily: FONTS.jakarta, fontSize: 11.5, fontWeight: "800" },
  toastMsg: { fontFamily: FONTS.roboto, fontSize: 10.5, marginTop: 1 },

  // ---- Section ----
  sectionWrap: { marginBottom: 20 },
  horizontalScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 10,
  },

  // ---- GÓI NẠP KHOAI (HIỂN THỊ HÀNG DỌC) ----
  potatoVerticalList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  potatoVerticalCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  potatoLeftCol: {
    flex: 1,
  },
  potatoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  potatoPackageName: {
    fontFamily: FONTS.jakarta,
    fontSize: 14,
    fontWeight: "800",
  },
  potatoBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  potatoBadgeText: {
    fontFamily: FONTS.inter,
    fontSize: 9.5,
    fontWeight: "800",
  },
  potatoAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  potatoEmoji: { fontSize: 16 },
  potatoAmountNum: {
    fontFamily: FONTS.jakarta,
    fontSize: 18,
    fontWeight: "bold",
  },
  potatoUnit: {
    fontFamily: FONTS.jakarta,
    fontSize: 12,
    fontWeight: "700",
  },
  potatoBonusTag: {
    fontFamily: FONTS.roboto,
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  potatoRightCol: {
    alignItems: "flex-end",
    gap: 6,
  },
  potatoPrice: {
    fontFamily: FONTS.inter,
    fontSize: 13.5,
    fontWeight: "800",
  },
  potatoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  potatoBtnText: {
    fontFamily: FONTS.jakarta,
    fontSize: 11.5,
    fontWeight: "700",
  },

  // ---- MÃ GIẢM GIÁ & TIỆN ÍCH ĐỘC QUYỀN ----
  voucherScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 12,
  },
  voucherCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    justifyContent: "space-between",
  },
  voucherTopArea: {
    gap: 10,
  },
  voucherBannerBox: {
    height: 72,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  voucherIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  voucherTagBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  voucherTagBadgeText: {
    fontFamily: FONTS.jakarta,
    fontSize: 9.5,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  voucherMetaWrap: {
    gap: 3,
  },
  voucherCategoryText: {
    fontFamily: FONTS.jakarta,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  voucherTitleText: {
    fontFamily: FONTS.jakarta,
    fontSize: 14.5,
    fontWeight: "800",
    lineHeight: 19,
  },
  voucherFeaturesList: {
    borderTopWidth: 1,
    paddingTop: 8,
    gap: 5,
  },
  voucherFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  voucherFeatureText: {
    fontFamily: FONTS.roboto,
    fontSize: 11.5,
    flex: 1,
  },
  voucherBottomArea: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10,
    gap: 10,
  },
  voucherCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  voucherCodeBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  voucherCodeText: {
    fontFamily: FONTS.jakarta,
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  voucherCostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  voucherCostEmoji: {
    fontSize: 13,
  },
  voucherCostNum: {
    fontFamily: FONTS.jakarta,
    fontSize: 14,
    fontWeight: "800",
  },
  voucherCostLabel: {
    fontFamily: FONTS.jakarta,
    fontSize: 11,
    fontWeight: "700",
  },
  voucherActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8.5,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  voucherActionBtnText: {
    fontFamily: FONTS.jakarta,
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  // ---- SÁCH ƯU ĐÃI ----
  bookCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 6,
    justifyContent: "space-between",
    overflow: "visible",
  },
  bookCoverFrame: {
    width: "100%",
    height: 220,
    borderRadius: 8,
    overflow: "visible",
    backgroundColor: "#F3F4F6",
    marginBottom: 6,
    position: "relative",
  },
  bookCoverImgWrap: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    overflow: "hidden",
  },
  bookCoverImg: {
    width: "100%",
    height: "100%",
  },
  bookCoverPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  bookDiscountBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    zIndex: 20,
  },
  bookDiscountBadgeText: {
    fontFamily: FONTS.inter,
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  bookTitle: {
    fontFamily: FONTS.jakarta,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    minHeight: 18,
    marginBottom: 4,
  },
  bookFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  bookPriceWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
  },
  bookOldPrice: {
    fontFamily: FONTS.roboto,
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  bookPrice: {
    fontFamily: FONTS.inter,
    fontSize: 14,
    fontWeight: "800",
  },
  bookRentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  bookRentBtnText: {
    fontFamily: FONTS.jakarta,
    fontSize: 11,
    fontWeight: "800",
  },

  // ---- Books Loading/Error States ----
  booksLoadingBox: {
    paddingVertical: 20,
    alignItems: "center",
    gap: 6,
  },
  booksLoadingText: { fontFamily: FONTS.roboto, fontSize: 11, fontWeight: "600" },
  booksErrorBox: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 4,
  },
  booksErrorText: { fontFamily: FONTS.roboto, fontSize: 11, textAlign: "center" },
  booksEmptyBox: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  booksEmptyTitle: {
    fontFamily: FONTS.jakarta,
    fontSize: 13.5,
    fontWeight: "700",
    textAlign: "center",
  },
  booksEmptySub: {
    fontFamily: FONTS.roboto,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    maxWidth: 290,
  },

  // ---- Modals ----
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalBox: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  modalHeading: { fontFamily: FONTS.jakarta, fontSize: 14.5, fontWeight: "900" },
  modalDescLabel: { fontFamily: FONTS.inter, fontSize: 10, fontWeight: "600" },
  modalMetaRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  modalMetaCol: { flex: 1, padding: 7, borderRadius: 8, borderWidth: 1 },
  modalMetaLabel: { fontFamily: FONTS.roboto, fontSize: 9.5 },
  modalMetaVal: { fontFamily: FONTS.inter, fontSize: 11.5, fontWeight: "800", marginTop: 1 },
  modalBtnRow: { flexDirection: "row", gap: 8 },
  modalCancelBtn: {
    flex: 1,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: { fontFamily: FONTS.inter, fontSize: 11, fontWeight: "700" },
  modalConfirmBtn: {
    flex: 1.5,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmText: { fontFamily: FONTS.jakarta, color: "#FFF", fontSize: 11, fontWeight: "800" },
  durationPickerWrap: { marginBottom: 10 },
  durationChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  durationChip: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  durationChipTitle: { fontFamily: FONTS.inter, fontSize: 10.5, fontWeight: "700" },
  durationChipPrice: { fontFamily: FONTS.inter, fontSize: 10.5, fontWeight: "800" },
});
