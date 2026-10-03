import { redirect } from "next/navigation";

export default function VoiceRedirect() {
  // Voice is now built into the AI Stylist page (mic button + speaker toggle)
  // instead of living on its own route.
  redirect("/dashboard/stylist");
}