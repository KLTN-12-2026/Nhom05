package com.example.demochatbot.dto;

import com.example.demochatbot.model.ReadingNoteBookmark;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.format.DateTimeFormatter;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadingNoteBookmarkDto {
    private int noteId;
    private String id;
    private String bookId;
    private String bookTitle;
    private int pageNumber;
    private String selectedText;
    private String highlightText;
    private String personalNote;
    private String createdAt;

    public static ReadingNoteBookmarkDto fromEntity(ReadingNoteBookmark entity) {
        if (entity == null) return null;

        String formattedDate = "";
        if (entity.getCreatedAt() != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");
            formattedDate = entity.getCreatedAt().format(formatter);
        }

        return ReadingNoteBookmarkDto.builder()
                .noteId(entity.getNoteId())
                .id(String.valueOf(entity.getNoteId()))
                .bookId(entity.getBook() != null ? entity.getBook().getBook_id() : "")
                .bookTitle(entity.getBook() != null ? entity.getBook().getBookName() : "")
                .pageNumber(entity.getPageNumber())
                .selectedText(entity.getHighlightText())
                .highlightText(entity.getHighlightText())
                .personalNote(entity.getPersonalNote())
                .createdAt(formattedDate)
                .build();
    }
}
