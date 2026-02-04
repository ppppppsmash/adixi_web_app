import './App.css'
import LetterGlitch from "./components/background/LetterGlitch";
import { LiquidGlass } from '@liquidglass/react';
import { AnimatedThemeToggler } from "./components/ui/button/animated-theme-toggler"
import { useDarkMode } from "./lib/useDarkMode"

const DARK_GLITCH_COLORS = ['#2b4539', '#61dca3', '#61b3dc']
const LIGHT_GLITCH_COLORS = ['#0a3d26', '#0c5c38', '#0a3d5c', '#0d4d6b']

function App() {
  const isDark = useDarkMode()

  return (
    <>
      <div className="absolute top-4 right-6 z-50">
        <AnimatedThemeToggler />
      </div>
      <div className="min-h-svh w-full flex justify-center items-center relative z-0">
        <div className="w-[600px] h-[50svh]">
          <LiquidGlass
            borderRadius={10}
            blur={isDark ? 1 : 1.2}
            contrast={isDark ? 1.2 : 1.45}
            brightness={isDark ? 1.2 : 1.15}
            saturation={isDark ? 1.2 : 1.35}
          >
            <h2>Beautiful Glass Effect</h2>
            <p>Your content here...</p>
          </LiquidGlass>
        </div>
      </div>
      <LetterGlitch
        glitchSpeed={50}
        centerVignette={true}
        outerVignette={true}
        smooth={true}
        glitchColors={isDark ? DARK_GLITCH_COLORS : LIGHT_GLITCH_COLORS}
        characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789"
      />
    </>
  )
}

export default App
