package com.ecommerce.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "items_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal itemsTotal;

    @Column(name = "courier_fee", precision = 10, scale = 2)
    private BigDecimal courierFee = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "total_weight_kg", precision = 8, scale = 3)
    private BigDecimal totalWeightKg = BigDecimal.ZERO;

    @Column(name = "is_urgent")
    private boolean urgent = false;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod = "COD";

    @Column(name = "status", length = 50)
    private String status = "PENDING";

    @Column(name = "delivery_address", nullable = false, columnDefinition = "TEXT")
    private String deliveryAddress;

    @Column(name = "delivery_latitude", precision = 10, scale = 8)
    private BigDecimal deliveryLatitude;

    @Column(name = "delivery_longitude", precision = 11, scale = 8)
    private BigDecimal deliveryLongitude;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Order() {
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public BigDecimal getItemsTotal() { return itemsTotal; }
    public void setItemsTotal(BigDecimal itemsTotal) { this.itemsTotal = itemsTotal; }

    public BigDecimal getCourierFee() { return courierFee; }
    public void setCourierFee(BigDecimal courierFee) { this.courierFee = courierFee; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public BigDecimal getTotalWeightKg() { return totalWeightKg; }
    public void setTotalWeightKg(BigDecimal totalWeightKg) { this.totalWeightKg = totalWeightKg; }

    public boolean isUrgent() { return urgent; }
    public void setUrgent(boolean urgent) { this.urgent = urgent; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public BigDecimal getDeliveryLatitude() { return deliveryLatitude; }
    public void setDeliveryLatitude(BigDecimal deliveryLatitude) { this.deliveryLatitude = deliveryLatitude; }

    public BigDecimal getDeliveryLongitude() { return deliveryLongitude; }
    public void setDeliveryLongitude(BigDecimal deliveryLongitude) { this.deliveryLongitude = deliveryLongitude; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
