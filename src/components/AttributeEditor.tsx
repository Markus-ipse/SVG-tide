import { SvgItem } from "../types";

interface Props {
  svgItem: SvgItem | null;
  onChange: <
    T extends SvgItem["type"],
    U extends Extract<SvgItem, { type: T }>,
  >(
    svgItem: { id: number; type: T },
    newAttr: Partial<U["attr"]>
  ) => void;
}

export const AttributeEditor = ({ svgItem, onChange }: Props) => {
  return (
    <div>
      <h4 className="text-l font-semibold">
        Attributes
        {svgItem && (
          <span className="ml-1 text-sm text-slate-500">
            ({`${svgItem?.type} ${svgItem?.id}`})
          </span>
        )}
      </h4>
      <div className="p-2 pb-1 border-2 border-slate-200 ">
        {!svgItem && <div className="text-slate-500">No element selected</div>}
        {svgItem &&
          Object.entries(svgItem.attr).map(([key, value]) => {
            return (
              <div
                key={key}
                className="flex items-center p-1 border-b last-of-type:border-0"
              >
                <span className="font-semibold">{key}</span>
                {colorAttributes.includes(key) ? (
                  <input
                    type="color"
                    className="ml-auto w-20 p-1"
                    value={value.toString()}
                    onChange={(e) =>
                      onChange(svgItem, { [key]: e.target.value })
                    }
                  />
                ) : (
                  <input
                    type={"text"}
                    className="ml-auto w-20 border-2 border-slate-200 p-1"
                    value={value.toString()}
                    onChange={(e) =>
                      onChange(svgItem, { [key]: e.target.value })
                    }
                  />
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

const colorAttributes = ["fill", "stroke"];
