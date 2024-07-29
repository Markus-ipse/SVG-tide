export const SelectionMarker = ({
  selectionBounds,
  zoomLevel,
}: {
  selectionBounds: DOMRect;
  zoomLevel: number;
}) => {
  const dashLength = 5;
  const staticDashLength = dashLength / zoomLevel;

  return (
    <>
      <rect
        strokeWidth={2 / zoomLevel}
        stroke="black"
        fill="none"
        x={selectionBounds?.x}
        y={selectionBounds?.y}
        width={selectionBounds?.width}
        height={selectionBounds?.height}
      />
      <rect
        strokeWidth={2 / zoomLevel}
        stroke="white"
        strokeDasharray={staticDashLength}
        fill="none"
        x={selectionBounds?.x}
        y={selectionBounds?.y}
        width={selectionBounds?.width}
        height={selectionBounds?.height}
      >
        <animate
          attributeName="stroke-dashoffset"
          values={`${10 / zoomLevel};0`}
          dur="1s"
          repeatCount="indefinite"
        />
      </rect>
    </>
  );
};
