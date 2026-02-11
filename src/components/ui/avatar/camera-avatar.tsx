import { useRef, useEffect } from "react";

export function CameraAvatar({
  stream,
  name,
  size = "sm",
}: {
  stream: MediaStream;
  name: string;
  size?: "sm" | "md";
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sizeClass = size === "sm" ? "h-10 w-10" : "h-14 w-14";

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
  }, [stream]);

  return (
    <div className="group relative -mr-4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        title={name}
        className={`relative !m-0 rounded-full border-2 border-white object-cover object-center !p-0 transition duration-500 group-hover:z-30 group-hover:scale-105 ${sizeClass}`}
      />
      <div className="pointer-events-none absolute -top-12 left-1/2 z-30 -translate-x-1/2 rounded-md bg-black px-3 py-1.5 text-xs text-white shadow-xl">
        {name}
      </div>
    </div>
  );
}
