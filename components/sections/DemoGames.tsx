import { Gamepad2, Sparkles } from "lucide-react";
import PhoneDemo, { Bullet } from "./PhoneDemo";
import MatchGameScreen from "@/components/phone/MatchGameScreen";

/** Demo 03 — the minigames you play the moment you match. */
export default function DemoGames() {
  return (
    <PhoneDemo
      id="games"
      index="03"
      title={
        <>
          Skip the <span className="italic text-sage">Small Talk</span>
        </>
      }
      tagline="Match, then play — never text."
      body="Chat stays locked. Quick minigames reveal the real them before you meet."
      phone={<MatchGameScreen />}
    >
      <Bullet icon={<Gamepad2 strokeWidth={1.5} className="h-5 w-5" />} term="No dry openers" delay={340}>
        No “hey, how was your week?” loops. Ever.
      </Bullet>
      <Bullet icon={<Sparkles strokeWidth={1.5} className="h-5 w-5" />} term="Spark before commitment" delay={420}>
        Feel the chemistry in-app, before the night out.
      </Bullet>
    </PhoneDemo>
  );
}
