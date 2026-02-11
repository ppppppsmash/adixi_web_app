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

/** 自クライアントのカーソル表示用（位置は ref で DOM 直接更新するため、色と名前のみ） */
export type MyCursorInfo = { color: string; name: string } | null;

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
 * displayName は 1 問目（お名前）の入力値で、入力のたびに即時カーソルに反映される。
 * @see https://supabase.com/docs/guides/realtime/presence
 * @see https://supabase.com/docs/guides/realtime/getting_started
 */
export function useRealtimeCursors(
  surveyId: string | null,
  displayName: string = "ゲスト"
) {
  const [otherCursors, setOtherCursors] = useState<OtherCursor[]>([]);
  const [myCursorInfo, setMyCursorInfo] = useState<MyCursorInfo>(null);
  const myCursorRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const myKeyRef = useRef<string>(crypto.randomUUID());
  const [cursorColor] = useState(() =>
    CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]
  );
  const nameToSend = (displayName?.trim() || "ゲスト").slice(0, 20);
  const currentPayloadRef = useRef<CursorPresence>({
    cursor: { x: 0, y: 0 },
    color: cursorColor,
    name: nameToSend,
  });
  currentPayloadRef.current.color = cursorColor;
  currentPayloadRef.current.name = nameToSend;

  useEffect(() => {
    if (!surveyId) {
      setOtherCursors([]);
      setMyCursorInfo(null);
      return;
    }

    const myKey = myKeyRef.current;
    const topic = `survey:${surveyId}:cursors`;

    const channel = supabase.channel(topic, {
      config: {
        presence: { key: myKey },
      },
    });

    const prevOthersRef = { current: [] as OtherCursor[] };
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
        const prev = prevOthersRef.current;
        const prevByKey = new Map(prev.map((o) => [o.key, o]));
        const changed =
          prev.length !== others.length ||
          others.some((o) => {
            const p = prevByKey.get(o.key);
            return (
              !p ||
              Math.abs(p.cursor.x - o.cursor.x) > 1.5 ||
              Math.abs(p.cursor.y - o.cursor.y) > 1.5
            );
          });
        if (changed) {
          prevOthersRef.current = others;
          setOtherCursors(others);
        }
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        const payload = currentPayloadRef.current;
        await channel.track(payload);
        setMyCursorInfo({
          color: payload.color ?? cursorColor,
          name: payload.name ?? "ゲスト",
        });
        const el = myCursorRef.current;
        if (el) {
          el.style.left = `${payload.cursor.x}%`;
          el.style.top = `${payload.cursor.y}%`;
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setOtherCursors([]);
      setMyCursorInfo(null);
    };
  }, [surveyId, cursorColor]);

  // お名前入力が変わったら即時 presence を更新し、自カーソル表示の名前も更新
  useEffect(() => {
    const ch = channelRef.current;
    const payload: CursorPresence = {
      ...currentPayloadRef.current,
      name: nameToSend,
    };
    currentPayloadRef.current = payload;
    if (ch) ch.track(payload);
    setMyCursorInfo((prev) =>
      prev ? { ...prev, name: nameToSend } : null
    );
  }, [nameToSend]);

  const setMyCursor = useRef(
    throttle((x: number, y: number) => {
      const ch = channelRef.current;
      const payload: CursorPresence = {
        ...currentPayloadRef.current,
        cursor: { x, y },
      };
      currentPayloadRef.current = payload;
      if (ch) ch.track(payload);
      const el = myCursorRef.current;
      if (el) {
        el.style.left = `${x}%`;
        el.style.top = `${y}%`;
      }
    }, 100)
  ).current;

  return { otherCursors, myCursorRef, myCursorInfo, setMyCursor };
}
