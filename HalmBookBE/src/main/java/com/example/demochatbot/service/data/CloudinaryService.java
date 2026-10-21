package com.example.demochatbot.service.data;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.demochatbot.dto.CloudinaryResultDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {
    @Autowired
    private Cloudinary cloudinary;

    public CloudinaryResultDto uploadFile(MultipartFile file, boolean isPdf) throws IOException {
        String folder = isPdf ? "halmbook/pdfs" : "halmbook/images";
        String resourceType = isPdf ? "raw" : "image";

        Map<String,Object> options = ObjectUtils.asMap(
                "folder", folder,
                "resource_type", resourceType
        );
        if(isPdf) {
            options.put("type", "authenticated");
        }

        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), options);

        String secureUrl = uploadResult.get("secure_url").toString();
        String publicId=  uploadResult.get("public_id").toString();
        String returnedResourceType = uploadResult.get("resource_type").toString();

        return new CloudinaryResultDto(secureUrl, publicId, returnedResourceType);
    }

    public void deleteFile(String publicId, boolean isPdf) throws IOException{
        String resourceType = isPdf ? "raw" : "image";
        Map<String ,Object> options = ObjectUtils.asMap(
                "resource_type", resourceType

        );

        cloudinary.uploader().destroy(publicId, options);
    }
}
