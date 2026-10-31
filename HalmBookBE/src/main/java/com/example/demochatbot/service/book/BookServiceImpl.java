package com.example.demochatbot.service.book;

import com.example.demochatbot.dto.BookBasicDto;
import com.example.demochatbot.dto.BookCreateRequest;
import com.example.demochatbot.dto.BookDto;
import com.example.demochatbot.dto.BookUpdateRequest;
import com.example.demochatbot.dto.CloudinaryResultDto;
import com.example.demochatbot.model.Book;
import com.example.demochatbot.model.Category;
import com.example.demochatbot.repository.BookRepository;
import com.example.demochatbot.repository.CategoryRepository;
import com.example.demochatbot.service.data.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class BookServiceImpl implements BookService {
    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Override
    public Book findBookById(String bookId) {
        if (bookId == null || bookId.trim().isEmpty()) {
            return null;
        }
        Book book = bookRepository.findById(bookId).orElse(null);
        if (book == null) {
            book = bookRepository.findBookById(bookId);
        }
        return book;
    }

    @Override
    public BookDto findBookDetailById(String bookId) {
        Book book = findBookById(bookId);
        return book != null ? BookDto.fromEntity(book) : null;
    }

    @Override
    public BookBasicDto findBookBasicById(String bookId) {
        Book book = findBookById(bookId);
        return book != null ? BookBasicDto.fromEntity(book) : null;
    }

    @Override
    public Page<BookBasicDto> findAllBasicBooks(Pageable pageable) {
        return bookRepository.findAllBook(pageable)
                .map(BookBasicDto::fromEntity);
    }

    @Override
    public String getBookReadUrl(String bookId) {
        Book book = findBookById(bookId);
        if (book == null) {
            throw new RuntimeException("Không tìm thấy cuốn sách với mã: " + bookId);
        }

        String publicId = book.getPdfPublicId();
        if (publicId != null && !publicId.trim().isEmpty()) {
            // Sinh signed URL từ Cloudinary với hạn 1 giờ (3600 giây)
            String signedUrl = cloudinaryService.generateSignedPdfUrl(publicId, 3600L);
            if (signedUrl != null) {
                // Tăng số lượt đọc
                Integer currentCount = book.getReadCount() == null ? 0 : book.getReadCount();
                book.setReadCount(currentCount + 1);
                bookRepository.save(book);
                return signedUrl;
            }
        }

        // Fallback nếu không có publicId nhưng có sẵn pdf_url
        if (book.getPdf_url() != null && !book.getPdf_url().trim().isEmpty()) {
            return book.getPdf_url();
        }

        throw new RuntimeException("Cuốn sách này hiện chưa có nội dung số (file PDF) trên hệ thống.");
    }

    @Override
    public Boolean saveCloudinaryInfo(String bookId, CloudinaryResultDto dto) {
        return saveCloudinaryInfo(bookId, dto, null);
    }

    @Override
    public Boolean saveCloudinaryInfo(String bookId, CloudinaryResultDto dto, MultipartFile file) {
        Optional<Book> opt = bookRepository.findById(bookId);
        if (opt.isEmpty()) {
            return false;
        }
        Book book = opt.get();
        if (dto.getSecureUrl() != null) {
            if ("raw".equalsIgnoreCase(dto.getResourceType())) {
                // Dọn dẹp file cũ trên Cloudinary nếu có
                if (book.getPdfPublicId() != null && !book.getPdfPublicId().equals(dto.getPublicId())) {
                    try {
                        cloudinaryService.deleteFile(book.getPdfPublicId(), true);
                    } catch (Exception ignored) {}
                }
                book.setPdf_url(dto.getSecureUrl());
                book.setPdfPublicId(dto.getPublicId());
                String originalName = file != null && file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
                String contentType = file != null && file.getContentType() != null ? file.getContentType().toLowerCase() : "";
                if (originalName.endsWith(".epub") || contentType.contains("epub") || (dto.getSecureUrl() != null && dto.getSecureUrl().toLowerCase().contains(".epub"))) {
                    book.setFileFormat("EPUB");
                } else {
                    book.setFileFormat("PDF");
                }
                if (file != null) {
                    double sizeMb = (double) file.getSize() / (1024.0 * 1024.0);
                    book.setFileSizeMb(Math.round(sizeMb * 100.0) / 100.0);
                }
            } else {
                // Dọn dẹp ảnh cũ trên Cloudinary nếu có
                if (book.getImgPublicId() != null && !book.getImgPublicId().equals(dto.getPublicId())) {
                    try {
                        cloudinaryService.deleteFile(book.getImgPublicId(), false);
                    } catch (Exception ignored) {}
                }
                book.setImg_url(dto.getSecureUrl());
                book.setImgPublicId(dto.getPublicId());
            }
        }
        book.setUpdatedAt(LocalDateTime.now());
        bookRepository.save(book);
        return true;
    }

    @Override
    public Book createBook(BookCreateRequest request, MultipartFile imageFile, MultipartFile pdfFile) throws IOException {
        Book book = new Book();

        // 1. Gán ID sách: tự sinh nếu admin không nhập
        String id = request.getBook_id();
        if (id == null || id.trim().isEmpty()) {
            id = "B" + (System.currentTimeMillis() % 10000000);
        }
        book.setBook_id(id);

        book.setBookName(request.getBookName());
        book.setIsbn(request.getIsbn());
        book.setAuthor(request.getAuthor());
        book.setPublisher(request.getPublisher());
        book.setYearOfPublished(request.getYearOfPublished());
        book.setTotalPages(request.getTotalPages());
        book.setRent_price(request.getRent_price());
        book.setDescription(request.getDescription());
        book.setStatus(request.getStatus() != null && !request.getStatus().trim().isEmpty()
                ? request.getStatus().trim()
                : (pdfFile != null && !pdfFile.isEmpty() ? "PUBLISHED" : "DRAFT"));
        book.setReadCount(0);
        if (request.getFileFormat() != null && !request.getFileFormat().trim().isEmpty()) {
            book.setFileFormat(request.getFileFormat().trim().toUpperCase());
        }
        book.setCreatedAt(LocalDateTime.now());
        book.setUpdatedAt(LocalDateTime.now());

        // 2. Thể loại sách
        if (request.getCategory_id() != null) {
            Optional<Category> catOpt = categoryRepository.findById(request.getCategory_id());
            catOpt.ifPresent(book::setCategory);
        }

        // 3. Upload ảnh bìa (nếu có)
        if (imageFile != null && !imageFile.isEmpty()) {
            CloudinaryResultDto imgDto = cloudinaryService.uploadFile(imageFile, false);
            book.setImg_url(imgDto.getSecureUrl());
            book.setImgPublicId(imgDto.getPublicId());
        }

        // 4. Upload file tài liệu nội dung sách (PDF / EPUB nếu có)
        if (pdfFile != null && !pdfFile.isEmpty()) {
            CloudinaryResultDto pdfDto = cloudinaryService.uploadFile(pdfFile, true);
            book.setPdf_url(pdfDto.getSecureUrl());
            book.setPdfPublicId(pdfDto.getPublicId());

            String originalName = pdfFile.getOriginalFilename() != null ? pdfFile.getOriginalFilename().toLowerCase() : "";
            String contentType = pdfFile.getContentType() != null ? pdfFile.getContentType().toLowerCase() : "";
            if (originalName.endsWith(".epub") || contentType.contains("epub")) {
                book.setFileFormat("EPUB");
            } else {
                book.setFileFormat("PDF");
            }

            double sizeMb = (double) pdfFile.getSize() / (1024.0 * 1024.0);
            book.setFileSizeMb(Math.round(sizeMb * 100.0) / 100.0);
        }

        return bookRepository.save(book);
    }

    @Override
    public Book updateBook(String bookId, BookUpdateRequest request, MultipartFile imageFile, MultipartFile pdfFile) throws IOException {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sách với mã ID: " + bookId));

        if (request.getBookName() != null && !request.getBookName().trim().isEmpty()) {
            book.setBookName(request.getBookName().trim());
        }
        if (request.getIsbn() != null) {
            book.setIsbn(request.getIsbn().trim());
        }
        if (request.getAuthor() != null) {
            book.setAuthor(request.getAuthor().trim());
        }
        if (request.getPublisher() != null) {
            book.setPublisher(request.getPublisher().trim());
        }
        if (request.getYearOfPublished() != null) {
            book.setYearOfPublished(request.getYearOfPublished());
        }
        if (request.getTotalPages() != null) {
            book.setTotalPages(request.getTotalPages());
        }
        if (request.getRent_price() != null) {
            book.setRent_price(request.getRent_price());
        }
        if (request.getDescription() != null) {
            book.setDescription(request.getDescription().trim());
        }
        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            book.setStatus(request.getStatus().trim());
        }
        if (request.getFileFormat() != null && !request.getFileFormat().trim().isEmpty()) {
            book.setFileFormat(request.getFileFormat().trim().toUpperCase());
        }

        // Cập nhật thể loại
        if (request.getCategory_id() != null) {
            if (request.getCategory_id() > 0) {
                Optional<Category> catOpt = categoryRepository.findById(request.getCategory_id());
                catOpt.ifPresent(book::setCategory);
            } else {
                book.setCategory(null);
            }
        }

        // Cập nhật ảnh bìa mới nếu có tải lên
        if (imageFile != null && !imageFile.isEmpty()) {
            if (book.getImgPublicId() != null && !book.getImgPublicId().trim().isEmpty()) {
                try {
                    cloudinaryService.deleteFile(book.getImgPublicId(), false);
                } catch (Exception ignored) {}
            }
            CloudinaryResultDto imgDto = cloudinaryService.uploadFile(imageFile, false);
            book.setImg_url(imgDto.getSecureUrl());
            book.setImgPublicId(imgDto.getPublicId());
        }

        // Cập nhật file PDF / EPUB mới nếu có tải lên
        if (pdfFile != null && !pdfFile.isEmpty()) {
            if (book.getPdfPublicId() != null && !book.getPdfPublicId().trim().isEmpty()) {
                try {
                    cloudinaryService.deleteFile(book.getPdfPublicId(), true);
                } catch (Exception ignored) {}
            }
            CloudinaryResultDto pdfDto = cloudinaryService.uploadFile(pdfFile, true);
            book.setPdf_url(pdfDto.getSecureUrl());
            book.setPdfPublicId(pdfDto.getPublicId());

            String originalName = pdfFile.getOriginalFilename() != null ? pdfFile.getOriginalFilename().toLowerCase() : "";
            String contentType = pdfFile.getContentType() != null ? pdfFile.getContentType().toLowerCase() : "";
            if (originalName.endsWith(".epub") || contentType.contains("epub")) {
                book.setFileFormat("EPUB");
            } else {
                book.setFileFormat("PDF");
            }

            double sizeMb = (double) pdfFile.getSize() / (1024.0 * 1024.0);
            book.setFileSizeMb(Math.round(sizeMb * 100.0) / 100.0);
            if (book.getStatus() == null || "DRAFT".equalsIgnoreCase(book.getStatus())) {
                book.setStatus("PUBLISHED");
            }
        }

        book.setUpdatedAt(LocalDateTime.now());
        return bookRepository.save(book);
    }

    @Override
    public Boolean deleteBook(String bookId) {
        Book book = findBookById(bookId);
        if (book == null) {
            return false;
        }

        // Dọn dẹp tài nguyên trên Cloudinary trước khi xóa DB
        if (book.getPdfPublicId() != null) {
            try {
                cloudinaryService.deleteFile(book.getPdfPublicId(), true);
            } catch (Exception ignored) {}
        }
        if (book.getImgPublicId() != null) {
            try {
                cloudinaryService.deleteFile(book.getImgPublicId(), false);
            } catch (Exception ignored) {}
        }

        bookRepository.delete(book);
        return true;
    }

    @Override
    public Page<Book> findAllBook(Pageable pageable) {
        return bookRepository.findAllBook(pageable);
    }
}
