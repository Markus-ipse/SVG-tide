interface IconProps {
  fill?: string;
}

export const ResizeIcon = ({ fill = "none" }: IconProps) => {
  const size = 16;
  const borderWidth = 2;
  return (
    <svg width="1em" height="1em" viewBox="0 0 182.931 182.931">
      <path d="M173.93 92.798a9 9 0 0 0-9 9v50.404L30.728 18h50.404c4.971 0 9-4.029 9-9s-4.029-9-9-9H9a9 9 0 0 0-9 9v72.132c0 4.971 4.029 9 9 9s9-4.029 9-9V30.729l134.202 134.202h-50.404c-4.971 0-9 4.029-9 9s4.029 9 9 9h72.132a9 9 0 0 0 9-9v-72.132a9 9 0 0 0-9-9.001z" />
    </svg>
  );
};
