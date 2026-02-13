import { supabase } from "../lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type SurveyComment = {
  id: string;
  survey_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

const TABLE = "survey_comments";

/**
 * アンケートに紐づくコメント一覧を取得。
 * テーブルが無い場合は空配列を返す。
 */
export async function getSurveyComments(surveyId: string): Promise<SurveyComment[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, survey_id, author_name, body, created_at")
    .eq("survey_id", surveyId)
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("[getSurveyComments]", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    survey_id: row.survey_id,
    author_name: row.author_name ?? "匿名",
    body: row.body ?? "",
    created_at: row.created_at,
  }));
}

/**
 * コメントを追加。RLS で anon の INSERT を許可すること。
 */
export async function insertSurveyComment(
  surveyId: string,
  body: string,
  authorName?: string | null
): Promise<SurveyComment | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      survey_id: surveyId,
      author_name: (authorName?.trim() || "匿名").slice(0, 100),
      body: (body ?? "").trim().slice(0, 2000),
    })
    .select("id, survey_id, author_name, body, created_at")
    .single();

  if (error) {
    console.warn("[insertSurveyComment]", error.message);
    return null;
  }

  return {
    id: data.id,
    survey_id: data.survey_id,
    author_name: data.author_name ?? "匿名",
    body: data.body ?? "",
    created_at: data.created_at,
  };
}

/**
 * コメントの Realtime 購読。INSERT 時に onInsert を呼ぶ。
 * クリーンアップは返り値の channel を supabase.removeChannel(channel) で行う。
 */
export function subscribeSurveyComments(
  surveyId: string,
  onInsert: (comment: SurveyComment) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`survey_comments:${surveyId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: TABLE, filter: `survey_id=eq.${surveyId}` },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        if (!row) return;
        onInsert({
          id: String(row.id ?? ""),
          survey_id: String(row.survey_id ?? ""),
          author_name: String(row.author_name ?? "匿名"),
          body: String(row.body ?? ""),
          created_at: String(row.created_at ?? ""),
        });
      }
    )
    .subscribe();

  return channel;
}
