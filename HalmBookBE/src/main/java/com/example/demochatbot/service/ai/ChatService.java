
package com.example.demochatbot.service.ai;

import com.example.demochatbot.dto.ChatRequest;
import com.example.demochatbot.repository.BookRepository;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ChatClient chatClient;
    private final BookRepository bookRepository;
    private final ChatMemory chatMemory;

    public ChatService(
            ChatClient.Builder builder,
            BookRepository bookRepository,
            ChatMemory chatMemory) {

        this.chatClient = builder.build();
        this.bookRepository = bookRepository;
        this.chatMemory = chatMemory;
    }

    @Tool(description = "Sử dụng hàm này khi người dùng hỏi về thông tin sách, tìm kiếm sách hoặc kiểm tra xem sách có tồn tại trong cửa hàng hay không.")
    public String searchBooksInDatabase(String keyword) {
        try {
            var books = bookRepository
                    .findByBookNameContainingIgnoreCase(keyword);

            if (books.isEmpty()) {
                return "Không tìm thấy sách nào khớp với từ khóa: "
                        + keyword;
            }

            return books.stream()
                    .map(b -> {
                        String author = b.getAuthor() != null
                                ? b.getAuthor()
                                : "Đang cập nhật";

                        Double price = b.getRent_price() != null
                                ? b.getRent_price()
                                : 0.0;

                        return String.format(
                                "- %s (Tác giả: %s, Giá: %.0f VNĐ)",
                                b.getBookName(),
                                author,
                                price
                        );
                    })
                    .collect(Collectors.joining("\n"));

        } catch (Exception e) {
            e.printStackTrace();
            return "Đã xảy ra lỗi khi tìm kiếm sách trong hệ thống.";
        }
    }

    public String chat(ChatRequest chatRequest, String accountId) {

        if (accountId == null || accountId.isBlank()) {
            throw new IllegalArgumentException(
                    "accountId không được để trống"
            );
        }

        try {
            return chatClient.prompt()
                    .system("""
                            .system(""\"
                           Bạn là HALM.AI.
                           Sử dụng tiếng Việt, giọng điệu nghiêm túc, ngắn gọn và tập trung vào câu hỏi.
                           Tuyệt đối không sử dụng định dạng Markdown (như các dấu *, **, #).
                           Chỉ trình bày bằng văn bản trơn (plain text).
                           Sử dụng ký tự xuống dòng để phân chia các ý rõ ràng.
                           "\"")
                           """)
                    .user(chatRequest.message())
                    .advisors(
                            MessageChatMemoryAdvisor.builder(chatMemory)
                                    .build()
                    )
                    .advisors(advisorSpec -> advisorSpec.param(
                            ChatMemory.CONVERSATION_ID,
                            accountId
                    ))
                    .tools(this)
                    .call()
                    .content();
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                return "Xin lỗi, hệ thống AI đang bị quá tải do giới hạn gói miễn phí (chỉ 5 câu/phút). Vui lòng đợi khoảng 30 giây rồi hỏi lại nhé.";
            }
            e.printStackTrace();
            return "Hệ thống AI đang bảo trì hoặc gặp sự cố nội bộ. Vui lòng thử lại sau.";
        }
    }
}
