/*
  Warnings:

  - A unique constraint covering the columns `[course_id,semester,year_id,teacher_id,section_id]` on the table `course_offerings` will be added. If there are existing duplicate values, this will fail.
  - Made the column `status` on table `attendance_records` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."attendance_records" ALTER COLUMN "status" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."courses" ADD COLUMN     "year" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "course_offerings_course_id_semester_year_id_teacher_id_sect_key" ON "public"."course_offerings"("course_id", "semester", "year_id", "teacher_id", "section_id");
