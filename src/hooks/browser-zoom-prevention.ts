import { useEffect } from "react";

export const useWheelEventOverrides = (
  svgElementRef: React.MutableRefObject<SVGSVGElement | null>
) => {
  useEffect(() => {
    const svgElement = svgElementRef.current;
    if (!svgElement) throw new Error("SVG element not found");

    const preventUnwantedWheelEventBehavior = (event: WheelEvent) => {
      const { ctrlKey } = event;

      // When pinching on a trackpad, the ctrlKey is set to true
      if (ctrlKey) {
        // Prevent browser zoom behavior when pinching so we can handle zooming ourselves
        event.preventDefault();
        return;
      }

      // Indicates use of tiltable scroll wheel
      if (event.deltaX !== 0) {
        // Prevent parent scroll since we use scroll click for panning the canvas.
        // We don't want to accidentally zoom by triggering parent scroll when panning
        // by accidentally tilting the scroll wheel whilst clicking.
        event.stopPropagation();
        return;
      }
    };

    svgElement.addEventListener("wheel", preventUnwantedWheelEventBehavior, {
      passive: false,
    });

    return () => {
      svgElement.removeEventListener(
        "wheel",
        preventUnwantedWheelEventBehavior
      );
    };
  }, [svgElementRef]);
};
