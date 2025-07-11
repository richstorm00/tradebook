-- CreateTable
CREATE TABLE "Strategy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "bot" TEXT,
    "tags" TEXT,
    "webhook" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "strategyId" INTEGER NOT NULL,
    "symbol" TEXT NOT NULL,
    "entry" REAL NOT NULL,
    "leverage" INTEGER NOT NULL,
    "current" REAL NOT NULL,
    "pnl" REAL NOT NULL,
    "pnlPercent" REAL NOT NULL,
    "win" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Trade_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
