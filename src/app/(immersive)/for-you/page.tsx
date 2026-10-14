import type { Metadata } from "next";
import { LilyCanvas } from "@/components/webgpu/lily/lily-canvas";

export const metadata: Metadata = {
  title: "For you",
  description: "Lily of the valley, swaying in a spring breeze.",
};

export default function ForYouPage() {
  return (
    <section className="relative h-[calc(100svh-4rem)] min-h-[30rem] overflow-hidden">
      <LilyCanvas />
    </section>
  );
}
