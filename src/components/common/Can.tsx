import { ReactNode } from "react";
import { usePermission } from "../../hooks/usePermission";

interface Props {
  children: ReactNode;
}

const Can = ({ children }: Props) => {
  const { isAdmin } = usePermission();

  if (!isAdmin()) return null;

  return <>{children}</>;
};

export default Can;
