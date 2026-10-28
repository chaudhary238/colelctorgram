import { redirect } from "next/navigation";

// Closed beta — no self sign-up (the API refuses it too); accounts are
// provisioned by the team. Old links, incl. referral ?ref= ones, land on login.
export default function SignUpPage() {
  redirect("/auth/signin");
}
