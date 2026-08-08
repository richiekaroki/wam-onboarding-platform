// frontend/src/app/submissions/page.tsx
import type { Metadata } from "next";
import SubmissionsClient from "./SubmissionsClient";

export const metadata: Metadata = {
  title: "My Submissions — Mr.Wam",
  description: "Track the status of your onboarding submissions.",
};

export default function SubmissionsPage() {
  return <SubmissionsClient />;
}
