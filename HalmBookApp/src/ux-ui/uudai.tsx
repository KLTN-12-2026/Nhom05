import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Clipboard from "expo-clipboard";
import * as Font from "expo-font";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  BackHandler,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE_URL, CANDIDATE_API_URLS as CANDIDATE_URLS } from './apiService';
import { getBookCoverSource } from "./bookCovers";
import ComboOfferRow from './ComboOfferRow';
import type { CommercePolicy } from './commercePolicy';
import { useAppNavigation, useAutoHideFooter } from "./navigation";
import { addOfferToCart, applyPromotionToCart, BookOffer, fetchOffers, offerRow } from './offersService';
import {
  addToCartApi,
  fetchWalletBalanceApi,
} from "./rentalService";
import ScallopDiscountBadge from "./ScallopDiscountBadge";
import { useMissionVisit } from './useMissionTracking';

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
  const { navigate, isDarkMode, isLoggedIn, showLoginAlert, lang } =
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
  const [bookOffers, setBookOffers] = useState<BookOffer[]>([]);
  const [offerPolicy, setOfferPolicy] = useState<CommercePolicy | null>(null);

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
    offerId?: string;
    couponCode?: string;
    planKey?: string;
  } | null>(null);
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
  useMissionVisit('OFFERS', isLoggedIn);

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

  // Refresh only public offer APIs, including empty lists after admin disables the last offer.
  useEffect(() => {
    const controller = new AbortController(); let pending = false, shown = false; let toastTimer: ReturnType<typeof setTimeout> | undefined;
    const refresh = async () => {
      if (pending || AppState.currentState !== 'active') return; pending = true;
      try {
        const data = await fetchOffers(controller.signal);
        if (!controller.signal.aborted) { setPromotions(data.promotions as PromotionItem[]); setBookOffers(data.offers); setOfferPolicy(data.policy); shown = false; }
      } catch {
        if (!controller.signal.aborted) {
          setPromotions([]); setBookOffers([]); setOfferPolicy(null);
          if (!shown) { shown = true; setToast({ visible: true, title: 'Chưa tải được ưu đãi', message: 'Vui lòng kiểm tra kết nối và mở lại trang.' }); toastTimer = setTimeout(() => setToast(p => ({ ...p, visible: false })), 3500); }
        }
      } finally { pending = false; }
    };
    void refresh(); const timer = setInterval(() => { void refresh(); }, 30000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { controller.abort(); clearInterval(timer); if (toastTimer) clearTimeout(toastTimer); listener.remove(); };
  }, []);

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

  const [singleDeals, setSingleDeals] = useState<any[]>([]);
  const [selectedCombo, setSelectedCombo] = useState<any | null>(null);
  const [isSubmittingCombo, setIsSubmittingCombo] = useState<boolean>(false);

  // 2. Fetch Offers & Promotions từ API
  const fetchPromotionsData = async (signal?: AbortSignal) => {
    try {
      const data = await fetchOffers(signal);
      setPromotions(data.promotions as PromotionItem[]);
      setBookOffers(data.offers);
      setOfferPolicy(data.policy);
    } catch { }
  };

  // 4. Fetch danh mục Sách Lẻ Giảm Sâu từ Cache cục bộ nếu có
  const fetchSingleDeals = async (_signal?: AbortSignal) => {
    try {
      const cached = await AsyncStorage.getItem("halm_offer_single_deals_v1");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSingleDeals(parsed);
        }
      }
    } catch { }
  };

  // Nạp dữ liệu lần đầu khi vào màn hình
  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrate promotions, packages, and books on mount.
    fetchPackages(controller.signal);
    fetchPromotionsData(controller.signal);
    fetchBooks(controller.signal);
    fetchSingleDeals(controller.signal);
    return () => controller.abort();
  }, []);

  // Xử lý nút Back phần cứng trên Android khi đang ở Màn hình riêng Combo sách
  useEffect(() => {
    if (!selectedCombo) return;
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      setSelectedCombo(null);
      return true;
    });
    return () => backHandler.remove();
  }, [selectedCombo]);

  // Kéo xuống để làm mới (Pull-to-refresh) dữ liệu từ Database
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchPackages(),
        fetchPromotionsData(),
        fetchBooks(),
        fetchSingleDeals(),
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
  // 1. SÁCH LẺ GIẢM SÂU TỪ ADMIN (DÀNH CHO HERO BANNER CÁNH QUẠT)
  // Chỉ hiển thị đúng các cuốn sách được Admin thêm vào mục "Sách Lẻ Giảm Sâu"
  // Hỗ trợ cả API book-offers (trên main) và bảng promotion
  // Nếu Admin chưa thêm cuốn nào thì danh sách sẽ rỗng (không tự động lấy sách khác đắp vào)
  // ==============================================================
  const adminSingleDeals = useMemo(() => {
    const result: any[] = [];
    const addedBookIds = new Set<string>();

    // 1. Ưu tiên số 1: Sách lẻ giảm sâu từ /api/home/book-offers (kind === 'SINGLE') của hệ thống
    const singleOffers = bookOffers.filter((o) => o && o.kind === "SINGLE");
    singleOffers.forEach((offer) => {
      const row = offerRow(offer);
      const bId = String(offer.bookIds?.[0] || offer.id || "").trim();
      const pct = offer.originalPotato > 0
        ? Math.max(0, Math.round((1 - offer.potato / offer.originalPotato) * 100))
        : (parseInt(String(offer.discount || "50").replace(/[^0-9]/g, ""), 10) || 50);

      // Khớp trong realBooks
      const matched = realBooks.find((b) => {
        const id = String(b.book_id || "").trim().toUpperCase();
        return bId && id === bId.toUpperCase();
      });

      if (matched) {
        addedBookIds.add(String(matched.book_id).toUpperCase());
        result.push({
          ...matched,
          rent_price: offer.potato,
          original_price: offer.originalPotato,
          discount_percent: pct,
          promo_name: offer.discount ? `Giảm ${offer.discount} - ${offer.name}` : offer.name,
          offerId: offer.id,
          planKey: offer.planKey,
        });
      } else {
        if (bId) addedBookIds.add(bId.toUpperCase());
        result.push({
          book_id: bId || offer.id,
          bookName: offer.name,
          author: offer.author || "HALM BOOK",
          img_url: offer.img || row.img_url || null,
          rent_price: offer.potato,
          original_price: offer.originalPotato,
          discount_percent: pct,
          promo_name: offer.discount ? `Giảm ${offer.discount} - ${offer.name}` : offer.name,
          category_name: offer.category || "Sách Chọn Lọc",
          description: offer.desc || null,
          category_id: null,
          readCount: 0,
          offerId: offer.id,
          planKey: offer.planKey,
        });
      }
    });

    // 2. Thu thập tất cả các Deal "Sách lẻ giảm sâu" từ CSDL MySQL (promotions) và Cache
    const allDeals: any[] = [];
    const seenDealKeys = new Set<string>(addedBookIds);

    // A. Lấy từ bảng promotions trong CSDL (do Admin vừa thêm hoặc đã lưu)
    promotions.forEach((p) => {
      const pid = String(p.promotion_id || "").trim();
      const isDeal = pid.startsWith("DEAL_") || (p.description && String(p.description).includes('"isSingleDeal"'));
      if (isDeal) {
        let meta: any = {};
        try {
          if (p.description && p.description.trim().startsWith("{")) {
            meta = JSON.parse(p.description);
          }
        } catch { }

        const bId = meta.book_id || (pid.startsWith("DEAL_") ? pid.replace(/^DEAL_/, "") : "");
        const pct = p.discount_percent > 0 ? p.discount_percent : (parseInt(String(meta.discount || "50").replace(/[^0-9]/g, ""), 10) || 50);

        const dealObj = {
          id: pid,
          book_id: bId,
          name: meta.name || p.promotion_name || "Sách Giảm Sâu",
          author: meta.author || "HALM BOOK",
          potato: meta.potato !== undefined ? Number(meta.potato) : Math.max(1, Math.round(15 * (1 - pct / 100))),
          originalPotato: meta.originalPotato !== undefined ? Number(meta.originalPotato) : 15,
          discount: meta.discount || `-${pct}%`,
          category: meta.category || "Sách Chọn Lọc",
          img: meta.img || null,
        };

        const key = String(bId || pid).toUpperCase();
        if (!seenDealKeys.has(key)) {
          seenDealKeys.add(key);
          allDeals.push(dealObj);
        }
      }
    });

    // B. Bổ sung từ cache local singleDeals nếu có
    singleDeals.forEach((d) => {
      if (!d) return;
      const key = String(d.book_id || d.id || "").toUpperCase();
      if (key && !seenDealKeys.has(key)) {
        seenDealKeys.add(key);
        allDeals.push(d);
      }
    });

    // C. Xử lý từng deal: Khớp với realBooks hoặc tạo item hiển thị
    allDeals.forEach((deal, idx) => {
      const dealBookId = String(deal.book_id || deal.id || "").trim().toUpperCase();
      const dealNameNorm = (deal.name || "").trim().toLowerCase();

      // Khớp trong realBooks theo book_id hoặc theo tên tác phẩm
      const matched = realBooks.find((b) => {
        const bid = String(b.book_id || "").trim().toUpperCase();
        if (dealBookId && bid === dealBookId) return true;
        const bTitle = (b.bookName || "").trim().toLowerCase();
        return dealNameNorm && bTitle === dealNameNorm;
      });

      const pct = parseInt(String(deal.discount || "50").replace(/[^0-9]/g, ""), 10) || 50;

      if (matched) {
        const mBid = String(matched.book_id || "").trim().toUpperCase();
        addedBookIds.add(mBid);
        const base = matched.rent_price ?? (deal.originalPotato || 15);
        const discPrice = deal.potato !== undefined ? Number(deal.potato) : Math.max(1, Math.round((base * (100 - pct)) / 100));
        result.push({
          ...matched,
          rent_price: discPrice,
          original_price: base,
          discount_percent: pct,
          promo_name: deal.discount ? `Giảm ${pct}% - ${deal.name}` : (deal.name || `Giảm ${pct}%`),
        });
      } else if (deal.name) {
        const id = deal.book_id || deal.id || `deal-${idx}`;
        addedBookIds.add(String(id).toUpperCase());
        let imgUrl = deal.img || null;
        if (imgUrl && typeof imgUrl === "string" && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(imgUrl)) {
          const imagePath = imgUrl.startsWith("/") ? imgUrl : `/${imgUrl}`;
          imgUrl = API_BASE_URL + imagePath;
        }
        result.push({
          book_id: id,
          bookName: deal.name,
          author: deal.author || "HALM BOOK",
          img_url: imgUrl,
          rent_price: Number(deal.potato) || 8,
          original_price: Number(deal.originalPotato) || 16,
          discount_percent: pct,
          promo_name: deal.discount ? `Giảm ${pct}% - ${deal.name}` : deal.name,
          category_name: deal.category || "Sách Chọn Lọc",
          description: null,
          category_id: null,
          readCount: 0,
        });
      }
    });

    return result;
  }, [bookOffers, realBooks, promotions, singleDeals]);

  // Sách ưu đãi từ mã khuyến mãi database thông thường (P003, P005...)
  const dbPromotionalBooks = useMemo(() => {
    const result: any[] = [];
    const activeNormalPromos = promotions.filter(
      (p) =>
        (!p.status || p.status.toUpperCase() === "ACTIVE") &&
        !String(p.promotion_id || "").startsWith("DEAL_") &&
        !(p.description && String(p.description).includes('"isSingleDeal"'))
    );

    if (activeNormalPromos.length === 0 || realBooks.length === 0) return [];

    const promoByBookId = new Map<string, PromotionItem>();
    activeNormalPromos.forEach((p) => {
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

    realBooks.forEach((book) => {
      const bid = String(book.book_id || "").trim().toUpperCase();
      let promo = promoByBookId.get(bid);
      if (!promo) {
        const bTitleNorm = (book.bookName || "").trim().toLowerCase();
        if (bTitleNorm) {
          promo = activeNormalPromos.find((p) => {
            const pName = (p.promotion_name || "").toLowerCase();
            const pDesc = (p.description || "").toLowerCase();
            return pName.includes(bTitleNorm) || pDesc.includes(bTitleNorm);
          });
        }
      }

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

  // Backward compatibility alias
  const promotionalBooks = adminSingleDeals;

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
  // Tổng hợp tất cả các sách được giảm giá: sách giảm sâu từ Admin,
  // sách khuyến mãi theo ID trong DB và sách giảm giá theo thể loại.
  // ==============================================================
  const displayDiscountBooks = useMemo(() => {
    const map = new Map<string, any>();

    // 1. Thêm từ adminSingleDeals (Sách lẻ giảm sâu do Admin cấu hình)
    adminSingleDeals.forEach((book) => {
      const bid = String(book.book_id || "").trim();
      if (bid) {
        map.set(bid, book);
      }
    });

    // 2. Thêm từ dbPromotionalBooks (Sách khuyến mãi thông thường từ DB)
    dbPromotionalBooks.forEach((book) => {
      const bid = String(book.book_id || "").trim();
      if (bid && !map.has(bid)) {
        map.set(bid, book);
      }
    });

    // 3. Thêm từ categoryPromotionalBooks (Sách được giảm giá theo thể loại)
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
  }, [adminSingleDeals, dbPromotionalBooks, categoryPromotionalBooks]);

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
  // (Lọc bỏ các deal sách lẻ giảm sâu để chỉ hiển thị các Voucher thực thụ)
  // ==============================================================
  const voucherOffers = useMemo(() => {
    if (promotions.length === 0) return [];
    const normalPromos = promotions.filter(
      (p) =>
        !String(p.promotion_id || "").startsWith("DEAL_") &&
        !(p.description && String(p.description).includes('"isSingleDeal"'))
    );
    return normalPromos.map((p) => {
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

  // Sách hiển thị trên Hero Banner Cánh Quạt:
  // CHỈ hiển thị đúng các cuốn sách mà Admin cấu hình từ mục "Sách Lẻ Giảm Sâu" (adminSingleDeals)
  // Nếu Admin chưa thêm cuốn nào trong mục này thì banner sẽ không hiển thị sách (rỗng)
  const heroBannerBooks = useMemo(() => {
    return adminSingleDeals;
  }, [adminSingleDeals]);

  // ==============================================================
  // CẤU HÌNH CAROUSEL CÁNH QUẠT & VÒNG LẶP VÔ TẬN TỪ SÁCH DATABASE
  // ==============================================================
  const promoCount = heroBannerBooks.length;
  // Khi chỉ có 1 sách: hiển thị đơn lẻ tĩnh, KHÔNG nhân bản 5 bản để chạy loop
  // Khi có từ 2 sách trở lên: chạy carousel cánh quạt với số vòng lặp tương ứng
  const isMultiBanner = promoCount > 1;
  const loopCopies = promoCount >= 3 ? 7 : (promoCount === 2 ? 6 : 0);
  const middleCopyIdx = Math.floor(loopCopies / 2);
  const startIndex = isMultiBanner ? middleCopyIdx * promoCount : 0;

  const loopBooks = useMemo(() => {
    if (!isMultiBanner) return [];
    return Array.from({ length: loopCopies }).flatMap((_, copyIdx) =>
      heroBannerBooks.map((book, itemIdx) => ({
        ...book,
        loopKey: `copy-${copyIdx}-book-${book.book_id}-${itemIdx}`,
        originalIndex: itemIdx,
      }))
    );
  }, [heroBannerBooks, isMultiBanner, loopCopies]);

  // Căn giữa sách đầu tiên ngay khi danh sách sách khuyến mãi được tải xong (chỉ khi có > 1 sách)
  useEffect(() => {
    if (isMultiBanner) {
      const initialX = startIndex * posterItemSize;
      (scrollRef.current as any)?.scrollTo({ x: initialX, animated: false });
      scrollX.setValue(initialX);
    }
  }, [isMultiBanner, startIndex, posterItemSize]);

  // Lắng nghe scrollX để đồng bộ chấm Pagination
  useEffect(() => {
    if (!isMultiBanner) return;
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
  }, [posterItemSize, promoCount, isMultiBanner]);

  const handleFanLayout = () => {
    if (!hasInitializedOffset.current && isMultiBanner) {
      hasInitializedOffset.current = true;
      (scrollRef.current as any)?.scrollTo({
        x: startIndex * posterItemSize,
        animated: false,
      });
      scrollX.setValue(startIndex * posterItemSize);
    }
  };

  const handleMomentumScrollEnd = (e: any) => {
    if (!isMultiBanner) return;
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
    // Nếu là combo sách: Mở màn hình/modal chi tiết combo
    if (
      book.kind === "COMBO" ||
      book.rawOffer ||
      (book.offerId && bookOffers.some((o) => o.id === book.offerId && o.kind === "COMBO"))
    ) {
      const comboOffer = book.rawOffer || bookOffers.find((o) => o.id === book.offerId) || book;
      setSelectedCombo(comboOffer);
      return;
    }

    const rentPrice = book.rent_price ?? 11;
    if (isLoggedIn) {
      fetchWalletBalanceApi().then((bal) => {
        if (bal !== null) setKhoaiBalance(bal);
      });
    }
    setModalItem({
      title: book.bookName,
      description: book.description || "Sách đọc trực tuyến ưu đãi tại HalmBook.",
      price: book.priceLabel || `${rentPrice} 🥔`,
      priceNumeric: rentPrice,
      actionText: "Thuê Sách",
      bookId: book.book_id,
      offerId: book.offerId, couponCode: book.couponCode, planKey: book.planKey,
      basePrice: rentPrice,
    });
  };

  // Mua ngay combo sách: Thêm combo vào giỏ hàng và chuyển đến giỏ hàng
  const handleBuyCombo = async (combo: any) => {
    if (!combo || isSubmittingCombo) return;
    if (!isLoggedIn) {
      setSelectedCombo(null);
      showLoginAlert("Bạn phải đăng nhập để mua combo sách!");
      return;
    }

    setIsSubmittingCombo(true);
    try {
      const offerId = combo.id || combo.offerId;
      const result = await addOfferToCart(offerId);
      if (!result.success) {
        Alert.alert("Mua combo", result.message || "Không thể thêm combo vào giỏ hàng.");
        return;
      }
      setSelectedCombo(null);
      navigate("cart");
    } catch (error: any) {
      Alert.alert(
        "Mua combo",
        error?.response?.data?.message || error?.message || "Chưa tải được biểu giá combo. Vui lòng thử lại."
      );
    } finally {
      setIsSubmittingCombo(false);
    }
  };

  // Danh sách các cuốn sách nằm trong Combo được chọn
  const selectedComboBooks = useMemo(() => {
    if (!selectedCombo) return [];
    const details: any[] = Array.isArray(selectedCombo.bookDetails) ? selectedCombo.bookDetails : [];
    const bookIds: string[] = Array.isArray(selectedCombo.bookIds) ? selectedCombo.bookIds : [];
    const books: string[] = Array.isArray(selectedCombo.books) ? selectedCombo.books : [];

    const maxLen = Math.max(details.length, bookIds.length, books.length);
    const result: any[] = [];

    for (let i = 0; i < maxLen; i++) {
      const detail = details[i] || {};
      const bId = bookIds[i] || detail.book_id;
      const bName = books[i] || detail.bookName || detail.title;

      const matched = realBooks.find((b: any) => {
        const matchId = bId && String(b.book_id).trim().toUpperCase() === String(bId).trim().toUpperCase();
        const matchName = bName && String(b.bookName || (b as any).title || "").trim().toLowerCase() === String(bName).trim().toLowerCase();
        return matchId || matchName;
      });

      result.push({
        book_id: bId || matched?.book_id || `combo-b-${i}`,
        bookName: bName || matched?.bookName || (matched as any)?.title || detail.bookName || `Sách #${i + 1}`,
        author: detail.author || matched?.author || "HALM BOOK",
        img_url: detail.img_url || matched?.img_url || null,
        rent_price: detail.rent_price || matched?.rent_price || null,
        category_name: detail.category_name || matched?.category_name || null,
        description: detail.description || matched?.description || null,
        ...matched,
      });
    }
    return result;
  }, [selectedCombo, realBooks]);

  // Cuốn sách đang được chọn / nằm ở trung tâm của Carousel cánh quạt
  const activeBook = heroBannerBooks[activeDot] || heroBannerBooks[0] || null;

  // Thuê sách thật từ catalog DB
  const handleConfirmAction = async () => {
    if (!modalItem || isSubmittingModal) return;

    if (modalItem.bookId || modalItem.offerId || modalItem.couponCode) {
      if (!isLoggedIn) {
        setModalItem(null);
        showLoginAlert("Bạn phải đăng nhập để thuê sách và đồng bộ vào Tủ sách!");
        return;
      }

      setIsSubmittingModal(true);
      try {
        const result = modalItem.offerId ? await addOfferToCart(modalItem.offerId)
          : modalItem.couponCode ? await applyPromotionToCart(modalItem.couponCode, modalItem.bookId, modalItem.planKey)
            : await addToCartApi(modalItem.bookId!, undefined, modalItem.basePrice);
        if (!result.success) { Alert.alert('Thuê sách', result.message); return; }
        setModalItem(null); navigate('cart');
      } catch (error: any) { Alert.alert('Thuê sách', error?.response?.data?.message || error?.message || 'Chưa tải được biểu giá. Vui lòng thử lại.'); }
      finally { setIsSubmittingModal(false); }
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
    const isCombo = book.kind === "COMBO" || !!book.rawOffer;

    return (
      <TouchableOpacity
        key={`${book.book_id || book.offerId || "item"}-${_index}`}
        style={[
          styles.bookCard,
          isCombo && styles.comboCardFullFrame,
          {
            width: bookCardWidth,
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          },
        ]}
        onPress={() => handleOpenBookModal(book)}
        activeOpacity={0.85}
      >
        <View style={[styles.bookCoverFrame, isCombo && styles.comboCoverFrameFull]}>
          <View style={[styles.bookCoverImgWrap, isCombo && styles.comboCoverImgWrapFull]}>
            {coverSource ? (
              <Image source={coverSource} style={styles.bookCoverImg} resizeMode="cover" />
            ) : (
              <View style={[styles.bookCoverPlaceholder, { backgroundColor: colors.chipBg }]}>
                <MaterialCommunityIcons name={isCombo ? "bookshelf" : "book-open-variant"} size={26} color={colors.textSecondary} />
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

        <View style={isCombo ? styles.comboCardContentWrap : undefined}>
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
                {book.couponOnly ? "" : originalPrice + " 🥔"}
              </Text>
              <Text style={[styles.bookPrice, { color: colors.promoBookColor }]}>
                {book.priceLabel || rentPrice + " 🥔"}
              </Text>
            </View>
            <View style={[styles.bookRentBtn, { backgroundColor: colors.promoBookColor }]}>
              <Text style={[styles.bookRentBtnText, { color: "#FFFFFF" }]}>
                {isCombo ? "Mua ngay" : "Thuê"}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ==============================================================
  // NẾU ĐANG CHỌN XEM COMBO SÁCH -> HIỂN THỊ MÀN HÌNH RIÊNG CÓ NÚT THOÁT RA
  // ==============================================================
  if (selectedCombo) {
    const comboImg = selectedCombo.img || selectedCombo.img_url || selectedCombo.bookDetails?.[0]?.img_url;
    const comboCoverSource = getBookCoverSource(undefined, comboImg);
    const rentPrice = selectedCombo.potato ?? selectedCombo.rent_price ?? 0;
    const comboTitle = selectedCombo.name || selectedCombo.bookName || "Combo Sách Đặc Biệt";
    const comboDesc = selectedCombo.desc || selectedCombo.description;
    const bookCount = selectedComboBooks.length;
    const posterCardSize = Math.min(Math.round(windowWidth * 0.72), 276);
    const displayComboPrice =
      rentPrice > 0 && rentPrice !== 99 ? `${rentPrice} 🥔` : "14 🥔";

    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: "#FFFFFF",
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        <ExpoStatusBar style="dark" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 24) + 48,
          }}
        >
          {/* KHU VỰC ẢNH NỀN + POSTER VUÔNG PHÍA TRÊN (KHÔNG CHE CHỮ BÊN DƯỚI) */}
          <View
            style={[
              styles.comboShotHeroWrap,
              { paddingTop: insets.top + 10 },
            ]}
          >
            {/* ẢNH NỀN COMBO MỜ PHÍA SAU KHUNG VUÔNG + FADE MƯỢT VỀ TRẮNG TRƯỚC PHẦN CHỮ */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {comboCoverSource && (
                <Image
                  source={comboCoverSource}
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      opacity: 0.28,
                      transform: [{ scale: 1.16 }],
                    },
                  ]}
                  resizeMode="cover"
                />
              )}
              <View style={styles.comboShotFadeStep1} />
              <View style={styles.comboShotFadeStep2} />
              <View style={styles.comboShotFadeStep3} />
            </View>

            {/* HÀNG NÚT TRÊN CÙNG: CHỈ CÒN NÚT MŨI TÊN QUAY LẠI (ĐÃ BỎ ICON CHIA SẺ) */}
            <View style={styles.comboShotTopBar}>
              <TouchableOpacity
                style={styles.comboShotTopIconBtn}
                onPress={() => setSelectedCombo(null)}
                activeOpacity={0.75}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="arrow-back" size={22} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* 1. KHUNG POSTER VUÔNG BO GÓC Ở TRUNG TÂM */}
            <View style={styles.comboShotPosterWrap}>
              <View
                style={[
                  styles.comboShotPosterCard,
                  { width: posterCardSize, height: posterCardSize },
                ]}
              >
                {comboCoverSource ? (
                  <Image
                    source={comboCoverSource}
                    style={styles.comboShotPosterImg}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.comboShotPosterFallback}>
                    <MaterialCommunityIcons name="bookshelf" size={64} color="#E11D48" />
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* KHU VỰC TIÊU ĐỀ, GIÁ KHOAI & NÚT MUA TRÊN NỀN TRẮNG SẠCH SẼ */}
          <View style={styles.comboShotInfoSection}>
            {/* 2. TÊN COMBO CĂN GIỮA */}
            <Text style={styles.comboShotTitle} numberOfLines={2}>
              {comboTitle}
            </Text>

            {comboDesc ? (
              <Text style={styles.comboShotDesc} numberOfLines={2}>
                {comboDesc}
              </Text>
            ) : null}

            {/* 3. DÒNG THÔNG TIN: SỐ LƯỢNG SÁCH BÊN TRÁI - GIÁ KHOAI BÊN PHẢI */}
            <View style={styles.comboShotMetaRow}>
              <Text style={styles.comboShotCountText}>
                Số lượng sách: {bookCount}
              </Text>
              <Text style={styles.comboShotPriceText}>
                {displayComboPrice}
              </Text>
            </View>

            {/* 4. NÚT XANH NGỌC PILL "MUA NGAY COMBO" */}
            <TouchableOpacity
              style={[
                styles.comboShotBuyBtn,
                { opacity: isSubmittingCombo ? 0.75 : 1 },
              ]}
              onPress={() => handleBuyCombo(selectedCombo)}
              disabled={isSubmittingCombo}
              activeOpacity={0.85}
            >
              {isSubmittingCombo ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.comboShotBuyBtnText}>
                  MUA NGAY COMBO
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* KHU VỰC PHÍA DƯỚI: DANH SÁCH SÁCH TRONG COMBO TRÊN NỀN TRẮNG */}
          <View style={styles.comboShotListSection}>
            <View style={styles.comboShotListHeader}>
              <Ionicons name="checkmark-circle" size={19} color="#16C784" />
              <Text style={styles.comboShotListHeaderTitle}>
                Combo bao gồm ({bookCount} cuốn):
              </Text>
            </View>

            <View style={styles.comboShotBooksWrap}>
              {selectedComboBooks.map((bookItem: any, idx: number) => {
                const bookCover = getBookCoverSource(bookItem.book_id, bookItem.img_url);
                return (
                  <TouchableOpacity
                    key={bookItem.book_id || idx}
                    style={styles.comboShotBookCard}
                    activeOpacity={0.82}
                    onPress={() => {
                      setSelectedCombo(null);
                      navigate("bookDetail", bookItem);
                    }}
                  >
                    <View style={styles.comboShotBookThumbWrap}>
                      {bookCover ? (
                        <Image
                          source={bookCover}
                          style={styles.comboShotPosterImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.comboShotBookThumbFallback}>
                          <MaterialCommunityIcons name="book-open-page-variant" size={22} color="#94A3B8" />
                        </View>
                      )}
                    </View>

                    <View style={styles.comboShotBookInfo}>
                      <Text style={styles.comboShotBookTitle} numberOfLines={2}>
                        {bookItem.bookName}
                      </Text>
                      <Text style={styles.comboShotBookAuthor} numberOfLines={1}>
                        {bookItem.author || "HALM BOOK"}
                      </Text>
                      {bookItem.category_name ? (
                        <View style={styles.comboShotBookCatBadge}>
                          <Text style={styles.comboShotBookCatText}>
                            {bookItem.category_name}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.comboShotBookTag}>
                      <Ionicons name="checkmark" size={13} color="#16C784" />
                      <Text style={styles.comboShotBookTagText}>
                        {bookItem.rent_price ? `${bookItem.rent_price} 🥔` : "Trong gói"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

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
            BANNER / CAROUSEL SÁCH ƯU ĐÃI DATABASE
            - Khi có đúng 1 sách: Hiển thị 1 thẻ sách duy nhất, không nhân bản lặp
            - Khi có từ 2 sách trở lên: Hiển thị Carousel hình cánh quạt 3D
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

            {heroBannerBooks.length === 1 ? (
              // HIỂN THỊ ĐƠN LẺ KHI CHỈ CÓ 1 SÁCH
              (() => {
                const singleBook = heroBannerBooks[0];
                const coverSource = getBookCoverSource(singleBook.book_id, singleBook.img_url || undefined);
                const rentPrice = singleBook.rent_price ?? 11;
                const originalPrice = singleBook.original_price ?? Math.round(rentPrice * 1.33);
                const discountPct = singleBook.discount_percent ?? 20;

                return (
                  <View style={styles.singleBannerCardWrap}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => handleOpenBookModal(singleBook)}
                      style={[
                        styles.singlePosterCard,
                        {
                          width: posterWidth,
                          height: posterHeight,
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

                        {/* GÓC TRÊN BÊN PHẢI: ICON HOA THỊ GIẢM GIÁ */}
                        <ScallopDiscountBadge
                          percent={discountPct}
                          size={52}
                          style={styles.fanDiscountCornerBadge}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* THÔNG TIN CUỐN SÁCH DUY NHẤT */}
                    <View style={styles.activeBookInfoWrap}>
                      {singleBook.promo_name ? (
                        <View style={[styles.activePromoTag, { backgroundColor: colors.goldLight }]}>
                          <MaterialCommunityIcons name="sale" size={11} color={colors.gold} />
                          <Text style={[styles.activePromoTagText, { color: colors.gold }]}>
                            {singleBook.promo_name}
                          </Text>
                        </View>
                      ) : null}

                      {/* TÊN SÁCH NỔI BẬT */}
                      <Text
                        style={[styles.activeBookTitle, { color: colors.textPrimary }]}
                        numberOfLines={2}
                      >
                        {singleBook.bookName}
                      </Text>

                      {/* TÁC GIẢ */}
                      {singleBook.author ? (
                        <Text
                          style={[styles.activeBookAuthor, { color: colors.textSecondary }]}
                          numberOfLines={1}
                        >
                          {singleBook.author}
                        </Text>
                      ) : null}

                      {/* GIÁ KHOAI VỚI GẠCH */}
                      <View style={styles.activePriceRow}>
                        <Text style={[styles.activeOldPrice, { color: colors.textSecondary }]}>
                          {originalPrice} 🥔
                        </Text>
                        <Text style={[styles.activeNewPrice, { color: colors.bannerPink }]}>
                          {rentPrice} 🥔
                        </Text>
                        <View style={styles.activeDiscountPill}>
                          <Text style={styles.activeDiscountPillText}>
                            -{discountPct}%
                          </Text>
                        </View>
                      </View>

                      {/* NÚT THUÊ */}
                      <TouchableOpacity
                        style={[styles.activeRentBtn, { backgroundColor: colors.bannerPink }]}
                        onPress={() => handleOpenBookModal(singleBook)}
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
                  </View>
                );
              })()
            ) : (
              // HIỂN THỊ CAROUSEL CÁNH QUẠT KHI CÓ TỪ 2 SÁCH TRỞ LÊN
              <>
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
              </>
            )}
          </View>
        )}

        <ComboOfferRow
          offers={bookOffers.filter(offer => offer.kind === 'COMBO')}
          styles={styles}
          colors={colors}
          SectionHeader={CleanSectionHeader}
          renderCard={renderDiscountBookCard}
          onSelectCombo={(offer) => setSelectedCombo(offer)}
        />

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
                  const effectivePriceLabel = modalItem.bookId ? "Xem tại giỏ hàng" : modalItem.price;
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
                            {modalItem.couponCode && !modalItem.bookId ? 'Áp dụng mã vào giỏ hàng' : 'Tiếp tục tới giỏ hàng'}
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
  singleBannerCardWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
    paddingBottom: 6,
  },
  singlePosterCard: {
    borderRadius: 18,
    overflow: "visible",
    backgroundColor: "transparent",
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
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

  // ---- Màn Hình Chi Tiết Combo Theo Mẫu Ảnh (Nền Trắng) ----
  comboShotHeroWrap: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    paddingBottom: 20,
  },
  comboShotFadeStep1: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 96,
    backgroundColor: "rgba(255, 255, 255, 0.42)",
  },
  comboShotFadeStep2: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 58,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
  },
  comboShotFadeStep3: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 24,
    backgroundColor: "#FFFFFF",
  },
  comboShotTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 8,
    zIndex: 10,
  },
  comboShotTopIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  comboShotPosterWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 4,
    zIndex: 5,
  },
  comboShotInfoSection: {
    backgroundColor: "#FFFFFF",
    paddingTop: 10,
    paddingBottom: 18,
    zIndex: 6,
  },
  comboShotPosterCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 14,
  },
  comboShotPosterImg: {
    width: "100%",
    height: "100%",
  },
  comboShotPosterFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  comboShotTitle: {
    fontFamily: FONTS.jakarta,
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    paddingHorizontal: 24,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  comboShotDesc: {
    fontFamily: FONTS.inter,
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: 28,
    lineHeight: 19,
    marginBottom: 10,
  },
  comboShotMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    marginTop: 4,
    marginBottom: 18,
  },
  comboShotCountText: {
    fontFamily: FONTS.inter,
    fontSize: 15,
    fontWeight: "500",
    color: "#334155",
  },
  comboShotPriceText: {
    fontFamily: FONTS.jakarta,
    fontSize: 17.5,
    fontWeight: "800",
    color: "#E11D48",
  },
  comboShotBuyBtn: {
    height: 50,
    borderRadius: 999,
    backgroundColor: "#16C784",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 28,
  },
  comboShotBuyBtnText: {
    fontFamily: FONTS.jakarta,
    fontSize: 15.5,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  comboShotListSection: {
    backgroundColor: "#FFFFFF",
    paddingTop: 12,
    paddingBottom: 24,
  },
  comboShotListHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  comboShotListHeaderTitle: {
    fontFamily: FONTS.jakarta,
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  comboShotBooksWrap: {
    paddingHorizontal: 20,
  },
  comboShotBookCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  comboShotBookThumbWrap: {
    width: 50,
    height: 70,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
  },
  comboShotBookThumbFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  comboShotBookInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: "center",
  },
  comboShotBookTitle: {
    fontFamily: FONTS.jakarta,
    fontSize: 14.5,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  comboShotBookAuthor: {
    fontFamily: FONTS.inter,
    fontSize: 12.5,
    color: "#64748B",
    marginBottom: 6,
  },
  comboShotBookCatBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#F1F5F9",
  },
  comboShotBookCatText: {
    fontFamily: FONTS.inter,
    fontSize: 11,
    color: "#475569",
  },
  comboShotBookTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(22, 199, 132, 0.12)",
  },
  comboShotBookTagText: {
    fontFamily: FONTS.jakarta,
    fontSize: 11.5,
    fontWeight: "700",
    color: "#16C784",
  },

  comboCardFullFrame: {
    padding: 0,
    overflow: "hidden",
  },
  comboCoverFrameFull: {
    width: "100%",
    height: 224,
    borderRadius: 0,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    overflow: "hidden",
    marginBottom: 0,
    backgroundColor: "transparent",
  },
  comboCoverImgWrapFull: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    overflow: "hidden",
  },
  comboCardContentWrap: {
    padding: 8,
    paddingTop: 6,
  },
});
