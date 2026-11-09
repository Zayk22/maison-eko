type BottleProps = {
  accentHex: string;
  sizeMl: number;
  className?: string;
};

export function Bottle({ accentHex, sizeMl, className = "" }: BottleProps) {
  const bottleHeight = sizeMl === 30 ? 120 : sizeMl === 50 ? 160 : 200;
  const startY = (240 - bottleHeight) / 2;
  const bodyY = startY + 40;
  const bodyHeight = bottleHeight - 40;

  return (
    <svg
      viewBox="0 0 120 240"
      role="presentation"
      aria-hidden="true"
      width={120}
      height={240}
      className={className}
    >
      {/* Cap */}
      <rect
        x={45}
        y={startY}
        width={30}
        height={20}
        rx={2}
        fill="var(--color-ink)"
        opacity={0.85}
      />
      {/* Neck */}
      <rect
        x={50}
        y={startY + 20}
        width={20}
        height={20}
        fill="var(--color-ink)"
        opacity={0.85}
      />
      {/* Body */}
      <rect
        x={20}
        y={bodyY}
        width={80}
        height={bodyHeight}
        rx={10}
        fill={accentHex}
      />
      {/* Glass highlight */}
      <rect
        x={26}
        y={bodyY + 8}
        width={12}
        height={bodyHeight - 16}
        rx={6}
        fill="white"
        opacity={0.25}
      />
      {/* Label */}
      <rect
        x={35}
        y={bodyY + bodyHeight / 2 - 15}
        width={50}
        height={30}
        rx={2}
        fill="var(--color-bone)"
        opacity={0.9}
      />
      {/* Label line 1 */}
      <rect
        x={45}
        y={bodyY + bodyHeight / 2 - 5}
        width={30}
        height={2}
        fill="var(--color-ink)"
        opacity={0.3}
      />
      {/* Label line 2 */}
      <rect
        x={50}
        y={bodyY + bodyHeight / 2 + 2}
        width={20}
        height={2}
        fill="var(--color-ink)"
        opacity={0.3}
      />
    </svg>
  );
}