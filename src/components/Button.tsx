import { cx } from "class-variance-authority";
interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  toggled?: boolean;
}

export const Button = ({
  children,
  className = "",
  toggled,
  ...props
}: Props) => {
  return (
    <button
      className={cx("disabled:opacity-20", className, {
        "bg-slate-100 shadow-inner": toggled,
      })}
      {...props}
    >
      {children}
    </button>
  );
};
