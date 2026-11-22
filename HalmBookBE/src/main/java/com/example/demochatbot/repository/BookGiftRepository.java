package com.example.demochatbot.repository;

import com.example.demochatbot.model.BookGift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookGiftRepository extends JpaRepository<BookGift, Long> {

    @Query("SELECT g FROM BookGift g WHERE g.sender.customer_id = :senderId ORDER BY g.createdAt DESC")
    List<BookGift> findBySenderCustomerId(@Param("senderId") String senderId);

    @Query("SELECT g FROM BookGift g WHERE g.receiver.customer_id = :receiverId ORDER BY g.createdAt DESC")
    List<BookGift> findByReceiverCustomerId(@Param("receiverId") String receiverId);
}
