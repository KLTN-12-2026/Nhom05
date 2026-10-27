import React from "react";
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppNavigation, useAppThemeStyles } from './navigation';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;
type Offer = { id:string; title:string; description:string; price:string; oldPrice?:string; tag?:string; icon:IconName; color:string; action:string };

const member: Offer[] = [
  { id:"sv", title:"Gói Sinh Viên", description:"Dành riêng cho học sinh, sinh viên có thẻ HSSV hợp lệ.", price:"50 🥔 /tháng", tag:"PHÙ HỢP", icon:"star", color:"#9147DF", action:"Xác Thực Ngay" },
  { id:"p1", title:"Gói Premium 1 Tháng", description:"Đọc sách không giới hạn, nghe audio book không quảng cáo.", oldPrice:"150", price:"105 🥔", tag:"-30%", icon:"diamond-stone", color:"#9147DF", action:"Đổi Khoai Ngay" },
  { id:"p3", title:"Gói Premium 3 Tháng", description:"Tiết kiệm hơn với gói 3 tháng cùng mọi đặc quyền cao cấp.", oldPrice:"400", price:"240 🥔", tag:"-40%", icon:"diamond-stone", color:"#9147DF", action:"Đổi Khoai Ngay" },
  { id:"vip", title:"Gói VIP 1 Năm", description:"Tặng thêm huy hiệu VIP trên diễn đàn.", oldPrice:"1500", price:"750 🥔", tag:"-50%", icon:"diamond-stone", color:"#9147DF", action:"Đổi Khoai Ngay" },
];

const upload: Offer[] = [
  { id:"u1", title:"Free 3 Lần Upload Đầu", description:"Dành cho tài khoản mới. Tải tài liệu cá nhân để đọc bằng AI.", price:"0 🥔", tag:"NEW USER", icon:"file-pdf-box", color:"#25A8E0", action:"Sử Dụng Ngay" },
  { id:"u2", title:"Upload 2 lần/ngày", description:"Tải tài liệu lên hệ thống 2 lần mỗi ngày với chi phí thấp.", price:"10 🥔 /lần", tag:"HOT", icon:"percent", color:"#25A8E0", action:"Tìm Hiểu Thêm" },
  { id:"u3", title:"Gói Upload Không Giới Hạn", description:"Tự do lưu trữ thư viện cá nhân không giới hạn.", price:"30 🥔 /tháng", icon:"folder", color:"#25A8E0", action:"Nâng Cấp Gói" },
];

const combo: Offer[] = [
  { id:"c1", title:"Combo Kỹ Năng Sống", description:"Bộ 3 cuốn sách kỹ năng thực chiến.", oldPrice:"200", price:"120 🥔", icon:"brain", color:"#FFA31A", action:"Mua Combo" },
  { id:"c2", title:"Combo Trinh Thám", description:"Bộ 5 tiểu thuyết trinh thám bán chạy.", oldPrice:"350", price:"200 🥔", tag:"HOT", icon:"bookshelf", color:"#FFA31A", action:"Mua Combo" },
  { id:"c3", title:"Combo Ngôn Tình", description:"Tuyển tập 10 truyện ngôn tình hiện đại.", oldPrice:"450", price:"247 🥔", tag:"-45%", icon:"heart", color:"#FFA31A", action:"Mua Combo" },
];

const books: Offer[] = [
  { id:"b1", title:"Nhà Lãnh Đạo Không Chức Danh", description:"Ai cũng có thể lãnh đạo dù ở bất kỳ vị trí nào.", oldPrice:"50", price:"25 🥔", tag:"-50%", icon:"book-open-variant", color:"#EF4747", action:"Mua Sách" },
  { id:"b2", title:"Dune - Xứ Cát", description:"Kiệt tác khoa học viễn tưởng kinh điển.", oldPrice:"60", price:"48 🥔", tag:"-20%", icon:"book-open-variant", color:"#EF4747", action:"Mua Sách" },
  { id:"b3", title:"Atomic Habits", description:"Thay đổi thói quen nhỏ để tạo khác biệt lớn.", oldPrice:"75", price:"52 🥔", tag:"-30%", icon:"book-open-variant", color:"#EF4747", action:"Mua Sách" },
  { id:"b4", title:"Sapiens", description:"Lược sử loài người và nguồn gốc chúng ta.", oldPrice:"80", price:"68 🥔", tag:"-15%", icon:"book-open-variant", color:"#EF4747", action:"Mua Sách" },
];

function Card({ item }:{ item:Offer }) {
  const { navigate } = useAppNavigation();
  const s = useAppThemeStyles(baseStyles);

  return <View style={s.card}>
    {item.tag && <View style={s.tag}><Text style={s.tagText}>{item.tag}</Text></View>}
    <MaterialCommunityIcons name={item.icon} size={42} color={item.color}/>
    <Text style={s.cardTitle}>{item.title}</Text>
    <Text numberOfLines={3} style={s.desc}>{item.description}</Text>
    <View style={s.priceBox}>
      {item.oldPrice && <Text style={s.oldPrice}>{item.oldPrice}</Text>}
      <Text style={s.price}>{item.price}</Text>
    </View>
    <TouchableOpacity style={s.button} onPress={() => navigate(item.id === 'u1' ? 'upload' : 'payment')}>
      <Text style={s.buttonText}>{item.action}</Text>
    </TouchableOpacity>
  </View>;
}

function Section({ title, color, icon, data }:{ title:string; color:string; icon:IconName; data:Offer[] }) {
  const s = useAppThemeStyles(baseStyles);
  return <View style={s.section}>
    <View style={s.sectionHead}>
      <View style={[s.label,{backgroundColor:color}]}>
        <MaterialCommunityIcons name={icon} size={16}/><Text style={s.labelText}>{title}</Text>
      </View>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
      {data.map(x=><Card key={x.id} item={x}/>)}
    </ScrollView>
    <View style={s.dots}><View style={s.dotActive}/><View style={s.dot}/><View style={s.dot}/></View>
  </View>;
}

function Challenges() {
  const { navigate } = useAppNavigation();
  const s = useAppThemeStyles(baseStyles);
  const items = [
    { title:"Chiến Thần Tốc Độ", text:"Đọc hết 1 cuốn sách trong 3 ngày, nhận voucher giảm 5%.", value:"-5%", icon:"lightning-bolt" as IconName },
    { title:"Một Sách Chăm Chỉ", text:"Duy trì chuỗi đọc sách 7 ngày liên tiếp để nhận thưởng.", value:"+10 🥔", icon:"fire" as IconName },
  ];
  return <View style={s.section}>
    <View style={s.sectionHead}><View style={[s.label,{backgroundColor:"#FF777B"}]}><MaterialCommunityIcons name="medal" size={16} color="#fff"/><Text style={[s.labelText,{color:"#fff"}]}>Ưu Đãi Thử Thách Đọc Sách</Text></View></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
      {items.map(x=><View key={x.title} style={s.challenge}>
        <MaterialCommunityIcons name={x.icon} size={40} color="#FF595C"/><Text style={s.cardTitle}>{x.title}</Text><Text style={s.desc}>{x.text}</Text>
        <View style={s.priceBox}><Text style={s.price}>{x.value}</Text></View>
        <TouchableOpacity style={s.button} onPress={() => navigate('bookshelf')}><Text style={s.buttonText}>Tham Gia Ngay</Text></TouchableOpacity>
      </View>)}
    </ScrollView>
  </View>;
}

export default function OffersScreen() {
  const { navigate, isDarkMode } = useAppNavigation();
  const s = useAppThemeStyles(baseStyles);

  return <View style={s.safe}>
    <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'}/>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
      <View style={s.hero}>
        <View style={s.deal}><MaterialCommunityIcons name="lightning-bolt" size={15} color="#E88800"/><Text style={s.dealText}>Deal Hời - Chốt Ngay!</Text></View>
        <Text style={s.heroTitle}>Ngập Tràn Ưu Đãi</Text>
        <Text style={s.heroTitle}>Tiêu <Text style={{color:"#9147DF"}}>Khoai</Text> Thả Ga 🥔</Text>
        <Text style={s.heroSub}>Mở khóa vô vàn đặc quyền hấp dẫn chỉ dành riêng cho độc giả của HALM BOOK.</Text>
      </View>
      <Section title="Giảm Giá Gói Cước Đặc Quyền" color="#F58BD4" icon="crown" data={member}/>
      <Section title="Tiện Ích Upload Dữ Liệu" color="#BDE4FF" icon="cloud-upload" data={upload}/>
      <Section title="Combo Siêu Tiết Kiệm" color="#FFD065" icon="layers" data={combo}/>
      <Section title="Sách Lẻ Giảm Sâu" color="#38D8E7" icon="book" data={books}/>
      <Challenges/>
    </ScrollView>
  </View>;
}

const shadow = { shadowColor:"#171717", shadowOffset:{width:3,height:4}, shadowOpacity:1, shadowRadius:0, elevation:4 } as const;
const baseStyles=StyleSheet.create({
  safe:{flex:1,backgroundColor:"#FCFCFA"}, content:{paddingBottom:100},
  hero:{margin:14,padding:20,alignItems:"center",borderWidth:2,borderColor:"#171717",borderRadius:21,backgroundColor:"#fff",...shadow},deal:{flexDirection:"row",alignItems:"center",paddingHorizontal:15,paddingVertical:7,marginBottom:13,borderWidth:2,borderRadius:20,backgroundColor:"#FFE064"},dealText:{fontSize:12,fontWeight:"900"},heroTitle:{fontSize:26,lineHeight:33,fontWeight:"900",textAlign:"center"},heroSub:{marginTop:9,fontSize:12,lineHeight:18,color:"#5C606B",textAlign:"center"},
  section:{marginBottom:27},sectionHead:{marginHorizontal:14,marginBottom:13,flexDirection:"row",alignItems:"center"},label:{maxWidth:"92%",paddingHorizontal:10,paddingVertical:8,flexDirection:"row",alignItems:"center",gap:6,borderWidth:2,borderRadius:9,...shadow},labelText:{fontSize:12,fontWeight:"900"},row:{paddingHorizontal:14,paddingBottom:7,gap:13},
  card:{position:"relative",width:225,minHeight:258,padding:14,alignItems:"center",borderWidth:2,borderColor:"#171717",borderRadius:15,backgroundColor:"#fff",...shadow},tag:{position:"absolute",right:8,top:-10,zIndex:2,paddingHorizontal:10,paddingVertical:5,borderRadius:14,backgroundColor:"#9147DF"},tagText:{fontSize:9,fontWeight:"900",color:"#fff"},cardTitle:{marginTop:8,fontSize:14,fontWeight:"900",textAlign:"center"},desc:{minHeight:50,marginTop:7,fontSize:10.5,lineHeight:15,color:"#666A74",textAlign:"center"},priceBox:{width:"100%",height:38,marginTop:11,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,borderWidth:1,borderRadius:7,backgroundColor:"#F7F7FA"},oldPrice:{fontSize:10,color:"#999CA5",textDecorationLine:"line-through"},price:{fontSize:14,fontWeight:"900"},button:{width:"100%",height:38,marginTop:9,alignItems:"center",justifyContent:"center",borderRadius:7,backgroundColor:"#171717"},buttonText:{fontSize:11,fontWeight:"800",color:"#fff"},dots:{marginTop:10,flexDirection:"row",justifyContent:"center",gap:6},dot:{width:7,height:7,borderRadius:4,backgroundColor:"#D1D1D1"},dotActive:{width:18,height:7,borderRadius:4,backgroundColor:"#9147DF"},challenge:{width:290,minHeight:220,padding:15,alignItems:"center",borderWidth:2,borderRadius:15,backgroundColor:"#fff",...shadow},
  bottom:{position:"absolute",left:0,right:0,bottom:0,height:80,paddingBottom:7,flexDirection:"row",alignItems:"center",backgroundColor:"#fff",borderTopWidth:1,borderTopColor:"#ddd"},tab:{flex:1,alignItems:"center"},activeIcon:{width:43,height:34,borderRadius:18,alignItems:"center",justifyContent:"center",backgroundColor:"#F1E5FF"},tabText:{marginTop:3,fontSize:9.5,color:"#555966"},activeText:{color:"#9147DF",fontWeight:"900"},
});
