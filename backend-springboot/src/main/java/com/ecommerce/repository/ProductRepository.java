package com.ecommerce.repository;

import com.ecommerce.model.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {

    // Special Cinnamon products (p.special = true විය යුතුය)
    @Query("SELECT p FROM Product p WHERE p.special = true")
    List<Product> findByIsSpecialTrue();

    List<Product> findByNameContainingIgnoreCase(String keyword);

    // Concurrency lock for stock check
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Integer id);

    // Real-time atomic stock deduction
    @Modifying
    @Transactional
    @Query("UPDATE Product p SET p.stockQuantity = p.stockQuantity - :quantity WHERE p.id = :productId AND p.stockQuantity >= :quantity")
    int deductStock(@Param("productId") Integer productId, @Param("quantity") Integer quantity);

    // Restore stock when an order is cancelled
    @Modifying
    @Transactional
    @Query("UPDATE Product p SET p.stockQuantity = p.stockQuantity + :quantity WHERE p.id = :productId")
    int restoreStock(@Param("productId") Integer productId, @Param("quantity") Integer quantity);
}