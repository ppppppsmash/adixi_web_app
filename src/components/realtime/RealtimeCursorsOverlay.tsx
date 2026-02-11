import { motion, AnimatePresence } from "motion/react";
import type { OtherCursor } from "../../hooks/useRealtimeCursors";

type Props = {
  cursors: OtherCursor[];
};

/** following-pointer と同じ UI で他ユーザーのカーソルを表示（pointer-events: none） */
export function RealtimeCursorsOverlay({ cursors }: Props) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100]"
      aria-hidden
    >
      <AnimatePresence>
        {cursors.map(({ key, cursor, color, name }) => (
          <RemoteCursor
            key={key}
            xPercent={cursor.x}
            yPercent={cursor.y}
            color={color}
            name={name}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/** following-pointer と同じ矢印＋ラベルスタイルのリモートカーソル */
function RemoteCursor({
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
    <motion.div
      className="absolute z-50 h-4 w-4"
      style={{ pointerEvents: "none" }}
      initial={{
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        scale: 0.5,
        opacity: 0,
      }}
      animate={{
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        scale: 1,
        opacity: 1,
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        left: { type: "spring", stiffness: 500, damping: 28 },
        top: { type: "spring", stiffness: 500, damping: 28 },
        scale: { duration: 0.2 },
        opacity: { duration: 0.2 },
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
      <motion.div
        style={{ backgroundColor: color }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="ml-4 -translate-y-1 min-w-max rounded-full px-2 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow"
      >
        {name}
      </motion.div>
    </motion.div>
  );
}
