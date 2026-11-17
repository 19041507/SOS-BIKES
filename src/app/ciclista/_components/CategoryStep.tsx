import { categories } from "@/data/mechanics";
import { StepHeader } from "./StepHeader";

type CategoryStepProps = {
  selected: string | null;
  details: string;
  onSelect: (id: string) => void;
  onDetailsChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
};

export function CategoryStep({ selected, details, onSelect, onDetailsChange, onBack, onNext }: CategoryStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <StepHeader eyebrow="Etapa 1 de 3" title="Qual é o problema?" onBack={onBack} />
      <div className="grid grid-cols-2 gap-2.5">
        {categories.map((category) => {
          const isSelected = selected === category.id;
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(category.id)}
              className={
                isSelected
                  ? "min-h-12 rounded-xl border border-brand bg-brand-soft px-2.5 py-2 text-[15px] font-semibold text-brand ring-1 ring-brand"
                  : "min-h-12 rounded-xl border border-field bg-white px-2.5 py-2 text-[15px] font-semibold hover:bg-surface"
              }
            >
              {category.label}
            </button>
          );
        })}
      </div>
      <label htmlFor="details" className="text-sm font-semibold">
        Detalhes <span className="font-normal text-subtle">(opcional)</span>
      </label>
      <textarea
        id="details"
        rows={3}
        value={details}
        onChange={(event) => onDetailsChange(event.target.value)}
        className="-mt-2 resize-none rounded-xl border border-field p-3 text-[15px]"
      />
      <button
        type="button"
        disabled={!selected}
        onClick={onNext}
        className="h-14 rounded-xl bg-brand text-base font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-[#a9bcd8]"
      >
        Continuar
      </button>
    </div>
  );
}
