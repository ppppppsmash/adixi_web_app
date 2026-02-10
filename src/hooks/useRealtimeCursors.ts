/* eslint-disable react-hooks/refs */
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type CursorPresence = {
  cursor: { x: number; y: number };
  color?: string;
  name?: string;
};

export type OtherCursor = {
  key: string;
  cursor: { x: number; y: number };
  color: string;
  name: string;
};

const CURSOR_COLORS = [
  "#61dca3",
  "#61b3dc",
  "#dc61b3",
  "#dca361",
  "#b361dc",
  "#61dcb3",
];

function throttle<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number
): (...args: A) => void {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const run = (...args: A) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        last = Date.now();
        fn(...args);
      }, ms - (now - last));
    }
  };
  return run;
}

/**
 * 同じ surveyId の画面にいる他ユーザーの Presence を購読し、
 * 自クライアントのカーソルを track するためのフック。
 * @see https://supabase.com/docs/guides/realtime/presence
 * @see https://supabase.com/docs/guides/realtime/getting_started
 */
export function useRealtimeCursors(surveyId: string | null) {
  const [otherCursors, setOtherCursors] = useState<OtherCursor[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const myKeyRef = useRef<string>(crypto.randomUUID());
  const [cursorColor] = useState(() =>
    CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]
  );
  const currentPayloadRef = useRef<CursorPresence>({
    cursor: { x: 0, y: 0 },
    color: cursorColor,
    name: "ゲスト",
  });
  currentPayloadRef.current.color = cursorColor;

  useEffect(() => {
    if (!surveyId) {
      setOtherCursors([]);
      return;
    }

    const myKey = myKeyRef.current;
    const topic = `survey:${surveyId}:cursors`;

    const channel = supabase.channel(topic, {
      config: {
        presence: { key: myKey },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<CursorPresence>();
        const others: OtherCursor[] = [];
        for (const [key, presences] of Object.entries(state)) {
          if (key === myKey) continue;
          const first = Array.isArray(presences) ? presences[0] : presences;
          if (!first?.cursor) continue;
          others.push({
            key,
            cursor: first.cursor,
            color: first.color ?? "#61dca3",
            name: first.name ?? "ゲスト",
          });
        }
        setOtherCursors(others);
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        const payload = currentPayloadRef.current;
        await channel.track(payload);
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setOtherCursors([]);
    };
  }, [surveyId]);

  const setMyCursor = useRef(
    // eslint-disable-next-line react-hooks/refs
    throttle((x: number, y: number) => {
      const ch = channelRef.current;
      if (!ch) return;
      const payload: CursorPresence = {
        ...currentPayloadRef.current,
        cursor: { x, y },
      };
      currentPayloadRef.current = payload;
      ch.track(payload);
    }, 50)
  ).current;

  return { otherCursors, setMyCursor };
}
