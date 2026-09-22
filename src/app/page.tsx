import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import FeatureSection from "@/components/home/FeatureSection";
import Hero from "@/components/home/Hero";
import StepSection from "@/components/home/StepSection";
import ScanQrPage from "@/components/scan/ScanQrPage";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <Hero />

      <section id="scan-qr" className="scroll-mt-20 border-y border-blue-100 bg-[#F8FAFC]">
        <ScanQrPage />
      </section>

      <FeatureSection />
      <StepSection />
      <Footer />
    </main>
  );
}
