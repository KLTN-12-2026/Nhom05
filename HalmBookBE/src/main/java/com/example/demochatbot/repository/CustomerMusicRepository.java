package com.example.demochatbot.repository;

import com.example.demochatbot.model.CustomerMusic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerMusicRepository extends JpaRepository<CustomerMusic, Integer> {

    @Query("SELECT m FROM CustomerMusic m WHERE m.customer.customer_id = :customerId ORDER BY m.createdAt DESC")
    List<CustomerMusic> findByCustomerId(@Param("customerId") String customerId);

    @Query("SELECT m FROM CustomerMusic m WHERE m.id = :id AND m.customer.customer_id = :customerId")
    Optional<CustomerMusic> findByIdAndCustomerId(@Param("id") Integer id, @Param("customerId") String customerId);
}
