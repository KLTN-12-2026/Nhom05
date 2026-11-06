import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppNavigation, useAppThemeStyles } from './navigation';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

const PAYMENT_METHODS = [
  { id: 'qr', title: 'Quét QR CODE', subtitle: '', icon: 'qr-code-outline', color: '#2ecc71' },
  { id: 'atm', title: 'Thẻ ATM có Internet Banking', subtitle: 'Thẻ ngân hàng nội địa', icon: 'business-outline', color: '#7f8c8d' },
  { id: 'visa', title: 'Thẻ quốc tế Visa/Master/JCB', subtitle: '', icon: 'card-outline', color: '#3498db' },
  { id: 'ewallet', title: 'Ví điện tử', subtitle: '', icon: 'wallet-outline', color: '#9b59b6' },
];

export default function ThanhToan() {
  const themeStyles = useAppThemeStyles(styles);
  const [selectedMethod, setSelectedMethod] = useState('qr');
  const [promoCode, setPromoCode] = useState('');
  const { navigate, goBack, isDarkMode } = useAppNavigation();

  const getMethodName = () => {
    return PAYMENT_METHODS.find(m => m.id === selectedMethod)?.title || '';
  };

  return (
    <View style={themeStyles.container}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={themeStyles.header}>
        <TouchableOpacity style={themeStyles.headerBackBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={28} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={themeStyles.headerTitle}>Chọn hình thức thanh toán</Text>
          <Text style={themeStyles.headerSubtitle}>An toàn - Nhanh chóng - Bảo mật</Text>
        </View>
      </View>

      <ScrollView style={themeStyles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Chọn phương thức thanh toán */}
        <View style={themeStyles.section}>
          <Text style={themeStyles.sectionTitle}>Chọn phương thức thanh toán</Text>
          
          {PAYMENT_METHODS.map((method) => {
            const isSelected = selectedMethod === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                style={[themeStyles.methodCard, isSelected && themeStyles.methodCardActive]}
                activeOpacity={0.8}
                onPress={() => setSelectedMethod(method.id)}
              >
                <View style={themeStyles.methodIconBox}>
                  <Ionicons name={method.icon as any} size={24} color={method.color} />
                </View>
                
                <View style={themeStyles.methodInfo}>
                  <Text style={[themeStyles.methodTitle, isSelected && themeStyles.methodTitleActive]}>{method.title}</Text>
                  {method.subtitle ? <Text style={themeStyles.methodSubtitle}>{method.subtitle}</Text> : null}
                </View>

                {/* Radio Button */}
                <View style={[themeStyles.radioCircle, isSelected && themeStyles.radioCircleActive]}>
                  {isSelected && <View style={themeStyles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Thông tin thanh toán (Bill Summary) */}
        <View style={themeStyles.summaryContainer}>
          {/* Header màu vàng */}
          <View style={themeStyles.summaryHeader}>
            <Text style={themeStyles.summaryHeaderText}>Thông tin thanh toán</Text>
          </View>
          
          <View style={themeStyles.summaryBody}>
            <View style={themeStyles.summaryRow}>
              <Text style={themeStyles.summaryLabel}>Sản phẩm</Text>
              <View style={themeStyles.productBadge}>
                <Text style={themeStyles.productBadgeText}>Gói Khoai 20K 🥔</Text>
                <Ionicons name="chevron-down" size={14} color="#1a1a1a" style={{ marginLeft: 4 }} />
              </View>
            </View>
            
            <View style={themeStyles.dividerDashed} />

            <View style={themeStyles.summaryRow}>
              <Text style={themeStyles.summaryLabel}>Tạm tính</Text>
              <Text style={themeStyles.summaryValue}>20.000đ</Text>
            </View>

            <View style={themeStyles.summaryRow}>
              <Text style={themeStyles.summaryLabel}>Hình thức thanh toán</Text>
              <Text style={[themeStyles.summaryValue, { flex: 1, textAlign: 'right', marginLeft: 20 }]}>{getMethodName()}</Text>
            </View>

            <View style={themeStyles.summaryRow}>
              <Text style={themeStyles.summaryLabel}>Giảm giá</Text>
              <Text style={themeStyles.summaryValue}>0</Text>
            </View>

            {/* Khuyến mãi */}
            <View style={themeStyles.promoContainer}>
              <TextInput 
                style={themeStyles.promoInput} 
                placeholder="Nhập mã khuyến mại" 
                placeholderTextColor="#a4b0be"
                value={promoCode}
                onChangeText={setPromoCode}
              />
              <TouchableOpacity style={themeStyles.promoBtn}>
                <Text style={themeStyles.promoBtnText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>

            <View style={themeStyles.dividerSolid} />

            <View style={themeStyles.summaryRow}>
              <Text style={themeStyles.totalLabel}>TỔNG</Text>
              <Text style={themeStyles.totalValue}>20.000đ</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Nút THANH TOÁN dính dưới đáy */}
      <View style={themeStyles.bottomBar}>
        <TouchableOpacity style={themeStyles.payBtn} onPress={() => navigate('transactions')}>
          <Text style={themeStyles.payBtnText}>THANH TOÁN</Text>
        </TouchableOpacity>
      </View>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafa' },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 15 : 55,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerBackBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#1a1a1a',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 15,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1a1a1a' },
  headerSubtitle: { fontSize: 13, color: '#636e72', marginTop: 4, fontWeight: '500' },

  scrollContainer: { flex: 1 },
  
  section: { paddingHorizontal: 20, paddingBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1a1a1a', marginBottom: 15 },

  // Payment Method Card (Neo-brutalism style)
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1, borderColor: '#e1e8f0',
  },
  methodCardActive: {
    borderWidth: 2, borderColor: '#1a1a1a',
    shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  methodIconBox: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: '#f1f4f8',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 15,
  },
  methodInfo: { flex: 1 },
  methodTitle: { fontSize: 15, fontWeight: '700', color: '#2d3436' },
  methodTitleActive: { color: '#1a1a1a', fontWeight: '900' },
  methodSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  
  radioCircle: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: '#ccc',
    justifyContent: 'center', alignItems: 'center',
  },
  radioCircleActive: { borderColor: '#1a1a1a', borderWidth: 2 },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1a1a1a' },

  // Summary Card
  summaryContainer: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2, borderColor: '#1a1a1a',
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8,
    marginBottom: 30,
    overflow: 'hidden',
  },
  summaryHeader: {
    backgroundColor: '#ffde59',
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: '#1a1a1a',
  },
  summaryHeaderText: { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
  
  summaryBody: { padding: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  summaryLabel: { fontSize: 14, fontWeight: '600', color: '#636e72' },
  summaryValue: { fontSize: 14, fontWeight: '800', color: '#1a1a1a' },
  
  productBadge: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ccc',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  productBadgeText: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  
  dividerDashed: {
    height: 1, width: '100%',
    borderStyle: 'dashed', borderWidth: 1, borderColor: '#eee',
    marginVertical: 15,
  },
  dividerSolid: {
    height: 2, backgroundColor: '#1a1a1a',
    marginVertical: 20,
  },

  promoContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  promoInput: {
    flex: 1,
    borderWidth: 1, borderColor: '#ccc',
    borderTopLeftRadius: 8, borderBottomLeftRadius: 8,
    paddingHorizontal: 15, paddingVertical: 10,
    fontSize: 14, fontWeight: '500', color: '#1a1a1a',
  },
  promoBtn: {
    backgroundColor: '#f1f4f8',
    paddingHorizontal: 20,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#ccc', borderLeftWidth: 0,
    borderTopRightRadius: 8, borderBottomRightRadius: 8,
  },
  promoBtnText: { fontSize: 14, fontWeight: '700', color: '#636e72' },

  totalLabel: { fontSize: 18, fontWeight: '900', color: '#1a1a1a' },
  totalValue: { fontSize: 22, fontWeight: '900', color: '#3498db' }, // Màu xanh lam giống ảnh web

  // Bottom Sticky Bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 15, paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    borderTopWidth: 1, borderTopColor: '#eee',
  },
  payBtn: {
    backgroundColor: '#3498db', // Màu xanh lam chủ đạo
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2, borderColor: '#1a1a1a',
    shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  payBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
});
