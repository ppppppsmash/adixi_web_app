import { useEffect, useRef, useState, type RefObject } from "react";
import { supabase } from "../lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type UseRealtimeCursorsReturn = {
  otherCursors: OtherCursor[];
  myCursorRef: RefObject<HTMLDivElement | null>;
  myCursorInfo: MyCursorInfo;
  setMyCursor: (x: number, y: number) => void;
  /** 自クライアントの presence キー（WebRTC シグナリング等で使用） */
  myPresenceKey: string | null;
};

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

/**
 * ランダムなカーソル色を1つ生成する。
 * HSL で彩度・明度を固定し、白文字が読みやすいトーンにしている。
 */
function randomCursorColor(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 65 + Math.floor(Math.random() * 25); // 65–90%
  const l = 42 + Math.floor(Math.random() * 18); // 42–60%
  return hslToHex(h, s, l);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

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
 * @see https://supabase.com/docs/guides/realtime/presence
 * @see https://supabase.com/docs/guides/realtime/getting_started
 */
export function useRealtimeCursors(
  surveyId: string | null,
  displayName: string = "ゲスト"
): UseRealtimeCursorsReturn {
  const [otherCursors, setOtherCursors] = useState<OtherCursor[]>([]);
  const [myCursorInfo, setMyCursorInfo] = useState<MyCursorInfo>(null);
  const myCursorRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const myKeyRef = useRef<string>(crypto.randomUUID());
  const pendingPosRef = useRef<{ x: number; y: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const [myPresenceKey, setMyPresenceKey] = useState<string | null>(null);
  const [cursorColor] = useState(() => randomCursorColor());
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
        setMyPresenceKey(myKeyRef.current);
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
      setMyPresenceKey(null);
    };
  }, [surveyId, cursorColor]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      pendingPosRef.current = null;
    };
  }, []);

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

  // 他ユーザーへの送信は throttle で送信頻度を抑える
  const throttledTrack = useRef(
    throttle((x: number, y: number) => {
      const ch = channelRef.current;
      if (!ch) return;
      const payload: CursorPresence = {
        ...currentPayloadRef.current,
        cursor: { x, y },
      };
      currentPayloadRef.current = payload;
      ch.track(payload);
    }, 100)
  ).current;

  // 自カーソル: rAF で 1 フレーム 1 回だけ DOM 更新 + transform で GPU レイヤー化（left/top より軽い）
  const setMyCursor = useRef((x: number, y: number) => {
    const payload: CursorPresence = {
      ...currentPayloadRef.current,
      cursor: { x, y },
    };
    currentPayloadRef.current = payload;
    throttledTrack(x, y);

    pendingPosRef.current = { x, y };
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      const p = pendingPosRef.current;
      if (!p) return;
      const el = myCursorRef.current;
      if (el) {
        el.style.left = `${p.x}%`;
        el.style.top = `${p.y}%`;
      }
    });
  }).current;

  return { otherCursors, myCursorRef, myCursorInfo, setMyCursor, myPresenceKey };
}
