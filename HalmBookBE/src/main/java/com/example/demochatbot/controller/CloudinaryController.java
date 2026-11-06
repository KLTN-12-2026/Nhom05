package com.example.demochatbot.controller;

import com.example.demochatbot.dto.BookCreateRequest;
import com.example.demochatbot.dto.BookDto;
import com.example.demochatbot.dto.BookUpdateRequest;
import com.example.demochatbot.dto.CloudinaryResultDto;
import com.example.demochatbot.model.Book;
import com.example.demochatbot.model.Category;
import com.example.demochatbot.repository.CategoryRepository;
import com.example.demochatbot.service.book.BookService;
import com.example.demochatbot.service.data.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*")
@RequestMapping("/api/admin/books")
@RequiredArgsConstructor
public class CloudinaryController {

    private final CloudinaryService cloudinaryService;
    private final BookService bookService;
    private final CategoryRepository categoryRepository;

    private boolean isValidDocumentFile(MultipartFile file) {
        if (file == null || file.isEmpty()) return true;
        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        boolean isPdf = "application/pdf".equalsIgnoreCase(contentType) || originalFilename.endsWith(".pdf");
        boolean isEpub = "application/epub+zip".equalsIgnoreCase(contentType)
                || "application/epub".equalsIgnoreCase(contentType)
                || "application/x-zip-compressed".equalsIgnoreCase(contentType)
                || originalFilename.endsWith(".epub");
        return isPdf || isEpub;
    }

    /**
     * API 1: Tạo sách mới trọn gói kèm upload file ảnh bìa & file PDF/EPUB cùng lúc
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createBook(
            @ModelAttribute BookCreateRequest request,
            @RequestParam(value = "image", required = false) MultipartFile imageFile,
            @RequestParam(value = "pdf", required = false) MultipartFile pdfFile
    ) {
        try {
            if (request.getBookName() == null || request.getBookName().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Tên sách không được để trống!"));
            }

            // Validate định dạng ảnh nếu có gửi
            if (imageFile != null && !imageFile.isEmpty()) {
                String imgType = imageFile.getContentType();
                if (imgType == null || !imgType.startsWith("image/")) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("message", "Lỗi: File ảnh bìa phải là định dạng hình ảnh!"));
                }
            }

            // Validate định dạng tài liệu nếu có gửi (Hỗ trợ cả PDF và EPUB)
            if (pdfFile != null && !pdfFile.isEmpty()) {
                if (!isValidDocumentFile(pdfFile)) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("message", "Lỗi: File nội dung sách phải là định dạng PDF hoặc EPUB!"));
                }
            }

            Book savedBook = bookService.createBook(request, imageFile, pdfFile);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Thêm sách mới và đồng bộ Cloudinary thành công!",
                    "book", BookDto.fromEntity(savedBook)
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi trong quá trình tạo sách: " + e.getMessage()));
        }
    }

    /**
     * API 2: Chỉnh sửa thông tin sách và cập nhật file mới (nếu có) - Multipart form data
     */
    @PutMapping(value = "/{bookId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateBook(
            @PathVariable String bookId,
            @ModelAttribute BookUpdateRequest request,
            @RequestParam(value = "image", required = false) MultipartFile imageFile,
            @RequestParam(value = "pdf", required = false) MultipartFile pdfFile
    ) {
        try {
            if (request.getBookName() != null && request.getBookName().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Tên sách không được để trống!"));
            }

            // Validate định dạng ảnh nếu có gửi
            if (imageFile != null && !imageFile.isEmpty()) {
                String imgType = imageFile.getContentType();
                if (imgType == null || !imgType.startsWith("image/")) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("message", "Lỗi: File ảnh bìa phải là định dạng hình ảnh!"));
                }
            }

            // Validate định dạng tài liệu nếu có gửi (Hỗ trợ cả PDF và EPUB)
            if (pdfFile != null && !pdfFile.isEmpty()) {
                if (!isValidDocumentFile(pdfFile)) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("message", "Lỗi: File nội dung sách phải là định dạng PDF hoặc EPUB!"));
                }
            }

            Book updatedBook = bookService.updateBook(bookId, request, imageFile, pdfFile);
            return ResponseEntity.ok(Map.of(
                    "message", "Cập nhật sách thành công!",
                    "book", BookDto.fromEntity(updatedBook)
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi trong quá trình cập nhật sách: " + e.getMessage()));
        }
    }

    /**
     * API 3: Chỉnh sửa thông tin sách qua JSON (không đính kèm file)
     */
    @PutMapping(value = "/{bookId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateBookJson(
            @PathVariable String bookId,
            @RequestBody BookUpdateRequest request
    ) {
        try {
            Book updatedBook = bookService.updateBook(bookId, request, null, null);
            return ResponseEntity.ok(Map.of(
                    "message", "Cập nhật thông tin sách thành công!",
                    "book", BookDto.fromEntity(updatedBook)
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi trong quá trình cập nhật sách: " + e.getMessage()));
        }
    }

    /**
     * API 4: Lấy thông tin chi tiết một cuốn sách theo ID cho Admin
     */
    @GetMapping("/{bookId}")
    public ResponseEntity<?> getBookById(@PathVariable String bookId) {
        Book book = bookService.findBookById(bookId);
        if (book == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy cuốn sách với mã: " + bookId));
        }
        return ResponseEntity.ok(BookDto.fromEntity(book));
    }

    /**
     * API 5: Lấy danh mục thể loại sách
     */
    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        List<Category> list = categoryRepository.findAll();
        if (list.isEmpty()) {
            // Tự động khởi tạo các thể loại tiêu chuẩn nếu bảng đang trống
            String[] defaultCats = {
                "Phát triển bản thân",
                "Kinh tế & Kinh doanh",
                "Công nghệ & AI",
                "Tiểu thuyết kinh điển",
                "Văn học",
                "Tâm lý & Kỹ năng sống",
                "Thiếu nhi",
                "Lịch sử & Triết học"
            };
            for (String catName : defaultCats) {
                Category c = new Category();
                c.setCategory_name(catName);
                categoryRepository.save(c);
            }
            list = categoryRepository.findAll();
        }
        return ResponseEntity.ok(list.stream().map(c -> Map.of(
                "category_id", c.getCategory_id(),
                "category_name", c.getCategory_name()
        )).toList());
    }

    /**
     * API 6: Upload cập nhật file riêng lẻ (Ảnh hoặc PDF) cho cuốn sách đã có
     */
    @PostMapping("/{bookId}/upload")
    public ResponseEntity<?> uploadFile(
            @PathVariable String bookId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("isPdf") boolean isPdf
    ) {
        if (file.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Tệp tải lên không được để trống!"));
        }
        String contentType = file.getContentType();
        if (isPdf && !isValidDocumentFile(file)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Lỗi: Yêu cầu định dạng PDF hoặc EPUB nhưng nhận được: " + contentType));
        } else if (!isPdf && (contentType == null || !contentType.startsWith("image/"))) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Lỗi: Yêu cầu định dạng hình ảnh nhưng nhận được: " + contentType));
        }

        try {
            CloudinaryResultDto uploadResult = cloudinaryService.uploadFile(file, isPdf);

            Boolean isSaved = bookService.saveCloudinaryInfo(bookId, uploadResult, file);
            if (isSaved) {
                return ResponseEntity.status(HttpStatus.OK).body(Map.of(
                        "message", "Upload và đồng bộ dữ liệu Cloudinary thành công!",
                        "secureUrl", uploadResult.getSecureUrl(),
                        "publicId", uploadResult.getPublicId()
                ));
            } else {
                cloudinaryService.deleteFile(uploadResult.getPublicId(), isPdf);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Thất bại: Không tìm thấy sách với mã ID " + bookId));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi hệ thống trong quá trình upload: " + e.getMessage()));
        }
    }

    /**
     * API 7: Xóa sách và tự động xóa tài nguyên trên Cloudinary
     */
    @DeleteMapping("/{bookId}")
    public ResponseEntity<?> deleteBook(@PathVariable String bookId) {
        try {
            Boolean deleted = bookService.deleteBook(bookId);
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "Đã xóa sách và dọn dẹp file Cloudinary thành công!"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy cuốn sách với mã: " + bookId));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi xóa sách: " + e.getMessage()));
        }
    }

    /**
     * API 8: Lấy danh sách tất cả sách quản lý cho Admin (Phân trang)
     */
    @GetMapping
    public ResponseEntity<Page<BookDto>> getAdminBooks(
            @RequestParam(value = "pageNumber", required = false) Integer pageNumber,
            @RequestParam(value = "pageSize", required = false) Integer pageSize,
            @PageableDefault(page = 0, size = 20) Pageable pageable
    ) {
        int page = pageNumber != null ? pageNumber : pageable.getPageNumber();
        int size = pageSize != null ? pageSize : pageable.getPageSize();
        Pageable resolvedPageable = PageRequest.of(Math.max(0, page), Math.max(1, size), pageable.getSort());
        Page<BookDto> books = bookService.findAllBook(resolvedPageable).map(BookDto::fromEntity);
        return ResponseEntity.ok(books);
    }
}
