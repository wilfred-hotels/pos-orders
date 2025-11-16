export const AVAILABLE_ROLES = ['customer', 'cashier', 'manager', 'admin', 'super_admin'] as const;
export type Role = (typeof AVAILABLE_ROLES)[number];

export const DEFAULT_ROLE: Role = 'customer';
