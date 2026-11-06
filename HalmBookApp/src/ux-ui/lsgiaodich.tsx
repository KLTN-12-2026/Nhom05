import React, { useState } from 'react';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet, StatusBar } from 'react-native';
import { Coins, Search, Filter, Calendar, FileText, BookOpen, CheckCircle, RotateCcw, Star, RefreshCw, Sparkles, X, CreditCard, MapPin, Bookmark, ShieldCheck, Clock, AlertCircle } from 'lucide-react-native';
import { useAppNavigation, useAppThemeStyles } from './navigation';

export interface TransactionItem {
  id: string; code: string; title: string; authorOrSubtitle: string;
  type: 'rent' | 'return' | 'purchase'; typeLabel: string;
  status: string; statusType: 'active' | 'completed' | 'success';
  time: string; period?: string; price: string; paymentMethod: string;
  categoryType: 'book' | 'package'; publisher?: string; isbn?: string;
  branch?: string; deposit?: string; notes?: string; transactionHash?: string;
}

export default function HalmBookHistory() {
  const themeStyles = useAppThemeStyles(styles);
  const { logout, isDarkMode } = useAppNavigation();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedDetailTx, setSelectedDetailTx] = useState<TransactionItem | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; action: () => void; message: string } | null>(null);
  const [ratingModal, setRatingModal] = useState<{ isOpen: boolean; title: string; txId: string } | null>(null);
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3500);
  };

  const transactions: TransactionItem[] = [
    { id: '1', code: 'SY-260910-0045', title: 'Đời Ngắn Đừng Ngủ Dài', authorOrSubtitle: 'Tác giả: Nguyễn Ngọc Thiện', type: 'rent', typeLabel: 'Thuê sách', status: 'Đang thuê', statusType: 'active', time: '2026-09-10 09:15', period: '10/09/2026 → 24/09/2026', price: '15.000đ', paymentMethod: 'Momo Wallet (Ví MoMo)', categoryType: 'book', publisher: 'NXB Tổng hợp TP.HCM', isbn: '978-604-58-9123-4', branch: 'Chi nhánh 03 Quang Trung, Đà Nẵng', deposit: '50.000đ (Đã hoàn khi trả sách)', notes: 'Sách bìa mềm, kèm bookmark độc quyền Halm Book. Khách hàng vui lòng giữ gìn sạch sẽ.', transactionHash: 'MOMO_TXN_9928192384102' },
    { id: '2', code: 'SY-260905-0021', title: 'Nhà Giả Kim', authorOrSubtitle: 'Tác giả: Paulo Coelho', type: 'return', typeLabel: 'Trả sách', status: 'Đã trả', statusType: 'completed', time: '2026-09-05 14:30', period: '05/09/2026 → 12/09/2026', price: '12.000đ', paymentMethod: 'Tiền mặt tại quầy', categoryType: 'book', publisher: 'NXB Văn Học', isbn: '978-604-69-4451-2', branch: 'Chi nhánh 03 Quang Trung, Đà Nẵng', deposit: '0đ (Đã hoàn tất kiểm kê)', notes: 'Sách đã được nhân viên kiểm tra chất lượng kỹ lưỡng trước khi nhận lại.', transactionHash: 'CASH_RECEIPT_88319203' },
    { id: '3', code: 'SY-GOI-260901', title: 'Gói Thành Viên Tháng', authorOrSubtitle: 'Thanh toán gói dịch vụ', type: 'purchase', typeLabel: 'Thanh toán gói', status: 'Đã kích hoạt', statusType: 'success', time: '2026-09-01 00:00', period: '01/09/2026 → 01/10/2026', price: '99.000đ', paymentMethod: 'Chuyển khoản Ngân hàng (Vietcombank)', categoryType: 'package', publisher: 'Halm Book Premium Ecosystem', isbn: 'PKG-MONTHLY-VIP-2026', branch: 'Hệ thống trực tuyến toàn quốc', deposit: 'Không áp dụng', notes: 'Quyền lợi: Đọc không giới hạn kho sách VIP, ưu đãi 50% phí thuê sách lẻ, hỗ trợ AI đọc sách.', transactionHash: 'VCB_FT26090188392019' }
  ];

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.title.toLowerCase().includes(searchTerm.toLowerCase()) || tx.code.toLowerCase().includes(searchTerm.toLowerCase()) || tx.authorOrSubtitle.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesFilter = true;
    if (filterType === 'rent') matchesFilter = tx.type === 'rent';
    if (filterType === 'return') matchesFilter = tx.type === 'return';
    if (filterType === 'package') matchesFilter = tx.type === 'purchase';
    let matchesDate = true;
    if (selectedDate) matchesDate = tx.time.startsWith(selectedDate);
    return matchesSearch && matchesFilter && matchesDate;
  });

  const handleConfirmAction = (actionName: string, itemTitle: string) => {
    setConfirmModal({
      isOpen: true, title: `Xác nhận ${actionName}`, message: `Bạn có chắc chắn muốn ${actionName.toLowerCase()} cho cuốn sách "${itemTitle}" không?`,
      action: () => { setConfirmModal(null); showNotification(`✨ Đã thực hiện thao tác "${actionName}" cho "${itemTitle}"!`); }
    });
  };

  return (
    <View style={themeStyles.container}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />

      <ScrollView style={themeStyles.mainScroll} contentContainerStyle={themeStyles.mainContent}>
        <View style={themeStyles.summaryCard}>
          <View style={themeStyles.summaryTitleRow}>
            <View style={themeStyles.summaryIconBox}><FileText size={18} color="#1a1a1a" /></View>
            <Text style={themeStyles.summaryTitle}>LỊCH SỬ GIAO DỊCH</Text>
            <TouchableOpacity style={themeStyles.logoutAction} activeOpacity={0.8} onPress={logout}>
              <Text style={themeStyles.logoutActionText}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>
          <Text style={themeStyles.summaryDesc}>Tóm tắt hoạt động thuê & thanh toán của bạn tại <Text style={{fontWeight: '900'}}>HALM BOOK</Text></Text>

        <View style={themeStyles.filterSection}>
            <View style={[themeStyles.inputWrapper, { marginBottom: 12 }]}>
              <Search size={16} color="#1a1a1a" style={themeStyles.inputIcon} />
              <TextInput style={themeStyles.textInput} placeholder="Tìm kiếm: Tên sách / Mã đơn..." placeholderTextColor="#888" value={searchTerm} onChangeText={setSearchTerm} />
            </View>

            {/* Thêm contentContainerStyle để dải nút có không gian cho bóng đổ */}
          {/* Dải nút Filter (Đã bỏ nút Tất cả & thêm logic Toggle) */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={themeStyles.filterChipScroll} contentContainerStyle={themeStyles.filterChipContent}>
              {[ 
                { id: 'rent', label: 'Thuê sách' }, 
                { id: 'return', label: 'Trả sách' }, 
                { id: 'package', label: 'Mua gói' } 
              ].map(f => (
                <TouchableOpacity 
                  key={f.id} 
                  activeOpacity={0.8} 
                  style={[themeStyles.filterChip, filterType === f.id && themeStyles.filterChipActive]} 
                  onPress={() => setFilterType(filterType === f.id ? 'all' : f.id)}
                >
                  <Text style={[themeStyles.filterChipText, filterType === f.id && {color: '#1a1a1a', fontWeight: '900'}]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={themeStyles.inputWrapper}>
              <Calendar size={16} color="#1a1a1a" style={themeStyles.inputIcon} />
              <TextInput style={themeStyles.textInput} placeholder="Lọc theo ngày (YYYY-MM-DD)" placeholderTextColor="#888" value={selectedDate} onChangeText={setSelectedDate} />
            </View>
          </View>

          <View style={themeStyles.statsRow}>
            <View style={themeStyles.statBadge}>
              <View style={themeStyles.dotBlack} />
              <Text style={themeStyles.statLabel}>Tổng quan:</Text>
            </View>
            <View style={themeStyles.statMiniCard}><Text style={themeStyles.statText}>Đã thuê: <Text style={themeStyles.textHighlight}>12</Text></Text></View>
            <View style={themeStyles.statMiniCard}><Text style={themeStyles.statText}>Đang thuê: <Text style={themeStyles.textHighlight}>3</Text></Text></View>
            <View style={themeStyles.totalSpentBadge}><Text style={themeStyles.totalSpentText}>Tổng chi: 215.000đ</Text></View>
          </View>
        </View>

        <View style={themeStyles.listContainer}>
          {filteredTransactions.length === 0 ? (
            <View style={themeStyles.emptyState}>
              <Search size={32} color="#1a1a1a" style={{marginBottom: 10}} />
              <Text style={themeStyles.emptyStateText}>Không tìm thấy giao dịch nào phù hợp.</Text>
            </View>
          ) : (
            filteredTransactions.map((tx) => (
              <View key={tx.id} style={themeStyles.txCard}>
                <View style={themeStyles.txHeader}>
                  <View style={[themeStyles.txAvatar, tx.categoryType === 'package' ? {backgroundColor: '#a29bfe'} : {backgroundColor: '#ffde59'}]}>
                    {tx.categoryType === 'package' ? <Sparkles size={20} color="#1a1a1a" /> : <BookOpen size={20} color="#1a1a1a" />}
                  </View>
                  <View style={themeStyles.txInfo}>
                    <Text style={themeStyles.txTitle}>{tx.title}</Text>
                    <Text style={themeStyles.txSubtitle}>{tx.authorOrSubtitle}</Text>
                   <View style={themeStyles.tagRow}>
                      {/* Thẻ Loại với màu sắc tự động thay đổi */}
                      <View style={[
                        themeStyles.tagBase, 
                        { 
                          backgroundColor: 
                            tx.type === 'rent' ? '#a29bfe' :     // Tím nhạt cho Thuê sách
                            tx.type === 'return' ? '#ff7675' :   // Đỏ cam cho Trả sách
                            '#ffde59'                            // Vàng cho Mua gói (purchase)
                        }
                      ]}>
                        <Text style={themeStyles.tagTextBase}>Loại: {tx.typeLabel}</Text>
                      </View>
                      
                      {/* Thẻ Trạng thái giữ nguyên màu xanh lá */}
                      <View style={[themeStyles.tagBase, {backgroundColor: '#1dd1a1'}]}>
                        <CheckCircle size={10} color="#1a1a1a" style={{marginRight: 4}} />
                        <Text style={themeStyles.tagTextBase}>Trạng thái: {tx.status}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={themeStyles.txFooter}>
                  <Text style={themeStyles.txTime}>{tx.time}</Text>
                  <View style={themeStyles.txActions}>
                    <TouchableOpacity style={themeStyles.actionBtnBase} activeOpacity={0.8} onPress={() => setSelectedDetailTx(tx)}>
                      <FileText size={14} color="#1a1a1a" /><Text style={themeStyles.actionBtnTextBase}>Chi tiết</Text>
                    </TouchableOpacity>
                    {tx.type === 'return' && (
                      <TouchableOpacity style={[themeStyles.actionBtnBase, {backgroundColor: '#ffde59'}]} activeOpacity={0.8} onPress={() => setRatingModal({ isOpen: true, title: tx.title, txId: tx.id })}>
                        <Star size={14} color="#1a1a1a" /><Text style={themeStyles.actionBtnTextBase}>Đánh giá</Text>
                      </TouchableOpacity>
                    )}
                    {tx.type === 'rent' && (
                      <TouchableOpacity style={themeStyles.actionBtnDark} activeOpacity={0.8} onPress={() => handleConfirmAction('Trả sách', tx.title)}>
                        <Text style={themeStyles.actionBtnTextDark}>Trả sách</Text>
                      </TouchableOpacity>
                    )}
                    {tx.type === 'purchase' && (
                      <TouchableOpacity style={themeStyles.actionBtnDark} activeOpacity={0.8} onPress={() => handleConfirmAction('Gia hạn', tx.title)}>
                        <Text style={themeStyles.actionBtnTextDark}>Gia hạn</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View style={themeStyles.txCodeRow}><Text style={themeStyles.txCodeText}>Mã đơn: {tx.code}</Text></View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Toasts & Modals */}
      {notification && <View style={themeStyles.toastContainer}><Text style={themeStyles.toastText}>{notification}</Text></View>}

      <Modal transparent visible={!!confirmModal} animationType="fade">
        <View style={themeStyles.modalOverlay}>
          <View style={themeStyles.modalBox}>
            <View style={themeStyles.modalHeaderRow}>
              <AlertCircle size={24} color="#1a1a1a" /><Text style={themeStyles.modalTitle}>{confirmModal?.title}</Text>
            </View>
            <Text style={themeStyles.modalMessage}>{confirmModal?.message}</Text>
            <View style={themeStyles.modalActionRow}>
              <TouchableOpacity style={themeStyles.btnCancel} activeOpacity={0.8} onPress={() => setConfirmModal(null)}><Text style={themeStyles.btnCancelText}>Hủy bỏ</Text></TouchableOpacity>
              <TouchableOpacity style={themeStyles.btnConfirm} activeOpacity={0.8} onPress={confirmModal?.action}><Text style={themeStyles.btnConfirmText}>Xác nhận</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={!!ratingModal} animationType="fade">
        <View style={themeStyles.modalOverlay}>
          <View style={themeStyles.modalBox}>
            <View style={themeStyles.modalHeaderRow}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}><Star size={24} color="#1a1a1a" /><Text style={themeStyles.modalTitle}>Đánh giá sách</Text></View>
              <TouchableOpacity onPress={() => setRatingModal(null)}><X size={24} color="#1a1a1a" /></TouchableOpacity>
            </View>
            <Text style={themeStyles.modalMessage}>Bạn đánh giá thế nào về cuốn <Text style={{fontWeight: '900', color: '#1a1a1a'}}>&quot;{ratingModal?.title}&quot;</Text>?</Text>
            <View style={themeStyles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRatingStars(star)} activeOpacity={0.8}>
                  <Star size={40} color={star <= ratingStars ? "#ffde59" : "#fff"} fill={star <= ratingStars ? "#ffde59" : "#fff"} strokeWidth={2} stroke="#1a1a1a" />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={themeStyles.textArea} placeholder="Chia sẻ cảm nhận của bạn..." placeholderTextColor="#888" multiline numberOfLines={3} value={ratingComment} onChangeText={setRatingComment} />
            <View style={themeStyles.modalActionRow}>
              <TouchableOpacity style={themeStyles.btnCancel} activeOpacity={0.8} onPress={() => setRatingModal(null)}><Text style={themeStyles.btnCancelText}>Hủy</Text></TouchableOpacity>
              <TouchableOpacity style={[themeStyles.btnConfirm, {backgroundColor: '#1dd1a1'}]} activeOpacity={0.8} onPress={() => {
                const title = ratingModal?.title; setRatingModal(null); setRatingComment(''); setRatingStars(5);
                showNotification(`⭐ Cảm ơn bạn đã đánh giá ${ratingStars} sao cho "${title}"!`);
              }}><Text style={[themeStyles.btnConfirmText, {color: '#1a1a1a'}]}>Gửi đánh giá</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={!!selectedDetailTx} animationType="slide">
        <View style={themeStyles.modalOverlay}>
          <View style={[themeStyles.modalBox, { maxHeight: '90%', padding: 0, overflow: 'hidden' }]}>
            <View style={themeStyles.detailHeader}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={themeStyles.summaryIconBox}><FileText size={18} color="#1a1a1a" /></View>
                <View><Text style={themeStyles.summaryTitle}>CHI TIẾT GIAO DỊCH</Text><Text style={themeStyles.detailCode}>Mã đơn: {selectedDetailTx?.code}</Text></View>
              </View>
              <TouchableOpacity onPress={() => setSelectedDetailTx(null)}><X size={24} color="#1a1a1a" /></TouchableOpacity>
            </View>
            <ScrollView style={themeStyles.detailBody} showsVerticalScrollIndicator={false}>
              <View style={themeStyles.detailGrid}>
                <View style={{width: '100%'}}><Text style={themeStyles.detailLabel}>Tên sách / Dịch vụ:</Text><Text style={themeStyles.detailValueLg}>{selectedDetailTx?.title}</Text><Text style={themeStyles.detailValueSub}>{selectedDetailTx?.authorOrSubtitle}</Text></View>
                <View><Text style={themeStyles.detailLabel}><Clock size={14} color="#1a1a1a"/> Thời gian giao dịch:</Text><Text style={themeStyles.detailValue}>{selectedDetailTx?.time}</Text></View>
                <View><Text style={themeStyles.detailLabel}><Calendar size={14} color="#1a1a1a"/> Thời hạn:</Text><Text style={themeStyles.detailValue}>{selectedDetailTx?.period || 'Không áp dụng'}</Text></View>
                <View><Text style={themeStyles.detailLabel}><Coins size={14} color="#1a1a1a"/> Giá trị giao dịch:</Text><Text style={[themeStyles.detailValue, {fontWeight: '900', fontSize: 16}]}>{selectedDetailTx?.price}</Text></View>
                <View><Text style={themeStyles.detailLabel}><CreditCard size={14} color="#1a1a1a"/> Phương thức:</Text><Text style={themeStyles.detailValue}>{selectedDetailTx?.paymentMethod}</Text></View>
                {selectedDetailTx?.publisher && <View><Text style={themeStyles.detailLabel}><Bookmark size={14} color="#1a1a1a"/> Nhà xuất bản:</Text><Text style={themeStyles.detailValue}>{selectedDetailTx.publisher}</Text></View>}
                {selectedDetailTx?.branch && <View style={{width: '100%'}}><Text style={themeStyles.detailLabel}><MapPin size={14} color="#1a1a1a"/> Địa điểm:</Text><Text style={themeStyles.detailValue}>{selectedDetailTx.branch}</Text></View>}
                {selectedDetailTx?.deposit && <View style={{width: '100%'}}><Text style={themeStyles.detailLabel}><ShieldCheck size={14} color="#1a1a1a"/> Tiền đặt cọc:</Text><Text style={themeStyles.detailValue}>{selectedDetailTx.deposit}</Text></View>}
                {selectedDetailTx?.notes && <View style={themeStyles.detailNotesContainer}><Text style={themeStyles.detailLabel}>Ghi chú hệ thống:</Text><Text style={themeStyles.detailNotes}>{selectedDetailTx.notes}</Text></View>}
              </View>
              <View style={themeStyles.detailFooter}><Text style={themeStyles.detailSecure}><ShieldCheck size={16} color="#1a1a1a"/> Bảo mật bởi Halm SafePay</Text></View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  mainScroll: { flex: 1, backgroundColor: '#f4f4f4' },
  mainContent: { padding: 16, paddingBottom: 40 },
  summaryCard: { backgroundColor: '#fff', borderWidth: 3, borderColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 20, shadowColor: '#1a1a1a', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 4 },
  summaryTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  summaryIconBox: { width: 36, height: 36, backgroundColor: '#a29bfe', borderRadius: 10, borderWidth: 2, borderColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  summaryTitle: { fontSize: 16, fontWeight: '900', color: '#1a1a1a' },
  logoutAction: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#ffde59', borderWidth: 2, borderColor: '#1a1a1a', borderRadius: 10 },
  logoutActionText: { fontSize: 11, fontWeight: '800', color: '#1a1a1a' },
  summaryDesc: { fontSize: 13, color: '#444', marginBottom: 16, fontWeight: '600' },
  filterSection: { marginBottom: 16 }, 
  inputWrapper: { position: 'relative', justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 14, zIndex: 1 },
  textInput: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1a1a', borderRadius: 12, paddingVertical: 10, paddingLeft: 40, paddingRight: 12, fontSize: 14, color: '#1a1a1a', fontWeight: '600', shadowColor: '#1a1a1a', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, elevation: 2 },
  
  filterChipScroll: { marginVertical: 8 }, 
  filterChipContent: { paddingBottom: 6, paddingRight: 8, paddingTop: 2 }, // Đệm thêm không gian để bóng đổ không bị cắt
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 20, marginRight: 10, borderWidth: 2, borderColor: '#1a1a1a', shadowColor: '#1a1a1a', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, elevation: 2 },
  filterChipActive: { backgroundColor: '#1dd1a1', transform: [{translateY: 2}, {translateX: 2}], shadowOffset: { width: 0, height: 0 } },
  filterChipText: { fontSize: 13, color: '#1a1a1a', fontWeight: '700' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, borderTopWidth: 2, borderTopColor: '#1a1a1a', paddingTop: 16 },
  statBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#a29bfe', borderWidth: 2, borderColor: '#1a1a1a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  dotBlack: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1a1a1a', marginRight: 6 },
  statLabel: { fontSize: 13, fontWeight: '900', color: '#1a1a1a' },
  statMiniCard: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1a1a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statText: { fontSize: 13, color: '#1a1a1a', fontWeight: '700' },
  textHighlight: { color: '#1a1a1a', fontWeight: '900', fontSize: 14 },
  totalSpentBadge: { backgroundColor: '#ffde59', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 2, borderColor: '#1a1a1a', shadowColor: '#1a1a1a', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, elevation: 2 },
  totalSpentText: { fontSize: 13, fontWeight: '900', color: '#1a1a1a' },
  listContainer: { gap: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#fff', borderWidth: 3, borderColor: '#1a1a1a', borderStyle: 'dashed', borderRadius: 16 },
  emptyStateText: { fontSize: 14, color: '#1a1a1a', fontWeight: '700' },
  txCard: { backgroundColor: '#fff', borderWidth: 3, borderColor: '#1a1a1a', borderRadius: 16, padding: 16, shadowColor: '#1a1a1a', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 4 },
  txHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  txAvatar: { width: 54, height: 64, borderRadius: 12, borderWidth: 2, borderColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', marginRight: 12, shadowColor: '#1a1a1a', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, elevation: 2 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 16, fontWeight: '900', color: '#1a1a1a', marginBottom: 4 },
  txSubtitle: { fontSize: 13, color: '#444', marginBottom: 8, fontWeight: '600' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagBase: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e5e5e5', borderWidth: 2, borderColor: '#1a1a1a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagTextBase: { fontSize: 11, color: '#1a1a1a', fontWeight: '800' },
  txFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 2, borderTopColor: '#1a1a1a' },
  txTime: { fontSize: 12, color: '#666', fontWeight: '700' },
  txActions: { flexDirection: 'row', gap: 8 },
  actionBtnBase: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1a1a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, shadowColor: '#1a1a1a', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, elevation: 2 },
  actionBtnTextBase: { fontSize: 12, fontWeight: '800', color: '#1a1a1a', marginLeft: 6 },
  actionBtnDark: { backgroundColor: '#1a1a1a', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, justifyContent: 'center', shadowColor: '#1a1a1a', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, elevation: 2 },
  actionBtnTextDark: { fontSize: 12, fontWeight: '800', color: '#fff' },
  txCodeRow: { marginTop: 16, paddingTop: 12, borderTopWidth: 2, borderTopColor: '#1a1a1a', borderStyle: 'dashed' },
  txCodeText: { fontSize: 11, color: '#444', fontWeight: '700' },
  toastContainer: { position: 'absolute', bottom: 24, right: 16, backgroundColor: '#1dd1a1', borderWidth: 2, borderColor: '#1a1a1a', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, zIndex: 100, shadowColor: '#1a1a1a', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 4 },
  toastText: { color: '#1a1a1a', fontSize: 14, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalBox: { width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 20, padding: 24, borderWidth: 3, borderColor: '#1a1a1a', shadowColor: '#1a1a1a', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, elevation: 6 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1a1a1a', marginLeft: 10 },
  modalMessage: { fontSize: 14, color: '#444', marginBottom: 24, lineHeight: 22, fontWeight: '600' },
  modalActionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  btnCancel: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1a1a', borderRadius: 12, shadowColor: '#1a1a1a', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1 },
  btnCancelText: { fontSize: 13, fontWeight: '800', color: '#1a1a1a' },
  btnConfirm: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#1a1a1a', borderWidth: 2, borderColor: '#1a1a1a', borderRadius: 12, shadowColor: '#1a1a1a', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1 },
  btnConfirmText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 },
  textArea: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1a1a', borderRadius: 12, padding: 16, height: 100, fontSize: 14, color: '#1a1a1a', fontWeight: '600', textAlignVertical: 'top', marginBottom: 24, shadowColor: '#1a1a1a', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#1a1a1a', padding: 20, backgroundColor: '#ffde59' },
  detailCode: { fontSize: 12, color: '#444', marginTop: 4, fontWeight: '700' },
  detailBody: { padding: 20 },
  detailGrid: { gap: 16 },
  detailLabel: { fontSize: 12, color: '#444', fontWeight: '800', marginBottom: 4 },
  detailValueLg: { fontSize: 16, fontWeight: '900', color: '#1a1a1a' },
  detailValueSub: { fontSize: 13, color: '#666', marginTop: 2, fontWeight: '600' },
  detailValue: { fontSize: 14, color: '#1a1a1a', fontWeight: '700', paddingLeft: 20 },
  detailNotesContainer: { borderTopWidth: 2, borderTopColor: '#1a1a1a', paddingTop: 16, marginTop: 8 },
  detailNotes: { fontSize: 13, color: '#1a1a1a', fontWeight: '600', backgroundColor: '#f4f4f4', padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#1a1a1a', marginTop: 8 },
  detailFooter: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, paddingTop: 16, borderTopWidth: 2, borderTopColor: '#1a1a1a', borderStyle: 'dashed' },
  detailSecure: { fontSize: 13, color: '#1a1a1a', fontWeight: '800' }
});