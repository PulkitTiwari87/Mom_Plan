import { Suspense } from "react";
import SettingsPageClient from "./SettingsPageClient";

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-40 bg-surface-container rounded-xl" />}>
      <SettingsPageClient />
    </Suspense>
  );
}
