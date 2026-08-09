import React, { useEffect, useState } from "react";

const STATES = [
  "Thinking...",
  "Pondering...",
  "Contemplating...",
  "Unraveling...",
  "Deliberating...",
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
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>{state}</span>
    </div>
  );
}