import { createSignal, onMount, onCleanup, For, Show } from "solid-js";

// ─── Constants (matching calendar app exactly) ──────────────────────────────
const HOUR_HEIGHT = 52; // --grid-hour-height
const TIME_COL_WIDTH = 64; // --grid-time-col-width
const HEADER_HEIGHT = 34; // --grid-header-height
const MONTH_LABEL_HEIGHT = 36;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEKDAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// Cathrin palette (from color-mapping.ts)
const C = {
  graphite: "#64748b",
  coral: "#c93c35",
  terracotta: "#b85a15",
  amber: "#937115",
  sage: "#258a3e",
  teal: "#00858e",
  sky: "#0072c3",
  slate: "#4c6a9e",
  lavender: "#6050cc",
  plum: "#9848b2",
  rose: "#c43262",
};

// ─── Light theme tokens (from App.css) ──────────────────────────────────────
const T = {
  surface: "#fcfcfc",
  surfaceWeekend: "#f7f6f6",
  fg: "#212020",
  fgMuted: "#717070",
  border: "#e0dfdf",
  borderLight: "#ebeaea",
  today: "#2d6b8a",
  todayTint: "rgba(45, 107, 138, 0.025)",
};

// ─── Date helpers ───────────────────────────────────────────────────────────
function getWeekDays(): Date[] {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function formatHour(hour: number): string {
  if (hour === 0) return "";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

function formatTime(hour: number, minute: number): string {
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const period = hour >= 12 ? "PM" : "AM";
  return minute === 0 ? `${h} ${period}` : `${h}:${minute.toString().padStart(2, "0")} ${period}`;
}

// ─── Dummy events ───────────────────────────────────────────────────────────
interface DummyEvent {
  dayIndex: number; // 0=Mon, 6=Sun
  startHour: number;
  startMin: number;
  durationMin: number;
  title: string;
  color: string;
}

const DUMMY_EVENTS: DummyEvent[] = [
  // Monday
  { dayIndex: 0, startHour: 9, startMin: 0, durationMin: 60, title: "Standup", color: C.sky },
  { dayIndex: 0, startHour: 11, startMin: 0, durationMin: 90, title: "Design review", color: C.lavender },
  { dayIndex: 0, startHour: 14, startMin: 0, durationMin: 60, title: "1:1 with Sarah", color: C.teal },
  // Tuesday
  { dayIndex: 1, startHour: 8, startMin: 30, durationMin: 60, title: "Morning run", color: C.sage },
  { dayIndex: 1, startHour: 10, startMin: 0, durationMin: 120, title: "Deep work", color: C.slate },
  { dayIndex: 1, startHour: 15, startMin: 0, durationMin: 90, title: "Product sync", color: C.sky },
  // Wednesday
  { dayIndex: 2, startHour: 9, startMin: 30, durationMin: 45, title: "Team standup", color: C.sky },
  { dayIndex: 2, startHour: 11, startMin: 0, durationMin: 60, title: "Lunch with Alex", color: C.terracotta },
  { dayIndex: 2, startHour: 13, startMin: 30, durationMin: 120, title: "Workshop", color: C.plum },
  { dayIndex: 2, startHour: 16, startMin: 0, durationMin: 60, title: "Coffee chat", color: C.amber },
  // Thursday
  { dayIndex: 3, startHour: 9, startMin: 0, durationMin: 60, title: "Standup", color: C.sky },
  { dayIndex: 3, startHour: 10, startMin: 30, durationMin: 90, title: "Client call", color: C.coral },
  { dayIndex: 3, startHour: 13, startMin: 0, durationMin: 60, title: "Dentist", color: C.graphite },
  { dayIndex: 3, startHour: 15, startMin: 30, durationMin: 90, title: "Code review", color: C.lavender },
  // Friday
  { dayIndex: 4, startHour: 9, startMin: 0, durationMin: 45, title: "Standup", color: C.sky },
  { dayIndex: 4, startHour: 10, startMin: 0, durationMin: 120, title: "Focus time", color: C.teal },
  { dayIndex: 4, startHour: 14, startMin: 0, durationMin: 60, title: "Retro", color: C.rose },
  // Saturday
  { dayIndex: 5, startHour: 10, startMin: 0, durationMin: 90, title: "Yoga", color: C.sage },
  { dayIndex: 5, startHour: 13, startMin: 0, durationMin: 120, title: "Museum visit", color: C.terracotta },
  // Sunday
  { dayIndex: 6, startHour: 11, startMin: 0, durationMin: 60, title: "Brunch", color: C.amber },
  { dayIndex: 6, startHour: 15, startMin: 0, durationMin: 90, title: "Read & relax", color: C.slate },
];

// ─── Selection state (one event at a time, like the real app) ───────────────
const [selectedId, setSelectedId] = createSignal<string | null>(null);

// ─── Event chip (matches CalendarEvent.tsx styling + hover/select from App.css)
function EventChip(props: { event: DummyEvent; id: string }) {
  const [hovered, setHovered] = createSignal(false);
  const selected = () => selectedId() === props.id;

  const top = () => (props.event.startHour + props.event.startMin / 60) * HOUR_HEIGHT;
  const height = () => Math.max((props.event.durationMin / 60) * HOUR_HEIGHT - 4, 24);
  const showTime = () => height() >= 28;

  const bg = () => {
    if (selected()) return props.event.color;
    // hover: 22%, default: 14% — matching App.css .calendar-event / :hover
    const mix = hovered() ? "22%" : "14%";
    return `color-mix(in srgb, ${props.event.color} ${mix}, ${T.surface})`;
  };

  const fg = () => (selected() ? "#ffffff" : props.event.color);

  // Ribbon darkens when selected — matches .calendar-event__ribbon focused state
  const ribbonBg = () =>
    selected()
      ? `color-mix(in srgb, ${props.event.color}, #000 20%)`
      : props.event.color;

  return (
    <div
      style={{
        position: "absolute",
        top: `${top()}px`,
        left: "1px",
        right: "4px",
        height: `${height()}px`,
        "background-color": bg(),
        color: fg(),
        "border-radius": "4px",
        border: selected() ? "1px solid transparent" : `1px solid ${T.borderLight}`,
        overflow: "hidden",
        display: "flex",
        cursor: "pointer",
        transition: "background-color 75ms, color 75ms, border-color 75ms",
        "z-index": selected() ? "10" : "1",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId((prev) => (prev === props.id ? null : props.id));
      }}
    >
      {/* Ribbon */}
      <div
        style={{
          width: "4px",
          "min-width": "4px",
          "background-color": ribbonBg(),
          transition: "background-color 75ms",
        }}
      />
      {/* Content */}
      <div style={{ padding: "3px 4px", "min-width": "0", flex: "1" }}>
        <div
          style={{
            "font-size": "13px",
            "font-weight": "500",
            "line-height": "1.25",
            "white-space": "nowrap",
            overflow: "hidden",
            "text-overflow": "ellipsis",
          }}
        >
          {props.event.title}
        </div>
        <Show when={showTime()}>
          <div
            style={{
              "font-size": "10px",
              "font-weight": "300",
              opacity: selected() ? "0.9" : "0.8",
              "margin-top": "2px",
            }}
          >
            {formatTime(props.event.startHour, props.event.startMin)}
          </div>
        </Show>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function CalendarPreview() {
  let scrollRef: HTMLDivElement | undefined;
  const days = getWeekDays();

  const [now, setNow] = createSignal(new Date());

  onMount(() => {
    // Scroll to current time area (2 hours before current hour), matching app behavior
    if (scrollRef) {
      const hour = new Date().getHours();
      scrollRef.scrollTop = Math.max(0, (hour - 2) * HOUR_HEIGHT);
    }

    const interval = setInterval(() => setNow(new Date()), 60000);
    onCleanup(() => clearInterval(interval));
  });

  const currentTimeTop = () => {
    const n = now();
    return (n.getHours() + n.getMinutes() / 60) * HOUR_HEIGHT;
  };

  const currentTimeLabel = () => {
    const n = now();
    const h = n.getHours();
    const m = n.getMinutes();
    const period = h >= 12 ? "PM" : "AM";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display}:${m.toString().padStart(2, "0")}${period}`;
  };

  const monthLabel = () => {
    const first = days[0];
    const last = days[6];
    const fm = first.toLocaleDateString("en-US", { month: "long" });
    const lm = last.toLocaleDateString("en-US", { month: "long" });
    const fy = first.getFullYear();
    const ly = last.getFullYear();
    if (fy !== ly) return `${fm} ${fy} – ${lm} ${ly}`;
    if (fm !== lm) return `${fm} – ${lm} ${fy}`;
    return `${fm} ${fy}`;
  };

  const todayIndex = () => days.findIndex((d) => isToday(d));

  return (
    <div
      style={{
        background: T.surface,
        overflow: "hidden",
        // Geist Sans — same font as the actual calendar app
        "font-family": "'Geist Sans', system-ui, -apple-system, sans-serif",
        color: T.fg,
        "user-select": "none",
        // Fade edges into the page background
        border: `1px solid ${T.borderLight}`,
        "border-radius": "8px",
        "box-shadow": "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
        "-webkit-mask-image":
          "linear-gradient(to right, black, black 88%, transparent), linear-gradient(to bottom, black, black 90%, transparent)",
        "mask-image":
          "linear-gradient(to right, black, black 88%, transparent), linear-gradient(to bottom, black, black 90%, transparent)",
        "-webkit-mask-composite": "source-in",
        "mask-composite": "intersect",
      }}
    >
      {/* Month label row — matches CalendarGrid.tsx */}
      <div
        style={{
          height: `${MONTH_LABEL_HEIGHT}px`,
          display: "flex",
          "align-items": "flex-end",
          "padding-bottom": "4px",
          "padding-left": "12px",
          background: T.surface,
        }}
      >
        <span style={{ "font-size": "15px", "font-weight": "600" }}>
          {monthLabel()}
        </span>
      </div>

      {/* Date header row — matches DateHeader.tsx (no column borders) */}
      <div
        style={{
          display: "flex",
          height: `${HEADER_HEIGHT}px`,
          "border-bottom": `1px solid ${T.border}`,
          background: T.surface,
        }}
      >
        {/* Time column header spacer */}
        <div
          style={{
            width: `${TIME_COL_WIDTH}px`,
            "min-width": `${TIME_COL_WIDTH}px`,
          }}
        />
        <For each={days}>
          {(day) => (
            <div
              style={{
                flex: "1",
                display: "flex",
                "align-items": "center",
                "justify-content": "center",
                gap: "4px",
              }}
            >
              <span
                style={{
                  "font-size": "13px",
                  color: isToday(day) ? T.today : T.fgMuted,
                }}
              >
                {WEEKDAY_NAMES[day.getDay()]}
              </span>
              <span
                style={{
                  "font-size": "13px",
                  "line-height": "1",
                  padding: isToday(day) ? "3px 6px" : "0",
                  "border-radius": "4px",
                  "background-color": isToday(day) ? T.today : "transparent",
                  color: isToday(day) ? T.surface : T.fgMuted,
                  "font-weight": isToday(day) ? "300" : "400",
                }}
              >
                {day.getDate()}
              </span>
            </div>
          )}
        </For>
      </div>

      {/* All-day row — matches AllDaySection.tsx (collapsed, 28px) */}
      <div
        style={{
          display: "flex",
          height: "28px",
          "border-bottom": `1px solid ${T.border}`,
          background: T.surface,
        }}
      >
        {/* Toggle area — matches app: items-start justify-end pt-1 pr-2 */}
        <div
          style={{
            width: `${TIME_COL_WIDTH}px`,
            "min-width": `${TIME_COL_WIDTH}px`,
            "border-right": `1px solid ${T.border}`,
            display: "flex",
            "align-items": "center",
            "justify-content": "flex-end",
            "padding-right": "8px",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ color: T.fgMuted }}>
            <path d="m7 15 5 5 5-5" />
            <path d="m7 9 5-5 5 5" />
          </svg>
        </div>
        <For each={days}>
          {(day, i) => {
            const dayIdx = () => (day.getDay() + 6) % 7;
            const count = () => DUMMY_EVENTS.filter((e) => e.dayIndex === dayIdx()).length;
            return (
              <div
                style={{
                  flex: "1",
                  display: "flex",
                  "align-items": "center",
                  "padding-left": "6px",
                  "border-right": `1px solid ${T.border}`,
                  "font-size": "10px",
                  color: T.fgMuted,
                }}
              >
                {count() > 0 ? `${count()} events` : ""}
              </div>
            );
          }}
        </For>
      </div>

      {/* Scrollable time grid */}
      {/* Inline style tag for WebKit scrollbar hiding */}
      <style>{`.cal-preview-scroll::-webkit-scrollbar { display: none; }`}</style>
      <div
        ref={scrollRef}
        class="cal-preview-scroll"
        style={{
          "overflow-y": "auto",
          "overflow-x": "hidden",
          position: "relative",
          height: `${HOUR_HEIGHT * 10}px`,
          "scrollbar-width": "none",

        }}
      >
        <div
          style={{
            display: "flex",
            height: `${HOUR_HEIGHT * 24}px`,
            position: "relative",
          }}
          onClick={() => setSelectedId(null)}
        >
          {/* Time column — matches TimeColumn.tsx */}
          <div
            style={{
              width: `${TIME_COL_WIDTH}px`,
              "min-width": `${TIME_COL_WIDTH}px`,
              "border-right": `1px solid ${T.border}`,
              position: "relative",
              background: T.surface,
              "z-index": "3",
            }}
          >
            <For each={HOURS}>
              {(hour) => (
                <div
                  style={{
                    height: `${HOUR_HEIGHT}px`,
                    display: "flex",
                    "align-items": "flex-start",
                    "justify-content": "flex-end",
                    "padding-right": "8px",
                  }}
                >
                  <span
                    style={{
                      "font-size": "10px", // text-2xs
                      color: T.fgMuted,
                      "line-height": "1",
                      "margin-top": "-5px",
                    }}
                  >
                    {formatHour(hour)}
                  </span>
                </div>
              )}
            </For>

            {/* Current time badge — matches CurrentTimeBadge */}
            <div
              style={{
                position: "absolute",
                right: "0",
                left: "0",
                top: `${currentTimeTop()}px`,
                "z-index": "5",
                "pointer-events": "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: "0",
                  transform: "translateY(-50%)",
                  "background-color": T.today,
                  color: T.surface,
                  "font-size": "10px", // text-2xs
                  "font-weight": "500",
                  padding: "3px 10px",
                  "border-radius": "2px",
                  "line-height": "1",
                  "white-space": "nowrap",
                }}
              >
                {currentTimeLabel()}
              </div>
            </div>
          </div>

          {/* Day columns — matches DayColumn.tsx */}
          <For each={days}>
            {(day, i) => {
              const dayIdx = () => (day.getDay() + 6) % 7; // 0=Mon
              const isWkend = () => day.getDay() === 0 || day.getDay() === 6;
              const dayEvents = () => DUMMY_EVENTS.filter((e) => e.dayIndex === dayIdx());

              return (
                <div
                  style={{
                    flex: "1",
                    position: "relative",
                    height: `${HOUR_HEIGHT * 24}px`,
                    "border-left": i() > 0 ? `1px solid ${T.border}` : "none",
                    // Matches .today-column-tint and bg-surface-weekend
                    "background-color": isToday(day)
                      ? T.todayTint
                      : isWkend()
                        ? T.surfaceWeekend
                        : "transparent",
                  }}
                >
                  {/* Hour grid lines — same CSS gradient technique as DayColumn.tsx */}
                  <div
                    style={{
                      position: "absolute",
                      left: "0",
                      right: "0",
                      top: `${HOUR_HEIGHT}px`,
                      bottom: "0",
                      "background-image": `linear-gradient(to bottom, ${T.border} 1px, transparent 1px)`,
                      "background-size": `100% ${HOUR_HEIGHT}px`,
                      "pointer-events": "none",
                    }}
                  />

                  {/* Events */}
                  <For each={dayEvents()}>
                    {(event) => (
                      <EventChip
                        event={event}
                        id={`${event.dayIndex}-${event.startHour}-${event.startMin}`}
                      />
                    )}
                  </For>
                </div>
              );
            }}
          </For>

          {/* Current time line — matches CurrentTimeLine */}
          <Show when={todayIndex() >= 0}>
            <div
              style={{
                position: "absolute",
                left: `${TIME_COL_WIDTH}px`,
                right: "0",
                top: `${currentTimeTop()}px`,
                height: "1px",
                "background-color": T.today,
                "z-index": "4",
                "pointer-events": "none",
              }}
            >
              {/* Dot at left edge of today column */}
              <div
                style={{
                  position: "absolute",
                  left: `calc(${(todayIndex() / 7) * 100}% - 3px)`,
                  top: "-3px",
                  width: "7px",
                  height: "7px",
                  "border-radius": "50%",
                  "background-color": T.today,
                }}
              />
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
