-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "authProvider" TEXT NOT NULL DEFAULT 'local',
    "providerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "league" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "matchday" INTEGER NOT NULL,
    "matchId" TEXT NOT NULL,
    "team1Score" INTEGER NOT NULL,
    "team2Score" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Point" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "league" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "matchday" INTEGER NOT NULL,
    "matchId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Point_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Result" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "league" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "matchday" INTEGER NOT NULL,
    "matchId" TEXT NOT NULL,
    "team1Score" INTEGER NOT NULL,
    "team2Score" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Prediction_userId_league_season_matchday_idx" ON "Prediction"("userId", "league", "season", "matchday");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_userId_league_season_matchday_matchId_key" ON "Prediction"("userId", "league", "season", "matchday", "matchId");

-- CreateIndex
CREATE INDEX "Point_userId_league_season_matchday_idx" ON "Point"("userId", "league", "season", "matchday");

-- CreateIndex
CREATE UNIQUE INDEX "Point_userId_league_season_matchday_matchId_key" ON "Point"("userId", "league", "season", "matchday", "matchId");

-- CreateIndex
CREATE INDEX "Result_league_season_matchday_idx" ON "Result"("league", "season", "matchday");

-- CreateIndex
CREATE UNIQUE INDEX "Result_league_season_matchday_matchId_key" ON "Result"("league", "season", "matchday", "matchId");
