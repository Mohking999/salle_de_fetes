import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Utensils,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  daysInMonth,
  EVENT_TYPES,
  monthKey,
  monthLabel,
  shiftMonth,
  SLOTS,
  STATUS_LABEL,
  type CookingLabId,
  type EventType,
  type ReservationStatus,
  type Salle,
  type Slot,
} from "@/lib/booking-types";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const STATUS_CLASS: Record<ReservationStatus | "available", string> = {
  available:
    "bg-status-available/60 text-foreground/70 hover:bg-status-available hover:shadow-sm transition-all duration-150",
  pending:
    "bg-amber-100 text-amber-900 border border-amber-300/60 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700/40 hover:brightness-95 transition-all duration-150",
  confirmed:
    "bg-emerald-600 text-white dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 shadow-sm transition-all duration-150",
  blocked:
    "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 line-through opacity-60 transition-all duration-150",
  cancelled:
    "bg-status-available/30 text-muted-foreground/60 transition-all duration-150",
};

export type CellInfo = {
  salles: {
    id: string;
    status: ReservationStatus | "available";
    label?: string;
    eventType?: EventType;
    cookingLabId?: CookingLabId;
  }[];
};

export function MonthGrid({
  month,
  onMonthChange,
  getCell,
  onSelect,
  selected,
  salles,
}: {
  month: string;
  onMonthChange: (m: string) => void;
  getCell: (date: string, slot: Slot) => CellInfo;
  onSelect: (date: string, slot: Slot, salleId: string) => void;
  selected?: { date: string; slot: Slot; salleId: string } | null;
  salles: Salle[];
}) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const currentMonthKey = monthKey(today);
  const isCurrentMonth = month === currentMonthKey;

  const days = daysInMonth(month);
  const first = new Date(days[0] + "T00:00:00");
  const offset = (first.getDay() + 6) % 7;

  const getSalleLabel = (name: string) =>
    name.match(/Salle\s*\d+/)?.[0] ?? name;

  return (
    <div className="animate-fade-in">
      {/* Navigation header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold capitalize text-display">
          {monthLabel(month)}
        </h2>
        <div className="flex items-center gap-1.5">
          {!isCurrentMonth && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMonthChange(currentMonthKey)}
              className="h-8 px-2.5 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/5"
              title="Revenir au mois actuel"
            >
              <CalendarCheck className="mr-1 h-3.5 w-3.5" />
              Aujourd'hui
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onMonthChange(shiftMonth(month, -1))}
            aria-label="Mois précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onMonthChange(shiftMonth(month, 1))}
            aria-label="Mois suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-1.5">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`pad-${i}`} className="min-h-16 rounded-lg bg-muted/10" />
        ))}
        {days.map((date) => {
          const isToday = date === todayStr;
          return (
            <div
              key={date}
              className={cn(
                "flex min-h-16 flex-col gap-0.5 rounded-lg border bg-card p-1 shadow-2xs transition-shadow duration-150",
                isToday
                  ? "border-primary/50 ring-2 ring-primary/20 shadow-sm"
                  : "border-border hover:shadow-sm",
              )}
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-0.5">
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/70",
                  )}
                >
                  {Number(date.slice(-2))}
                </span>
              </div>

              {SLOTS.map(({ value, shiftLabel }) => {
                const cell = getCell(date, value);
                const isSelected =
                  selected?.date === date &&
                  selected?.slot === value &&
                  selected?.salleId != null;
                const getSalleInfo = (salleId: string) =>
                  cell.salles.find((s) => s.id === salleId);

                return (
                  <div
                    key={value}
                    className={cn(
                      "flex flex-col gap-1 rounded-md border border-border/70 p-1",
                      isSelected &&
                        "ring-2 ring-primary ring-offset-1 ring-offset-card shadow-md",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className="flex items-center gap-1 font-bold text-[9px] uppercase opacity-90">
                        {value === "journee" ? (
                          <Sun className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                        ) : (
                          <Moon className="h-2.5 w-2.5 text-indigo-400 shrink-0" />
                        )}
                        {shiftLabel}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {salles.map((salle) => {
                        const info = getSalleInfo(salle.id);
                        const status = info?.status ?? "available";
                        const label = info?.label;
                        const isSalleSelected =
                          isSelected && selected?.salleId === salle.id;
                        return (
                          <button
                            key={salle.id}
                            type="button"
                            onClick={() => onSelect(date, value, salle.id)}
                            className={cn(
                              "flex items-center justify-between rounded-md px-1.5 py-0.5 text-left text-[9px] font-medium leading-tight transition",
                              STATUS_CLASS[status],
                              isSalleSelected &&
                                "ring-2 ring-primary ring-offset-1 ring-offset-card font-semibold",
                            )}
                          >
                            <span className="truncate font-semibold leading-tight">
                              {label ??
                                (status === "available"
                                  ? "Libre"
                                  : STATUS_LABEL[status as keyof typeof STATUS_LABEL] ??
                                    status)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StatusLegend() {
  const items: { label: string; cls: string }[] = [
    { label: "Disponible", cls: "bg-status-available" },
    { label: "En attente", cls: "bg-amber-200 border border-amber-400" },
    { label: "Confirmée", cls: "bg-emerald-600" },
    { label: "Bloquée", cls: "bg-slate-300" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className={cn("h-3 w-3 rounded-sm", i.cls)} />
          {i.label}
        </span>
      ))}
      <span className="ml-auto flex items-center gap-3 font-medium text-foreground/70">
        <span className="flex items-center gap-1">
          <Sun className="h-3 w-3 text-primary" /> Jour
        </span>
        <span className="flex items-center gap-1">
          <Moon className="h-3 w-3 text-primary" /> Nuit
        </span>
      </span>
    </div>
  );
}
