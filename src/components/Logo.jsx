import logo from "../assets/logo-rumo.png";

export default function Logo({
  width = 260,
  className = "",
}) {
  return (
    <img
      src={logo}
      alt="Rumo"
      width={width}
      className={className}
      draggable={false}
    />
  );
}