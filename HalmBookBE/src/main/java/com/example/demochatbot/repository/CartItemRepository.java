package com.example.demochatbot.repository;

import com.example.demochatbot.model.Cart_Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<Cart_Item, Integer> {

    @Query("SELECT ci FROM Cart_Item ci JOIN FETCH ci.book WHERE ci.cart.cart_id = :cartId")
    List<Cart_Item> findByCartId(@Param("cartId") int cartId);

    @Query("SELECT ci FROM Cart_Item ci JOIN FETCH ci.book WHERE ci.cart.customer.account.account_id = :userId")
    List<Cart_Item> findByUserId(@Param("userId") int userId);

    @Query("SELECT ci FROM Cart_Item ci JOIN FETCH ci.book WHERE ci.cart.customer.account.account_id = :userId AND ci.book.book_id = :bookId")
    Optional<Cart_Item> findByUserIdAndBookId(@Param("userId") int userId, @Param("bookId") String bookId);

    @Query("SELECT ci FROM Cart_Item ci JOIN FETCH ci.book WHERE ci.cart.cart_id = :cartId AND ci.book.book_id = :bookId")
    Optional<Cart_Item> findByCartIdAndBookId(@Param("cartId") int cartId, @Param("bookId") String bookId);

    @Query("SELECT ci FROM Cart_Item ci JOIN FETCH ci.book WHERE ci.cart_item_id IN :ids AND ci.cart.customer.account.account_id = :userId")
    List<Cart_Item> findByIdsAndUserId(@Param("ids") List<Integer> ids, @Param("userId") int userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Cart_Item ci WHERE ci.cart_item_id IN :ids")
    void deleteByIds(@Param("ids") List<Integer> ids);

    @Query("SELECT COUNT(ci) FROM Cart_Item ci WHERE ci.cart.cart_id = :cartId")
    int countTotalItems(@Param("cartId") int cartId);
}
