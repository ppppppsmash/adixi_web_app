import './App.css'
import LetterGlitch from './components/background/LetterGlitch'

function App() {

  return (
    <>
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
