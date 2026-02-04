import './App.css'
import LetterGlitch from "./components/background/LetterGlitch";
import { LiquidGlass } from '@liquidglass/react';
import { AnimatedThemeToggler } from "./components/ui/button/animated-theme-toggler";
import { useDarkMode } from "./lib/useDarkMode";
import DecryptedText from "./components/ui/text/decrypted-text";
import FuzzyText from "./components/ui/text/fuzzy-text";
//import { SurveyForm, SurveyFormSection } from "./components/survey";
import Stepper, { Step } from "./components/ui/stepper/stepper";
import { PulsatingButton } from "./components/ui/button/pulsating-button";

const GLITCH_COLORS = ['#2b4539', '#61dca3', '#61b3dc']

function App() {
  const isDark = useDarkMode()

  return (
    <>
      <div className="absolute top-4 right-6 z-50">
        <AnimatedThemeToggler />
      </div>
      <div className="min-h-svh w-full flex justify-center items-center relative z-0">
        <div className="w-[40svw] h-[100svh]">
          <LiquidGlass
            // borderRadius={30}
            blur={isDark ? 0.1 : 0.3}
            // contrast={isDark ? 1.04 : 1.05}
            // brightness={isDark ? 2.20 : 1.00}
            // saturation={isDark ? 1.05 : 1.08}
            shadowIntensity={0.06}
          >
            <div className="flex h-full min-w-0 flex-col pt-6 w-full gap-y-10">
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
                  onStepChange={(step) => {
                    console.log(step);
                  }}
                  onFinalStepCompleted={() => console.log("All steps completed!")}
                  backButtonText="Previous"
                  nextButtonText="Next"
                  renderBackButton={({ onClick, children }) => (
                    <PulsatingButton
                      type="button"
                      onClick={onClick}
                      className="min-w-[100px] shadow-lg"
                    >
                      {children}
                    </PulsatingButton>
                  )}
                  renderNextButton={({ onClick, children }) => (
                    <PulsatingButton
                      type="button"
                      onClick={onClick}
                      className="min-w-[100px] shadow-lg"
                    >
                      {children}
                    </PulsatingButton>
                  )}
                >
                  <Step>
                    <div className="mb-3">
                      <FuzzyText fontSize="1.5rem" baseIntensity={0.15} hoverIntensity={0.4} color={isDark ? '#fff' : '#333'} enableHover>
                        Welcome to the React Bits stepper!
                      </FuzzyText>
                    </div>
                    <p>Check out the next step!</p>
                  </Step>
                  <Step>
                    <div className="mb-3">
                      <FuzzyText fontSize="1.5rem" baseIntensity={0.15} hoverIntensity={0.4} color={isDark ? '#fff' : '#333'} enableHover>
                        Step 2
                      </FuzzyText>
                    </div>
                    <img style={{ height: '100px', width: '100%', objectFit: 'cover', objectPosition: 'center -70px', borderRadius: '15px', marginTop: '1em' }} src="https://www.purrfectcatgifts.co.uk/cdn/shop/collections/Funny_Cat_Cards_640x640.png?v=1663150894" alt="" />
                    <p>Custom step content!</p>
                  </Step>
                  <Step>
                    <div className="mb-3">
                      <FuzzyText fontSize="1.5rem" baseIntensity={0.15} hoverIntensity={0.4} color={isDark ? '#fff' : '#333'} enableHover>
                        How about an input?
                      </FuzzyText>
                    </div>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name?" />
                  </Step>
                  <Step>
                    <div className="mb-3">
                      <FuzzyText fontSize="1.5rem" baseIntensity={0.15} hoverIntensity={0.4} color={isDark ? '#fff' : '#333'} enableHover>
                        Final Step
                      </FuzzyText>
                    </div>
                    <p>You made it!</p>
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
      />
    </>
  )
}

export default App
