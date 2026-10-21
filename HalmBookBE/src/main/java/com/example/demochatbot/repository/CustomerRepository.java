package com.example.demochatbot.repository;

import com.example.demochatbot.model.Customer;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, String> {

    @Query(value = "SELECT customer_id FROM Customer ORDER BY customer_id DESC LIMIT 1", nativeQuery = true)
    String findLastCustomer();

    Optional<Customer> findByEmail(String email);

    @Query("SELECT c FROM Customer c WHERE c.account.account_id = :accountId")
    Customer findCustomerById(@Param("accountId") int accountId);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query(value = "UPDATE customer SET customer_name = :customerName, gender = :gender, birthday = :birthday, address = :address, phone_number = :phoneNumber, email = :email WHERE customer_id = :customerId", nativeQuery = true)
    int updateCustomerInfo(@Param("customerId") String customerId, @Param("customerName") String customerName, @Param("gender") boolean gender, @Param("birthday") Date birthday, @Param("address") String address, @Param("phoneNumber") String phoneNumber, @Param("email") String email);


}
