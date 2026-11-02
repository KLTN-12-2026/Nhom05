package com.example.demochatbot.repository;

import com.example.demochatbot.model.Customer;
import com.example.demochatbot.model.Orders;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ============================================================================
 * Repository: OrdersRepository
 * Mô tả: Quản lý truy vấn hóa đơn đơn hàng thuê / mua sách của khách hàng
 * ============================================================================
 */
@Repository
public interface OrdersRepository extends JpaRepository<Orders, Integer> {

    @Query("SELECT o FROM Orders o WHERE o.customer = :customer ORDER BY o.order_date DESC")
    List<Orders> findByCustomerOrderByOrderDateDesc(@Param("customer") Customer customer);

    @Query("SELECT o FROM Orders o WHERE o.customer.customer_id = :customerId ORDER BY o.order_date DESC")
    List<Orders> findByCustomerIdOrderByOrderDateDesc(@Param("customerId") String customerId);
}
