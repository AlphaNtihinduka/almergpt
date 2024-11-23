import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      Welcome to the Almer GPT
      <Button>
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button>
        <Link href="/sign-up">Register</Link>
      </Button>
    </div>
  );
}
