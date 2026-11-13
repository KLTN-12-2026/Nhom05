import { 
  ArrowLeft, 
  BookOpen, 
  Bot, 
  RotateCcw, 
  Send, 
  Sparkles 
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useAppNavigation, useAppThemeStyles } from './navigation';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// ==========================================
// 1. GIAO KẾT DỮ LIỆU (INTERFACES)
// ==========================================
export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text?: string;
  time: string;
  type?: 'text' | 'book_recommendation';
  book?: {
    title: string;
    author: string;
    rating: string;
  };
}

export interface ChatBotUIProps {
  messages: ChatMessage[];               // Mảng dữ liệu tin nhắn
  botName?: string;                      // Tên Bot 
  statusText?: string;                   // Trạng thái
  isLoading?: boolean;                   // Đang chờ AI phản hồi
  onBack: () => void;                    // Hàm xử lý quay lại
  onSendMessage: (text: string) => void; // Hàm phát tín hiệu gửi tin nhắn
  onClearChat?: () => void;              // Hàm làm mới cuộc trò chuyện
}

// ==========================================
// 2. GIAO DIỆN CHATBOT CAO CẤP (UI COMPONENT)
// ==========================================
export default function ChatBotScreen({ 
  messages, 
  botName = "HALM.AI", 
  statusText = "Sẵn sàng hỗ trợ",
  isLoading = false,
  onBack, 
  onSendMessage,
  onClearChat
}: ChatBotUIProps) {
  const themeStyles = useAppThemeStyles(styles);
  const { navigate, isDarkMode } = useAppNavigation();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList<any>>(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 120);
    return () => clearTimeout(timer);
  }, [messages.length, isLoading]);

  // Gửi tin nhắn
  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (query.length > 0 && !isLoading) {
      onSendMessage(query);
      if (!textToSend) {
        setInputText('');
      }
    }
  };

  // Menu tùy chọn làm mới cuộc trò chuyện
  const handleMorePress = () => {
    Alert.alert(
      'Cuộc trò chuyện với HALM.AI',
      'Bạn muốn làm gì với cuộc trò chuyện hiện tại?',
      [
        {
          text: 'Làm mới cuộc trò chuyện',
          style: 'destructive',
          onPress: () => onClearChat?.(),
        },
        { text: 'Đóng', style: 'cancel' },
      ]
    );
  };

  // Vẽ từng bong bóng tin nhắn
  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';

    return (
      <View style={[themeStyles.messageWrapper, isUser ? themeStyles.messageWrapperUser : themeStyles.messageWrapperBot]}>
        
        {/* Avatar của Bot */}
        {!isUser && (
          <View style={themeStyles.botAvatarWrapper}>
            <View style={themeStyles.botAvatarInner}>
              <Sparkles size={15} color="#fff" />
            </View>
          </View>
        )}

        {/* Khung nội dung tin nhắn */}
        <View style={[themeStyles.messageBubble, isUser ? themeStyles.userBubble : themeStyles.botBubble]}>
          
          {/* Header nhỏ cho Bot */}
          {!isUser && (
            <View style={themeStyles.botBadgeRow}>
              <Text style={themeStyles.botBadgeName}>HALM.AI</Text>
              <View style={themeStyles.aiBadge}>
                <Text style={themeStyles.aiBadgeText}>AI Assistant</Text>
              </View>
            </View>
          )}

          {/* Nội dung tin nhắn văn bản */}
          {item.text && (
            <Text style={[themeStyles.messageText, isUser ? themeStyles.userText : themeStyles.botText]}>
              {item.text}
            </Text>
          )}

          {/* Thẻ gợi ý sách nếu có */}
          {item.type === 'book_recommendation' && item.book && (
            <TouchableOpacity
              style={themeStyles.bookSuggestCard}
              activeOpacity={0.88}
              onPress={() => navigate('bookDetail', {
                id: item.book!.title,
                title: item.book!.title,
                author: item.book!.author,
                rating: item.book!.rating,
              })}
            >
              <View style={themeStyles.bookSuggestCover}>
                <BookOpen size={20} color="#2c3a7a" />
              </View>
              <View style={themeStyles.bookSuggestInfo}>
                <Text style={themeStyles.bookSuggestTitle} numberOfLines={2}>{item.book.title}</Text>
                <Text style={themeStyles.bookSuggestAuthor}>{item.book.author}</Text>
                <View style={themeStyles.bookSuggestTagRow}>
                  <Text style={themeStyles.bookSuggestTag}>⭐ {item.book.rating}</Text>
                  <Text style={themeStyles.bookSuggestTag}>📖 Đọc ngay</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Thời gian gửi */}
          <Text style={[themeStyles.timeText, isUser ? themeStyles.userTimeText : themeStyles.botTimeText]}>
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  // Header danh sách: hiển thị phân cách bắt đầu phiên hội thoại
  const renderListHeader = () => (
    <View style={themeStyles.listHeaderContainer}>
      <View style={themeStyles.dateDivider}>
        <View style={themeStyles.dateDividerLine} />
        <Text style={themeStyles.dateDividerText}>Bắt đầu phiên hội thoại</Text>
        <View style={themeStyles.dateDividerLine} />
      </View>
    </View>
  );

  // Footer danh sách: hiển thị khi AI đang xử lý
  const renderListFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={[themeStyles.messageWrapper, themeStyles.messageWrapperBot]}>
        <View style={themeStyles.botAvatarWrapper}>
          <View style={themeStyles.botAvatarInner}>
            <Sparkles size={15} color="#fff" />
          </View>
        </View>
        <View style={[themeStyles.messageBubble, themeStyles.botBubble, themeStyles.loadingBubble]}>
          <ActivityIndicator size="small" color="#2c3a7a" style={{ marginRight: 10 }} />
          <Text style={themeStyles.loadingText}>
            HALM.AI đang phân tích & soạn câu trả lời...
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={themeStyles.safeArea}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* 1. Header cao cấp */}
      <View style={themeStyles.header}>
        <TouchableOpacity 
          style={themeStyles.headerBackBtn} 
          onPress={onBack} 
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#1e293b" />
        </TouchableOpacity>
        
        <View style={themeStyles.headerProfile}>
          <View style={themeStyles.headerAvatar}>
            <Bot size={22} color="#fff" />
            <View style={[themeStyles.statusDot, isLoading && themeStyles.statusDotLoading]} />
          </View>
          <View style={themeStyles.headerTextWrap}>
            <Text style={themeStyles.headerTitle}>{botName}</Text>
            <Text style={themeStyles.headerSubtitle} numberOfLines={1}>
              {isLoading ? 'Đang soạn câu trả lời...' : statusText}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={themeStyles.headerActionBtn} 
          activeOpacity={0.7} 
          onPress={handleMorePress}
        >
          <RotateCcw size={18} color="#475569" />
        </TouchableOpacity>
      </View>

      {/* 2. Khung hội thoại */}
      <KeyboardAvoidingView 
        style={themeStyles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          style={themeStyles.chatArea}
          contentContainerStyle={themeStyles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={renderListFooter}
        />

        {/* 3. Khung nhập tin nhắn hiện đại */}
        <View style={themeStyles.inputAreaWrapper}>
          <View style={themeStyles.inputBarContainer}>
            <TextInput 
              style={themeStyles.textInput}
              placeholder={isLoading ? "HALM.AI đang suy nghĩ..." : "Nhắn tin hoặc hỏi về sách..."}
              placeholderTextColor="#94a3b8"
              value={inputText}
              onChangeText={setInputText}
              multiline={true}
              scrollEnabled={true}
              editable={!isLoading}
            />

            <TouchableOpacity 
              style={[
                themeStyles.sendButton, 
                inputText.trim().length > 0 && !isLoading && themeStyles.sendButtonActive
              ]} 
              activeOpacity={0.8}
              onPress={() => handleSend()}
              disabled={isLoading || inputText.trim().length === 0}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send size={18} color={inputText.trim().length > 0 ? "#fff" : "#94a3b8"} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==========================================
// 3. STYLESHEET CHUẨN HIỆN ĐẠI (MODERN SLEEK)
// ==========================================
const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  keyboardAvoid: { 
    flex: 1 
  },
  
  // Header
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingVertical: 12,
    backgroundColor: '#ffffff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10
  },
  headerBackBtn: {
    width: 38, 
    height: 38, 
    borderRadius: 19, 
    backgroundColor: '#f1f5f9',
    justifyContent: 'center', 
    alignItems: 'center'
  },
  headerProfile: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1, 
    marginHorizontal: 12 
  },
  headerAvatar: {
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    backgroundColor: '#2c3a7a',
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 10,
    shadowColor: '#2c3a7a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  statusDotLoading: {
    backgroundColor: '#f59e0b'
  },
  headerTextWrap: {
    flex: 1
  },
  headerTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#0f172a' 
  },
  headerSubtitle: { 
    fontSize: 12, 
    fontWeight: '500', 
    color: '#64748b', 
    marginTop: 2 
  },
  headerActionBtn: {
    width: 38, 
    height: 38, 
    borderRadius: 19, 
    backgroundColor: '#f1f5f9',
    justifyContent: 'center', 
    alignItems: 'center'
  },

  // Danh sách tin nhắn
  chatArea: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  chatContent: { 
    paddingHorizontal: 16, 
    paddingTop: 12, 
    paddingBottom: 20 
  },

  // Divider phân cách phiên hội thoại
  listHeaderContainer: {
    marginBottom: 16
  },
  dateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10
  },
  dateDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0'
  },
  dateDividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginHorizontal: 12
  },

  // Từng khối tin nhắn
  messageWrapper: { 
    flexDirection: 'row', 
    marginBottom: 14, 
    alignItems: 'flex-end' 
  },
  messageWrapperUser: { 
    justifyContent: 'flex-end' 
  },
  messageWrapperBot: { 
    justifyContent: 'flex-start' 
  },

  botAvatarWrapper: {
    marginRight: 8,
    marginBottom: 4
  },
  botAvatarInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2c3a7a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2c3a7a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },

  // Bong bóng tin nhắn
  messageBubble: {
    maxWidth: '80%', 
    paddingHorizontal: 15, 
    paddingTop: 12, 
    paddingBottom: 9,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2
  },
  userBubble: { 
    backgroundColor: '#2c3a7a', 
    borderBottomRightRadius: 4,
    shadowColor: '#2c3a7a'
  },
  botBubble: { 
    backgroundColor: '#ffffff', 
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000'
  },

  // Bot badge bên trong tin nhắn
  botBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5
  },
  botBadgeName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2c3a7a'
  },
  aiBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669'
  },

  // Văn bản tin nhắn
  messageText: { 
    fontSize: 14.5, 
    lineHeight: 22, 
    marginBottom: 4 
  },
  userText: { 
    color: '#ffffff',
    fontWeight: '500' 
  },
  botText: { 
    color: '#1e293b',
    fontWeight: '500' 
  },

  // Giờ gửi
  timeText: { 
    fontSize: 10, 
    fontWeight: '600', 
    marginTop: 2 
  },
  userTimeText: { 
    color: '#cbd5e1', 
    textAlign: 'right' 
  },
  botTimeText: { 
    color: '#94a3b8', 
    textAlign: 'left' 
  },

  // Thẻ gợi ý sách
  bookSuggestCard: {
    flexDirection: 'row', 
    backgroundColor: '#f1f5f9',
    borderRadius: 12, 
    padding: 10, 
    marginTop: 8, 
    marginBottom: 6,
    borderWidth: 1, 
    borderColor: '#e2e8f0'
  },
  bookSuggestCover: { 
    width: 44, 
    height: 58, 
    backgroundColor: '#e2e8f0', 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  bookSuggestInfo: { 
    flex: 1, 
    marginLeft: 10, 
    justifyContent: 'center' 
  },
  bookSuggestTitle: { 
    fontSize: 13, 
    fontWeight: '800', 
    color: '#0f172a', 
    marginBottom: 3 
  },
  bookSuggestAuthor: { 
    fontSize: 11, 
    fontWeight: '500', 
    color: '#64748b', 
    marginBottom: 6 
  },
  bookSuggestTagRow: { 
    flexDirection: 'row', 
    gap: 6 
  },
  bookSuggestTag: { 
    fontSize: 10, 
    fontWeight: '700', 
    backgroundColor: '#e0e7ff', 
    color: '#3730a3',
    paddingHorizontal: 7, 
    paddingVertical: 2, 
    borderRadius: 6, 
    overflow: 'hidden' 
  },

  // Loading bubble
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  loadingText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#475569',
    fontWeight: '500'
  },

  // Khung nhập tin nhắn
  inputAreaWrapper: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12
  },
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    minHeight: 46
  },
  textInput: { 
    flex: 1, 
    fontSize: 14.5, 
    color: '#0f172a', 
    fontWeight: '500',
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 6,
    maxHeight: 110
  },
  sendButton: {
    width: 38, 
    height: 38, 
    backgroundColor: '#e2e8f0',
    borderRadius: 19,
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 6,
    marginBottom: 3
  },
  sendButtonActive: { 
    backgroundColor: '#2c3a7a',
    shadowColor: '#2c3a7a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3
  }
});
