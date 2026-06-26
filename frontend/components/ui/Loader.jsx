"use client";

export default function Loader({ size = 40, className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <video
        src="/images/bike_loader_animation.mp4"
        autoPlay
        loop
        muted
        playsInline
        style={{ width: size, height: size }}
        className="pointer-events-none"
      />
    </div>
  );
}
