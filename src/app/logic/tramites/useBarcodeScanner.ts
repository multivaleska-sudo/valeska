import { useEffect, useRef } from "react";

interface BarcodeScannerOptions {
  enabled?: boolean;
  minLength?: number;
  maxKeyDelayMs?: number;
  onScan: (data: string) => void;
}

const IGNORED_KEYS = new Set([
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "CapsLock",
  "NumLock",
  "ScrollLock",
]);

const normalizeScanValue = (value: string) =>
  value.trim().replace(/\s+/g, "").toUpperCase();

const isTextInput = (
  target: EventTarget | null,
): target is HTMLInputElement | HTMLTextAreaElement =>
  target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

const setNativeValue = (
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) => {
  const prototype = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  descriptor?.set?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
};

export function useBarcodeScanner({
  enabled = true,
  minLength = 3,
  maxKeyDelayMs = 50,
  onScan,
}: BarcodeScannerOptions) {
  const buffer = useRef("");
  const lastKeyTime = useRef(0);
  const activeInput = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const activeInputInitialValue = useRef("");

  useEffect(() => {
    if (!enabled) return;

    const resetBuffer = () => {
      buffer.current = "";
      activeInput.current = null;
      activeInputInitialValue.current = "";
    };

    const restoreFocusedInput = () => {
      if (!activeInput.current) return;
      setNativeValue(activeInput.current, activeInputInitialValue.current);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.key || IGNORED_KEYS.has(e.key)) return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;
      const isContinuingScan = buffer.current.length > 0 && timeDiff <= maxKeyDelayMs;

      if (!isContinuingScan) {
        resetBuffer();
        if (isTextInput(e.target)) {
          activeInput.current = e.target;
          activeInputInitialValue.current = e.target.value;
        }
      }

      if (e.key === "Enter") {
        const normalized = normalizeScanValue(buffer.current);

        if (normalized.length >= minLength) {
          e.preventDefault();
          e.stopPropagation();
          restoreFocusedInput();
          onScan(normalized);
        }

        resetBuffer();
        lastKeyTime.current = currentTime;
        return;
      }

      if (e.key.length === 1) {
        if (isContinuingScan) {
          e.preventDefault();
          e.stopPropagation();
        }

        buffer.current += e.key;
        lastKeyTime.current = currentTime;
        return;
      }

      resetBuffer();
      lastKeyTime.current = currentTime;
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [enabled, maxKeyDelayMs, minLength, onScan]);
}
