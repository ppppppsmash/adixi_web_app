import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.tsx'

// 描画前に保存済みテーマを適用（dark / virtualboy / lcdgreen / gameboypocket）
const saved = localStorage.getItem('theme') as 'dark' | 'virtualboy' | 'lcdgreen' | 'gameboypocket' | null
const root = document.documentElement
root.classList.remove('dark', 'virtual-boy', 'lcd-green', 'game-boy-pocket')
if (saved === 'virtualboy') {
  root.classList.add('virtual-boy')
} else if (saved === 'lcdgreen') {
  root.classList.add('lcd-green')
} else if (saved === 'gameboypocket') {
  root.classList.add('game-boy-pocket')
} else {
  root.classList.add('dark')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
