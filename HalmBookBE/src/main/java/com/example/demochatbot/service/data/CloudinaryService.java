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
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    @Value("${server.port:8082}")
    private String serverPort;

    // Giới hạn cứng của gói Cloudinary Free cho file Raw/PDF là 10MB (10,485,760 bytes)
    private static final long CLOUDINARY_MAX_RAW_SIZE = 10L * 1024 * 1024;

    public CloudinaryResultDto uploadFile(MultipartFile file, boolean isPdf) throws IOException {
        long fileSize = file.getSize();

        // 1. Nếu là file PDF có dung lượng > 10MB (vượt quá gói miễn phí của Cloudinary),
        // tự động chuyển hướng lưu trữ cục bộ vào thư mục máy chủ (Hybrid Storage)
        if (isPdf && fileSize > CLOUDINARY_MAX_RAW_SIZE) {
            return saveLocalFile(file, "pdfs");
        }

        try {
            String folder = isPdf ? "halmbook/pdfs" : "halmbook/images";
            String resourceType = isPdf ? "raw" : "image";

            Map<String, Object> options = ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", resourceType
            );
            if (isPdf) {
                options.put("type", "authenticated");
                String origName = file.getOriginalFilename();
                if (origName != null && !origName.trim().isEmpty()) {
                    String ext = origName.contains(".") ? origName.substring(origName.lastIndexOf(".")).toLowerCase() : ".pdf";
                    String baseName = origName.contains(".") ? origName.substring(0, origName.lastIndexOf(".")) : origName;
                    String safeBase = baseName.replaceAll("[^a-zA-Z0-9_-]", "_");
                    options.put("public_id", safeBase + "_" + System.currentTimeMillis() + ext);
                    options.put("use_filename", true);
                }
            }

            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), options);

            String secureUrl = uploadResult.get("secure_url").toString();
            String publicId = uploadResult.get("public_id").toString();
            String returnedResourceType = uploadResult.get("resource_type").toString();

            return new CloudinaryResultDto(secureUrl, publicId, returnedResourceType);
        } catch (Exception e) {
            String errorMsg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
            // Nếu Cloudinary từ chối vì dung lượng file quá lớn đối với tài khoản
            if (isPdf || errorMsg.contains("exceeds maximum allowed file size") || errorMsg.contains("file size")) {
                return saveLocalFile(file, isPdf ? "pdfs" : "images");
            }
            throw e;
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

        String localUrl = "http://localhost:" + serverPort + "/uploads/" + subDir + "/" + safeFileName;
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
            return "http://localhost:" + serverPort + "/uploads/" + relativePath;
        }

        try {
            // Ưu tiên dùng signed url inline để trình duyệt có thể render trực tiếp thay vì tự động download file
            return cloudinary.url()
                    .resourceType("raw")
                    .type("authenticated")
                    .signed(true)
                    .secure(true)
                    .generate(publicId);
        } catch (Exception e) {
            long duration = expireSeconds > 0 ? expireSeconds : 3600L;
            long expiresAt = (System.currentTimeMillis() / 1000L) + duration;
            String format = publicId.toLowerCase().endsWith(".epub") ? "epub" : "pdf";
            Map<String, Object> options = ObjectUtils.asMap(
                    "resource_type", "raw",
                    "type", "authenticated",
                    "expires_at", expiresAt
            );
            try {
                return cloudinary.privateDownload(publicId, format, options);
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
            return "http://localhost:" + serverPort + "/uploads/" + relativePath;
        }

        return cloudinary.url()
                .resourceType("raw")
                .type("authenticated")
                .signed(true)
                .secure(true)
                .generate(publicId);
    }
}
