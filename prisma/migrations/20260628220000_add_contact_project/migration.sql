-- CreateTable: Contact (人脉库)
CREATE TABLE "Contact" (
    "id"                INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    -- 基础信息
    "name"              TEXT NOT NULL,
    "gender"            TEXT,
    "phone"             TEXT,
    "wechat"            TEXT,
    "email"             TEXT,
    -- 个人信息
    "age"               INTEGER,
    "birthday"          DATETIME,
    "birthdayType"      TEXT,     -- 阳历 / 阴历
    "maritalStatus"     TEXT,     -- 已婚/未婚/离异/其他
    "childrenInfo"      TEXT,
    "religion"          TEXT,
    -- 工作信息
    "company"           TEXT,
    "position"          TEXT,
    "industry"          TEXT,
    "workAddress"       TEXT,
    -- 家庭与地址
    "homeAddress"       TEXT,
    "city"              TEXT,
    -- 教育背景
    "school"            TEXT,
    "major"             TEXT,
    "education"         TEXT,
    -- 关系信息
    "firstMetEvent"     TEXT,
    "firstMetDate"      DATETIME,
    "introducedBy"      TEXT,
    "source"            TEXT,
    "relationshipStrength" TEXT,
    "lastContactDate"   DATETIME,
    "contactFrequency"  TEXT,
    "nextAction"        TEXT,
    -- 价值评估
    "coreResources"     TEXT,
    "influenceRating"   TEXT,
    "cooperationRecord" TEXT,
    -- 其他
    "tags"              TEXT,
    "avatar"            TEXT,
    "attachments"       TEXT,
    "note"              TEXT,
    "createdAt"         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedAt"        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: Project (项目库)
CREATE TABLE "Project" (
    "id"               INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    -- 基础信息
    "name"             TEXT NOT NULL,
    "code"             TEXT,
    "clientCompany"    TEXT,
    "clientContact"    TEXT,
    "projectType"      TEXT,
    "industry"         TEXT,
    "priority"         TEXT,
    "status"           TEXT NOT NULL DEFAULT '洽谈中',
    -- 时间
    "startDate"        DATETIME,
    "expectedEndDate"  DATETIME,
    "actualEndDate"    DATETIME,
    -- 财务
    "contractAmount"   TEXT,
    "chargingModel"    TEXT,
    "paymentStatus"    TEXT,
    "paidAmount"       TEXT,
    -- 岗位与进展
    "relatedJobs"      TEXT,
    "totalHeadcount"   INTEGER,
    "recommendedCount" INTEGER,
    "interviewedCount" INTEGER,
    "hiredCount"       INTEGER,
    "completionRate"   TEXT,
    -- 沟通与文档
    "lastReportDate"   DATETIME,
    "nextReportDate"   DATETIME,
    "painPoints"       TEXT,
    "competitorInfo"   TEXT,
    "tags"             TEXT,
    "attachments"      TEXT,
    "note"             TEXT,
    "createdAt"        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
