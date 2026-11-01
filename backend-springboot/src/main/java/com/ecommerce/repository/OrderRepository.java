package com.ecommerce.repository;

import com.ecommerce.model.Order;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    List<Order> findByUserIdOrderByCreatedAtDesc(Integer userId);

    // Entity property එක 'urgent' නිසා Query එකක් මඟින් Urgent orders ලබා ගැනීම
    @Query("SELECT o FROM Order o WHERE o.urgent = true ORDER BY o.createdAt DESC")
    List<Order> findByIsUrgentTrueOrderByCreatedAtDesc();

    List<Order> findByStatusOrderByCreatedAtDesc(String status);

    // Lock order for status update or cancellation
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findByIdForUpdate(@Param("id") Integer id);
}