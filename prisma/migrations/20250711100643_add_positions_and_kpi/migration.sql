-- CreateTable
CREATE TABLE "Position" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "strategyId" INTEGER NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "openTime" DATETIME NOT NULL,
    "closeTime" DATETIME,
    "openPrice" REAL NOT NULL,
    "closePrice" REAL,
    "quantity" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "pnl" REAL,
    CONSTRAINT "Position_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KPI" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "strategyId" INTEGER NOT NULL,
    "pnl" REAL NOT NULL,
    "winRate" REAL NOT NULL,
    "trades" INTEGER NOT NULL,
    "maxDrawdown" REAL NOT NULL,
    CONSTRAINT "KPI_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "KPI_strategyId_key" ON "KPI"("strategyId");
