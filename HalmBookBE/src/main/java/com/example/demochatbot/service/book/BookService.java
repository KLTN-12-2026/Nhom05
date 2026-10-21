package com.example.demochatbot.service.book;

import com.example.demochatbot.dto.CloudinaryResultDto;
import org.springframework.stereotype.Service;

@Service
public interface BookService {
    Boolean saveCloudinaryInfo(String bookId, CloudinaryResultDto dto);
}
