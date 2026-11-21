package com.example.demochatbot.repository;
import com.example.demochatbot.model.BookOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface BookOfferRepository extends JpaRepository<BookOffer, String> {
    List<BookOffer> findAllByOrderByOrderIndexAscIdAsc();
}
