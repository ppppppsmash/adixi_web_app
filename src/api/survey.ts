import { supabase } from "../lib/supabase";

/**
 * テーブル・カラムは kh-project の db/schema/surveys/index.ts に合わせる。
 * - テーブル: surveys, survey_items（snake_case は DB の実際の名前）
 * - surveys: id, title, description, theme, is_public, is_published, created_at, updated_at
 * - survey_items: id, survey_id, question, question_type, options, is_required, order, created_at, updated_at
 *
 * 「1件公開中なのに取れない」場合 → Supabase の RLS が原因のことが多い。ダッシュボードの
 * Table Editor → surveys → RLS で、anon が「is_published = true の行だけ SELECT」できるポリシーを追加する。
 * 例（SQL Editor で実行）:
 *   CREATE POLICY "anon_read_published_surveys" ON surveys FOR SELECT TO anon USING (is_published = true);
 *   CREATE POLICY "anon_read_survey_items" ON survey_items FOR SELECT TO anon USING (
 *     survey_id IN (SELECT id FROM surveys WHERE is_published = true)
 *   );
 *
 * 回答送信時は survey_responses / survey_response_items への anon の INSERT ポリシーも必要（下記 submitSurveyResponse 付近のコメント参照）。
 */

export type SurveyItemType = "text" | "textarea" | "select" | "radio" | "checkbox";

export interface SurveyItem {
  id: string;
  question: string;
  questionType: SurveyItemType;
  options?: string;
  isRequired: boolean;
  order: string;
}

export interface PublicSurvey {
  id: string;
  title: string;
  description?: string;
  items: SurveyItem[];
}

/**
 * 公開済みアンケートを Supabase から取得。
 * kh-project の surveys スキーマ準拠。RLS で is_published = true のみ SELECT 許可すること。
 */
export async function getPublicSurvey(surveyId: string): Promise<PublicSurvey | null> {
  const { data: survey, error: surveyError } = await supabase
    .from("surveys")
    .select("id, title, description")
    .eq("id", surveyId)
    .eq("is_published", true)
    .maybeSingle();

  if (surveyError) {
    console.error("[getPublicSurvey] surveys error:", surveyError.message, surveyError)
    throw new Error(surveyError.message)
  }
  if (!survey) return null;

  const { data: items, error: itemsError } = await supabase
    .from("survey_items")
    .select("id, question, question_type, options, is_required, order")
    .eq("survey_id", surveyId)
    .order("order", { ascending: true });

  if (itemsError) {
    console.error("[getPublicSurvey] survey_items error:", itemsError.message, itemsError)
    throw new Error(itemsError.message)
  }

  return {
    id: survey.id,
    title: survey.title,
    description: survey.description ?? undefined,
    items: (items ?? []).map((row) => ({
      id: row.id,
      question: row.question,
      questionType: row.question_type as SurveyItemType,
      options: row.options ?? undefined,
      isRequired: row.is_required ?? false,
      order: row.order ?? "0",
    })),
  };
}

/**
 * 公開済みのうち最新1件を取得（kh-project の surveys の created_at でソート）。
 */
export async function getLatestPublicSurvey(): Promise<PublicSurvey | null> {
  const { data: survey, error: surveyError } = await supabase
    .from("surveys")
    .select("id, title, description")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (surveyError) {
    console.error("[getLatestPublicSurvey] surveys error:", surveyError.message, surveyError)
    throw new Error(surveyError.message)
  }
  if (!survey) return null;

  return getPublicSurvey(survey.id);
}

/**
 * 回答を DB に送信（kh-project の survey_responses / survey_response_items スキーマ準拠）。
 * 送信内容: survey_responses → survey_id, respondent_name（null 可） / survey_response_items → response_id, survey_item_id, answer（文字列、配列は JSON 文字列）。
 * RPC を使うため RLS をバイパス。Supabase SQL Editor で supabase-rpc-submit-response.sql を実行すること。
 */
export async function submitSurveyResponse(
  surveyId: string,
  answers: Record<string, string | string[]>,
  respondentName?: string | null
): Promise<{ responseId: string }> {
  const answersJson: Record<string, string> = {};
  for (const [itemId, value] of Object.entries(answers)) {
    answersJson[itemId] = Array.isArray(value) ? JSON.stringify(value) : String(value);
  }

  const { data: responseId, error } = await supabase.rpc("submit_survey_response", {
    p_survey_id: surveyId,
    p_respondent_name: respondentName ?? null,
    p_answers: answersJson,
  });

  if (error) {
    console.error("[submitSurveyResponse] RPC error:", error);
    throw new Error(error.message);
  }

  return { responseId: responseId as string };
}
