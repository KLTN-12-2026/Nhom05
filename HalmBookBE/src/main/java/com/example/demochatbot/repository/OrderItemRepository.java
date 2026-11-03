package com.example.demochatbot.repository;

import com.example.demochatbot.model.Order_Item;
import com.example.demochatbot.model.Orders;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ============================================================================
 * Repository: OrderItemRepository
 * Mô tả: Quản lý chi tiết các cuốn sách trong đơn hàng (gói thuê, ngày thuê, giá khoai)
 * ============================================================================
 */
@Repository
public interface OrderItemRepository extends JpaRepository<Order_Item, Integer> {

    @Query("SELECT oi FROM Order_Item oi WHERE oi.orders = :orders")
    List<Order_Item> findByOrders(@Param("orders") Orders orders);

    @Query("SELECT oi FROM Order_Item oi WHERE oi.orders.orders_id = :ordersId")
    List<Order_Item> findByOrdersId(@Param("ordersId") int ordersId);
}
