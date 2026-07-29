import "./Card.css";

export default function Card({
  children,
  className = "",
}) {
  return (
    <div className={`rumo-card ${className}`}>
      {children}
    </div>
  );
}