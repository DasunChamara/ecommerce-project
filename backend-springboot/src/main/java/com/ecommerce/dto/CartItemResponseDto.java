package com.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

public class CartItemResponseDto {

    private Integer cartItemId;
    private Integer productId;
    private String productName;
    private Integer variantId;
    private String weight;
    private BigDecimal unitPrice;
    private Integer quantity;

    @JsonProperty("isSelected")
    private boolean selected;

    private BigDecimal totalPrice;

    public CartItemResponseDto() {
    }

    public CartItemResponseDto(Integer cartItemId, Integer productId, String productName,
                               Integer variantId, String weight, BigDecimal unitPrice,
                               Integer quantity, boolean selected, BigDecimal totalPrice) {
        this.cartItemId = cartItemId;
        this.productId = productId;
        this.productName = productName;
        this.variantId = variantId;
        this.weight = weight;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.selected = selected;
        this.totalPrice = totalPrice;
    }

    public Integer getCartItemId() { return cartItemId; }
    public void setCartItemId(Integer cartItemId) { this.cartItemId = cartItemId; }

    public Integer getProductId() { return productId; }
    public void setProductId(Integer productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public Integer getVariantId() { return variantId; }
    public void setVariantId(Integer variantId) { this.variantId = variantId; }

    public String getWeight() { return weight; }
    public void setWeight(String weight) { this.weight = weight; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public boolean isSelected() { return selected; }
    public void setSelected(boolean selected) { this.selected = selected; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }
}
