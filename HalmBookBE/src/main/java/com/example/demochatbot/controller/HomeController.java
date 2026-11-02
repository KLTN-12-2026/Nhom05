package com.example.demochatbot.controller;

import com.example.demochatbot.dto.BookBasicDto;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.dto.BookDto;
import com.example.demochatbot.dto.AddToCartRequest;
import com.example.demochatbot.dto.CartItemDto;
import com.example.demochatbot.service.customer.CustomerService;
import com.example.demochatbot.service.book.BookService;
import com.example.demochatbot.service.cart.CartService;
import com.example.demochatbot.service.evaluate.EvaluateService;
import com.example.demochatbot.service.order.OrderService;
import com.example.demochatbot.service.bookmark.BookmarkService;
import com.example.demochatbot.dto.ReadingNoteBookmarkDto;
import com.example.demochatbot.dto.ReadingNoteBookmarkRequest;
import com.example.demochatbot.dto.EvaluateDto;
import com.example.demochatbot.dto.EvaluateCreateRequest;
import com.example.demochatbot.dto.ChangePasswordRequest;
import com.example.demochatbot.dto.CheckoutRequest;
import com.example.demochatbot.dto.CheckoutResponse;
import com.example.demochatbot.dto.RentedBookDto;
import com.example.demochatbot.model.Book;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;


@RestController
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*")
@RequestMapping("/api/home")
public class HomeController {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private BookService bookService;

    @Autowired
    private CartService cartService;

    @Autowired
    private EvaluateService evaluateService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private BookmarkService bookmarkService;

    /**
     * API lấy danh sách sách (Đầy đủ)
     */
    @GetMapping("/books")
    public ResponseEntity<Page<BookDto>> getBooks(
            @RequestParam(value = "pageNumber", required = false) Integer pageNumber,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize,
            @RequestParam(value = "size", required = false) Integer size,
            @PageableDefault(page = 0, size = 20) Pageable pageable) {
        int resolvedPage = pageNumber != null ? pageNumber : (page != null ? page : pageable.getPageNumber());
        int resolvedSize = pageSize != null ? pageSize : (size != null ? size : pageable.getPageSize());
        Pageable resolvedPageable = PageRequest.of(Math.max(0, resolvedPage), Math.max(1, resolvedSize), pageable.getSort());
        Page<BookDto> books = bookService.findAllBook(resolvedPageable)
                .map(BookDto::fromEntity);
        return ResponseEntity.ok(books);
    }

    /**
     * API lấy danh sách thông tin cơ bản của sách (Metadata, không bao gồm link file PDF)
     */
    @GetMapping("/books/basic")
    public ResponseEntity<Page<BookBasicDto>> getBasicBooks(
            @RequestParam(value = "pageNumber", required = false) Integer pageNumber,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize,
            @RequestParam(value = "size", required = false) Integer size,
            @PageableDefault(page = 0, size = 20) Pageable pageable) {
        int resolvedPage = pageNumber != null ? pageNumber : (page != null ? page : pageable.getPageNumber());
        int resolvedSize = pageSize != null ? pageSize : (size != null ? size : pageable.getPageSize());
        Pageable resolvedPageable = PageRequest.of(Math.max(0, resolvedPage), Math.max(1, resolvedSize), pageable.getSort());
        Page<BookBasicDto> basicBooks = bookService.findAllBasicBooks(resolvedPageable);
        return ResponseEntity.ok(basicBooks);
    }

    /**
     * API lấy chi tiết đầy đủ của 1 cuốn sách
     */
    @GetMapping("/books/{bookId}")
    public ResponseEntity<?> getBookDetail(@PathVariable("bookId") String bookId) {
        BookDto book = bookService.findBookDetailById(bookId);
        if (book == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy thông tin cuốn sách với mã: " + bookId);
        }
        return ResponseEntity.ok(book);
    }

    /**
     * API lấy thông tin cơ bản của 1 cuốn sách (Metadata, không kèm link file PDF)
     */
    @GetMapping("/books/{bookId}/basic")
    public ResponseEntity<?> getBookBasicDetail(@PathVariable("bookId") String bookId) {
        BookBasicDto book = bookService.findBookBasicById(bookId);
        if (book == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy cuốn sách với mã: " + bookId));
        }
        return ResponseEntity.ok(book);
    }

    /**
     * API lấy đường dẫn xem/đọc nội dung sách từ Cloudinary (Signed URL có thời hạn bảo mật)
     */
    @GetMapping("/books/{bookId}/read-url")
    public ResponseEntity<?> getBookReadUrl(@PathVariable("bookId") String bookId) {
        try {
            String readUrl = bookService.getBookReadUrl(bookId);
            BookDto bookDto = bookService.findBookDetailById(bookId);
            String format = bookDto != null && bookDto.getFileFormat() != null ? bookDto.getFileFormat() : "PDF";
            return ResponseEntity.ok(Map.of(
                    "book_id", bookId,
                    "readUrl", readUrl,
                    "fileFormat", format,
                    "expiresInSeconds", 3600,
                    "message", "Lấy URL đọc sách thành công!"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * API tải luồng nội dung trực tiếp (PDF / EPUB) để đọc trong giao diện đọc sách
     * Luôn cấu hình Content-Disposition: inline để trình duyệt không kích hoạt tải file về máy
     */
    @GetMapping("/books/{bookId}/content")
    public ResponseEntity<?> getBookContent(@PathVariable("bookId") String bookId) {
        try {
            Book book = bookService.findBookById(bookId);
            if (book == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy cuốn sách với mã: " + bookId));
            }

            String format = book.getFileFormat() != null ? book.getFileFormat().toUpperCase() : "PDF";
            if (book.getPdf_url() != null && book.getPdf_url().toLowerCase().contains(".epub")) {
                format = "EPUB";
            }

            String mediaType = "EPUB".equalsIgnoreCase(format) ? "application/epub+zip" : "application/pdf";
            String fileExt = "EPUB".equalsIgnoreCase(format) ? ".epub" : ".pdf";
            String safeBookName = book.getBookName() != null
                    ? book.getBookName().replaceAll("[^a-zA-Z0-9.-]", "_")
                    : "book";
            String fileName = safeBookName + fileExt;

            String publicId = book.getPdfPublicId();
            // 1. Kiểm tra nếu file lưu ở cục bộ (uploads/)
            if (publicId != null && publicId.startsWith("local:")) {
                String relativePath = publicId.substring("local:".length());
                Path filePath = Paths.get("uploads").resolve(relativePath);
                if (Files.exists(filePath)) {
                    Resource resource = new UrlResource(filePath.toUri());
                    return ResponseEntity.ok()
                            .contentType(MediaType.parseMediaType(mediaType))
                            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                            .body(resource);
                }
            }

            // 2. Nếu file lưu trên Cloudinary
            String targetUrl = bookService.getBookReadUrl(bookId);
            if (targetUrl == null || targetUrl.trim().isEmpty()) {
                targetUrl = book.getPdf_url();
            }

            if (targetUrl != null && !targetUrl.trim().isEmpty()) {
                java.net.URL url = java.net.URI.create(targetUrl).toURL();
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(60000);

                int status = conn.getResponseCode();
                if (status >= 200 && status < 300) {
                    byte[] data = conn.getInputStream().readAllBytes();
                    conn.disconnect();
                    return ResponseEntity.ok()
                            .contentType(MediaType.parseMediaType(mediaType))
                            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                            .body(data);
                }
                conn.disconnect();
            }

            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Nội dung sách không khả dụng hoặc file chưa được tải lên."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi nạp file nội dung sách: " + e.getMessage()));
        }
    }

    @GetMapping("/customer/info")
    public ResponseEntity<?> getCustomerInfo() {
        try {
            int accountId = customerService.    getCurrentAccountId();
            Customer customer = customerService.findCustomerById(accountId);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy thông tin khách hàng!");
            }
            return new ResponseEntity<>(customer, HttpStatus.OK);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @PutMapping("/customer/edit")
    public ResponseEntity<?> editCustomer(@RequestBody Customer customerDetails) {
        try {
            int accountId = customerService.getCurrentAccountId();
            Customer customer = customerService.editCustomer(accountId, customerDetails);
            System.out.println("Chỉnh sửa thông tin thành công: " + customer.getCustomerName());
            return new ResponseEntity<>(customer, HttpStatus.OK);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/customer/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        try {
            int accountId = customerService.getCurrentAccountId();
            if (accountId <= 0) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(java.util.Map.of("message", "Vui lòng đăng nhập để đổi mật khẩu!"));
            }

            if (request.getOldPassword() == null || request.getOldPassword().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("message", "Vui lòng nhập mật khẩu hiện tại!"));
            }

            if (request.getNewPassword() == null || request.getNewPassword().trim().length() < 6) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("message", "Mật khẩu mới phải có ít nhất 6 ký tự!"));
            }

            if (request.getConfirmPassword() != null && !request.getNewPassword().equals(request.getConfirmPassword())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("message", "Mật khẩu xác nhận không khớp!"));
            }

            customerService.changePassword(accountId, request.getOldPassword(), request.getNewPassword());
            return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Đổi mật khẩu thành công!"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(java.util.Map.of("success", false, "message", "Lỗi xử lý đổi mật khẩu: " + e.getMessage()));
        }
    }

    @PostMapping("/cart/add")
    public ResponseEntity<?> addToCart(@RequestBody AddToCartRequest request) {
        try {
            cartService.addToCart(request);
            int count = cartService.getCartItemCount();
            return ResponseEntity.ok(Map.of(
                    "message", "Thêm sách vào giỏ hàng thành công!",
                    "cartCount", count
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/cart/items")
    public ResponseEntity<?> getCartItems() {
        try {
            List<CartItemDto> items = cartService.getCartItems();
            return ResponseEntity.ok(items);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/cart/count")
    public ResponseEntity<?> getCartCount() {
        try {
            int count = cartService.getCartItemCount();
            return ResponseEntity.ok(Map.of("cartCount", count));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("cartCount", 0));
        }
    }

    @DeleteMapping("/cart/items/{cartItemId}")
    public ResponseEntity<?> removeFromCart(@PathVariable("cartItemId") int cartItemId) {
        try {
            cartService.removeFromCart(cartItemId);
            int count = cartService.getCartItemCount();
            return ResponseEntity.ok(Map.of(
                    "message", "Đã xóa sách khỏi giỏ hàng!",
                    "cartCount", count
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * API lấy danh sách cảm nhận / đánh giá của 1 cuốn sách
     */
    @GetMapping("/books/{bookId}/evaluates")
    public ResponseEntity<List<EvaluateDto>> getBookEvaluates(@PathVariable("bookId") String bookId) {
        List<EvaluateDto> evaluates = evaluateService.getEvaluatesByBookId(bookId);
        return ResponseEntity.ok(evaluates);
    }

    /**
     * API gửi đánh giá sách mới (kèm số sao 1-5 và nội dung cảm nhận)
     * Thưởng +5 Khoai cho người đọc khi đánh giá thành công
     */
    @PostMapping("/books/{bookId}/evaluates")
    public ResponseEntity<?> createBookEvaluate(
            @PathVariable("bookId") String bookId,
            @RequestBody EvaluateCreateRequest request) {
        try {
            if (request == null) {
                request = new EvaluateCreateRequest();
            }
            request.setBookId(bookId);

            Integer accountId = null;
            try {
                accountId = customerService.getCurrentAccountId();
            } catch (Exception ignored) {
                // Cho phép khách vãng lai gửi đánh giá ẩn danh
            }

            EvaluateDto created = evaluateService.createEvaluate(request, accountId);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi gửi đánh giá: " + e.getMessage()));
        }
    }

    /**
     * API thích (like) 1 đánh giá
     */
    @PostMapping("/evaluates/{evaluateId}/like")
    public ResponseEntity<?> likeEvaluate(@PathVariable("evaluateId") int evaluateId) {
        try {
            int likes = evaluateService.likeEvaluate(evaluateId);
            return ResponseEntity.ok(Map.of("likesCount", likes));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * API thực hiện thanh toán thuê sách bằng Khoai Tây
     */
    @PostMapping("/checkout")
    public ResponseEntity<?> checkoutWithPotato(@RequestBody CheckoutRequest request) {
        try {
            int accountId = customerService.getCurrentAccountId();
            if (accountId <= 0) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Vui lòng đăng nhập để thực hiện thanh toán thuê sách!"));
            }

            CheckoutResponse response = orderService.checkoutWithPotato(accountId, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi xử lý thanh toán: " + e.getMessage()));
        }
    }

    /**
     * API lấy danh sách các cuốn sách đang sở hữu/thuê trong Tủ Sách Cá Nhân
     */
    @GetMapping("/bookshelf")
    public ResponseEntity<?> getCustomerBookshelf() {
        try {
            int accountId = customerService.getCurrentAccountId();
            if (accountId <= 0) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Vui lòng đăng nhập để xem Tủ Sách Cá Nhân!"));
            }

            List<RentedBookDto> bookshelf = orderService.getCustomerBookshelf(accountId);
            return ResponseEntity.ok(bookshelf);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi tải tủ sách: " + e.getMessage()));
        }
    }

    /**
     * API kiểm tra quyền đọc toàn bộ của 1 cuốn sách
     */
    @GetMapping("/bookshelf/check/{bookId}")
    public ResponseEntity<?> checkBookAccess(@PathVariable("bookId") String bookId) {
        try {
            int accountId = customerService.getCurrentAccountId();
            if (accountId <= 0) {
                return ResponseEntity.ok(Map.of("hasAccess", false));
            }
            boolean hasAccess = orderService.checkBookAccess(accountId, bookId);
            return ResponseEntity.ok(Map.of("hasAccess", hasAccess));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("hasAccess", false));
        }
    }

    /**
     * API lay danh sach ghi chu & bookmark cua cuon sach
     */
    @GetMapping("/books/{bookId}/bookmarks")
    public ResponseEntity<?> getBookBookmarks(@PathVariable("bookId") String bookId) {
        try {
            int accountId = customerService.getCurrentAccountId();
            if (accountId <= 0) {
                return ResponseEntity.ok(List.of());
            }
            List<ReadingNoteBookmarkDto> bookmarks = bookmarkService.getBookmarksByBook(accountId, bookId);
            return ResponseEntity.ok(bookmarks);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * API luu ghi chu / bookmark moi cho cuon sach
     */
    @PostMapping("/books/{bookId}/bookmarks")
    public ResponseEntity<?> createBookBookmark(
            @PathVariable("bookId") String bookId,
            @RequestBody ReadingNoteBookmarkRequest request) {
        try {
            int accountId = customerService.getCurrentAccountId();
            if (accountId <= 0) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Vui long dang nhap de luu ghi chu!"));
            }
            if (request == null) {
                request = new ReadingNoteBookmarkRequest();
            }
            request.setBookId(bookId);
            ReadingNoteBookmarkDto created = bookmarkService.createBookmark(accountId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Loi khi luu ghi chu: " + e.getMessage()));
        }
    }

    /**
     * API xoa ghi chu / bookmark
     */
    @DeleteMapping("/books/bookmarks/{noteId}")
    public ResponseEntity<?> deleteBookBookmark(@PathVariable("noteId") int noteId) {
        try {
            int accountId = customerService.getCurrentAccountId();
            if (accountId <= 0) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Vui long dang nhap!"));
            }
            boolean deleted = bookmarkService.deleteBookmark(accountId, noteId);
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "Da xoa ghi chu thanh cong!"));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Khong tim thay ghi chu can xoa!"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Loi khi xoa ghi chu: " + e.getMessage()));
        }
    }
}