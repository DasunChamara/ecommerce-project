package com.ecommerce.repository;

import com.ecommerce.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Integer> {

    List<CartItem> findByUserId(Integer userId);

    // For selective checkout
    @Query("SELECT c FROM CartItem c WHERE c.user.id = :userId AND c.selected = true")
    List<CartItem> findByUserIdAndIsSelectedTrue(@Param("userId") Integer userId);

    // Single bulk DELETE statement instead of load-then-delete-each
    @Transactional
    @Modifying
    @Query("DELETE FROM CartItem c WHERE c.user.id = :userId")
    void deleteByUserId(@Param("userId") Integer userId);
}
