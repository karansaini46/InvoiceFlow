import { useCallback, useEffect, useRef, useState } from "react";

export function TopLoadingBar({ active, complete }: { active: boolean; complete: boolean }) {
  if (!active) {
    return null;
  }

  return <div className={`top-loading-bar ${complete ? "done" : ""}`} />;
}

export function useLoadingBar() {
  const [active, setActive] = useState(false);
  const [complete, setComplete] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    setComplete(false);
    setActive(true);
  }, [clearTimer]);

  const done = useCallback(() => {
    setComplete(true);
    clearTimer();
    timeoutRef.current = window.setTimeout(() => {
      setActive(false);
      setComplete(false);
      timeoutRef.current = null;
    }, 220);
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  return {
    active,
    complete,
    done,
    start,
  };
}
