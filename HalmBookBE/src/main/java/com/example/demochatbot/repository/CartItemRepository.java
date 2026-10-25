package com.example.demochatbot.repository;

import com.example.demochatbot.model.Cart_Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<Cart_Item, Integer> {

    @Query("SELECT ci FROM Cart_Item ci WHERE ci.cart.cart_id = :cartId")
    List<Cart_Item> findByCartId(@Param("cartId") int cartId);

    @Query("SELECT ci FROM Cart_Item ci WHERE ci.cart.cart_id = :cartId AND ci.book.book_id = :bookId")
    Optional<Cart_Item> findByCartIdAndBookId(@Param("cartId") int cartId, @Param("bookId") String bookId);

    @Query("SELECT COUNT(ci) FROM Cart_Item ci WHERE ci.cart.cart_id = :cartId")
    int countTotalItems(@Param("cartId") int cartId);
}
