-- CreateTable
CREATE TABLE "public"."mockInterview" (
    "id" SERIAL NOT NULL,
    "jsonMockResp" TEXT NOT NULL,
    "jobPosition" VARCHAR(255) NOT NULL,
    "jobDesc" VARCHAR(255) NOT NULL,
    "jobExperience" VARCHAR(255) NOT NULL,
    "createdBy" VARCHAR(255) NOT NULL,
    "createdAt" VARCHAR(255),
    "mockId" VARCHAR(255) NOT NULL,

    CONSTRAINT "mockInterview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."userAnswer" (
    "id" SERIAL NOT NULL,
    "mockIdRef" VARCHAR(255) NOT NULL,
    "question" VARCHAR(255) NOT NULL,
    "correctAns" TEXT,
    "userAns" TEXT,
    "feedback" TEXT,
    "rating" VARCHAR(255),
    "userEmail" VARCHAR(255),
    "createdAt" VARCHAR(255),

    CONSTRAINT "userAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mockInterview_mockId_key" ON "public"."mockInterview"("mockId");

-- AddForeignKey
ALTER TABLE "public"."userAnswer" ADD CONSTRAINT "userAnswer_mockIdRef_fkey" FOREIGN KEY ("mockIdRef") REFERENCES "public"."mockInterview"("mockId") ON DELETE RESTRICT ON UPDATE CASCADE;
