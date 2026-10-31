package com.example.demochatbot.controller;

import com.example.demochatbot.model.Customer;
import com.example.demochatbot.dto.BookDto;
import com.example.demochatbot.dto.AddToCartRequest;
import com.example.demochatbot.dto.CartItemDto;
import com.example.demochatbot.service.customer.CustomerService;
import com.example.demochatbot.service.book.BookService;
import com.example.demochatbot.service.cart.CartService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.io.File;
import java.nio.file.Files;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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

    @GetMapping("/covers/{fileName}")
    public ResponseEntity<byte[]> getBookCover(@PathVariable("fileName") String fileName) {
        try {
            File file = new File("E:/Khoa_Luan/Nhom05/HalmBookBE/src/main/resources/static/covers/" + fileName);
            if (!file.exists()) {
                file = new File("E:/Khoa_Luan/BOOK/img/" + fileName);
            }
            if (file.exists()) {
                byte[] bytes = Files.readAllBytes(file.toPath());
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_JPEG_VALUE)
                        .header(HttpHeaders.CACHE_CONTROL, "max-age=86400")
                        .body(bytes);
            }
        } catch (Exception ignored) {
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/books/{bookId}")
    public ResponseEntity<?> getBookDetail(@PathVariable("bookId") String bookId) {
        BookDto book = bookService.findBookDetailById(bookId);
        if (book == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy thông tin cuốn sách với mã: " + bookId);
        }
        return ResponseEntity.ok(book);
    }

    @GetMapping("/customer/info")
    public ResponseEntity<?> getCustomerInfo() {
        try {
            int accountId = customerService.getCurrentAccountId();
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
