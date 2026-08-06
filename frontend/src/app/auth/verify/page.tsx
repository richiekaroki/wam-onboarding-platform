import type { Metadata } from "next";
import VerifyClient from "./VerifyClient";

export const metadata: Metadata = {
  title: "Signing In",
  description: "Verifying your magic link and signing you in.",
};

export default function Page() {
  return <VerifyClient />;
}
