export interface AuthUser {
  id: number | string;
  username: string;
  email: string;
  name: string;
  roles: string[];
  emp_code: string;
  mobile: string;
}
export interface AuthSession {
  access_token: string;
  token_type: string;
  expiresAt: number;
}

export interface AuthPayload {
  user: AuthUser;
  session: AuthSession;
}


export interface Packet {
  id: number;
  [key: string]: any; // dynamic fields
}








// export type AssetHealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
// export type LogSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';
// export type FracasSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
// export type FracasStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
// export type ResponsibleParty = 'OEM' | 'RAILWAY';
// export type LocoStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';

// export interface Zone {
//   id: string;
//   name: string;
//   code: string;
//   created_at: string;
  
// }

// export interface Division {
//   id: string;
//   zone_id: string;
//   name: string;
//   code: string;
//   created_at: string;
// }

// export interface Section {
//   id: string;
//   division_id: string;
//   name: string;
//   code: string;
//   created_at: string;
// }

// export interface Loco {
//   id: string;
//   loco_number: string;
//   division_id: string;
//   status: LocoStatus;
//   created_at: string;
// }

// export interface User {
//   id: string;
//   email: string;
//   full_name: string;
//   role: UserRole;
//   zone_id: string | null;
//   division_id: string | null;
//   is_active: boolean;
//   created_at: string;
//   updated_at: string;
// }

// export interface AssetType {
//   id: string;
//   name: string;
//   description: string;
// }

// export interface Asset {
//   id: string;
//   asset_id: string;
//   asset_type_id: string;
//   zone_id: string;
//   division_id: string;
//   section_id: string | null;
//   loco_id: string | null;
//   health_status: AssetHealthStatus;
//   last_communication: string | null;
//   metadata: Record<string, any>;
//   created_at: string;
//   updated_at: string;
// }

// export interface NMSLog {
//   id: string;
//   timestamp: string;
//   asset_id: string;
//   severity: LogSeverity;
//   source: string;
//   message: string;
//   metadata: Record<string, any>;
//   created_at: string;
// }

// export interface FracasRecord {
//   id: string;
//   fracas_number: string;
//   asset_id: string;
//   loco_id: string | null;
//   section_id: string | null;
//   severity: FracasSeverity;
//   failure_description: string;
//   root_cause: string | null;
//   corrective_action: string | null;
//   responsible_party: ResponsibleParty | null;
//   status: FracasStatus;
//   reported_by: string;
//   assigned_to: string | null;
//   reported_at: string;
//   resolved_at: string | null;
//   closure_remarks: string | null;
//   linked_nms_log_id: string | null;
//   created_at: string;
//   updated_at: string;
// }

// export interface FracasAttachment {
//   id: string;
//   fracas_id: string;
//   file_name: string;
//   file_url: string;
//   uploaded_by: string;
//   created_at: string;
// }

// export interface DashboardStats {
//   totalFailures: number;
//   openFracas: number;
//   criticalAlarms: number;
//   communicationFailures: number;
//   mttr: number;
//   mtbf: number;
// // }

// export interface AuthState {
//   user: User | null;
//   session: any | null;
//   loading: boolean;
//   error: string | null;
//   isAuthenticated: boolean;
// }
// // export interface AuthResponse {
// //   user: User;
// //   session: {
// //     access_token: string;
// //     token_type: string;
// //   };
// // }

// export interface AppState {
//   zones: Zone[];
//   divisions: Division[];
//   assetTypes: AssetType[];
//   selectedZone: string | null;
//   selectedDivision: string | null;
//   themeMode: 'light' | 'dark';
// }
