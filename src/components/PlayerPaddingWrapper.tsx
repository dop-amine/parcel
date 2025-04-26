"use client";
import { usePlayerStore } from "@/stores/playerStore";
import { useEffect, useState } from "react";

export default function PlayerPaddingWrapper({ children }: { children: React.ReactNode }) {
  const { currentTrack, isMinimized } = usePlayerStore();
  const [padding, setPadding] = useState(0);

  useEffect(() => {
    if (currentTrack && !isMinimized) {
      setPadding(120); // px, slightly more than player height for safety
    } else {
      setPadding(0);
    }
  }, [currentTrack, isMinimized]);

  return (
    <div style={{ paddingBottom: padding }}>
      {children}
    </div>
  );
}