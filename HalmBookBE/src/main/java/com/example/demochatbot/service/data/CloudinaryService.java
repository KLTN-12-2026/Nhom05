package com.example.demochatbot.service.data;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.demochatbot.dto.CloudinaryResultDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@SuppressWarnings("unchecked")
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;


    // Giới hạn cứng của gói Cloudinary Free cho file Raw/PDF là 10MB (10,485,760 bytes)
    private static final long CLOUDINARY_MAX_RAW_SIZE = 10L * 1024 * 1024;

    public CloudinaryResultDto uploadFile(MultipartFile file, boolean isPdf) throws IOException {
        long fileSize = file.getSize();

        // 1. Luôn lưu các file tài liệu sách (PDF / EPUB) vào bộ nhớ cục bộ máy chủ (uploads/pdfs)
        // để đảm bảo khả năng đọc ổn định, không giới hạn dung lượng và tránh lỗi phân quyền ACL của Cloudinary
        if (isPdf) {
            return saveLocalFile(file, "pdfs");
        }

        try {
            String folder = "halmbook/images";
            String resourceType = "image";

            Map<String, Object> options = ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", resourceType
            );

            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), options);

            String secureUrl = uploadResult.get("secure_url").toString();
            String publicId = uploadResult.get("public_id").toString();
            String returnedResourceType = uploadResult.get("resource_type").toString();

            return new CloudinaryResultDto(secureUrl, publicId, returnedResourceType);
        } catch (Exception e) {
            return saveLocalFile(file, "images");
        }
    }

    private CloudinaryResultDto saveLocalFile(MultipartFile file, String subDir) throws IOException {
        Path uploadDirPath = Paths.get("uploads", subDir);
        if (!Files.exists(uploadDirPath)) {
            Files.createDirectories(uploadDirPath);
        }

        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
        } else {
            extension = "pdfs".equals(subDir) ? ".pdf" : ".jpg";
        }

        String safeFileName = UUID.randomUUID().toString() + extension;
        Path targetPath = uploadDirPath.resolve(safeFileName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        String localUrl = "/uploads/" + subDir + "/" + safeFileName;
        String publicId = "local:" + subDir + "/" + safeFileName;
        String resourceType = "pdfs".equals(subDir) ? "raw" : "image";

        return new CloudinaryResultDto(localUrl, publicId, resourceType);
    }

    public void deleteFile(String publicId, boolean isPdf) throws IOException {
        if (publicId == null || publicId.trim().isEmpty()) {
            return;
        }

        // Nếu là file lưu trữ cục bộ
        if (publicId.startsWith("local:")) {
            String relativePath = publicId.substring("local:".length());
            Path filePath = Paths.get("uploads").resolve(relativePath);
            try {
                Files.deleteIfExists(filePath);
            } catch (Exception ignored) {}
            return;
        }

        String resourceType = isPdf ? "raw" : "image";
        Map<String, Object> options = ObjectUtils.asMap(
                "resource_type", resourceType
        );

        cloudinary.uploader().destroy(publicId, options);
    }

    /**
     * Sinh Signed URL xem trực tiếp từ Cloudinary có thời hạn (mặc định 1 giờ = 3600s)
     * Trả về Signed Inline URL để trình duyệt hiển thị trực tiếp mà KHÔNG ép tải file xuống (Content-Disposition: attachment)
     */
    public String generateSignedPdfUrl(String publicId, long expireSeconds) {
        if (publicId == null || publicId.trim().isEmpty()) {
            return null;
        }

        // Nếu là file lưu cục bộ, trả về URL truy cập trực tiếp
        if (publicId.startsWith("local:")) {
            String relativePath = publicId.substring("local:".length());
            return "/uploads/" + relativePath;
        }

        try {
            long duration = expireSeconds > 0 ? expireSeconds : 3600L;
            long expiresAt = (System.currentTimeMillis() / 1000L) + duration;
            Map<String, Object> options = ObjectUtils.asMap(
                    "resource_type", "raw",
                    "type", "authenticated",
                    "expires_at", expiresAt
            );
            return cloudinary.privateDownload(publicId, "", options);
        } catch (Exception e) {
            try {
                return cloudinary.url()
                        .resourceType("raw")
                        .type("authenticated")
                        .signed(true)
                        .secure(true)
                        .generate(publicId);
            } catch (Exception ex) {
                return null;
            }
        }
    }

    /**
     * Sinh Authenticated Signed URL trực tiếp bằng cloudinary.url()
     */
    public String generateAuthenticatedUrl(String publicId) {
        if (publicId == null || publicId.trim().isEmpty()) {
            return null;
        }

        if (publicId.startsWith("local:")) {
            String relativePath = publicId.substring("local:".length());
            return "/uploads/" + relativePath;
        }

        return generateSignedPdfUrl(publicId, 3600L);
    }
}
