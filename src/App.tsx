import React, { useState, useEffect } from 'react'
import LetterGlitch from "./components/background/LetterGlitch";
import { LiquidGlass } from '@liquidglass/react';
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
import { getPublicSurvey, getLatestPublicSurvey, submitSurveyResponse, type PublicSurvey, type SurveyItem } from "./api/survey";

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
}: {
  item: SurveyItem
  value: string | string[]
  onChange: (v: string | string[]) => void
  isDark: boolean
}) {
  const options = item.options?.split(',').map((o) => o.trim()).filter(Boolean) ?? []

  return (
    <div className="step-content step-content-neo w-full min-w-0 space-y-4" style={{ fontFamily: QUESTION_FONT }}>
      <h2 className="step-title w-full min-w-0 text-left">
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
            placeholder="入力してください"
            className="form-input-base"
          />
        </Field>
      )}

      {item.questionType === 'textarea' && (
        <Field className="form-field-group w-full min-w-0 px-5">
          <Textarea
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="入力してください"
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

  const surveyId = getSurveyId()

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

  const setAnswer = (itemId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }))
  }

  const handleSubmit = async () => {
    if (!survey || submitStatus === 'sending') return
    setSubmitStatus('sending')
    setSubmitError(null)
    try {
      await submitSurveyResponse(survey.id, answers)
      setSubmitStatus('success')
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

  return (
    <React.Fragment>
      <div className="absolute top-4 right-6 z-50">
        <AnimatedThemeToggler />
      </div>

      <div className="flex h-[100svh] w-full flex-col overflow-hidden">
        <div className="min-h-0 shrink-0 flex justify-center py-8">
          <FuzzyText
            baseIntensity={0.2}
            hoverIntensity={0.5}
            fontSize="4rem"
            enableHover
            color={isDark ? '#61dca3' : '#FFF'}
          >
            ADiXi Survey
          </FuzzyText>
        </div>
        <div className="h-[70svh] flex-1 w-full flex justify-center items-center relative z-0 overflow-hidden">
          <div className="w-[46svw] max-w-full">
            <LiquidGlass borderRadius={50} blur={isDark ? 0.5 : 2} shadowIntensity={0.06}>
              <div className="flex min-w-0 flex-col pt-12 w-full gap-y-10 px-14">
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
                    {survey.items.map((item) => (
                      <Step key={item.id}>
                        <SurveyStepContent
                          item={item}
                          value={answers[item.id]}
                          onChange={(v) => setAnswer(item.id, v)}
                          isDark={isDark}
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
            </LiquidGlass>
          </div>
        </div>
      </div>
      <LetterGlitch
        glitchSpeed={50}
        centerVignette={isDark}
        outerVignette={true}
        smooth={true}
        glitchColors={GLITCH_COLORS}
        characters={'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789'}
        adixiLoopIntervalMs={10000}
      />
    </React.Fragment>
  )
}

export default App
