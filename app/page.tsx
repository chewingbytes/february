import Nav from "@/components/Nav";
import Hero from "@/components/sections/Hero";
import HowItWorks from "@/components/sections/HowItWorks";
import Curator from "@/components/sections/Curator";
import PilotEvent from "@/components/sections/PilotEvent";
import Invitation from "@/components/sections/Invitation";

export default function Home() {
  return (
    <main className="relative">
      <Nav />
      <Hero />
      {/* How it works — the three-move story as a fan of slanted cards */}
      <HowItWorks />
      <Curator />
      {/* Pilot launch — sits right after meeting the host who runs the night */}
      <PilotEvent />
      <Invitation />
    </main>
  );
}
