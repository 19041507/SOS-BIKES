"use client";

import { useEffect, useState } from "react";
import { PLATFORM_FEE } from "@/data/mechanics";
import { currentMechanic } from "@/data/requests";
import { formatBRL, parseBRL } from "@/lib/money";
import { AvailabilityCard } from "./AvailabilityCard";
import { StatsCards } from "./StatsCards";
import { EmptyState } from "./EmptyState";
import { IncomingCall } from "./IncomingCall";
import { ActiveJob } from "./ActiveJob";
import { CloseJob } from "./CloseJob";
import { JobSummary } from "./JobSummary";

type Screen = "idle" | "incoming" | "waiting" | "on-the-way" | "in-service" | "closing" | "done";

// Tempos da simulação (ms)
const NEXT_CALL = 3000;
const CYCLIST_CONFIRMATION = 3500;
/** Prazo para o mecânico responder um chamado, em segundos */
const RESPONSE_TIME = 60;

export function MechanicPanel() {
  const [online, setOnline] = useState(false);
  const [screen, setScreen] = useState<Screen>("idle");
  const [estimateInput, setEstimateInput] = useState("");
  const [etaInput, setEtaInput] = useState("");
  const [finalInput, setFinalInput] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESPONSE_TIME);
  const [expired, setExpired] = useState(false);
  const [reason, setReason] = useState("");
  const [jobsToday, setJobsToday] = useState(0);
  const [earnedToday, setEarnedToday] = useState(0);

  useEffect(() => {
    if (screen === "idle" && online) {
      const timer = setTimeout(() => {
        setSecondsLeft(RESPONSE_TIME);
        setExpired(false);
        setScreen("incoming");
      }, NEXT_CALL);
      return () => clearTimeout(timer);
    }
    if (screen === "incoming") {
      const countdown = setInterval(() => setSecondsLeft((seconds) => Math.max(seconds - 1, 0)), 1000);
      const deadline = setTimeout(() => {
        setEstimateInput("");
        setEtaInput("");
        setExpired(true);
        setScreen("idle");
      }, RESPONSE_TIME * 1000);
      return () => {
        clearInterval(countdown);
        clearTimeout(deadline);
      };
    }
    if (screen === "waiting") {
      const timer = setTimeout(() => setScreen("on-the-way"), CYCLIST_CONFIRMATION);
      return () => clearTimeout(timer);
    }
  }, [screen, online]);

  const estimate = parseBRL(estimateInput);
  const finalPrice = parseBRL(finalInput);
  const priceChanged = finalPrice !== estimate;
  const canFinish = finalPrice > 0 && (!priceChanged || reason.trim() !== "");

  function toggleAvailability() {
    setOnline(!online);
    setExpired(false);
    setScreen("idle");
  }

  function backToCalls() {
    setEstimateInput("");
    setEtaInput("");
    setFinalInput("");
    setReason("");
    setScreen("idle");
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-wrap items-start gap-4 p-4">
      <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-3 md:max-w-[400px]">
        <AvailabilityCard online={online} onToggle={toggleAvailability} />
        <StatsCards jobsToday={jobsToday} rating={currentMechanic.rating} earnedToday={earnedToday} />
      </aside>

      <section className="flex min-h-[520px] min-w-0 flex-[999_1_480px] flex-col gap-4 rounded-2xl border border-line bg-white p-6">
        {screen === "idle" && !online && (
          <EmptyState
            title="Você está indisponível"
            description="Ative a disponibilidade para receber chamados próximos."
          />
        )}
        {screen === "idle" && online && (
          <EmptyState
            live
            title="Aguardando chamados"
            description={
              expired
                ? "O último chamado expirou porque não foi respondido a tempo. Você será avisado quando um ciclista escolher você."
                : "Você será avisado quando um ciclista escolher você."
            }
          />
        )}
        {screen === "incoming" && (
          <IncomingCall
            estimate={estimateInput}
            eta={etaInput}
            secondsLeft={secondsLeft}
            totalSeconds={RESPONSE_TIME}
            onEstimateChange={setEstimateInput}
            onEtaChange={setEtaInput}
            onDecline={backToCalls}
            onAccept={() => {
              setFinalInput(estimateInput);
              setScreen("waiting");
            }}
          />
        )}
        {screen === "waiting" && (
          <EmptyState
            title="Estimativa enviada"
            description={`${formatBRL(estimate)} · chegada em ${etaInput} min. Aguardando a ciclista confirmar o atendimento.`}
          />
        )}
        {(screen === "on-the-way" || screen === "in-service") && (
          <ActiveJob
            stage={screen === "on-the-way" ? 1 : 2}
            estimate={estimate}
            onNext={() => setScreen(screen === "on-the-way" ? "in-service" : "closing")}
          />
        )}
        {screen === "closing" && (
          <CloseJob
            estimate={estimate}
            finalPrice={finalInput}
            reason={reason}
            priceChanged={priceChanged}
            canFinish={canFinish}
            onFinalPriceChange={setFinalInput}
            onReasonChange={setReason}
            onFinish={() => {
              setJobsToday(jobsToday + 1);
              setEarnedToday(earnedToday + finalPrice * (1 - PLATFORM_FEE));
              setScreen("done");
            }}
          />
        )}
        {screen === "done" && <JobSummary estimate={estimate} finalPrice={finalPrice} onBack={backToCalls} />}
      </section>
    </main>
  );
}
