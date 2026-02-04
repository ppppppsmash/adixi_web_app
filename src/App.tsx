import './App.css'
import LetterGlitch from "./components/background/LetterGlitch";
import { LiquidGlass } from '@liquidglass/react';
import { AnimatedThemeToggler } from "./components/ui/button/animated-theme-toggler";
import { useDarkMode } from "./lib/useDarkMode";
//import { SurveyForm, SurveyFormSection } from "./components/survey";
import Stepper, { Step } from "./components/ui/stepper/stepper";

const GLITCH_COLORS = ['#2b4539', '#61dca3', '#61b3dc']

function App() {
  const isDark = useDarkMode()

  return (
    <>
      <div className="absolute top-4 right-6 z-50">
        <AnimatedThemeToggler />
      </div>
      <div className="min-h-svh w-full flex justify-center items-center relative z-0">
        <div className="w-[40svw] h-[65svh]">
          <LiquidGlass
            borderRadius={30}
            blur={isDark ? 1 : 1.2}
            contrast={isDark ? 1.2 : 1.45}
            brightness={isDark ? 1.2 : 1.15}
            saturation={isDark ? 1.2 : 1.35}
          >
            <Stepper
              initialStep={1}
              onStepChange={(step) => {
                console.log(step);
              }}
              onFinalStepCompleted={() => console.log("All steps completed!")}
              backButtonText="Previous"
              nextButtonText="Next"
            >
              <Step>
                <h2>Welcome to the React Bits stepper!</h2>
                <p>Check out the next step!</p>
              </Step>
              <Step>
                <h2>Step 2</h2>
                <img style={{ height: '100px', width: '100%', objectFit: 'cover', objectPosition: 'center -70px', borderRadius: '15px', marginTop: '1em' }} src="https://www.purrfectcatgifts.co.uk/cdn/shop/collections/Funny_Cat_Cards_640x640.png?v=1663150894" />
                <p>Custom step content!</p>
              </Step>
              <Step>
                <h2>How about an input?</h2>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name?" />
              </Step>
              <Step>
                <h2>Final Step</h2>
                <p>You made it!</p>
              </Step>
            </Stepper>
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
