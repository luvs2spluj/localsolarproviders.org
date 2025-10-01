-- CreateTable
CREATE TABLE "installers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "osmId" TEXT,
    "name" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lon" REAL NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postal" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastScannedAt" DATETIME
);

-- CreateTable
CREATE TABLE "specialties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "installer_specialties" (
    "installerId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    CONSTRAINT "installer_specialties_installerId_fkey" FOREIGN KEY ("installerId") REFERENCES "installers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "installer_specialties_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "specialties" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "external_links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "installerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "external_links_installerId_fkey" FOREIGN KEY ("installerId") REFERENCES "installers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "scan_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "installerId" TEXT,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "scan_logs_installerId_fkey" FOREIGN KEY ("installerId") REFERENCES "installers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "installers_osmId_key" ON "installers"("osmId");

-- CreateIndex
CREATE UNIQUE INDEX "specialties_slug_key" ON "specialties"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "installer_specialties_installerId_specialtyId_key" ON "installer_specialties"("installerId", "specialtyId");
