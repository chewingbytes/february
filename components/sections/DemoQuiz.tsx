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
      tagline="A quiz that actually gets you."
      body="Rate what matters, set your dealbreakers, reveal your Big Five. The algorithm handles the rest."
      phone={<QuizScreen />}
    >
      <Bullet icon={<SlidersHorizontal strokeWidth={1.5} className="h-5 w-5" />} term="Your dealbreakers count" delay={340}>
        Weight every answer — non-negotiables stay non-negotiable.
      </Bullet>
      <Bullet icon={<Fingerprint strokeWidth={1.5} className="h-5 w-5" />} term="Personality, not photos" delay={420}>
        Matched on your Big Five, not a single selfie.
      </Bullet>
    </PhoneDemo>
  );
}
