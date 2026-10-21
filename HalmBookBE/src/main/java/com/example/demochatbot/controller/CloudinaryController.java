package com.example.demochatbot.controller;

import com.example.demochatbot.dto.CloudinaryResultDto;
import com.example.demochatbot.service.book.BookService;
import com.example.demochatbot.service.data.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/books")
@RequiredArgsConstructor
public class CloudinaryController {
    private final CloudinaryService cloudinaryService;
    private final BookService bookService;
    @PostMapping("/{bookId}/upload")
    public ResponseEntity<?> uploadFile(
            @PathVariable String bookId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("isPdf") boolean isPdf
    ){
        if (file.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Tep tai len khong duoc de trong !");
        }
        String contentType = file .getContentType();
        if (isPdf&& (contentType==null || !contentType.equals("application/pdf"))){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Loi: Yeu cau dinh dang PDF nhung nhan duoc :" + contentType);
        } else if (!isPdf && (contentType == null || !contentType.startsWith("image/"))) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Loi : Yeu cau dinh dang hinh anh nhung nhan duoc :" + contentType);
        }

        try{
            CloudinaryResultDto uploadResult = cloudinaryService.uploadFile(file,isPdf);

            Boolean isSaved =  bookService.saveCloudinaryInfo(bookId,uploadResult);
            if (isSaved){
                return ResponseEntity.status(HttpStatus.OK).body("Upload va dong bo du lieu thanh cong !");
            }else {
                cloudinaryService.deleteFile(uploadResult.getPublicId(),isPdf);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("That bai : khong tim thay sach voi ma ID " + bookId);
            }
        }catch (Exception e){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Loi he thong trong qua trinh upload !" + e.getMessage());
        }
    }
}
