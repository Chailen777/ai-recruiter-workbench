-- CreateTable
CREATE TABLE "Note" (
    "id"         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content"    TEXT NOT NULL,
    "type"       TEXT NOT NULL DEFAULT 'note',
    "entityType" TEXT NOT NULL DEFAULT 'global',
    "entityId"   INTEGER NOT NULL DEFAULT 0,
    "pinned"     BOOLEAN NOT NULL DEFAULT false,
    "done"       BOOLEAN NOT NULL DEFAULT false,
    "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Note_entityType_entityId_idx" ON "Note"("entityType", "entityId");
