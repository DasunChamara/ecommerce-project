package com.ecommerce.service;

import com.ecommerce.dto.CourierCalculateRequestDto;
import com.ecommerce.dto.CourierCalculateResponseDto;
import com.ecommerce.dto.CreateOrderRequestDto;
import com.ecommerce.dto.OrderItemRequestDto;
import com.ecommerce.dto.OrderResponseDto;
import com.ecommerce.dto.UserProfileResponseDto;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ConflictException;
import com.ecommerce.exception.ForbiddenOperationException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.CartItem;
import com.ecommerce.model.Order;
import com.ecommerce.model.OrderItem;
import com.ecommerce.model.Product;
import com.ecommerce.model.ProductVariant;
import com.ecommerce.model.User;
import com.ecommerce.repository.CartItemRepository;
import com.ecommerce.repository.OrderItemRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ProductVariantRepository;
import com.ecommerce.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CartItemRepository cartItemRepository;
    private final CourierService courierService;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        UserRepository userRepository,
                        ProductRepository productRepository,
                        ProductVariantRepository productVariantRepository,
                        CartItemRepository cartItemRepository,
                        CourierService courierService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.productVariantRepository = productVariantRepository;
        this.cartItemRepository = cartItemRepository;
        this.courierService = courierService;
    }

    /** One validated, priced order line (prices always come from the DB, never from the client). */
    private record OrderLine(Product product, ProductVariant variant, int quantity,
                             BigDecimal unitPrice, BigDecimal weightKg) {
    }

    // ------------------------------------------------------------------
    // Create order
    // ------------------------------------------------------------------

    @Transactional
    public OrderResponseDto createOrder(CreateOrderRequestDto request) {
        if (request == null || request.getUserId() == null) {
            throw new BadRequestException("userId is required");
        }
        List<OrderItemRequestDto> requestedItems = request.getItems();
        if (requestedItems == null || requestedItems.isEmpty()) {
            throw new BadRequestException("At least one order item is required");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.isBlacklisted()) {
            throw new ForbiddenOperationException(
                    "Your account is blacklisted due to repeated rejected COD deliveries. "
                            + "You cannot place new orders. Please contact support.");
        }

        // Fall back to the user's saved address / coordinates when the request omits them
        String address = firstNonBlank(request.getDeliveryAddress(), user.getDeliveryAddress());
        if (address == null) {
            throw new BadRequestException("A delivery address is required");
        }
        BigDecimal latitude = request.getDeliveryLatitude();
        BigDecimal longitude = request.getDeliveryLongitude();
        if (latitude == null && longitude == null) {
            latitude = user.getLatitude();
            longitude = user.getLongitude();
        }

        // 1) Validate items and price them from the database
        List<OrderLine> lines = resolveLines(requestedItems);

        BigDecimal itemsTotal = lines.stream()
                .map(l -> l.unitPrice().multiply(BigDecimal.valueOf(l.quantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalWeightKg = lines.stream()
                .map(OrderLine::weightKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);

        // 2) Courier fee (also validates the delivery location)
        CourierCalculateResponseDto courier = courierService.validateAndCalculateFee(
                new CourierCalculateRequestDto(latitude, longitude, totalWeightKg));
        if (!courier.isWithinColombo()) {
            throw new BadRequestException(courier.getMessage());
        }
        BigDecimal courierFee = courier.getEstimatedCourierFee();
        BigDecimal totalAmount = itemsTotal.add(courierFee).setScale(2, RoundingMode.HALF_UP);

        // 3) Real-time stock deduction. Atomic per row; any failure rolls back the whole transaction.
        for (OrderLine line : lines) {
            int updated = productRepository.deductStock(line.product().getId(), line.quantity());
            if (updated == 0) {
                throw new ConflictException("Insufficient stock for '" + line.product().getName() + "'");
            }
        }

        // 4) Persist order + items
        Order order = new Order();
        order.setUser(user);
        order.setItemsTotal(itemsTotal);
        order.setCourierFee(courierFee);
        order.setTotalAmount(totalAmount);
        order.setTotalWeightKg(totalWeightKg);
        order.setUrgent(request.isUrgent());
        order.setPaymentMethod(BusinessRules.PAYMENT_COD);
        order.setStatus(BusinessRules.STATUS_PENDING);
        order.setDeliveryAddress(address);
        order.setDeliveryLatitude(latitude);
        order.setDeliveryLongitude(longitude);
        Order savedOrder = orderRepository.save(order);

        List<OrderItem> orderItems = new ArrayList<>();
        for (OrderLine line : lines) {
            OrderItem item = new OrderItem();
            item.setOrder(savedOrder);
            item.setProduct(line.product());
            item.setVariant(line.variant());
            item.setQuantity(line.quantity());
            item.setUnitPrice(line.unitPrice());
            orderItems.add(item);
        }
        orderItemRepository.saveAll(orderItems);

        // 5) Clear the ordered items from the user's cart (only SELECTED cart rows that were ordered)
        clearOrderedSelectedItems(user.getId(), lines);

        log.info("Order {} created for user {} (urgent={})", savedOrder.getId(), user.getId(), savedOrder.isUrgent());
        return toOrderResponse(savedOrder);
    }

    private List<OrderLine> resolveLines(List<OrderItemRequestDto> requestedItems) {
        for (OrderItemRequestDto item : requestedItems) {
            if (item == null || item.getProductId() == null) {
                throw new BadRequestException("Every order item needs a productId");
            }
            if (item.getQuantity() == null || item.getQuantity() < 1) {
                throw new BadRequestException("Every order item needs a quantity of at least 1");
            }
        }

        // Process in a fixed order so concurrent orders lock product rows in the same sequence (no deadlocks)
        List<OrderItemRequestDto> sorted = new ArrayList<>(requestedItems);
        sorted.sort(Comparator.comparing(OrderItemRequestDto::getProductId)
                .thenComparing(OrderItemRequestDto::getVariantId, Comparator.nullsFirst(Comparator.naturalOrder())));

        List<OrderLine> lines = new ArrayList<>();
        for (OrderItemRequestDto item : sorted) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + item.getProductId()));

            ProductVariant variant = null;
            if (item.getVariantId() != null) {
                variant = productVariantRepository.findById(item.getVariantId())
                        .orElseThrow(() -> new ResourceNotFoundException("Product variant not found: " + item.getVariantId()));
                if (!variant.getProduct().getId().equals(product.getId())) {
                    throw new BadRequestException("Variant " + variant.getId()
                            + " does not belong to product " + product.getId());
                }
            }

            int quantity = item.getQuantity();
            BigDecimal unitPrice = variant != null ? variant.getPrice() : product.getBasePrice();
            BigDecimal weightKg = variant != null
                    ? variant.getWeightInKg().multiply(BigDecimal.valueOf(quantity))
                    : BigDecimal.ZERO;
            lines.add(new OrderLine(product, variant, quantity, unitPrice, weightKg));
        }
        return lines;
    }

    private void clearOrderedSelectedItems(Integer userId, List<OrderLine> lines) {
        Set<String> orderedKeys = new HashSet<>();
        for (OrderLine line : lines) {
            orderedKeys.add(lineKey(line.product().getId(), line.variant() == null ? null : line.variant().getId()));
        }
        List<CartItem> toRemove = cartItemRepository.findByUserIdAndIsSelectedTrue(userId).stream()
                .filter(ci -> orderedKeys.contains(lineKey(ci.getProduct().getId(),
                        ci.getVariant() == null ? null : ci.getVariant().getId())))
                .toList();
        cartItemRepository.deleteAll(toRemove);
    }

    private static String lineKey(Integer productId, Integer variantId) {
        return productId + ":" + (variantId == null ? "-" : variantId);
    }

    // ------------------------------------------------------------------
    // Cancel order (48-hour rule)
    // ------------------------------------------------------------------

    @Transactional
    public OrderResponseDto cancelOrder(Integer orderId, Integer userId) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        // Same "not found" for someone else's order so order IDs cannot be probed
        if (userId == null || !order.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Order not found");
        }

        String status = order.getStatus();
        if (BusinessRules.STATUS_CANCELLED.equals(status)) {
            throw new BadRequestException("Order is already cancelled");
        }
        if (!BusinessRules.STATUS_PENDING.equals(status) && !BusinessRules.STATUS_PROCESSING.equals(status)) {
            throw new BadRequestException("An order with status " + status + " cannot be cancelled");
        }

        Duration age = Duration.between(order.getCreatedAt(), LocalDateTime.now());
        if (age.compareTo(Duration.ofHours(BusinessRules.CANCELLATION_WINDOW_HOURS)) > 0) {
            throw new BadRequestException("Order cannot be cancelled after 48 hours");
        }

        for (OrderItem item : orderItemRepository.findByOrderId(orderId)) {
            productRepository.restoreStock(item.getProduct().getId(), item.getQuantity());
        }
        order.setStatus(BusinessRules.STATUS_CANCELLED);
        Order saved = orderRepository.save(order);

        log.info("Order {} cancelled by user {}; stock restored", orderId, userId);
        return toOrderResponse(saved);
    }

    // ------------------------------------------------------------------
    // Admin operations
    // ------------------------------------------------------------------

    @Transactional
    public OrderResponseDto updateOrderStatus(Integer orderId, String newStatus) {
        if (newStatus == null || newStatus.isBlank()) {
            throw new BadRequestException("Status is required");
        }
        String status = newStatus.trim().toUpperCase(Locale.ROOT);
        if (!BusinessRules.ADMIN_SETTABLE_STATUSES.contains(status)) {
            throw new BadRequestException("Invalid status. Allowed values: PENDING, PROCESSING, SHIPPED, DELIVERED");
        }

        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (BusinessRules.STATUS_CANCELLED.equals(order.getStatus())
                || BusinessRules.STATUS_REJECTED.equals(order.getStatus())) {
            throw new BadRequestException("The status of a " + order.getStatus() + " order cannot be changed");
        }

        order.setStatus(status);
        return toOrderResponse(orderRepository.save(order));
    }

    /**
     * A COD parcel was rejected at the door: +1 penalty point, auto-blacklist once penaltyCount exceeds 5.
     * Returns the user's updated profile.
     */
    @Transactional
    public UserProfileResponseDto handleDeliveryRejection(Integer orderId) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!BusinessRules.PAYMENT_COD.equalsIgnoreCase(order.getPaymentMethod())) {
            throw new BadRequestException("Only COD orders can be penalised for delivery rejection");
        }
        // Also prevents penalising the same order twice (status becomes REJECTED below)
        if (!BusinessRules.STATUS_SHIPPED.equals(order.getStatus())) {
            throw new BadRequestException("Only SHIPPED orders can be marked as rejected at delivery");
        }

        User user = order.getUser();
        int penalties = (user.getPenaltyCount() == null ? 0 : user.getPenaltyCount()) + 1;
        user.setPenaltyCount(penalties);
        if (penalties > BusinessRules.MAX_PENALTY_POINTS && !user.isBlacklisted()) {
            user.setBlacklisted(true);
            log.warn("User {} auto-blacklisted after {} rejected COD deliveries", user.getId(), penalties);
        }

        order.setStatus(BusinessRules.STATUS_REJECTED);
        orderRepository.save(order);
        userRepository.save(user);

        log.info("Delivery rejection recorded for order {}; user {} now has {} penalty point(s)",
                orderId, user.getId(), penalties);
        return AuthService.toProfileDto(user);
    }

    @Transactional
    public UserProfileResponseDto adminUnblockUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setPenaltyCount(0);
        user.setBlacklisted(false);
        userRepository.save(user);

        log.info("User {} unblocked by admin; penalties reset", userId);
        return AuthService.toProfileDto(user);
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDto> getUrgentOrders() {
        return orderRepository.findByIsUrgentTrueOrderByCreatedAtDesc().stream()
                .map(OrderService::toOrderResponse)
                .toList();
    }

    /** Order tracking / history for one customer, newest first. */
    @Transactional(readOnly = true)
    public List<OrderResponseDto> getUserOrders(Integer userId) {
        if (userId == null || !userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found");
        }
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(OrderService::toOrderResponse)
                .toList();
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private static OrderResponseDto toOrderResponse(Order order) {
        return new OrderResponseDto(order.getId(), order.getTotalAmount(), order.getItemsTotal(),
                order.getCourierFee(), order.getTotalWeightKg(), order.isUrgent(), order.getStatus(),
                order.getCreatedAt(), order.getDeliveryAddress());
    }

    private static String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first.trim();
        }
        if (second != null && !second.isBlank()) {
            return second.trim();
        }
        return null;
    }
}
