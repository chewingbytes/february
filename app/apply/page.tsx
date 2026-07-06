import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import QuestionnaireForm from "@/components/QuestionnaireForm";

export const metadata: Metadata = {
  title: "Apply · Player2 Pilot Game Night — Sat, July 11",
  description:
    "Apply for Player2's first hosted game night in central Singapore, Saturday July 11. A few quick questions so we can pair you with your match.",
};

/**
 * /apply — the pilot-event application. A focused, single-column page (no site
 * nav) that centers the questionnaire wizard on alabaster. The global paper
 * grain + fonts come from the root layout.
 */
export default function ApplyPage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-5 py-8 md:py-12">
      {/* slim header */}
      <div className="flex w-full max-w-xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="playertwo.place home">
          <Image src="/actuallogo.png" alt="playertwo.place" width={36} height={36} className="h-9 w-9 rounded-sm" />
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border border-stone bg-card px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-widest text-forest/60">
          <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
          Pilot · Sat 11 Jul
        </span>
      </div>

      {/* card */}
      <div className="flex w-full flex-1 items-center justify-center py-10">
        <div className="w-full max-w-xl rounded-[32px] border border-stone bg-card p-7 shadow-large md:p-10">
          <QuestionnaireForm />
        </div>
      </div>

      <p className="max-w-xl text-center text-xs leading-relaxed text-forest/40">
        Applications for this Saturday close Thursday. We review every one by hand.
      </p>
    </main>
  );
}
