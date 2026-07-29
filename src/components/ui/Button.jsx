import "./Button.css";

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  fullWidth = false,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        rumo-button
        rumo-button-${variant}
        ${fullWidth ? "rumo-button-full" : ""}
      `}
    >
      {children}
    </button>
  );
}