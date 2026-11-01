package com.ecommerce.dto;

import java.math.BigDecimal;

public class ProductVariantResponseDto {

    private Integer id;
    private Integer productId;
    private String weight;
    private BigDecimal weightInKg;
    private BigDecimal price;

    public ProductVariantResponseDto() {
    }

    public ProductVariantResponseDto(Integer id, Integer productId, String weight,
                                     BigDecimal weightInKg, BigDecimal price) {
        this.id = id;
        this.productId = productId;
        this.weight = weight;
        this.weightInKg = weightInKg;
        this.price = price;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getProductId() { return productId; }
    public void setProductId(Integer productId) { this.productId = productId; }

    public String getWeight() { return weight; }
    public void setWeight(String weight) { this.weight = weight; }

    public BigDecimal getWeightInKg() { return weightInKg; }
    public void setWeightInKg(BigDecimal weightInKg) { this.weightInKg = weightInKg; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
}
