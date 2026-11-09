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
      {/* Cap top - rounded corners, slightly narrower than collar */}
      <rect
        x={46}
        y={startY}
        width={28}
        height={14}
        rx={5}
        fill="var(--color-ink)"
        opacity={0.85}
      />
      {/* Collar - slightly wider than cap top, sits below it */}
      <rect
        x={42}
        y={startY + 14}
        width={36}
        height={4}
        rx={1}
        fill="var(--color-ink)"
        opacity={0.85}
      />
      {/* Neck */}
      <rect
        x={50}
        y={startY + 18}
        width={20}
        height={22}
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
      {/* Label - cream at 0.85, using the bone token */}
      <rect
        x={35}
        y={bodyY + bodyHeight / 2 - 15}
        width={50}
        height={30}
        rx={2}
        fill="var(--color-bg)"
        opacity={0.85}
      />
      {/* Label line 1 - thin ink line suggesting text */}
      <rect
        x={42}
        y={bodyY + bodyHeight / 2 - 6}
        width={36}
        height={1.5}
        fill="var(--color-ink)"
        opacity={0.35}
      />
      {/* Label line 2 - thinner, shorter */}
      <rect
        x={48}
        y={bodyY + bodyHeight / 2 + 2}
        width={24}
        height={1.5}
        fill="var(--color-ink)"
        opacity={0.35}
      />
    </svg>
  );
}