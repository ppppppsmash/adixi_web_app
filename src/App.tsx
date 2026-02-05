import { useState } from 'react'
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
  Description,
  Fieldset,
  Legend,
} from '@headlessui/react'

const GLITCH_COLORS = ['#2b4539', '#61dca3', '#61b3dc']

/** 問題内容用フォント（日本語対応・ネオ風） */
const QUESTION_FONT = "'Zen Kaku Gothic New', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', Meiryo, sans-serif"

const PLAN_OPTIONS = [
  { id: 'startup', name: 'Startup', desc: '個人・小規模' },
  { id: 'business', name: 'Business', desc: 'チーム向け' },
  { id: 'enterprise', name: 'Enterprise', desc: '大規模・カスタム' },
]

function App() {
  const isDark = useDarkMode()
  const [name, setName] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreeNewsletter, setAgreeNewsletter] = useState(false)
  const [plan, setPlan] = useState(PLAN_OPTIONS[0])
  const [feedback, setFeedback] = useState('')

  return (
    <>
      <div className="absolute top-4 right-6 z-50">
        <AnimatedThemeToggler />
      </div>
      <div className="min-h-svh w-full flex justify-center items-center relative z-0">
        <div className="w-[50svw] h-[100svh]">
          <LiquidGlass
            borderRadius={0}
            blur={2}
            shadowIntensity={0.06}
          >
            <div className="flex h-full min-w-0 flex-col pt-6 w-full gap-y-10 px-14">
              <div className="min-w-0 shrink-0 overflow-hidden flex justify-center">
                <FuzzyText
                  baseIntensity={0.2}
                  hoverIntensity={0.5}
                  fontSize="4rem"
                  enableHover
                  color={isDark ? '#fff' : '#333'}
                >
                  ADiXi Survey
                </FuzzyText>
              </div>
              <div className="min-h-0 min-w-0 flex-1 flex flex-col justify-start">
                <Stepper
                  initialStep={1}
                  progressBarOnly
                  onStepChange={(step) => {
                    console.log(step);
                  }}
                  contentClassName="mt-10"
                  onFinalStepCompleted={() => console.log("All steps completed!")}
                  backButtonText="Previous"
                  nextButtonText="Next"
                  renderBackButton={({ onClick, children }) => (
                    <Button
                      type="button"
                      onClick={onClick}
                      className="stepper-back-button min-w-[100px] rounded-lg px-4 py-2.5 font-medium tracking-tight transition data-[hover]:opacity-90 data-[active]:scale-[0.98] data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-[#61dca3]"
                    >
                      {children}
                    </Button>
                  )}
                  renderNextButton={({ onClick, children }) => (
                    <Button
                      type="button"
                      onClick={onClick}
                      className="stepper-next-button min-w-[100px] rounded-lg px-4 py-2.5 font-medium tracking-tight transition data-[hover]:opacity-90 data-[active]:scale-[0.98] data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-[#61dca3]"
                    >
                      {children}
                    </Button>
                  )}
                >
                  <Step>
                    <div className="step-content step-content-neo w-full min-w-0 space-y-4" style={{ fontFamily: QUESTION_FONT }}>
                      <h2 className="step-title w-full min-w-0 text-left">
                        <FuzzyText fontSize="1.4rem" baseIntensity={0.15} hoverIntensity={0.4} color={isDark ? '#fff' : '#333'} enableHover>
                          お名前
                        </FuzzyText>
                      </h2>
                      <Field className="form-field-group w-full min-w-0 px-5">
                        <Label className="form-label">氏名（ニックネーム可）</Label>
                        <Description className="form-description">
                          アンケート結果の表示に使用します。
                        </Description>
                        <Input
                          name="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="例: 山田 太郎"
                          className="form-input-base"
                        />
                      </Field>
                    </div>
                  </Step>

                  {/* Step 2: Headless UI Checkbox（複数） */}
                  <Step>
                    <div className="step-content step-content-neo w-full min-w-0 space-y-4" style={{ fontFamily: QUESTION_FONT }}>
                      <h2 className="step-title w-full min-w-0 text-left">
                        <FuzzyText fontSize="1.5rem" baseIntensity={0.15} hoverIntensity={0.4} color={isDark ? '#fff' : '#333'} enableHover>
                          同意事項
                        </FuzzyText>
                      </h2>
                      <div className="flex w-full min-w-0 flex-col gap-4">
                      <Field className="flex items-center gap-3 px-5">
                        <Checkbox
                          checked={agreeTerms}
                          onChange={setAgreeTerms}
                          className="form-checkbox-box group"
                        >
                          <svg className="size-3 stroke-[var(--color-button-text)] opacity-0 group-data-[checked]:opacity-100 transition" viewBox="0 0 14 14" fill="none">
                            <path d="M3 8L6 11L11 3.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </Checkbox>
                        <Label className="form-label mb-0 cursor-pointer">
                          利用規約に同意する
                        </Label>
                      </Field>
                      <Field className="flex items-center gap-3 px-5">
                        <Checkbox
                          checked={agreeNewsletter}
                          onChange={setAgreeNewsletter}
                          className="form-checkbox-box group"
                        >
                          <svg className="size-3 stroke-[var(--color-button-text)] opacity-0 group-data-[checked]:opacity-100 transition" viewBox="0 0 14 14" fill="none">
                            <path d="M3 8L6 11L11 3.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </Checkbox>
                        <Label className="form-label mb-0 cursor-pointer">
                          ニュースレターを受け取る（任意）
                        </Label>
                      </Field>
                      </div>
                    </div>
                  </Step>

                  {/* Step 3: Headless UI RadioGroup */}
                  <Step>
                    <div className="step-content step-content-neo w-full min-w-0 space-y-4" style={{ fontFamily: QUESTION_FONT }}>
                      <h2 className="step-title w-full min-w-0 text-left">
                        <FuzzyText fontSize="1.5rem" baseIntensity={0.15} hoverIntensity={0.4} color={isDark ? '#fff' : '#333'} enableHover>
                          プラン選択
                        </FuzzyText>
                      </h2>
                      <Fieldset className="w-full min-w-0 px-5">
                      <Legend className="form-legend">利用予定のプランを選んでください</Legend>
                      <RadioGroup
                        value={plan}
                        onChange={setPlan}
                        by="id"
                        aria-label="プラン"
                        className="flex flex-col gap-3"
                      >
                        {PLAN_OPTIONS.map((option) => (
                          <Field key={option.id} className="flex items-center gap-3">
                            <Radio
                              value={option}
                              className="form-radio-outer group"
                            >
                              <span className="form-radio-dot group-data-[checked]:visible" />
                            </Radio>
                            <div className="flex flex-col">
                              <Label className="form-label mb-0 cursor-pointer">{option.name}</Label>
                              <span className="text-sm text-[var(--color-text-muted)]">{option.desc}</span>
                            </div>
                          </Field>
                        ))}
                      </RadioGroup>
                    </Fieldset>
                    </div>
                  </Step>

                  {/* Step 4: Headless UI Textarea */}
                  <Step>
                    <div className="step-content step-content-neo w-full min-w-0 space-y-4" style={{ fontFamily: QUESTION_FONT }}>
                      <h2 className="step-title w-full min-w-0 text-left">
                        <FuzzyText fontSize="1.5rem" baseIntensity={0.15} hoverIntensity={0.4} color={isDark ? '#fff' : '#333'} enableHover>
                          ご意見・フィードバック
                        </FuzzyText>
                      </h2>
                      <Field className="form-field-group w-full min-w-0 px-5">
                      <Label className="form-label">自由記述（任意）</Label>
                      <Description className="form-description">
                        改善の参考にさせていただきます。
                      </Description>
                      <Textarea
                        name="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="ご要望や不具合報告など..."
                        rows={4}
                        className="form-input-base resize-y min-h-[100px]"
                      />
                    </Field>
                    </div>
                  </Step>
                </Stepper>
              </div>
            </div>
          </LiquidGlass>
        </div>
      </div>
      <LetterGlitch
        glitchSpeed={50}
        centerVignette={isDark}
        outerVignette={true}
        smooth={true}
        glitchColors={GLITCH_COLORS}
        characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789"
        adixiLoopIntervalMs={10000}
      />
    </>
  )
}

export default App
