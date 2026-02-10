-- 回答送信用 RLS: anon が survey_responses / survey_response_items に INSERT できるようにする
-- Supabase ダッシュボード → SQL Editor でこのファイルの内容を実行

-- 既存ポリシーがあれば削除（再実行してもエラーにならない）
DROP POLICY IF EXISTS "anon_insert_survey_responses" ON public.survey_responses;
DROP POLICY IF EXISTS "anon_insert_survey_response_items" ON public.survey_response_items;

-- survey_responses: 公開済みアンケートへの回答のみ INSERT 許可
CREATE POLICY "anon_insert_survey_responses"
ON public.survey_responses
FOR INSERT
TO anon
WITH CHECK (
  survey_id IN (SELECT id FROM public.surveys WHERE is_published = true)
);

-- survey_response_items: 上記の回答に紐づく行のみ INSERT 許可
CREATE POLICY "anon_insert_survey_response_items"
ON public.survey_response_items
FOR INSERT
TO anon
WITH CHECK (
  response_id IN (
    SELECT id FROM public.survey_responses
    WHERE survey_id IN (SELECT id FROM public.surveys WHERE is_published = true)
  )
);
