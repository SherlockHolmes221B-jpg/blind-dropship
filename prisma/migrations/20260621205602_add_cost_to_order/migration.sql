-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderNumber" TEXT NOT NULL,
    "ebayOrderId" TEXT NOT NULL DEFAULT '',
    "customerId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "supplierId" INTEGER,
    "assignedToId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" REAL NOT NULL,
    "cost" REAL NOT NULL DEFAULT 0,
    "shippingCost" REAL NOT NULL DEFAULT 0,
    "tax" REAL NOT NULL DEFAULT 0,
    "fee" REAL NOT NULL DEFAULT 0,
    "profit" REAL NOT NULL DEFAULT 0,
    "trackingNumber" TEXT NOT NULL DEFAULT '',
    "shippingCarrier" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "orderedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shippedAt" DATETIME,
    "deliveredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("assignedToId", "createdAt", "customerId", "deliveredAt", "ebayOrderId", "fee", "id", "notes", "orderNumber", "orderedAt", "productId", "profit", "quantity", "shippedAt", "shippingCarrier", "shippingCost", "status", "supplierId", "tax", "totalPrice", "trackingNumber", "updatedAt") SELECT "assignedToId", "createdAt", "customerId", "deliveredAt", "ebayOrderId", "fee", "id", "notes", "orderNumber", "orderedAt", "productId", "profit", "quantity", "shippedAt", "shippingCarrier", "shippingCost", "status", "supplierId", "tax", "totalPrice", "trackingNumber", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
