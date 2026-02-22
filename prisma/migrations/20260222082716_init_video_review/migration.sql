-- CreateTable
CREATE TABLE "VideoJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "workflowRunId" TEXT,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'READY_FOR_REVIEW',
    "videoUrl" TEXT NOT NULL,
    "thumbUrl" TEXT,
    "durationSeconds" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VideoCaption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "videoJobId" TEXT NOT NULL,
    "captionText" TEXT NOT NULL,
    "stylePreset" TEXT NOT NULL DEFAULT 'bold-white',
    "position" TEXT NOT NULL DEFAULT 'bottom',
    "safeArea" BOOLEAN NOT NULL DEFAULT true,
    "burnedVideoUrl" TEXT,
    "burnStatus" TEXT NOT NULL DEFAULT 'queued',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VideoCaption_videoJobId_fkey" FOREIGN KEY ("videoJobId") REFERENCES "VideoJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PublishJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "videoJobId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "publishStatus" TEXT NOT NULL DEFAULT 'queued',
    "platformPostId" TEXT,
    "scheduledFor" DATETIME,
    "caption" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PublishJob_videoJobId_fkey" FOREIGN KEY ("videoJobId") REFERENCES "VideoJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
