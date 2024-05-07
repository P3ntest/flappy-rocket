import { useTick } from "@pixi/react";
import { useState } from "react";

export function useLerped(value: number, factor: number) {
  const [lerped, setLerped] = useState(value);

  useTick((delta) => {
    setLerped((lerped) => lerped + (value - lerped) * factor * delta);
  });

  return lerped;
}
