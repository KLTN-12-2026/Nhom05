package com.example.demochatbot.repository;
import com.example.demochatbot.model.Mission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface MissionRepository extends JpaRepository<Mission, String> {
    List<Mission> findAllByOrderByOrderIndexAscIdAsc();
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select m from Mission m where m.id = :id")
    java.util.Optional<Mission> findLocked(@org.springframework.data.repository.query.Param("id") String id);
}
