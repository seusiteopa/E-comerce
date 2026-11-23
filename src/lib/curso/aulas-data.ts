import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type Lesson = { id: string; title: string; video_url: string; position: number };

/** Aulas do curso na ordem cadastrada. */
export async function getCourseLessons(productId: string): Promise<Lesson[]> {
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("course_lessons")
    .select("id, title, video_url, position")
    .eq("product_id", productId)
    .order("position");
  return (data ?? []) as Lesson[];
}
