import { SvgItem } from "../types";

interface Props {
  element: SvgItem | null;
  onChange: (id: number, key: string, value: string) => void;
}

export const AttributeEditor = ({ element: el, onChange }: Props) => {
  return (
    <div>
      <h4 className="text-l font-semibold">
        Attributes
        {el && (
          <span className="ml-1 text-sm text-slate-500">
            ({`${el?.type} ${el?.id}`})
          </span>
        )}
      </h4>
      <div className="p-2 pb-1 border-2 border-slate-200 ">
        {!el && <div className="text-slate-500">No element selected</div>}
        {el &&
          Object.entries(el.attr).map(([key, value]) => {
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
                    value={value}
                    onChange={(e) => onChange(el.id, key, e.target.value)}
                  />
                ) : (
                  <input
                    type={"text"}
                    className="ml-auto w-20 border-2 border-slate-200 p-1"
                    value={value}
                    onChange={(e) => onChange(el.id, key, e.target.value)}
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
