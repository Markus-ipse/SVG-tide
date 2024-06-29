import { SvgBasicShape } from "../../types";

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

export const ShapeIcon = ({
  shape,
  fill,
}: {
  shape: SvgBasicShape;
  fill?: string | false | null;
}) => {
  const fillValue = fill || "none";
  switch (shape) {
    case "rect":
      return <Square fill={fillValue} />;
    case "circle":
      return <Circle fill={fillValue} />;
    default:
      return "x";
  }
};
