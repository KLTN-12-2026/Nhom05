import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppNavigation, useAppThemeStyles } from './navigation';

// Mock data cho Giỏ hàng
const MOCK_CART = [
  { id: '1', title: 'Thiên Đạo Đồ Thư Quán', author: 'Hoành Tảo Thiên Nhai', price: 150 },
  { id: '2', title: 'Toàn Cầu Băng Phong: Ta Chế Tạo Phòng An Toàn', author: 'Tác giả A', price: 120 },
  { id: '3', title: 'Cao Võ Tiến Hóa', author: 'Tác giả B', price: 90 },
  { id: '4', title: 'Đấu Phá Thương Khung', author: 'Thiên Tàm Thổ Đậu', price: 200 },
];

export default function GioHang() {
  const themeStyles = useAppThemeStyles(styles);
  const { navigate, goBack, isDarkMode } = useAppNavigation();
  const [cartItems, setCartItems] = useState(
    MOCK_CART.map(item => ({ ...item, checked: false }))
  );

  const toggleCheck = (id: string) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const selectedCount = cartItems.filter(item => item.checked).length;
  const isAllSelected = selectedCount === cartItems.length && cartItems.length > 0;
  const totalPrice = cartItems.filter(item => item.checked).reduce((sum, item) => sum + item.price, 0);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setCartItems(prev => prev.map(item => ({ ...item, checked: false })));
    } else {
      setCartItems(prev => prev.map(item => ({ ...item, checked: true })));
    }
  };

  return (
    <View style={themeStyles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header giống các trang khác */}
      <View style={themeStyles.header}>
        <TouchableOpacity style={themeStyles.headerBackBtn} onPress={goBack}>
          <Ionicons name="chevron-back" size={28} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={themeStyles.headerTitle}>Giỏ Hàng Của Tôi</Text>
        <TouchableOpacity style={themeStyles.headerIcon}>
          <Ionicons name="trash-outline" size={24} color="#e74c3c" />
        </TouchableOpacity>
      </View>

      <ScrollView style={themeStyles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={themeStyles.cartList}>
          {cartItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[themeStyles.cartCard, item.checked && themeStyles.cartCardActive]} 
              activeOpacity={0.8}
              onPress={() => toggleCheck(item.id)}
            >
              {/* Checkbox */}
              <Ionicons 
                name={item.checked ? "checkbox" : "square-outline"} 
                size={26} 
                color={item.checked ? "#2c3a7a" : "#ccc"} 
                style={themeStyles.checkboxIcon}
              />
              
              {/* Ảnh bìa */}
              <View style={themeStyles.cartCover}>
                <Text style={themeStyles.mockCoverText}>Ảnh</Text>
              </View>
              
              {/* Thông tin */}
              <View style={themeStyles.cartInfo}>
                <Text style={themeStyles.cartTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={themeStyles.cartAuthor}>{item.author}</Text>
                <View style={themeStyles.priceRow}>
                  <Text style={themeStyles.cartPrice}>{item.price} 🥔</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 150 }} /> {/* Padding dưới để không bị che bởi thanh thanh toán */}
      </ScrollView>

      {/* Thanh Thanh Toán (Chỉ hiện khi có ít nhất 1 sách được chọn) */}
      {selectedCount > 0 && (
        <View style={themeStyles.checkoutBar}>
          
          <View style={themeStyles.checkoutTopRow}>
            <TouchableOpacity onPress={toggleSelectAll} style={themeStyles.selectAllBtn}>
              <Ionicons 
                name={isAllSelected ? "checkbox" : "square-outline"} 
                size={22} 
                color={isAllSelected ? "#2c3a7a" : "#888"} 
              />
              <Text style={themeStyles.selectAllText}>Tất cả</Text>
            </TouchableOpacity>
            
            <View style={themeStyles.priceContainer}>
              <Text style={themeStyles.totalLabel}>Tổng tiền ({selectedCount} mục):</Text>
              <Text style={themeStyles.totalPrice}>{totalPrice} 🥔</Text>
            </View>
          </View>

          <View style={themeStyles.checkoutActionRow}>
            {/* Đọc thử chỉ hiện khi chọn đúng 1 sách */}
            {selectedCount === 1 && (
              <TouchableOpacity style={themeStyles.trialBtn} onPress={() => navigate('reader')}>
                <Ionicons name="book-outline" size={18} color="#2c3a7a" style={{ marginRight: 6 }} />
                <Text style={themeStyles.trialBtnText}>Đọc thử</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={themeStyles.rentBtn} onPress={() => navigate('payment')}>
              <Ionicons name="cart-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
              <Text style={themeStyles.rentBtnText}>Thuê sách ngay</Text>
            </TouchableOpacity>
          </View>
          
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 15 : 55,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  headerBackBtn: { paddingHorizontal: 15 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#1a1a1a', textAlign: 'center', marginRight: 15 },
  headerIcon: { position: 'absolute', right: 20, bottom: 15 },

  scrollContainer: { flex: 1 },
  cartList: { padding: 15 },

  // Cart Item Card
  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
    borderWidth: 1, borderColor: '#f1f2f6'
  },
  cartCardActive: {
    borderColor: '#a9cce3',
    backgroundColor: '#f9fcff'
  },
  checkboxIcon: { marginRight: 12 },
  cartCover: {
    width: 65, height: 90,
    backgroundColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 15
  },
  mockCoverText: { fontSize: 12, color: '#888', fontWeight: '800' },
  cartInfo: { flex: 1, justifyContent: 'center' },
  cartTitle: { fontSize: 16, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  cartAuthor: { fontSize: 13, color: '#888', marginBottom: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  cartPrice: { fontSize: 16, fontWeight: '900', color: '#f39c12' },

  // Checkout Bar (Thanh thanh toán phía dưới)
  checkoutBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 15,
  },
  checkoutTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: { fontSize: 15, fontWeight: '700', color: '#555', marginLeft: 8 },
  priceContainer: { alignItems: 'flex-end' },
  totalLabel: { fontSize: 13, color: '#888', marginBottom: 2 },
  totalPrice: { fontSize: 20, fontWeight: '900', color: '#e74c3c' },

  checkoutActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trialBtn: {
    flex: 0.45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f4fd',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1, borderColor: '#a9cce3',
    marginRight: 10,
  },
  trialBtnText: { color: '#2c3a7a', fontSize: 15, fontWeight: '800' },
  rentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f39c12',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#f39c12', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5,
  },
  rentBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
