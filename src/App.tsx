import { useState, useEffect } from 'react'
import LetterGlitch from "./components/background/LetterGlitch";
// import { LiquidGlass } from '@liquidglass/react';
import { AnimatedThemeToggler } from "./components/ui/button/animated-theme-toggler";
import { useDarkMode } from "./lib/useDarkMode";
import FuzzyText from "./components/ui/text/fuzzy-text";
import Stepper, { Step } from "./components/ui/stepper/stepper";
import {
  Button,
  Input,
  Textarea,
  Checkbox,
  RadioGroup,
  Radio,
  Field,
  Label,
  Fieldset,
  Legend,
} from '@headlessui/react'
import { getPublicSurvey, getLatestPublicSurvey, submitSurveyResponse, getSurveyRespondentNames, type PublicSurvey, type SurveyItem } from "./api/survey";
import { useRealtimeCursors } from "./hooks/useRealtimeCursors";
import { RealtimeCursorsOverlay } from "./components/realtime/RealtimeCursorsOverlay";
import { AnimatedAvatar } from "./components/ui/avatar/animated-avatar";

const GLITCH_COLORS = ['#2b4539', '#61dca3', '#61b3dc']

/** 問題内容用フォント（日本語対応・ネオ風） */
const QUESTION_FONT = "'Zen Kaku Gothic New', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', Meiryo, sans-serif"

function getSurveyId(): string | null {
  const params = new URLSearchParams(window.location.search)
  return params.get('surveyId') ?? import.meta.env.VITE_DEFAULT_SURVEY_ID ?? null
}

function SurveyStepContent({
  item,
  value,
  onChange,
  isDark,
  isFirstItem,
}: {
  item: SurveyItem
  value: string | string[]
  onChange: (v: string | string[]) => void
  isDark: boolean
  isFirstItem?: boolean
}) {
  const options = item.options?.split(',').map((o) => o.trim()).filter(Boolean) ?? []
  const namePlaceholder = isFirstItem ? "お名前を入力" : "入力してください"

  return (
    <div className="step-content step-content-neo w-full min-w-0 space-y-4" style={{ fontFamily: QUESTION_FONT }}>
      <h2 className="step-title w-full min-w-0 text-left mb-6! ml-2!">
        <FuzzyText fontSize="1.4rem" baseIntensity={0.15} hoverIntensity={0.4} color={isDark ? '#fff' : '#333'} enableHover>
          {item.question}
          {item.isRequired && <span className="text-red-500 ml-1">*</span>}
        </FuzzyText>
      </h2>

      {item.questionType === 'text' && (
        <Field className="form-field-group w-full min-w-0 px-5">
          <Input
            type="text"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={namePlaceholder}
            className="form-input-base"
          />
        </Field>
      )}

      {item.questionType === 'textarea' && (
        <Field className="form-field-group w-full min-w-0 px-5">
          <Textarea
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={namePlaceholder}
            rows={4}
            className="form-input-base resize-y min-h-[100px]"
          />
        </Field>
      )}

      {item.questionType === 'radio' && (
        <Fieldset className="w-full min-w-0 px-5">
          <Legend className="sr-only">{item.question}</Legend>
          <RadioGroup
            value={options.find((o) => o === value) ?? ''}
            onChange={(v: string) => onChange(v)}
            className="flex flex-col gap-3"
          >
            {options.map((opt) => (
              <Field key={opt} className="flex items-center gap-3">
                <Radio value={opt} className="form-radio-outer group">
                  <span className="form-radio-dot group-data-[checked]:visible" />
                </Radio>
                <Label className="form-label mb-0 cursor-pointer">{opt}</Label>
              </Field>
            ))}
          </RadioGroup>
        </Fieldset>
      )}

      {item.questionType === 'checkbox' && (
        <div className="flex w-full min-w-0 flex-col gap-4 px-5">
          {options.map((opt) => {
            const list = (value as string[]) ?? []
            const checked = list.includes(opt)
            return (
              <Field key={opt} className="flex items-center gap-3">
                <Checkbox
                  checked={checked}
                  onChange={(v) => {
                    if (v) onChange([...list, opt])
                    else onChange(list.filter((x) => x !== opt))
                  }}
                  className="form-checkbox-box group"
                >
                  <svg className="size-3 stroke-[var(--color-button-text)] opacity-0 group-data-[checked]:opacity-100 transition" viewBox="0 0 14 14" fill="none">
                    <path d="M3 8L6 11L11 3.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Checkbox>
                <Label className="form-label mb-0 cursor-pointer">{opt}</Label>
              </Field>
            )
          })}
        </div>
      )}

      {item.questionType === 'select' && (
        <Field className="form-field-group w-full min-w-0 px-5">
          <select
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="form-input-base"
          >
            <option value="">選択してください</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </Field>
      )}
    </div>
  )
}

function App() {
  const isDark = useDarkMode()
  const [survey, setSurvey] = useState<PublicSurvey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submittedNames, setSubmittedNames] = useState<string[]>([])

  const surveyId = getSurveyId()
  const cursorDisplayName =
    survey?.items?.[0] && typeof answers[survey.items[0].id] === "string"
      ? (answers[survey.items[0].id] as string).trim()
      : ""
  const { otherCursors, myCursorRef, myCursorInfo, setMyCursor } = useRealtimeCursors(
    survey?.id ?? null,
    cursorDisplayName
  )

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      setMyCursor(x, y)
    }
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [setMyCursor])

  useEffect(() => {
    let cancelled = false
    const fetchSurvey = surveyId ? getPublicSurvey(surveyId) : getLatestPublicSurvey()
    fetchSurvey
      .then((data) => {
        if (cancelled) return
        setSurvey(data ?? null)
        if (!data) setError('アンケートが見つかりません。公開済みのアンケートが1件もないか、管理画面で「公開」にしてください。')
      })
      .catch((e) => {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : String(e)
        setError('取得に失敗しました。' + (msg ? `（${msg}）` : ''))
        console.error(e)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [surveyId])

  useEffect(() => {
    if (!survey?.id) return
    getSurveyRespondentNames(survey.id).then(setSubmittedNames).catch(() => setSubmittedNames([]))
  }, [survey?.id])

  const setAnswer = (itemId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }))
  }

  useEffect(() => {
    if (!loading && !error && survey) {
      document.body.classList.add("survey-cursor-none")
      return () => document.body.classList.remove("survey-cursor-none")
    }
    document.body.classList.remove("survey-cursor-none")
  }, [loading, error, survey])

  const handleSubmit = async () => {
    if (!survey || submitStatus === 'sending') return
    setSubmitStatus('sending')
    setSubmitError(null)
    const respondentName = survey.items?.[0] ? (answers[survey.items[0].id] as string)?.trim() || undefined : undefined
    try {
      await submitSurveyResponse(survey.id, answers, respondentName)
      setSubmitStatus('success')
      getSurveyRespondentNames(survey.id).then(setSubmittedNames).catch(() => {})
    } catch (e) {
      setSubmitStatus('error')
      setSubmitError(e instanceof Error ? e.message : String(e))
      console.error(e)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[100svh] w-full items-center justify-center text-[var(--color-text)]">
        読み込み中...
      </div>
    )
  }

  if (error || !survey) {
    const message = error ?? 'アンケートを取得できませんでした。'
    return (
      <div className="flex h-[100svh] w-full items-center justify-center px-4 text-center text-[var(--color-text)]">
        {message}
      </div>
    )
  }

  const borderClass = 'border-[var(--color-border)]'

  return (
    <div className="survey-cursor-none">
      <div className="absolute top-4 right-6 z-50">
        <AnimatedThemeToggler />
      </div>
      <RealtimeCursorsOverlay cursors={otherCursors} myCursorRef={myCursorRef} myCursorInfo={myCursorInfo} />

      {/* 最下層: LetterGlitch。その上: 全幅で透明背景。最前面: 中央枠は border のみ */}
      <div className="fixed inset-0 z-0 flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <LetterGlitch
            glitchSpeed={50}
            centerVignette={isDark}
            outerVignette={true}
            smooth={true}
            glitchColors={GLITCH_COLORS}
            characters={'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789'}
            adixiLoopIntervalMs={10000}
          />
        </div>
        <div className="absolute inset-0 z-[1] bg-[var(--color-bg-center)]" aria-hidden />
        <div className="relative z-10 flex w-full flex-1 flex-col items-center bg-transparent">
          {/* 最上部：送信した人の名前のみ表示（1人以上いるときだけ） */}
          {submittedNames.length > 0 && (
            <div className={`flex w-full shrink-0 justify-center border-t ${borderClass}`}>
              <div className={`mx-4 flex w-full max-w-[1120px] flex-wrap items-center justify-center gap-x-4 gap-y-2 border-x py-3 sm:mx-8 lg:mx-16 ${borderClass}`}>
                
              </div>
            </div>
          )}
          {/* 上部余白：枠は border のみ（背景は全幅レイヤーで表示） */}
          <div className={`hidden h-16 w-full shrink-0 justify-center border-t ${borderClass} sm:flex`}>
            <div className={`mx-4 w-full max-w-[1120px] flex-1 border-x sm:mx-8 lg:mx-16 ${borderClass}`} />
          </div>
          {/* タイトル帯：border のみ */}
          <div className={`flex w-full justify-center border-y ${borderClass}`}>
            <div className={`mx-4 flex w-full max-w-[1120px] flex-col items-center justify-center border-x py-12 text-center sm:mx-8 lg:mx-16 ${borderClass}`}>
              <FuzzyText
                baseIntensity={0.2}
                hoverIntensity={0.5}
                fontSize="clamp(2rem, 5vw, 4rem)"
                enableHover
                color={isDark ? '#61dca3' : '#FFF'}
                gradient={
                  isDark
                    ? ['#2b4539', '#61dca3', '#61b3dc']
                    : ['#0d6b42', '#61dca3', '#b8f0d8', '#fff']
                }
                gradientSpeed={0.4}
                strokeColor={isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.2)'}
                strokeWidth={2}
              >
                ADiXi SESSION SURVEY
              </FuzzyText>
            </div>
          </div>

          {/* タイトル下の border 内：送信済み＋現在入力中の名前のアイコン（リロード後も送信済みは表示される） */}
          <div className={`flex w-full flex-1 justify-center border-t ${borderClass}`}>
            <div className={`mx-4 flex w-full max-w-[1120px] flex-1 items-center justify-center border-x py-3 sm:mx-8 lg:mx-16 ${borderClass}`}>
              {(() => {
                const AVATAR_COLORS = ["61dca3", "61b3dc", "dc61b3", "dca361", "b361dc", "8b5cf6", "f59e0b", "ec4899", "14b8a6", "6366f1"];
                const colorForName = (name: string) => {
                  let n = 0;
                  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
                  return "#" + AVATAR_COLORS[Math.abs(n) % AVATAR_COLORS.length];
                };
                const hasName = (n: string) => (n?.trim() || "") !== "" && n?.trim() !== "ゲスト";
                const byName = new Map<string, { name: string; color: string; designation: string }>();
                submittedNames.forEach((name) => {
                  const n = name.trim();
                  if (n) byName.set(n, { name: n, color: colorForName(n), designation: "送信済み" });
                });
                if (myCursorInfo && hasName(myCursorInfo.name)) {
                  const n = myCursorInfo.name.trim();
                  byName.set(n, { name: n, color: myCursorInfo.color, designation: "参加中" });
                }
                otherCursors.forEach((c) => {
                  if (hasName(c.name)) {
                    const n = c.name.trim();
                    byName.set(n, { name: n, color: c.color, designation: "参加中" });
                  }
                });
                const avatarItems = Array.from(byName.entries()).map(([_, p], i) => ({
                  id: i,
                  name: p.name,
                  designation: p.designation,
                  image: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name.slice(0, 2))}&background=${p.color.replace("#", "")}`,
                }));
                if (avatarItems.length === 0) return null;
                return <AnimatedAvatar items={avatarItems} size="sm" />;
              })()}
            </div>
          </div>

          {/* アンケートカード帯：border の内側全体に背景（max-w-[1120px] の枠内） */}
          <div className={`flex w-full flex-1 justify-center border-t border-b ${borderClass}`}>
            <div className={`survey-area-crt mx-4 flex w-full max-w-[1120px] flex-1 items-start justify-center border-x bg-[var(--color-bg-survey)] py-8 sm:mx-8 lg:mx-16 ${borderClass}`}>
              <div className="relative z-10 w-full max-w-[min(46rem,90%)]">
                {/* <LiquidGlass borderRadius={50} blur={isDark ? 0.5 : 2} shadowIntensity={0.06}> */}
                  <div className="flex min-w-0 flex-col gap-y-10 px-6 pt-10 pb-8 w-full sm:px-14">
                    <div className="min-w-0 flex flex-col justify-start">
                      <Stepper
                        initialStep={1}
                        progressBarOnly
                        onStepChange={() => {}}
                        contentClassName="mt-10"
                        onFinalStepCompleted={handleSubmit}
                        backButtonText="前へ"
                        nextButtonText="次へ"
                        renderBackButton={({ onClick, children }) => (
                          <Button type="button" onClick={onClick} className="stepper-back-button min-w-[100px] rounded-lg px-4 py-2.5 font-medium tracking-tight transition data-[hover]:opacity-90 data-[active]:scale-[0.98] data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-[#61dca3]">
                            {children}
                          </Button>
                        )}
                        renderNextButton={({ onClick, children }) => (
                          <Button type="button" onClick={onClick} className="stepper-next-button min-w-[100px] rounded-lg px-4 py-2.5 font-medium tracking-tight transition data-[hover]:opacity-90 data-[active]:scale-[0.98] data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-[#61dca3]">
                            {children}
                          </Button>
                        )}
                      >
                        {survey.items.map((item, index) => (
                          <Step key={item.id}>
                            <SurveyStepContent
                              item={item}
                              value={answers[item.id]}
                              onChange={(v) => setAnswer(item.id, v)}
                              isDark={isDark}
                              isFirstItem={index === 0}
                            />
                          </Step>
                        ))}
                      </Stepper>
                      {submitStatus === 'sending' && (
                        <p className="mt-6 text-center text-[var(--color-text-muted)]">送信中...</p>
                      )}
                      {submitStatus === 'success' && (
                        <p className="mt-6 text-center text-[var(--color-text)] font-medium">
                          送信しました。ありがとうございます。
                        </p>
                      )}
                      {submitStatus === 'error' && (
                        <p className="mt-6 text-center text-red-500">
                          送信に失敗しました。{submitError && `（${submitError}）`}
                        </p>
                      )}
                    </div>
                  </div>
                {/* </LiquidGlass> */}
              </div>
            </div>
          </div>

          {/* 下部余白：他のエリアと同じく border のみ・常に表示 */}
          <div className={`flex h-16 w-full flex-grow justify-center border-b ${borderClass}`}>
            <div className={`mx-4 w-full max-w-[1120px] border-x sm:mx-8 lg:mx-16 ${borderClass}`} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
