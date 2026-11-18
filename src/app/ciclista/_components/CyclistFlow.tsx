"use client";

import { useEffect, useState } from "react";
import { MapView } from "@/components/MapView";
import { categories, mechanics, type Mechanic } from "@/data/mechanics";
import { HomeStep } from "./HomeStep";
import { CategoryStep } from "./CategoryStep";
import { LocationStep } from "./LocationStep";
import { MechanicListStep } from "./MechanicListStep";
import { WaitingStep } from "./WaitingStep";
import { ProposalStep } from "./ProposalStep";
import { TrackingStep } from "./TrackingStep";
import { FinishedStep } from "./FinishedStep";

type Screen =
  | "home"
  | "category"
  | "location"
  | "mechanics"
  | "waiting"
  | "proposal"
  | "on-the-way"
  | "in-service"
  | "finished";

// Tempos da simulação (ms)
const MECHANIC_RESPONSE = 3000;
/** Tempo máximo de espera pela resposta do mecânico, em segundos */
const WAIT_LIMIT = 60;
const TRAVEL_TIME = 6000;
const SERVICE_TIME = 6000;

export function CyclistFlow() {
  const [screen, setScreen] = useState<Screen>("home");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [chosen, setChosen] = useState<Mechanic | null>(null);
  const [declinedIds, setDeclinedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [homeNotice, setHomeNotice] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  useEffect(() => {
    if (screen === "waiting" && chosen) {
      const firstName = chosen.name.split(" ")[0];
      const response = setTimeout(() => {
        if (chosen.declines) {
          setDeclinedIds((ids) => [...ids, chosen.id]);
          setNotice(`${firstName} não pode atender agora. Escolha outro mecânico.`);
          setChosen(null);
          setScreen("mechanics");
        } else {
          setScreen("proposal");
        }
      }, MECHANIC_RESPONSE);
      // Na simulação o mecânico sempre responde antes; o limite cobre a falta de resposta.
      const limit = setTimeout(() => {
        setNotice(`${firstName} não respondeu a tempo. Escolha outro mecânico.`);
        setChosen(null);
        setScreen("mechanics");
      }, WAIT_LIMIT * 1000);
      return () => {
        clearTimeout(response);
        clearTimeout(limit);
      };
    }
    // A simulação fica parada enquanto o ciclista decide se cancela.
    if (confirmingCancel) return;
    if (screen === "on-the-way") {
      const timer = setTimeout(() => setScreen("in-service"), TRAVEL_TIME);
      return () => clearTimeout(timer);
    }
    if (screen === "in-service") {
      const timer = setTimeout(() => setScreen("finished"), SERVICE_TIME);
      return () => clearTimeout(timer);
    }
  }, [screen, chosen, confirmingCancel]);

  useEffect(() => {
    if (!homeNotice) return;
    const timer = setTimeout(() => setHomeNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [homeNotice]);

  const category = categories.find((item) => item.id === categoryId);
  const available = mechanics.filter((mechanic) => !declinedIds.includes(mechanic.id));
  const focusedOnChosen = chosen && screen !== "mechanics";
  const pins = focusedOnChosen ? [chosen] : available;
  const firstName = chosen?.name.split(" ")[0];

  function reset() {
    setScreen("home");
    setCategoryId(null);
    setDetails("");
    setChosen(null);
    setDeclinedIds([]);
    setNotice(null);
  }

  function backToList() {
    setChosen(null);
    setNotice(null);
    setScreen("mechanics");
  }

  let chip = `${available.length} mecânicos disponíveis perto de você`;
  if (chosen && screen === "waiting") chip = `Aguardando resposta de ${firstName}`;
  if (chosen && screen === "proposal") chip = `${firstName} está a ${chosen.distance}`;
  if (chosen && screen === "on-the-way") chip = `${firstName} chega em ${chosen.etaMinutes} min`;
  if (screen === "in-service") chip = "Mecânico no local";
  if (screen === "finished") chip = "Atendimento concluído";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-wrap items-stretch gap-4 p-4">
      <section className="flex min-w-0 flex-[1_1_380px] flex-col gap-4 rounded-2xl border border-line bg-white p-6 md:max-w-[480px]">
        {screen === "home" && (
          <HomeStep
            notice={homeNotice}
            onStart={() => {
              setHomeNotice(null);
              setScreen("category");
            }}
          />
        )}
        {screen === "category" && (
          <CategoryStep
            selected={categoryId}
            details={details}
            onSelect={setCategoryId}
            onDetailsChange={setDetails}
            onBack={reset}
            onNext={() => setScreen("location")}
          />
        )}
        {screen === "location" && (
          <LocationStep
            categoryLabel={category?.label ?? ""}
            onBack={() => setScreen("category")}
            onNext={() => setScreen("mechanics")}
          />
        )}
        {screen === "mechanics" && (
          <MechanicListStep
            mechanics={available}
            notice={notice}
            onBack={() => setScreen("location")}
            onChoose={(mechanic) => {
              setNotice(null);
              setChosen(mechanic);
              setScreen("waiting");
            }}
          />
        )}
        {screen === "waiting" && chosen && <WaitingStep mechanic={chosen} limitSeconds={WAIT_LIMIT} onCancel={backToList} />}
        {screen === "proposal" && chosen && (
          <ProposalStep
            mechanic={chosen}
            onConfirm={() => setScreen("on-the-way")}
            onChooseAnother={backToList}
          />
        )}
        {(screen === "on-the-way" || screen === "in-service") && chosen && (
          <TrackingStep
            mechanic={chosen}
            stage={screen === "on-the-way" ? 1 : 2}
            onConfirmingCancelChange={setConfirmingCancel}
            onCancel={() => {
              setConfirmingCancel(false);
              reset();
              setHomeNotice("Chamado cancelado.");
            }}
          />
        )}
        {screen === "finished" && chosen && (
          <FinishedStep
            mechanic={chosen}
            onConfirm={() => {
              reset();
              setHomeNotice("Assistência finalizada. Obrigado pela avaliação!");
            }}
          />
        )}
      </section>

      <MapView
        className="min-h-[420px] min-w-0 flex-[999_1_480px]"
        pins={pins}
        chip={chip}
        routeTo={screen === "on-the-way" || screen === "in-service" ? chosen ?? undefined : undefined}
      />
    </main>
  );
}
