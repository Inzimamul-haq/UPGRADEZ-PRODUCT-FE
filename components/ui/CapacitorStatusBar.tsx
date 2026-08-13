"use client";

import { useEffect } from "react";

export default function CapacitorStatusBar() {
  useEffect(() => {
    import("@capacitor/status-bar").then(({ StatusBar, Style }) => {
      StatusBar.setBackgroundColor({ color: "#1C1C1B" }).catch(() => {});
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    });
  }, []);

  return null;
}