import { useEffect, useRef, useState } from "react";
import { REALTIME_LISTEN_TYPES } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

const WEBRTC_EVENT = "webrtc_signal";

type SignalPayload = {
  from: string;
  to: string;
  type: "offer" | "answer" | "ice";
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

/**
 * カメラ映像を他ユーザーに WebRTC で共有する。
 * Supabase Realtime の broadcast で offer/answer/ICE を交換する。
 * 共有はリアルタイムのみ（送信・保存しない）。
 */
export function useWebRTCCameraShare(
  surveyId: string | null,
  myPresenceKey: string | null,
  otherPresenceKeys: string[],
  localStream: MediaStream | null
) {
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [channelReady, setChannelReady] = useState(false);
  const [offerRetryTick, setOfferRetryTick] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  /** 相手ごとに「送信用」「受信用」の2本の PeerConnection を保持（双方向で複数人がカメラON可能にする） */
  const peersRef = useRef<Map<string, { send?: RTCPeerConnection; recv?: RTCPeerConnection }>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  useEffect(() => {
    if (!surveyId || !myPresenceKey) {
      setChannelReady(false);
      return;
    }

    const topic = `survey:${surveyId}:webrtc`;
    const channel = supabase.channel(topic);

    channel
      .on(REALTIME_LISTEN_TYPES.BROADCAST, { event: WEBRTC_EVENT }, (message: { payload: SignalPayload }) => {
        const payload = message.payload;
        if (import.meta.env.DEV && payload) {
          console.log("[useWebRTCCameraShare] broadcast received", payload.type, "to=" + payload.to?.slice(0, 8) + "...", "from=" + payload.from?.slice(0, 8) + "...");
        }
        if (!payload || payload.to !== myPresenceKey) return;
        const from = payload.from;
        if (from === myPresenceKey) return;

        if (payload.type === "offer") {
          const pc = new RTCPeerConnection(rtcConfig);
          const removeRemoteStream = () => {
            setRemoteStreams((prev) => {
              const next = new Map(prev);
              if (next.has(from)) {
                next.delete(from);
                return next;
              }
              return prev;
            });
          };
          pc.ontrack = (e) => {
            const stream = e.streams[0];
            if (stream) {
              setRemoteStreams((prev) => {
                const next = new Map(prev);
                next.set(from, stream);
                return next;
              });
              stream.getTracks().forEach((track) => {
                track.onended = removeRemoteStream;
              });
            }
          };
          pc.onicecandidate = (e) => {
            if (e.candidate && channelRef.current) {
              channelRef.current.send({
                type: "broadcast",
                event: WEBRTC_EVENT,
                payload: { from: myPresenceKey, to: from, type: "ice", candidate: e.candidate.toJSON() },
              });
            }
          };
          pc.onconnectionstatechange = () => {
            if (pc.connectionState === "failed" || pc.connectionState === "closed" || pc.connectionState === "disconnected") {
              const entry = peersRef.current.get(from);
              if (entry) {
                delete entry.recv;
                if (!entry.send && !entry.recv) peersRef.current.delete(from);
              }
              removeRemoteStream();
            }
          };
          const entry = peersRef.current.get(from) ?? {};
          entry.recv = pc;
          peersRef.current.set(from, entry);
          pc.setRemoteDescription(new RTCSessionDescription(payload.sdp!))
            .then(() => pc.createAnswer())
            .then((answer) => pc.setLocalDescription(answer))
            .then(() => {
              if (channelRef.current) {
                channelRef.current.send({
                  type: "broadcast",
                  event: WEBRTC_EVENT,
                  payload: {
                    from: myPresenceKey,
                    to: from,
                    type: "answer",
                    sdp: pc.localDescription!.toJSON(),
                  },
                });
              }
            })
            .catch(console.error);
          const pending = pendingCandidatesRef.current.get(from);
          if (pending?.length) {
            pendingCandidatesRef.current.delete(from);
            pending.forEach((c) => pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {}));
          }
        } else if (payload.type === "answer") {
          const entry = peersRef.current.get(from);
          const pc = entry?.send;
          if (pc) {
            pc.setRemoteDescription(new RTCSessionDescription(payload.sdp!))
              .then(() => {
                const pending = pendingCandidatesRef.current.get(from);
                if (pending?.length) {
                  pendingCandidatesRef.current.delete(from);
                  pending.forEach((c) => pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {}));
                }
              })
              .catch(console.error);
          }
        } else if (payload.type === "ice") {
          const entry = peersRef.current.get(from);
          const candidate = payload.candidate;
          if (!candidate) return;
          if (entry?.send?.remoteDescription) {
            entry.send.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
          } else if (entry?.recv?.remoteDescription) {
            entry.recv.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
          } else if (entry) {
            const pending = pendingCandidatesRef.current.get(from) ?? [];
            pending.push(candidate);
            pendingCandidatesRef.current.set(from, pending);
          }
        }
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        channelRef.current = channel;
        setChannelReady(true);
        if (import.meta.env.DEV) {
          console.log("[useWebRTCCameraShare] channel SUBSCRIBED, topic:", topic);
        }
      });

    return () => {
      setChannelReady(false);
      peersRef.current.forEach((entry) => {
        entry.send?.close();
        entry.recv?.close();
      });
      peersRef.current.clear();
      pendingCandidatesRef.current.clear();
      setRemoteStreams(new Map());
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [surveyId, myPresenceKey]);

  // チャンネル接続済みかつカメラONのとき、他ユーザーへ offer を送る（リトライ時は未接続の peer を閉じて再送）
  useEffect(() => {
    if (!channelReady || !channelRef.current || !localStream || otherPresenceKeys.length === 0) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const channel = channelRef.current;
    const myKey = myPresenceKey!;

    if (offerRetryTick > 0) {
      otherPresenceKeys.forEach((toKey) => {
        if (toKey === myKey) return;
        const entry = peersRef.current.get(toKey);
        const sendPc = entry?.send;
        if (sendPc && sendPc.connectionState !== "connected") {
          sendPc.close();
          if (entry) {
            delete entry.send;
            if (!entry.recv) peersRef.current.delete(toKey);
          }
        }
      });
    }

    for (const toKey of otherPresenceKeys) {
      if (toKey === myKey) continue;
      const entry = peersRef.current.get(toKey) ?? {};
      if (entry.send) continue;

      const pc = new RTCPeerConnection(rtcConfig);
      pc.addTrack(videoTrack, localStream);
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          channel.send({
            type: "broadcast",
            event: WEBRTC_EVENT,
            payload: { from: myKey, to: toKey, type: "ice", candidate: e.candidate.toJSON() },
          });
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          const e = peersRef.current.get(toKey);
          if (e && e.send === pc) {
            delete e.send;
            if (!e.recv) peersRef.current.delete(toKey);
          }
        }
      };
      entry.send = pc;
      peersRef.current.set(toKey, entry);
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          channel.send({
            type: "broadcast",
            event: WEBRTC_EVENT,
            payload: {
              from: myKey,
              to: toKey,
              type: "offer",
              sdp: pc.localDescription!.toJSON(),
            },
          });
          if (import.meta.env.DEV) {
            console.log("[useWebRTCCameraShare] offer sent to", toKey.slice(0, 8) + "...");
          }
        })
        .catch((err) => {
          console.error("[useWebRTCCameraShare] createOffer error:", err);
          const e = peersRef.current.get(toKey);
          if (e && e.send === pc) {
            delete e.send;
            if (!e.recv) peersRef.current.delete(toKey);
          }
        });
    }
  }, [channelReady, myPresenceKey, localStream?.id ?? null, otherPresenceKeys.join(","), offerRetryTick]);

  // 相手が webrtc チャンネルに subscribe する前に offer が送られると届かないため、2秒・5秒後に再送する
  useEffect(() => {
    if (!channelReady || !localStream || otherPresenceKeys.length === 0) return;
    const t1 = setTimeout(() => setOfferRetryTick((n) => n + 1), 2000);
    const t2 = setTimeout(() => setOfferRetryTick((n) => n + 1), 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [channelReady, localStream?.id ?? null, otherPresenceKeys.join(",")]);

  // カメラOFFにしたら送信用 Peer をすべて閉じる（相手側で track ended → 表示が消える）
  useEffect(() => {
    if (localStream != null) return;
    peersRef.current.forEach((entry, key) => {
      if (entry.send) {
        entry.send.getSenders().forEach((sender) => sender.track?.stop());
        entry.send.close();
        delete entry.send;
        if (!entry.recv) peersRef.current.delete(key);
      }
    });
  }, [localStream?.id ?? null]);

  // 他ユーザーが減ったら不要な peer を閉じる
  useEffect(() => {
    const keysSet = new Set(otherPresenceKeys);
    peersRef.current.forEach((entry, key) => {
      if (!keysSet.has(key) || key === myPresenceKey) {
        entry.send?.close();
        entry.recv?.close();
        peersRef.current.delete(key);
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      }
    });
  }, [otherPresenceKeys.join(","), myPresenceKey]);

  return { remoteStreams };
}
