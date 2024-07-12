import { useEffect } from "react";

export const useBrowserZoomPrevention = (
  svgElementRef: React.MutableRefObject<SVGSVGElement | null>
) => {
  useEffect(() => {
    const svgElement = svgElementRef.current;
    if (!svgElement) throw new Error("SVG element not found");

    const preventBrowserZoomOnPinch = (event: WheelEvent) => {
      const { ctrlKey } = event;
      if (ctrlKey) {
        event.preventDefault();
        return;
      }
    };

    svgElement.addEventListener("wheel", preventBrowserZoomOnPinch, {
      passive: false,
    });

    return () => {
      svgElement.removeEventListener("wheel", preventBrowserZoomOnPinch);
    };
  }, [svgElementRef]);
};
