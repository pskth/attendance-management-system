import { MarksTableClient } from "./client";

interface PageProps {
  searchParams: Promise<{ courseId?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const courseId = params.courseId || '';
  return <MarksTableClient courseId={courseId} />;
}
