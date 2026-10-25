package com.example.demochatbot.repository;

import com.example.demochatbot.model.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Integer> {

    @Query("SELECT c FROM Cart c WHERE c.customer.customer_id = :customerId")
    Optional<Cart> findByCustomerId(@Param("customerId") String customerId);
}
