import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import FeatureSection from "@/components/home/FeatureSection";
import Hero from "@/components/home/Hero";
import StepSection from "@/components/home/StepSection";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <Hero />
      <FeatureSection />
      <StepSection />
      <Footer />
    </main>
  );
}
