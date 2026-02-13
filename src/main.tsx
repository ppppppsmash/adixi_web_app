import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.tsx'

// 描画前に保存済みテーマを適用。dark = 緑、virtualboy = Virtual Boy 赤（ライトモード廃止）
const saved = localStorage.getItem('theme')
if (saved === 'virtualboy') {
  document.documentElement.classList.remove('dark')
  document.documentElement.classList.add('virtual-boy')
} else {
  document.documentElement.classList.remove('virtual-boy')
  document.documentElement.classList.add('dark')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
