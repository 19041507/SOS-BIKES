import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Previa } from "./Previa";
import { dadosDaPrevia } from "./dados";

async function Conteudo() {
  await connection();
  return <Previa dados={dadosDaPrevia()} />;
}

export default function PreviaPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Suspense fallback={<p className="p-6">Abrindo prévia…</p>}><Conteudo /></Suspense>;
}
