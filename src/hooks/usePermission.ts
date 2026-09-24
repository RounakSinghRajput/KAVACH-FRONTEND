export const usePermission = () => {

  // get role from login (change if using auth context)
  const role = localStorage.getItem("role");

  const isAdmin = () => {
    return role === "Role_admin";
  };

  return {
    isAdmin
  };
};
  