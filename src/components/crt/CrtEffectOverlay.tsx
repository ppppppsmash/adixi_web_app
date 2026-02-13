import { useEffect, useRef } from "react";

const TURN_ON_MS = 4000;
const TURN_OFF_MS = 550;

/**
 * CRT の ON/OFF エフェクトだけを再生するオーバーレイ（CodePen lbebber/XJRdrV 参考）
 * アプリの表示・操作は変えず、最初と最後にエフェクトをかけるだけ
 */
export function CrtEffectOverlay({
  show,
  mode,
  onEnd,
}: {
  show: boolean;
  mode: "on" | "off";
  onEnd: () => void;
}) {
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  useEffect(() => {
    if (!show) return;
    const duration = mode === "on" ? TURN_ON_MS : TURN_OFF_MS;
    const t = setTimeout(() => {
      onEndRef.current();
    }, duration);
    return () => clearTimeout(t);
  }, [show, mode]);

  if (!show) return null;

  const isOn = mode === "on";
  return (
    <div
      className="crt-effect-overlay"
      aria-hidden
      style={{ pointerEvents: "none" }}
    >
      <div
        className={`crt-effect-screen ${isOn ? "crt-effect-turn-on" : "crt-effect-turn-off"}`}
        style={{
          animationDuration: isOn ? "4s" : "0.55s",
          animationTimingFunction: isOn ? "linear" : "cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      />
      {isOn && (
        <div className="crt-effect-overlay-label" aria-hidden>
          AV-1
        </div>
      )}
    </div>
  );
}
