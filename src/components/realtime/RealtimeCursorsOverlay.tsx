import { memo, useEffect, useRef, type RefObject } from "react";
import type { MyCursorInfo, OtherCursor } from "../../hooks/useRealtimeCursors";

const CURSOR_TRANSITION = "left 0.1s linear, top 0.1s linear";

export type RealtimeCursorsOverlayProps = {
  cursors: OtherCursor[];
  myCursorRef: RefObject<HTMLDivElement | null>;
  myCursorInfo: MyCursorInfo | null;
  /** 自カーソルにカメラ映像を表示する場合 */
  cameraStream?: MediaStream | null;
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
      className="h-14 w-14 rounded-full border-2 border-white object-cover object-center shadow-md"
    />
  );
}

/** 自カーソルは ref で DOM 直接更新（再レンダーなし）、他は CSS transition のみで軽量 */
export function RealtimeCursorsOverlay({
  cursors,
  myCursorRef,
  myCursorInfo,
  cameraStream,
}: Props) {
  const showVideo = myCursorInfo && cameraStream && cameraStream.active;
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100]"
      aria-hidden
    >
      {myCursorInfo && (
        <div
          ref={myCursorRef}
          className={`cursor-neo absolute z-50 ${showVideo ? "flex items-center gap-2" : "h-4 w-4"}`}
          style={{
            left: 0,
            top: 0,
            pointerEvents: "none",
            transition: CURSOR_TRANSITION,
            ["--cursor-color" as string]: myCursorInfo.color,
            ...(showVideo ? { transform: "translate(-50%, -50%)" } : {}),
          }}
        >
          {showVideo ? (
            <>
              <MyCursorVideo stream={cameraStream} />
              <span
                className="cursor-neo-label min-w-max rounded-full px-2 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow"
                style={{ backgroundColor: myCursorInfo.color }}
              >
                {myCursorInfo.name}
              </span>
            </>
          ) : (
            <>
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="1"
                viewBox="0 0 16 16"
                className="h-6 w-6 -translate-x-[12px] -translate-y-[10px] -rotate-[70deg] drop-shadow-md"
                style={{ color: myCursorInfo.color }}
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z" />
              </svg>
              <span
                className="cursor-neo-label ml-4 -translate-y-1 min-w-max rounded-full px-2 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow"
                style={{ backgroundColor: myCursorInfo.color }}
              >
                {myCursorInfo.name}
              </span>
            </>
          )}
        </div>
      )}
      {cursors.map(({ key, cursor, color, name }) => (
        <RemoteCursor
          key={key}
          xPercent={cursor.x}
          yPercent={cursor.y}
          color={color}
          name={name}
        />
      ))}
    </div>
  );
}

const RemoteCursor = memo(function RemoteCursor({
  xPercent,
  yPercent,
  color,
  name,
}: {
  xPercent: number;
  yPercent: number;
  color: string;
  name: string;
}) {
  return (
    <div
      className="cursor-neo absolute z-50 h-4 w-4"
      style={{
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        pointerEvents: "none",
        transition: CURSOR_TRANSITION,
        ["--cursor-color" as string]: color,
      }}
    >
      <svg
        stroke="currentColor"
        fill="currentColor"
        strokeWidth="1"
        viewBox="0 0 16 16"
        className="h-6 w-6 -translate-x-[12px] -translate-y-[10px] -rotate-[70deg] drop-shadow-md"
        style={{ color }}
        height="1em"
        width="1em"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z" />
      </svg>
      <span
        className="cursor-neo-label ml-4 -translate-y-1 min-w-max rounded-full px-2 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow"
        style={{ backgroundColor: color }}
      >
        {name}
      </span>
    </div>
  );
});
