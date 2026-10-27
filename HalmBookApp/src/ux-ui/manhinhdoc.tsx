import { useAppNavigation, useAppThemeStyles } from './navigation';
import React, { useState, useRef, useEffect } from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { 
  ArrowLeft, Search, Settings, List, 
  Bookmark, Music, Play, Pause, X, Check, Volume2, Upload, Eye, EyeOff, Sliders, Type, Sun, Moon, Palette, Layers, BookOpen, Maximize2, Minimize2
} from 'lucide-react-native';

interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  content: string[];
}

interface ReaderProps {
  onBack: () => void;
}

interface Track {
  id: string;
  name: string;
  artist: string;
  url: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: 'Chương 1 - Khởi đầu của sự kết thúc',
    subtitle: 'Khảo Cổ Học Đại Cương',
    content: [
      'Lưu viện Quan Trung, trong con hẻm nhỏ với những cửa hàng to nhỏ đủ cỡ nằm chen chúc, chất đầy các loại đồ cổ loang lổ vết gỉ sét, khó lòng phân biệt thật giả, chẳng hạn như tiền xu, con dấu, đồ dùng bằng xương hoặc sừng, thư pháp và bản dập...',
      'Lúc này, vạn vật đều bị bao phủ bởi cơn mưa lớn bất tận.',
      'Hơi ẩm ngấm qua đôi tất thể thao len vào lòng bàn chân Nhạc Du, rồi đến đầu gối, kéo theo cơn đau nhức do vết thương cũ để lại. Nhạc Du xác nhận lại địa chỉ một lần nữa, đi lướt qua những hàng liễu rủ mềm mại, tìm kiếm bốn ký tự “Hiệu sách Khảo Cổ” được thiết kế theo kiểu chữ Triện trong Bản khắc đá Dịch Sơn của Lý Tư giữa một dãy nhà hai tầng.',
      'Bên trong tiệm thoang thoảng mùi giấy cũ và hương trầm lâu năm. Những chiếc kệ gỗ bày biện vô số cổ vật kỳ lạ, ánh đèn vàng hắt hiu rọi xuống từng góc tối tĩnh lặng.',
      '“Cậu tìm món đồ nào đặc biệt sao?” – Một giọng nói khàn đợt vang lên từ phía góc tối của căn phòng, phá tan sự tĩnh mịch của màn đêm.'
    ]
  },
  {
    id: 2,
    title: 'Chương 2 - Lời hứa dưới cơn mưa',
    subtitle: 'Bí ẩn tiệm cổ vật',
    content: [
      'Cánh cửa gỗ mục kẽo kẹt mở ra trong màn đêm tịch mịch. Mùi hương trầm thoang thoảng trộn lẫn với mùi ẩm mốc của giấy cũ.',
      'Trên chiếc bàn gỗ mahogany đặt một cuốn sổ tay bám đầy bụi thời gian. Nhạc Du bước vào, ánh mắt dừng lại ở bức tranh treo tường vẽ cảnh hoàng hôn đỏ rực.',
      'Bên ngoài, tiếng sấm gầm rú xé toạc bầu trời, hắt ánh chớp xanh ngắt vào căn phòng nhỏ.',
      'Cậu lật từng trang sổ tay, những dòng chữ cổ bằng mực tàu bắt đầu hiện rõ dưới ánh đèn pin yếu ớt.'
    ]
  },
  {
    id: 3,
    title: 'Chương 3 - Ranh Giới',
    subtitle: 'Đêm tháng Mười Hai',
    content: [
      'Ánh trăng nhợt nhạt hắt qua khung cửa sổ vỡ vụn, chiếu rọi lên những vệt sơn đỏ thẫm trên bức tường bê tông. Denko ngồi bệt ở góc phòng, hơi thở gấp gáp tạo thành những màn khói mỏng trong không khí lạnh lẽo của đêm tháng Mười Hai.',
      'Cậu liếc nhìn thanh gươm đang phát ra những tia lửa điện lép bép bên cạnh mình. Mọi thứ dường như vừa mới xảy ra chỉ vài giây trước.',
      'Denko bật cười một tiếng khô khóc. “Lựa chọn? Từ khi nào những kẻ như chúng ta lại có đặc quyền được lựa chọn cơ chứ?” Cậu vuốt ngược mái tóc bết bát mồ hôi ra sau gáy, đôi mắt ánh lên một sắc vàng kỳ lạ.',
      'Bên ngoài, tiếng còi hụ rèn rỉ bắt đầu đấu xé toạc màn đêm. Chúng đang đến. Những con vật ẩn dưới lốt người bảo vệ trị an. Denko biết, ranh giới giữa việc làm một anh hùng và một con ác quỷ chưa bao giờ mong manh đến thế.'
    ]
  },
  {
    id: 4,
    title: 'Chương 4 - Vượt ngục',
    subtitle: 'Khu giam giữ ngầm',
    content: [
      'Hệ thống báo động vang lên inh ỏi khắp hành lang tầng hầm B4. Ánh đèn đỏ nhấp nháy liên hồi phản chiếu trên nền gạch men lạnh lẽo.',
      '“Cậu còn ba phút trước khi cửa an ninh chính đóng lại hoàn toàn,” giọng Aki vang qua tai nghe.'
    ]
  },
  {
    id: 5,
    title: 'Chương 5 - Bí mật lộ diện',
    subtitle: 'Sự thật đằng sau màn sương',
    content: [
      'Cuối cùng thì tài liệu mật cũng nằm trong tay. Từng trang giấy hé lộ những thí nghiệm vô nhân tính được che giấu suốt hai mươi năm qua.',
      'Mưa vẫn rơi nặng hạt ngoài kia, xóa nhòa mọi dấu vết của một cuộc chiến âm thầm.'
    ]
  }
];

const FONT_FAMILIES = [
  { name: 'Merriweather (Serif)', value: 'font-serif' },
  { name: 'Lora (Thanh lịch)', value: 'font-["Lora"]' },
  { name: 'Times New Roman', value: 'font-["Times_New_Roman"]' },
  { name: 'Inter (Hiện đại)', value: 'font-sans' },
  { name: 'Roboto', value: 'font-["Roboto"]' },
  { name: 'Playfair Display', value: 'font-["Playfair_Display"]' },
  { name: 'Fira Code', value: 'font-mono' }
];

function ManHinhDocWeb({ onBack }: ReaderProps) {
  const themeReaderStyles = useAppThemeStyles(readerStyles);
  const { isDarkMode } = useAppNavigation();
  const [currentChapterIndex, setCurrentChapterIndex] = useState(2);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [musicProgress, setMusicProgress] = useState(45);
  const [scrollPercent, setScrollPercent] = useState(0);
  
  // Custom audio tracks state
  const [tracks, setTracks] = useState<Track[]>([
    { id: '1', name: 'Quiet Evening Ambient', artist: 'Lo-fi Chill', url: '' }
  ]);
  const [currentTrackId, setCurrentTrackId] = useState<string>('1');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Modals & Navigation state
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTabMenu, setActiveTabMenu] = useState<'toc' | 'notes'>('toc');
  const [isImmersiveHidden, setIsImmersiveHidden] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  // Reader Customization state
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState('font-serif');
  const [theme, setTheme] = useState<'cream' | 'sepia' | 'dark'>(isDarkMode ? 'dark' : 'cream');
  const [bookmarks, setBookmarks] = useState<number[]>([3]);

  // Touch / Swipe tracking state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const activeChapter = CHAPTERS[currentChapterIndex];
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const totalScrollable = scrollHeight - clientHeight;
      if (totalScrollable > 0) {
        const pct = Math.min(100, Math.max(0, Math.round((scrollTop / totalScrollable) * 100)));
        setScrollPercent(pct);
      }
    }
  };

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
      setScrollPercent(0);
    }
  }, [currentChapterIndex]);

  const toggleBookmark = () => {
    if (bookmarks.includes(activeChapter.id)) {
      setBookmarks(bookmarks.filter(id => id !== activeChapter.id));
    } else {
      setBookmarks([...bookmarks, activeChapter.id]);
    }
  };

  const isBookmarked = bookmarks.includes(activeChapter.id);

  // Handle Audio playback & volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicProgress / 100;
      if (isPlayingMusic) {
        audioRef.current.play().catch(() => setIsPlayingMusic(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlayingMusic, musicProgress, currentTrackId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newTrack: Track = {
        id: Date.now().toString(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Tải lên từ thiết bị',
        url: url
      };
      setTracks(prev => [...prev, newTrack]);
      setCurrentTrackId(newTrack.id);
      setIsPlayingMusic(true);
    }
  };

  // Swipe handlers for chapter changing
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      if (currentChapterIndex < CHAPTERS.length - 1) {
        setCurrentChapterIndex(prev => prev + 1);
      }
    } else if (distance < -minSwipeDistance) {
      if (currentChapterIndex > 0) {
        setCurrentChapterIndex(prev => prev - 1);
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const currentTrack = tracks.find(t => t.id === currentTrackId) || tracks[0];

  return (
    <div className={`h-screen w-screen overflow-hidden ${isDarkMode ? 'bg-[#121614] text-[#d1d5db]' : 'bg-[#f3f0e6] text-slate-900'} font-sans select-none flex flex-col relative ${isZenMode ? 'p-0' : ''}`} style={{
      backgroundImage: isZenMode ? 'none' : 'radial-gradient(#d1cbb8 1.5px, transparent 1.5px)',
      backgroundSize: '28px 28px'
    }}>
      
      {/* Hidden Audio Element for Custom Music */}
      <audio 
        ref={audioRef} 
        src={currentTrack.url} 
        loop 
      />

      {/* Top Header */}
      <header className={`transition-all duration-300 w-full px-6 py-3 shrink-0 flex items-center justify-between z-30 ${isDarkMode ? 'bg-[#121614]/95 border-slate-700' : 'bg-[#f3f0e6]/95 border-slate-900'} backdrop-blur-sm border-b-2 ${isImmersiveHidden || isZenMode ? '-translate-y-20 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        
        {/* Left Side: Back, Toc & Zen Mode Button */}
        <div className="flex items-center space-x-3">
          <button 
            className="w-10 h-10 bg-white border-2 border-slate-900 rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] transition cursor-pointer"
            title="Quay lại"
            onClick={onBack}
          >
            <ArrowLeft size={20} color="#0f172a" />
          </button>
          
          <button 
            onClick={() => { setIsTocOpen(!isTocOpen); setIsMusicOpen(false); setIsSettingsOpen(false); }}
            className={`w-10 h-10 border-2 border-slate-900 rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition cursor-pointer ${
              isTocOpen ? 'bg-amber-400 font-bold' : 'bg-white hover:bg-slate-50'
            }`}
            title="Mục lục & Ghi chú"
          >
            <List size={20} color="#0f172a" />
          </button>

          <button 
            onClick={() => setIsZenMode(true)}
            className="w-10 h-10 bg-white hover:bg-amber-100 border-2 border-slate-900 rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition cursor-pointer"
            title="Bật chế độ Zen (Toàn màn hình)"
          >
            <Maximize2 size={16} color="#0f172a" />
          </button>
        </div>

        {/* Right Side: Bookmark, Music, Settings */}
        <div className="flex items-center space-x-3 relative">
          <button 
            onClick={toggleBookmark}
            className={`w-10 h-10 border-2 border-slate-900 rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition cursor-pointer ${
              isBookmarked ? 'bg-amber-400' : 'bg-white hover:bg-slate-50'
            }`}
            title="Đánh dấu trang"
          >
            <Bookmark size={20} color="#0f172a" fill={isBookmarked ? '#0f172a' : 'none'} />
          </button>

          <button 
            onClick={() => { setIsMusicOpen(!isMusicOpen); setIsTocOpen(false); setIsSettingsOpen(false); }}
            className={`w-10 h-10 border-2 border-slate-900 rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition cursor-pointer ${
              isMusicOpen ? 'bg-amber-400 font-bold' : 'bg-white hover:bg-slate-50'
            }`}
            title="Không gian âm nhạc"
          >
            <Music size={20} color="#0f172a" />
          </button>

          <button 
            onClick={() => { setIsSettingsOpen(!isSettingsOpen); setIsTocOpen(false); setIsMusicOpen(false); }}
            className={`w-10 h-10 border-2 border-slate-900 rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition cursor-pointer ${
              isSettingsOpen ? 'bg-amber-400 font-bold' : 'bg-white hover:bg-slate-50'
            }`}
            title="Cài đặt giao diện"
          >
            <Settings size={20} color="#0f172a" />
          </button>

          {/* Floating Music Player Modal */}
          {isMusicOpen && (
            <aside className="absolute right-0 top-14 z-50 w-80 bg-white border-3 border-slate-900 rounded-3xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col overflow-hidden animate-fadeIn text-left">
              <div className="p-3.5 border-b-2 border-slate-900 bg-amber-100 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <Music size={16} color="#0f172a" />
                  <span className="font-black text-xs text-slate-900">Không Gian Âm Nhạc</span>
                </div>
                <button onClick={() => setIsMusicOpen(false)} className="p-1 hover:bg-amber-200 rounded-full border border-slate-900 cursor-pointer">
                  <X size={16} color="#0f172a" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="bg-amber-50 border-2 border-slate-900 p-3 rounded-2xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-between">
                  <div className="overflow-hidden pr-2">
                    <p className="text-xs font-black text-slate-900 truncate">{currentTrack.name}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5 truncate">{currentTrack.artist}</p>
                  </div>
                  <button 
                    onClick={() => setIsPlayingMusic(!isPlayingMusic)}
                    className="w-8 h-8 bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition cursor-pointer shrink-0"
                  >
                    {isPlayingMusic ? <Pause size={16} color="#0f172a" fill="#0f172a" /> : <Play size={16} color="#0f172a" fill="#0f172a" />}
                  </button>
                </div>

                {/* Track Selector & Upload */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-black text-slate-800">
                    <span>Danh sách phát</span>
                    <label className="cursor-pointer bg-amber-200 hover:bg-amber-300 border-2 border-slate-900 px-2.5 py-1 rounded-xl text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1 transition">
                      <Upload size={12} color="#0f172a" /> Tải nhạc lên
                      <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {tracks.map(t => (
                      <div 
                        key={t.id}
                        onClick={() => { setCurrentTrackId(t.id); setIsPlayingMusic(true); }}
                        className={`p-2 rounded-xl border-2 border-slate-900 text-xs flex items-center justify-between cursor-pointer transition ${currentTrackId === t.id ? 'bg-amber-100 font-bold shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]' : 'bg-white hover:bg-slate-50 text-slate-700'}`}
                      >
                        <span className="truncate mr-2">{t.name}</span>
                        {currentTrackId === t.id && isPlayingMusic && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-200">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700">
                    <span className="flex items-center gap-1"><Volume2 size={12} color="#0f172a" /> Âm lượng</span>
                    <span>{musicProgress}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={musicProgress}
                    onChange={(e) => setMusicProgress(Number(e.target.value))}
                    className="w-full h-1.5 bg-amber-200 border border-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>
            </aside>
          )}

          {/* Floating Settings Modal */}
          {isSettingsOpen && (
            <aside className="absolute right-0 top-14 z-50 w-72 bg-white border-3 border-slate-900 rounded-3xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col overflow-hidden animate-fadeIn text-left">
              <div className="p-3.5 border-b-2 border-slate-900 bg-amber-100 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <Settings size={16} color="#0f172a" />
                  <span className="font-black text-xs text-slate-900">Cài đặt Đọc Sách</span>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="p-1 hover:bg-amber-200 rounded-full border border-slate-900 cursor-pointer">
                  <X size={16} color="#0f172a" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-black text-slate-800">Cỡ chữ ({fontSize}px)</span>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                      className="flex-1 py-1.5 bg-amber-100 hover:bg-amber-200 border-2 border-slate-900 rounded-xl font-black text-xs shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition cursor-pointer"
                    >
                      A-
                    </button>
                    <button 
                      onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                      className="flex-1 py-1.5 bg-amber-100 hover:bg-amber-200 border-2 border-slate-900 rounded-xl font-black text-xs shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition cursor-pointer"
                    >
                      A+
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-black text-slate-800">Kiểu chữ (Font)</span>
                  <select 
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full px-3 py-2 bg-amber-50 border-2 border-slate-900 rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
                  >
                    {FONT_FAMILIES.map(f => (
                      <option key={f.value} value={f.value}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-black text-slate-800">Màu nền trang</span>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setTheme('cream')} 
                      className={`flex-1 py-1.5 rounded-xl border-2 border-slate-900 bg-white font-black text-[11px] shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer ${theme === 'cream' ? 'bg-amber-200' : ''}`}
                    >
                      Sáng
                    </button>
                    <button 
                      onClick={() => setTheme('sepia')} 
                      className={`flex-1 py-1.5 rounded-xl border-2 border-slate-900 bg-[#fbf0d9] font-black text-[11px] shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer ${theme === 'sepia' ? 'bg-[#f3dfbc]' : ''}`}
                    >
                      Vàng ấm
                    </button>
                    <button 
                      onClick={() => setTheme('dark')} 
                      className={`flex-1 py-1.5 rounded-xl border-2 border-slate-900 bg-[#121614] text-white font-black text-[11px] shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer ${theme === 'dark' ? 'bg-slate-800' : ''}`}
                    >
                      Tối
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className={`flex-1 flex overflow-hidden relative justify-center items-center ${isZenMode ? 'p-0' : 'p-6'}`}>
        
        {/* Zen Mode Exit Button & Persistent Progress Bar in Zen Mode */}
        {isZenMode && (
          <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between gap-4 pointer-events-none">
            <div className="pointer-events-auto bg-white/90 hover:bg-white text-slate-900 border-2 border-slate-900 px-4 py-1.5 rounded-full shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-center gap-3 text-xs font-black backdrop-blur-md">
              <span>Chương {activeChapter.id} / {CHAPTERS.length}</span>
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-900">
                <div className="h-full bg-amber-400 transition-all duration-150" style={{ width: `${scrollPercent}%` }}></div>
              </div>
              <span>{scrollPercent}%</span>
            </div>

            <button 
              onClick={() => setIsZenMode(false)}
              className="pointer-events-auto bg-white/90 hover:bg-white text-slate-900 border-2 border-slate-900 px-3 py-1.5 rounded-full shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5 text-xs font-black transition cursor-pointer backdrop-blur-md"
              title="Thoát chế độ Zen"
            >
              <Minimize2 size={16} color="#0f172a" /> Thoát Zen
            </button>
          </div>
        )}

        {/* Floating Table of Contents Modal */}
        {isTocOpen && (
          <aside className="absolute left-24 top-6 z-50 w-72 bg-white border-3 border-slate-900 rounded-3xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col overflow-hidden animate-fadeIn max-h-[80vh]">
            <div className="p-3.5 border-b-2 border-slate-900 bg-amber-100 flex items-center justify-between shrink-0">
              <div className="flex space-x-1.5">
                <button 
                  onClick={() => setActiveTabMenu('toc')}
                  className={`px-3 py-1 rounded-xl text-[10px] font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition cursor-pointer ${
                    activeTabMenu === 'toc' ? 'bg-amber-400 text-slate-900' : 'bg-white text-slate-700'
                  }`}
                >
                  MỤC LỤC
                </button>
                <button 
                  onClick={() => setActiveTabMenu('notes')}
                  className={`px-3 py-1 rounded-xl text-[10px] font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition cursor-pointer ${
                    activeTabMenu === 'notes' ? 'bg-amber-400 text-slate-900' : 'bg-white text-slate-700'
                  }`}
                >
                  GHI CHÚ
                </button>
              </div>
              <button 
                onClick={() => setIsTocOpen(false)} 
                className="p-1 hover:bg-amber-200 rounded-full border border-slate-900 cursor-pointer"
              >
                <X size={16} color="#0f172a" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
              {activeTabMenu === 'toc' ? (
                CHAPTERS.map((ch, idx) => (
                  <div 
                    key={ch.id}
                    onClick={() => { setCurrentChapterIndex(idx); setIsTocOpen(false); }}
                    className={`p-3 rounded-2xl border-2 border-slate-900 cursor-pointer transition shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${
                      currentChapterIndex === idx ? 'bg-amber-50 font-bold' : 'bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500">Chương {ch.id}</span>
                      {currentChapterIndex === idx && (
                        <span className="text-[8px] bg-amber-400 text-slate-900 border border-slate-900 px-1.5 py-0.5 rounded-full font-black">Active</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">{ch.subtitle}</p>
                  </div>
                ))
              ) : (
                bookmarks.map(chId => {
                  const ch = CHAPTERS.find(c => c.id === chId);
                  if (!ch) return null;
                  return (
                    <div 
                      key={ch.id}
                      onClick={() => {
                        const idx = CHAPTERS.findIndex(c => c.id === chId);
                        setCurrentChapterIndex(idx);
                        setIsTocOpen(false);
                      }}
                      className="p-3 rounded-2xl border-2 border-slate-900 bg-amber-50 cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                    >
                      <p className="text-[9px] font-black text-amber-600">Đã đánh dấu</p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">{ch.title}</p>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* Main Reading Box with Swipe Listeners */}
        <main 
          onClick={() => {
            if (!isZenMode) {
              setIsImmersiveHidden(!isImmersiveHidden);
            }
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`w-full flex flex-col items-center justify-between relative transition-all duration-300 ${
            theme === 'cream' ? 'bg-white text-slate-900' :
            theme === 'sepia' ? 'bg-[#fbf0d9] text-[#2c221e]' :
            'bg-[#121614] text-[#d1d5db]'
          } ${
            isZenMode 
              ? 'h-full w-full rounded-none border-0 shadow-none p-8 md:p-16 max-w-4xl' 
              : 'max-w-2xl h-full border-3 border-slate-900 rounded-3xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] p-6 cursor-pointer'
          }`}
        >
          {/* Top Progress Bar inside Book */}
          <div className="w-full flex items-center justify-between text-[11px] font-black opacity-70 pb-3 border-b border-slate-300/30">
            <span>Chương {activeChapter.id} / {CHAPTERS.length}</span>
            <div className="flex items-center gap-2">
              <span>Đã đọc {scrollPercent}%</span>
              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden border border-slate-900">
                <div className="h-full bg-amber-400 transition-all duration-150" style={{ width: `${scrollPercent}%` }}></div>
              </div>
            </div>
          </div>

          {/* Scrollable Text Content */}
          <div 
            ref={contentRef}
            onScroll={handleScroll}
            className={`flex-1 w-full px-4 py-4 overflow-y-auto space-y-6 relative ${isZenMode ? 'max-w-3xl mx-auto' : 'max-w-xl'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center pb-3 border-b-2 border-dashed border-slate-300/50">
              <h1 className="text-xl md:text-2xl font-black tracking-tight">{activeChapter.title}</h1>
              <p className="text-xs font-black text-amber-600 mt-1 uppercase tracking-widest">{activeChapter.subtitle}</p>
            </div>

            {activeChapter.content.map((paragraph, index) => (
              <p 
                key={index} 
                className={`leading-relaxed text-justify transition-all ${fontFamily}`}
                style={{ fontSize: `${fontSize}px` }}
              >
                {paragraph}
              </p>
            ))}

            <div className="text-center pt-4 pb-8 opacity-40 font-black tracking-widest">
              * * *
            </div>
          </div>
        </main>

      </div>

      {/* Footer */}
      <footer className={`w-full py-2 ${isDarkMode ? 'bg-[#1b2025] border-slate-700 text-slate-300' : 'bg-white border-slate-900 text-slate-700'} border-t-2 text-center text-[11px] font-black tracking-wide shrink-0 transition-all ${isZenMode ? 'hidden' : ''}`}>
        HALM BOOK eReader • Vuốt trái/phải để chuyển chương sách 💛💙
      </footer>

    </div>
  );
}

function NativeReader({ onBack }: ReaderProps) {
  const themeReaderStyles = useAppThemeStyles(readerStyles);
  const { isDarkMode } = useAppNavigation();
  const [chapterIndex, setChapterIndex] = useState(2);
  const chapter = CHAPTERS[chapterIndex];

  return (
    <SafeAreaView style={themeReaderStyles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={themeReaderStyles.header}>
        <TouchableOpacity onPress={onBack} accessibilityLabel="Quay lại">
          <ArrowLeft size={22} color={isDarkMode ? '#E4E6EB' : '#17202a'} />
        </TouchableOpacity>
        <Text style={themeReaderStyles.headerTitle}>HALM BOOK • Trình đọc</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={themeReaderStyles.content}>
        <Text style={themeReaderStyles.chapterTitle}>{chapter.title}</Text>
        <Text style={themeReaderStyles.subtitle}>{chapter.subtitle}</Text>
        {chapter.content.map((paragraph, index) => (
          <Text key={index} style={themeReaderStyles.paragraph}>{paragraph}</Text>
        ))}
      </ScrollView>
      <View style={themeReaderStyles.controls}>
        <TouchableOpacity
          style={themeReaderStyles.chapterButton}
          disabled={chapterIndex === 0}
          onPress={() => setChapterIndex((index) => Math.max(0, index - 1))}
        >
          <Text style={themeReaderStyles.controlText}>Chương trước</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={themeReaderStyles.chapterButton}
          disabled={chapterIndex === CHAPTERS.length - 1}
          onPress={() => setChapterIndex((index) => Math.min(CHAPTERS.length - 1, index + 1))}
        >
          <Text style={themeReaderStyles.controlText}>Chương tiếp</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function ManHinhDoc({ onBack }: ReaderProps) {
  return Platform.OS === 'web'
    ? <ManHinhDocWeb onBack={onBack} />
    : <NativeReader onBack={onBack} />;
}

const readerStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f0e6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#d6d0c1',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#17202a' },
  content: { padding: 22, paddingBottom: 40 },
  chapterTitle: { fontSize: 22, fontWeight: '900', color: '#17202a', textAlign: 'center' },
  subtitle: { marginTop: 8, marginBottom: 22, color: '#a66a00', fontWeight: '700', textAlign: 'center' },
  paragraph: { marginBottom: 18, color: '#30343b', fontSize: 18, lineHeight: 30, textAlign: 'justify' },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#d6d0c1',
  },
  chapterButton: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f1c40f' },
  controlText: { color: '#17202a', fontWeight: '800' },
});