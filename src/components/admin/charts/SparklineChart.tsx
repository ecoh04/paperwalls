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
  // Smooth curve (Catmull-Rom → bezier) to match the larger trend charts.
  const smooth = (pts: number[][]) => {
    if (pts.length < 3) return pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const d = [`M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i - 1] ?? pts[i];
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1];
      const [x3, y3] = pts[i + 2] ?? pts[i + 1];
      d.push(`C${(x1 + (x2 - x0) / 6).toFixed(1)},${(y1 + (y2 - y0) / 6).toFixed(1)} ${(x2 - (x3 - x1) / 6).toFixed(1)},${(y2 - (y3 - y1) / 6).toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);
    }
    return d.join(" ");
  };
  const path = smooth(points);
  const fillPath = `${path} L${width.toFixed(1)},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <path d={fillPath}  fill={fill}    stroke="none" />
      <path d={path}      fill="none"    stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
