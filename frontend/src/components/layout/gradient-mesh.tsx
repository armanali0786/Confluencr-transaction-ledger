import { useId } from 'react';

// Cream → sherbet orange → lavender → indigo → ruby, washed left to right. Each blob is an
// ellipse blurred together, which gives the organic mesh a CSS gradient cannot draw.
const BLOBS = [
  { cx: 120, cy: 90, rx: 420, ry: 200, fill: 'var(--color-canvas-cream)', opacity: 1 },
  { cx: 520, cy: 40, rx: 320, ry: 150, fill: 'var(--color-mesh-orange)', opacity: 0.75 },
  { cx: 860, cy: 130, rx: 360, ry: 170, fill: 'var(--color-mesh-lavender)', opacity: 0.9 },
  { cx: 1130, cy: 40, rx: 280, ry: 140, fill: 'var(--color-primary)', opacity: 0.5 },
  { cx: 1360, cy: 140, rx: 260, ry: 130, fill: 'var(--color-ruby)', opacity: 0.4 },
  { cx: 1010, cy: 250, rx: 240, ry: 90, fill: 'var(--color-magenta)', opacity: 0.3 },
];

/** The signature gradient-mesh backdrop, washed across the top of every page. */
export function GradientMesh() {
  const filterId = useId();

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_35%,transparent)]"
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1440 420"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="70" />
          </filter>
        </defs>
        <g filter={`url(#${filterId})`}>
          {BLOBS.map(({ cx, cy, rx, ry, fill, opacity }) => (
            <ellipse
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill={fill}
              opacity={opacity}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
