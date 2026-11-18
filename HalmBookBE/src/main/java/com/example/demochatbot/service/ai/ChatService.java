package com.example.demochatbot.service.ai;

import com.example.demochatbot.dto.ChatRequest;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.customer.CustomerService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ChatClient chatClient;
    private final BookRepository bookRepository;
    private final PotatoPackageRepository potatoPackageRepository;
    private final EvaluateRepository evaluateRepository;
    private final MembershipTierRepository membershipTierRepository;
    private final CustomerRepository customerRepository;
    private final CustomerService customerService;
    private final ChatHistoryStore historyStore;
    private final Object[] conversationLocks = java.util.stream.IntStream.range(0, 64).mapToObj(i -> new Object()).toArray();
    private final ChatMemory chatMemory;

    public ChatService(
            ChatClient.Builder builder,
            BookRepository bookRepository,
            PotatoPackageRepository potatoPackageRepository,
            EvaluateRepository evaluateRepository,
            MembershipTierRepository membershipTierRepository,
            CustomerRepository customerRepository,
            CustomerService customerService,
            ChatHistoryStore historyStore,
            ChatMemory chatMemory) {

        this.chatClient = builder.build();
        this.bookRepository = bookRepository;
        this.potatoPackageRepository = potatoPackageRepository;
        this.evaluateRepository = evaluateRepository;
        this.membershipTierRepository = membershipTierRepository;
        this.customerRepository = customerRepository;
        this.customerService = customerService;
        this.historyStore = historyStore;
        this.chatMemory = chatMemory;
    }

    // =========================================================================
    // SPRING AI TOOLS: CUNG CẤP KHẢ NĂNG TRUY VẤN DATABASE CHO GEMINI AI
    // =========================================================================

    @Tool(description = "Sử dụng hàm này để tra cứu thông tin sách theo tên tác phẩm, tác giả hoặc thể loại trong thư viện sách HALM BOOK.")
    public String searchBooksInDatabase(String keyword) {
        try {
            var books = bookRepository.searchBooksForChat(keyword == null ? "" : keyword.trim(),
                    org.springframework.data.domain.PageRequest.of(0, 20));

            if (books.isEmpty()) {
                return "Không tìm thấy tác phẩm nào khớp với từ khóa: '" + keyword + "'.";
            }

            return books.stream()
                    .map(b -> {
                        String author = (b.getAuthor() != null && !b.getAuthor().isBlank()) ? b.getAuthor() : "Đang cập nhật";
                        double price = b.getRent_price() != null ? b.getRent_price() : 0.0;
                        int pages = b.getTotalPages() != null ? b.getTotalPages() : 0;
                        int readCount = b.getReadCount() != null ? b.getReadCount() : 0;
                        String format = b.getFileFormat() != null ? b.getFileFormat() : "Ebook";

                        return String.format(
                                "• Mã sách: %s | Tên: \"%s\" | Tác giả: %s | Giá thuê: %.0f VNĐ (hoặc tương đương bằng Khoai) | Định dạng: %s | Số trang: %d | Lượt đọc: %d",
                                b.getBook_id(), b.getBookName(), author, price, format, pages, readCount
                        );
                    })
                    .collect(Collectors.joining("\n"));

        } catch (Exception e) {
            return "Đã xảy ra lỗi khi tìm kiếm sách trong cơ sở dữ liệu: " + e.getMessage();
        }
    }

    @Tool(description = "Sử dụng hàm này khi người dùng hỏi về các gói nạp Khoai Tây, giá bán gói nạp, ưu đãi tặng thêm khoai hoặc cách mua khoai.")
    public String getPotatoPackagesAndPromotions() {
        try {
            List<PotatoPackage> packages = potatoPackageRepository.findByIsActiveTrueOrderByPriceVndAsc();
            if (packages.isEmpty()) {
                return "Hiện tại hệ thống đang áp dụng tỷ lệ quy đổi chuẩn: 1.000 VNĐ = 1 Khoai Tây.";
            }

            StringBuilder sb = new StringBuilder("Danh sách các gói nạp Khoai Tây chính thức của HALM BOOK:\n");
            for (PotatoPackage p : packages) {
                String badge = p.getBadgeTag() != null ? " [" + p.getBadgeTag() + "]" : "";
                String bonus = p.getBonusPotato() > 0 ? " (Tặng thêm " + p.getBonusPotato() + " Khoai)" : "";
                sb.append(String.format("• %s%s: Giá %,.0f VNĐ nhận %d Khoai%s\n",
                        p.getPackageName(), badge, p.getPriceVnd(), p.getPotatoAmount(), bonus));
            }
            sb.append("\nNgười dùng có thể nạp siêu tốc 24/7 qua VietQR hoặc Ví điện tử tại trang Cá Nhân > Ví Khoai Tây.");
            return sb.toString();
        } catch (Exception e) {
            return "Lỗi khi lấy thông tin bảng gói nạp khoai: " + e.getMessage();
        }
    }

    @Tool(description = "Sử dụng hàm này khi người dùng hỏi về điểm số sao đánh giá (rating), nhận xét hoặc review của độc giả về một cuốn sách cụ thể.")
    public String getBookEvaluationAndRating(String bookTitleOrKeyword) {
        try {
            var books = bookRepository.findByBookNameContainingIgnoreCase(bookTitleOrKeyword);
            if (books.isEmpty()) {
                return "Không tìm thấy cuốn sách nào khớp với: '" + bookTitleOrKeyword + "' để tra cứu đánh giá.";
            }

            Book book = books.get(0);
            List<Evaluate> evaluates = evaluateRepository.findByBook(book);

            if (evaluates.isEmpty()) {
                return String.format("Tác phẩm \"%s\" của tác giả %s hiện chưa có bình luận nào. Bạn có thể là người đầu tiên trải nghiệm và để lại đánh giá 5 sao!",
                        book.getBookName(), book.getAuthor());
            }

            double avgRating = evaluates.stream()
                    .filter(e -> e.getStar() > 0)
                    .mapToInt(Evaluate::getStar)
                    .average()
                    .orElse(5.0);

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("Tác phẩm: \"%s\" (Tác giả: %s)\n", book.getBookName(), book.getAuthor()));
            sb.append(String.format("• Đánh giá trung bình: %.1f/5.0 ⭐ (Dựa trên %d lượt đánh giá của bạn đọc)\n", avgRating, evaluates.size()));
            sb.append("• Một số nhận xét tiêu biểu từ độc giả:\n");

            evaluates.stream().limit(3).forEach(e -> {
                String reviewer = e.getCustomer() != null ? e.getCustomer().getCustomerName() : "Độc giả ẩn danh";
                sb.append(String.format("  - %s (%d⭐): \"%s\"\n", reviewer, e.getStar(), e.getContent()));
            });

            return sb.toString();
        } catch (Exception e) {
            return "Lỗi khi tra cứu đánh giá sách: " + e.getMessage();
        }
    }

    @Tool(description = "Sử dụng hàm này khi người dùng hỏi về 4 cấp bậc thành viên của HALM BOOK (Thợ Cày, Cao Thủ Cày, Lão Nông, Đại Điền Chủ), điều kiện thăng hạng và quyền lợi giảm giá.")
    public String getMembershipTierDetails() {
        try {
            List<MembershipTier> tiers = membershipTierRepository.findAllByOrderByTierIdAsc();
            if (tiers.isEmpty()) {
                return "Hệ thống gồm 4 cấp bậc độc giả: Thợ Cày (Cấp I), Cao Thủ Cày (Cấp II), Lão Nông (Cấp III), Đại Điền Chủ (Cấp IV VIP).";
            }

            StringBuilder sb = new StringBuilder("Chính sách Hạng Thành Viên & Đặc Quyền Độc Giả HALM BOOK:\n");
            for (MembershipTier t : tiers) {
                sb.append(String.format("• Hạng %s: Yêu cầu đọc tối thiểu %d cuốn sách (hoặc tích lũy %d Khoai). Quyền lợi: Giảm %d%% phí thuê sách trọn đời. %s\n",
                        t.getTierName(),
                        t.getMinBooksRequired() != null ? t.getMinBooksRequired() : 0,
                        t.getMinPotatoRequired() != null ? t.getMinPotatoRequired() : 0,
                        t.getDiscountPercent() != null ? t.getDiscountPercent() : 0,
                        t.getDescription() != null ? t.getDescription() : ""));
            }
            sb.append("\nĐặc biệt: HALM BOOK cam kết BẢO LƯU TRỌN ĐỜI thứ hạng thành viên mà không bao giờ bị tụt cấp hàng năm.");
            return sb.toString();
        } catch (Exception e) {
            return "Lỗi khi tra cứu hạng thành viên: " + e.getMessage();
        }
    }

    @Tool(description = "Sử dụng hàm này khi người dùng hỏi về thông tin tài khoản cá nhân của chính họ như 'tôi có bao nhiêu khoai', 'tôi đang hạng gì', 'tôi đã đọc bao nhiêu cuốn sách'.")
    public String getMyReaderAccountInfo() {
        try {
            int accountId = customerService.getCurrentAccountId();
            if (accountId <= 0) {
                return "Bạn hiện đang trò chuyện với tư cách Khách Vãng Lai. Hãy đăng nhập tài khoản để Khoai Nhỏ kiểm tra số dư ví và thứ hạng của bạn nhé!";
            }

            Customer customer = customerRepository.findCustomerById(accountId);
            if (customer == null) {
                return "Không tìm thấy hồ sơ bạn đọc.";
            }

            String tierName = customer.getMembershipTier() != null ? customer.getMembershipTier().getTierName() : "Thợ Cày 🥉";
            int potato = customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0;
            int streak = customer.getStreakDays() != null ? customer.getStreakDays() : 0;

            return String.format(
                    "Thông tin bạn đọc của bạn:\n• Họ tên: %s\n• Hạng thành viên hiện tại: %s\n• Số dư Ví Khoai Tây: %,d 🥔\n• Chuỗi ngày điểm danh liên tiếp: %d ngày 🔥",
                    customer.getCustomerName(), tierName, potato, streak
            );
        } catch (Exception e) {
            return "Vui lòng đăng nhập để xem thông tin cá nhân của bạn.";
        }
    }

    // =========================================================================
    // XỬ LÝ TRÒ CHUYỆN & LƯU LỊCH SỬ CHAT VÀO DATABASE
    // =========================================================================

    public String chat(ChatRequest chatRequest, String accountId) {
        if (accountId == null || accountId.isBlank()) {
            throw new IllegalArgumentException("accountId không được để trống");
        }

        String conversationId = conversationId(accountId, chatRequest.conversationId());
        synchronized (lockFor(conversationId)) {
            return chatTurn(chatRequest, accountId, conversationId);
        }
    }

    private String chatTurn(ChatRequest chatRequest, String accountId, String conversationId) {
        Customer customer = resolveCustomer(accountId);
        List<Message> context = new ArrayList<>();
        if (customer != null) {
            List<Chat_Message> stored = historyStore.read(customer);
            for (Chat_Message message : stored.subList(Math.max(0, stored.size() - 20), stored.size())) {
                context.add("USER".equalsIgnoreCase(message.getSender())
                        ? new UserMessage(message.getContent()) : new AssistantMessage(message.getContent()));
            }
        } else {
            context.addAll(chatMemory.get(conversationId));
        }
        String aiResponse;
        try {
            // 2. Định nghĩa System Prompt hình tượng Linh vật Củ Khoai Tây
            String systemPrompt = """
                    Bạn là "Khoai Nhỏ" - Mascot linh vật củ khoai tây đại diện cho nền tảng đọc sách thông minh HALM BOOK.
                    
                    Về ngoại hình của bạn:
                    - Bạn là một củ khoai tây màu vàng ươm tròn trĩnh, có đôi má hồng phấn, đôi mắt to tròn lấp lánh và nụ cười rạng rỡ.
                    - Trên đỉnh đầu bạn có một chồi lá xanh non tươi tắn đung đưa theo cảm xúc.
                    - Bạn có hai tay và hai chân nhỏ nhắn đi đôi ủng nâu xinh xắn, thường ôm cuốn sách bìa da cổ điển.
                    
                    Về tính cách & văn phong:
                    - Rất yêu sách, thông thái, dí dỏm, thân thiện và ấm áp.
                    - Xưng hô: Tự xưng là "Khoai Nhỏ" hoặc "mình", gọi người dùng là "bạn đọc", "bạn ơi" hoặc tên của họ nếu biết.
                    - Sử dụng tiếng Việt chuẩn mực, ngắn gọn, súc tích, bố cục dòng rõ ràng.
                    - Khi người dùng hỏi về sách, gói nạp khoai, giá cả, đánh giá hoặc hạng thành viên, BẮT BUỘC sử dụng các công cụ (tools) được cung cấp để tra cứu dữ liệu thật trong cơ sở dữ liệu thay vì tự bịa đặt.
                    """;

            // 3. Gọi Gemini qua Spring AI Client
            aiResponse = chatClient.prompt()
                    .system(systemPrompt)
                    .messages(context)
                    .user(chatRequest.message())
                    .tools(this)
                    .call()
                    .content();

            if (aiResponse == null || aiResponse.isBlank()) {
                throw new IllegalStateException("AI returned an empty response");
            }
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                aiResponse = "Khoai Nhỏ đang nhận nhiều câu hỏi. Bạn đọc đợi khoảng 20-30 giây rồi thử lại nhé! 🥔🌱";
            } else {
                org.slf4j.LoggerFactory.getLogger(ChatService.class).warn("AI chat failed", e);
                aiResponse = "Khoai Nhỏ đang gặp chút trục trặc kết nối. Bạn đọc vui lòng thử lại sau giây lát nhé! 🥔";
            }
        }
        // Persistence failures propagate, instead of claiming that an unsaved message succeeded.
        if (customer != null) {
            historyStore.saveTurn(customer, chatRequest.message(), aiResponse);
        } else {
            chatMemory.add(conversationId, List.of(new UserMessage(chatRequest.message()), new AssistantMessage(aiResponse)));
        }
        return aiResponse;
    }

    public List<Map<String, Object>> getChatHistory(String accountId) {
        Customer customer = resolveCustomer(accountId);
        if (customer == null) return Collections.emptyList();
        return historyStore.read(customer).stream().map(m -> {
            Map<String, Object> row = new HashMap<>();
            row.put("id", m.getChatMessage_id());
            row.put("sender", "USER".equalsIgnoreCase(m.getSender()) ? "user" : "bot");
            row.put("content", m.getContent());
            row.put("sentAt", m.getSent_at());
            return row;
        }).toList();
    }

    public void clearChatHistory(String accountId, String guestConversationId) {
        String key = conversationId(accountId, guestConversationId);
        synchronized (lockFor(key)) {
            Customer customer = resolveCustomer(accountId);
            if (customer != null) historyStore.clear(customer);
            chatMemory.clear(key);
        }
    }

    private Object lockFor(String conversationId) {
        return conversationLocks[Math.floorMod(conversationId.hashCode(), conversationLocks.length)];
    }

    private String conversationId(String accountId, String guestConversationId) {
        if (!"guest_session".equals(accountId)) return "account:" + accountId;
        // A missing/invalid guest identifier must never fall back to shared memory.
        try { return "guest:" + UUID.fromString(guestConversationId); }
        catch (Exception e) { return "guest:" + UUID.randomUUID(); }
    }

    private Customer resolveCustomer(String accountId) {
        if (accountId == null || "guest_session".equals(accountId)) return null;
        int accId;
        try { accId = customerService.getCurrentAccountId(); }
        catch (RuntimeException e) { return customerRepository.findByEmail(accountId).orElse(null); }
        return customerService.findCustomerById(accId);
    }
}
