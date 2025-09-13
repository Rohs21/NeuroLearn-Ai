-- CreateTable
CREATE TABLE "public"."Badge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Badge" ADD CONSTRAINT "Badge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
