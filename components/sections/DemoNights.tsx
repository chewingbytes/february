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
      tagline="Nights out with people you'd actually click with."
      body="We match compatible couples, book the venue, and bring a live host. You just show up and play."
      phone={<NightsScreen />}
    >
      <Bullet icon={<PartyPopper strokeWidth={1.5} className="h-5 w-5" />} term="Hosted, never awkward" delay={340}>
        A live host keeps the energy up all night.
      </Bullet>
      <Bullet icon={<ShieldCheck strokeWidth={1.5} className="h-5 w-5" />} term="Always a good night" delay={420}>
        A vetted group and a great venue, every time.
      </Bullet>
    </PhoneDemo>
  );
}
