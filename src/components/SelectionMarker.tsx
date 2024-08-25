type Props = {
  selectionBounds: DOMRect;
  zoomLevel: number;
  type: "default" | "scale";
};

export const SelectionMarker = ({
  selectionBounds: bounds,
  zoomLevel,
  type = "default",
}: Props) => {
  const handleCoords = type === "scale" ? getHandleCoords(bounds) : [];

  /** For things that should stay the same size even when zooming in or out */
  const unZoomed = (val: number) => val / zoomLevel;

  return (
    <>
      <rect
        strokeWidth={unZoomed(styles.strokeWidth)}
        stroke="black"
        fill="none"
        x={bounds?.x}
        y={bounds?.y}
        width={bounds?.width}
        height={bounds?.height}
      />
      <rect
        strokeWidth={unZoomed(styles.strokeWidth)}
        stroke="white"
        strokeDasharray={unZoomed(styles.dashLength)}
        fill="none"
        x={bounds?.x}
        y={bounds?.y}
        width={bounds?.width}
        height={bounds?.height}
      >
        <animate
          attributeName="stroke-dashoffset"
          values={`${unZoomed(10)};0`}
          dur="1s"
          repeatCount="indefinite"
        />
      </rect>
      {handleCoords.map(({ label, pos }) => (
        <g key={label}>
          <title>{label}</title>
          <rect
            onClick={(e) => {
              console.log(label, e);
            }}
            x={pos.x - unZoomed(styles.handleSize / 2)}
            y={pos.y - unZoomed(styles.handleSize / 2)}
            width={unZoomed(styles.handleSize)}
            height={unZoomed(styles.handleSize)}
            fill="white"
            stroke="black"
            strokeWidth={unZoomed(1)}
          />
        </g>
      ))}
    </>
  );
};

function getHandleCoords(bounds: DOMRect) {
  return [
    {
      label: "top-left",
      pos: {
        x: bounds.x,
        y: bounds.y,
      },
    },
    {
      label: "top-right",
      pos: {
        x: bounds.x + bounds.width,
        y: bounds.y,
      },
    },

    {
      label: "middle-left",
      pos: {
        x: bounds.x,
        y: bounds.y + bounds.height / 2,
      },
    },

    {
      label: "middle-right",
      pos: {
        x: bounds.x + bounds.width,
        y: bounds.y + bounds.height / 2,
      },
    },
    {
      label: "bottom-right",
      pos: {
        x: bounds.x + bounds.width,
        y: bounds.y + bounds.height,
      },
    },
    {
      label: "bottom-left",
      pos: {
        x: bounds.x,
        y: bounds.y + bounds.height,
      },
    },
  ];
}

const styles = { handleSize: 24, strokeWidth: 2, dashLength: 5 };
