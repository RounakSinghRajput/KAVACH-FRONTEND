export const formatRole = (roles?: string[]) => {
  if (!roles || roles.length === 0) return "N/A";

  return roles[0]
    .replace("ROLE_", "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};
