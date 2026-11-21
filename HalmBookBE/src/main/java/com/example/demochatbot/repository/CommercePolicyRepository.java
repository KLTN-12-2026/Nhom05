package com.example.demochatbot.repository;
import com.example.demochatbot.model.CommercePolicy;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import java.util.Optional;
public interface CommercePolicyRepository extends JpaRepository<CommercePolicy, Integer> {
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select p from CommercePolicy p where p.id = 1") Optional<CommercePolicy> lockForUpdate();
    @Lock(LockModeType.PESSIMISTIC_READ) @Query("select p from CommercePolicy p where p.id = 1") Optional<CommercePolicy> lockForCheckout();
}
