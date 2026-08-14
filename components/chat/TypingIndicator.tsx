import React, { useEffect, useState } from "react";
import Image from "next/image";

const STATES = [
  "Surfing",
  "Thinking",
  "Pondering",
  "Contemplating",
  "Unraveling",
  "Deliberating",
];

export function TypingIndicator() {
  const [state, setState] = useState(STATES[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setState((current) => {
        const availableStates = STATES.filter((s) => s !== current);
        return availableStates[
          Math.floor(Math.random() * availableStates.length)
        ];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm">
      <Image src="/icons/icon.png" alt="" width={18} height={18} className="shrink-0 object-contain" />
      <span className="shimmer-text">{state}</span>
    </div>
  );
}