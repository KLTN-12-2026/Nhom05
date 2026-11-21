export default function OfferTermsFields({ form, onChange, plans }) {
  const change = values => onChange({ ...form, ...values });
  return <div className="grid grid-cols-2 gap-3 text-xs">
    <label>Kỳ hạn áp dụng<select required value={form.planKey || '7'} onChange={e => change({ planKey: e.target.value })} className="w-full rounded-xl border p-2 bg-white text-slate-900">{plans.map(p => <option key={p.key} value={p.key}>{p.label}{p.active ? '' : ' (đang tắt)'}</option>)}</select></label>
    <label>Trạng thái<select value={form.status || 'ACTIVE'} onChange={e => change({ status: e.target.value })} className="w-full rounded-xl border p-2 bg-white text-slate-900"><option value="ACTIVE">Đang mở</option><option value="INACTIVE">Tạm tắt</option></select></label>
    <label>Bắt đầu (giờ Việt Nam)<input type="datetime-local" value={(form.start_date || '').slice(0, 16)} onChange={e => change({ start_date: e.target.value })} className="w-full rounded-xl border p-2 bg-white text-slate-900" /></label>
    <label>Kết thúc (giờ Việt Nam)<input type="datetime-local" value={(form.end_date || '').slice(0, 16)} onChange={e => change({ end_date: e.target.value })} className="w-full rounded-xl border p-2 bg-white text-slate-900" /></label>
    <label>Thứ tự<input type="number" min={0} max={10000} step={1} value={form.orderIndex || 0} onChange={e => change({ orderIndex: Number(e.target.value) })} className="w-full rounded-xl border p-2 bg-white text-slate-900" /></label>
    <p className="col-span-2 text-slate-500">Giá gốc và % giảm được tính lại theo biểu giá server sau khi lưu. Combo/deal được giảm theo hạng, không cộng thêm voucher.</p>
  </div>;
}
