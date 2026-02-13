import scanlinesImg from "../../../images/scanlines.png";

/**
 * 画面全体に重なる CRT スキャンライン
 * - 静的な水平スキャンライン（scanlines.png 画像で常時表示）
 * - 動的スキャンライン：上から下へ流れる走査線（オプション）
 */
export function CrtScanlines({ dynamic = true }: { dynamic?: boolean }) {
  return (
    <div
      className="crt-scanlines-overlay"
      aria-hidden
      style={{ pointerEvents: "none" }}
    >
      {/* 静的な水平スキャンライン（画像） */}
      <div
        className="crt-scanlines-static"
        style={{ backgroundImage: `url(${scanlinesImg})` }}
      />
      {/* 動的：上→下に流れる走査線 */}
      {dynamic && <div className="crt-scanlines-beam" />}
    </div>
  );
}
