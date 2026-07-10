CREATE TABLE "AgentAlert" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "command" TEXT NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentAlert_pkey" PRIMARY KEY ("id")
);
