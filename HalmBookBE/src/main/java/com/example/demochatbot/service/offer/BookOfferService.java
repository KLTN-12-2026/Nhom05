package com.example.demochatbot.service.offer;

import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.mission.MissionService;
import com.example.demochatbot.service.policy.CommercePolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor
public class BookOfferService {
    private final BookOfferRepository offers;
    private final BookRepository books;
    private final CommercePolicyService policies;
    @jakarta.persistence.PersistenceContext private jakarta.persistence.EntityManager em;
    public static LocalDateTime now() { return LocalDateTime.now(MissionService.ZONE); }
    public static boolean published(Book book) { return book != null && !Set.of("DRAFT", "HIDDEN", "DELETED").contains(Objects.toString(book.getStatus(), "PUBLISHED").toUpperCase(Locale.ROOT)); }
    public static boolean active(String status, LocalDateTime start, LocalDateTime end) {
        LocalDateTime now = now(); return "ACTIVE".equalsIgnoreCase(status) && (start == null || !start.isAfter(now)) && (end == null || end.isAfter(now));
    }
    public static LocalDateTime date(Object raw, boolean end) {
        if (raw == null || raw.toString().isBlank()) return null;
        try { String text = raw.toString(); return text.length() == 10 ? (end ? LocalDate.parse(text).plusDays(1).atStartOfDay().minusNanos(1) : LocalDate.parse(text).atStartOfDay()) : LocalDateTime.parse(text); }
        catch (Exception e) { throw bad("Ngày bắt đầu/kết thúc không hợp lệ (giờ Việt Nam)."); }
    }
    public static ResponseStatusException bad(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
    @Transactional
    public BookOffer locked(String id) {
        BookOffer offer = offers.findById(Objects.toString(id, "")).orElseThrow(() -> bad("Ưu đãi không tồn tại."));
        if (em != null) em.refresh(offer, jakarta.persistence.LockModeType.PESSIMISTIC_READ);
        if (!active(offer.getStatus(), offer.getStartDate(), offer.getEndDate())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Ưu đãi đã tắt hoặc chưa/không còn hiệu lực. Vui lòng tải lại giỏ hàng.");
        return offer;
    }
    @Transactional(readOnly = true)
    public List<Map<String, Object>> list(boolean admin, String kind) {
        var policy = policies.current(); List<Map<String, Object>> result = new ArrayList<>();
        for (BookOffer offer : offers.findAllByOrderByOrderIndexAscIdAsc()) {
            if ("DELETED".equals(offer.getStatus()) || (kind != null && !kind.equals(offer.getKind()))) continue;
            if (!admin && !active(offer.getStatus(), offer.getStartDate(), offer.getEndDate())) continue;
            List<Book> selected = offer.getBookIds().stream().map(id -> books.findById(id).orElse(null)).toList();
            if (!admin && selected.stream().anyMatch(b -> !published(b))) continue;
            boolean available = true; int original = 0;
            try { for (Book book : selected) original = Math.addExact(original, policies.price(policy, offer.getPlanKey(), book, !admin)); }
            catch (RuntimeException error) { available = false; }
            if (!admin && (!available || offer.getPriceKhoai() > original)) continue;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", offer.getId()); row.put("version", offer.getVersion()); row.put("kind", offer.getKind()); row.put("name", offer.getName());
            row.put("desc", offer.getDescription()); row.put("img", offer.getImageUrl()); row.put("potato", offer.getPriceKhoai()); row.put("originalPotato", original);
            row.put("discount", original > 0 ? "-" + Math.round((1.0 - (double) offer.getPriceKhoai() / original) * 100) + "%" : "0%");
            row.put("planKey", offer.getPlanKey()); row.put("status", offer.getStatus()); row.put("start_date", offer.getStartDate()); row.put("end_date", offer.getEndDate()); row.put("orderIndex", offer.getOrderIndex());
            row.put("bookIds", offer.getBookIds()); row.put("books", selected.stream().filter(Objects::nonNull).map(Book::getBookName).toList());
            row.put("bookDetails", selected.stream().filter(Objects::nonNull).map(BookOfferService::bookView).toList());
            row.put("author", selected.stream().filter(Objects::nonNull).map(Book::getAuthor).filter(Objects::nonNull).distinct().reduce((a, b) -> a + ", " + b).orElse(""));
            row.put("category", selected.stream().filter(Objects::nonNull).filter(b -> b.getCategory() != null).map(b -> b.getCategory().getCategory_name()).findFirst().orElse("Sách chọn lọc"));
            row.put("available", available); result.add(row);
        }
        return result;
    }
    public static Map<String, Object> bookView(Book b) {
        Map<String, Object> result = new LinkedHashMap<>(); result.put("book_id", b.getBook_id()); result.put("bookName", b.getBookName());
        result.put("author", b.getAuthor()); result.put("img_url", b.getImg_url()); result.put("rent_price", b.getRent_price());
        result.put("category_id", b.getCategory() == null ? null : b.getCategory().getCategory_id());
        result.put("category_name", b.getCategory() == null ? null : b.getCategory().getCategory_name()); return result;
    }
    @Transactional
    public Map<String, Object> save(String id, Map<String, Object> input) {
        BookOffer old = id == null ? null : offers.findById(id).orElseThrow(() -> bad("Không tìm thấy ưu đãi."));
        if (old != null && "DELETED".equals(old.getStatus())) throw bad("Ưu đãi đã xóa.");
        if (old != null && input.get("version") instanceof Number version && !Objects.equals(version.longValue(), old.getVersion())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Ưu đãi đã thay đổi. Hãy tải lại trước khi lưu.");
        String kind = Objects.toString(input.get("kind"), old == null ? "COMBO" : old.getKind());
        if (!Set.of("COMBO", "SINGLE").contains(kind) || (old != null && !old.getKind().equals(kind))) throw bad("Loại ưu đãi không hợp lệ.");
        if (!(input.get("bookIds") instanceof List<?> ids) || ids.stream().anyMatch(v -> !(v instanceof String s) || s.isBlank())) throw bad("Chọn sách bằng mã sách thật trong danh mục.");
        List<String> selected = ids.stream().map(Object::toString).map(String::trim).toList();
        if (selected.size() > 20 || selected.size() < ("COMBO".equals(kind) ? 2 : 1) || ("SINGLE".equals(kind) && selected.size() != 1) || new HashSet<>(selected).size() != selected.size()) throw bad("Combo cần 2–20 sách khác nhau; deal sách lẻ cần đúng một sách.");
        String name = Objects.toString(input.get("name"), "").trim(), description = Objects.toString(input.get("desc"), "").trim();
        String image = Objects.toString(input.get("img"), "").trim(), plan = Objects.toString(input.get("planKey"), "7").trim().toLowerCase(Locale.ROOT);
        String status = Objects.toString(input.get("status"), "ACTIVE").toUpperCase(Locale.ROOT);
        int price = integer(input.get("potato"), -1), order = integer(input.get("orderIndex"), 0);
        if (name.isEmpty() || name.length() > 150 || description.length() > 500 || image.length() > 2048 || (!image.isEmpty() && !(image.matches("https?://[^\\s]+") || image.startsWith("/") && !image.startsWith("//")))
            || price < 0 || price > 1000000 || order < 0 || order > 10000 || !Set.of("ACTIVE", "INACTIVE").contains(status)) throw bad("Tên, giá, ảnh hoặc trạng thái ưu đãi không hợp lệ.");
        LocalDateTime start = date(input.get("start_date"), false), end = date(input.get("end_date"), true);
        if (start != null && end != null && !end.isAfter(start)) throw bad("Ngày kết thúc phải sau ngày bắt đầu.");
        var policy = policies.current(); policies.plan(policy, plan, false); int original = 0;
        for (String bookId : selected) { Book book = books.findById(bookId).orElseThrow(() -> bad("Không tìm thấy sách " + bookId)); if (!published(book) && "ACTIVE".equals(status)) throw bad("Sách " + bookId + " chưa phát hành hoặc đang ẩn."); original = Math.addExact(original, policies.price(policy, plan, book, false)); }
        if ("ACTIVE".equals(status) && price > original) throw bad("Giá ưu đãi phải không vượt tổng giá gốc theo kỳ hạn đã chọn.");
        BookOffer offer = new BookOffer(); offer.setId(old == null ? "offer-" + UUID.randomUUID() : old.getId()); offer.setVersion(old == null ? null : old.getVersion());
        offer.setKind(kind); offer.setName(name); offer.setDescription(description); offer.setImageUrl(image); offer.setPriceKhoai(price); offer.setPlanKey(plan);
        offer.setStatus(status); offer.setStartDate(start); offer.setEndDate(end); offer.setOrderIndex(order); offer.setBookIds(new ArrayList<>(selected));
        BookOffer saved = offers.saveAndFlush(offer);
        return Map.of("id", saved.getId(), "message", "Đã lưu ưu đãi.");
    }
    public static int integer(Object value, int fallback) {
        if (value == null) return fallback;
        try { java.math.BigDecimal number = new java.math.BigDecimal(value.toString()); return number.intValueExact(); } catch (Exception error) { throw bad("Giá và số thứ tự phải là số nguyên hợp lệ."); }
    }
    @Transactional public void delete(String id) { BookOffer offer = offers.findById(id).orElseThrow(() -> bad("Không tìm thấy ưu đãi.")); offer.setStatus("DELETED"); offers.save(offer); }
}
