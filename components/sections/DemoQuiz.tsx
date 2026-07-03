import { SlidersHorizontal, Fingerprint } from "lucide-react";
import PhoneDemo, { Bullet } from "./PhoneDemo";
import QuizScreen from "@/components/phone/QuizScreen";

/** Demo 02 — the comprehensive compatibility quiz behind the matching engine. */
export default function DemoQuiz() {
  return (
    <PhoneDemo
      id="quiz"
      reversed
      index="02"
      title={
        <>
          Answer Once. <span className="italic text-sage">Match Smarter.</span>
        </>
      }
      tagline="A comprehensive quiz that actually understands you."
      body="Before you meet anyone, you complete a deep compatibility quiz. Tell us how much each answer matters to you, which answers you could accept in a partner, and let personality prompts score your Big Five, interests, and lifestyle — so the algorithm can find someone you'd genuinely fall for."
      phone={<QuizScreen />}
    >
      <Bullet icon={<SlidersHorizontal strokeWidth={1.5} className="h-5 w-5" />} term="Weighted to your dealbreakers" delay={340}>
        Rank how much every answer matters and mark the responses you&rsquo;d actually accept — your
        non-negotiables genuinely count in the match.
      </Bullet>
      <Bullet icon={<Fingerprint strokeWidth={1.5} className="h-5 w-5" />} term="Personality, not just photos" delay={420}>
        Big Five prompts map who you really are, then pair you on structure, values, and lifestyle
        — never a swipe on a single selfie.
      </Bullet>
    </PhoneDemo>
  );
}
