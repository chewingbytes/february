import Nav from "@/components/Nav";
import Hero from "@/components/sections/Hero";
import DemoNights from "@/components/sections/DemoNights";
import DemoQuiz from "@/components/sections/DemoQuiz";
import DemoGames from "@/components/sections/DemoGames";
import Curator from "@/components/sections/Curator";
import Invitation from "@/components/sections/Invitation";

export default function Home() {
  return (
    <main className="relative">
      <Nav />
      <Hero />
      {/* How it works — three live phone demos, goal first */}
      <DemoNights />
      <DemoQuiz />
      <DemoGames />
      <Curator />
      <Invitation />
    </main>
  );
}
