package com.ecommerce.service;

import com.ecommerce.dto.AddToCartRequestDto;
import com.ecommerce.dto.CartItemResponseDto;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ConflictException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.CartItem;
import com.ecommerce.model.Product;
import com.ecommerce.model.ProductVariant;
import com.ecommerce.model.User;
import com.ecommerce.repository.CartItemRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ProductVariantRepository;
import com.ecommerce.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;

    public CartService(CartItemRepository cartItemRepository,
                       UserRepository userRepository,
                       ProductRepository productRepository,
                       ProductVariantRepository productVariantRepository) {
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.productVariantRepository = productVariantRepository;
    }

    @Transactional
    public CartItemResponseDto addToCart(Integer userId, AddToCartRequestDto request) {
        if (userId == null || request == null || request.getProductId() == null) {
            throw new BadRequestException("User and product are required");
        }
        int quantity = request.getQuantity() == null ? 0 : request.getQuantity();
        if (quantity < 1) {
            throw new BadRequestException("Quantity must be at least 1");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        ProductVariant variant = null;
        if (request.getVariantId() != null) {
            variant = productVariantRepository.findById(request.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product variant not found"));
            if (!variant.getProduct().getId().equals(product.getId())) {
                throw new BadRequestException("The selected variant does not belong to this product");
            }
        }
        final Integer variantId = variant == null ? null : variant.getId();

        // Same product + variant already in the cart? Merge instead of creating a duplicate row.
        CartItem existing = cartItemRepository.findByUserId(userId).stream()
                .filter(ci -> ci.getProduct().getId().equals(product.getId())
                        && Objects.equals(variantIdOf(ci), variantId))
                .findFirst()
                .orElse(null);

        int totalRequested = quantity + (existing == null ? 0 : existing.getQuantity());
        if (totalRequested > product.getStockQuantity()) {
            throw new ConflictException("Only " + product.getStockQuantity()
                    + " unit(s) of '" + product.getName() + "' are available in stock");
        }

        CartItem item;
        if (existing != null) {
            existing.setQuantity(totalRequested);
            item = existing;
        } else {
            item = new CartItem();
            item.setUser(user);
            item.setProduct(product);
            item.setVariant(variant);
            item.setQuantity(quantity);
            item.setSelected(true);
        }
        return toResponse(cartItemRepository.save(item));
    }

    @Transactional(readOnly = true)
    public List<CartItemResponseDto> getCart(Integer userId) {
        return cartItemRepository.findByUserId(userId).stream()
                .sorted(Comparator.comparing(CartItem::getId))
                .map(CartService::toResponse)
                .toList();
    }

    /** Toggles an item for Selective Checkout. */
    @Transactional
    public CartItemResponseDto updateSelection(Integer cartItemId, boolean isSelected) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        item.setSelected(isSelected);
        return toResponse(cartItemRepository.save(item));
    }

    @Transactional
    public void removeFromCart(Integer cartItemId) {
        if (cartItemId == null || !cartItemRepository.existsById(cartItemId)) {
            throw new ResourceNotFoundException("Cart item not found");
        }
        cartItemRepository.deleteById(cartItemId);
    }

    private static Integer variantIdOf(CartItem item) {
        return item.getVariant() == null ? null : item.getVariant().getId();
    }

    private static CartItemResponseDto toResponse(CartItem item) {
        Product product = item.getProduct();
        ProductVariant variant = item.getVariant();
        BigDecimal unitPrice = variant != null ? variant.getPrice() : product.getBasePrice();
        BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
        return new CartItemResponseDto(item.getId(), product.getId(), product.getName(),
                variant == null ? null : variant.getId(),
                variant == null ? null : variant.getWeight(),
                unitPrice, item.getQuantity(), item.isSelected(), totalPrice);
    }
}
