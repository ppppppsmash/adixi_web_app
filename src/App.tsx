import { useState, useEffect, useRef } from 'react'
import LetterGlitch from "./components/background/LetterGlitch";
// import { LiquidGlass } from '@liquidglass/react';
import { Camera, CameraOff, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { AnimatedThemeToggler } from "./components/ui/button/animated-theme-toggler";
import { useDarkMode } from "./lib/useDarkMode";
import { TitleMatrixGlitch } from "./components/ui/text/title-matrix-glitch";
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
import { useCamera } from "./hooks/useCamera";
import { RealtimeCursorsOverlay } from "./components/realtime/RealtimeCursorsOverlay";
import { AnimatedAvatar } from "./components/ui/avatar/animated-avatar";
import { MatrixLoading } from "./components/loading/matrix-loading";
import { TerminalTypingText } from "./components/ui/text/terminal-typing-text";
import { CommentPanel } from "./components/comments/CommentPanel";
import { CrtEffectOverlay } from "./components/crt/CrtEffectOverlay";

/** マトリックス風緑を含むグリッチ／アクセント色 */
const GLITCH_COLORS = ['#0a1f0a', '#00ff41', '#2b4539', '#61dca3', '#61b3dc']

/** LetterGlitch 用の文字セット（JSX 内に {} を書くとパーサーが誤解するため定数化） */
const GLITCH_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789'

/** 問題内容用フォント（日本語対応・ネオ風） */
const QUESTION_FONT = "'Zen Kaku Gothic New', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', Meiryo, sans-serif"
/** 問題文タイトル：マトリックス／ハッカー風（モノスペース・緑） */
const QUESTION_MATRIX_FONT = "'JetBrains Mono', 'M PLUS 1 Code', Consolas, Monaco, monospace"
const QUESTION_MATRIX_COLOR_DARK = '#00ff41'
const QUESTION_MATRIX_COLOR_LIGHT = '#008c2a'

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
  startTyping = true,
}: {
  item: SurveyItem
  value: string | string[]
  onChange: (v: string | string[]) => void
  isDark: boolean
  isFirstItem?: boolean
  /** ローディング透明化後に true になるとタイピング開始 */
  startTyping?: boolean
}) {
  const options = item.options?.split(',').map((o) => o.trim()).filter(Boolean) ?? []
  const namePlaceholder = isFirstItem ? "お名前を入力" : "入力してください"

  return (
    <div className="step-content step-content-neo w-full min-w-0 space-y-4" style={{ fontFamily: QUESTION_FONT }}>
      <h2 className="step-title question-matrix-glow w-full min-w-0 text-left mb-2! flex items-baseline gap-1 flex-wrap">
        <TerminalTypingText
          text={item.question}
          charDelay={40}
          startDelay={200}
          startWhen={startTyping}
          cursorAfterComplete={true}
          className="text-[1.15rem] font-medium"
          style={{
            fontFamily: QUESTION_MATRIX_FONT,
            color: isDark ? QUESTION_MATRIX_COLOR_DARK : QUESTION_MATRIX_COLOR_LIGHT,
            textShadow: isDark
              ? "0 0 8px rgba(0, 255, 65, 0.4)"
              : "0 0 6px rgba(0, 140, 42, 0.35)",
          }}
        />
        {item.isRequired && <span className="text-red-500 ml-1">*</span>}
      </h2>

      {item.questionType === 'text' && (
        <Field className="form-field-group w-full min-w-0">
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
        <Field className="form-field-group w-full min-w-0">
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
        <Fieldset className="w-full min-w-0">
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
        <div className="flex w-full min-w-0 flex-col gap-4">
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
        <Field className="form-field-group w-full min-w-0">
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

/** ローディングオーバーレイ。透明化完了時に onFadeEnd を呼ぶ（タイピング開始用） */
function LoadingOverlay(
  props: {
    show: boolean
    exiting: boolean
    durationMs: number
    isDark: boolean
    onFadeEnd?: () => void
  }
) {
  const [fadeDone, setFadeDone] = useState(false)
  const isVisible = props.show || !props.exiting
  const duration = props.exiting ? (props.durationMs + 'ms') : '0ms'

  useEffect(() => {
    if (isVisible && fadeDone) setFadeDone(false)
  }, [isVisible, fadeDone])

  const trulyHidden = !isVisible && fadeDone

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-transparent"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: `opacity ${duration} ease-out`,
        pointerEvents: isVisible ? 'auto' : 'none',
        visibility: trulyHidden ? 'hidden' : 'visible',
      }}
      onTransitionEnd={(e) => {
        if (e.propertyName === 'opacity' && !isVisible) {
          setFadeDone(true)
          props.onFadeEnd?.()
        }
      }}
      aria-hidden
    >
      <MatrixLoading isDark={props.isDark} />
    </div>
  )
}

function App() {
  const isDark = useDarkMode()
  const [survey, setSurvey] = useState<PublicSurvey | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLoading, setShowLoading] = useState(true)
  const [loadingExiting, setLoadingExiting] = useState(false)
  const [loadingFadeDone, setLoadingFadeDone] = useState(false)
  const loadingStartRef = useRef(0)
  const [error, setError] = useState<string | null>(null)
  /** 最初の CRT ON エフェクト（1回だけ） */
  const [showCrtOn, setShowCrtOn] = useState(true)
  /** 最後の CRT OFF エフェクト（送信完了時など） */
  const [showCrtOff, setShowCrtOff] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submittedNames, setSubmittedNames] = useState<string[]>([])
  /** コメントはDBに保存せず、画面の左エリアにのみ表示 */
  const [localComments, setLocalComments] = useState<{ id: string; author_name: string; body: string; created_at: string }[]>([])

  const surveyId = getSurveyId()
  const cursorDisplayName =
    survey?.items?.[0] && typeof answers[survey.items[0].id] === "string"
      ? (answers[survey.items[0].id] as string).trim()
      : ""
  const { otherCursors, myCursorRef, myCursorInfo, setMyCursor } = useRealtimeCursors(
    survey?.id ?? null,
    cursorDisplayName
  )
  const { stream: cameraStream, start: startCamera, stop: stopCamera, isOn: isCameraOn } = useCamera();

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
    loadingStartRef.current = Date.now()
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

  const LOADING_MIN_MS = 5500
  const LOADING_FADEOUT_MS = 2500
  /* 取得完了後、2フレーム待って下地を描画してからフェード開始（途中で真っ黒にしないため） */
  useEffect(() => {
    if (loading) return
    const elapsed = Date.now() - loadingStartRef.current
    const remaining = Math.max(0, LOADING_MIN_MS - elapsed)
    const t = setTimeout(() => {
      setShowLoading(false)
      setLoadingExiting(true)
    }, remaining)
    return () => clearTimeout(t)
  }, [loading])

  /* ローディングはアンマウントしない（opacity 0 のまま残す）。外すと一瞬真っ黒になるため */

  useEffect(() => {
    if (!survey?.id) return
    getSurveyRespondentNames(survey.id).then(setSubmittedNames).catch(() => setSubmittedNames([]))
  }, [survey?.id])

  const setAnswer = (itemId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }))
  }

  const addLocalComment = (body: string) => {
    const name = (cursorDisplayName?.trim() || "匿名").slice(0, 100)
    setLocalComments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        author_name: name,
        body: body.slice(0, 2000),
        created_at: new Date().toISOString(),
      },
    ])
  }

  useEffect(() => {
    if (!showLoading && !error && survey) {
      document.body.classList.add("survey-cursor-none")
      return () => document.body.classList.remove("survey-cursor-none")
    }
    document.body.classList.remove("survey-cursor-none")
  }, [showLoading, error, survey])

  const handleSubmit = async () => {
    if (!survey || submitStatus === 'sending') return
    setSubmitStatus('sending')
    setSubmitError(null)
    const respondentName = survey.items?.[0] ? (answers[survey.items[0].id] as string)?.trim() || undefined : undefined
    try {
      await submitSurveyResponse(survey.id, answers, respondentName)
      setSubmitStatus('success')
      setShowCrtOff(true)
      getSurveyRespondentNames(survey.id).then(setSubmittedNames).catch(() => {})
    } catch (e) {
      setSubmitStatus('error')
      setSubmitError(e instanceof Error ? e.message : String(e))
      console.error(e)
    }
  }

  /* エラーは取得完了後のみ表示。取得中は下地を描画した上でオーバーレイだけ重ねる（途中で真っ黒にしない） */
  if (!loading && (error || !survey)) {
    const message = error ?? 'アンケートを取得できませんでした。'
    return (
      <div className="flex h-[100svh] w-full items-center justify-center px-4 text-center text-[var(--color-text)]">
        {message}
      </div>
    )
  }

  const borderClass = 'border-[var(--color-border)]'

  /* マトリックス雨のみ表示中は下地を非表示、フェード時に下地を 0→100% で表示 */
  const underlayVisible = !showLoading || loadingExiting
  const underlayTransition = loadingExiting ? `${LOADING_FADEOUT_MS}ms` : '0ms'

  return (
    <div data-root="app" className="relative">
      {/* 最初: CRT ON エフェクト（約4秒で消える） */}
      <CrtEffectOverlay show={showCrtOn} mode="on" onEnd={() => setShowCrtOn(false)} />
      {/* 最後: 送信完了時に CRT OFF エフェクト（約0.55秒） */}
      <CrtEffectOverlay show={showCrtOff} mode="off" onEnd={() => setShowCrtOff(false)} />
      <div
        className="survey-cursor-none relative z-0 min-h-[100svh] w-full bg-[var(--color-bg)]"
        style={{
          transform: 'translateZ(0)',
          opacity: underlayVisible ? 1 : 0,
          transition: `opacity ${underlayTransition} ease-out`,
        }}
      >
      <div className="absolute top-12 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatedThemeToggler />
        <button
          type="button"
          onClick={() => (isCameraOn ? stopCamera() : startCamera())}
          className="flex items-center gap-2 rounded-none border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 text-xs text-[var(--color-text)] transition hover:opacity-90"
          title={isCameraOn ? "カメラOFF" : "カメラON"}
        >
          {isCameraOn ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
        </button>
      </div>
      <RealtimeCursorsOverlay cursors={otherCursors} myCursorRef={myCursorRef} myCursorInfo={myCursorInfo} cameraStream={isCameraOn ? cameraStream ?? null : null} />

      {/* 最下層: LetterGlitch。その上: 全幅で透明背景。最前面: 中央枠は border のみ（translateZ(0)でレイヤ化しフェード時に黒くならない） */}
      <div className="fixed inset-0 z-0 flex flex-col items-center justify-center overflow-hidden" style={{ transform: 'translateZ(0)' }}>
        <div className="absolute inset-0 z-0">
          <LetterGlitch
            glitchSpeed={50}
            centerVignette={isDark}
            outerVignette={true}
            smooth={true}
            glitchColors={GLITCH_COLORS}
            characters={GLITCH_CHARACTERS}
            adixiLoopIntervalMs={10000}
          />
        </div>
        <div className="absolute inset-0 z-[1] bg-[var(--color-bg-center)]" aria-hidden />
        {/* マトリックス風：中央にごく薄い緑のビネット（ライト時はやや暗い緑） */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse 80% 70% at 50% 40%, rgba(0, 255, 65, 0.07) 0%, transparent 55%)'
              : 'radial-gradient(ellipse 80% 70% at 50% 40%, rgba(0, 140, 42, 0.06) 0%, transparent 55%)',
          }}
          aria-hidden
        />
        <div className="relative z-10 flex w-full flex-1 flex-col items-center bg-transparent">
          {/* 最上部：送信した人の名前のみ表示（1人以上いるときだけ） */}
          {(submittedNames.length > 0) && (
            <div className={`flex w-full shrink-0 justify-center border-t ${borderClass}`}>
              <div className={`mx-4 flex w-full max-w-[1120px] flex-wrap items-center justify-center gap-x-4 gap-y-2 border-x py-3 sm:mx-8 lg:mx-16 ${borderClass}`}>
                
              </div>
            </div>
          )}
          {/* タイトル帯：マトリックス雨のように文字が不安定に変わるが全体は読める */}
          <div className={`flex w-full justify-center border-y ${borderClass}`}>
            <div className={`mx-4 flex w-full max-w-[1120px] flex-col items-center justify-center gap-2 border-x py-12 text-center sm:mx-8 lg:mx-16 ${borderClass}`}>
              <TitleMatrixGlitch
                isDark={isDark}
                fontFamily="var(--font-title-code)"
                fontSize="clamp(1.9rem, 4.8vw, 3.5rem)"
              >
                ADiXi SESSION SURVEY
              </TitleMatrixGlitch>
              <p
                className="text-xs tracking-widest opacity-90"
                style={{
                  fontFamily: 'var(--font-hacker-mono)',
                  color: isDark ? '#00ff41' : '#008c2a',
                }}
                aria-hidden
              >
                — セッション参加者向け・リアルタイムアンケート —
              </p>
            </div>
          </div>

          {/* タイトル下の border 内：送信済み＋現在入力中の名前のアイコン（カメラON/OFFに関係なく常にアイコンのみ表示） */}
          <div className={`flex w-full flex-1 justify-center border-t ${borderClass}`}>
            <div className={`mx-4 flex w-full max-w-[1120px] flex-1 items-center justify-center gap-3 border-x py-3 sm:mx-8 lg:mx-16 ${borderClass}`}>
              {(() => {
                /** ハッカー風：緑〜ティール系（ui-avatars の background 用 hex） */
                const AVATAR_COLORS = ["00ff41", "008c2a", "20c997", "14b8a6", "0d9488", "2dd4bf", "0f766e", "5eead4", "064e3b", "134e4a"];
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
                const forAvatarList = Array.from(byName.entries());
                const avatarItems = forAvatarList.map(([, p], i) => ({
                  id: i,
                  name: p.name,
                  designation: p.designation,
                  image: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(p.name.slice(0, 2)) + '&background=' + (p.color.startsWith('#') ? p.color.slice(1) : p.color),
                  stream: null,
                }));
                return avatarItems.length > 0 ? (<AnimatedAvatar items={avatarItems} size="sm" />) : null;
              })()}
            </div>
          </div>

          {/* アンケートカード帯：外枠は最初から常に描画し、中身だけ survey 到着時に差し替え（レンダー遅延で真っ黒を防ぐ） */}
          <div className={`flex w-full flex-1 justify-center border-t border-b ${borderClass}`}>
            <div className={`survey-area-crt mx-4 flex w-full max-w-[1120px] flex-1 items-start justify-center border-x bg-[var(--color-bg-survey)] py-8 sm:mx-8 lg:mx-16 ${borderClass}`}>
              <div className="relative z-10 w-full max-w-[min(46rem,90%)]">
                {survey ? (
                <>
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
                        renderBackButton={({ onClick }) => (
                          <Button
                            type="button"
                            onClick={onClick}
                            aria-label="前へ"
                            className="hacker-btn-back inline-flex size-9 min-w-0 items-center justify-center rounded-none p-0 transition data-[hover]:opacity-90 data-[active]:scale-[0.98] data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-[#00ff41]"
                          >
                            <ChevronLeft className="size-5" aria-hidden />
                          </Button>
                        )}
                        renderNextButton={({ onClick, isLastStep }) => (
                          <Button
                            type="button"
                            onClick={onClick}
                            aria-label={isLastStep ? "送信" : "次へ"}
                            className="hacker-btn inline-flex size-9 min-w-0 items-center justify-center rounded-none p-0 transition data-[hover]:opacity-90 data-[active]:scale-[0.98] data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-[#00ff41]"
                          >
                            {isLastStep ? <Send className="size-5" aria-hidden /> : <ChevronRight className="size-5" aria-hidden />}
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
                              startTyping={loadingFadeDone}
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
                </>
                ) : null}
              </div>
            </div>
          </div>

          {/* コメント欄（左エリア内・DBには保存しない） */}
          <div className={`flex w-full justify-center border-b ${borderClass}`}>
            <div className={`mx-4 w-full max-w-[1120px] border-x sm:mx-8 lg:mx-16 ${borderClass}`}>
              <CommentPanel
                comments={localComments}
                onAddComment={addLocalComment}
                authorName={cursorDisplayName}
              />
            </div>
          </div>

          <div className={`flex h-16 w-full flex-grow justify-center border-b ${borderClass}`}>
            <div className={`mx-4 w-full max-w-[1120px] border-x sm:mx-8 lg:mx-16 ${borderClass}`} />
          </div>
        </div>
        {/* CRT表示方式：スキャンライン＋端の減光（ブラウン管の表示の見え方） */}
        <div className="crt-display pointer-events-none absolute inset-0 z-[100]" aria-hidden />
      </div>
      </div>
      {/* テレビが付くまでは matrix rain は出さない。付いたあとだけ Loading 表示 */}
      {!showCrtOn && (
        <LoadingOverlay show={showLoading} exiting={loadingExiting} durationMs={LOADING_FADEOUT_MS} isDark={isDark} onFadeEnd={() => setLoadingFadeDone(true)} />
      )}
    </div>
  )
}

export default App
