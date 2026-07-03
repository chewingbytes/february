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
      tagline="The moment you match, you play — you don't text."
      body="When the engine finds someone compatible, plain messaging stays locked. Instead you drop into quick, Smitten-style minigames — scratch cards, this-or-that, rapid-fire rounds — that surface humor, chemistry, and real personality before you ever spend a night out."
      phone={<MatchGameScreen />}
    >
      <Bullet icon={<Gamepad2 strokeWidth={1.5} className="h-5 w-5" />} term="No dry openers" delay={340}>
        Discover their sense of humor and competitive streak in minutes — no agonizing “hey, how
        was your week?” loop to kill the chemistry.
      </Bullet>
      <Bullet icon={<Sparkles strokeWidth={1.5} className="h-5 w-5" />} term="Chemistry before commitment" delay={420}>
        Feel the spark in-app first, so every hosted night out is with someone you&rsquo;re already
        genuinely excited to meet.
      </Bullet>
    </PhoneDemo>
  );
}
