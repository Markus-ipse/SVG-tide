import { SvgShapeElements } from "../../types";

interface IconProps {
  fill?: string;
}

const Square = ({ fill = "none" }: IconProps) => {
  const size = 16;
  const borderWidth = 2;
  return (
    <svg width="1em" height="1em" viewBox={`0 0 ${size} ${size}`}>
      <rect
        x={borderWidth}
        y={borderWidth}
        width={size - borderWidth * 2}
        height={size - borderWidth * 2}
        stroke="black"
        strokeWidth={borderWidth}
        fill={fill}
      />
    </svg>
  );
};

const Circle = ({ fill }: IconProps) => {
  const size = 16;
  const borderWidth = 2;
  return (
    <svg width="1em" height="1em" viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - borderWidth / 2}
        stroke="black"
        strokeWidth={borderWidth}
        fill={fill}
      />
    </svg>
  );
};

const Polygon = ({ fill }: IconProps) => {
  const size = 16;

  const numberOfSides = 5,
    xCenter = 8,
    yCenter = 8,
    polygonSize = 7,
    step = (2 * Math.PI) / numberOfSides, //Precalculate step value
    shift = (Math.PI / 180.0) * -18; //Quick fix ;)

  const points: { x: number; y: number }[] = [];

  for (let i = 0; i <= numberOfSides; i++) {
    const curStep = i * step + shift;
    points.push({
      x: xCenter + polygonSize * Math.cos(curStep),
      y: yCenter + polygonSize * Math.sin(curStep),
    });
  }

  return (
    <svg width="1em" height="1em" viewBox={`0 0 ${size} ${size}`}>
      <polygon
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        fill={fill}
        stroke="black"
        strokeWidth="2"
      />
    </svg>
  );
};

export const ShapeIcon = ({
  shape,
  fill,
}: {
  shape: SvgShapeElements;
  fill?: string | false | null;
}) => {
  const fillValue = fill || "none";
  switch (shape) {
    case "rect":
      return <Square fill={fillValue} />;
    case "circle":
      return <Circle fill={fillValue} />;
    case "polygon":
      return <Polygon fill={fillValue} />;
    default:
      return "x";
  }
};
