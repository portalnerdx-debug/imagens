import React from "react";

export type AppIconName = "home" | "sale" | "search" | "credit" | "training" | "goals" | "history" | "arrow" | "spark" | "menu";

const paths: Record<AppIconName, React.ReactNode> = {
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></>,
  sale: <><path d="M20 7h-7"/><path d="M14 3v8"/><path d="M5 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M1.8 21a5.2 5.2 0 0 1 10.4 0"/><path d="m14.5 17 2 2 4-5"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/><path d="M8 10h5M8 13h3"/></>,
  credit: <><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/></>,
  training: <><path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/><path d="M22 9v7"/></>,
  goals: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/><path d="m15 7 3-3 3 3"/></>,
  history: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2M4 4 2 7h4"/></>,
  arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
  spark: <><path d="m12 2 1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>
};

export function AppIcon({ name, size = 22 }: { name: AppIconName; size?: number }) {
  return <svg className="appIcon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
