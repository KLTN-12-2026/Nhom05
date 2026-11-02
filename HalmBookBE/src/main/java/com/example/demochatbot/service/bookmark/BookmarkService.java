package com.example.demochatbot.service.bookmark;

import com.example.demochatbot.dto.ReadingNoteBookmarkDto;
import com.example.demochatbot.dto.ReadingNoteBookmarkRequest;

import java.util.List;

public interface BookmarkService {
    List<ReadingNoteBookmarkDto> getBookmarksByBook(int accountId, String bookId);
    ReadingNoteBookmarkDto createBookmark(int accountId, ReadingNoteBookmarkRequest request);
    boolean deleteBookmark(int accountId, int noteId);
}
