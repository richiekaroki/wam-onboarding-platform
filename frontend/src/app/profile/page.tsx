import type { Metadata } from "next";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your Mr.Wam account profile.",
};

export default function Page() {
  return <ProfileClient />;
}
