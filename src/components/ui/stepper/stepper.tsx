import React, { useState, Children, useRef, useLayoutEffect } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Variants } from 'motion/react';
import FuzzyText from '../text/fuzzy-text';
import { useDarkMode } from '../../../lib/useDarkMode';

interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  stepCircleContainerClassName?: string;
  stepContainerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  backButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  nextButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  backButtonText?: string;
  nextButtonText?: string;
  disableStepIndicators?: boolean;
  /** true のとき数字付き円ではなく単一のプログレスバーを表示 */
  progressBarOnly?: boolean;
  renderStepIndicator?: (props: {
    step: number;
    currentStep: number;
    onStepClick: (clicked: number) => void;
  }) => ReactNode;
  renderBackButton?: (props: { onClick: () => void; children: ReactNode }) => ReactNode;
  renderNextButton?: (props: { onClick: () => void; isLastStep: boolean; children: ReactNode }) => ReactNode;
}

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  stepCircleContainerClassName = '',
  stepContainerClassName = '',
  contentClassName = '',
  footerClassName = '',
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  disableStepIndicators = false,
  progressBarOnly = false,
  renderStepIndicator,
  renderBackButton,
  renderNextButton,
  ...rest
}: StepperProps) {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [direction, setDirection] = useState<number>(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) {
      onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  return (
    <div
      className="flex min-h-full w-full min-w-0 flex-1 flex-col items-stretch justify-center p-4"
      {...rest}
    >
      <div
        className={`flex w-full min-w-0 flex-col ${stepCircleContainerClassName}`}
      >
        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          className={`step-content-font min-w-0 space-y-2 px-4 pb-2 text-[var(--color-text)] sm:px-6 ${contentClassName}`}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        <div className="shrink-0 pt-12 pb-6">
          {progressBarOnly ? (
            <div className={`${stepContainerClassName} w-full min-w-0 px-4 sm:px-6`}>
              <div
                className="stepper-progress-track h-2 w-full overflow-hidden rounded-none"
                role="progressbar"
                aria-valuenow={isCompleted ? totalSteps : currentStep}
                aria-valuemin={1}
                aria-valuemax={totalSteps}
                aria-label="進捗"
              >
                <motion.div
                  className="hacker-progress-fill h-full rounded-none"
                  initial={false}
                  transition={{ duration: 0.4 }}
                  style={{
                    width: `${isCompleted ? 100 : (currentStep / totalSteps) * 100}%`
                  }}
                />
              </div>
            </div>
          ) : (
            <div className={`${stepContainerClassName} flex w-full min-w-0 items-center px-4 py-4 sm:px-6`}>
              {stepsArray.map((_, index) => {
                const stepNumber = index + 1;
                const isNotLastStep = index < totalSteps - 1;
                return (
                  <React.Fragment key={stepNumber}>
                    {renderStepIndicator ? (
                      renderStepIndicator({
                        step: stepNumber,
                        currentStep,
                        onStepClick: clicked => {
                          setDirection(clicked > currentStep ? 1 : -1);
                          updateStep(clicked);
                        }
                      })
                    ) : (
                      <StepIndicator
                        step={stepNumber}
                        disableStepIndicators={disableStepIndicators}
                        currentStep={currentStep}
                        onClickStep={clicked => {
                          setDirection(clicked > currentStep ? 1 : -1);
                          updateStep(clicked);
                        }}
                      />
                    )}
                    {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {!isCompleted && (
          <div className={`px-4 pb-8 sm:px-6 ${footerClassName}`}>
            <div className={`mt-10 flex ${currentStep !== 1 ? 'justify-between' : 'justify-end'}`}>
              {currentStep !== 1 &&
                (renderBackButton ? (
                  renderBackButton({ onClick: handleBack, children: backButtonText })
                ) : (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="hacker-btn-back rounded-none border px-4 py-2.5 font-medium tracking-tight transition"
                    {...backButtonProps}
                  >
                    {backButtonText}
                  </button>
                ))}
              {renderNextButton ? (
                renderNextButton({
                  onClick: isLastStep ? handleComplete : handleNext,
                  isLastStep,
                  children: isLastStep ? '送信' : nextButtonText
                })
              ) : (
                <button
                  type="button"
                  onClick={isLastStep ? handleComplete : handleNext}
                  className="hacker-btn flex items-center justify-center rounded-none px-4 py-2.5 font-medium tracking-tight transition"
                  {...nextButtonProps}
                >
                  {isLastStep ? '送信' : nextButtonText}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StepContentWrapperProps {
  isCompleted: boolean;
  currentStep: number;
  direction: number;
  children: ReactNode;
  className?: string;
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
  className = ''
}: StepContentWrapperProps) {
  const [parentHeight, setParentHeight] = useState<number>(0);

  return (
    <motion.div
      style={{ position: 'relative', overflow: 'hidden', minWidth: 0 }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={{ type: 'spring', duration: 0.4 }}
      className={className}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <SlideTransition key={currentStep} direction={direction} onHeightReady={h => setParentHeight(h)}>
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface SlideTransitionProps {
  children: ReactNode;
  direction: number;
  onHeightReady: (height: number) => void;
}

function SlideTransition({ children, direction, onHeightReady }: SlideTransitionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      onHeightReady(containerRef.current.offsetHeight);
    }
  }, [children, onHeightReady]);

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4 }}
      style={{ position: 'absolute', left: 0, right: 0, top: 0, minWidth: 0 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

const stepVariants: Variants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? '-100%' : '100%',
    opacity: 0
  }),
  center: {
    x: '0%',
    opacity: 1
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? '50%' : '-50%',
    opacity: 0
  })
};

interface StepProps {
  children: ReactNode;
}

export function Step({ children }: StepProps) {
  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden px-0">
      {children}
    </div>
  );
}

interface StepIndicatorProps {
  step: number;
  currentStep: number;
  onClickStep: (clicked: number) => void;
  disableStepIndicators?: boolean;
}

function StepIndicator({ step, currentStep, onClickStep, disableStepIndicators = false }: StepIndicatorProps) {
  const isDark = useDarkMode();
  const status = currentStep === step ? 'active' : currentStep < step ? 'inactive' : 'complete';

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) {
      onClickStep(step);
    }
  };

  return (
    <motion.div
      onClick={handleClick}
      className="relative cursor-pointer outline-none focus:outline-none"
      animate={status}
      initial={false}
    >
      <motion.div
        variants={{
          inactive: {
            scale: 1,
            backgroundColor: 'var(--color-stepper-inactive-bg, rgba(0,0,0,0.12))',
            color: 'var(--color-text)',
            boxShadow: 'none'
          },
          active: {
            scale: 1,
            backgroundColor: '#61dca3',
            color: '#61dca3',
            boxShadow: '0 0 12px #61dca3, 0 0 24px rgba(97,220,163,0.35)'
          },
          complete: {
            scale: 1,
            backgroundColor: '#61dca3',
            color: '#2b4539',
            boxShadow: '0 0 8px rgba(97,220,163,0.4)'
          }
        }}
        transition={{ duration: 0.3 }}
        className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-none font-semibold text-base ${status === 'active' ? 'stepper-active-glow' : ''} ${status === 'complete' ? 'stepper-complete-glow' : ''}`}
      >
        {status === 'complete' ? (
          <CheckIcon className="stepper-check-icon h-4 w-4 text-[#2b4539]" />
        ) : status === 'active' ? (
          <div className="stepper-active-dot h-3 w-3 rounded-none bg-[#2b4539] shadow-[inset_0_0_4px_rgba(97,220,163,0.5)]" />
        ) : (
          <FuzzyText
            fontSize="0.875rem"
            baseIntensity={0.12}
            hoverIntensity={0.35}
            color={isDark ? 'rgba(255,255,255,0.9)' : '#1d1d1f'}
            enableHover
          >
            {step}
          </FuzzyText>
        )}
      </motion.div>
    </motion.div>
  );
}

interface StepConnectorProps {
  isComplete: boolean;
}

function StepConnector({ isComplete }: StepConnectorProps) {
  const lineVariants: Variants = {
    incomplete: { width: 0 },
    complete: { width: '100%' }
  };

  return (
    <div className="stepper-progress-track relative mx-2 h-1 flex-1 overflow-hidden rounded-none min-w-[24px]">
      <motion.div
        className={`absolute left-0 top-0 h-full ${isComplete ? 'hacker-progress-fill' : ''}`}
        variants={lineVariants}
        initial={false}
        animate={isComplete ? 'complete' : 'incomplete'}
        transition={{ duration: 0.4 }}
      />
    </div>
  );
}

type CheckIconProps = React.SVGProps<SVGSVGElement>;

function CheckIcon(props: CheckIconProps) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          delay: 0.1,
          type: 'tween',
          ease: 'easeOut',
          duration: 0.3
        }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
