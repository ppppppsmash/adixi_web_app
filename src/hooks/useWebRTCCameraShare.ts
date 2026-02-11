import { useEffect, useRef, useState } from "react";
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
  const channelRef = useRef<RealtimeChannel | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  useEffect(() => {
    if (!surveyId || !myPresenceKey) {
      setChannelReady(false);
      return;
    }

    const topic = `survey:${surveyId}:webrtc`;
    const channel = supabase.channel(topic);

    channel
      .on("broadcast", { event: WEBRTC_EVENT }, ({ payload }: { payload: SignalPayload }) => {
        if (payload.to !== myPresenceKey) return;
        const from = payload.from;
        if (from === myPresenceKey) return;

        if (payload.type === "offer") {
          const pc = new RTCPeerConnection(rtcConfig);
          pc.ontrack = (e) => {
            const stream = e.streams[0];
            if (stream) {
              setRemoteStreams((prev) => {
                const next = new Map(prev);
                next.set(from, stream);
                return next;
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
            if (pc.connectionState === "failed" || pc.connectionState === "closed") {
              peersRef.current.delete(from);
              setRemoteStreams((prev) => {
                const next = new Map(prev);
                next.delete(from);
                return next;
              });
            }
          };
          peersRef.current.set(from, pc);
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
          const pc = peersRef.current.get(from);
          if (pc) pc.setRemoteDescription(new RTCSessionDescription(payload.sdp!)).catch(console.error);
        } else if (payload.type === "ice") {
          const pc = peersRef.current.get(from);
          const candidate = payload.candidate;
          if (!candidate) return;
          if (pc) {
            if (pc.remoteDescription) {
              pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
            } else {
              const pending = pendingCandidatesRef.current.get(from) ?? [];
              pending.push(candidate);
              pendingCandidatesRef.current.set(from, pending);
            }
          }
        }
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        channelRef.current = channel;
        setChannelReady(true);
      });

    return () => {
      setChannelReady(false);
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      pendingCandidatesRef.current.clear();
      setRemoteStreams(new Map());
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [surveyId, myPresenceKey]);

  // チャンネル接続済みかつカメラONのとき、他ユーザーへ offer を送る
  useEffect(() => {
    if (!channelReady || !channelRef.current || !localStream || otherPresenceKeys.length === 0) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const channel = channelRef.current;
    const myKey = myPresenceKey!;
    for (const toKey of otherPresenceKeys) {
      if (toKey === myKey) continue;
      if (peersRef.current.has(toKey)) continue;

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
          peersRef.current.delete(toKey);
        }
      };
      peersRef.current.set(toKey, pc);
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
        })
        .catch((err) => {
          console.error("[useWebRTCCameraShare] createOffer error:", err);
          peersRef.current.delete(toKey);
        });
    }
  }, [channelReady, myPresenceKey, localStream?.id ?? null, otherPresenceKeys.join(",")]);

  // 他ユーザーが減ったら不要な peer を閉じる
  useEffect(() => {
    const keysSet = new Set(otherPresenceKeys);
    peersRef.current.forEach((pc, key) => {
      if (!keysSet.has(key) || key === myPresenceKey) {
        pc.close();
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
