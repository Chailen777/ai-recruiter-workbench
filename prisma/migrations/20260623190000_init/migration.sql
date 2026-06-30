CREATE TABLE IF NOT EXISTS "Company" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "industry" TEXT,
  "city" TEXT,
  "source" TEXT,
  "cooperationStatus" TEXT,
  "note" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Job" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "companyId" INTEGER,
  "companyName" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "city" TEXT,
  "salaryRange" TEXT,
  "educationRequirement" TEXT,
  "ageRequirement" TEXT,
  "experienceRequirement" TEXT,
  "industryRequirement" TEXT,
  "skillKeywords" TEXT,
  "mustHave" TEXT,
  "niceToHave" TEXT,
  "exclusions" TEXT,
  "jdRaw" TEXT,
  "status" TEXT NOT NULL DEFAULT '开放',
  "source" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Candidate" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "currentTitle" TEXT,
  "currentCompany" TEXT,
  "city" TEXT,
  "education" TEXT,
  "age" INTEGER,
  "yearsOfWork" INTEGER,
  "expectedSalary" TEXT,
  "skillTags" TEXT,
  "industryBg" TEXT,
  "resumeRaw" TEXT,
  "communication" TEXT NOT NULL DEFAULT '待跟进',
  "note" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Job_companyId_idx" ON "Job"("companyId");
