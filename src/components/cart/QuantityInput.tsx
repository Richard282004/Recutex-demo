'use client';

export function QuantityInput({
  value,
  onChange,
  min = 1,
  max = 20,
  label,
  small = false,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  small?: boolean;
}) {
  const set = (next: number) => onChange(Math.max(min, Math.min(max, Number.isFinite(next) ? next : min)));
  return (
    <div className={`quantity${small ? ' quantity--small' : ''}`}>
      <button
        className="quantity__button"
        type="button"
        onClick={() => set(value - 1)}
        disabled={value <= min}
        aria-label="Disminuir cantidad"
      >
        −
      </button>
      <input
        className="quantity__input"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        aria-label={label}
        onChange={(event) => set(Number(event.target.value))}
      />
      <button
        className="quantity__button"
        type="button"
        onClick={() => set(value + 1)}
        disabled={value >= max}
        aria-label="Aumentar cantidad"
      >
        +
      </button>
    </div>
  );
}
