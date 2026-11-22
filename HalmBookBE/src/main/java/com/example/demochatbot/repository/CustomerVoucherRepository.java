package com.example.demochatbot.repository;

import com.example.demochatbot.model.CustomerVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerVoucherRepository extends JpaRepository<CustomerVoucher, Long> {

    @Query("SELECT cv FROM CustomerVoucher cv WHERE cv.customer.customer_id = :customerId ORDER BY cv.savedAt DESC")
    List<CustomerVoucher> findByCustomerId(@Param("customerId") String customerId);

    @Query("SELECT cv FROM CustomerVoucher cv WHERE cv.customer.customer_id = :customerId AND LOWER(cv.code) = LOWER(:code)")
    Optional<CustomerVoucher> findByCustomerIdAndCode(@Param("customerId") String customerId, @Param("code") String code);

    @Query("SELECT COUNT(cv) > 0 FROM CustomerVoucher cv WHERE cv.customer.customer_id = :customerId AND LOWER(cv.code) = LOWER(:code)")
    boolean existsByCustomerIdAndCode(@Param("customerId") String customerId, @Param("code") String code);

    @Query("SELECT cv FROM CustomerVoucher cv WHERE cv.customer.customer_id = :customerId AND cv.isUsed = false AND (cv.endDate IS NULL OR cv.endDate > CURRENT_TIMESTAMP) ORDER BY cv.savedAt DESC")
    List<CustomerVoucher> findAvailableByCustomerId(@Param("customerId") String customerId);
}
