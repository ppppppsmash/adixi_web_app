import { useState, useRef, useEffect } from "react";

const TURN_ON_MS = 4000;
const TURN_OFF_MS = 550;

interface CrtScreenWrapperProps {
  children: React.ReactNode;
  /** 開閉状態が変わったときに呼ばれる（開いたとき true） */
  onOpenChange?: (open: boolean) => void;
}

/**
 * CRT風画面の開閉ラッパー（CodePen lbebber/XJRdrV 参考）
 * - 閉じた状態: 「開く」ボタンのみ表示
 * - 開く → ターンオンアニメーション → 子要素（Loading→一覧）を表示
 * - 「閉じる」ボタンでターンオフアニメーション → 閉じる
 */
export function CrtScreenWrapper({ children, onOpenChange }: CrtScreenWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const turnOnEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turnOffEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpen = () => {
    setIsOpen(true);
    setIsOpening(true);
    setIsClosing(false);
    onOpenChange?.(true);
  };

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
  };

  // 閉じたときに親へ通知
  useEffect(() => {
    if (!isOpen && !isClosing) onOpenChange?.(false);
  }, [isOpen, isClosing, onOpenChange]);

  // ターンオン完了後: opening を外して flicker を有効に
  useEffect(() => {
    if (!isOpen || !isOpening) return;
    turnOnEndRef.current = setTimeout(() => {
      setIsOpening(false);
    }, TURN_ON_MS);
    return () => {
      if (turnOnEndRef.current) clearTimeout(turnOnEndRef.current);
    };
  }, [isOpen, isOpening]);

  // ターンオフ完了後: 閉じた状態に戻す
  useEffect(() => {
    if (!isClosing) return;
    turnOffEndRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setIsOpening(false);
      onOpenChange?.(false);
    }, TURN_OFF_MS);
    return () => {
      if (turnOffEndRef.current) clearTimeout(turnOffEndRef.current);
    };
  }, [isClosing, onOpenChange]);

  // 閉じた状態: 「開く」ボタンのみ
  if (!isOpen && !isClosing) {
    return (
      <div className="crt-closed-view" aria-hidden={false}>
        <p className="text-sm text-gray-400 mb-2">ADiXi SESSION SURVEY</p>
        <button
          type="button"
          className="crt-open-btn ready"
          onClick={handleOpen}
          aria-label="画面を開く"
        >
          開く
        </button>
      </div>
    );
  }

  // 開いている or 閉じるアニメーション中: CRT コンテナを表示
  const containerClass = [
    "crt-container",
    isOpening && "crt-opening",
    isClosing && "crt-closing",
    !isOpening && !isClosing && isOpen && "crt-on crt-flicker",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClass}>
      <div className="crt-screen">
        <div className="crt-overlay-label" aria-hidden>
          AV-1
        </div>
        {children}
      </div>
      {isOpen && !isClosing && (
        <button
          type="button"
          className="absolute top-4 right-4 z-[10] rounded px-3 py-2 text-sm font-medium bg-white text-black shadow hover:opacity-90 transition"
          onClick={handleClose}
          aria-label="画面を閉じる"
        >
          閉じる
        </button>
      )}
    </div>
  );
}
