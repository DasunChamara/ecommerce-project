import type {
  AddCartItemRequest,
  AuthResponse,
  CartItem,
  CourierCalculateRequest,
  CourierCalculateResponse,
  CreateProductRequest,
  CreateVariantRequest,
  Order,
  PlaceOrderRequest,
  Product,
  ProductVariant,
  UpdateCartItemRequest,
  UpdateOrderStatusRequest,
  UpdateProductRequest,
  User,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081/api";
const TOKEN_KEY = "token";

// ---------------------------------------------------------------------------
// Error & Token Handling
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) return token;

  // LocalStorage එකේ user විස්තර ඇත්නම් Login වී ඇති බව තහවුරු කිරීම:
  const user = localStorage.getItem("user");
  if (user) {
    try {
      const parsed = JSON.parse(user);
      return parsed.token || `session-token-${parsed.userId || parsed.id || 1}`;
    } catch {
      return null;
    }
  }
  return null;




}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// Native Fetch Request Wrapper (JWT Auto-attached)
// ---------------------------------------------------------------------------

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = false, headers, ...rest } = options;
  const token = auth ? getToken() : null;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message: unknown }).message)
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

// ---------------------------------------------------------------------------
// Auth Types & Helpers
// ---------------------------------------------------------------------------

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface RegisterRequest {
  phoneNumber: string;
  fullName: string;
  email?: string;
  password: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface ParsedApiError {
  status?: number;
  code?: string;
  message: string;
  network: boolean;
}

export function parseApiError(err: unknown): ParsedApiError {
  const e = err as any;
  const status: number | undefined = e?.response?.status ?? e?.status;
  const data = e?.response?.data ?? e?.data ?? e?.body;
  const network = !e?.response && !e?.status;

  const message: string =
    (typeof data === "string" ? data : undefined) ??
    data?.message ??
    data?.error ??
    (network ? "Can't reach the server. Check your connection and try again." : undefined) ??
    e?.message ??
    "Something went wrong. Please try again.";

  return { status, code: data?.code ?? data?.errorCode, message, network };
}

export function isBlacklistedError(p: ParsedApiError): boolean {
  return (
    p.code === "BLACKLISTED" ||
    p.code === "ACCOUNT_BLACKLISTED" ||
    /black.?list|blocked/i.test(p.message)
  );
}

export function normalizeSriLankanPhone(input: string): string {
  let p = input.replace(/[\s-]/g, "");
  if (p.startsWith("+94")) p = "0" + p.slice(3);
  else if (p.startsWith("94") && p.length === 11) p = "0" + p.slice(2);
  return p;
}

export const isValidSriLankanPhone = (p: string) => /^0[1-9]\d{8}$/.test(p);

// ---------------------------------------------------------------------------
// 1. Auth API
// ---------------------------------------------------------------------------



export const authApi = {
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  register: (data: any) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getProfile: (userId: number) =>
    request<User>(`/auth/profile/${userId}`, {
      auth: true,
    }),
};


// ---------------------------------------------------------------------------
// 2. Products API
// ---------------------------------------------------------------------------

export const productsApi = {
  getAll: () => request<Product[]>("/products"),

  getById: (id: number) => request<Product>(`/products/${id}`),

  getSpecials: () => request<Product[]>("/products/special"),
  getSpecial: () => request<Product[]>("/products/special"),

  getVariants: (productId: number) =>
    request<ProductVariant[]>(`/products/${productId}/variants`),
};

// ---------------------------------------------------------------------------
// 3. Cart API
// ---------------------------------------------------------------------------

export const cartApi = {
  getItems: (userId?: number) =>
    request<CartItem[]>(userId ? `/cart/${userId}` : "/cart/1", { auth: true }),

  getCart: (userId?: number) =>
    request<CartItem[]>(userId ? `/cart/${userId}` : "/cart/1", { auth: true }),

  addItem: (body: AddCartItemRequest) =>
    request<CartItem>("/cart/1/add", {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
    }),

  addToCart: (userId: number, body: any) =>
    request<CartItem>(`/cart/${userId}/add`, {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
    }),

  updateQuantity: (cartItemId: number, body: UpdateCartItemRequest | number) =>
    request<CartItem>(`/cart/item/${cartItemId}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(typeof body === "number" ? { quantity: body } : body),
    }),

  setSelected: (cartItemId: number, isSelected: boolean) =>
    request<CartItem>(`/cart/item/${cartItemId}/select?isSelected=${isSelected}`, {
      method: "PUT",
      auth: true,
    }),

  toggleItemSelect: (cartItemId: number, isSelected: boolean) =>
    request<CartItem>(`/cart/item/${cartItemId}/select?isSelected=${isSelected}`, {
      method: "PUT",
      auth: true,
    }),

  removeItem: (cartItemId: number) =>
    request<void>(`/cart/item/${cartItemId}`, {
      method: "DELETE",
      auth: true,
    }),

  removeFromCart: (cartItemId: number | string) =>
    request<void>(`/cart/item/${cartItemId}`, {
      method: "DELETE",
      auth: true,
    }),
};

// ---------------------------------------------------------------------------
// 4. Courier / PickMe API
// ---------------------------------------------------------------------------

export const courierApi = {
  calculate: (body: CourierCalculateRequest) =>
    request<CourierCalculateResponse>("/courier/calculate-fee", {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
    }),

  calculateCourierFee: (lat: number, lng: number, totalWeightKg: number) =>
    request<CourierCalculateResponse>("/courier/calculate-fee", {
      method: "POST",
      auth: true,
      body: JSON.stringify({
        deliveryLatitude: lat,
        deliveryLongitude: lng,
        totalWeightKg,
      }),
    }),
};

// ---------------------------------------------------------------------------
// 5. Orders API
// ---------------------------------------------------------------------------

export const ordersApi = {
  place: (body: PlaceOrderRequest) =>
    request<Order>("/orders", {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
    }),

  createOrder: (body: any) =>
    request<Order>("/orders", {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
    }),

  getMine: () => request<Order[]>("/orders", { auth: true }),

  getUserOrders: (userId: number) =>
    request<Order[]>(`/orders/user/${userId}`, { auth: true }),

  getById: (orderId: number) =>
    request<Order>(`/orders/${orderId}`, { auth: true }),

  cancelOrder: (orderId: number, userId: number) =>
    request<Order>(`/orders/${orderId}/cancel?userId=${userId}`, {
      method: "POST",
      auth: true,
    }),
};

// ---------------------------------------------------------------------------
// 6. Admin API
// ---------------------------------------------------------------------------

export const adminApi = {
  getUsers: () => request<User[]>("/admin/users", { auth: true }),

  setBlacklisted: (userId: number, isBlacklisted: boolean) =>
    request<User>(`/admin/users/${userId}/blacklist`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify({ isBlacklisted }),
    }),

  unblockUser: (userId: number) =>
    request<void>(`/admin/users/${userId}/unblock`, {
      method: "POST",
      auth: true,
    }),

  getOrders: () => request<Order[]>("/admin/orders", { auth: true }),

  getUrgentOrders: () => request<Order[]>("/admin/orders/urgent", { auth: true }),

  updateOrderStatus: (orderId: number, status: string) =>
    request<Order>(`/admin/orders/${orderId}/status?status=${status}`, {
      method: "PUT",
      auth: true,
    }),

  rejectDelivery: (orderId: number) =>
    request<void>(`/admin/orders/${orderId}/reject-delivery`, {
      method: "POST",
      auth: true,
    }),

  createProduct: (body: CreateProductRequest) =>
    request<Product>("/admin/products", {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
    }),

  updateProduct: (productId: number, body: UpdateProductRequest) =>
    request<Product>(`/admin/products/${productId}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(body),
    }),

  deleteProduct: (productId: number) =>
    request<void>(`/admin/products/${productId}`, {
      method: "DELETE",
      auth: true,
    }),

  createVariant: (body: CreateVariantRequest) =>
    request<ProductVariant>("/admin/variants", {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
    }),

  uploadImage: async (file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const token = getToken();

    const res = await fetch("http://localhost:8081/api/admin/upload", {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) throw new Error("Image upload failed");
    return res.json();
  },
};