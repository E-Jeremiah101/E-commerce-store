export const ADMIN_ROLES = {
  SUPER_ADMIN: "super_admin",
  PRODUCT_MANAGER: "product_manager",
  ORDER_MANAGER: "order_manager",
  CUSTOMER_SUPPORT: "customer_support",
  SUPERVISOR: "supervisor",
};

export const ROLE_PERMISSIONS = {
  super_admin: {
    tabs: [
      "create",
      "products",
      "inventory",
      "analytics",
      "AdminOrder",
      "AdminRefunds",
      "AllUsers",
      "OrderRecovery",
      "Transactions",
      "audit",
      "Settings",
    ],
    canEdit: true,
    canDelete: true,
    canApproveRefunds: true,
    canSeeUsers: true,
    readOnly: false,
  },
  product_manager: {
    tabs: ["create", "products", "inventory"],
    canEdit: true,
    canDelete: true,
    canApproveRefunds: false,
    canSeeUsers: false,
    readOnly: false,
  },
  order_manager: {
    tabs: ["AdminOrder"],
    canEdit: true,
    canDelete: false,
    canApproveRefunds: true, // Order manager can approve refunds
    canSeeUsers: false,
    readOnly: false,
  },
  customer_support: {
    tabs: ["AdminRefunds"],
    canEdit: false, // Can only view refunds, not approve/decline
    canDelete: false,
    canApproveRefunds: false,
    canSeeUsers: false,
    readOnly: true, // For refunds tab
  },
  supervisor: {
    tabs: [
      "create",
      "products",
      "inventory",
      "analytics",
      "AdminOrder",
      "AdminRefunds",
      "OrderRecovery",
      "Transactions",
      "audit",
      "Settings",
    ],
    canEdit: false,
    canDelete: false,
    canApproveRefunds: false,
    canSeeUsers: false, // Cannot see user management
    readOnly: true,
  },
};
