package com.example.demochatbot.controller;

import com.example.demochatbot.dto.BookBasicDto;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.dto.BookDto;
import com.example.demochatbot.dto.AddToCartRequest;
import com.example.demochatbot.dto.CartItemDto;
import com.example.demochatbot.service.customer.CustomerService;
import com.example.demochatbot.service.book.BookService;
import com.example.demochatbot.service.cart.CartService;
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
}
