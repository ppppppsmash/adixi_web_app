import type { OtherCursor } from "../../hooks/useRealtimeCursors";

type Props = {
  cursors: OtherCursor[];
};

/** 他ユーザーのカーソルを表示するオーバーレイ（pointer-events: none でクリックは透過） */
export function RealtimeCursorsOverlay({ cursors }: Props) {
  if (cursors.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100]"
      aria-hidden
    >
      {cursors.map(({ key, cursor, color, name }) => (
        <div
          key={key}
          className="absolute transition-[left,top] duration-75 ease-out"
          style={{
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
            transform: "translate(-2px, -2px)",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="drop-shadow-md"
            style={{ color }}
          >
            <path
              d="M5 3L5 21L10 14L14 21L16 19L12 12L20 10L5 3Z"
              fill="currentColor"
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="1"
            />
          </svg>
          <span
            className="ml-4 -mt-5 block rounded px-2 py-0.5 text-xs font-medium text-white shadow"
            style={{ backgroundColor: color, maxWidth: "120px" }}
          >
            {name}
          </span>
        </div>
      ))}
    </div>
  );
}
