import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Modal,
  ActivityIndicator,
  Dimensions,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppNavigation } from "./navigation";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import * as Font from "expo-font";
import axios from "axios";
import Constants from "expo-constants";

// ==============================================================
// TYPOGRAPHY SYSTEM — 3 FONT CHỮ CHUẨN:
// 1. Plus Jakarta Sans: Tiêu đề màn hình, tiêu đề khu vực, tên gói/combo/sách/thử thách, điểm nhấn Hero
// 2. Inter: Nhãn UI, badge, chip, giá tiền, số liệu Khoai, nút bấm CTA
// 3. Roboto: Nội dung mô tả, dòng phụ giải thích, thông số tài liệu, tên tác giả
// ==============================================================
const FONTS = {
  jakarta: "Plus Jakarta Sans",
  inter: "Inter",
  roboto: "Roboto",
} as const;

// ==============================================================
// API CONFIG — tái sử dụng pattern từ trangchu.tsx
// ==============================================================
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost ? debuggerHost.split(":")[0] : "localhost";
const API_BASE_URL = `http://${localhost}:8082`;
const CANDIDATE_URLS = [
  API_BASE_URL,
  "http://localhost:8082",
  "http://127.0.0.1:8082",
  "http://192.168.1.165:8082",
  "http://10.0.2.2:8082",
];

const CAROUSEL_H_PAD = 12;
const CAROUSEL_GAP = 8;
const DARK_MODE_PRIMARY = "#9A8BC2";
const DARK_MODE_SECONDARY = "#D8B36A";

function OffersNebula() {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animation, { toValue: 1, duration: 5000, useNativeDriver: true }),
        Animated.timing(animation, { toValue: 0, duration: 5000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animation]);

  return (
    <>
      <Animated.View
        style={{
          position: "absolute",
          top: -100,
          left: -100,
          width: 350,
          height: 350,
          borderRadius: 175,
          backgroundColor: DARK_MODE_PRIMARY,
          opacity: animation.interpolate({ inputRange: [0, 1], outputRange: [0.03, 0.12] }),
          transform: [{ scale: animation.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }],
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          bottom: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: 200,
          backgroundColor: DARK_MODE_SECONDARY,
          opacity: animation.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.05] }),
          transform: [{ scale: animation.interpolate({ inputRange: [0, 1], outputRange: [1.2, 0.8] }) }],
        }}
      />
    </>
  );
}

function OffersStar({
  top,
  left,
  duration,
  size,
  color,
}: {
  top: string;
  left: string;
  duration: number;
  size: number;
  color: string;
}) {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animation, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(animation, { toValue: 0.1, duration, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animation, duration]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        top,
        left,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: animation,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
      }}
    />
  );
}

function OffersShootingStar({
  delay,
  top,
  left,
  width,
  height,
}: {
  delay: number;
  top: string;
  left: string;
  width: number;
  height: number;
}) {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(animation, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(animation, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animation, delay]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        top,
        left,
        width: 80,
        height: 2,
        backgroundColor: "#fff",
        transform: [
          { rotate: "45deg" },
          { translateX: animation.interpolate({ inputRange: [0, 1], outputRange: [0, width] }) },
          { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.8] }) },
        ],
        opacity: animation.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
        shadowColor: DARK_MODE_SECONDARY,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
      }}
    />
  );
}

function OffersDarkModeBackgroundEffects({
  visible,
  width,
  height,
}: {
  visible: boolean;
  width: number;
  height: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const { stars, shootingStars } = useMemo(() => ({
    stars: Array.from({ length: 120 }, (_, id) => ({
      id,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      duration: Math.random() * 500 + 300,
      size: Math.random() * 3 + 1,
      color: Math.random() > 0.7
        ? DARK_MODE_SECONDARY
        : Math.random() > 0.5
          ? "#48dbfb"
          : DARK_MODE_PRIMARY,
    })),
    shootingStars: Array.from({ length: 3 }, (_, id) => ({
      id,
      top: `${Math.random() * -20}%`,
      left: `${Math.random() * 60}%`,
      delay: Math.random() * 8000 + 2000,
    })),
  }), []);

  useEffect(() => {
    const fade = Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 800,
      useNativeDriver: true,
    });
    fade.start();
    return () => fade.stop();
  }, [opacity, visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { opacity, zIndex: 0, overflow: "hidden" }]}
    >
      <OffersNebula />
      {stars.map((star) => <OffersStar key={star.id} {...star} />)}
      {shootingStars.map((star) => (
        <OffersShootingStar key={star.id} {...star} width={width} height={height} />
      ))}
    </Animated.View>
  );
}

// ==============================================================
// 1. TYPE DEFINITIONS
// ==============================================================
type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface RechargePackage {
  id: string;
  price: string;
  totalPotatoes: string;
  bonusPotatoes?: number;
  palette: "green" | "brown";
}

interface UploadOffer {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  fileSpecs: string;
  aiFeature: string;
  description: string;
  price: string;
  priceNumeric: number;
  oldPrice?: string;
  icon: IconName;
  iconColor: string;
  actionText: string;
  successMsg: string;
  isUploadLink?: boolean;
}

interface ComboOffer {
  id: string;
  title: string;
  discountTag: string;
  discountColor: string;
  volumeText: string;
  genreTag: string;
  description: string;
  price: string;
  priceNumeric: number;
  oldPrice?: string;
  icon: IconName;
  iconColor: string;
  actionText: string;
  successMsg: string;
}

interface ChallengeOffer {
  id: string;
  title: string;
  streakTag: string;
  streakColor: string;
  targetTask: string;
  rewardHighlight: string;
  description: string;
  priceDisplay: string;
  icon: IconName;
  iconColor: string;
  actionText: string;
  successMsg: string;
}

// Real book from API
interface RealBook {
  book_id: string;
  bookName: string;
  author: string;
  img_url: string | null;
  rent_price: number | null;
  description: string | null;
  category_name: string | null;
  readCount: number;
}

// ==============================================================
// 2. STATIC DATA
// ==============================================================

const STANDARD_RECHARGE_PACKAGES: RechargePackage[] = [
  { id: "standard-50", price: "50.000 VND", totalPotatoes: "50", palette: "green" },
  { id: "standard-150", price: "150.000 VND", totalPotatoes: "150", palette: "brown" },
  { id: "standard-450", price: "450.000 VND", totalPotatoes: "450", palette: "green" },
  { id: "standard-950", price: "950.000 VND", totalPotatoes: "950", palette: "brown" },
];

const PRIVILEGED_RECHARGE_PACKAGES: RechargePackage[] = [
  { id: "privileged-19999", price: "19.999 VND", totalPotatoes: "25", bonusPotatoes: 5, palette: "green" },
  { id: "privileged-49999", price: "49.999 VND", totalPotatoes: "65", bonusPotatoes: 15, palette: "brown" },
  { id: "privileged-99999", price: "99.999 VND", totalPotatoes: "140", bonusPotatoes: 40, palette: "green" },
  { id: "privileged-199999", price: "199.999 VND", totalPotatoes: "300", bonusPotatoes: 100, palette: "brown" },
  { id: "privileged-499999", price: "499.999 VND", totalPotatoes: "800", bonusPotatoes: 300, palette: "green" },
  { id: "privileged-999999", price: "999.999 VND", totalPotatoes: "1.700", bonusPotatoes: 700, palette: "brown" },
];

const COMBO_DATA: ComboOffer[] = [
  {
    id: "c1",
    title: "Kỹ Năng Sống",
    discountTag: "-40%",
    discountColor: "#D97706",
    volumeText: "Bộ 3 cuốn thực chiến",
    genreTag: "Tư duy & Đột phá",
    description:
      "Bộ 3 cuốn sách kỹ năng thực chiến kinh điển giúp rèn luyện tư duy phản biện, lãnh đạo và giao tiếp hiệu quả.",
    oldPrice: "200",
    price: "120 🥔",
    priceNumeric: 120,
    icon: "brain",
    iconColor: "#D97706",
    actionText: "Mua Combo",
    successMsg:
      "Mua Combo Kỹ Năng Sống thành công! Sách đã vào Tủ Sách cá nhân.",
  },
  {
    id: "c2",
    title: "Trinh Thám",
    discountTag: "HOT DEAL",
    discountColor: "#8E3038",
    volumeText: "Bộ 5 tiểu thuyết ly kỳ",
    genreTag: "Án mạng & Phá án",
    description:
      "Bộ 5 tiểu thuyết trinh thám bán chạy nhất mọi thời đại với những vụ án bí ẩn, nghẹt thở từ những bậc thầy văn chương.",
    oldPrice: "350",
    price: "200 🥔",
    priceNumeric: 200,
    icon: "magnify-scan",
    iconColor: "#8E3038",
    actionText: "Mua Combo",
    successMsg:
      "Mua Combo Trinh Thám thành công! Sách đã vào Tủ Sách cá nhân.",
  },
  {
    id: "c3",
    title: "Ngôn Tình",
    discountTag: "-45%",
    discountColor: "#E11D48",
    volumeText: "Tuyển tập 10 truyện hot",
    genreTag: "Thanh xuân lãng mạn",
    description:
      "Tuyển tập 10 truyện ngôn tình hiện đại ngọt ngào, sâu lắng về tình yêu tuổi trẻ và những bản tình ca chữa lành tâm hồn.",
    oldPrice: "450",
    price: "247 🥔",
    priceNumeric: 247,
    icon: "heart-multiple-outline",
    iconColor: "#E11D48",
    actionText: "Mua Combo",
    successMsg:
      "Mua Combo Ngôn Tình thành công! Sách đã vào Tủ Sách cá nhân.",
  },
];

const UPLOAD_DATA: UploadOffer[] = [
  {
    id: "u1",
    title: "Free 3 Lần Upload",
    badge: "FREE",
    badgeColor: "#059669",
    fileSpecs: "Max 25MB · PDF/EPUB",
    aiFeature: "Tóm tắt AI tự động",
    description:
      "Dành cho tài khoản mới. Tải tài liệu cá nhân PDF/EPUB để đọc trực tuyến và trích xuất ý chính thông minh bằng AI.",
    oldPrice: "15",
    price: "0 🥔 (Free)",
    priceNumeric: 0,
    icon: "file-document-outline",
    iconColor: "#059669",
    actionText: "Sử Dụng",
    isUploadLink: true,
    successMsg: "Đã kích hoạt 3 lượt upload tài liệu miễn phí!",
  },
  {
    id: "u2",
    title: "Upload 2 Lần/Ngày",
    badge: "GÓI NGÀY",
    badgeColor: "#8E3038",
    fileSpecs: "2 lượt/ngày · 30 ngày",
    aiFeature: "Trích xuất biểu đồ",
    description:
      "Tải tài liệu lên hệ thống 2 lần mỗi ngày với chi phí tiết kiệm, lưu trữ tra cứu bài vở và đồ thị linh hoạt.",
    price: "10 🥔 /lần",
    priceNumeric: 10,
    icon: "cloud-sync-outline",
    iconColor: "#8E3038",
    actionText: "Đăng Ký",
    successMsg: "Đã đăng ký quyền lợi upload ưu đãi theo ngày!",
  },
  {
    id: "u3",
    title: "Không Giới Hạn",
    badge: "UNLIMITED",
    badgeColor: "#B8860B",
    fileSpecs: "Max 100MB · Dài hạn",
    aiFeature: "Hỏi đáp AI ngữ cảnh",
    description:
      "Tự do lưu trữ thư viện cá nhân không giới hạn dung lượng lên đến 100MB/file, phân tích tài liệu chuyên sâu.",
    price: "30 🥔 /tháng",
    priceNumeric: 30,
    icon: "database-arrow-up-outline",
    iconColor: "#B8860B",
    actionText: "Nâng Cấp",
    successMsg: "Kích hoạt Gói Upload Không Giới Hạn thành công!",
  },
];

const CHALLENGE_DATA: ChallengeOffer[] = [
  {
    id: "ch1",
    title: "Chiến Thần Tốc Độ",
    streakTag: "3 NGÀY",
    streakColor: "#8E3038",
    targetTask: "Đọc xong 1 cuốn trong 3 ngày",
    rewardHighlight: "Voucher giảm 5% mua sách",
    description:
      "Chinh phục thử thách đọc nhanh 1 cuốn sách trong 3 ngày để nhận voucher giảm 5% và huy hiệu Tia Chớp Nhanh.",
    priceDisplay: "-5% Voucher",
    icon: "lightning-bolt",
    iconColor: "#8E3038",
    actionText: "Tham Gia",
    successMsg:
      "Đã ghi danh thử thách Chiến Thần Tốc Độ! Hoàn thành sách trong 3 ngày nhé.",
  },
  {
    id: "ch2",
    title: "Một Sách Chăm Chỉ",
    streakTag: "7 NGÀY",
    streakColor: "#D97706",
    targetTask: "Chuỗi đọc 7 ngày liên tiếp",
    rewardHighlight: "Thưởng nóng +10 Khoai tươi",
    description:
      "Duy trì thói quen mở sách đọc mỗi ngày trong 7 ngày liên tiếp để nhận thưởng nóng 10 Khoai và mở khóa Ngọn Lửa Bền Bỉ.",
    priceDisplay: "+10 🥔",
    icon: "fire",
    iconColor: "#D97706",
    actionText: "Tham Gia",
    successMsg: "Đã kích hoạt chuỗi đọc 7 ngày! Chúc bạn giữ vững thói quen.",
  },
  {
    id: "ch3",
    title: "Thợ Săn Tri Thức",
    streakTag: "1 THÁNG",
    streakColor: "#2563EB",
    targetTask: "Hoàn thành 10 cuốn sách",
    rewardHighlight: "Thưởng +25 Khoai & Bảng Vàng",
    description:
      "Đọc hoàn thành 10 cuốn sách trong tháng để nhận 25 Khoai vào ví và được vinh danh trên Bảng Vàng Độc Giả xuất sắc.",
    priceDisplay: "+25 🥔",
    icon: "trophy-outline",
    iconColor: "#2563EB",
    actionText: "Tham Gia",
    successMsg:
      "Đã ghi danh thử thách Thợ Săn Tri Thức! Chinh phục 10 cuốn sách tháng này nhé.",
  },
];

// ==============================================================
// SECTION HEADER — icon + tên, không có count badge
// ==============================================================
function SectionHeader({
  icon,
  iconColor,
  label,
}: {
  icon: IconName;
  iconColor: string;
  label: string;
}) {
  return (
    <View style={sectionHeaderStyles.row}>
      <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
      <Text style={[sectionHeaderStyles.label, { color: "#1E1F1D" }]}>
        {label}
      </Text>
    </View>
  );
}

// Wrapper component để inject theme vào SectionHeader
function ThemedSectionHeader({
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
      <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
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
    gap: 6,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  label: {
    fontFamily: FONTS.jakarta,
    fontSize: 13.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
});

// ==============================================================
// HORIZONTAL CAROUSEL — 3 cards visible, swipe for more
// ==============================================================
function HorizontalCarousel<T>({
  data,
  renderItem,
  cardWidth,
  gap,
  paddingH,
}: {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  cardWidth: number;
  gap: number;
  paddingH: number;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={cardWidth + gap}
      snapToAlignment="start"
      disableIntervalMomentum
      contentContainerStyle={{
        paddingLeft: paddingH,
        gap,
      }}
    >
      {data.map((item, index) => (
        <View key={index} style={{ width: cardWidth }}>
          {renderItem(item, index)}
        </View>
      ))}
    </ScrollView>
  );
}

// ==============================================================
// MAIN COMPONENT
// ==============================================================
export default function OffersScreen() {
  const { navigate, navigateTab, isDarkMode, toggleDarkMode, isLoggedIn, showLoginAlert } =
    useAppNavigation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const contentWidth = Math.max(0, windowWidth - insets.left - insets.right);
  const compactUtility = contentWidth < 380;
  const topupButtonWidth = Math.min(96, Math.max(72, contentWidth * 0.28));
  const visibleCardCount = contentWidth < 360 ? 2 : 3;
  const cardWidth = Math.floor(
    (contentWidth - CAROUSEL_H_PAD - CAROUSEL_GAP * visibleCardCount) /
      visibleCardCount,
  );
  const uploadViewportWidth = Math.max(0, contentWidth - 20 - 24);
  const uploadVisibleCount = uploadViewportWidth < 360 ? 2 : 3;
  const uploadCardWidth = Math.floor(
    (uploadViewportWidth - CAROUSEL_H_PAD - CAROUSEL_GAP * uploadVisibleCount) /
      uploadVisibleCount,
  );
  const [khoaiBalance, setKhoaiBalance] = useState<number | null>(null);
  const [isKhoaiExpanded, setIsKhoaiExpanded] = useState(false);
  const khoaiExpansion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(khoaiExpansion, {
      toValue: isKhoaiExpanded ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [isKhoaiExpanded, khoaiExpansion]);

  // Real books from API
  const [realBooks, setRealBooks] = useState<RealBook[]>([]);
  const [failedBookImageIds, setFailedBookImageIds] = useState<Set<string>>(new Set());
  const [booksLoading, setBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState<string | null>(null);

  // Modal State
  const [modalItem, setModalItem] = useState<{
    title: string;
    description: string;
    price: string;
    priceNumeric: number;
    actionText: string;
    successMsg: string;
    isUploadLink?: boolean;
    isChallenge?: boolean;
    badgeText?: string;
    badgeColor?: string;
  } | null>(null);

  // Toast State
  const [toast, setToast] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({ visible: false, title: "", message: "" });

  // Load 3 font chữ: Plus Jakarta Sans, Inter, Roboto qua expo-font
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
        // Fallback an toàn về system font nếu thiết bị offline
      }
    };
    loadTypographyFonts();
  }, []);

  // Load khoai balance from AsyncStorage
  useEffect(() => {
    const loadBalance = async () => {
      try {
        const raw = await AsyncStorage.getItem("cachedUserProfile");
        if (raw) {
          const profile = JSON.parse(raw);
          if (typeof profile?.potatoBalance === "number") {
            setKhoaiBalance(profile.potatoBalance);
          }
        }
      } catch {
        // silent fail — UI shows "—"
      }
    };
    loadBalance();
  }, []);

  // Fetch real books from API GET /api/home/books (tái sử dụng pattern trangchu.tsx)
  useEffect(() => {
    const controller = new AbortController();
    const fetchBooks = async () => {
      setBooksLoading(true);
      setBooksError(null);
      let data: any = null;
      let successfulBaseUrl: string | null = null;
      for (const baseUrl of CANDIDATE_URLS) {
        try {
          const res = await axios.get(`${baseUrl}/api/home/books`, {
            params: { page: 0, size: 20 },
            timeout: 8000,
            signal: controller.signal,
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
          .filter((b) => b.status !== "DELETED" && b.rent_price !== null && b.rent_price !== undefined)
          .slice(0, 10)
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
              rent_price: b.rent_price ?? null,
              description: b.description || null,
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
    fetchBooks();
    return () => controller.abort();
  }, []);

  // ==============================================================
  // HỆ THỐNG MÀU DUAL-THEME (LIGHT: NÂU ĐỎ / DARK: VÀNG KIM)
  // ==============================================================
  const isDark = isDarkMode;
  const colors = {
    screenBg: isDark ? "#181716" : "#F7F5F0",
    cardBg: isDark ? "#242321" : "#FFFFFF",
    cardBorder: isDark ? "#383633" : "#E6E1D8",
    textPrimary: isDark ? "#F7F5F0" : "#242321",
    textSecondary: isDark ? "#A39F99" : "#85817A",
    accent: isDark ? "#E5A93C" : "#8B4A3C",
    accentText: isDark ? "#181716" : "#FFFFFF",
    chipBg: isDark ? "#2D2B28" : "#EAE6DF",
    progressTrack: isDark ? "#2D2B28" : "#E6E1D8",
  };

  // Theme Palette đồng bộ với colors token
  const theme = {
    bg: colors.screenBg,
    cardBg: colors.cardBg,
    cardInnerBg: colors.chipBg,
    breakerBg: colors.cardBg,
    border: colors.cardBorder,
    textPrimary: colors.textPrimary,
    textMuted: colors.textSecondary,
    wine: colors.accent,
    gold: colors.accent,
    emerald: colors.accent,
    khoaiBg: colors.chipBg,
    khoaiBorder: colors.cardBorder,
    utilityBg: colors.screenBg,
    utilityBorder: colors.cardBorder,
  };

  const heroCardWidth = Math.round(Dimensions.get("window").width * 0.85);
  const comboCardWidth = 160;

  const showToast = (title: string, message: string) => {
    setToast({ visible: true, title, message });
    setTimeout(() => setToast((p) => ({ ...p, visible: false })), 3000);
  };

  const handleConfirmAction = () => {
    if (!modalItem) return;
    const balance = khoaiBalance ?? 0;
    if (balance >= modalItem.priceNumeric) {
      if (modalItem.priceNumeric > 0) {
        setKhoaiBalance((prev) => (prev ?? 0) - modalItem.priceNumeric);
      }
      const { successMsg, isUploadLink, isChallenge } = modalItem;
      setModalItem(null);
      showToast("Thao Tác Thành Công!", successMsg);
      if (isUploadLink) setTimeout(() => navigate("upload"), 600);
      else if (isChallenge) setTimeout(() => navigate("bookshelf"), 600);
    }
  };

  const handleCartPress = () => {
    if (!isLoggedIn) {
      showLoginAlert("Bạn cần đăng nhập để xem giỏ hàng.");
      return;
    }
    navigate("cart");
  };

  const handleChallengeHomePress = () => {
    setModalItem(null);
    navigateTab("home");
  };

  const handleChallengeBookshelfPress = () => {
    setModalItem(null);
    if (!isLoggedIn) {
      showLoginAlert("Bạn phải đăng nhập để dùng chức năng tủ sách");
      return;
    }
    navigateTab("bookshelf");
  };

  // ==============================================================
  // CARD RENDERERS THEO 5 TẦNG NHỊP ĐIỆU THỊ GIÁC
  // ==============================================================

  // Tầng 1 & Tầng 2: Gói Cước Đặc Quyền (Hero Card) & Gói Nạp Thường (Quick Chip)
  const renderRechargePackageCard = (item: RechargePackage, index: number) => {
    const isPrivileged = Boolean(item.bonusPotatoes);

    if (isPrivileged) {
      const totalNumeric =
        parseInt(item.totalPotatoes.replace(/\./g, ""), 10) || 0;
      const bonusNumeric = item.bonusPotatoes ?? 0;
      const baseNumeric = Math.max(0, totalNumeric - bonusNumeric);
      const baseKhoaiFormatted = baseNumeric.toLocaleString("vi-VN");

      return (
        <View
          key={item.id || index}
          style={[
            styles.heroCard,
            {
              width: heroCardWidth,
              backgroundColor: colors.cardBg,
              borderColor: colors.accent,
              borderWidth: 1.5,
            },
          ]}
        >
          {/* Badge Khuyến mãi */}
          <View
            style={[
              styles.heroBadge,
              { backgroundColor: colors.accent },
            ]}
          >
            <Text
              style={[
                styles.heroBadgeText,
                { color: colors.accentText },
              ]}
              numberOfLines={1}
            >
              +{item.bonusPotatoes} KHOAI THƯỞNG
            </Text>
          </View>

          {/* Hàng thông tin chính: Cột trái (Tổng nhận) + Cột phải (Giá & Nút Nạp ngay) */}
          <View style={styles.heroBody}>
            <View style={styles.heroLeftCol}>
              <Text
                style={[
                  styles.heroLabel,
                  { color: colors.textSecondary },
                ]}
              >
                TỔNG NHẬN
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.heroTotalKhoai,
                  { color: colors.accent },
                ]}
              >
                {item.totalPotatoes} khoai
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.heroBreakdown,
                  { color: colors.textSecondary },
                ]}
              >
                Gốc {baseKhoaiFormatted} + {bonusNumeric} thưởng
              </Text>
            </View>

            <View style={styles.heroRightCol}>
              <Text
                numberOfLines={1}
                style={[
                  styles.heroPriceText,
                  { color: colors.textPrimary },
                ]}
              >
                {item.price}
              </Text>
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  { backgroundColor: colors.accent },
                ]}
                onPress={() => navigate("payment")}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Nạp ngay gói ${item.price}`}
              >
                <Text
                  style={[
                    styles.primaryBtnText,
                    { color: colors.accentText },
                  ]}
                >
                  Nạp ngay
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    // Tầng 2: Quick Chip (nút viên nhộng gọn gàng trên 1 hàng ngang)
    return (
      <TouchableOpacity
        key={item.id || index}
        style={[
          styles.quickChip,
          {
            backgroundColor: colors.chipBg,
            borderColor: colors.cardBorder,
          },
        ]}
        onPress={() => navigate("payment")}
        activeOpacity={0.78}
        accessibilityRole="button"
        accessibilityLabel={`Nạp gói cơ bản ${item.totalPotatoes} khoai giá ${item.price}`}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[
            styles.quickChipKhoai,
            { color: colors.textPrimary },
          ]}
        >
          {item.totalPotatoes} khoai
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[
            styles.quickChipPrice,
            { color: colors.textSecondary },
          ]}
        >
          {item.price}
        </Text>
      </TouchableOpacity>
    );
  };

  // Tầng 3: Combo Sách Tiết Kiệm (Kệ sách lướt ngang 160px)
  const renderComboCard = (item: ComboOffer, _i: number) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.comboShelfCard,
        {
          width: comboCardWidth,
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
        },
      ]}
      onPress={() =>
        setModalItem({
          title: `Combo ${item.title}`,
          description: item.description,
          price: item.price,
          priceNumeric: item.priceNumeric,
          actionText: item.actionText,
          successMsg: item.successMsg,
          badgeText: item.discountTag,
          badgeColor: colors.accent,
        })
      }
      activeOpacity={0.82}
    >
      <View
        style={[
          styles.comboBadge,
          { backgroundColor: colors.accent },
        ]}
      >
        <Text
          style={[
            styles.comboBadgeText,
            { color: colors.accentText },
          ]}
          numberOfLines={1}
        >
          {item.discountTag}
        </Text>
      </View>

      <View
        style={[
          styles.comboCoverBox,
          { backgroundColor: colors.chipBg, borderColor: colors.cardBorder },
        ]}
      >
        <MaterialCommunityIcons name={item.icon} size={28} color={colors.accent} />
        <Text
          numberOfLines={1}
          style={[
            styles.comboVolumeTag,
            { color: colors.textSecondary },
          ]}
        >
          {item.volumeText}
        </Text>
      </View>

      <Text
        numberOfLines={2}
        style={[
          styles.comboCardTitle,
          { color: colors.textPrimary },
        ]}
      >
        Combo {item.title}
      </Text>

      <Text
        numberOfLines={1}
        style={[
          styles.comboGenreSub,
          { color: colors.textSecondary },
        ]}
      >
        {item.genreTag}
      </Text>

      <View style={styles.comboPriceRow}>
        {item.oldPrice && (
          <Text
            style={[
              styles.comboOldPrice,
              { color: colors.textSecondary },
            ]}
          >
            {item.oldPrice} 🥔
          </Text>
        )}
        <Text
          style={[
            styles.comboNewPrice,
            { color: colors.accent },
          ]}
        >
          {item.price}
        </Text>
      </View>

      <View
        style={[
          styles.comboCtaBtn,
          { backgroundColor: colors.accent },
        ]}
      >
        <Text
          style={[
            styles.comboCtaBtnText,
            { color: colors.accentText },
          ]}
        >
          {item.actionText}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Tầng 4: Tiện Ích Đọc Số & AI (So sánh 3 gói Free / Ngày / Unlimited đồng bộ Theme Token)
  const renderUploadCard = (item: UploadOffer, _i: number) => {
    const isFree = item.priceNumeric === 0;
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.uploadCard,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          },
        ]}
        onPress={() =>
          setModalItem({
            title: item.title,
            description: item.description,
            price: item.price,
            priceNumeric: item.priceNumeric,
            actionText: item.actionText,
            successMsg: item.successMsg,
            isUploadLink: item.isUploadLink,
            badgeText: item.badge,
            badgeColor: colors.accent,
          })
        }
        activeOpacity={0.82}
      >
        <View
          style={[
            styles.inlineBadgeSmall,
            {
              backgroundColor: isFree ? colors.chipBg : colors.accent,
            },
          ]}
        >
          <Text
            style={[
              styles.inlineBadgeSmallText,
              {
                color: isFree ? colors.textPrimary : colors.accentText,
              },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.badge}
          </Text>
        </View>
        <View
          style={[
            styles.iconBoxSm,
            { backgroundColor: colors.chipBg },
          ]}
        >
          <MaterialCommunityIcons name={item.icon} size={18} color={colors.accent} />
        </View>
        <Text
          numberOfLines={2}
          style={[
            styles.cardTitleSm,
            { color: colors.textPrimary },
          ]}
        >
          {item.title}
        </Text>
        <Text
          numberOfLines={2}
          style={[
            styles.snippetTextSm,
            { color: colors.accent },
          ]}
        >
          {item.fileSpecs}
        </Text>
        <Text
          numberOfLines={2}
          style={[
            styles.snippetTextSm,
            { color: colors.textSecondary },
          ]}
        >
          {item.aiFeature}
        </Text>
        <View style={styles.priceRowSm}>
          {item.oldPrice && (
            <Text
              style={[
                styles.oldPriceSm,
                { color: colors.textSecondary },
              ]}
            >
              {item.oldPrice}
            </Text>
          )}
          <Text
            style={[
              styles.priceTextSm,
              { color: colors.accent },
            ]}
          >
            {item.price}
          </Text>
        </View>
        <View
          style={[
            styles.ctaBtnSm,
            isFree
              ? {
                  backgroundColor: colors.chipBg,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }
              : { backgroundColor: colors.accent },
          ]}
        >
          <Text
            style={[
              styles.ctaBtnSmText,
              {
                color: isFree ? colors.textPrimary : colors.accentText,
              },
            ]}
          >
            {item.actionText}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Tầng 5: Ưu Đãi Thử Thách Đọc (Danh sách Nhiệm vụ Gamification - Quest List)
  const renderChallengeCard = (item: ChallengeOffer, index: number) => {
    const progressPercent = index === 0 ? "45%" : index === 1 ? "65%" : "30%";

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.questCard,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          },
        ]}
        onPress={() =>
          setModalItem({
            title: item.title,
            description: `${item.description}\n\nMục tiêu: ${item.targetTask}\nPhần thưởng: ${item.rewardHighlight}`,
            price: item.priceDisplay,
            priceNumeric: 0,
            actionText: item.actionText,
            successMsg: item.successMsg,
            isChallenge: true,
            badgeText: item.streakTag,
            badgeColor: colors.accent,
          })
        }
        activeOpacity={0.82}
      >
        {/* (1) Icon tròn bên trái */}
        <View
          style={[
            styles.questIconCircle,
            {
              backgroundColor: colors.chipBg,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <MaterialCommunityIcons name={item.icon} size={22} color={colors.accent} />
        </View>

        {/* (2) Phần giữa: Tên thử thách, Dòng thưởng Khoai màu Accent, Thanh Progress Bar 6px */}
        <View style={styles.questContentCol}>
          <View style={styles.questTitleRow}>
            <Text
              numberOfLines={1}
              style={[
                styles.questTitle,
                { color: colors.textPrimary },
              ]}
            >
              {item.title}
            </Text>
            <View
              style={[
                styles.questStreakChip,
                { backgroundColor: colors.chipBg },
              ]}
            >
              <Text
                style={[
                  styles.questStreakChipText,
                  { color: colors.textSecondary },
                ]}
              >
                {item.streakTag}
              </Text>
            </View>
          </View>

          <Text
            numberOfLines={1}
            style={[
              styles.questTaskSub,
              { color: colors.textSecondary },
            ]}
          >
            {item.targetTask}
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.questRewardText,
              { color: colors.accent },
            ]}
          >
            {item.rewardHighlight} ({item.priceDisplay})
          </Text>

          <View
            style={[
              styles.questProgressTrack,
              { backgroundColor: colors.progressTrack },
            ]}
          >
            <View
              style={[
                styles.questProgressFill,
                {
                  width: progressPercent,
                  backgroundColor: colors.accent,
                },
              ]}
            />
          </View>
        </View>

        {/* (3) Nút "Tham Gia" nền Accent nhỏ gọn bên phải */}
        <View
          style={[
            styles.questActionBtn,
            { backgroundColor: colors.accent },
          ]}
        >
          <Text
            style={[
              styles.questActionBtnText,
              { color: colors.accentText },
            ]}
          >
            {item.actionText}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Real book card — dữ liệu thật từ API, đồng bộ Dual-Theme
  const renderRealBookCard = (book: RealBook, _i: number) => {
    const price = book.rent_price !== null ? `${book.rent_price} 🥔` : "—";
    const priceNum = book.rent_price ?? 0;
    const hasImage = !!book.img_url && !failedBookImageIds.has(book.book_id);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          },
        ]}
        onPress={() =>
          setModalItem({
            title: book.bookName,
            description: `${book.description || "Chưa có mô tả."}\n\nTác giả: ${book.author}${
              book.category_name ? `\nThể loại: ${book.category_name}` : ""
            }`,
            price: price,
            priceNumeric: priceNum,
            actionText: "Thuê Sách",
            successMsg: `Thuê sách "${book.bookName}" thành công!`,
            badgeText: book.category_name || undefined,
            badgeColor: colors.accent,
          })
        }
        activeOpacity={0.82}
      >
        {book.category_name ? (
          <View
            style={[
              styles.bookCategoryBadge,
              { backgroundColor: colors.accent },
            ]}
          >
            <Text
              style={[
                styles.bookCategoryBadgeText,
                { color: colors.accentText },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              ellipsizeMode="tail"
            >
              {book.category_name}
            </Text>
          </View>
        ) : (
          <View style={styles.inlineBadgePlaceholder} />
        )}

        <View style={styles.bookCoverFrame}>
          {hasImage ? (
            <Image
              source={{ uri: book.img_url! }}
              style={styles.bookCoverImg}
              resizeMode="cover"
              onError={() => {
                setFailedBookImageIds((current) => {
                  if (current.has(book.book_id)) return current;
                  const next = new Set(current);
                  next.add(book.book_id);
                  return next;
                });
              }}
            />
          ) : (
            <View
              style={[
                styles.bookCoverPlaceholder,
                { backgroundColor: colors.chipBg },
              ]}
            >
              <MaterialCommunityIcons
                name="book-open-variant"
                size={22}
                color={colors.textSecondary}
              />
            </View>
          )}
        </View>

        <Text
          numberOfLines={2}
          style={[styles.cardTitle, { color: colors.textPrimary }]}
        >
          {book.bookName}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.snippetText, { color: colors.textSecondary }]}
        >
          {book.author}
        </Text>

        <View style={styles.priceRow}>
          <Text style={[styles.priceText, { color: colors.accent }]}>{price}</Text>
        </View>
        <View style={[styles.ctaBtn, { backgroundColor: colors.accent }]}>
          <Text style={[styles.ctaBtnText, { color: colors.accentText }]}>
            Thuê Sách
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ==============================================================
  // RENDER
  // ==============================================================
  const balanceDisplay =
    khoaiBalance !== null && khoaiBalance > 0 ? `${khoaiBalance} khoai` : "0 khoai";
  const topupWidth = khoaiExpansion.interpolate({
    inputRange: [0, 1],
    outputRange: [0, topupButtonWidth],
  });

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
      <OffersDarkModeBackgroundEffects
        visible={isDarkMode}
        width={windowWidth}
        height={windowHeight}
      />

      {/* ============================================================
          UTILITY BAR — dùng insets.top để tránh status bar iOS
          ============================================================ */}
      <View
        style={[
          styles.utilityBar,
          {
            backgroundColor: theme.utilityBg,
            borderBottomColor: theme.utilityBorder,
            paddingTop: insets.top,
            paddingHorizontal: compactUtility ? 8 : 14,
          },
        ]}
      >
        <View style={styles.khoaiActions}>
          <TouchableOpacity
            style={[
              styles.khoaiPill,
              compactUtility && styles.khoaiPillCompact,
              { backgroundColor: theme.khoaiBg, borderColor: theme.khoaiBorder },
            ]}
            onPress={() => setIsKhoaiExpanded((expanded) => !expanded)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={isKhoaiExpanded ? "Thu gọn số dư khoai" : "Mở rộng số dư khoai"}
            accessibilityState={{ expanded: isKhoaiExpanded }}
          >
            <Text style={[styles.potatoIcon, { fontSize: compactUtility ? 16 : 18 }]}>🥔</Text>
            <Text
              numberOfLines={1}
              style={[
                styles.khoaiText,
                compactUtility && styles.khoaiTextCompact,
                { color: colors.accent },
              ]}
            >
              {balanceDisplay}
            </Text>
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: khoaiExpansion.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "90deg"],
                    }),
                  },
                ],
              }}
            >
              <Ionicons name="chevron-forward" size={14} color={colors.accent} />
            </Animated.View>
          </TouchableOpacity>

          <Animated.View
            pointerEvents={isKhoaiExpanded ? "auto" : "none"}
            style={[
              styles.topupReveal,
              {
                width: topupWidth,
                opacity: khoaiExpansion,
                backgroundColor: colors.accent,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.topupButton}
              onPress={() => navigate("payment")}
              accessibilityRole="button"
              accessibilityLabel="Nạp khoai"
            >
              <Text
                style={[styles.topupButtonText, { color: colors.accentText }]}
                numberOfLines={1}
              >
                Nạp khoai
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Right actions */}
        <View style={[styles.utilityRight, compactUtility && styles.utilityRightCompact]}>
          {/* Dark Mode toggle */}
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.chipBg, borderColor: colors.cardBorder }]}
            onPress={() => toggleDarkMode && toggleDarkMode()}
            activeOpacity={0.75}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Ionicons
              name={isDarkMode ? "sunny-outline" : "moon-outline"}
              size={19}
              color={isDarkMode ? colors.accent : colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Cart */}
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.chipBg, borderColor: colors.cardBorder }]}
            onPress={handleCartPress}
            activeOpacity={0.75}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Ionicons name="cart-outline" size={19} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.languageFlag} accessibilityElementsHidden importantForAccessibility="no">
            🇻🇳
          </Text>
        </View>
      </View>

      <View style={styles.screenHeader}>
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Ưu đãi</Text>
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
            <Ionicons name="checkmark" size={12} color={colors.accentText} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toastTitle, { color: colors.textPrimary }]}>{toast.title}</Text>
            <Text style={[styles.toastMsg, { color: colors.textSecondary }]}>{toast.message}</Text>
          </View>
        </View>
      )}

      {/* ============================================================
          MAIN SCROLL — SINGLE-SCROLL 5 TẦNG NHỊP ĐIỆU THỊ GIÁC
          ============================================================ */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        onTouchStart={() => {
          if (isKhoaiExpanded) setIsKhoaiExpanded(false);
        }}
        contentContainerStyle={{
          paddingTop: 6,
          paddingBottom: 68 + Math.max(insets.bottom, 8) + 18,
        }}
      >
        {/* TẦNG 1: GÓI CƯỚC ĐẶC QUYỀN — HERO CARD CAROUSEL */}
        <View style={styles.sectionWrap}>
          <ThemedSectionHeader
            icon="cash-multiple"
            iconColor={colors.accent}
            label="GÓI CƯỚC ĐẶC QUYỀN"
            textColor={colors.textPrimary}
          />
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={heroCardWidth + 12}
            snapToAlignment="start"
            contentContainerStyle={styles.heroCarouselContent}
          >
            {PRIVILEGED_RECHARGE_PACKAGES.map((item, index) =>
              renderRechargePackageCard(item, index)
            )}
          </ScrollView>
        </View>

        {/* TẦNG 2: GÓI NẠP THƯỜNG — HÀNG QUICK CHIPS 1 DÒNG */}
        <View style={styles.sectionWrap}>
          <View style={styles.subSectionHeaderRow}>
            <MaterialCommunityIcons
              name="wallet-plus-outline"
              size={15}
              color={colors.textSecondary}
            />
            <Text style={[styles.subSectionTitle, { color: colors.textPrimary }]}>
              Gói nạp cơ bản
            </Text>
          </View>
          <View style={styles.quickChipsRow}>
            {STANDARD_RECHARGE_PACKAGES.slice(0, 3).map((item, index) =>
              renderRechargePackageCard(item, index)
            )}
          </View>
        </View>

        {/* TẦNG 3: COMBO SÁCH TIẾT KIỆM — KỆ SÁCH LƯỚT NGANG */}
        <View style={styles.sectionWrap}>
          <ThemedSectionHeader
            icon="layers"
            iconColor={colors.accent}
            label="Combo Sách Tiết Kiệm"
            textColor={colors.textPrimary}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.comboShelfContent}
          >
            {COMBO_DATA.map((item, index) => renderComboCard(item, index))}
          </ScrollView>
        </View>

        {/* TẦNG 4: TIỆN ÍCH ĐỌC SỐ & AI — SO SÁNH 3 GÓI UPLOAD */}
        <View
          style={[
            styles.breakerSection,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.breakerHeader}>
            <View style={styles.breakerTagRow}>
              <MaterialCommunityIcons name="cloud-upload" size={13} color={colors.accent} />
              <Text style={[styles.breakerTag, { color: colors.accent }]}>
                TIỆN ÍCH ĐỌC SỐ
              </Text>
            </View>
            <Text style={[styles.breakerTitle, { color: colors.textPrimary }]}>
              Upload file của bạn và sử dụng hệ sinh thái của chúng tôi
            </Text>
          </View>
          <HorizontalCarousel
            data={UPLOAD_DATA}
            renderItem={renderUploadCard}
            cardWidth={uploadCardWidth}
            gap={CAROUSEL_GAP}
            paddingH={CAROUSEL_H_PAD}
          />
        </View>

        {/* SÁCH LẺ GIẢM SÂU — DỮ LIỆU THẬT TỪ API */}
        <View style={styles.sectionWrap}>
          <ThemedSectionHeader
            icon="book-open"
            iconColor={colors.accent}
            label="Sách Lẻ Giảm Sâu"
            textColor={colors.textPrimary}
          />

          {booksLoading ? (
            <View style={styles.booksLoadingBox}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={[styles.booksLoadingText, { color: colors.textSecondary }]}>
                Đang tải sách từ hệ thống...
              </Text>
            </View>
          ) : booksError ? (
            <View style={styles.booksErrorBox}>
              <Ionicons name="wifi-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.booksErrorText, { color: colors.textSecondary }]}>
                {booksError}
              </Text>
              <Text style={[styles.booksErrorHint, { color: colors.accent }]}>
                Khởi động backend để xem sách thực tế
              </Text>
            </View>
          ) : realBooks.length === 0 ? (
            <View style={styles.booksErrorBox}>
              <Text style={[styles.booksErrorText, { color: colors.textSecondary }]}>
                Chưa có sách trong hệ thống.
              </Text>
            </View>
          ) : (
            <HorizontalCarousel
              data={realBooks}
              renderItem={renderRealBookCard}
              cardWidth={cardWidth}
              gap={CAROUSEL_GAP}
              paddingH={CAROUSEL_H_PAD}
            />
          )}
        </View>

        {/* TẦNG 5: ƯU ĐÃI THỬ THÁCH ĐỌC — DANH SÁCH NHIỆM VỤ GAMIFICATION */}
        <View style={styles.sectionWrap}>
          <ThemedSectionHeader
            icon="medal"
            iconColor={colors.accent}
            label="Ưu Đãi Thử Thách Đọc"
            textColor={colors.textPrimary}
          />
          <View style={styles.questListContainer}>
            {CHALLENGE_DATA.map((item, index) => renderChallengeCard(item, index))}
          </View>
        </View>
      </ScrollView>

      {/* ============================================================
          DETAIL & CONFIRMATION MODAL
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
                  <View style={{ flex: 1 }}>
                    {modalItem.badgeText && (
                      <Text style={[styles.modalBadge, { color: modalItem.badgeColor || colors.accent }]}>
                        {modalItem.badgeText}
                      </Text>
                    )}
                    <Text style={[styles.modalHeading, { color: colors.textPrimary }]}>
                      {modalItem.title}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setModalItem(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.modalDescBox, { backgroundColor: colors.chipBg, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.modalDescLabel, { color: colors.textSecondary }]}>Nội dung quyền lợi:</Text>
                  <Text style={[styles.modalDescContent, { color: colors.textPrimary }]}>
                    {modalItem.description}
                  </Text>
                </View>

                {!modalItem.isChallenge && (
                  <View style={styles.modalMetaRow}>
                    <View style={[styles.modalMetaCol, { backgroundColor: colors.chipBg, borderColor: colors.cardBorder }]}>
                      <Text style={[styles.modalMetaLabel, { color: colors.textSecondary }]}>Chi phí:</Text>
                      <Text style={[styles.modalMetaVal, { color: colors.accent }]}>
                        {modalItem.price}
                      </Text>
                    </View>
                    <View style={[styles.modalMetaCol, { backgroundColor: colors.chipBg, borderColor: colors.cardBorder }]}>
                      <Text style={[styles.modalMetaLabel, { color: colors.textSecondary }]}>Số dư ví:</Text>
                      <Text style={[styles.modalMetaVal, { color: colors.textPrimary }]}>
                        {khoaiBalance !== null ? khoaiBalance : "—"} 🥔
                      </Text>
                    </View>
                  </View>
                )}

                {modalItem.isChallenge ? (
                  <View style={styles.challengeActions}>
                    <TouchableOpacity
                      style={[styles.challengeSecondaryButton, { borderColor: colors.cardBorder }]}
                      onPress={handleChallengeHomePress}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.challengeSecondaryText, { color: colors.textPrimary }]}>
                        Khám phá trang chủ
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.challengePrimaryButton, { backgroundColor: colors.accent }]}
                      onPress={handleChallengeBookshelfPress}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.challengePrimaryText, { color: colors.accentText }]}>
                        Đi tủ sách
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.modalBtnRow}>
                    <TouchableOpacity
                      style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]}
                      onPress={() => setModalItem(null)}
                    >
                      <Text style={[styles.modalCancelText, { color: colors.textPrimary }]}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalConfirmBtn,
                        {
                          backgroundColor:
                            (khoaiBalance ?? 0) >= modalItem.priceNumeric
                              ? colors.accent
                              : colors.cardBorder,
                        },
                      ]}
                      disabled={(khoaiBalance ?? 0) < modalItem.priceNumeric}
                      onPress={handleConfirmAction}
                    >
                      <Text
                        style={[
                          styles.modalConfirmText,
                          {
                            color:
                              (khoaiBalance ?? 0) >= modalItem.priceNumeric
                                ? colors.accentText
                                : colors.textSecondary,
                          },
                        ]}
                      >
                        {(khoaiBalance ?? 0) < modalItem.priceNumeric
                          ? "Số Dư Không Đủ"
                          : modalItem.priceNumeric > 0
                          ? `Xác Nhận (${modalItem.price})`
                          : "Xác Nhận Ngay"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ==============================================================
// STYLES — Sử dụng 3 font chữ: Plus Jakarta Sans, Inter, Roboto
// ==============================================================
const styles = StyleSheet.create({
  container: { flex: 1 },

  // ---- Utility Bar (khoai + dark mode + cart) ----
  utilityBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  screenHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  screenTitle: {
    fontFamily: FONTS.jakarta,
    fontSize: 20,
    fontWeight: "900",
  },
  khoaiPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
    gap: 6,
    minHeight: 44,
    minWidth: 0,
    flexShrink: 1,
  },
  khoaiPillCompact: {
    paddingHorizontal: 8,
    gap: 4,
  },
  khoaiText: {
    fontFamily: FONTS.inter,
    fontSize: 14,
    fontWeight: "800",
    flexShrink: 1,
  },
  khoaiTextCompact: {
    fontFamily: FONTS.inter,
    fontSize: 12,
  },
  potatoIcon: {
    lineHeight: 20,
  },
  khoaiActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
  },
  topupReveal: {
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  topupButton: {
    width: "100%",
    height: 44,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  topupButtonText: {
    fontFamily: FONTS.inter,
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  utilityRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  utilityRightCompact: {
    gap: 6,
  },
  languageFlag: {
    width: 24,
    textAlign: "center",
    fontSize: 20,
    lineHeight: 24,
    marginLeft: -2,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
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
  toastMsg: { fontFamily: FONTS.roboto, fontSize: 10, marginTop: 1 },

  // ---- Section ----
  sectionWrap: { marginBottom: 18 },

  // ---- TẦNG 1: Gói Cước Đặc Quyền (Hero Card Carousel) ----
  heroCarouselContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  heroCard: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "space-between",
  },
  heroBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  heroBadgeText: {
    fontFamily: FONTS.inter,
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  heroBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heroLeftCol: {
    flex: 1,
  },
  heroLabel: {
    fontFamily: FONTS.inter,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  heroTotalKhoai: {
    fontFamily: FONTS.jakarta,
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 2,
  },
  heroBreakdown: {
    fontFamily: FONTS.roboto,
    fontSize: 12,
    fontWeight: "500",
  },
  heroRightCol: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  heroPriceText: {
    fontFamily: FONTS.inter,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  primaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontFamily: FONTS.jakarta,
    fontSize: 12.5,
    fontWeight: "700",
  },

  // ---- TẦNG 2: Gói Nạp Thường (Quick Chips 1 dòng) ----
  subSectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  subSectionTitle: {
    fontFamily: FONTS.jakarta,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: -0.1,
  },
  quickChipsRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    gap: 8,
  },
  quickChip: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  quickChipKhoai: {
    fontFamily: FONTS.inter,
    fontSize: 13.5,
    fontWeight: "800",
    textAlign: "center",
  },
  quickChipPrice: {
    fontFamily: FONTS.roboto,
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },

  // ---- TẦNG 3: Combo Sách Tiết Kiệm (Kệ sách lướt ngang) ----
  comboShelfContent: {
    paddingHorizontal: 14,
    gap: 12,
  },
  comboShelfCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  comboBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    marginBottom: 8,
  },
  comboBadgeText: {
    fontFamily: FONTS.inter,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  comboCoverBox: {
    width: "100%",
    height: 68,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginBottom: 8,
  },
  comboVolumeTag: {
    fontFamily: FONTS.roboto,
    fontSize: 9.5,
    fontWeight: "600",
  },
  comboCardTitle: {
    fontFamily: FONTS.jakarta,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17,
    marginBottom: 2,
  },
  comboGenreSub: {
    fontFamily: FONTS.roboto,
    fontSize: 10.5,
    fontWeight: "500",
    marginBottom: 8,
  },
  comboPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  comboOldPrice: {
    fontFamily: FONTS.roboto,
    fontSize: 10.5,
    textDecorationLine: "line-through",
  },
  comboNewPrice: {
    fontFamily: FONTS.inter,
    fontSize: 13.5,
    fontWeight: "800",
  },
  comboCtaBtn: {
    width: "100%",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  comboCtaBtnText: {
    fontFamily: FONTS.jakarta,
    fontSize: 11.5,
    fontWeight: "700",
  },

  // ---- TẦNG 4: Breaker (Upload & AI) ----
  breakerSection: {
    marginHorizontal: 10,
    marginBottom: 18,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  breakerHeader: {
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  breakerTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 3,
  },
  breakerTag: {
    fontFamily: FONTS.inter,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  breakerTitle: {
    fontFamily: FONTS.jakarta,
    fontSize: 12.5,
    fontWeight: "900",
    letterSpacing: -0.1,
    lineHeight: 17,
  },

  // ---- TẦNG 5: Ưu Đãi Thử Thách Đọc (Quest List) ----
  questListContainer: {
    paddingHorizontal: 14,
    gap: 10,
  },
  questCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  questIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  questContentCol: {
    flex: 1,
    gap: 3,
  },
  questTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  questTitle: {
    fontFamily: FONTS.jakarta,
    fontSize: 13.5,
    fontWeight: "800",
    flexShrink: 1,
  },
  questStreakChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  questStreakChipText: {
    fontFamily: FONTS.inter,
    fontSize: 9,
    fontWeight: "700",
  },
  questTaskSub: {
    fontFamily: FONTS.roboto,
    fontSize: 11,
    fontWeight: "500",
  },
  questRewardText: {
    fontFamily: FONTS.inter,
    fontSize: 11.5,
    fontWeight: "700",
    marginBottom: 2,
  },
  questProgressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  questProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  questActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  questActionBtnText: {
    fontFamily: FONTS.jakarta,
    fontSize: 11.5,
    fontWeight: "700",
  },

  // ---- Standard Card (Sách lẻ từ API) ----
  card: {
    width: "100%",
    minWidth: 0,
    borderRadius: 10,
    borderWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 8,
    paddingBottom: 10,
    alignItems: "center",
    minHeight: 196,
    justifyContent: "space-between",
  },
  inlineBadge: {
    alignSelf: "flex-end",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    marginBottom: 4,
    maxWidth: "100%",
  },
  inlineBadgeText: {
    fontFamily: FONTS.inter,
    color: "#F7F5F0",
    fontSize: 7.5,
    fontWeight: "800",
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  bookCategoryBadge: {
    alignSelf: "stretch",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 5,
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  bookCategoryBadgeText: {
    fontFamily: FONTS.inter,
    color: "#F7F5F0",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0.1,
    textAlign: "center",
  },
  inlineBadgePlaceholder: {
    height: 18,
    marginBottom: 4,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontFamily: FONTS.jakarta,
    width: "100%",
    fontSize: 10.5,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 14,
    marginBottom: 3,
    flexShrink: 1,
  },
  pill: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 5,
    marginBottom: 2,
    maxWidth: "100%",
  },
  pillText: {
    fontFamily: FONTS.inter,
    fontSize: 8,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 2,
    flexShrink: 1,
  },
  snippetText: {
    fontFamily: FONTS.roboto,
    width: "100%",
    fontSize: 8.5,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 2,
    flexShrink: 1,
  },
  priceRow: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    marginVertical: 2,
  },
  oldPrice: { fontFamily: FONTS.roboto, fontSize: 8, textDecorationLine: "line-through" },
  priceText: { fontFamily: FONTS.inter, fontSize: 11, fontWeight: "800", flexShrink: 1 },
  ctaBtn: {
    width: "100%",
    minHeight: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  ctaBtnText: {
    fontFamily: FONTS.jakarta,
    color: "#F7F5F0",
    fontSize: 10,
    fontWeight: "600",
    flexShrink: 1,
  },

  // Book cover
  bookCoverFrame: {
    width: 44,
    height: 60,
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 4,
  },
  bookCoverImg: { width: "100%", height: "100%" },
  bookCoverPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  // ---- Upload Card ----
  uploadCard: {
    width: "100%",
    minWidth: 0,
    borderRadius: 10,
    borderWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 7,
    paddingBottom: 8,
    alignItems: "center",
    minHeight: 176,
    justifyContent: "space-between",
  },
  inlineBadgeSmall: {
    alignSelf: "flex-end",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 3,
    maxWidth: "100%",
  },
  inlineBadgeSmallText: {
    fontFamily: FONTS.inter,
    color: "#F7F5F0",
    fontSize: 6.5,
    fontWeight: "800",
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  iconBoxSm: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3,
  },
  cardTitleSm: {
    fontFamily: FONTS.jakarta,
    width: "100%",
    fontSize: 9.5,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 13,
    marginBottom: 2,
    flexShrink: 1,
  },
  snippetTextSm: {
    fontFamily: FONTS.roboto,
    width: "100%",
    fontSize: 7.5,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 1,
    flexShrink: 1,
  },
  priceRowSm: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    marginVertical: 2,
  },
  oldPriceSm: { fontFamily: FONTS.roboto, fontSize: 7, textDecorationLine: "line-through" },
  priceTextSm: { fontFamily: FONTS.inter, fontSize: 9.5, fontWeight: "800", flexShrink: 1 },
  ctaBtnSm: {
    width: "100%",
    minHeight: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
    paddingHorizontal: 4,
    paddingVertical: 5,
  },
  ctaBtnSmText: {
    fontFamily: FONTS.jakarta,
    color: "#F7F5F0",
    fontSize: 8.5,
    fontWeight: "600",
    flexShrink: 1,
  },

  // ---- Books loading/error states ----
  booksLoadingBox: {
    paddingVertical: 24,
    alignItems: "center",
    gap: 8,
  },
  booksLoadingText: { fontFamily: FONTS.roboto, fontSize: 11, fontWeight: "600" },
  booksErrorBox: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 6,
  },
  booksErrorText: { fontFamily: FONTS.roboto, fontSize: 11, textAlign: "center" },
  booksErrorHint: { fontFamily: FONTS.inter, fontSize: 10, fontWeight: "700", textAlign: "center" },

  // ---- Modal ----
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalBox: {
    width: "100%",
    maxWidth: 330,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  modalBadge: {
    fontFamily: FONTS.inter,
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  modalHeading: { fontFamily: FONTS.jakarta, fontSize: 15, fontWeight: "900" },
  modalDescBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  modalDescLabel: { fontFamily: FONTS.inter, fontSize: 9.5, fontWeight: "600", marginBottom: 2 },
  modalDescContent: { fontFamily: FONTS.roboto, fontSize: 11.5, lineHeight: 16 },
  modalMetaRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  modalMetaCol: { flex: 1, padding: 8, borderRadius: 10, borderWidth: 1 },
  modalMetaLabel: { fontFamily: FONTS.roboto, fontSize: 9.5 },
  modalMetaVal: { fontFamily: FONTS.inter, fontSize: 12, fontWeight: "800", marginTop: 2 },
  modalBtnRow: { flexDirection: "row", gap: 8 },
  challengeActions: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
  },
  challengeSecondaryButton: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  challengeSecondaryText: {
    fontFamily: FONTS.inter,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  challengePrimaryButton: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  challengePrimaryText: {
    fontFamily: FONTS.jakarta,
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  modalCancelBtn: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: { fontFamily: FONTS.inter, fontSize: 11.5, fontWeight: "700" },
  modalConfirmBtn: {
    flex: 1.6,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmText: { fontFamily: FONTS.jakarta, color: "#FFF", fontSize: 11, fontWeight: "800" },

  // Unused — keeping for compat
  cardInnerBg: {},
});
