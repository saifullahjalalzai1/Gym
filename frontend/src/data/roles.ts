// MIS Roles
export const roles = [
  { name: "admin", value: "Administrator" },
  { name: "principal", value: "Principal" },
  { name: "vice_principal", value: "Vice Principal" },
  { name: "teacher", value: "Teacher" },
  { name: "accountant", value: "Accountant" },
  { name: "librarian", value: "Librarian" },
  { name: "receptionist", value: "Receptionist" },
  { name: "viewer", value: "Viewer" },
] as const;

export type RoleName = (typeof roles)[number]["name"];

export const getRoleNameDisplay = (role: RoleName) => {
  return roles.find((r) => r.name === role)?.value || role;
};
