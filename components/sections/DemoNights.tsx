import { PartyPopper, ShieldCheck } from "lucide-react";
import PhoneDemo, { Bullet } from "./PhoneDemo";
import NightsScreen from "@/components/phone/NightsScreen";

/** Demo 01 — the goal: highly compatible matches, out at a hosted game night. */
export default function DemoNights() {
  return (
    <PhoneDemo
      id="how"
      staticOnMobile
      index="01"
      title={
        <>
          Show Up and <span className="italic text-sage">Play</span>
        </>
      }
      tagline="Real nights out with people you'd actually click with."
      body="Our whole reason for existing: getting highly compatible people off their phones and into hosted group game nights. We cluster you with one or two other well-matched couples, book the venue, and hand the night to a live host — so you just show up and play."
      phone={<NightsScreen />}
    >
      <Bullet icon={<PartyPopper strokeWidth={1.5} className="h-5 w-5" />} term="Hosted, never left to chance" delay={340}>
        A live host runs the room and keeps the energy up, so the night stays fluid and nobody
        faces a single second of awkward silence.
      </Bullet>
      <Bullet icon={<ShieldCheck strokeWidth={1.5} className="h-5 w-5" />} term="A great night, guaranteed" delay={420}>
        Even if a romantic spark doesn&rsquo;t hit with your match, you still walk away from a fun,
        safe night out with a vetted peer group.
      </Bullet>
    </PhoneDemo>
  );
}
