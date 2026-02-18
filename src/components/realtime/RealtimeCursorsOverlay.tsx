import { memo, useEffect, useRef, type RefObject } from "react";
import type { MyCursorInfo, OtherCursor } from "../../hooks/useRealtimeCursors";

const CURSOR_TRANSITION = "left 0.1s linear, top 0.1s linear";
const MONITOR_FONT = "monofont, 'JetBrains Mono', 'M PLUS 1 Code', Consolas, Monaco, monospace";

export type RealtimeCursorsOverlayProps = {
  cursors: OtherCursor[];
  myCursorRef: RefObject<HTMLDivElement | null>;
  myCursorInfo: MyCursorInfo | null;
  /** モニター内テキストと同じ色（テーマ色で統一） */
  accentColor: string;
  /** 自カーソルにカメラ映像を表示する場合 */
  cameraStream?: MediaStream | null;
  /** 他ユーザーのカメラストリーム（presence key → MediaStream） */
  remoteStreams?: Map<string, MediaStream>;
};

type Props = RealtimeCursorsOverlayProps;

function MyCursorVideo({ stream }: { stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !stream) return;
    v.srcObject = stream;
  }, [stream]);
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="h-18 w-18 rounded-none border-2 border-white object-cover object-center shadow-md"
    />
  );
}

/** 80s/90s 風カーソル：細い矢印（当時のパソコンらしいシンプルなポインター） */
function RetroCursorPointer({ color }: { color: string }) {
  return (
    <svg
      className="shrink-0"
      viewBox="0 0 16 16"
      width="20"
      height="20"
      style={{
        filter: `drop-shadow(0 0 2px ${color}80)`,
        transform: "translate(-2px, -2px)",
      }}
    >
      <path
        d="M2 2l4 12 2-5 5-2z"
        fill={color}
        stroke={color}
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 自カーソルは ref で DOM 直接更新（再レンダーなし）、他は CSS transition のみで軽量 */
export function RealtimeCursorsOverlay({
  cursors,
  myCursorRef,
  myCursorInfo,
  accentColor,
  cameraStream,
  remoteStreams,
}: Props) {
  const showVideo = myCursorInfo && cameraStream && cameraStream.active;
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[200]"
      aria-hidden
    >
      {myCursorInfo && (
        <div
          ref={myCursorRef}
          className={`absolute z-50 flex items-center gap-1 ${showVideo ? "" : "items-baseline"}`}
          style={{
            pointerEvents: "none",
            transition: "none",
            ...(showVideo ? { transform: "translate(-50%, -50%)" } : {}),
          }}
        >
          {showVideo ? (
            <>
              <MyCursorVideo stream={cameraStream} />
              <span
                className="min-w-max rounded-none px-2 py-1.5 text-xs font-medium whitespace-nowrap"
                style={{
                  fontFamily: MONITOR_FONT,
                  color: accentColor,
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: `1px solid ${accentColor}40`,
                  boxShadow: `0 0 6px ${accentColor}30`,
                }}
              >
                {myCursorInfo.name}
              </span>
            </>
          ) : (
            <>
              <RetroCursorPointer color={accentColor} />
              <span
                className="ml-1 min-w-max rounded-none px-2 py-0.5 text-xs font-medium whitespace-nowrap"
                style={{
                  fontFamily: MONITOR_FONT,
                  color: accentColor,
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: `1px solid ${accentColor}40`,
                  boxShadow: `0 0 6px ${accentColor}30`,
                }}
              >
                {myCursorInfo.name}
              </span>
            </>
          )}
        </div>
      )}
      {cursors.map(({ key, cursor, name }) => (
        <RemoteCursor
          key={key}
          xPercent={cursor.x}
          yPercent={cursor.y}
          accentColor={accentColor}
          name={name}
          stream={remoteStreams?.get(key)}
        />
      ))}
    </div>
  );
}

function RemoteCursorVideo({ stream }: { stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !stream) return;
    v.srcObject = stream;
  }, [stream]);
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="h-18 w-18 rounded-none border-2 border-white object-cover object-center shadow-md"
    />
  );
}

const RemoteCursor = memo(function RemoteCursor({
  xPercent,
  yPercent,
  accentColor,
  name,
  stream,
}: {
  xPercent: number;
  yPercent: number;
  accentColor: string;
  name: string;
  stream?: MediaStream | undefined;
}) {
  const showVideo = stream?.active;
  return (
    <div
      className={`absolute z-50 flex items-center gap-1 ${showVideo ? "" : "items-baseline"}`}
      style={{
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        pointerEvents: "none",
        transition: CURSOR_TRANSITION,
        ...(showVideo ? { transform: "translate(-50%, -50%)" } : {}),
      }}
    >
      {showVideo ? (
        <>
          <RemoteCursorVideo stream={stream} />
          <span
            className="min-w-max rounded-none px-2 py-1.5 text-xs font-medium whitespace-nowrap"
            style={{
              fontFamily: MONITOR_FONT,
              color: accentColor,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              border: `1px solid ${accentColor}40`,
              boxShadow: `0 0 6px ${accentColor}30`,
            }}
          >
            {name}
          </span>
        </>
      ) : (
        <>
          <RetroCursorPointer color={accentColor} />
          <span
            className="ml-1 min-w-max rounded-none px-2 py-0.5 text-xs font-medium whitespace-nowrap"
            style={{
              fontFamily: MONITOR_FONT,
              color: accentColor,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              border: `1px solid ${accentColor}40`,
              boxShadow: `0 0 6px ${accentColor}30`,
            }}
          >
            {name}
          </span>
        </>
      )}
    </div>
  );
});
