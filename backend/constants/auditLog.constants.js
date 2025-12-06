// constants/audit.constants.js
export const ENTITY_TYPES = {
  PRODUCT: "Product",
  ORDER: "Order",
  USER: "User",
  CATEGORY: "Category",
  SYSTEM: "System",
  OTHER: "Other",
};

export const ACTIONS = {
  // Product actions
  CREATE_PRODUCT: "CREATE_PRODUCT",
  UPDATE_PRODUCT: "UPDATE_PRODUCT",
  DELETE_PRODUCT: "DELETE_PRODUCT",
  RESTORE_PRODUCT: "RESTORE_PRODUCT",
  PERMANENT_DELETE_PRODUCT: "PERMANENT_DELETE_PRODUCT",
  TOGGLE_FEATURED: "TOGGLE_FEATURED",
  UPDATE_INVENTORY: "UPDATE_INVENTORY",

  // Order actions
  UPDATE_ORDER_STATUS: "UPDATE_ORDER_STATUS",
  ORDER_RECOVERY_ATTEMPT: "ORDER_RECOVERY_ATTEMPT",
  ORDER_RECOVERY_SUCCESS: "ORDER_RECOVERY_SUCCESS",
  ORDER_RECOVERY_FAILED: "ORDER_RECOVERY_FAILED",
  ORDER_RECOVERY_DUPLICATE: "ORDER_RECOVERY_DUPLICATE",
  CREATE_ORDER: "CREATE_ORDER",
  CREATE_ORDER_FAILED: "CREATE_ORDER_FAILED",
  VIEW_ORDERS_SEARCH: "VIEW_ORDERS_SEARCH",
  VIEW_ORDER_DETAILS: "VIEW_ORDER_DETAILS",
  VIEW_USER_ORDERS: "VIEW_USER_ORDERS",

  // Category actions
  CREATE_CATEGORY: "CREATE_CATEGORY",
  UPDATE_CATEGORY: "UPDATE_CATEGORY",

  // User actions
  UPDATE_USER_ROLE: "UPDATE_USER_ROLE",

  // Auth actions
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  OTHER: "OTHER",
};

// For frontend display (human readable)
export const ACTION_LABELS = {
  // Product labels
  CREATE_PRODUCT: "Create Product",
  UPDATE_PRODUCT: "Update Product",
  DELETE_PRODUCT: "Delete Product",
  RESTORE_PRODUCT: "Restore Product",
  PERMANENT_DELETE_PRODUCT: "Permanent Delete",
  TOGGLE_FEATURED: "Toggle Featured",
  UPDATE_INVENTORY: "Update Inventory",

  // Order labels
  UPDATE_ORDER_STATUS: "Update Order Status",
  ORDER_RECOVERY_ATTEMPT: "Order Recovery Attempt",
  ORDER_RECOVERY_SUCCESS: "Order Recovery Success",
  ORDER_RECOVERY_FAILED: "Order Recovery Failed",
  ORDER_RECOVERY_DUPLICATE: "Order Recovery Duplicate",
  CREATE_ORDER: "Create Order",
  CREATE_ORDER_FAILED: "Create Order Failed",
  VIEW_ORDERS_SEARCH: "View Orders Search",
  VIEW_ORDER_DETAILS: "View Order Details",
  VIEW_USER_ORDERS: "View User Orders",

  // Category labels
  CREATE_CATEGORY: "Create Category",
  UPDATE_CATEGORY: "Update Category",

  // User labels
  UPDATE_USER_ROLE: "Update User Role",

  // Auth labels
  LOGIN: "Login",
  LOGOUT: "Logout",
  OTHER: "Other",
};

export const ENTITY_TYPE_LABELS = {
  Product: "Product",
  Order: "Order",
  User: "User",
  Category: "Category",
  System: "System",
  Other: "Other",
};
