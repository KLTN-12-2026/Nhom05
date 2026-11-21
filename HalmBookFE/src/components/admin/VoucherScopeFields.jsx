export default function VoucherScopeFields({ form, onChange, books, categories }) {
  return <div className="grid grid-cols-2 gap-3 text-xs">
    <label>Sách áp dụng<select value={form.book_id || ''} onChange={e => onChange({ ...form, book_id: e.target.value, category_id: '' })} className="w-full rounded-xl border p-2 bg-white text-slate-900"><option value="">Tất cả sách / theo thể loại</option>{books.map(b => <option key={b.id} value={b.id}>[{b.id}] {b.title}</option>)}</select></label>
    <label>Thể loại áp dụng<select value={form.category_id || ''} onChange={e => onChange({ ...form, category_id: e.target.value, book_id: '' })} className="w-full rounded-xl border p-2 bg-white text-slate-900"><option value="">Tất cả thể loại</option>{categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}</select></label>
    <label>Bắt đầu (giờ Việt Nam)<input type="datetime-local" value={(form.start_date || '').slice(0, 16)} onChange={e => onChange({ ...form, start_date: e.target.value })} className="w-full rounded-xl border p-2 bg-white text-slate-900" /></label>
    <p className="col-span-2 text-slate-500">Chọn một kiểu giảm: phần trăm hoặc số Khoai. Voucher áp dụng sau giảm hạng, đúng sách/thể loại; không cộng vào combo/deal.</p>
  </div>;
}
