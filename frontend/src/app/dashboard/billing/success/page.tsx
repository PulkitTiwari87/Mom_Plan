import { Suspense } from "react";
import BillingSuccessClient from "./BillingSuccessClient";

export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BillingSuccessClient />
    </Suspense>
  );
}
