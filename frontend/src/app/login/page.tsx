import { Metadata } from "next";
import { Suspense } from "react";
import LoginPage from "./LoginClient";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Log in to your secure MomPlan account to track applications, upload documents, and manage your family benefit scans.",
};

export default function LoginRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-hero flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginPage />
    </Suspense>
  );
}
