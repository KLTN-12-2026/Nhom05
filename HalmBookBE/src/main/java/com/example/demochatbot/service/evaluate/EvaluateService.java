package com.example.demochatbot.service.evaluate;

import com.example.demochatbot.dto.EvaluateCreateRequest;
import com.example.demochatbot.dto.EvaluateDto;

import java.util.List;

/**
 * Service xử lý nghiệp vụ lưu và truy vấn đánh giá sách
 */
public interface EvaluateService {

    /**
     * Lấy danh sách đánh giá của một cuốn sách
     */
    List<EvaluateDto> getEvaluatesByBookId(String bookId);

    /**
     * Đăng đánh giá mới hoặc phản hồi đánh giá
     * @param request Nội dung và số sao
     * @param accountId ID tài khoản người dùng đăng nhập (nếu có)
     */
    EvaluateDto createEvaluate(EvaluateCreateRequest request, Integer accountId);

    /**
     * Tăng lượt thích cho 1 đánh giá
     */
    int likeEvaluate(int evaluateId);
}
