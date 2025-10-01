-- CreateTable
CREATE TABLE "search_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engine" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "snippet" TEXT NOT NULL,
    "sourceRank" INTEGER NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hash" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "search_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engine" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "message" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "search_results_hash_key" ON "search_results"("hash");
