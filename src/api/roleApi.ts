import { axiosInstance } from "../services/axios";

export interface RoleDTO {
  id: number;
  name: string;
}

export interface RoleMenuMatrixDTO {
  id: number;
  navMenu: string;
  navSubmenu: string;
  roleAccess: Record<number, boolean>;
}

export interface RoleMatrixResponseDTO {
  roles: RoleDTO[];
  matrix: RoleMenuMatrixDTO[];
}

export async function fetchRoleMatrix(): Promise<RoleMatrixResponseDTO> {
  try {
    const res = await axiosInstance.get("/roleMenuPermission/getMatrix");

    if (!res.data || !res.data.data) {
      console.error("Unexpected role matrix response:", res.data);
      return { roles: [], matrix: [] }; // ✅ always return valid structure
    }

    return res.data.data as RoleMatrixResponseDTO;
  } catch (error: any) {
    console.error("Role matrix API error:", error.response?.status);
    return { roles: [], matrix: [] }; // ✅ never crash UI
  }
}

export async function addRoleMenuPermission(
  roleMenuPermissionId: number,
  roleId: number
): Promise<boolean> {
  try {
    const res = await axiosInstance.post(
      "/roleMenuPermission/add",
      null,
      {
        params: { roleMenuPermissionId, roleId },
      }
    );

    return res.data?.status === 200;
  } catch (error: any) {
    console.error("Add permission API error:", error.response?.status);
    return false;
  }
}

export async function removeRoleMenuPermission(
  roleMenuPermissionId: number,
  roleId: number
): Promise<boolean> {
  try {
    const res = await axiosInstance.delete(
      "/roleMenuPermission/remove",
      {
        params: { roleMenuPermissionId, roleId },
      }
    );

    return res.data?.status === 200;
  } catch (error: any) {
    console.error("Remove permission API error:", error.response?.status);
    return false;
  }
}