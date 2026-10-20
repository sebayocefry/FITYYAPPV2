-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS');

-- CreateEnum
CREATE TYPE "TrackingMode" AS ENUM ('WEIGHT_REPS', 'REPS', 'DURATION');

-- CreateTable
CREATE TABLE "Exercise" (
    "id" UUID NOT NULL,
    "slu" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryMuscle" "MuscleGroup" NOT NULL,
    "trackingMode" "TrackingMode" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_slu_key" ON "Exercise"("slu");
