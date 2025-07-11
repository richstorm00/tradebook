-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Strategy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "bot" TEXT,
    "tags" TEXT,
    "webhook" TEXT,
    "capital" REAL,
    "momentumConfig" JSONB,
    "status" TEXT NOT NULL DEFAULT 'stopped',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Strategy" ("bot", "capital", "createdAt", "id", "momentumConfig", "name", "tags", "type", "webhook") SELECT "bot", "capital", "createdAt", "id", "momentumConfig", "name", "tags", "type", "webhook" FROM "Strategy";
DROP TABLE "Strategy";
ALTER TABLE "new_Strategy" RENAME TO "Strategy";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
