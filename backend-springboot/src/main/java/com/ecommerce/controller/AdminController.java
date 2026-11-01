package com.ecommerce.controller;

import com.ecommerce.model.Order;
import com.ecommerce.model.Product;
import com.ecommerce.model.ProductVariant;
import com.ecommerce.model.User;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ProductVariantRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminController {

    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;

    public AdminController(OrderService orderService,
                           OrderRepository orderRepository,
                           UserRepository userRepository,
                           ProductRepository productRepository,
                           ProductVariantRepository productVariantRepository) {
        this.orderService = orderService;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.productVariantRepository = productVariantRepository;
    }

    // 1. 🚀 සියලුම Orders ලබා ගැනීම (Dashboard එක සඳහා)
    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderRepository.findAll());
    }

    // 2. ⚡ හදිසි ඇණවුම් (Urgent Orders) ලබා ගැනීම
    @GetMapping("/orders/urgent")
    public ResponseEntity<List<Order>> getUrgentOrders() {
        return ResponseEntity.ok(orderRepository.findByIsUrgentTrueOrderByCreatedAtDesc());
    }

    // 3. Order Status එක වෙනස් කිරීම
    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<Void> updateOrderStatus(@PathVariable Integer orderId, @RequestParam String status) {
        orderService.updateOrderStatus(orderId, status);
        return ResponseEntity.ok().build();
    }

    // 4. COD Delivery Rejection සටහන් කිරීම (+1 Penalty)
    @PostMapping("/orders/{orderId}/reject-delivery")
    public ResponseEntity<Void> rejectDelivery(@PathVariable Integer orderId) {
        orderService.handleDeliveryRejection(orderId);
        return ResponseEntity.ok().build();
    }

    // 5. 🚀 සියලුම Users ලැයිස්තුව ලබා ගැනීම (Blacklist & Penalties බැලීමට)
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // 6. User ව Unblock කිරීම සහ Penalties Reset කිරීම
    @PostMapping("/users/{userId}/unblock")
    public ResponseEntity<Void> unblockUser(@PathVariable Integer userId) {
        orderService.adminUnblockUser(userId);
        return ResponseEntity.ok().build();
    }

    // 7. නව Product එකක් ඇතුළත් කිරීම
    @PostMapping("/products")
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        return ResponseEntity.ok(productRepository.save(product));
    }

    // 8. Product එකක් Delete කිරීම
    @DeleteMapping("/products/{productId}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Integer productId) {
        productRepository.deleteById(productId);
        return ResponseEntity.ok().build();
    }

    // 9. Weight Variant එකක් ඇතුළත් කිරීම
    @PostMapping("/variants")
    public ResponseEntity<?> createVariant(@RequestBody java.util.Map<String, Object> body) {
        try {
            // Frontend එකෙන් එන Product ID එක ලබාගෙන Product එක සොයා ගැනීම
            Integer productId = Integer.valueOf(body.get("productId").toString());
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            ProductVariant variant = new ProductVariant();
            variant.setProduct(product);

            // weightLabel හෝ weight අගය ලබා ගැනීම (උදා: 200g)
            String weight = body.containsKey("weightLabel") ? body.get("weightLabel").toString()
                    : body.containsKey("weight") ? body.get("weight").toString() : "Standard";
            variant.setWeight(weight);

            // weightKg හෝ weightInKg අගය ලබා ගැනීම (උදා: 0.2)
            Object kgObj = body.containsKey("weightKg") ? body.get("weightKg") : body.get("weightInKg");
            java.math.BigDecimal weightInKg = kgObj != null
                    ? new java.math.BigDecimal(kgObj.toString())
                    : java.math.BigDecimal.valueOf(0.5);
            variant.setWeightInKg(weightInKg);

            // මිල ලබා ගැනීම
            java.math.BigDecimal price = new java.math.BigDecimal(body.get("price").toString());
            variant.setPrice(price);

            // Database එකේ Save කිරීම
            ProductVariant saved = productVariantRepository.save(variant);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Could not create variant: " + e.getMessage()));
        }
    }

    // 🚀 Image File එක Upload කර Backend එකේ uploads/ folder එකේ Save කිරීම:
    @PostMapping(value = "/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<java.util.Map<String, String>> uploadImage(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            // 1. uploads/ folder එක නැත්නම් සෑදීම
            java.nio.file.Path uploadPath = java.nio.file.Paths.get("uploads");
            if (!java.nio.file.Files.exists(uploadPath)) {
                java.nio.file.Files.createDirectories(uploadPath);
            }

            // 2. File එකට Unique නමක් ලබා දී Save කිරීම
            String filename = java.util.UUID.randomUUID().toString() + "_" + file.getOriginalFilename().replaceAll("\\s+", "_");
            java.nio.file.Path filePath = uploadPath.resolve(filename);
            java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            // 3. Image එකට අදාළ Full URL එක ආපසු යැවීම
            String imageUrl = "http://localhost:8081/uploads/" + filename;
            return ResponseEntity.ok(java.util.Map.of("imageUrl", imageUrl));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("message", "Image upload failed: " + e.getMessage()));
        }
    }

}