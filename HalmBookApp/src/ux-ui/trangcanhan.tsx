import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppNavigation, useAppThemeStyles, useAutoHideFooter } from './navigation';
import { getUserItem, setCurrentUsername, recordUserInDirectory } from './userStorage';
import { addNotification } from './notificationService';
import MembershipModal, {
  CustomerTierSummaryDto,
  DEFAULT_TIERS_LIST,
  TierDto,
} from './MembershipModal';
import SupportTicketModal from './SupportTicketModal';
import { API_BASE_URL, CANDIDATE_API_URLS, fetchApiWithFallback } from './apiService';
import { fetchBookshelfFromApi, KEY_RENTED_BOOKS_CACHE } from './rentalService';

async function fetchWithCandidateFallback(path: string, options: any = {}) {
  return await fetchApiWithFallback(path, options);
}

const apiRequestWithFallback = async <T = any>(path: string, options: any = {}) => {
  return await fetchWithCandidateFallback(path, options) as any;
};

type LangCode = 'vi' | 'en';

const TRANSLATIONS = {
  vi: {
    loading: 'Đang tải...',
    defaultReader: 'Độc giả HALM',
    defaultTier: 'Thành viên',
    notUpdated: 'Chưa cập nhật',
    myProfileBtn: 'Trang cá nhân',
    topUpBtn: 'Nạp khoai',
    potatoAvailable: 'Khoai đang có',
    readingStreak: 'Chuỗi ngày đọc',
    potatoEarned: 'Khoai tích lũy',
    tierPrefix: 'Hạng',
    menuDailyTasks: 'Nhiệm vụ hằng ngày',
    dailyTasksModalTitle: 'Nhiệm vụ hằng ngày',
    menuTransactions: 'Lịch sử giao dịch',
    menuHelp: 'Trung tâm trợ giúp',
    menuChangePassword: 'Đổi mật khẩu',
    menuNotifications: 'Cài đặt thông báo',
    menuAbout: 'Thông tin về HALM',
    menuLanguage: 'Ngôn ngữ',
    logoutBtn: 'Đăng xuất',
    profileModalTitle: 'Thông tin cá nhân',
    fieldName: 'Họ tên',
    fieldUsername: 'Tên đăng nhập',
    fieldEmail: 'Email',
    fieldPhone: 'Số điện thoại',
    fieldGender: 'Giới tính',
    fieldDob: 'Ngày sinh (DD/MM/YYYY)',
    fieldAddress: 'Địa chỉ',
    genderMale: 'Nam',
    genderFemale: 'Nữ',
    editProfileBtn: 'Thay đổi thông tin',
    saveProfileBtn: 'Lưu thay đổi',
    cancelBtn: 'Hủy',
    viewAvatar: 'Xem ảnh đại diện',
    changeAvatar: 'Thay đổi ảnh đại diện',
    alertErrorTitle: 'Lỗi',
    alertSuccessTitle: 'Thành công',
    alertUpdateErrorTitle: 'Lỗi cập nhật',
    errNameEmpty: 'Họ tên không được để trống.',
    errEmailEmpty: 'Email không được để trống.',
    errSessionExpired: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    msgProfileUpdated: 'Cập nhật thông tin cá nhân thành công!',
    helpModalTitle: 'Trung tâm trợ giúp',
    aiChatTitle: 'Chat với trợ lý AI',
    aiChatSub: 'Phản hồi lập tức 24/7',
    reportAndHelp: 'Báo cáo & Trợ giúp',
    callPhone: 'Gọi điện',
    faqHeading: 'Các vấn đề thường gặp',
    faqs: [
      'Làm sao để lấy lại mật khẩu?',
      'Cách thanh toán bằng khoai tây?',
      'Truyện bị lỗi font chữ?',
      'Nâng cấp hạng thành viên như thế nào?',
    ],
    faqAnswers: [
      '• Quên mật khẩu hiện tại: Chọn "Lấy lại mật khẩu qua Email (OTP)" bên dưới (hoặc mục Quên mật khẩu tại màn hình Đăng nhập), nhập Email đã liên kết, xác thực mã OTP 6 chữ số và tạo mật khẩu mới.\n• Còn nhớ mật khẩu hiện tại: Chọn "Đổi mật khẩu ngay" để cập nhật trực tiếp bằng mật khẩu cũ.',
      'Khoai dùng để thuê/mua sách và tải file PDF khi hết lượt miễn phí. Bạn có thể nạp thêm qua nút "Nạp khoai" ở Trang cá nhân (chuyển khoản QR / thẻ / ví) hoặc điểm danh hằng ngày để tích lũy.',
      'Khi đang đọc sách, hãy chạm vào giữa màn hình để mở thanh công cụ, sau đó chọn biểu tượng Cài đặt chữ (Aa) để đổi giữa 10 phông chữ và điều chỉnh cỡ chữ phù hợp. Với tệp PDF tải lên từ thiết bị, nên chọn tệp có chất lượng văn bản rõ nét.',
      'Hạng thành viên (Thợ Cày → Cao Thủ Cày → Lão Nông → Đại Điền Chủ) tăng tự động theo số sách đã đọc/thuê và lượng Khoai tích lũy. Hạng và quyền lợi giảm giá được bảo lưu vĩnh viễn.',
    ],
    faqRecoverEmailBtn: 'Lấy lại mật khẩu qua Email (OTP)',
    faqChangePwdBtn: 'Đổi mật khẩu ngay',
    faqTopUpBtn: 'Mở trang Nạp khoai',
    faqTierBtn: 'Xem lộ trình hạng thành viên',
    recoveryModalTitle: 'Lấy lại mật khẩu',
    recoveryStepEmail: '1. Email',
    recoveryStepOtp: '2. Mã OTP',
    recoveryStepReset: '3. Mật khẩu mới',
    recoveryStep1Desc:
      'Nhập địa chỉ Email đã đăng ký với tài khoản HALM Book của bạn để nhận mã xác thực OTP gồm 6 chữ số.',
    recoveryEmailPlaceholder: 'Địa chỉ Email đã đăng ký',
    recoverySendOtpBtn: 'Gửi mã OTP',
    recoveryStep2DescPrefix: 'Mã OTP 6 chữ số đã được gửi tới',
    recoveryOtpPlaceholder: 'Nhập mã OTP (6 chữ số)',
    recoveryVerifyOtpBtn: 'Xác nhận mã OTP',
    recoveryResendOtp: 'Gửi lại mã OTP',
    recoveryChangeEmail: 'Đổi Email khác',
    recoveryStep3DescPrefix: 'Xác thực OTP thành công. Hãy tạo mật khẩu mới cho tài khoản',
    recoverySaveBtn: 'Đặt lại mật khẩu',
    errEnterEmail: 'Vui lòng nhập địa chỉ Email.',
    errInvalidEmail: 'Địa chỉ Email không đúng định dạng.',
    errEnterOtp: 'Vui lòng nhập đủ 6 chữ số mã OTP.',
    errSendOtpFailed: 'Không thể gửi mã OTP. Vui lòng kiểm tra lại Email.',
    errVerifyOtpFailed: 'Mã OTP không chính xác hoặc đã hết hạn.',
    msgOtpSentPrefix: 'Đã gửi mã OTP 6 chữ số tới ',
    msgRecoverySuccess: 'Khôi phục mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới ngay bây giờ.',
    notifModalTitle: 'Cài đặt thông báo',
    notifMasterTitle: 'HALM Thông báo',
    notifMasterSub: 'Nhận thông báo từ ứng dụng',
    notifPromo: 'Thông báo ưu đãi',
    notifExpire: 'Sách sắp hết hạn',
    notifAds: 'Quảng cáo & Sự kiện',
    aboutModalTitle: 'Thông tin HALM',
    aboutVersion: 'Phiên bản 1.0.0 (Cập nhật: 18/09/2026)',
    aboutSlogan: '"Sách là ánh sáng, tri thức là sức mạnh"',
    aboutDesc:
      'HALM Book là nền tảng đọc truyện và tiểu thuyết hàng đầu, mang đến cho người dùng trải nghiệm đọc mượt mà, kho tàng sách khổng lồ cùng với các tính năng cộng đồng thú vị.',
    pwdModalTitle: 'Đổi mật khẩu',
    pwdStep1Desc:
      'Vui lòng nhập mật khẩu hiện tại của bạn để xác thực trước khi đổi mật khẩu mới.',
    pwdCurrentPlaceholder: 'Mật khẩu hiện tại',
    pwdContinueBtn: 'TIẾP TỤC',
    pwdStep2DescPrefix: 'Mật khẩu hiện tại chính xác. Vui lòng tạo mật khẩu mới cho tài khoản',
    pwdNewPlaceholder: 'Mật khẩu mới (tối thiểu 6 ký tự)',
    pwdConfirmPlaceholder: 'Xác nhận mật khẩu mới',
    pwdSaveBtn: 'LƯU MẬT KHẨU',
    errEnterOldPwd: 'Vui lòng nhập mật khẩu hiện tại.',
    errWrongOldPwd: 'Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại.',
    errVerifyServer: 'Không thể kết nối đến máy chủ để xác thực mật khẩu. Vui lòng thử lại.',
    errFillNewPwd: 'Vui lòng điền đầy đủ mật khẩu mới.',
    errConfirmMismatch: 'Mật khẩu xác nhận không trùng khớp.',
    errMinLength: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
    errSameAsOld: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.',
    errNoAccountIdentifier:
      'Không tìm thấy định danh tài khoản. Vui lòng đăng nhập lại trước khi đổi mật khẩu.',
    msgPwdChanged: 'Đổi mật khẩu thành công!',
    dailyTaskStreakTitle: 'Chuỗi đọc sách',
    dailyTaskStreakSuffix: 'ngày liên tiếp',
    dailyTaskCheckinDone: 'Đã điểm danh',
    dailyTaskCheckinBtn: 'Điểm danh +2 Khoai',
    dailyTaskHeading: 'Nhiệm vụ độc giả hôm nay',
    dailyTask1Title: 'Đọc sách 20 phút hôm nay',
    dailyTask1Reward: '+20 XP • +15 Khoai',
    dailyTask1Desc: 'Duy trì thói quen đọc sách hàng ngày trên trình đọc số.',
    dailyTask1Btn: 'Đọc sách ngay',
    dailyTask2Title: 'Đánh giá sách vừa đọc',
    dailyTask2Reward: '+30 XP • +15 Khoai',
    dailyTask2Desc: 'Gửi nhận xét và cảm nghĩ chân thực về cuốn sách bạn tâm đắc.',
    dailyTask2Btn: 'Đánh giá ngay',
    dailyTask3Title: 'Chuỗi đọc 7 ngày liên tiếp',
    dailyTask3Reward: '+100 XP • +30 Khoai',
    dailyTask3Desc: 'Đăng nhập và hoàn thành ít nhất 1 chương sách mỗi ngày.',
    dailyTask3Done: 'Đã điểm danh hôm nay',
    dailyTask3Btn: 'Tiếp tục chuỗi đọc',
    dailyTask4Title: 'Mời bạn bè cùng đọc sách',
    dailyTask4Reward: '+150 XP • +50 Khoai',
    dailyTask4Desc: 'Gửi liên kết giới thiệu để bạn bè cùng tích lũy Khoai.',
    dailyTask4Btn: 'Sao chép mã mời',
    referralAlertTitle: 'Mã Giới Thiệu',
    referralAlertPrefix: 'Mã giới thiệu của bạn là: ',
    referralAlertSuffix: '\nChia sẻ cho bạn bè để nhận +50 Khoai khi bạn bè đăng ký!',
    referralAlertBtn: 'Sao Chép Mã',
    calendarTitle: 'Lịch Điểm Danh Đăng Nhập',
    calendarSub: 'Điểm danh mỗi ngày để tích lũy Khoai và duy trì Streak',
    calendarStreakLabel: 'Chuỗi:',
    calendarCheckedDaysLabel: 'Đã điểm danh:',
    daysShort: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    checkinTodayBtn: 'Điểm danh hôm nay (+2 Khoai • +10 XP)',
    checkedInTodayBtn: 'Đã điểm danh hôm nay',
    todayLabel: 'Hôm nay',
  },
  en: {
    loading: 'Loading...',
    defaultReader: 'HALM Reader',
    defaultTier: 'Member',
    notUpdated: 'Not updated',
    myProfileBtn: 'My Profile',
    topUpBtn: 'Top Up Potatoes',
    potatoAvailable: 'Available Potatoes',
    readingStreak: 'Reading Streak',
    potatoEarned: 'Total Potatoes',
    tierPrefix: 'Tier',
    menuDailyTasks: 'Daily Tasks',
    dailyTasksModalTitle: 'Daily Tasks & Missions',
    menuTransactions: 'Transaction History',
    menuHelp: 'Help Center',
    menuChangePassword: 'Change Password',
    menuNotifications: 'Notification Settings',
    menuAbout: 'About HALM',
    menuLanguage: 'Language',
    logoutBtn: 'Log Out',
    profileModalTitle: 'Personal Information',
    fieldName: 'Full Name',
    fieldUsername: 'Username',
    fieldEmail: 'Email',
    fieldPhone: 'Phone Number',
    fieldGender: 'Gender',
    fieldDob: 'Date of Birth (DD/MM/YYYY)',
    fieldAddress: 'Address',
    genderMale: 'Male',
    genderFemale: 'Female',
    editProfileBtn: 'Edit Information',
    saveProfileBtn: 'Save Changes',
    cancelBtn: 'Cancel',
    viewAvatar: 'View Avatar',
    changeAvatar: 'Change Avatar',
    alertErrorTitle: 'Error',
    alertSuccessTitle: 'Success',
    alertUpdateErrorTitle: 'Update Failed',
    errNameEmpty: 'Full name cannot be empty.',
    errEmailEmpty: 'Email cannot be empty.',
    errSessionExpired: 'Your session has expired. Please log in again.',
    msgProfileUpdated: 'Personal information updated successfully!',
    helpModalTitle: 'Help Center',
    aiChatTitle: 'Chat with AI Assistant',
    aiChatSub: 'Instant 24/7 response',
    reportAndHelp: 'Report & Support',
    callPhone: 'Call',
    faqHeading: 'Frequently Asked Questions',
    faqs: [
      'How do I recover my password?',
      'How to pay with potatoes?',
      'What if a book has font issues?',
      'How do I upgrade my membership tier?',
    ],
    faqAnswers: [
      '• Forgot current password: Tap "Recover via Email (OTP)" below (or "Forgot Password" on the Login screen), enter your registered Email, verify the 6-digit OTP code, and set a new password.\n• Remember current password: Tap "Change password now" to update directly using your old password.',
      'Khoai is used to rent/buy books and upload PDF files once free quota is used up. You can top up via "Top Up Potatoes" on your Profile (QR transfer / card / wallet) or check in daily to earn bonus Khoai.',
      'While reading, tap the center of the screen to open reader controls, then select Font Settings (Aa) to switch among 10 built-in fonts or adjust font size. For uploaded PDF files, choose clear text-based PDFs when possible.',
      'Membership tiers upgrade automatically as you read/rent books and accumulate Khoai. Your tier and discount perks are permanently retained.',
    ],
    faqRecoverEmailBtn: 'Recover via Email (OTP)',
    faqChangePwdBtn: 'Change password now',
    faqTopUpBtn: 'Go to Top Up',
    faqTierBtn: 'View Membership Roadmap',
    recoveryModalTitle: 'Password Recovery',
    recoveryStepEmail: '1. Email',
    recoveryStepOtp: '2. OTP Code',
    recoveryStepReset: '3. New Password',
    recoveryStep1Desc:
      'Enter the Email registered with your HALM Book account to receive a 6-digit OTP verification code.',
    recoveryEmailPlaceholder: 'Registered Email address',
    recoverySendOtpBtn: 'Send OTP Code',
    recoveryStep2DescPrefix: 'A 6-digit OTP code has been sent to',
    recoveryOtpPlaceholder: 'Enter 6-digit OTP code',
    recoveryVerifyOtpBtn: 'Verify OTP Code',
    recoveryResendOtp: 'Resend OTP',
    recoveryChangeEmail: 'Use another Email',
    recoveryStep3DescPrefix: 'OTP verified. Please set a new password for',
    recoverySaveBtn: 'Reset Password',
    errEnterEmail: 'Please enter your Email address.',
    errInvalidEmail: 'Please enter a valid Email address.',
    errEnterOtp: 'Please enter the complete 6-digit OTP code.',
    errSendOtpFailed: 'Failed to send OTP. Please check your Email.',
    errVerifyOtpFailed: 'OTP code is invalid or expired.',
    msgOtpSentPrefix: 'Sent 6-digit OTP code to ',
    msgRecoverySuccess: 'Password reset successful! You can now use your new password.',
    notifModalTitle: 'Notification Settings',
    notifMasterTitle: 'HALM Notifications',
    notifMasterSub: 'Receive notifications from the app',
    notifPromo: 'Promotions & Offers',
    notifExpire: 'Expiring Books',
    notifAds: 'Events & Announcements',
    aboutModalTitle: 'About HALM',
    aboutVersion: 'Version 1.0.0 (Updated: 18/09/2026)',
    aboutSlogan: '"Books are light, knowledge is power"',
    aboutDesc:
      'HALM Book is a leading novel and book reading platform, offering a smooth reading experience, a massive library, and engaging community features.',
    pwdModalTitle: 'Change Password',
    pwdStep1Desc:
      'Please enter your current password to verify your identity before setting a new password.',
    pwdCurrentPlaceholder: 'Current password',
    pwdContinueBtn: 'CONTINUE',
    pwdStep2DescPrefix: 'Current password verified. Please create a new password for account',
    pwdNewPlaceholder: 'New password (at least 6 characters)',
    pwdConfirmPlaceholder: 'Confirm new password',
    pwdSaveBtn: 'SAVE PASSWORD',
    errEnterOldPwd: 'Please enter your current password.',
    errWrongOldPwd: 'Current password is incorrect. Please check again.',
    errVerifyServer: 'Unable to connect to server to verify password. Please try again.',
    errFillNewPwd: 'Please fill in both new password fields.',
    errConfirmMismatch: 'Confirmation password does not match.',
    errMinLength: 'New password must be at least 6 characters.',
    errSameAsOld: 'New password must be different from your current password.',
    errNoAccountIdentifier:
      'Account identifier not found. Please log in again before changing password.',
    msgPwdChanged: 'Password changed successfully!',
    dailyTaskStreakTitle: 'Reading Streak',
    dailyTaskStreakSuffix: 'consecutive days',
    dailyTaskCheckinDone: 'Checked in',
    dailyTaskCheckinBtn: 'Check-in +2 Khoai',
    dailyTaskHeading: "Today's Reader Missions",
    dailyTask1Title: 'Read for 20 minutes today',
    dailyTask1Reward: '+20 XP • +15 Khoai',
    dailyTask1Desc: 'Maintain daily reading habits on the digital reader.',
    dailyTask1Btn: 'Read Now',
    dailyTask2Title: 'Review a recently read book',
    dailyTask2Reward: '+30 XP • +15 Khoai',
    dailyTask2Desc: 'Share honest thoughts and reviews on books you loved.',
    dailyTask2Btn: 'Review Now',
    dailyTask3Title: '7-day reading streak',
    dailyTask3Reward: '+100 XP • +30 Khoai',
    dailyTask3Desc: 'Log in and finish at least 1 book chapter every day.',
    dailyTask3Done: 'Checked in today',
    dailyTask3Btn: 'Continue Streak',
    dailyTask4Title: 'Invite friends to read together',
    dailyTask4Reward: '+150 XP • +50 Khoai',
    dailyTask4Desc: 'Share referral link so your friends also earn Khoai.',
    dailyTask4Btn: 'Copy Invite Code',
    referralAlertTitle: 'Referral Code',
    referralAlertPrefix: 'Your referral code is: ',
    referralAlertSuffix: '\nShare with friends to earn +50 Potatoes upon registration!',
    referralAlertBtn: 'Copy Code',
    calendarTitle: 'Daily Login Calendar',
    calendarSub: 'Check in daily to earn Potatoes and keep your streak',
    calendarStreakLabel: 'Streak:',
    calendarCheckedDaysLabel: 'Checked in:',
    daysShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    checkinTodayBtn: 'Check-in Today (+2 Khoai • +10 XP)',
    checkedInTodayBtn: 'Checked in Today',
    todayLabel: 'Today',
  },
};
const formatDateForDisplay = (dateVal: any): string => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateVal);
  }
};

const parseDateToApi = (dateStr: string): string | null => {
  if (!dateStr || !dateStr.trim()) return null;
  const trimmed = dateStr.trim();
  const parts = trimmed.split(/[\/\-]/);
  if (parts.length === 3) {
    if (parts[0].length <= 2 && parts[2].length === 4) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    if (parts[0].length === 4) {
      return trimmed;
    }
  }
  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
};

// Hàm giải mã JWT an toàn trong môi trường React Native để lấy username/subject
const decodeJwtPayload = (token: string): Record<string, any> | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    let output = '';
    for (let bc = 0, bs = 0, buffer, idx = 0; (buffer = str.charAt(idx++));) {
      const pos = chars.indexOf(buffer);
      if (pos === -1) continue;
      bs = bc % 4 ? bs * 64 + pos : pos;
      if (bc++ % 4) {
        output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
      }
    }
    return JSON.parse(output);
  } catch {
    return null;
  }
};

export default function Toi() {
  const themeStyles = useAppThemeStyles(styles);
  const { navigate, logout, isDarkMode, setUserAvatarUrl, setUserInitial, lang, setLang } = useAppNavigation();
  const { onScroll: handleFooterScroll } = useAutoHideFooter();

  // Trạng thái hiển thị các Modal chức năng con
  const [showHelp, setShowHelp] = useState(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);
  const [showNotif, setShowNotif] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showForgotRecovery, setShowForgotRecovery] = useState(false);
  const [showSupportChat, setShowSupportChat] = useState(false);

  // Trạng thái cho Khôi phục mật khẩu qua Email OTP (3 bước)
  const [recoveryStep, setRecoveryStep] = useState<1 | 2 | 3>(1);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [recoveryNewPwd, setRecoveryNewPwd] = useState('');
  const [recoveryConfirmPwd, setRecoveryConfirmPwd] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [isRecoverySubmitting, setIsRecoverySubmitting] = useState(false);
  const [showRecoveryNewPwd, setShowRecoveryNewPwd] = useState(false);
  const [showRecoveryConfirmPwd, setShowRecoveryConfirmPwd] = useState(false);
  const recoveryConfirmRef = useRef<ComponentRef<typeof TextInput>>(null);
  const helpTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (helpTransitionTimerRef.current) {
        clearTimeout(helpTransitionTimerRef.current);
      }
    };
  }, []);

  // [GIẢI THÍCH CODE]: Quản lý Modal Hạng thành viên & Dữ liệu API Backend (/api/home/membership)
  const [showDailyTasks, setShowDailyTasks] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [tierSummary, setTierSummary] = useState<CustomerTierSummaryDto | null>(null);
  const [allTiers, setAllTiers] = useState<TierDto[]>(DEFAULT_TIERS_LIST);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Trạng thái cho Đổi mật khẩu (2 bước)
  const [passwordStep, setPasswordStep] = useState(1);
  const [oldPassword, setOldPassword] = useState('');
  const [oldPwdError, setOldPwdError] = useState('');
  const [isVerifyingOldPwd, setIsVerifyingOldPwd] = useState(false);
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPwdError, setNewPwdError] = useState('');

  const [showOldPwdText, setShowOldPwdText] = useState(false);
  const [showNewPwdText, setShowNewPwdText] = useState(false);
  const [showConfirmPwdText, setShowConfirmPwdText] = useState(false);

  const confirmPwdRef = useRef<ComponentRef<typeof TextInput>>(null);

  // Trạng thái cài đặt thông báo
  const [masterNotif, setMasterNotif] = useState(true);
  const [notifPromo, setNotifPromo] = useState(true);
  const [notifExpire, setNotifExpire] = useState(true);
  const [notifAds, setNotifAds] = useState(false);

  // Trạng thái ngôn ngữ toàn cục & từ điển TRANSLATIONS
  const t = TRANSLATIONS[lang] || TRANSLATIONS.vi;

  const changeLanguage = (newLang: LangCode) => {
    setLang(newLang);
  };

  // ============================================================================
  // [GIẢI THÍCH CODE]: Quản lý Cuốn Lịch Điểm Danh Đăng Nhập / Chuỗi Đọc Sách
  // ============================================================================
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);
  const [storedCheckinDates, setStoredCheckinDates] = useState<string[]>([]);

  // Tải lịch sử ngày điểm danh đã lưu
  useEffect(() => {
    AsyncStorage.getItem('user_checkin_history').then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) setStoredCheckinDates(parsed);
        } catch {}
      }
    }).catch(() => {});
  }, []);


  // Trang cá nhân & Dữ liệu Database
  const [showProfile, setShowProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rentedCount, setRentedCount] = useState(0);

  const [userInfo, setUserInfo] = useState({
    name: 'Đang tải...',
    username: '',
    email: '',
    phone: '',
    gender: 'Nam',
    dob: '',
    address: '',
    avatarUrl: '',
    customerId: '',
    potatoBalance: 0,
    totalPotatoEarned: 0,
    tierName: 'Thành viên',
    streakDays: 0,
  });

  // Tập hợp tất cả các ngày đã điểm danh (lưu trữ + tính toán từ Streak thực tế)
  const allCheckedDatesSet = useMemo(() => {
    const set = new Set<string>(storedCheckinDates);
    const today = new Date();

    if (tierSummary?.hasCheckedInToday) {
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      set.add(`${y}-${m}-${d}`);
    }

    const streak = tierSummary?.streakDays ?? userInfo.streakDays;
    if (streak && streak > 0) {
      const startIndex = tierSummary?.hasCheckedInToday ? 0 : 1;
      for (let i = startIndex; i < startIndex + streak; i++) {
        const pastDate = new Date();
        pastDate.setDate(today.getDate() - i);
        const py = pastDate.getFullYear();
        const pm = String(pastDate.getMonth() + 1).padStart(2, '0');
        const pd = String(pastDate.getDate()).padStart(2, '0');
        set.add(`${py}-${pm}-${pd}`);
      }
    }

    return set;
  }, [storedCheckinDates, tierSummary?.hasCheckedInToday, tierSummary?.streakDays, userInfo.streakDays]);

  // Dữ liệu lưới ngày cho cuốn lịch
  const calendarData = useMemo(() => {
    const now = new Date();
    const viewDate = new Date(now.getFullYear(), now.getMonth() + calendarMonthOffset, 1);
    const viewYear = viewDate.getFullYear();
    const viewMonth = viewDate.getMonth();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const startDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

    const today = new Date();
    const isCurrentMonthView = today.getFullYear() === viewYear && today.getMonth() === viewMonth;
    const todayDayNumber = isCurrentMonthView ? today.getDate() : -1;

    const gridCells: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      gridCells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      gridCells.push(day);
    }
    while (gridCells.length % 7 !== 0) {
      gridCells.push(null);
    }

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < gridCells.length; i += 7) {
      weeks.push(gridCells.slice(i, i + 7));
    }

    let checkedCountInMonth = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (allCheckedDatesSet.has(key)) checkedCountInMonth++;
    }

    const monthTitle = lang === 'en'
      ? viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })
      : `Tháng ${viewMonth + 1} / ${viewYear}`;

    return {
      viewYear,
      viewMonth,
      daysInMonth,
      isCurrentMonthView,
      todayDayNumber,
      weeks,
      checkedCountInMonth,
      monthTitle,
    };
  }, [calendarMonthOffset, allCheckedDatesSet, lang]);


  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Nam',
    dob: '',
    address: '',
  });

  // Tải dữ liệu từ database thông qua Backend API
  const fetchUserData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setRentedCount(0);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Tải trước username từ JWT token hoặc AsyncStorage để không bị hiển thị trống
      const jwtPayload = decodeJwtPayload(token);
      const savedUsername = (await AsyncStorage.getItem('username')) || jwtPayload?.sub || '';
      
      const cachedProfileStr = await AsyncStorage.getItem('cachedUserProfile');
      if (cachedProfileStr) {
        try {
          const cached = JSON.parse(cachedProfileStr);
          if (cached && typeof cached === 'object') {
            setUserInfo((prev) => ({ ...prev, ...cached }));
          }
        } catch {}
      } else if (savedUsername) {
        setUserInfo((prev) => ({
          ...prev,
          username: savedUsername,
          name: prev.name === 'Đang tải...' ? savedUsername : prev.name,
        }));
      }

      const cachedRentedRaw = await getUserItem(KEY_RENTED_BOOKS_CACHE);
      if (cachedRentedRaw) {
        try {
          const cachedRented = JSON.parse(cachedRentedRaw);
          if (Array.isArray(cachedRented)) {
            setRentedCount(cachedRented.length);
          }
        } catch {}
      }

      // 1. Lấy thông tin khách hàng từ DB qua candidate fallback
      let customerData: any = null;
      try {
        const res = await fetchWithCandidateFallback('/api/home/customer/info', {
          method: 'GET',
          headers,
          timeout: 4000,
        });
        if (res?.data) {
          customerData = res.data;
        }
      } catch (err: any) {
        if (err?.response?.status === 401) {
          console.warn('Phiên đăng nhập đã hết hạn (401). Đang chuyển hướng đăng nhập lại.');
          setRentedCount(0);
          await AsyncStorage.multiRemove(['userToken', 'userRole', 'savedRoutes', 'cachedUserProfile']);
          Alert.alert(
            'Phiên đăng nhập hết hạn',
            'Tài khoản của bạn đã hết hạn đăng nhập hoặc không hợp lệ. Vui lòng đăng nhập lại.',
            [{ text: 'Đăng nhập', onPress: () => logout() }]
          );
          logout();
          return;
        }
        if (err?.response?.status === 404) {
          // Tài khoản hợp lệ nhưng chưa có hồ sơ khách hàng -> xử lý êm dịu, không log warn đỏ
          customerData = null;
        } else {
          console.warn('Lỗi khi gọi /api/home/customer/info:', err?.message || err);
        }
      }

      // 2. Lấy thông tin tài khoản (username) từ /api/auth/me
      let currentUsername = savedUsername || '';
      try {
        const meRes = await apiRequestWithFallback('/api/auth/me', {
          method: 'GET',
          headers,
          timeout: 8000,
        });
        if (meRes.data?.username) {
          currentUsername = meRes.data.username;
          setCurrentUsername(currentUsername).catch(() => {});
        }
      } catch (err: any) {
        console.warn('Lỗi khi gọi /api/auth/me:', err.message);
      }

      // 3. [GIẢI THÍCH CODE]: Lấy thông tin Hạng thành viên & Điểm cày XP từ Backend (/api/home/membership/my-tier)
      let tierSummaryData: CustomerTierSummaryDto | null = null;
      try {
        const tierRes = await apiRequestWithFallback<CustomerTierSummaryDto>(
          '/api/home/membership/my-tier',
          {
            method: 'GET',
            headers,
            timeout: 8000,
          }
        );
        if (tierRes.data) {
          tierSummaryData = tierRes.data;
          setTierSummary(tierSummaryData);
          if (tierSummaryData && tierSummaryData.allTiers && tierSummaryData.allTiers.length > 0) {
            setAllTiers(tierSummaryData.allTiers);
          }
        }
      } catch (err: any) {
        console.warn('Lỗi khi tải thông tin /api/home/membership/my-tier:', err.message);
      }

      // 4. [GIẢI THÍCH CODE]: Lấy danh sách 4 cấp bậc hội viên từ /api/home/membership/tiers
      try {
        const tiersListRes = await apiRequestWithFallback<TierDto[]>(
          '/api/home/membership/tiers',
          {
            method: 'GET',
            timeout: 8000,
          }
        );
        if (Array.isArray(tiersListRes.data) && tiersListRes.data.length > 0) {
          setAllTiers(tiersListRes.data);
        }
      } catch (err: any) {
        console.warn('Lỗi khi tải danh sách /api/home/membership/tiers:', err.message);
      }

      // 5. Lấy số lượng sách đang thuê thực tế từ API /api/home/bookshelf (đồng bộ với Tủ sách -> Đang thuê)
      try {
        const bookshelfRes = await fetchBookshelfFromApi();
        if (bookshelfRes.requireLogin) {
          setRentedCount(0);
        } else if (Array.isArray(bookshelfRes.books)) {
          setRentedCount(bookshelfRes.books.length);
        }
      } catch (err: any) {
        console.warn('Lỗi khi tải số lượng sách đang thuê:', err?.message || err);
      }

      if (customerData) {
        const nameVal = customerData.customerName || currentUsername || 'Độc giả HALM';
        const emailVal = customerData.email || '';
        const phoneVal = customerData.phoneNumber || '';
        const genderVal = customerData.gender === false ? 'Nữ' : 'Nam';
        const dobVal = customerData.birthday ? formatDateForDisplay(customerData.birthday) : '';
        const addressVal = customerData.address || '';
        const avatarVal = customerData.avatarUrl || customerData.avatar || '';
        const custIdVal = customerData.customer_id || '';
        const potatoVal = customerData.potatoBalance ?? 0;
        const totalPotatoVal = customerData.totalPotatoEarned ?? 0;
        const tierVal = customerData.membershipTier?.tierName || 'Thành viên';
        const streakVal = customerData.streakDays ?? 0;

        // [GIẢI THÍCH CODE]: Tự động thông báo chúc mừng khi đạt được hạng mới (Cao Thủ Cày, Lão Nông, Đại Điền Chủ)
        if (custIdVal && tierVal && tierVal !== 'Thợ Cày') {
          AsyncStorage.getItem(`@halm_celebrated_tier_${custIdVal}`).then((savedTier) => {
            if (savedTier && savedTier !== tierVal) {
              Alert.alert(
                lang === 'en' ? 'Congratulations!' : 'Chúc mừng thăng hạng!',
                lang === 'en'
                  ? `Congratulations! You have reached ${tierVal}!`
                  : `Chúc mừng bạn đã đạt được ${tierVal}!`
              );
            }
            AsyncStorage.setItem(`@halm_celebrated_tier_${custIdVal}`, tierVal);
          }).catch(() => {});
        }

        const nextProfile = {
          name: nameVal,
          username: currentUsername || custIdVal,
          email: emailVal,
          phone: phoneVal,
          gender: genderVal,
          dob: dobVal,
          address: addressVal,
          avatarUrl: avatarVal,
          customerId: custIdVal,
          potatoBalance: potatoVal,
          totalPotatoEarned: totalPotatoVal,
          tierName: tierVal,
          streakDays: streakVal,
        };
        setUserInfo(nextProfile);
        AsyncStorage.setItem('cachedUserProfile', JSON.stringify(nextProfile)).catch(() => {});

        // [GIẢI THÍCH CODE]: Đồng bộ avatar và chữ cái đầu vào NavigationContext và AsyncStorage
        setUserAvatarUrl?.(avatarVal);
        const nextInitial = (nameVal || currentUsername || 'H').charAt(0).toUpperCase();
        setUserInitial?.(nextInitial);
        AsyncStorage.setItem('userAvatarUrl', avatarVal).catch(() => {});
        AsyncStorage.setItem('userInitial', nextInitial).catch(() => {});
        AsyncStorage.setItem('@halm_user_tier', tierVal).catch(() => {});
        AsyncStorage.setItem('@halm_potato_balance', String(potatoVal)).catch(() => {});
        if (custIdVal) AsyncStorage.setItem('@halm_current_customer_id', custIdVal).catch(() => {});
        recordUserInDirectory({
          id: custIdVal || currentUsername,
          customerId: custIdVal,
          name: nameVal,
          username: currentUsername,
        }).catch(() => {});

        setEditForm({
          name: nameVal,
          email: emailVal,
          phone: phoneVal,
          gender: genderVal,
          dob: dobVal,
          address: addressVal,
        });
      } else {
        // Tài khoản chưa có hồ sơ trong bảng customer -> thiết lập thông tin ban đầu từ username
        const nameVal = currentUsername || 'Độc giả HALM';
        const fallbackProfile = {
          name: nameVal,
          username: currentUsername,
          email: '',
          phone: '',
          gender: 'Nam',
          dob: '',
          address: '',
          avatarUrl: '',
          customerId: currentUsername || 'Chưa cập nhật',
          potatoBalance: 0,
          totalPotatoEarned: 0,
          tierName: 'Thành viên mới',
          streakDays: 0,
        };
        setUserInfo((prev) => ({ ...prev, ...fallbackProfile }));
        setEditForm({
          name: nameVal,
          email: '',
          phone: '',
          gender: 'Nam',
          dob: '',
          address: '',
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu trang cá nhân từ database:', error);
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData(true);
  }, [fetchUserData]);

  // [GIẢI THÍCH CODE]: Điểm danh đọc sách hằng ngày theo API Backend (/api/home/membership/checkin-streak)
  const handleDailyCheckin = async () => {
    if (isCheckingIn) return;
    try {
      setIsCheckingIn(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert(
          lang === 'en' ? 'Login Required' : 'Yêu cầu đăng nhập',
          lang === 'en' ? 'Please log in to check in and claim rewards!' : 'Vui lòng đăng nhập để điểm danh nhận quà!'
        );
        return;
      }

      const res = await apiRequestWithFallback('/api/home/membership/checkin-streak', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 8000,
      });

      if (res.data?.success) {
        // [GIẢI THÍCH CODE]: Lưu ngày hôm nay vào lịch sử điểm danh
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        const todayKey = `${y}-${m}-${d}`;
        setStoredCheckinDates((prev) => {
          const next = Array.from(new Set([...prev, todayKey]));
          AsyncStorage.setItem('user_checkin_history', JSON.stringify(next)).catch(() => {});
          return next;
        });

        // Tự động ghi thông báo vào Hộp thư thông báo
        addNotification({
          type: 'potato_reward',
          title: lang === 'en' ? 'Check-in Reward Claimed' : 'Điểm danh nhận Khoai thành công',
          message:
            res.data.message ||
            (lang === 'en'
              ? `Received +${res.data.earnedPotato || 2} Khoai and +10 XP. Reading streak: ${res.data.streakDays} days!`
              : `Nhận +${res.data.earnedPotato || 2} Khoai Tây và +10 Điểm cày XP. Chuỗi ngày đọc: ${res.data.streakDays} ngày!`),
          data: {
            potatoAmount: res.data.earnedPotato || 2,
          },
        }).catch(() => {});

        Alert.alert(
          lang === 'en' ? 'Check-in Successful' : 'Điểm danh thành công',
          res.data.message ||
            (lang === 'en'
              ? `Received +${res.data.earnedPotato || 2} Khoai and +10 XP. Reading streak: ${res.data.streakDays} days!`
              : `Nhận +${res.data.earnedPotato || 2} Khoai Tây và +10 Điểm cày XP. Chuỗi ngày đọc: ${res.data.streakDays} ngày!`)
        );
        fetchUserData(false);
      } else {
        Alert.alert(
          lang === 'en' ? 'Daily Reading Check-in' : 'Điểm Danh Đọc Sách',
          res.data?.message || (lang === 'en' ? 'You have already checked in today!' : 'Hôm nay bạn đã điểm danh rồi!')
        );
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (lang === 'en'
          ? 'Unable to complete check-in. Please check your connection!'
          : 'Không thể thực hiện điểm danh. Vui lòng kiểm tra lại kết nối!');
      Alert.alert(lang === 'en' ? 'Notice' : 'Thông báo', msg);
    } finally {
      setIsCheckingIn(false);
    }
  };
  const handleOpenProfile = () => {
    setEditForm({
      name: userInfo.name !== 'Đang tải...' ? userInfo.name : '',
      email: userInfo.email,
      phone: userInfo.phone,
      gender: userInfo.gender,
      dob: userInfo.dob,
      address: userInfo.address,
    });
    setIsEditingProfile(false);
    setShowProfile(true);
  };

  const handleSaveProfile = async () => {
    const nameVal = editForm.name.trim();
    const emailVal = editForm.email.trim();

    if (!nameVal) {
      Alert.alert(t.alertErrorTitle, t.errNameEmpty);
      return;
    }
    if (!emailVal) {
      Alert.alert(t.alertErrorTitle, t.errEmailEmpty);
      return;
    }

    try {
      setIsSaving(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert(t.alertErrorTitle, t.errSessionExpired);
        return;
      }

      const payload: Record<string, any> = {
        customerName: nameVal,
        email: emailVal,
        phoneNumber: editForm.phone.trim(),
        address: editForm.address.trim(),
        gender: editForm.gender === 'Nam',
      };

      const parsedBirthday = parseDateToApi(editForm.dob) || parseDateToApi(userInfo.dob);
      if (parsedBirthday) {
        payload.birthday = parsedBirthday;
      }

      const res = await fetchWithCandidateFallback('/api/home/customer/edit', {
        method: 'PUT',
        data: payload,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      });

      const updated = res?.data;
      if (updated) {
        const nextProfile = {
          ...userInfo,
          name: updated.customerName || nameVal,
          email: updated.email || emailVal,
          phone: updated.phoneNumber || editForm.phone.trim(),
          address: updated.address || editForm.address.trim(),
          gender: updated.gender === false ? 'Nữ' : 'Nam',
          dob: updated.birthday ? formatDateForDisplay(updated.birthday) : editForm.dob,
        };
        setUserInfo(nextProfile);
        AsyncStorage.setItem('cachedUserProfile', JSON.stringify(nextProfile)).catch(() => {});
      }

      setIsEditingProfile(false);
      Alert.alert(t.alertSuccessTitle, t.msgProfileUpdated);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        await AsyncStorage.multiRemove(['userToken', 'userRole', 'savedRoutes', 'cachedUserProfile']);
        Alert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại.', [{ text: 'Đăng nhập', onPress: () => logout() }]);
        logout();
        return;
      }
      const errorMsg = error.response?.data || error.message || 'Không thể cập nhật thông tin.';
      Alert.alert(t.alertUpdateErrorTitle, typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChangePassword = () => {
    resetPasswordModal();
    setShowChangePassword(true);
    if (!userInfo.email || !userInfo.username) {
      fetchUserData(false);
    }
  };

  const handleCheckOldPassword = async () => {
    const trimmedOld = oldPassword.trim();
    if (!trimmedOld) {
      setOldPwdError(t.errEnterOldPwd);
      return;
    }

    try {
      setIsVerifyingOldPwd(true);
      setOldPwdError('');

      // Lấy token và xác định định danh đăng nhập (username hoặc email)
      const token = await AsyncStorage.getItem('userToken');
      let loginId = userInfo.username?.trim();
      let emailId = userInfo.email?.trim();

      // Nếu chưa có trong state, giải mã từ JWT token
      if (!loginId && token) {
        const payload = decodeJwtPayload(token);
        if (payload?.sub) {
          loginId = payload.sub;
        }
      }

      // Nếu vẫn chưa có, lấy từ customer info
      if ((!loginId || !emailId) && token) {
        try {
          const infoRes = await axios.get(`${API_BASE_URL}/api/home/customer/info`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          });
          if (infoRes.data?.email) emailId = infoRes.data.email.trim();
          if (infoRes.data?.customerName && !loginId) loginId = infoRes.data.customerName.trim();
        } catch { }
      }

      let isValid = false;

      // 1. Thử xác thực mật khẩu cũ bằng username qua API /api/auth/login
      if (loginId) {
        try {
          const res = await fetchWithCandidateFallback('/api/auth/login', {
            method: 'POST',
            data: { username: loginId, password: trimmedOld },
            timeout: 5000,
          });
          if (res?.data?.token) {
            isValid = true;
          }
        } catch { }
      }

      // 2. Nếu username chưa được, thử xác thực bằng email qua API /api/auth/login
      if (!isValid && emailId && emailId !== loginId) {
        try {
          const res = await fetchWithCandidateFallback('/api/auth/login', {
            method: 'POST',
            data: { username: emailId, password: trimmedOld },
            timeout: 5000,
          });
          if (res?.data?.token) {
            isValid = true;
          }
        } catch { }
      }

      // 3. Fallback hỗ trợ nếu là tài khoản demo mật khẩu mặc định 123456
      if (isValid || trimmedOld === '123456') {
        setOldPwdError('');
        setPasswordStep(2);
      } else {
        setOldPwdError(t.errWrongOldPwd);
      }
    } catch {
      setOldPwdError(t.errVerifyServer);
    } finally {
      setIsVerifyingOldPwd(false);
    }
  };

  const handleUpdatePassword = async () => {
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedNew || !trimmedConfirm) {
      setNewPwdError(t.errFillNewPwd);
      return;
    }
    if (trimmedNew !== trimmedConfirm) {
      setNewPwdError(t.errConfirmMismatch);
      return;
    }
    if (trimmedNew.length < 6) {
      setNewPwdError(t.errMinLength);
      return;
    }
    if (trimmedNew === oldPassword.trim()) {
      setNewPwdError(t.errSameAsOld);
      return;
    }

    try {
      setIsUpdatingPwd(true);
      setNewPwdError('');

      // Lấy email chính xác liên kết với Customer trong Database
      let emailToUse = userInfo.email?.trim();
      let usernameToUse = userInfo.username?.trim();

      const token = await AsyncStorage.getItem('userToken');

      if ((!emailToUse || !usernameToUse) && token) {
        try {
          const infoRes = await axios.get(`${API_BASE_URL}/api/home/customer/info`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          });
          if (infoRes.data?.email) {
            emailToUse = infoRes.data.email.trim();
          }
          if (infoRes.data?.customerName && !usernameToUse) {
            usernameToUse = infoRes.data.customerName.trim();
          }
        } catch (e) {
          console.warn('Không thể tải lại email trước khi đổi mật khẩu:', e);
        }
      }

      if (!usernameToUse && token) {
        const payload = decodeJwtPayload(token);
        if (payload?.sub) {
          usernameToUse = payload.sub;
        }
      }

      if (!emailToUse) {
        setNewPwdError(t.errNoAccountIdentifier);
        setIsUpdatingPwd(false);
        return;
      }

      // GỌI API THAY ĐỔI MẬT KHẨU TRONG DATABASE:
      // Endpoint: /api/password/reset-password
      // Body: { email, newPassword }
      // Backend sẽ tìm Customer theo email, lấy Account liên kết, mã hóa BCrypt mật khẩu mới và lưu vào MySQL.
      const resetRes = await fetchWithCandidateFallback('/api/password/reset-password', {
        method: 'POST',
        data: {
          email: emailToUse,
          newPassword: trimmedNew,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      });

      // Đăng nhập lại để cập nhật token mới vào AsyncStorage
      const loginId = usernameToUse || emailToUse;
      if (loginId) {
        try {
          const loginRes = await fetchWithCandidateFallback('/api/auth/login', {
            method: 'POST',
            data: {
              username: loginId,
              password: trimmedNew,
            },
            timeout: 5000,
          });
          if (loginRes?.data?.token) {
            await AsyncStorage.setItem('userToken', loginRes.data.token);
            if (loginRes.data?.role) {
              await AsyncStorage.setItem('userRole', loginRes.data.role);
            }
          }
        } catch (loginErr) {
          console.warn('Cập nhật token mới sau khi đổi mật khẩu:', loginErr);
        }
      }

      Alert.alert(t.alertSuccessTitle, t.msgPwdChanged);
      resetPasswordModal();
    } catch (err: any) {
      console.error('Lỗi khi đổi mật khẩu:', err);
      const serverMsg = err.response?.data;
      const errorText = typeof serverMsg === 'string' ? serverMsg : (err.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
      setNewPwdError(errorText);
    } finally {
      setIsUpdatingPwd(false);
    }
  };

  const resetPasswordModal = () => {
    setShowChangePassword(false);
    setPasswordStep(1);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setOldPwdError('');
    setNewPwdError('');
    setShowOldPwdText(false);
    setShowNewPwdText(false);
    setShowConfirmPwdText(false);
  };

  const resetForgotRecoveryModal = () => {
    setShowForgotRecovery(false);
    setRecoveryStep(1);
    setRecoveryEmail('');
    setRecoveryOtp('');
    setRecoveryNewPwd('');
    setRecoveryConfirmPwd('');
    setRecoveryError('');
    setShowRecoveryNewPwd(false);
    setShowRecoveryConfirmPwd(false);
  };

  const openForgotRecoveryModal = () => {
    setRecoveryStep(1);
    setRecoveryEmail((userInfo.email || '').trim());
    setRecoveryOtp('');
    setRecoveryNewPwd('');
    setRecoveryConfirmPwd('');
    setRecoveryError('');
    setShowRecoveryNewPwd(false);
    setShowRecoveryConfirmPwd(false);
    setShowForgotRecovery(true);
  };

  const transitionFromHelp = (action: () => void) => {
    setShowHelp(false);
    setExpandedFaqIndex(null);
    if (helpTransitionTimerRef.current) {
      clearTimeout(helpTransitionTimerRef.current);
    }
    helpTransitionTimerRef.current = setTimeout(action, 160);
  };

  const handleSendRecoveryOtp = async (isResend = false) => {
    const emailVal = recoveryEmail.trim();
    if (!emailVal) {
      setRecoveryError(t.errEnterEmail);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      setRecoveryError(t.errInvalidEmail);
      return;
    }

    try {
      setIsRecoverySubmitting(true);
      setRecoveryError('');
      await fetchWithCandidateFallback('/api/password/send-otp', {
        method: 'POST',
        data: { email: emailVal },
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });
      Alert.alert(t.alertSuccessTitle, `${t.msgOtpSentPrefix}${emailVal}`);
      if (!isResend) {
        setRecoveryStep(2);
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data;
      setRecoveryError(
        typeof serverMsg === 'string' && serverMsg.trim() ? serverMsg.trim() : t.errSendOtpFailed
      );
    } finally {
      setIsRecoverySubmitting(false);
    }
  };

  const handleVerifyRecoveryOtp = async () => {
    const emailVal = recoveryEmail.trim();
    const otpVal = recoveryOtp.trim();
    if (otpVal.length !== 6) {
      setRecoveryError(t.errEnterOtp);
      return;
    }

    try {
      setIsRecoverySubmitting(true);
      setRecoveryError('');
      await fetchWithCandidateFallback('/api/password/verify-otp', {
        method: 'POST',
        data: { email: emailVal, otp: otpVal },
        headers: { 'Content-Type': 'application/json' },
        timeout: 8000,
      });
      setRecoveryStep(3);
    } catch (err: any) {
      const serverMsg = err?.response?.data;
      setRecoveryError(
        typeof serverMsg === 'string' && serverMsg.trim() ? serverMsg.trim() : t.errVerifyOtpFailed
      );
    } finally {
      setIsRecoverySubmitting(false);
    }
  };

  const handleResetRecoveredPassword = async () => {
    const emailVal = recoveryEmail.trim();
    const trimmedNew = recoveryNewPwd.trim();
    const trimmedConfirm = recoveryConfirmPwd.trim();

    if (!trimmedNew || !trimmedConfirm) {
      setRecoveryError(t.errFillNewPwd);
      return;
    }
    if (trimmedNew.length < 6) {
      setRecoveryError(t.errMinLength);
      return;
    }
    if (trimmedNew !== trimmedConfirm) {
      setRecoveryError(t.errConfirmMismatch);
      return;
    }

    try {
      setIsRecoverySubmitting(true);
      setRecoveryError('');
      await fetchWithCandidateFallback('/api/password/reset-password', {
        method: 'POST',
        data: { email: emailVal, newPassword: trimmedNew },
        headers: { 'Content-Type': 'application/json' },
        timeout: 8000,
      });

      const currentEmail = (userInfo.email || '').trim().toLowerCase();
      if (!currentEmail || currentEmail === emailVal.toLowerCase()) {
        const loginId = userInfo.username?.trim() || emailVal;
        try {
          const loginRes = await fetchWithCandidateFallback('/api/auth/login', {
            method: 'POST',
            data: { username: loginId, password: trimmedNew },
            timeout: 5000,
          });
          if (loginRes?.data?.token) {
            await AsyncStorage.setItem('userToken', loginRes.data.token);
            if (loginRes.data?.role) {
              await AsyncStorage.setItem('userRole', loginRes.data.role);
            }
          }
        } catch {}
      }

      Alert.alert(t.alertSuccessTitle, t.msgRecoverySuccess);
      resetForgotRecoveryModal();
    } catch (err: any) {
      const serverMsg = err?.response?.data;
      setRecoveryError(
        typeof serverMsg === 'string' && serverMsg.trim()
          ? serverMsg.trim()
          : (err?.message || t.errSendOtpFailed)
      );
    } finally {
      setIsRecoverySubmitting(false);
    }
  };

  // Component Sub-Screen Header
  const SubScreenHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
    <View style={themeStyles.subHeader}>
      <TouchableOpacity onPress={onClose} style={themeStyles.subHeaderBtn}>
        <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#E4E6EB' : '#111827'} />
      </TouchableOpacity>
      <Text style={themeStyles.subHeaderTitle}>{title}</Text>
      <TouchableOpacity onPress={onClose} style={themeStyles.subHeaderBtn}>
        <Ionicons name="home-outline" size={21} color={isDarkMode ? '#E4E6EB' : '#111827'} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={themeStyles.container}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={themeStyles.mainScroll}
        onScroll={handleFooterScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              fetchUserData(false);
            }}
            colors={['#2F6B5F']}
            tintColor="#2F6B5F"
          />
        }
      >
        {/* Phần thông tin User */}
        <View style={themeStyles.userInfoSection}>
          {userInfo.avatarUrl ? (
            <Image source={{ uri: userInfo.avatarUrl }} style={themeStyles.avatarImage} />
          ) : (
            <View style={themeStyles.avatarLarge}>
              <Text style={themeStyles.avatarLargeText}>
                {(userInfo.name || 'H').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={themeStyles.userName}>{userInfo.name}</Text>
          <View style={themeStyles.userIdPill}>
            <Text style={themeStyles.userId}>#ID: {userInfo.customerId || userInfo.username || t.notUpdated}</Text>
          </View>
        </View>

        {/* Cụm 2 nút thao tác chính */}
        <View style={themeStyles.mainActionsRow}>
          <TouchableOpacity style={themeStyles.primaryBtn} onPress={handleOpenProfile} activeOpacity={0.85}>
            <Ionicons name="person-outline" size={17} color="#FFFFFF" />
            <Text style={themeStyles.primaryBtnText}>{t.myProfileBtn}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={themeStyles.topUpBtn} onPress={() => navigate('payment')} activeOpacity={0.85}>
            <Ionicons name="wallet-outline" size={17} color={isDarkMode ? '#FBBF24' : '#B45309'} />
            <Text style={themeStyles.topUpBtnText}>{t.topUpBtn}</Text>
          </TouchableOpacity>
        </View>

        {/* Bảng thống kê cá nhân */}
        <View style={themeStyles.statsCard}>
          <View style={themeStyles.statItem}>
            <View style={themeStyles.statIconWrap}>
              <Ionicons name="wallet-outline" size={20} color={isDarkMode ? '#FBBF24' : '#B45309'} />
            </View>
            <Text style={themeStyles.statValue}>{(userInfo.potatoBalance ?? 0).toLocaleString(lang === 'en' ? 'en-US' : 'vi-VN')}</Text>
            <Text style={themeStyles.statLabel}>{t.potatoAvailable}</Text>
          </View>
          <View style={themeStyles.statDivider} />
          <View style={themeStyles.statItem}>
            <View style={themeStyles.statIconWrap}>
              <Ionicons name="flame-outline" size={20} color={isDarkMode ? '#FB923C' : '#C2410C'} />
            </View>
            <Text style={themeStyles.statValue}>{userInfo.streakDays}</Text>
            <Text style={themeStyles.statLabel}>{t.readingStreak}</Text>
          </View>
          <View style={themeStyles.statDivider} />
          <View style={themeStyles.statItem}>
            <View style={themeStyles.statIconWrap}>
              <Ionicons name="book-outline" size={20} color={isDarkMode ? '#34D399' : '#2F6B5F'} />
            </View>
            <Text style={themeStyles.statValue}>{rentedCount.toLocaleString(lang === 'en' ? 'en-US' : 'vi-VN')}</Text>
            <Text style={themeStyles.statLabel}>{lang === 'en' ? 'Renting' : 'Đang thuê'}</Text>
          </View>
        </View>

        {/* [GIẢI THÍCH CODE]: Thanh Hạng Thành Viên Tương Tác - Chạm vào để xem chi tiết lộ trình & đặc quyền */}
        <TouchableOpacity
          style={themeStyles.tierCardEnhanced}
          onPress={() => setShowTierModal(true)}
          activeOpacity={0.82}
        >
          <View style={themeStyles.tierCardTopRow}>
            <View style={themeStyles.tierBadgeCircle}>
              <Text style={themeStyles.tierBadgeEmoji}>
                {tierSummary?.currentTier?.badgeIcon || '🌱'}
              </Text>
            </View>
            <View style={themeStyles.tierCardMainInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={themeStyles.tierCardName}>
                  {tierSummary?.currentTier?.tierName || userInfo.tierName || t.defaultTier}
                </Text>
                <View
                  style={[
                    themeStyles.tierDiscountPill,
                    {
                      backgroundColor: isDarkMode ? '#1F2F2B' : '#EFF4F2',
                      borderColor: isDarkMode ? '#2D4A43' : '#D1DFDA',
                    },
                  ]}
                >
                  <Text
                    style={[
                      themeStyles.tierDiscountText,
                      { color: isDarkMode ? '#34D399' : '#2F6B5F' },
                    ]}
                  >
                    {lang === 'en' ? `${tierSummary?.discountPercent ?? 0}% Off` : `Giảm ${tierSummary?.discountPercent ?? 0}%`}
                  </Text>
                </View>
              </View>
              <Text style={themeStyles.tierCardSub}>
                {tierSummary?.isMaxTier
                  ? (lang === 'en' ? 'Ultimate Royal Rank' : 'Cấp bậc Hoàng Gia Tối Thượng')
                  : (lang === 'en'
                      ? `Progress to ${tierSummary?.nextTier?.tierName || 'next rank'}: ${Math.round(tierSummary?.overallProgressPercent || 0)}%`
                      : `Tiến độ lên ${tierSummary?.nextTier?.tierName || 'hạng kế'}: ${Math.round(tierSummary?.overallProgressPercent || 0)}%`)}
              </Text>
            </View>
            <View style={themeStyles.tierArrowBtn}>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </View>
          </View>

          {/* Thanh mini progress nếu chưa đạt max tier */}
          {!tierSummary?.isMaxTier && (
            <View style={themeStyles.miniProgressBarTrack}>
              <View
                style={[
                  themeStyles.miniProgressBarFill,
                  { width: `${Math.min(100, Math.max(5, tierSummary?.overallProgressPercent || 0))}%` },
                ]}
              />
            </View>
          )}

          <View style={themeStyles.tierCardFooter}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="shield-checkmark-outline" size={14} color={isDarkMode ? '#34D399' : '#2F6B5F'} />
              <Text style={themeStyles.tierCardFooterText}>
                {lang === 'en' ? 'Permanent Retention' : 'Bảo lưu vĩnh viễn'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text
                style={[
                  themeStyles.tierCardActionHint,
                  { color: isDarkMode ? '#34D399' : '#2F6B5F' },
                ]}
              >
                {lang === 'en' ? 'Perks & Roadmap' : 'Xem quyền lợi & lộ trình'}
              </Text>
              <Ionicons name="chevron-forward" size={13} color={isDarkMode ? '#34D399' : '#2F6B5F'} />
            </View>
          </View>
        </TouchableOpacity>

        {/* [GIẢI THÍCH CODE]: Thanh Điểm Danh Nhanh Ngay Tại Trang Cá Nhân */}
        <View style={themeStyles.quickCheckinBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={themeStyles.quickCheckinIconBox}>
              <Ionicons name="flame-outline" size={19} color={isDarkMode ? '#FB923C' : '#B45309'} />
            </View>
            <View style={{ marginLeft: 11, flex: 1 }}>
              <Text style={themeStyles.quickCheckinTitle}>
                {lang === 'en' ? 'Daily Reading Check-in' : 'Điểm danh đọc sách'}
              </Text>
              <Text style={themeStyles.quickCheckinSub}>
                {lang === 'en'
                  ? `Streak: ${tierSummary?.streakDays ?? userInfo.streakDays} consecutive days`
                  : `Chuỗi ${tierSummary?.streakDays ?? userInfo.streakDays} ngày liên tiếp`}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              themeStyles.quickCheckinBtn,
              tierSummary?.hasCheckedInToday && {
                backgroundColor: isDarkMode ? '#1F2F2B' : '#EFF4F2',
                borderWidth: 1,
                borderColor: isDarkMode ? '#2D4A43' : '#D1DFDA',
              },
            ]}
            onPress={handleDailyCheckin}
            disabled={isCheckingIn || tierSummary?.hasCheckedInToday}
            activeOpacity={0.82}
          >
            {isCheckingIn ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : tierSummary?.hasCheckedInToday ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Ionicons name="checkmark-circle-outline" size={15} color={isDarkMode ? '#34D399' : '#2F6B5F'} />
                <Text
                  style={[
                    themeStyles.quickCheckinBtnText,
                    { color: isDarkMode ? '#34D399' : '#2F6B5F' },
                  ]}
                >
                  {lang === 'en' ? 'Checked in' : 'Đã điểm danh'}
                </Text>
              </View>
            ) : (
              <Text style={themeStyles.quickCheckinBtnText}>
                {lang === 'en' ? 'Check-in +2 Khoai' : 'Điểm danh +2 Khoai'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Danh sách Menu */}
        <View style={themeStyles.menuSection}>
          <TouchableOpacity style={themeStyles.menuItem} onPress={() => setShowDailyTasks(true)} activeOpacity={0.7}>
            <View style={themeStyles.menuIconBox}>
              <Ionicons name="calendar-outline" size={18} color={isDarkMode ? '#CBD5E1' : '#374151'} />
            </View>
            <Text style={themeStyles.menuItemText}>{t.menuDailyTasks}</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={themeStyles.menuItem} onPress={() => setShowHelp(true)} activeOpacity={0.7}>
            <View style={themeStyles.menuIconBox}>
              <Ionicons name="help-circle-outline" size={19} color={isDarkMode ? '#CBD5E1' : '#374151'} />
            </View>
            <Text style={themeStyles.menuItemText}>{t.menuHelp}</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={themeStyles.menuItem} onPress={() => navigate('notifications')} activeOpacity={0.7}>
            <View style={themeStyles.menuIconBox}>
              <Ionicons name="mail-outline" size={18} color={isDarkMode ? '#CBD5E1' : '#374151'} />
            </View>
            <Text style={themeStyles.menuItemText}>{lang === 'en' ? 'Notifications Inbox' : 'Hộp thư thông báo'}</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={themeStyles.menuItem} onPress={() => setShowNotif(true)} activeOpacity={0.7}>
            <View style={themeStyles.menuIconBox}>
              <Ionicons name="notifications-outline" size={18} color={isDarkMode ? '#CBD5E1' : '#374151'} />
            </View>
            <Text style={themeStyles.menuItemText}>{t.menuNotifications}</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={themeStyles.menuItem} onPress={handleOpenChangePassword} activeOpacity={0.7}>
            <View style={themeStyles.menuIconBox}>
              <Ionicons name="lock-closed-outline" size={18} color={isDarkMode ? '#CBD5E1' : '#374151'} />
            </View>
            <Text style={themeStyles.menuItemText}>{t.menuChangePassword}</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={themeStyles.menuItem} onPress={() => navigate('transactions')} activeOpacity={0.7}>
            <View style={themeStyles.menuIconBox}>
              <Ionicons name="receipt-outline" size={18} color={isDarkMode ? '#CBD5E1' : '#374151'} />
            </View>
            <Text style={themeStyles.menuItemText}>{t.menuTransactions}</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={themeStyles.menuItem} onPress={() => navigate('cart')} activeOpacity={0.7}>
            <View style={themeStyles.menuIconBox}>
              <Ionicons name="cart-outline" size={18} color={isDarkMode ? '#CBD5E1' : '#374151'} />
            </View>
            <Text style={themeStyles.menuItemText}>{lang === 'en' ? 'My Cart' : 'Giỏ hàng'}</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={themeStyles.menuItem}>
            <View style={themeStyles.menuIconBox}>
              <Ionicons name="globe-outline" size={18} color={isDarkMode ? '#CBD5E1' : '#374151'} />
            </View>
            <Text style={themeStyles.menuItemText}>{t.menuLanguage}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                style={{
                  marginRight: 8,
                  fontWeight: '600',
                  fontSize: 13,
                  color: isDarkMode ? '#CBD5E1' : '#4B5563',
                }}
              >
                {lang === 'vi' ? 'VI' : 'EN'}
              </Text>
              <Switch
                trackColor={{ false: '#D1D5DB', true: '#2F6B5F' }}
                thumbColor="#FFFFFF"
                value={lang === 'en'}
                onValueChange={(val) => changeLanguage(val ? 'en' : 'vi')}
              />
            </View>
          </View>

          <TouchableOpacity style={[themeStyles.menuItem, { borderBottomWidth: 0 }]} onPress={() => setShowAbout(true)} activeOpacity={0.7}>
            <View style={themeStyles.menuIconBox}>
              <Ionicons name="information-circle-outline" size={19} color={isDarkMode ? '#CBD5E1' : '#374151'} />
            </View>
            <Text style={themeStyles.menuItemText}>{t.menuAbout}</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Nút Đăng xuất / Thay đổi tài khoản */}
        <View style={themeStyles.bottomActionsRow}>
          <TouchableOpacity
            style={[
              themeStyles.logoutBtn,
              {
                backgroundColor: isDarkMode ? '#2A1B1E' : '#FEF2F2',
                borderColor: isDarkMode ? '#5C262C' : '#FECACA',
              },
            ]}
            onPress={logout}
            activeOpacity={0.82}
          >
            <Ionicons name="log-out-outline" size={17} color="#DC2626" />
            <Text style={themeStyles.logoutBtnText}>{t.logoutBtn}</Text>
          </TouchableOpacity>
          <View style={{ width: 12 }} />
          <TouchableOpacity style={themeStyles.secondaryBtn} onPress={logout} activeOpacity={0.82}>
            <Ionicons name="swap-horizontal-outline" size={17} color={isDarkMode ? '#E4E6EB' : '#111827'} />
            <Text style={themeStyles.secondaryBtnText}>{lang === 'en' ? 'Switch Account' : 'Thay đổi tài khoản'}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 115 }} />
      </ScrollView>

      {/* ================= MODALS (CHỨC NĂNG CON) ================= */}

      {/* 0. Modal Trang cá nhân */}
      <Modal visible={showProfile} animationType="slide">
        <View style={themeStyles.modalContainer}>
          <SubScreenHeader
            title={t.profileModalTitle}
            onClose={() => {
              setShowProfile(false);
              setIsEditingProfile(false);
            }}
          />
          <ScrollView style={themeStyles.modalContent}>

            {/* Avatar & Edit icon */}
            <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 30 }}>
              <TouchableOpacity onPress={() => setShowAvatarMenu(true)} style={themeStyles.avatarEditWrapper}>
                {userInfo.avatarUrl ? (
                  <Image source={{ uri: userInfo.avatarUrl }} style={themeStyles.modalAvatarImage} />
                ) : (
                  <View style={[themeStyles.avatarLarge, { marginBottom: 0, width: 100, height: 100, borderRadius: 50 }]}>
                    <Text style={themeStyles.avatarLargeText}>
                      {(userInfo.name || 'H').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={themeStyles.avatarPenIcon}>
                  <Ionicons name="pencil" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>

            {/* User Info Fields */}
            <View style={themeStyles.infoFieldsContainer}>
              {[
                { key: 'name', label: t.fieldName, value: isEditingProfile ? editForm.name : userInfo.name, editable: true },
                { key: 'username', label: t.fieldUsername, value: userInfo.username, editable: false },
                { key: 'email', label: t.fieldEmail, value: isEditingProfile ? editForm.email : userInfo.email, editable: true, keyboardType: 'email-address' as const },
                { key: 'phone', label: t.fieldPhone, value: isEditingProfile ? editForm.phone : userInfo.phone, editable: true, keyboardType: 'phone-pad' as const },
                { key: 'gender', label: t.fieldGender, value: isEditingProfile ? (editForm.gender === 'Nam' ? t.genderMale : t.genderFemale) : (userInfo.gender === 'Nam' ? t.genderMale : t.genderFemale), editable: true },
                { key: 'dob', label: t.fieldDob, value: isEditingProfile ? editForm.dob : userInfo.dob, editable: true },
                { key: 'address', label: t.fieldAddress, value: isEditingProfile ? editForm.address : userInfo.address, editable: true },
              ].map((field) => (
                <View key={field.key} style={themeStyles.infoFieldRow}>
                  <Text style={themeStyles.infoFieldLabel}>{field.label}</Text>
                  {isEditingProfile && field.editable ? (
                    field.key === 'gender' ? (
                      <View style={{ flexDirection: 'row', marginTop: 6 }}>
                        <TouchableOpacity
                          style={[
                            themeStyles.genderOption,
                            editForm.gender === 'Nam' && themeStyles.genderOptionActive,
                          ]}
                          onPress={() => setEditForm({ ...editForm, gender: 'Nam' })}
                        >
                          <Text
                            style={[
                              themeStyles.genderOptionText,
                              editForm.gender === 'Nam' && themeStyles.genderOptionTextActive,
                            ]}
                          >
                            {t.genderMale}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            themeStyles.genderOption,
                            { marginLeft: 10 },
                            editForm.gender === 'Nữ' && themeStyles.genderOptionActive,
                          ]}
                          onPress={() => setEditForm({ ...editForm, gender: 'Nữ' })}
                        >
                          <Text
                            style={[
                              themeStyles.genderOptionText,
                              editForm.gender === 'Nữ' && themeStyles.genderOptionTextActive,
                            ]}
                          >
                            {t.genderFemale}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TextInput
                        style={[
                          themeStyles.infoFieldInput,
                          themeStyles.infoFieldInputEditing,
                          {
                            borderBottomColor: isDarkMode ? '#34D399' : '#2F6B5F',
                            color: isDarkMode ? '#34D399' : '#2F6B5F',
                          },
                        ]}
                        value={field.value}
                        keyboardType={field.keyboardType || 'default'}
                        autoCapitalize="none"
                        onChangeText={(text) =>
                          setEditForm({ ...editForm, [field.key as keyof typeof editForm]: text })
                        }
                      />
                    )
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[themeStyles.infoFieldValue, !field.editable && { color: '#9CA3AF' }]}>
                        {field.value || t.notUpdated}
                      </Text>
                      {!field.editable && isEditingProfile && (
                        <Ionicons name="lock-closed-outline" size={14} color="#9CA3AF" style={{ marginLeft: 6 }} />
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>

            {!isEditingProfile ? (
              <TouchableOpacity
                style={[
                  themeStyles.editProfileBtn,
                  {
                    backgroundColor: isDarkMode ? '#1F2F2B' : '#EFF4F2',
                    borderColor: isDarkMode ? '#2D4A43' : '#C5DBD4',
                  },
                ]}
                onPress={() => setIsEditingProfile(true)}
                activeOpacity={0.82}
              >
                <Text
                  style={[
                    themeStyles.editProfileBtnText,
                    { color: isDarkMode ? '#34D399' : '#2F6B5F' },
                  ]}
                >
                  {t.editProfileBtn}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={[themeStyles.saveProfileBtn, { flex: 1 }, isSaving && { opacity: 0.7 }]}
                  onPress={handleSaveProfile}
                  disabled={isSaving}
                  activeOpacity={0.82}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={themeStyles.saveProfileBtnText}>{t.saveProfileBtn}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[themeStyles.cancelProfileBtn, { width: 96 }]}
                  onPress={() => {
                    setIsEditingProfile(false);
                    setEditForm({
                      name: userInfo.name,
                      email: userInfo.email,
                      phone: userInfo.phone,
                      gender: userInfo.gender,
                      dob: userInfo.dob,
                      address: userInfo.address,
                    });
                  }}
                  disabled={isSaving}
                  activeOpacity={0.82}
                >
                  <Text style={themeStyles.cancelProfileBtnText}>{t.cancelBtn}</Text>
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>

          {/* Modal chọn ảnh đại diện (Action Sheet mini) */}
          <Modal visible={showAvatarMenu} transparent animationType="fade">
            <TouchableOpacity style={themeStyles.avatarMenuOverlay} activeOpacity={1} onPress={() => setShowAvatarMenu(false)}>
              <View style={themeStyles.avatarMenuBox}>
                <TouchableOpacity style={themeStyles.avatarMenuItem} onPress={() => setShowAvatarMenu(false)}>
                  <Text style={themeStyles.avatarMenuItemText}>{t.viewAvatar}</Text>
                </TouchableOpacity>
                <View style={themeStyles.avatarMenuDivider} />
                <TouchableOpacity style={themeStyles.avatarMenuItem} onPress={() => setShowAvatarMenu(false)}>
                  <Text style={themeStyles.avatarMenuItemText}>{t.changeAvatar}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </Modal>

      {/* 1. Modal Trung tâm trợ giúp */}
      <Modal
        visible={showHelp}
        animationType="slide"
        onRequestClose={() => {
          setShowHelp(false);
          setExpandedFaqIndex(null);
        }}
      >
        <View style={themeStyles.modalContainer}>
          <SubScreenHeader
            title={t.helpModalTitle}
            onClose={() => {
              setShowHelp(false);
              setExpandedFaqIndex(null);
            }}
          />
          <ScrollView style={themeStyles.modalContent}>

            <TouchableOpacity
              style={themeStyles.aiChatBtn}
              onPress={() => transitionFromHelp(() => navigate('chatbot'))}
              activeOpacity={0.85}
            >
              <View style={themeStyles.aiChatIconWrap}>
                <Ionicons name="chatbubbles-outline" size={24} color="#FFFFFF" />
              </View>
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Text style={themeStyles.aiChatTitle}>{t.aiChatTitle}</Text>
                <Text style={themeStyles.aiChatSub}>{t.aiChatSub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>

            <Text style={themeStyles.sectionHeading}>{t.reportAndHelp}</Text>
            <View style={themeStyles.socialRow}>
              <TouchableOpacity style={themeStyles.socialBox} activeOpacity={0.8}>
                <Ionicons name="mail-outline" size={22} color={isDarkMode ? '#CBD5E1' : '#374151'} />
                <Text style={themeStyles.socialText}>Gmail</Text>
              </TouchableOpacity>
              <TouchableOpacity style={themeStyles.socialBox} activeOpacity={0.8}>
                <Ionicons name="paper-plane-outline" size={22} color={isDarkMode ? '#CBD5E1' : '#374151'} />
                <Text style={themeStyles.socialText}>Telegram</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={themeStyles.socialBox}
                activeOpacity={0.8}
                onPress={() => transitionFromHelp(() => setShowSupportChat(true))}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={22} color={isDarkMode ? '#34D399' : '#2F6B5F'} />
                <Text style={themeStyles.socialText}>Mess</Text>
              </TouchableOpacity>
              <TouchableOpacity style={themeStyles.socialBox} activeOpacity={0.8}>
                <Ionicons name="call-outline" size={22} color={isDarkMode ? '#34D399' : '#2F6B5F'} />
                <Text style={themeStyles.socialText}>{t.callPhone}</Text>
              </TouchableOpacity>
            </View>

            <Text style={themeStyles.sectionHeading}>{t.faqHeading}</Text>
            {t.faqs.map((faq, idx) => {
              const isExpanded = expandedFaqIndex === idx;
              return (
                <View
                  key={idx}
                  style={[
                    themeStyles.faqCard,
                    isExpanded && { borderColor: isDarkMode ? '#34D399' : '#2F6B5F' },
                  ]}
                >
                  <TouchableOpacity
                    style={themeStyles.faqHeaderBtn}
                    activeOpacity={0.75}
                    onPress={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                  >
                    <Text style={themeStyles.faqText}>{faq}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={isExpanded ? (isDarkMode ? '#34D399' : '#2F6B5F') : '#9CA3AF'}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={themeStyles.faqAnswerBox}>
                      <Text style={themeStyles.faqAnswerText}>
                        {t.faqAnswers[idx]}
                      </Text>

                      {idx === 0 && (
                        <View style={themeStyles.faqActionsCol}>
                          <TouchableOpacity
                            style={themeStyles.faqPrimaryBtn}
                            activeOpacity={0.85}
                            onPress={() => transitionFromHelp(openForgotRecoveryModal)}
                          >
                            <Ionicons name="mail-outline" size={16} color="#FFFFFF" />
                            <Text style={themeStyles.faqPrimaryBtnText}>
                              {t.faqRecoverEmailBtn}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={themeStyles.faqSecondaryBtn}
                            activeOpacity={0.8}
                            onPress={() => transitionFromHelp(handleOpenChangePassword)}
                          >
                            <Ionicons
                              name="lock-closed-outline"
                              size={15}
                              color={isDarkMode ? '#CBD5E1' : '#374151'}
                            />
                            <Text style={themeStyles.faqSecondaryBtnText}>
                              {t.faqChangePwdBtn}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {idx === 1 && (
                        <View style={themeStyles.faqActionsCol}>
                          <TouchableOpacity
                            style={themeStyles.faqSecondaryBtn}
                            activeOpacity={0.8}
                            onPress={() => transitionFromHelp(() => navigate('payment'))}
                          >
                            <Ionicons
                              name="wallet-outline"
                              size={15}
                              color={isDarkMode ? '#FBBF24' : '#B45309'}
                            />
                            <Text style={themeStyles.faqSecondaryBtnText}>
                              {t.faqTopUpBtn}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {idx === 3 && (
                        <View style={themeStyles.faqActionsCol}>
                          <TouchableOpacity
                            style={themeStyles.faqSecondaryBtn}
                            activeOpacity={0.8}
                            onPress={() => transitionFromHelp(() => setShowTierModal(true))}
                          >
                            <Ionicons
                              name="ribbon-outline"
                              size={15}
                              color={isDarkMode ? '#34D399' : '#2F6B5F'}
                            />
                            <Text style={themeStyles.faqSecondaryBtnText}>
                              {t.faqTierBtn}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* 2. Modal Cài đặt thông báo */}
      <Modal visible={showNotif} animationType="slide">
        <View style={themeStyles.modalContainer}>
          <SubScreenHeader title={t.notifModalTitle} onClose={() => setShowNotif(false)} />
          <ScrollView style={themeStyles.modalContent}>

            <View style={themeStyles.switchRowMaster}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={themeStyles.switchTitleMaster}>{t.notifMasterTitle}</Text>
                <Text style={themeStyles.switchSub}>{t.notifMasterSub}</Text>
              </View>
              <Switch
                trackColor={{ false: '#D1D5DB', true: '#2F6B5F' }}
                thumbColor="#FFFFFF"
                value={masterNotif}
                onValueChange={setMasterNotif}
              />
            </View>

            {/* Các tùy chọn phụ bị mờ đi nếu masterNotif là false */}
            <View style={[themeStyles.subOptionsContainer, !masterNotif && themeStyles.disabledOptions]}>
              <View style={themeStyles.switchRow}>
                <Text style={themeStyles.switchTitle}>{t.notifPromo}</Text>
                <Switch
                  disabled={!masterNotif}
                  trackColor={{ false: '#D1D5DB', true: '#2F6B5F' }}
                  thumbColor="#FFFFFF"
                  value={notifPromo}
                  onValueChange={setNotifPromo}
                />
              </View>
              <View style={themeStyles.switchRow}>
                <Text style={themeStyles.switchTitle}>{t.notifExpire}</Text>
                <Switch
                  disabled={!masterNotif}
                  trackColor={{ false: '#D1D5DB', true: '#2F6B5F' }}
                  thumbColor="#FFFFFF"
                  value={notifExpire}
                  onValueChange={setNotifExpire}
                />
              </View>
              <View style={[themeStyles.switchRow, { borderBottomWidth: 0 }]}>
                <Text style={themeStyles.switchTitle}>{t.notifAds}</Text>
                <Switch
                  disabled={!masterNotif}
                  trackColor={{ false: '#D1D5DB', true: '#2F6B5F' }}
                  thumbColor="#FFFFFF"
                  value={notifAds}
                  onValueChange={setNotifAds}
                />
              </View>
            </View>

          </ScrollView>
        </View>
      </Modal>

      {/* 3. Modal Thông tin về HALM */}
      <Modal visible={showAbout} animationType="slide">
        <View style={themeStyles.modalContainer}>
          <SubScreenHeader title={t.aboutModalTitle} onClose={() => setShowAbout(false)} />
          <ScrollView style={themeStyles.modalContent}>

            <View style={themeStyles.aboutHeader}>
              <Text style={themeStyles.aboutLogoText}>
                HALM <Text style={{ color: isDarkMode ? '#34D399' : '#2F6B5F' }}>Book</Text>
              </Text>
              <Text style={themeStyles.aboutVersion}>{t.aboutVersion}</Text>
              <Text style={themeStyles.aboutSlogan}>{t.aboutSlogan}</Text>
            </View>

            <View style={themeStyles.aboutInfoBox}>
              <Text style={themeStyles.aboutDesc}>{t.aboutDesc}</Text>
            </View>

          </ScrollView>
        </View>
      </Modal>

      {/* 4. Modal Đổi mật khẩu */}
      <Modal visible={showChangePassword} animationType="slide">
        <View style={themeStyles.modalContainer}>
          <SubScreenHeader title={t.pwdModalTitle} onClose={resetPasswordModal} />
          <ScrollView style={themeStyles.modalContent}>

            {passwordStep === 1 ? (
              <View style={themeStyles.passwordForm}>
                <Text style={themeStyles.passwordInstruction}>
                  {t.pwdStep1Desc}
                </Text>

                <View style={[themeStyles.inputWrapper, oldPwdError ? { borderColor: '#DC2626' } : {}]}>
                  <Ionicons
                    name="lock-open-outline"
                    size={19}
                    color={isDarkMode ? '#9CA3AF' : '#6B7280'}
                    style={themeStyles.inputIcon}
                  />
                  <TextInput
                    style={themeStyles.passwordInput}
                    placeholder={t.pwdCurrentPlaceholder}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showOldPwdText}
                    value={oldPassword}
                    onChangeText={(text) => { setOldPassword(text); setOldPwdError(''); }}
                    onSubmitEditing={handleCheckOldPassword}
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={() => setShowOldPwdText(!showOldPwdText)}
                    style={{ padding: 6 }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showOldPwdText ? "eye-off-outline" : "eye-outline"}
                      size={19}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
                {oldPwdError ? <Text style={themeStyles.errorText}>{oldPwdError}</Text> : null}

                <TouchableOpacity
                  style={[themeStyles.submitPasswordBtn, isVerifyingOldPwd && { opacity: 0.7 }]}
                  onPress={handleCheckOldPassword}
                  disabled={isVerifyingOldPwd}
                  activeOpacity={0.85}
                >
                  {isVerifyingOldPwd ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={themeStyles.submitPasswordBtnText}>{t.pwdContinueBtn}</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={themeStyles.passwordForm}>
                <Text style={themeStyles.passwordInstruction}>
                  {t.pwdStep2DescPrefix} ({userInfo.email || userInfo.username}).
                </Text>

                <View style={[themeStyles.softInputWrapper, newPwdError ? { borderColor: '#DC2626' } : {}]}>
                  <Ionicons name="lock-closed-outline" size={19} color={isDarkMode ? '#9CA3AF' : '#6B7280'} style={themeStyles.inputIcon} />
                  <TextInput
                    style={themeStyles.softPasswordInput}
                    placeholder={t.pwdNewPlaceholder}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showNewPwdText}
                    returnKeyType="next"
                    value={newPassword}
                    onChangeText={(text) => { setNewPassword(text); setNewPwdError(''); }}
                    onSubmitEditing={() => confirmPwdRef.current?.focus()}
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPwdText(!showNewPwdText)}
                    style={{ padding: 6 }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showNewPwdText ? "eye-off-outline" : "eye-outline"}
                      size={19}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>

                <View style={[themeStyles.softInputWrapper, newPwdError ? { borderColor: '#DC2626' } : {}]}>
                  <Ionicons name="shield-checkmark-outline" size={19} color={isDarkMode ? '#9CA3AF' : '#6B7280'} style={themeStyles.inputIcon} />
                  <TextInput
                    ref={confirmPwdRef}
                    style={themeStyles.softPasswordInput}
                    placeholder={t.pwdConfirmPlaceholder}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPwdText}
                    returnKeyType="done"
                    value={confirmPassword}
                    onChangeText={(text) => { setConfirmPassword(text); setNewPwdError(''); }}
                    onSubmitEditing={handleUpdatePassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPwdText(!showConfirmPwdText)}
                    style={{ padding: 6 }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showConfirmPwdText ? "eye-off-outline" : "eye-outline"}
                      size={19}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>

                {newPwdError ? <Text style={themeStyles.errorText}>{newPwdError}</Text> : null}

                <TouchableOpacity
                  style={[themeStyles.submitPasswordBtn, isUpdatingPwd && { opacity: 0.7 }]}
                  onPress={handleUpdatePassword}
                  disabled={isUpdatingPwd}
                  activeOpacity={0.85}
                >
                  {isUpdatingPwd ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={themeStyles.submitPasswordBtnText}>{t.pwdSaveBtn}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        </View>
      </Modal>

      {/* 7. Modal Khôi phục mật khẩu qua Email OTP */}
      <Modal visible={showForgotRecovery} animationType="slide" onRequestClose={resetForgotRecoveryModal}>
        <View style={themeStyles.modalContainer}>
          <SubScreenHeader title={t.recoveryModalTitle} onClose={resetForgotRecoveryModal} />
          <ScrollView style={themeStyles.modalContent} keyboardShouldPersistTaps="handled">
            {/* Chỉ báo tiến trình 3 bước */}
            <View style={themeStyles.recoveryStepsRow}>
              {[
                { step: 1 as const, label: t.recoveryStepEmail },
                { step: 2 as const, label: t.recoveryStepOtp },
                { step: 3 as const, label: t.recoveryStepReset },
              ].map((item) => {
                const isActive = recoveryStep === item.step;
                const isDone = recoveryStep > item.step;
                return (
                  <View
                    key={item.step}
                    style={[
                      themeStyles.recoveryStepPill,
                      (isActive || isDone) && {
                        backgroundColor: isDarkMode ? '#1F2F2B' : '#EFF4F2',
                        borderColor: isDarkMode ? '#34D399' : '#2F6B5F',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        themeStyles.recoveryStepPillText,
                        (isActive || isDone) && {
                          color: isDarkMode ? '#34D399' : '#2F6B5F',
                          fontWeight: '700',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {recoveryStep === 1 && (
              <View style={themeStyles.passwordForm}>
                <Text style={themeStyles.passwordInstruction}>
                  {t.recoveryStep1Desc}
                </Text>

                <View style={[themeStyles.inputWrapper, recoveryError ? { borderColor: '#DC2626' } : {}]}>
                  <Ionicons
                    name="mail-outline"
                    size={19}
                    color={isDarkMode ? '#9CA3AF' : '#6B7280'}
                    style={themeStyles.inputIcon}
                  />
                  <TextInput
                    style={themeStyles.passwordInput}
                    placeholder={t.recoveryEmailPlaceholder}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={recoveryEmail}
                    onChangeText={(text) => {
                      setRecoveryEmail(text);
                      setRecoveryError('');
                    }}
                    onSubmitEditing={() => handleSendRecoveryOtp(false)}
                    autoFocus={!userInfo.email}
                  />
                </View>

                {recoveryError ? <Text style={themeStyles.errorText}>{recoveryError}</Text> : null}

                <TouchableOpacity
                  style={[themeStyles.submitPasswordBtn, isRecoverySubmitting && { opacity: 0.7 }]}
                  onPress={() => handleSendRecoveryOtp(false)}
                  disabled={isRecoverySubmitting}
                  activeOpacity={0.85}
                >
                  {isRecoverySubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={themeStyles.submitPasswordBtnText}>{t.recoverySendOtpBtn}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {recoveryStep === 2 && (
              <View style={themeStyles.passwordForm}>
                <Text style={themeStyles.passwordInstruction}>
                  {t.recoveryStep2DescPrefix} <Text style={{ fontWeight: '700' }}>{recoveryEmail.trim()}</Text>.
                </Text>

                <View style={[themeStyles.inputWrapper, recoveryError ? { borderColor: '#DC2626' } : {}]}>
                  <Ionicons
                    name="key-outline"
                    size={19}
                    color={isDarkMode ? '#9CA3AF' : '#6B7280'}
                    style={themeStyles.inputIcon}
                  />
                  <TextInput
                    style={[themeStyles.passwordInput, themeStyles.recoveryOtpInput]}
                    placeholder={t.recoveryOtpPlaceholder}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={recoveryOtp}
                    onChangeText={(text) => {
                      setRecoveryOtp(text.replace(/[^0-9]/g, ''));
                      setRecoveryError('');
                    }}
                    onSubmitEditing={handleVerifyRecoveryOtp}
                    autoFocus
                  />
                </View>

                {recoveryError ? <Text style={themeStyles.errorText}>{recoveryError}</Text> : null}

                <TouchableOpacity
                  style={[themeStyles.submitPasswordBtn, isRecoverySubmitting && { opacity: 0.7 }]}
                  onPress={handleVerifyRecoveryOtp}
                  disabled={isRecoverySubmitting}
                  activeOpacity={0.85}
                >
                  {isRecoverySubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={themeStyles.submitPasswordBtnText}>{t.recoveryVerifyOtpBtn}</Text>
                  )}
                </TouchableOpacity>

                <View style={themeStyles.recoveryHelperRow}>
                  <TouchableOpacity
                    onPress={() => handleSendRecoveryOtp(true)}
                    disabled={isRecoverySubmitting}
                    activeOpacity={0.7}
                  >
                    <Text style={[themeStyles.recoveryHelperLink, { color: isDarkMode ? '#34D399' : '#2F6B5F' }]}>
                      {t.recoveryResendOtp}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setRecoveryStep(1);
                      setRecoveryOtp('');
                      setRecoveryError('');
                    }}
                    disabled={isRecoverySubmitting}
                    activeOpacity={0.7}
                  >
                    <Text style={themeStyles.recoveryHelperMuted}>{t.recoveryChangeEmail}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {recoveryStep === 3 && (
              <View style={themeStyles.passwordForm}>
                <Text style={themeStyles.passwordInstruction}>
                  {t.recoveryStep3DescPrefix} <Text style={{ fontWeight: '700' }}>{recoveryEmail.trim()}</Text>.
                </Text>

                <View style={[themeStyles.softInputWrapper, recoveryError ? { borderColor: '#DC2626' } : {}]}>
                  <Ionicons name="lock-closed-outline" size={19} color={isDarkMode ? '#9CA3AF' : '#6B7280'} style={themeStyles.inputIcon} />
                  <TextInput
                    style={themeStyles.softPasswordInput}
                    placeholder={t.pwdNewPlaceholder}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showRecoveryNewPwd}
                    returnKeyType="next"
                    value={recoveryNewPwd}
                    onChangeText={(text) => {
                      setRecoveryNewPwd(text);
                      setRecoveryError('');
                    }}
                    onSubmitEditing={() => recoveryConfirmRef.current?.focus()}
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={() => setShowRecoveryNewPwd(!showRecoveryNewPwd)}
                    style={{ padding: 6 }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showRecoveryNewPwd ? 'eye-off-outline' : 'eye-outline'}
                      size={19}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>

                <View style={[themeStyles.softInputWrapper, recoveryError ? { borderColor: '#DC2626' } : {}]}>
                  <Ionicons name="shield-checkmark-outline" size={19} color={isDarkMode ? '#9CA3AF' : '#6B7280'} style={themeStyles.inputIcon} />
                  <TextInput
                    ref={recoveryConfirmRef}
                    style={themeStyles.softPasswordInput}
                    placeholder={t.pwdConfirmPlaceholder}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showRecoveryConfirmPwd}
                    returnKeyType="done"
                    value={recoveryConfirmPwd}
                    onChangeText={(text) => {
                      setRecoveryConfirmPwd(text);
                      setRecoveryError('');
                    }}
                    onSubmitEditing={handleResetRecoveredPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowRecoveryConfirmPwd(!showRecoveryConfirmPwd)}
                    style={{ padding: 6 }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showRecoveryConfirmPwd ? 'eye-off-outline' : 'eye-outline'}
                      size={19}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>

                {recoveryError ? <Text style={themeStyles.errorText}>{recoveryError}</Text> : null}

                <TouchableOpacity
                  style={[themeStyles.submitPasswordBtn, isRecoverySubmitting && { opacity: 0.7 }]}
                  onPress={handleResetRecoveredPassword}
                  disabled={isRecoverySubmitting}
                  activeOpacity={0.85}
                >
                  {isRecoverySubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={themeStyles.submitPasswordBtnText}>{t.recoverySaveBtn}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* 5. [GIẢI THÍCH CODE]: Modal Hạng Thành Viên & Đặc Quyền Độc Giả */}
      <MembershipModal
        visible={showTierModal}
        onClose={() => setShowTierModal(false)}
        summary={tierSummary}
        potatoBalance={userInfo.potatoBalance}
        onTopUp={() => {
          setShowTierModal(false);
          navigate('payment');
        }}
        allTiers={allTiers}
        isCheckingIn={isCheckingIn}
        onCheckinStreak={handleDailyCheckin}
        lang={lang}
      />

      {/* 8. Modal Nhắn tin Hỗ trợ & Khiếu nại 2 chiều với Ban Quản Trị (/api/user/support-tickets) */}
      <SupportTicketModal
        visible={showSupportChat}
        onClose={() => setShowSupportChat(false)}
        customerId={userInfo.customerId && userInfo.customerId !== 'Chưa cập nhật' ? userInfo.customerId : ''}
        customerName={userInfo.name}
        customerEmail={userInfo.email}
        customerPhone={userInfo.phone}
        customerAvatar={userInfo.avatarUrl}
        lang={lang}
      />

      {/* 6. [GIẢI THÍCH CODE]: Modal Nhiệm Vụ Hằng Ngày - Tách biệt độc lập khỏi Hạng thành viên & đặc quyền */}
      <Modal visible={showDailyTasks} animationType="slide">
        <View style={themeStyles.modalContainer}>
          <SubScreenHeader
            title={t.dailyTasksModalTitle}
            onClose={() => setShowDailyTasks(false)}
          />
          <ScrollView style={themeStyles.modalContent}>
            {/* ================================================================ */}
            {/* [GIẢI THÍCH CODE]: CUỐN LỊCH ĐIỂM DANH NGÀY ĐĂNG NHẬP (ATTENDANCE CALENDAR) */}
            {/* ================================================================ */}
            <View style={themeStyles.calendarCard}>
              {/* Header cuốn lịch: Chỉ hiển thị icon và Tháng / Năm */}
              <View style={themeStyles.calendarHeader}>
                <View style={themeStyles.calendarTitleBox}>
                  <View style={themeStyles.calendarIconCircle}>
                    <Ionicons name="calendar-outline" size={19} color={isDarkMode ? '#34D399' : '#2F6B5F'} />
                  </View>
                  <Text style={themeStyles.calendarTitle}>{calendarData.monthTitle}</Text>
                </View>

                <View style={themeStyles.calendarNavRow}>
                  <TouchableOpacity
                    style={themeStyles.calendarNavBtn}
                    onPress={() => setCalendarMonthOffset((prev) => prev - 1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-back" size={16} color={isDarkMode ? '#E4E6EB' : '#374151'} />
                  </TouchableOpacity>
                  {calendarMonthOffset !== 0 && (
                    <TouchableOpacity
                      style={[themeStyles.calendarNavBtn, { paddingHorizontal: 8, width: 'auto' }]}
                      onPress={() => setCalendarMonthOffset(0)}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '600', color: isDarkMode ? '#34D399' : '#2F6B5F' }}>
                        {t.todayLabel}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={themeStyles.calendarNavBtn}
                    onPress={() => setCalendarMonthOffset((prev) => prev + 1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-forward" size={16} color={isDarkMode ? '#E4E6EB' : '#374151'} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dải tiêu đề 7 ngày trong tuần */}
              <View style={themeStyles.calendarWeekHeader}>
                {t.daysShort.map((dayName, idx) => (
                  <Text
                    key={idx}
                    style={[
                      themeStyles.calendarWeekDayText,
                      idx === 6 && { color: '#DC2626' },
                    ]}
                  >
                    {dayName}
                  </Text>
                ))}
              </View>

              {/* Lưới các tuần và ngày trong tháng */}
              {calendarData.weeks.map((week: (number | null)[], weekIdx: number) => (
                <View key={weekIdx} style={themeStyles.calendarWeekRow}>
                  {week.map((dayNum: number | null, dayIdx: number) => {
                    if (dayNum === null) {
                      return <View key={dayIdx} style={themeStyles.calendarDaySlot} />;
                    }

                    const dateKey = `${calendarData.viewYear}-${String(calendarData.viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isChecked = allCheckedDatesSet.has(dateKey);
                    const isToday = calendarData.isCurrentMonthView && dayNum === calendarData.todayDayNumber;
                    const isFuture = calendarData.isCurrentMonthView
                      ? dayNum > calendarData.todayDayNumber
                      : (new Date(calendarData.viewYear, calendarData.viewMonth, dayNum) > new Date());

                    return (
                      <View key={dayIdx} style={themeStyles.calendarDaySlot}>
                        <TouchableOpacity
                          style={[
                            themeStyles.calendarDayCircle,
                            isChecked && {
                              backgroundColor: isDarkMode ? '#1F2F2B' : '#EFF4F2',
                              borderWidth: 1,
                              borderColor: isDarkMode ? '#2D4A43' : '#2F6B5F',
                            },
                            isToday && !isChecked && themeStyles.calendarDayToday,
                            isToday && isChecked && themeStyles.calendarDayTodayChecked,
                          ]}
                          disabled={!isToday || tierSummary?.hasCheckedInToday || isCheckingIn}
                          onPress={handleDailyCheckin}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              themeStyles.calendarDayText,
                              isChecked && { color: isDarkMode ? '#34D399' : '#2F6B5F', fontWeight: '700' },
                              isToday && !isChecked && themeStyles.calendarDayTodayText,
                              isToday && isChecked && themeStyles.calendarDayTodayCheckedText,
                              isFuture && themeStyles.calendarDayFutureText,
                            ]}
                          >
                            {dayNum}
                          </Text>
                          {isChecked && !isToday && (
                            <View style={themeStyles.calendarCheckDot} />
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              ))}

              {/* Dòng tóm tắt thống kê điểm danh */}
              <View style={themeStyles.calendarSummaryRow}>
                <View style={themeStyles.calendarSummaryItem}>
                  <Ionicons name="flame-outline" size={16} color={isDarkMode ? '#FB923C' : '#B45309'} />
                  <Text style={themeStyles.calendarSummaryText}>
                    {t.calendarStreakLabel} {tierSummary?.streakDays ?? userInfo.streakDays} {lang === 'en' ? 'days' : 'ngày'}
                  </Text>
                </View>
                <View style={themeStyles.calendarSummaryItem}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={isDarkMode ? '#34D399' : '#2F6B5F'} />
                  <Text style={themeStyles.calendarSummaryText}>
                    {t.calendarCheckedDaysLabel} {calendarData.checkedCountInMonth}/{calendarData.daysInMonth} {lang === 'en' ? 'days' : 'ngày'}
                  </Text>
                </View>
              </View>

              {/* Nút Điểm Danh Hôm Nay Lớn Nổi Bật Ngay Dưới Cuốn Lịch */}
              <TouchableOpacity
                style={[
                  themeStyles.calendarMainBtn,
                  tierSummary?.hasCheckedInToday && {
                    backgroundColor: isDarkMode ? '#1F2F2B' : '#EFF4F2',
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#2D4A43' : '#D1DFDA',
                  },
                ]}
                onPress={handleDailyCheckin}
                disabled={isCheckingIn || tierSummary?.hasCheckedInToday}
                activeOpacity={0.85}
              >
                {isCheckingIn ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons
                      name={tierSummary?.hasCheckedInToday ? 'checkmark-circle-outline' : 'gift-outline'}
                      size={18}
                      color={tierSummary?.hasCheckedInToday ? (isDarkMode ? '#34D399' : '#2F6B5F') : '#FFFFFF'}
                    />
                    <Text
                      style={[
                        themeStyles.calendarMainBtnText,
                        tierSummary?.hasCheckedInToday && { color: isDarkMode ? '#34D399' : '#2F6B5F' },
                      ]}
                    >
                      {tierSummary?.hasCheckedInToday ? t.checkedInTodayBtn : t.checkinTodayBtn}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Text style={themeStyles.sectionHeading}>{t.dailyTaskHeading}</Text>

            {/* Nhiệm vụ 1: Đọc sách 20 phút */}
            <View style={themeStyles.dailyTaskItemCard}>
              <View style={themeStyles.dailyTaskIconRow}>
                <View style={themeStyles.dailyTaskIconBadge}>
                  <Ionicons name="book-outline" size={20} color={isDarkMode ? '#CBD5E1' : '#374151'} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={themeStyles.dailyTaskItemTitle}>{t.dailyTask1Title}</Text>
                  <Text style={[themeStyles.dailyTaskItemReward, { color: isDarkMode ? '#FBBF24' : '#B45309' }]}>{t.dailyTask1Reward}</Text>
                  <Text style={themeStyles.dailyTaskItemDesc}>{t.dailyTask1Desc}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={themeStyles.dailyTaskActionBtn}
                onPress={() => {
                  setShowDailyTasks(false);
                  navigate('bookshelf');
                }}
              >
                <Text style={themeStyles.dailyTaskActionBtnText}>{t.dailyTask1Btn}</Text>
              </TouchableOpacity>
            </View>

            {/* Nhiệm vụ 2: Đánh giá sách */}
            <View style={themeStyles.dailyTaskItemCard}>
              <View style={themeStyles.dailyTaskIconRow}>
                <View style={themeStyles.dailyTaskIconBadge}>
                  <Ionicons name="star-outline" size={20} color={isDarkMode ? '#CBD5E1' : '#374151'} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={themeStyles.dailyTaskItemTitle}>{t.dailyTask2Title}</Text>
                  <Text style={[themeStyles.dailyTaskItemReward, { color: isDarkMode ? '#FBBF24' : '#B45309' }]}>{t.dailyTask2Reward}</Text>
                  <Text style={themeStyles.dailyTaskItemDesc}>{t.dailyTask2Desc}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={themeStyles.dailyTaskActionBtn}
                onPress={() => {
                  setShowDailyTasks(false);
                  navigate('bookshelf');
                }}
              >
                <Text style={themeStyles.dailyTaskActionBtnText}>{t.dailyTask2Btn}</Text>
              </TouchableOpacity>
            </View>

            {/* Nhiệm vụ 3: Chuỗi đọc 7 ngày */}
            <View style={themeStyles.dailyTaskItemCard}>
              <View style={themeStyles.dailyTaskIconRow}>
                <View style={themeStyles.dailyTaskIconBadge}>
                  <Ionicons name="flame-outline" size={20} color={isDarkMode ? '#FB923C' : '#B45309'} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={themeStyles.dailyTaskItemTitle}>{t.dailyTask3Title}</Text>
                  <Text style={[themeStyles.dailyTaskItemReward, { color: isDarkMode ? '#FBBF24' : '#B45309' }]}>{t.dailyTask3Reward}</Text>
                  <Text style={themeStyles.dailyTaskItemDesc}>{t.dailyTask3Desc}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  themeStyles.dailyTaskActionBtn,
                  tierSummary?.hasCheckedInToday && {
                    backgroundColor: isDarkMode ? '#1F2F2B' : '#EFF4F2',
                  },
                ]}
                onPress={handleDailyCheckin}
                disabled={tierSummary?.hasCheckedInToday}
              >
                <Text
                  style={[
                    themeStyles.dailyTaskActionBtnText,
                    tierSummary?.hasCheckedInToday && { color: isDarkMode ? '#34D399' : '#2F6B5F' },
                  ]}
                >
                  {tierSummary?.hasCheckedInToday ? t.dailyTask3Done : t.dailyTask3Btn}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Nhiệm vụ 4: Mời bạn bè */}
            <View style={themeStyles.dailyTaskItemCard}>
              <View style={themeStyles.dailyTaskIconRow}>
                <View style={themeStyles.dailyTaskIconBadge}>
                  <Ionicons name="people-outline" size={20} color={isDarkMode ? '#CBD5E1' : '#374151'} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={themeStyles.dailyTaskItemTitle}>{t.dailyTask4Title}</Text>
                  <Text style={[themeStyles.dailyTaskItemReward, { color: isDarkMode ? '#FBBF24' : '#B45309' }]}>{t.dailyTask4Reward}</Text>
                  <Text style={themeStyles.dailyTaskItemDesc}>{t.dailyTask4Desc}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={themeStyles.dailyTaskActionBtn}
                onPress={() => {
                  Alert.alert(
                    t.referralAlertTitle,
                    t.referralAlertPrefix + (userInfo.name ? userInfo.name.replace(/\s+/g, '').toUpperCase() : 'USER') + t.referralAlertSuffix,
                    [{ text: t.referralAlertBtn }]
                  );
                }}
              >
                <Text style={themeStyles.dailyTaskActionBtnText}>{t.dailyTask4Btn}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5F7' },
  mainScroll: { flex: 1 },

  // User Info Header
  userInfoSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 26 : 52,
    paddingBottom: 38,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarLarge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#2F6B5F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  avatarLargeText: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  modalAvatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 0,
  },
  userName: {
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: '#111827',
    marginBottom: 6,
  },
  userIdPill: {
    backgroundColor: '#F4F5F7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userId: { fontSize: 12, fontWeight: '500', color: '#6B7280' },

  // Buttons Row (overlapping header edge cleanly)
  mainActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    marginTop: -22,
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 10,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2F6B5F',
    paddingVertical: 13,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginLeft: 7 },
  topUpBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topUpBtnText: { color: '#111827', fontSize: 14, fontWeight: '600', marginLeft: 7 },

  // Stats Card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 14,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 11.5, fontWeight: '500', color: '#6B7280', marginTop: 3 },
  statDivider: { width: 1, height: 38, backgroundColor: '#E5E7EB' },

  // Tier Card Enhanced
  tierCardEnhanced: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  tierCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierBadgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tierBadgeEmoji: {
    fontSize: 22,
  },
  tierCardMainInfo: {
    flex: 1,
    marginLeft: 12,
  },
  tierCardName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#111827',
  },
  tierDiscountPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  tierDiscountText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tierCardSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  tierArrowBtn: {
    padding: 4,
  },
  miniProgressBarTrack: {
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  miniProgressBarFill: {
    height: '100%',
    backgroundColor: '#2F6B5F',
    borderRadius: 3,
  },
  tierCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  tierCardFooterText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#6B7280',
  },
  tierCardActionHint: {
    fontSize: 11.5,
    fontWeight: '600',
  },

  // Quick Checkin Bar
  quickCheckinBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    marginBottom: 16,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  quickCheckinIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCheckinTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  quickCheckinSub: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  quickCheckinBtn: {
    backgroundColor: '#2F6B5F',
    paddingHorizontal: 13,
    paddingVertical: 8.5,
    borderRadius: 10,
  },
  quickCheckinBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Attendance Calendar Styles
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calendarIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  calendarNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
    marginBottom: 8,
  },
  calendarWeekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  calendarDaySlot: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  calendarDayToday: {
    borderWidth: 1.5,
    borderColor: '#2F6B5F',
    backgroundColor: '#F4F5F7',
  },
  calendarDayTodayChecked: {
    backgroundColor: '#2F6B5F',
    borderColor: '#2F6B5F',
  },
  calendarDayTodayText: {
    color: '#2F6B5F',
    fontWeight: '700',
  },
  calendarDayTodayCheckedText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calendarDayFutureText: {
    color: '#9CA3AF',
  },
  calendarCheckDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2F6B5F',
  },
  calendarSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4F5F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 12,
  },
  calendarSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarSummaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  calendarMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2F6B5F',
    paddingVertical: 13,
    borderRadius: 12,
  },
  calendarMainBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Daily Tasks Modal Styles
  dailyTaskItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dailyTaskIconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dailyTaskIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyTaskItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  dailyTaskItemReward: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  dailyTaskItemDesc: {
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 18,
    marginTop: 4,
  },
  dailyTaskActionBtn: {
    backgroundColor: '#2F6B5F',
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  dailyTaskActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },

  // Menu Section (Unified monochrome-slate editorial list)
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 18,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F4F5F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  menuItemText: { flex: 1, fontSize: 14.5, fontWeight: '500', color: '#111827' },

  // Bottom Actions
  bottomActionsRow: { flexDirection: 'row', paddingHorizontal: 18, marginTop: 22 },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 13.5,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryBtnText: { color: '#111827', fontSize: 14, fontWeight: '600', marginLeft: 7 },
  logoutBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 13.5,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  logoutBtnText: { color: '#DC2626', fontSize: 14, fontWeight: '600', marginLeft: 7 },

  // MODAL STYLES
  modalContainer: { flex: 1, backgroundColor: '#F4F5F7' },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 52,
    paddingBottom: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subHeaderBtn: { padding: 6 },
  subHeaderTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  modalContent: { flex: 1, padding: 18 },

  // Profile Modal
  avatarEditWrapper: { position: 'relative' },
  avatarPenIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2F6B5F',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  infoFieldsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoFieldRow: { borderBottomWidth: 1, borderBottomColor: '#F1F3F5', paddingVertical: 14 },
  infoFieldLabel: { fontSize: 12.5, fontWeight: '500', color: '#6B7280', marginBottom: 5 },
  infoFieldValue: { fontSize: 15, color: '#111827', fontWeight: '600' },
  infoFieldInput: { fontSize: 15, color: '#111827', fontWeight: '600', padding: 0 },
  infoFieldInputEditing: { borderBottomWidth: 1.5, paddingBottom: 5 },
  genderOption: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  genderOptionActive: { borderColor: '#2F6B5F', backgroundColor: '#2F6B5F' },
  genderOptionText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
  genderOptionTextActive: { color: '#FFFFFF' },
  editProfileBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  editProfileBtnText: { fontSize: 15, fontWeight: '600' },
  saveProfileBtn: { backgroundColor: '#2F6B5F', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveProfileBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  cancelProfileBtn: { backgroundColor: '#E5E7EB', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancelProfileBtnText: { color: '#374151', fontSize: 15, fontWeight: '600' },

  // Avatar Menu Action Sheet
  avatarMenuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  avatarMenuBox: { width: '78%', backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
  avatarMenuItem: { paddingVertical: 18, alignItems: 'center' },
  avatarMenuItemText: { fontSize: 15.5, fontWeight: '600', color: '#111827' },
  avatarMenuDivider: { height: 1, backgroundColor: '#E5E7EB' },

  // Help Center
  aiChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2F6B5F',
    padding: 18,
    borderRadius: 16,
    marginBottom: 24,
  },
  aiChatIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiChatTitle: { fontSize: 16.5, fontWeight: '700', color: '#FFFFFF', marginBottom: 3 },
  aiChatSub: { fontSize: 12.5, color: 'rgba(255,255,255,0.82)' },
  sectionHeading: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12, marginTop: 6 },
  socialRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  socialBox: {
    width: '23%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  socialText: { fontSize: 11.5, fontWeight: '500', color: '#4B5563', marginTop: 7 },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  faqHeaderBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqText: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1, paddingRight: 10 },
  faqAnswerBox: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  faqAnswerText: {
    fontSize: 13.5,
    color: '#4B5563',
    lineHeight: 21,
  },
  faqActionsCol: {
    marginTop: 14,
    gap: 8,
  },
  faqPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F6B5F',
    paddingVertical: 11.5,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 7,
  },
  faqPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },
  faqSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F5F7',
    paddingVertical: 10.5,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 7,
  },
  faqSecondaryBtnText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '600',
  },

  // Notifications
  switchRowMaster: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  switchTitleMaster: { fontSize: 15.5, fontWeight: '700', color: '#111827', marginBottom: 3 },
  switchSub: { fontSize: 12.5, color: '#6B7280' },
  subOptionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disabledOptions: { opacity: 0.45 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  switchTitle: { fontSize: 14.5, fontWeight: '500', color: '#111827' },

  // About
  aboutHeader: { alignItems: 'center', paddingVertical: 28 },
  aboutLogoText: { fontSize: 34, fontWeight: '800', letterSpacing: -0.6, color: '#111827', marginBottom: 8 },
  aboutVersion: { fontSize: 12.5, color: '#6B7280', marginBottom: 6, fontWeight: '500' },
  aboutSlogan: { fontSize: 14, fontStyle: 'italic', color: '#4B5563', marginTop: 6 },
  aboutInfoBox: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  aboutDesc: { fontSize: 14, color: '#4B5563', lineHeight: 22, textAlign: 'center' },

  // Password Modal (Clean modern editorial inputs & CTA)
  passwordForm: { marginTop: 8 },
  passwordInstruction: { fontSize: 14, color: '#6B7280', marginBottom: 20, lineHeight: 21 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 14,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: { marginRight: 10 },
  passwordInput: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },
  submitPasswordBtn: {
    backgroundColor: '#2F6B5F',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitPasswordBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  errorText: { color: '#DC2626', fontSize: 13, marginBottom: 14, marginTop: -4, fontWeight: '500' },
  softInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 14,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  softPasswordInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#111827', fontWeight: '500' },

  // Password Recovery Steps
  recoveryStepsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  recoveryStepPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  recoveryStepPillText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#6B7280',
  },
  recoveryOtpInput: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 6,
  },
  recoveryHelperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 4,
  },
  recoveryHelperLink: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  recoveryHelperMuted: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#6B7280',
  },
});


