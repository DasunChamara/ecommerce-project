package com.ecommerce.dto;

public class OrderItemRequestDto {

    private Integer productId;
    private Integer variantId; // optional
    private Integer quantity;

    public OrderItemRequestDto() {
    }

    public OrderItemRequestDto(Integer productId, Integer variantId, Integer quantity) {
        this.productId = productId;
        this.variantId = variantId;
        this.quantity = quantity;
    }

    public Integer getProductId() { return productId; }
    public void setProductId(Integer productId) { this.productId = productId; }

    public Integer getVariantId() { return variantId; }
    public void setVariantId(Integer variantId) { this.variantId = variantId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
