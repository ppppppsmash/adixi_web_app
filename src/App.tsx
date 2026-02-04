import './App.css'
import LetterGlitch from "./components/background/LetterGlitch";
import { LiquidGlass } from '@liquidglass/react';

function App() {

  return (
    <>
      <div className="w-[90svw] h-[90svh] mx-auto">
        <LiquidGlass
          borderRadius={20}
          blur={1}
          contrast={1.2}
          brightness={1.1}
          saturation={1.2}
        >
          <h2>Beautiful Glass Effect</h2>
          <p>Your content here...</p>
        </LiquidGlass>
      </div>
      <LetterGlitch
        glitchSpeed={50}
        centerVignette={true}
        outerVignette={true}
        smooth={true}
        glitchColors={['#2b4539', '#61dca3', '#61b3dc']}
        characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789"
      />
    </>
  )
}

export default App
