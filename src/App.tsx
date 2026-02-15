import { useState, useEffect, useRef } from 'react'
// import { LiquidGlass } from '@liquidglass/react';
import { ArrowRightToLine, Camera, CameraOff, ChevronLeft, ChevronRight, CornerDownLeft, Power, Send } from "lucide-react";
import { AnimatedThemeToggler } from "./components/ui/button/animated-theme-toggler";
import { useTheme, type ThemeId } from "./lib/useDarkMode";
import { TitleAsciiGlitch } from "./components/ui/text/title-ascii-glitch";
import Stepper, { Step } from "./components/ui/stepper/stepper";
import {
  Input,
  Textarea,
  RadioGroup,
  Radio,
  Field,
  Label,
  Fieldset,
  Legend,
} from '@headlessui/react'
import { getPublicSurvey, getLatestPublicSurvey, submitSurveyResponse, getSurveyRespondentNames, type PublicSurvey, type SurveyItem } from "./api/survey";
import { supabase } from "./lib/supabase";
import { useRealtimeCursors } from "./hooks/useRealtimeCursors";
import { useCamera } from "./hooks/useCamera";
import { useWebRTCCameraShare } from "./hooks/useWebRTCCameraShare";
import { RealtimeCursorsOverlay } from "./components/realtime/RealtimeCursorsOverlay";
import { AnimatedAvatar } from "./components/ui/avatar/animated-avatar";
import { MatrixLoading } from "./components/loading/matrix-loading";
import { TerminalTypingText } from "./components/ui/text/terminal-typing-text";
import { CommentPanel } from "./components/comments/CommentPanel";
import { CrtEffectOverlay } from "./components/crt/CrtEffectOverlay";
import LetterGlitch from "./components/background/LetterGlitch";

/** サンプル準拠：monofont + 控えめなテキストシャドウ */
const QUESTION_FONT = "monofont, 'JetBrains Mono', 'M PLUS 1 Code', Consolas, Monaco, monospace"
const QUESTION_COLOR_DARK = '#12db50'
const QUESTION_COLOR_VIRTUALBOY = '#dd0038'
const QUESTION_COLOR_LCDGREEN = '#8bac0f'
const QUESTION_COLOR_GAMEBOYPOCKET = '#8b7355'

function getQuestionColor(theme: ThemeId): string {
  if (theme === 'virtualboy') return QUESTION_COLOR_VIRTUALBOY
  if (theme === 'lcdgreen') return QUESTION_COLOR_LCDGREEN
  if (theme === 'gameboypocket') return QUESTION_COLOR_GAMEBOYPOCKET
  return QUESTION_COLOR_DARK
}

function getQuestionTextShadow(theme: ThemeId): string {
  if (theme === 'virtualboy') return '0 0 2px rgba(255, 10, 10, 0.6)'
  if (theme === 'lcdgreen') return '0 0 2px rgba(139, 255, 10, 0.6)'
  if (theme === 'gameboypocket') return '0 0 2px rgba(173, 165, 154, 0.6)'
  return '0 0 2px rgba(10, 255, 10, 0.6)'
}

function getSurveyId(): string | null {
  const params = new URLSearchParams(window.location.search)
  return params.get('surveyId') ?? import.meta.env.VITE_DEFAULT_SURVEY_ID ?? null
}

function SurveyStepContent({
  item,
  value,
  onChange,
  theme,
  isFirstItem,
  startTyping = true,
}: {
  item: SurveyItem
  value: string | string[]
  onChange: (v: string | string[]) => void
  theme: ThemeId
  isFirstItem?: boolean
  /** ローディング透明化後に true になるとタイピング開始 */
  startTyping?: boolean
}) {
  const options = item.options?.split(',').map((o) => o.trim()).filter(Boolean) ?? []
  const namePlaceholder = isFirstItem ? "お名前を入力" : "入力してください"

  return (
    <div className="step-content step-content-sample w-full min-w-0 space-y-4" style={{ fontFamily: QUESTION_FONT }}>
      <h2 className="step-title w-full min-w-0 text-left mb-2! flex items-baseline gap-1 flex-wrap">
        <TerminalTypingText
          text={item.question}
          charDelay={40}
          startDelay={200}
          startWhen={startTyping}
          cursorAfterComplete={true}
          className="text-[1rem]"
          style={{
            fontFamily: QUESTION_FONT,
            color: getQuestionColor(theme),
            textShadow: getQuestionTextShadow(theme),
            lineHeight: 1.25,
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
                <Label className="form-label form-label-option mb-0 cursor-pointer">{opt}</Label>
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
            const toggle = () => {
              if (checked) onChange(list.filter((x) => x !== opt))
              else onChange([...list, opt])
            }
            return (
              <label
                key={opt}
                className="form-checkbox-row flex cursor-pointer select-none items-center gap-3"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggle()
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle()}
                  className="form-checkbox-input sr-only"
                  aria-label={opt}
                  tabIndex={0}
                />
                <span className={`form-checkbox-box flex size-5 shrink-0 items-center justify-center rounded-none border-2 transition-[background-color,border-color] duration-75 ${checked ? 'form-checkbox-box-checked' : ''}`}>
                  {checked && (
                    <svg className="form-checkbox-check-icon size-3 shrink-0" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="form-label form-label-option mb-0">{opt}</span>
              </label>
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
    theme: ThemeId
    onFadeEnd?: () => void
    /** true: 枠内に収める（absolute）。false: 全画面（fixed） */
    contained?: boolean
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
      className={`${props.contained ? 'absolute' : 'fixed'} inset-0 z-[60] flex items-center justify-center overflow-hidden bg-transparent`}
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
      <MatrixLoading theme={props.theme} contained={props.contained} />
    </div>
  )
}

const AVATAR_PALETTES: Record<ThemeId, string[]> = {
  dark: ["00ff41", "008c2a", "20c997", "14b8a6", "0d9488", "2dd4bf", "0f766e", "5eead4", "064e3b", "134e4a"],
  virtualboy: ["ff0040", "dd0038", "ff2055", "cc0033", "ff4068", "b3002e", "ff6080", "99002a", "e6003a", "8c0026"],
  lcdgreen: ["9bbc0f", "8bac0f", "7fa82e", "6b8e23", "5a7c1e", "4a6b18", "3d5a14", "306230", "2a5012", "1a3810"],
  gameboypocket: ["ada59a", "8b7355", "5c574f", "c4beb2", "dedede", "6b655c", "9e9e9e", "3d3d35", "b0b0b0", "4a4a4a"],
}

function getAccentColor(theme: ThemeId): string {
  if (theme === 'virtualboy') return '#dd0038'
  if (theme === 'lcdgreen') return '#8bac0f'
  if (theme === 'gameboypocket') return '#8b7355'
  return '#12db50'
}

/** LetterGlitch：緑系にボリューム感（青系なし、暗め〜明るめの黄緑バリエーション） */
const LETTER_GLITCH_COLORS: Record<ThemeId, string[]> = {
  dark: ['#0a5a24', '#0d7a32', '#12db50', '#2ee66a', '#4ade80', '#22c55e', '#16a34a', '#15803d'],
  virtualboy: ['#3d1a1a', '#dd0038', '#ff4068'],
  lcdgreen: ['#1a2e1a', '#8bac0f', '#9bbc0f'],
  gameboypocket: ['#2a2825', '#8b7355', '#ada59a'],
};

function App() {
  const theme = useTheme()
  const [survey, setSurvey] = useState<PublicSurvey | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLoading, setShowLoading] = useState(true)
  const [loadingExiting, setLoadingExiting] = useState(false)
  const [loadingFadeDone, setLoadingFadeDone] = useState(false)
  const loadingStartRef = useRef(0)
  const [error, setError] = useState<string | null>(null)
  /** モニターONボタンを押すまで画面を出さない */
  const [tvUnlocked, setTvUnlocked] = useState(false)
  /** モニターON前に入力する名前（ここで入力しないとボタンが活性化しない） */
  const [initialName, setInitialName] = useState('')
  /** 最初の CRT ON エフェクト（モニターONクリック後に1回） */
  const [showCrtOn, setShowCrtOn] = useState(false)
  /** 最後の CRT OFF エフェクト（送信完了時など） */
  const [showCrtOff, setShowCrtOff] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submittedNames, setSubmittedNames] = useState<string[]>([])
  /** コメントはDBに保存せず、画面の左エリアにのみ表示 */
  const [localComments, setLocalComments] = useState<{ id: string; author_name: string; body: string; created_at: string }[]>([])

  const surveyId = getSurveyId()
  const firstItemAnswer = survey?.items?.[0] && typeof answers[survey.items[0].id] === "string"
    ? (answers[survey.items[0].id] as string).trim()
    : ""
  const cursorDisplayName = firstItemAnswer || initialName.trim() || ""
  const { otherCursors, myCursorRef, myCursorInfo, setMyCursor, myPresenceKey } = useRealtimeCursors(
    survey?.id ?? null,
    cursorDisplayName
  )
  const { stream: cameraStream, start: startCamera, stop: stopCamera, isOn: isCameraOn } = useCamera();
  const otherPresenceKeys = otherCursors.map((c) => c.key);
  const { remoteStreams } = useWebRTCCameraShare(
    survey?.id ?? null,
    myPresenceKey,
    otherPresenceKeys,
    isCameraOn ? cameraStream ?? null : null
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      setMyCursor(x, y)
    }
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [setMyCursor])

  /* モニターONされてからだけフェッチ */
  useEffect(() => {
    if (!tvUnlocked) return
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
  }, [surveyId, tvUnlocked])

  const LOADING_MIN_MS = 9000
  const LOADING_FADEOUT_MS = 3500
  /* 取得完了後、最低表示時間経過でフェード開始 */
  useEffect(() => {
    if (!tvUnlocked || loading) return
    const elapsed = Date.now() - loadingStartRef.current
    const remaining = Math.max(0, LOADING_MIN_MS - elapsed)
    const t = setTimeout(() => {
      setShowLoading(false)
      setLoadingExiting(true)
    }, remaining)
    return () => clearTimeout(t)
  }, [tvUnlocked, loading])

  /* ローディングはアンマウントしない（opacity 0 のまま残す）。外すと一瞬真っ黒になるため */

  useEffect(() => {
    if (!survey?.id) return
    getSurveyRespondentNames(survey.id).then(setSubmittedNames).catch(() => setSubmittedNames([]))
  }, [survey?.id])

  /* 他ユーザーの送信を Realtime で検知し、送信者アバター一覧を即時更新 */
  useEffect(() => {
    if (!survey?.id) return
    const channel = supabase
      .channel(`survey_responses:${survey.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "survey_responses",
          filter: `survey_id=eq.${survey.id}`,
        },
        () => {
          getSurveyRespondentNames(survey.id).then(setSubmittedNames).catch(() => {})
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [survey?.id])

  /* 送信者一覧のポーリング（Realtime 未設定時も他ユーザー送信・退場を数秒で反映） */
  const SUBMITTED_NAMES_POLL_MS = 4000
  useEffect(() => {
    if (!survey?.id || !tvUnlocked || showCrtOff) return
    const poll = () => {
      getSurveyRespondentNames(survey.id).then(setSubmittedNames).catch(() => {})
    }
    const id = setInterval(poll, SUBMITTED_NAMES_POLL_MS)
    poll()
    return () => clearInterval(id)
  }, [survey?.id, tvUnlocked, showCrtOff])

  /* タブが再度表示されたときに送信者一覧を再取得 */
  useEffect(() => {
    if (!survey?.id) return
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        getSurveyRespondentNames(survey.id).then(setSubmittedNames).catch(() => {})
      }
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [survey?.id])

  /* アンケート取得後、最初の項目（名前）をモニターON前に入力した initialName で初期化 */
  useEffect(() => {
    if (!survey?.items?.length || initialName.trim() === '') return
    const firstId = survey.items[0].id
    setAnswers((prev) => ({ ...prev, [firstId]: initialName.trim() }))
  }, [survey?.id, survey?.items?.[0]?.id, initialName])

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

  const borderClass = ''
  /* 枠・LetterGlitch：最初から表示。マトリックス雨・CRTエフェクトは枠内に収める */
  const underlayVisible = true
  const underlayTransition = loadingExiting ? `${LOADING_FADEOUT_MS}ms` : '0ms'

  return (
    <div data-root="app" className="relative min-h-[100vh] flex items-center justify-center cursor-default">
      {/* 枠（CRT）の外側：LetterGlitch を枠と同じタイミングで表示 */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          opacity: underlayVisible ? 1 : 0,
          transition: `opacity ${underlayTransition} ease-out`,
        }}
        aria-hidden
      >
        <LetterGlitch
          glitchColors={LETTER_GLITCH_COLORS[theme]}
          glitchSpeed={50}
          centerVignette={false}
          outerVignette={true}
          smooth={true}
        />
        {/* LetterGlitch 全体に暗いレイヤー */}
        <div
          className="absolute inset-0 bg-black/50"
          aria-hidden
        />
      </div>
      <div
        className="ander-crt survey-cursor-none"
        style={{
          opacity: underlayVisible ? 1 : 0,
          transition: `opacity ${underlayTransition} ease-out`,
        }}
      >
        <div className="ander-screen relative">
          {/* CRT ON/OFF エフェクト：枠内に表示 */}
          <CrtEffectOverlay show={showCrtOn} mode="on" onEnd={() => setShowCrtOn(false)} contained />
          <CrtEffectOverlay show={showCrtOff} mode="off" onEnd={() => { setShowCrtOff(false); setTvUnlocked(false); }} contained />
          {/* テレビOFF中は枠内コンテンツを非表示（カーソル表示＋エフェクト終了と同期） */}
          {!showCrtOff && (
          <>
          {/* モニターON前：名前入力＋ボタンを枠内に表示 */}
          {!tvUnlocked && (
            <div className="tv-on-screen absolute inset-0 z-[50] flex flex-col items-center justify-center gap-6 text-white cursor-default" style={{ cursor: 'default' }}>
              <p className="tv-on-label">ADiXi SESSION SURVEY</p>
              <div className="tv-on-form flex flex-col items-stretch gap-3">
                <label htmlFor="tv-on-name" className="sr-only">Username</label>
                <div className="relative flex items-center">
                  <input
                    id="tv-on-name"
                    type="text"
                    value={initialName}
                    onChange={(e) => setInitialName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && initialName.trim() !== '') {
                        e.preventDefault()
                        setTvUnlocked(true)
                        setShowCrtOn(true)
                        loadingStartRef.current = Date.now()
                        setShowLoading(true)
                        setLoadingExiting(false)
                        setLoadingFadeDone(false)
                      }
                    }}
                    placeholder="Username"
                    className="tv-on-name-input tv-on-name-input-with-hint pr-24"
                    autoComplete="username"
                    aria-label="Usernameを入力するとモニターONが有効になります"
                  />
                  <span className="tv-on-key-hint absolute right-3 inline-flex items-center gap-1.5 text-xs opacity-60" style={{ color: getAccentColor(theme) }}>
                    <ArrowRightToLine className="size-3.5 shrink-0" aria-hidden />
                    Tab
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTvUnlocked(true)
                    setShowCrtOn(true)
                    loadingStartRef.current = Date.now()
                    setShowLoading(true)
                    setLoadingExiting(false)
                    setLoadingFadeDone(false)
                  }}
                  disabled={initialName.trim() === ''}
                  className={`tv-on-btn tv-on-btn-with-hint relative ${initialName.trim() !== '' ? 'tv-on-btn-ready' : ''}`}
                  aria-label="モニターON"
                >
                  モニターON
                  <span className="tv-on-key-hint absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 text-xs opacity-60" style={{ color: getAccentColor(theme) }}>
                    <CornerDownLeft className="size-3.5 shrink-0" aria-hidden />
                    Enter
                  </span>
                </button>
              </div>
            </div>
          )}
          {/* マトリックス雨：枠内に表示 */}
          {tvUnlocked && !showCrtOn && (
            <LoadingOverlay show={showLoading} exiting={loadingExiting} durationMs={LOADING_FADEOUT_MS} theme={theme} onFadeEnd={() => setLoadingFadeDone(true)} contained />
          )}
          {/* アンケート内容 or エラー */}
          {tvUnlocked && (!showLoading || loadingExiting) && (
          <div className="ander-wrapper">
            <div className="ander-interlace" aria-hidden />
            <div className="ander-scanline" aria-hidden />
            <div className="ander-envelope">
              <div className="ander-content flex flex-col overflow-y-auto h-full">
        <div className="relative z-10 flex w-full flex-1 flex-col items-center bg-transparent min-h-0">
          {/* 最上部：送信した人の名前のみ表示（1人以上いるときだけ） */}
          {(submittedNames.length > 0) && (
            <div className={`flex w-full shrink-0 justify-center ${borderClass}`}>
              <div className={`mx-4 flex w-full max-w-[1120px] flex-wrap items-center justify-center gap-x-4 gap-y-2 py-3 sm:mx-8 lg:mx-16 ${borderClass}`}>
                
              </div>
            </div>
          )}
          {/* タイトル帯：サンプル風ASCIIアート＋記号がランダムにグリッチ */}
          <div className={`flex w-full justify-center ${borderClass}`}>
            <div className={`mx-4 flex w-full max-w-[1120px] flex-col items-center justify-center gap-2 pt-12 pb-12 text-center sm:mx-8 lg:mx-16 ${borderClass}`}>
              <h1 className="sr-only">ADiXi SURVEY</h1>
              <TitleAsciiGlitch
                theme={theme}
                fontFamily="monofont, var(--font-title-code)"
                fontSize="clamp(0.85rem, 2.8vw, 1.4rem)"
              />
              <p
                className="text-sm tracking-widest opacity-90"
                style={{
                  fontFamily: 'monofont, var(--font-hacker-mono)',
                  color: getAccentColor(theme),
                }}
                aria-hidden
              >
                — スペシャリスト勉強会参加者向け・リアルタイムアンケート —
              </p>
            </div>
          </div>

          {/* タイトル下：送信済み＋現在入力中の名前のアイコン（カメラON/OFFに関係なく常にアイコンのみ表示） */}
          <div className={`flex w-full flex-1 justify-center ${borderClass}`}>
            <div className={`mx-4 flex w-full max-w-[1120px] flex-1 items-center justify-center gap-3 py-3 sm:mx-8 lg:mx-16 ${borderClass}`}>
              {(() => {
                /** 送信済み＝DBの回答者。参加中＝今いるがまだ送信していない人。同一名は送信済みを優先。 */
                const avatarPalette = AVATAR_PALETTES[theme];
                const colorForName = (name: string) => {
                  let n = 0;
                  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
                  return "#" + avatarPalette[Math.abs(n) % avatarPalette.length];
                };
                const hasName = (n: string) => (n?.trim() || "") !== "" && n?.trim() !== "ゲスト";
                const submittedSet = new Set(submittedNames.map((name) => name.trim()).filter(Boolean));
                const byName = new Map<string, { name: string; color: string; designation: string }>();
                submittedNames.forEach((name) => {
                  const n = name.trim();
                  if (n) byName.set(n, { name: n, color: colorForName(n), designation: "送信済み" });
                });
                if (myCursorInfo && hasName(myCursorInfo.name)) {
                  const n = myCursorInfo.name.trim();
                  if (!submittedSet.has(n)) {
                    byName.set(n, { name: n, color: myCursorInfo.color, designation: "参加中" });
                  }
                }
                otherCursors.forEach((c) => {
                  if (hasName(c.name)) {
                    const n = c.name.trim();
                    if (!submittedSet.has(n)) {
                      byName.set(n, { name: n, color: c.color, designation: "参加中" });
                    }
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
          <div className={`flex w-full flex-1 justify-center ${borderClass}`}>
            <div className={`survey-area-crt mx-4 flex w-full max-w-[1120px] flex-1 items-start justify-center py-8 sm:mx-8 lg:mx-16 ${borderClass}`}>
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
                          <button
                            type="button"
                            onClick={onClick}
                            aria-label="前へ"
                            className="hacker-btn-back relative z-10 inline-flex h-9 w-9 min-h-9 min-w-9 flex-shrink-0 items-center justify-center rounded-none p-0 transition hover:opacity-90 active:scale-[0.98] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-accent)]"
                          >
                            <ChevronLeft className="size-5 shrink-0" aria-hidden />
                          </button>
                        )}
                        renderNextButton={({ onClick, isLastStep }) => (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={onClick}
                              aria-label={isLastStep ? "送信" : "次へ"}
                              className="hacker-btn relative z-10 inline-flex h-9 w-9 min-h-9 min-w-9 flex-shrink-0 items-center justify-center rounded-none p-0 transition hover:opacity-90 active:scale-[0.98] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-accent)]"
                            >
                              {isLastStep ? <Send className="size-5 shrink-0" aria-hidden /> : <ChevronRight className="size-5 shrink-0" aria-hidden />}
                            </button>
                            {isLastStep && (
                              <span className="flex items-center gap-1.5 text-xs opacity-60" style={{ color: getAccentColor(theme) }}>
                                <CornerDownLeft className="size-3.5 shrink-0" aria-hidden />
                                Enter
                              </span>
                            )}
                          </div>
                        )}
                      >
                        {/* 名前は初期画面で入力済みのため、アンケート画面では1問目を表示しない（送信時は answers に含まれる） */}
                        {survey.items.slice(1).map((item) => (
                          <Step key={item.id}>
                            <SurveyStepContent
                              item={item}
                              value={answers[item.id]}
                              onChange={(v) => setAnswer(item.id, v)}
                              theme={theme}
                              isFirstItem={false}
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
                ) : (error || !survey) ? (
                  <div className="flex flex-col items-center justify-center px-6 py-12 text-center text-[var(--color-text)]">
                    {error ?? 'アンケートを取得できませんでした。'}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* コメント欄（非表示） */}
          <div className={`hidden flex w-full justify-center ${borderClass}`}>
            <div className={`mx-4 w-full max-w-[1120px] sm:mx-8 lg:mx-16 ${borderClass}`}>
              <CommentPanel
                comments={localComments}
                onAddComment={addLocalComment}
                authorName={cursorDisplayName}
              />
            </div>
          </div>

          <div className={`flex h-16 w-full flex-grow justify-center ${borderClass}`}>
            <div className={`mx-4 w-full max-w-[1120px] sm:mx-8 lg:mx-16 ${borderClass}`} />
          </div>
        </div>
              </div>
            </div>
          </div>
        )}
          </>
          )}
        </div>
      </div>
      {/* ツールバー：CRT右上付近に配置（モニターON前・モニターOFFエフェクト中は非表示） */}
      {tvUnlocked && !showCrtOff && (
      <div className="hacker-toolbar fixed z-[350] flex flex-col items-end gap-3" style={{ top: '1rem', right: '1rem' }}>
        <AnimatedThemeToggler />
        <button
          type="button"
          onClick={() => (isCameraOn ? stopCamera() : startCamera())}
          className="hacker-toolbar-btn"
          title={isCameraOn ? "カメラOFF" : "カメラON"}
          aria-label={isCameraOn ? "カメラOFF" : "カメラON"}
        >
          {isCameraOn ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setShowCrtOff(true)}
          className="hacker-toolbar-btn"
          title="モニターOFF"
          aria-label="モニターOFF"
        >
          <Power className="h-4 w-4" aria-hidden />
        </button>
      </div>
      )}
      {/* カスタムカーソル：ルートレベルで常に表示（モニターON/OFF問わず） */}
      {underlayVisible && (
        <RealtimeCursorsOverlay
          cursors={otherCursors}
          myCursorRef={myCursorRef}
          myCursorInfo={myCursorInfo}
          accentColor={getAccentColor(theme)}
          cameraStream={isCameraOn ? cameraStream ?? null : null}
          remoteStreams={remoteStreams}
        />
      )}
    </div>
  )
}

export default App
