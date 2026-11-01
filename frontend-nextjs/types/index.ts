export interface User {
  id: number;
  email: string;
  phoneNumber: string;
  deliveryAddress: string;
  latitude: number;
  longitude: number;
  role: string;
  penaltyCount: number;
  isBlacklisted: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  stockQuantity: number;
  imageUrl: string;
  isSpecial: boolean;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: number;
  productId: number;
  weight: string;
  weightInKg: number;
  price: number;
}

export interface CartItem {
  cartItemId: number;
  productId: number;
  productName: string;
  variantId: number;
  weight: string;
  unitPrice: number;
  quantity: number;
  isSelected: boolean;
  totalPrice: number;
}

export interface Order {
  orderId: number;
  totalAmount: number;
  itemsTotal: number;
  courierFee: number;
  totalWeightKg: number;
  isUrgent: boolean;
  status: string;
  createdAt: string;
  deliveryAddress: string;
}

export interface CourierCalculateResponse {
  isWithinColombo: boolean;
  distanceKm: number;
  estimatedCourierFee: number;
  message: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  role: string;
  isBlacklisted: boolean;
  penaltyCount: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  phoneNumber: string;
  deliveryAddress: string;
  latitude: number;
  longitude: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AddCartItemRequest {
  productId: number;
  variantId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CourierCalculateRequest {
  latitude: number;
  longitude: number;
  totalWeightKg: number;
}

export interface PlaceOrderRequest {
  isUrgent: boolean;
  deliveryAddress?: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  basePrice: number;
  stockQuantity: number;
  imageUrl: string;
  isSpecial: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  basePrice?: number;
  stockQuantity?: number;
  imageUrl?: string;
  isSpecial?: boolean;
}

export interface CreateVariantRequest {
  productId: number;
  weight: string;
  weightInKg: number;
  price: number;
}

export interface UpdateOrderStatusRequest {
  status: string;
}
