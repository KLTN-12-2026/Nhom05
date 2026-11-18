package com.example.demochatbot.repository;

import com.example.demochatbot.model.Customer;
import jakarta.persistence.LockModeType;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, String> {

    @Query(value = "SELECT customer_id FROM customer ORDER BY customer_id DESC LIMIT 1", nativeQuery = true)
    String findLastCustomer();

    Optional<Customer> findByEmail(String email);

    Optional<Customer> findByPhoneNumber(String phoneNumber);

    @Query("SELECT c FROM Customer c WHERE c.account.account_id = :accountId")
    Customer findCustomerById(@Param("accountId") int accountId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Customer c WHERE c.account.account_id = :accountId")
    Optional<Customer> findCustomerByIdForUpdate(@Param("accountId") int accountId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Customer c WHERE c.customer_id = :customerId")
    Optional<Customer> findByIdForUpdate(@Param("customerId") String customerId);

    interface LockedWallet {
        Integer getPotatoBalance();
        Integer getTotalPotatoEarned();
    }

    @Query(value = "SELECT potato_balance AS potatoBalance, total_potato_earned AS totalPotatoEarned "
            + "FROM customer WHERE customer_id = :customerId FOR UPDATE", nativeQuery = true)
    Optional<LockedWallet> findLockedWallet(@Param("customerId") String customerId);

    /** Scalar current read avoids reusing a balance from the persistence-context snapshot. */
    default void synchronizeLockedWallet(Customer customer) {
        LockedWallet wallet = findLockedWallet(customer.getCustomer_id())
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy ví đã khóa."));
        customer.setPotatoBalance(wallet.getPotatoBalance());
        customer.setTotalPotatoEarned(wallet.getTotalPotatoEarned());
    }

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query(value = "UPDATE customer SET customer_name = :customerName, gender = :gender, birthday = :birthday, address = :address, phone_number = :phoneNumber, email = :email WHERE customer_id = :customerId", nativeQuery = true)
    int updateCustomerInfo(@Param("customerId") String customerId, @Param("customerName") String customerName, @Param("gender") boolean gender, @Param("birthday") Date birthday, @Param("address") String address, @Param("phoneNumber") String phoneNumber, @Param("email") String email);

}
