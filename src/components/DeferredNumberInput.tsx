import { useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DeferredNumberInputProps = {
  value: number | null | undefined;
  onCommit: (value: number | null) => void;
  /** If true, allow decimals (e.g. 12.5). Defaults to false. */
  allowDecimal?: boolean;
  /** Placeholder shown when empty. */
  placeholder?: string;
  /** Tailwind classes forwarded to the underlying Input. */
  className?: string;
  /** Commit after user stops typing for this many ms. Defaults to 1000. */
  debounceMs?: number;
  /** Value to commit on blur when input is left empty. If omitted, commits null. */
  emptyCommitValue?: number | null;
  /** Min/max clamps applied when committing. */
  min?: number;
  max?: number;
  disabled?: boolean;
  "aria-label"?: string;
  id?: string;
};

export function DeferredNumberInput({
  value,
  onCommit,
  allowDecimal = false,
  placeholder,
  className,
  debounceMs = 1000,
  emptyCommitValue = null,
  min,
  max,
  disabled,
  id,
  ...rest
}: DeferredNumberInputProps) {
  const [draft, setDraft] = useState<string>(value ?? value === 0 ? String(value) : "");
  const [focused, setFocused] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const pattern = useMemo(() => {
    return allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/;
  }, [allowDecimal]);

  useEffect(() => {
    if (!focused) {
      setDraft(value ?? value === 0 ? String(value) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const clamp = (n: number) => {
    let out = n;
    if (typeof min === "number") out = Math.max(min, out);
    if (typeof max === "number") out = Math.min(max, out);
    return out;
  };

  const commit = (next: string) => {
    if (next.trim() === "") {
      onCommit(emptyCommitValue);
      return;
    }

    const parsed = Number(next);
    if (!Number.isFinite(parsed)) return;
    onCommit(clamp(parsed));
  };

  const scheduleCommit = (next: string) => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

    // Do not auto-commit empty while typing; commit empty only on blur.
    if (next.trim() === "") return;

    timeoutRef.current = window.setTimeout(() => {
      commit(next);
    }, debounceMs);
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={draft}
      placeholder={placeholder}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        commit(draft);
      }}
      onChange={(e) => {
        const next = e.target.value;
        if (next === "" || pattern.test(next)) {
          setDraft(next);
          scheduleCommit(next);
        }
      }}
      className={cn("h-8 text-sm", className)}
      {...rest}
    />
  );
}
