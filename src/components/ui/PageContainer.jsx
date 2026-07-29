import "./PageContainer.css";

export default function PageContainer({ children }) {
  return (
    <main className="rumo-page">
      {children}
    </main>
  );
}