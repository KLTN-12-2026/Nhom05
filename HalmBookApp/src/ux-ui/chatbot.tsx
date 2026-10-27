import { ArrowLeft, BookOpen, Bot, Image as ImageIcon, Mic, MoreVertical, Send } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useAppNavigation, useAppThemeStyles } from './navigation';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet, Text,
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
  onBack: () => void;                    // Hàm xử lý quay lại
  onSendMessage: (text: string) => void; // Hàm phát tín hiệu gửi tin nhắn
}

// ==========================================
// 2. GIAO DIỆN (UI COMPONENT)
// ==========================================
export default function ChatBotScreen({ 
  messages, 
  botName = "Trợ lý HALM", 
  statusText = "🟢 Đang hoạt động",
  onBack, 
  onSendMessage 
}: ChatBotUIProps) {
  const themeStyles = useAppThemeStyles(styles);
  const { navigate, isDarkMode } = useAppNavigation();
  const [inputText, setInputText] = useState('');
  // Khai báo ref cho FlatList
  const flatListRef = useRef<FlatList<any>>(null);

  // Xử lý gửi tin nhắn
  const handleSend = () => {
    if (inputText.trim().length > 0) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  // Hàm vẽ từng bong bóng chat
  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';

    return (
      <View style={[themeStyles.messageWrapper, isUser ? themeStyles.messageWrapperUser : themeStyles.messageWrapperBot]}>
        
        {/* Avatar Bot */}
        {!isUser && (
          <View style={themeStyles.botAvatarSmall}>
            <Bot size={16} color="#fff" />
          </View>
        )}

        <View style={[themeStyles.messageBubble, isUser ? themeStyles.userBubble : themeStyles.botBubble]}>
          {/* Tin nhắn chữ */}
          {item.text && (
            <Text style={[themeStyles.messageText, isUser ? themeStyles.userText : themeStyles.botText]}>
              {item.text}
            </Text>
          )}

          {/* Tin nhắn thẻ sách */}
          {item.type === 'book_recommendation' && item.book && (
            <TouchableOpacity
              style={themeStyles.bookSuggestCard}
              activeOpacity={0.9}
              onPress={() => navigate('bookDetail', {
                id: item.book!.title,
                title: item.book!.title,
                author: item.book!.author,
                rating: item.book!.rating,
              })}
            >
              <View style={themeStyles.bookSuggestCover}>
                <BookOpen size={20} color="#888" />
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

          <Text style={[themeStyles.timeText, isUser ? { color: '#888', textAlign: 'right' } : { color: '#aaa' }]}>
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={themeStyles.safeArea}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Header */}
      <View style={themeStyles.header}>
        <TouchableOpacity style={themeStyles.iconButton} onPress={onBack} activeOpacity={0.8}>
          <ArrowLeft size={20} color="#1a1a1a" />
        </TouchableOpacity>
        
        <View style={themeStyles.headerTitleContainer}>
          <View style={themeStyles.headerAvatar}>
            <Bot size={20} color="#fff" />
          </View>
          <View>
            <Text style={themeStyles.headerTitle}>{botName}</Text>
            <Text style={themeStyles.headerSubtitle}>{statusText}</Text>
          </View>
        </View>

        <TouchableOpacity style={themeStyles.iconButton} activeOpacity={0.8}>
          <MoreVertical size={20} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      {/* 
        Sử dụng KeyboardAvoidingView với cấu hình chuẩn cho Chat.
        - iOS: behavior="padding"
        - Android: Không set behavior hoặc set "height" tùy layout, 
          nhưng thường không cần thiết nếu AndroidManifest đã có windowSoftInputMode="adjustResize"
      */}
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
          // Tự động cuộn xuống dưới cùng khi có tin nhắn mới
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            <View style={themeStyles.systemMessage}>
              <Text style={themeStyles.systemMessageText}>Bắt đầu phiên hội thoại</Text>
            </View>
          }
        />

        {/* Khung Nhập Liệu */}
        <View style={themeStyles.inputArea}>
          <TouchableOpacity style={themeStyles.attachBtn}>
            <ImageIcon size={20} color="#1a1a1a" />
          </TouchableOpacity>
          
          <View style={themeStyles.inputContainer}>
            <TextInput 
              style={themeStyles.input}
              placeholder="Nhắn tin cho trợ lý..."
              placeholderTextColor="#888"
              value={inputText}
              onChangeText={setInputText}
              multiline={true}
              scrollEnabled={true}
            />
            {inputText.length === 0 && (
              <TouchableOpacity style={themeStyles.micBtn}>
                <Mic size={18} color="#888" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[themeStyles.sendBtn, inputText.trim().length > 0 && themeStyles.sendBtnActive]} 
            activeOpacity={0.8}
            onPress={handleSend}
          >
            <Send size={18} color={inputText.trim().length > 0 ? "#1a1a1a" : "#fff"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==========================================
// 3. STYLESHEET (Neo-Brutalism)
// ==========================================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9f9f9' },
  keyboardAvoid: { flex: 1 },
  
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 3, borderBottomColor: '#1a1a1a',
    zIndex: 10
  },
  iconButton: {
    width: 40, height: 40, backgroundColor: '#fff',
    borderWidth: 2, borderColor: '#1a1a1a', borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#1a1a1a', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, elevation: 2
  },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 15 },
  headerAvatar: {
    width: 36, height: 36, backgroundColor: '#1dd1a1',
    borderWidth: 2, borderColor: '#1a1a1a', borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
    shadowColor: '#1a1a1a', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, elevation: 2
  },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#1a1a1a' },
  headerSubtitle: { fontSize: 11, fontWeight: '700', color: '#666', marginTop: 2 },

  chatArea: { flex: 1, backgroundColor: '#f4f4f4' },
  chatContent: { padding: 16, paddingBottom: 20 },
  systemMessage: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  systemMessageText: { fontSize: 11, fontWeight: '700', color: '#aaa', backgroundColor: '#e5e5e5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },

  messageWrapper: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  messageWrapperUser: { justifyContent: 'flex-end' },
  messageWrapperBot: { justifyContent: 'flex-start' },
  
  botAvatarSmall: {
    width: 28, height: 28, backgroundColor: '#1dd1a1',
    borderWidth: 1.5, borderColor: '#1a1a1a', borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: 8, marginBottom: 15
  },

  messageBubble: {
    maxWidth: '75%', padding: 12, paddingBottom: 8,
    borderWidth: 2, borderColor: '#1a1a1a', borderRadius: 16,
    shadowColor: '#1a1a1a', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, elevation: 3
  },
  userBubble: { backgroundColor: '#ffde59', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  
  messageText: { fontSize: 14, fontWeight: '600', lineHeight: 20, marginBottom: 4 },
  userText: { color: '#1a1a1a' },
  botText: { color: '#1a1a1a' },
  timeText: { fontSize: 10, fontWeight: '700', marginTop: 2 },

  bookSuggestCard: {
    flexDirection: 'row', backgroundColor: '#f9f9f9',
    borderWidth: 2, borderColor: '#1a1a1a', borderRadius: 12,
    padding: 8, marginTop: 8, marginBottom: 4,
    shadowColor: '#1a1a1a', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, elevation: 2
  },
  bookSuggestCover: { width: 45, height: 60, backgroundColor: '#e5e5e5', borderRadius: 6, borderWidth: 1, borderColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  bookSuggestInfo: { flex: 1, marginLeft: 10, justifyContent: 'center' },
  bookSuggestTitle: { fontSize: 13, fontWeight: '900', color: '#1a1a1a', marginBottom: 2 },
  bookSuggestAuthor: { fontSize: 11, fontWeight: '600', color: '#666', marginBottom: 6 },
  bookSuggestTagRow: { flexDirection: 'row', gap: 6 },
  bookSuggestTag: { fontSize: 9, fontWeight: '800', backgroundColor: '#a29bfe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#1a1a1a', overflow: 'hidden' },

  inputArea: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: '#fff', borderTopWidth: 3, borderTopColor: '#1a1a1a',
    paddingBottom: Platform.OS === 'ios' ? 25 : 12
  },
  attachBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginRight: 8, marginBottom: 2 },
  inputContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: '#f4f4f4', borderWidth: 2, borderColor: '#1a1a1a', borderRadius: 20,
    paddingHorizontal: 12, minHeight: 45, maxHeight: 120
  },
  input: { 
    flex: 1, fontSize: 14, fontWeight: '600', color: '#1a1a1a', 
    paddingVertical: Platform.OS === 'ios' ? 12 : 8, 
    maxHeight: 110
  },
  micBtn: { padding: 8, marginBottom: Platform.OS === 'ios' ? 2 : 0 },
  
  sendBtn: {
    width: 45, height: 45, backgroundColor: '#ccc',
    borderWidth: 2, borderColor: '#1a1a1a', borderRadius: 25,
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
    shadowColor: '#1a1a1a', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, elevation: 2,
    marginBottom: 2
  },
  sendBtnActive: { backgroundColor: '#1dd1a1' }
});