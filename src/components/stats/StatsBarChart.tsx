import type { StatsChart } from '@/lib/stats/stats-view';

const WIDTH = 340;
const HEIGHT = 150;
const SIDE = 8;
const TOP = 18;
const BASE = 116;
const MAX_BAR = 28;
const MIN_BAR_HEIGHT = 2;

export function StatsBarChart({ chart }: { chart: StatsChart }) {
  const { bars, max } = chart;
  const slot = (WIDTH - SIDE * 2) / bars.length;
  const barWidth = Math.min(MAX_BAR, slot * 0.6);
  const labelEvery = Math.ceil(bars.length / 10);
  const showValues = bars.length <= 14;

  return (
    <div className="rounded-xl border-[0.5px] border-border bg-card p-3">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={chart.aria}
        className="h-auto w-full"
      >
        <title>{chart.aria}</title>
        <line
          x1={SIDE}
          x2={WIDTH - SIDE}
          y1={BASE}
          y2={BASE}
          className="stroke-border"
          strokeWidth={0.5}
        />
        {bars.map((bar, index) => {
          const height = Math.max(
            MIN_BAR_HEIGHT,
            (bar.value / max) * (BASE - TOP),
          );
          const x = SIDE + index * slot + (slot - barWidth) / 2;
          const y = BASE - height;
          const center = x + barWidth / 2;
          return (
            <g key={bar.key}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={height}
                rx={3}
                className={bar.value > 0 ? 'fill-primary' : 'fill-border'}
              />
              {showValues && bar.value > 0 ? (
                <text
                  x={center}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize={10}
                  className="fill-muted-foreground"
                >
                  {bar.display}
                </text>
              ) : null}
              {index % labelEvery === 0 ? (
                <text
                  x={center}
                  y={BASE + 16}
                  textAnchor="middle"
                  fontSize={10}
                  className="fill-muted-foreground"
                >
                  {bar.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <ul className="sr-only">
        {bars.map((bar) => (
          <li key={bar.key}>
            {bar.label}: {bar.display}
          </li>
        ))}
      </ul>
    </div>
  );
}
