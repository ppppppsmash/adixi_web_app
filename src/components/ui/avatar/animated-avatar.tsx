"use client";

import { useState, useRef, useEffect } from "react";
import {
  motion,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "motion/react";

export const AnimatedAvatar = ({
  items,
  size = "md",
}: {
  items: {
    id: number;
    name: string;
    designation: string;
    image: string;
    /** リモートカメラ共有時 */
    stream?: MediaStream | null;
  }[];
  size?: "sm" | "md";
}) => {
  const sizeClass = size === "sm" ? "h-10 w-10" : "h-14 w-14";
  const imgSize = size === "sm" ? 40 : 100;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const springConfig = { stiffness: 100, damping: 15 };
  const x = useMotionValue(0);
  const animationFrameRef = useRef<number | null>(null);

  const rotate = useSpring(
    useTransform(x, [-100, 100], [-45, 45]),
    springConfig,
  );
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-50, 50]),
    springConfig,
  );

  const handleMouseMove = (event: React.MouseEvent<HTMLImageElement | HTMLVideoElement>) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const halfWidth = event.currentTarget.getBoundingClientRect().width / 2;
      x.set(event.clientX - halfWidth);
    });
  };

  return (
    <>
      {items.map((item) => (
        <AvatarItem
          key={item.id}
          item={item}
          imgSize={imgSize}
          sizeClass={sizeClass}
          size={size}
          hoveredIndex={hoveredIndex}
          setHoveredIndex={setHoveredIndex}
          translateX={translateX}
          rotate={rotate}
          handleMouseMove={handleMouseMove}
        />
      ))}
    </>
  );
};

function AvatarItem({
  item,
  imgSize,
  sizeClass,
  size,
  hoveredIndex,
  setHoveredIndex,
  translateX,
  rotate,
  handleMouseMove,
}: {
  item: { id: number; name: string; designation: string; image: string; stream?: MediaStream | null };
  imgSize: number;
  sizeClass: string;
  size: "sm" | "md";
  hoveredIndex: number | null;
  setHoveredIndex: (n: number | null) => void;
  translateX: ReturnType<typeof useSpring>;
  rotate: ReturnType<typeof useSpring>;
  handleMouseMove: (e: React.MouseEvent<HTMLImageElement | HTMLVideoElement>) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!item.stream || !videoRef.current) return;
    videoRef.current.srcObject = item.stream;
  }, [item.stream]);
  const hasVideo = item.stream != null && item.stream.active;
  return (
    <div
      className="group relative -mr-4"
      onMouseEnter={() => setHoveredIndex(item.id)}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <AnimatePresence>
        {hoveredIndex === item.id && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.6 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { type: "spring", stiffness: 260, damping: 10 },
            }}
            exit={{ opacity: 0, y: 20, scale: 0.6 }}
            style={{ translateX, rotate, whiteSpace: "nowrap" }}
            className={`absolute left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-md bg-black px-3 py-1.5 text-xs shadow-xl ${size === "sm" ? "-top-12" : "-top-16"}`}
          >
            <div className="absolute inset-x-10 -bottom-px z-30 h-px w-[20%] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
            <div className="absolute -bottom-px left-10 z-30 h-px w-[40%] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
            <div className="relative z-30 text-base font-bold text-white">{item.name}</div>
            <div className="text-xs text-white">{item.designation}</div>
          </motion.div>
        )}
      </AnimatePresence>
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onMouseMove={handleMouseMove}
          height={imgSize}
          width={imgSize}
          aria-label={item.name}
          className={`relative !m-0 rounded-full border-2 border-white object-cover object-center !p-0 transition duration-500 group-hover:z-30 group-hover:scale-105 ${sizeClass}`}
        />
      ) : (
        <img
          onMouseMove={handleMouseMove}
          height={imgSize}
          width={imgSize}
          src={item.image}
          alt={item.name}
          className={`relative !m-0 rounded-full border-2 border-white object-cover object-top !p-0 transition duration-500 group-hover:z-30 group-hover:scale-105 ${sizeClass}`}
        />
      )}
    </div>
  );
}
