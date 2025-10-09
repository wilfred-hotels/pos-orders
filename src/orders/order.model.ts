export interface OrderItem {
  productId: number;
  quantity: number;
}

export interface Order {
  id: number;
  items: OrderItem[];
  total: number;
  createdAt: string;
  source: 'ecom' | 'pos';
}
