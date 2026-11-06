package com.example.demochatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReadingNoteBookmarkRequest {
    private String bookId;
    private int pageNumber;
    private String selectedText;
    private String highlightText;
    private String personalNote;
}
