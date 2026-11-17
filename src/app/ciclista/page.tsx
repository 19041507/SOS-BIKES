import type { Metadata } from "next";
import { CyclistFlow } from "./_components/CyclistFlow";

export const metadata: Metadata = {
  title: "Pedir socorro · SOS Bikes",
};

export default function CyclistPage() {
  return <CyclistFlow />;
}
