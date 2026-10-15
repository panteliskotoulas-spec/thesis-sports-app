import { fillTemplate } from '@/lib/bookings/booking';
import type { TrendData } from '@/lib/tournaments/standings';
import type { TrendLabels } from '@/lib/tournaments/tournament-labels';

const WIDTH = 340;
const HEIGHT = 170;
const LEFT = 26;
const RIGHT = 72;
const TOP = 12;
const BOTTOM = 140;

const STYLES = [
  { line: 'stroke-primary', dot: 'fill-primary', dash: undefined },
  { line: 'stroke-terracotta', dot: 'fill-terracotta', dash: '6 3' },
  {
    line: 'stroke-muted-foreground',
    dot: 'fill-muted-foreground',
    dash: '2 3',
  },
  { line: 'stroke-foreground', dot: 'fill-foreground', dash: '8 2 2 2' },
] as const;

export function PointsTrendChart({
  data,
  labels,
}: {
  data: TrendData;
  labels: TrendLabels;
}) {
  const { rounds, series } = data;
  const maxPoints = Math.max(1, ...series.flatMap((item) => item.points));
  const stepX = (WIDTH - LEFT - RIGHT) / (rounds.length - 1);
  const x = (index: number) => LEFT + index * stepX;
  const y = (value: number) => BOTTOM - (value / maxPoints) * (BOTTOM - TOP);
  const ticks = Array.from(new Set([0, Math.round(maxPoints / 2), maxPoints]));
  const labelEvery = Math.ceil(rounds.length / 8);
  const last = rounds.length - 1;

  const ends = series
    .map((item, index) => ({
      key: item.teamId,
      name: item.name,
      y: y(item.points[last]),
      index,
    }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i += 1) {
    if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13;
  }

  return (
    <div className="rounded-xl border-[0.5px] border-border bg-card p-3">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={labels.aria}
        className="h-auto w-full max-w-md"
      >
        <title>{labels.title}</title>
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={LEFT}
              x2={WIDTH - RIGHT}
              y1={y(tick)}
              y2={y(tick)}
              strokeWidth={1}
              className="stroke-border"
            />
            <text
              x={LEFT - 6}
              y={y(tick) + 4}
              textAnchor="end"
              fontSize={11}
              className="fill-muted-foreground"
            >
              {tick}
            </text>
          </g>
        ))}
        {rounds.map((round, index) =>
          index % labelEvery === 0 || index === last ? (
            <text
              key={round}
              x={x(index)}
              y={HEIGHT - 8}
              textAnchor="middle"
              fontSize={11}
              className="fill-muted-foreground"
            >
              {fillTemplate(labels.round, { n: String(round) })}
            </text>
          ) : null,
        )}
        {series.map((item, index) => {
          const style = STYLES[index % STYLES.length];
          return (
            <g key={item.teamId}>
              <polyline
                points={item.points
                  .map((value, i) => `${x(i)},${y(value)}`)
                  .join(' ')}
                fill="none"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={style.dash}
                className={style.line}
              />
              <circle
                cx={x(last)}
                cy={y(item.points[last])}
                r={4}
                strokeWidth={2}
                className={`${style.dot} stroke-card`}
              />
            </g>
          );
        })}
        {ends.map((end) => (
          <text
            key={end.key}
            x={x(last) + 10}
            y={end.y + 4}
            fontSize={11}
            className="fill-foreground"
          >
            {end.name}
          </text>
        ))}
      </svg>
    </div>
  );
}
