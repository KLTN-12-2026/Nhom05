package com.example.demochatbot.repository;

import com.example.demochatbot.model.Customer;
import com.example.demochatbot.model.PotatoTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ============================================================================
 * Repository: PotatoTransactionRepository
 * Mô tả: Truy vấn và lưu trữ sổ cái lịch sử giao dịch biến động số dư Khoai Tây
 * ============================================================================
 */
@Repository
public interface PotatoTransactionRepository extends JpaRepository<PotatoTransaction, Integer> {

    /**
     * Lấy danh sách giao dịch của khách hàng theo đối tượng Customer, sắp xếp mới nhất lên đầu
     */
    @Query("SELECT pt FROM PotatoTransaction pt WHERE pt.customer = :customer ORDER BY pt.createdAt DESC")
    List<PotatoTransaction> findByCustomerOrderByCreatedAtDesc(@Param("customer") Customer customer);

    /**
     * Lấy danh sách giao dịch theo mã customer_id, sắp xếp mới nhất lên đầu
     */
    @Query("SELECT pt FROM PotatoTransaction pt WHERE pt.customer.customer_id = :customerId ORDER BY pt.createdAt DESC")
    List<PotatoTransaction> findByCustomerIdOrderByCreatedAtDesc(@Param("customerId") String customerId);
}
