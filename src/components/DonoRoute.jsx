import { Navigate } from "react-router-dom";

import { usePlano } from "../context/PlanoContext";

export default function DonoRoute({
  children
}) {
  const {
    dono,
    carregandoPlano
  } = usePlano();

  if (carregandoPlano) {
    return null;
  }

  if (!dono) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}
