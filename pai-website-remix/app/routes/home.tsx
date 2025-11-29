import type { Route } from "./+types/home";
import {
  Header,
  Hero,
  About,
  FlyingSites,
  Training,
  Safety,
  Events,
  Membership,
  Contact,
  Footer,
} from "~/components/pai-landing";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "PAI – Paragliding Association of India" },
    {
      name: "description",
      content:
        "Official website of the Paragliding Association of India (PAI). Learn about training, safety, flying sites, events, and membership.",
    },
  ];
}

export default function Home() {
  return (
    <main id="content" className="min-h-screen">
      <Header />
      <Hero />
      <About />
      <FlyingSites />
      <Training />
      <Safety />
      <Events />
      <Membership />
      <Contact />
      <Footer />
    </main>
  );
}
