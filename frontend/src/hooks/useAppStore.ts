import { create } from 'zustand';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // Telegram Stars 数量
  image?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface AppState {
  // 用户状态
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;

  // 购物车
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;

  // 加载状态
  isLoading: boolean;
  setLoading: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 用户状态
  isAuthenticated: false,
  setAuthenticated: (value) => set({ isAuthenticated: value }),

  // 购物车
  cart: [],
  addToCart: (product) =>
    set((state) => {
      const existing = state.cart.find((item) => item.product.id === product.id);
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return { cart: [...state.cart, { product, quantity: 1 }] };
    }),
  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.product.id !== productId),
    })),
  clearCart: () => set({ cart: [] }),
  getCartTotal: () => {
    const { cart } = get();
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  },

  // 加载状态
  isLoading: false,
  setLoading: (value) => set({ isLoading: value }),
}));
