import { PERMISSIONS } from "./permissions.js";

export const ADMIN_ROLE_PERMISSIONS = {
  // Product managers → inventory & products
  product_manager: [PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_WRITE],

  // Order managers → orders only
  order_manager: [
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_WRITE,
    PERMISSIONS.RECOVERY_READ,
    PERMISSIONS.RECOVERY_WRITE,
  ],

  // Support → refunds & recovery
  customer_support: [PERMISSIONS.REFUND_READ],

  // Supervisors → READ ONLY
  supervisor: [
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.REFUND_READ,
    // PERMISSIONS.USER_READ,
    PERMISSIONS.AUDIT_READ,
  ],

  // Super admin → EVERYTHING
  super_admin: Object.values(PERMISSIONS),
};
