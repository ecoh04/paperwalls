// Inline SVG sparkline — hand-rolled, no charting lib. Used inside dashboard
// stat cards to show recent trend without taking real estate.

type Point = { x: number; y: number };

type Props = {
  data:    Point[];
  width?:  number;
  height?: number;
  color?:  string;
  fill?:   string;
};

export function SparklineChart({
  data,
  width  = 120,
  height = 36,
  color  = "#1A1714",
  fill   = "rgba(196, 98, 45, 0.10)",
}: Props) {
  if (data.length < 2) {
    return <div style={{ width, height }} className="text-xs text-stone-400">—</div>;
  }
  const minY = Math.min(...data.map((d) => d.y));
  const maxY = Math.max(...data.map((d) => d.y));
  const yRange = maxY - minY || 1;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.y - minY) / yRange) * (height - 4) - 2;
    return [x, y];
  });
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const fillPath = `${path} L${width.toFixed(1)},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <path d={fillPath}  fill={fill}    stroke="none" />
      <path d={path}      fill="none"    stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
