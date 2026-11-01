package com.ecommerce.service;

import com.ecommerce.dto.ProductResponseDto;
import com.ecommerce.dto.ProductVariantResponseDto;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.Product;
import com.ecommerce.model.ProductVariant;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ProductVariantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;

    public ProductService(ProductRepository productRepository,
                          ProductVariantRepository productVariantRepository) {
        this.productRepository = productRepository;
        this.productVariantRepository = productVariantRepository;
    }

    public List<ProductResponseDto> getAllProducts() {
        return productRepository.findAll().stream().map(ProductService::toDto).toList();
    }

    /** Special Cinnamon products (is_special = true). */
    public List<ProductResponseDto> getSpecialProducts() {
        return productRepository.findByIsSpecialTrue().stream().map(ProductService::toDto).toList();
    }

    /** All weight variants and prices for a product. */
    public List<ProductVariantResponseDto> getProductVariants(Integer productId) {
        if (productId == null || !productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found");
        }
        return productVariantRepository.findByProductId(productId).stream()
                .map(v -> toDto(v, productId))
                .toList();
    }

    private static ProductResponseDto toDto(Product p) {
        return new ProductResponseDto(p.getId(), p.getName(), p.getDescription(), p.getBasePrice(),
                p.getStockQuantity(), p.getImageUrl(), p.isSpecial());
    }

    private static ProductVariantResponseDto toDto(ProductVariant v, Integer productId) {
        return new ProductVariantResponseDto(v.getId(), productId, v.getWeight(), v.getWeightInKg(), v.getPrice());
    }
}
