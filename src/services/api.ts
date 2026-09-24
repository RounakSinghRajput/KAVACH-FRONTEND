import {axiosInstance} from "./axios"
import { SESSION_DURATION } from "../constants/auth";
/* =========================
   AUTH TYPES (INLINE SAFE)
   ========================= */

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
export interface Role {
  id: number;
  name: string;
}

export interface RoleMenuPermissionPayload {
  navMenu: string;
  navSubmenu: string;
  link: string;
  menuIcon: string;
  subMenuIcon: string;
  sequence: number;
  active: boolean;
  roles: { id: number }[];
}
export interface Firm {
  id: number;
  name: string;
}

export interface Zone {
  id: number;
  name: string;
  code: string;
  zonalId: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Division {
  id: number;
  name: string;
  code: string;
  divisionalId: string;
  zone: Zone;
}

export interface Section {
  id: number;
  name: string;
  code: string;
  division: Division;
}

export interface Station {
  id: number;
  name: string;
  code: string;
  locationType: string;
  controllingStation: string;
  locationRouteClass: string;
  division: Division;
  firm: string;
  nmsVersion: string;
  sectionId: number;
  section: Section;
}

export interface UserReference {
  id: number;
}

export interface UserDetails {
  atDate: string;
  designation: UserReference[];
  division: UserReference[];
  email: string;
  empCode: string;
  firm: UserReference[];
  hrmsValidation: boolean;
  id: number;
  mobile: string;
  name: string;
  roles: UserReference[];
  section: UserReference[];
  station: UserReference[];
  status: string;
  username: string;
 zone: {
  id: number | null;
  name: string | null;
  code: string;
  zonalId: string | null;
};
}

/* =========================
   API
   ========================= */

export const api = {
  auth: {
    // 🔐 LOGIN
    signIn: async (
      username: string,
      password: string,
      captchaInput: string,
      captchaId: string,
    ): Promise<AuthPayload> => {
      const response = await axiosInstance.post("/auth/signinc", {
        username,
        password,
        captchaInput,
        captchaId,
      });

      const authData = response.data.data;
      const token = authData.accessToken;

      const payload: AuthPayload = {
        user: {
          id: authData.id,
          username: authData.username,
          email: authData.email,
          name: authData.name,
          roles: authData.roles,
          emp_code: authData.emp_code,
          mobile: authData.mobile,
        },
        session: {
          access_token: token,
          token_type: authData.tokenType,
          expiresAt: Date.now() + SESSION_DURATION,
        },
      };

      // ✅ Store SAME structure everywhere
      localStorage.setItem("auth", JSON.stringify(payload));
      localStorage.setItem("accessToken", token);

      return payload;
    },

    // 🚪 LOGOUT
    signOut: async (): Promise<void> => {
      localStorage.removeItem("auth");
      localStorage.removeItem("accessToken");
    },

    // ♻ AUTO LOGIN (on refresh)
    getCurrentUser: async (): Promise<AuthPayload | null> => {
      const storedAuth = localStorage.getItem("auth");
      if (!storedAuth) return null;

      return JSON.parse(storedAuth) as AuthPayload;
    },

    // 🔑 UPDATE PASSWORD (JWT protected)
    updatePassword: async (newPassword: string) => {
      const response = await axiosInstance.put("/auth/update-password", {
        password: newPassword,
      });

      return response.data;
    },
  },
  generateImpactToken: async () => {
  const response = await axiosInstance.post("/impact/jwt/generate");
  return response.data;
},
  getCurrentUserDetails: async (): Promise<UserDetails> => {
  const auth = JSON.parse(localStorage.getItem("auth") || "{}");
  const userId = auth?.user?.id;

  const response = await axiosInstance.get(`/user/${userId}`);
  return response.data.data;
},
getCurrentUserZoneCode: async (): Promise<string> => {
  const userDetails = await api.getCurrentUserDetails();

  const zoneCode = userDetails.zone?.code;

  if (!zoneCode) {
    throw new Error("Zone code not found");
  }

  return zoneCode;
},
 menu: {
  getByUserId: async (userId: number | string) => {
    const response = await axiosInstance.get(
      `/roleMenuPermission/getByUserId/${userId}`
    );

    return response.data.data;
  },

  getRoles: async (): Promise<Role[]> => {
    const response = await axiosInstance.get("/role/");
    return response.data.data;
  },

  createRoleMenuPermission: async (
    payload: RoleMenuPermissionPayload
  ) => {
    const response = await axiosInstance.post(
      "/roleMenuPermission/",
      payload
    );

    return response.data;
  },
},
master: {
  // Firm API
  getFirms: async (): Promise<Firm[]> => {
    const response = await axiosInstance.get("/firm/");
    return response.data.data;
  },

  // Zone API
  getZones: async (): Promise<Zone[]> => {
    const response = await axiosInstance.get("/zone/");
    return response.data.data;
  },

  // Division API
  getDivisions: async (): Promise<Division[]> => {
    const response = await axiosInstance.get("/divisions/");
    return response.data.data;
  },

  // Filter division by zone
  getDivisionsByZone: async (zoneId: number): Promise<Division[]> => {
    const response = await axiosInstance.get(
      `/division/getAllDivisionByZone/${zoneId}`
    );
    return response.data.data;
  },

  // Station API
  getStations: async (): Promise<Station[]> => {
    const response = await axiosInstance.get("/station/");
    return response.data.data;
  },

  // Filter station by division
  getStationsByDivision: async (
    divisionId: number
  ): Promise<Station[]> => {
    const response = await axiosInstance.get(
      `/station/?divisionId=${divisionId}`
    );
    return response.data.data;
  },
},
};





// import type {
//   Zone, 
//   Division,
//   Section,
//   Loco,
//   User,
//   Asset,
//   AssetType,
//   NMSLog,
//   FracasRecord,
//   DashboardStats,
// } from '../types';

// const DUMMY_USER: User = {
//   id: 'user-1',
//   email: 'superAdmin',
//   full_name: 'Admin User',
//   role: 'SUPER_ADMIN',
//   zone_id: null,
//   division_id: null,
//   is_active: true,
//   created_at: new Date().toISOString(),
//   updated_at: new Date().toISOString(),
// };
// const DUMMY_USERS: Array<{
//   email: string;
//   password: string;
//   user: User;
// }> = [
//   {
//     email: "superAdmin",
//     password: "Admin@123",
//     user: {
//       id: "user-1",
//       email: "superAdmin",
//       full_name: "Super Admin",
//       role: "SUPER_ADMIN",
//       zone_id: null,
//       division_id: null,
//       is_active: true,
//       created_at: new Date().toISOString(),
//       updated_at: new Date().toISOString(),
//     },
//   },
//   {
//     email: "OJFBNX",
//     password: "Saurabh@42",
//     user: {
//       id: "user-2",
//       email: "OJFBNX",
//       full_name: "Admin Officer",
//       role: "ADMIN",
//       zone_id: "zone-1",
//       division_id: null,
//       is_active: true,
//       created_at: new Date().toISOString(),
//       updated_at: new Date().toISOString(),
//     },
//   },
//   {
//     email: "user",
//     password: "User@123",
//     user: {
//       id: "user-3",
//       email: "user",
//       full_name: "Division User",
//       role: "USER",
//       zone_id: "zone-2",
//       division_id: "div-2",
//       is_active: true,
//       created_at: new Date().toISOString(),
//       updated_at: new Date().toISOString(),
//     },
//   },
// ];


// const DUMMY_ZONES: Zone[] = [
//   { id: 'zone-1', name: 'Central Zone', code: 'CR', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
//   { id: 'zone-2', name: 'Western Zone', code: 'WR', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
//   { id: 'zone-3', name: 'Northern Zone', code: 'NR', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
//   { id: 'zone-4', name: 'Southern Zone', code: 'SR', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
//   { id: 'zone-5', name: 'Eastern Zone', code: 'ER', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
// ];

// const DUMMY_DIVISIONS: Division[] = [
//   { id: 'div-1', name: 'Mumbai Division', code: 'MMCT', zone_id: 'zone-1', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
//   { id: 'div-2', name: 'Pune Division', code: 'PUNE', zone_id: 'zone-1', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
//   { id: 'div-3', name: 'Delhi Division', code: 'DLI', zone_id: 'zone-3', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
//   { id: 'div-4', name: 'Bangalore Division', code: 'BLR', zone_id: 'zone-4', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
// ];

// const DUMMY_SECTIONS: Section[] = [
//   { id: 'sec-1', name: 'CST-KYN Section', code: 'CST-KYN', division_id: 'div-1', start_station: 'CST', end_station: 'KYN', distance_km: 54, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
//   { id: 'sec-2', name: 'PUNE-LNL Section', code: 'PUNE-LNL', division_id: 'div-2', start_station: 'PUNE', end_station: 'LNL', distance_km: 65, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
// ];

// const DUMMY_LOCOS: Loco[] = [
//   { id: 'loco-1', loco_number: 'WAP7-30425', loco_type: 'WAP7', division_id: 'div-1', shed: 'Mumbai', status: 'ACTIVE', health_status: 'HEALTHY', last_maintenance: new Date().toISOString(), next_maintenance: new Date().toISOString(), is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
//   { id: 'loco-2', loco_number: 'WAP7-30426', loco_type: 'WAP7', division_id: 'div-1', shed: 'Mumbai', status: 'ACTIVE', health_status: 'HEALTHY', last_maintenance: new Date().toISOString(), next_maintenance: new Date().toISOString(), is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
// ];

// let mockSession: { user: User; token: string } | null = null;
// let mockData = {
//   zones: [...DUMMY_ZONES],
//   divisions: [...DUMMY_DIVISIONS],
//   sections: [...DUMMY_SECTIONS],
//   locos: [...DUMMY_LOCOS],
//   filterPresets: [] as Array<{ id: string; name: string; filters: any; user_id: string; created_at: string }>,
// };

// const loadSession = () => {
//   const stored = localStorage.getItem('mockSession');
//   if (stored) {
//     mockSession = JSON.parse(stored);
//   }
// };

// const saveSession = () => {
//   if (mockSession) {
//     localStorage.setItem('mockSession', JSON.stringify(mockSession));
//   } else {
//     localStorage.removeItem('mockSession');
//   }
// };

// loadSession();

  
// export const api = {
//   auth: {
//     // 🔐 LOGIN
//     signIn: async (username: string, password: string) => {
//       const response = await axiosInstance.post('/auth/signin', {
//         username,
//         password,
//       });

//         const authData = response.data.data;

//         const token = authData.accessToken;

//       // store JWT
//       localStorage.setItem('accessToken', token);
//       localStorage.setItem('user', JSON.stringify(authData));

//        return {
//         user: {
//           id: authData.id,
//           username: authData.username,
//           email: authData.email,
//           name: authData.name,
//           roles: authData.roles,
//           emp_code: authData.emp_code,
//           mobile: authData.mobile,
//         },
//         session: {
//           access_token: token,
//           token_type: authData.tokenType,
//         },
//       };
//     },

//     // 🚪 LOGOUT
//     signOut: async () => {
//       localStorage.removeItem('accessToken');
//       localStorage.removeItem('user');
//     },

//     // ♻ AUTO LOGIN (on refresh)
//     getCurrentUser: async () => {
//       // const response = await axiosInstance.get('/auth/me');
//       const storedAuth = localStorage.getItem("user");
//        return storedAuth; // user info
//    },



//     // 🔑 UPDATE PASSWORD (JWT protected)
//     updatePassword: async (newPassword: string) => {
//       const response = await axiosInstance.put('/auth/update-password', {
//         password: newPassword,
//       });

//       return response.data;
//     },
//   },
// };


// let mockSession: { user: User; token: string } | null = null;
// let mockData = {
//   zones: [...DUMMY_ZONES],
//   divisions: [...DUMMY_DIVISIONS],
//   sections: [...DUMMY_SECTIONS],
//   locos: [...DUMMY_LOCOS],
//   filterPresets: [] as Array<{ id: string; name: string; filters: any; user_id: string; created_at: string }>,
// };

// const loadSession = () => {
//   const stored = localStorage.getItem('mockSession');
//   if (stored) {
//     mockSession = JSON.parse(stored);
//   }
// };

// const saveSession = () => {
//   if (mockSession) {
//     localStorage.setItem('mockSession', JSON.stringify(mockSession));
//   } else {
//     localStorage.removeItem('mockSession');
//   }
// };

// loadSession();

// export const api = {
//   auth: {
//     signIn: async (email: string, password: string) => {
//   await new Promise((resolve) => setTimeout(resolve, 500));

//   const matchedUser = DUMMY_USERS.find(
//     (u) => u.email === email && u.password === password
//   );

//   if (!matchedUser) {
//     throw new Error("Invalid email or password");
//   }

//   const token = "mock-token-" + Date.now();

//   mockSession = {
//     user: matchedUser.user,
//     token,
//   };

//   saveSession();

//   return {
//     user: matchedUser.user,
//     session: {
//       access_token: token,
//     },
//   };
// },


//     signOut: async () => {
//       await new Promise(resolve => setTimeout(resolve, 300));
//       mockSession = null;
//       saveSession();
//     },

//     getCurrentUser: async () => {
//       await new Promise(resolve => setTimeout(resolve, 200));
//       loadSession();
//       return mockSession?.user || null;
//     },

//     updatePassword: async (newPassword: string) => {
//       await new Promise(resolve => setTimeout(resolve, 500));
//       if (!mockSession) throw new Error('Not authenticated');
//       return { success: true };
//     },
//   },









//   zones: {
//     getAll: async (): Promise<Zone[]> => {
//       await new Promise(resolve => setTimeout(resolve, 300));
//       return [...mockData.zones];
//     },

//     getById: async (id: string): Promise<Zone | null> => {
//       await new Promise(resolve => setTimeout(resolve, 200));
//       return mockData.zones.find(z => z.id === id) || null;
//     },

//     create: async (zone: Partial<Zone>): Promise<Zone> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       const newZone: Zone = {
//         id: 'zone-' + Date.now(),
//         name: zone.name || '',
//         code: zone.code || '',
//         is_active: true,
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString(),
//       };
//       mockData.zones.push(newZone);
//       return newZone;
//     },

//     update: async (id: string, updates: Partial<Zone>): Promise<Zone> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       const index = mockData.zones.findIndex(z => z.id === id);
//       if (index === -1) throw new Error('Zone not found');
//       mockData.zones[index] = { ...mockData.zones[index], ...updates, updated_at: new Date().toISOString() };
//       return mockData.zones[index];
//     },

//     delete: async (id: string): Promise<void> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       mockData.zones = mockData.zones.filter(z => z.id !== id);
//     },
//   },

//   divisions: {
//     getAll: async (): Promise<Division[]> => {
//       await new Promise(resolve => setTimeout(resolve, 300));
//       return [...mockData.divisions];
//     },

//     getByZone: async (zoneId: string): Promise<Division[]> => {
//       await new Promise(resolve => setTimeout(resolve, 300));
//       return mockData.divisions.filter(d => d.zone_id === zoneId);
//     },

//     create: async (division: Partial<Division>): Promise<Division> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       const newDivision: Division = {
//         id: 'div-' + Date.now(),
//         name: division.name || '',
//         code: division.code || '',
//         zone_id: division.zone_id || '',
//         is_active: true,
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString(),
//       };
//       mockData.divisions.push(newDivision);
//       return newDivision;
//     },

//     update: async (id: string, updates: Partial<Division>): Promise<Division> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       const index = mockData.divisions.findIndex(d => d.id === id);
//       if (index === -1) throw new Error('Division not found');
//       mockData.divisions[index] = { ...mockData.divisions[index], ...updates, updated_at: new Date().toISOString() };
//       return mockData.divisions[index];
//     },

//     delete: async (id: string): Promise<void> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       mockData.divisions = mockData.divisions.filter(d => d.id !== id);
//     },
//   },

//   sections: {
//     getAll: async (): Promise<Section[]> => {
//       await new Promise(resolve => setTimeout(resolve, 300));
//       return [...mockData.sections];
//     },

//     getByDivision: async (divisionId: string): Promise<Section[]> => {
//       await new Promise(resolve => setTimeout(resolve, 300));
//       return mockData.sections.filter(s => s.division_id === divisionId);
//     },

//     create: async (section: Partial<Section>): Promise<Section> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       const newSection: Section = {
//         id: 'sec-' + Date.now(),
//         name: section.name || '',
//         code: section.code || '',
//         division_id: section.division_id || '',
//         start_station: section.start_station || '',
//         end_station: section.end_station || '',
//         distance_km: section.distance_km || 0,
//         is_active: true,
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString(),
//       };
//       mockData.sections.push(newSection);
//       return newSection;
//     },

//     update: async (id: string, updates: Partial<Section>): Promise<Section> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       const index = mockData.sections.findIndex(s => s.id === id);
//       if (index === -1) throw new Error('Section not found');
//       mockData.sections[index] = { ...mockData.sections[index], ...updates, updated_at: new Date().toISOString() };
//       return mockData.sections[index];
//     },

//     delete: async (id: string): Promise<void> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       mockData.sections = mockData.sections.filter(s => s.id !== id);
//     },
//   },

//   locos: {
//     getAll: async (): Promise<Loco[]> => {
//       await new Promise(resolve => setTimeout(resolve, 300));
//       return [...mockData.locos];
//     },

//     getByDivision: async (divisionId: string): Promise<Loco[]> => {
//       await new Promise(resolve => setTimeout(resolve, 300));
//       return mockData.locos.filter(l => l.division_id === divisionId);
//     },

//     create: async (loco: Partial<Loco>): Promise<Loco> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       const newLoco: Loco = {
//         id: 'loco-' + Date.now(),
//         loco_number: loco.loco_number || '',
//         loco_type: loco.loco_type || '',
//         division_id: loco.division_id || '',
//         shed: loco.shed || '',
//         status: loco.status || 'ACTIVE',
//         health_status: loco.health_status || 'HEALTHY',
//         last_maintenance: loco.last_maintenance || new Date().toISOString(),
//         next_maintenance: loco.next_maintenance || new Date().toISOString(),
//         is_active: true,
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString(),
//       };
//       mockData.locos.push(newLoco);
//       return newLoco;
//     },

//     update: async (id: string, updates: Partial<Loco>): Promise<Loco> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       const index = mockData.locos.findIndex(l => l.id === id);
//       if (index === -1) throw new Error('Loco not found');
//       mockData.locos[index] = { ...mockData.locos[index], ...updates, updated_at: new Date().toISOString() };
//       return mockData.locos[index];
//     },

//     delete: async (id: string): Promise<void> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       mockData.locos = mockData.locos.filter(l => l.id !== id);
//     },
//   },

//   assetTypes: {
//     getAll: async (): Promise<AssetType[]> => {
//       await new Promise(resolve => setTimeout(resolve, 300));
//       return [
//         { id: 'at-1', name: 'RFID Tag', category: 'TRACKSIDE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
//         { id: 'at-2', name: 'Tower', category: 'INFRASTRUCTURE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
//         { id: 'at-3', name: 'Onboard Unit', category: 'LOCO', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
//       ];
//     },
//   },

//   assets: {
//     getAll: async (filters?: any): Promise<Asset[]> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       return [];
//     },

//     getById: async (id: string): Promise<Asset | null> => {
//       await new Promise(resolve => setTimeout(resolve, 300));
//       return null;
//     },

//     create: async (asset: Partial<Asset>): Promise<Asset> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       throw new Error('Not implemented');
//     },

//     update: async (id: string, updates: Partial<Asset>): Promise<Asset> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       throw new Error('Not implemented');
//     },

//     delete: async (id: string): Promise<void> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//     },
//   },

//   nmsLogs: {
//     getAll: async (filters?: any): Promise<NMSLog[]> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       return [];
//     },
//   },

//   fracas: {
//     getAll: async (filters?: any): Promise<FracasRecord[]> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       return [];
//     },

//     getById: async (id: string): Promise<FracasRecord | null> => {
//       await new Promise(resolve => setTimeout(resolve, 300));
//       return null;
//     },

//     create: async (record: Partial<FracasRecord>): Promise<FracasRecord> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       throw new Error('Not implemented');
//     },

//     update: async (id: string, updates: Partial<FracasRecord>): Promise<FracasRecord> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       throw new Error('Not implemented');
//     },
//   },

//   dashboard: {
//     getStats: async (filters?: any): Promise<DashboardStats> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       return {
//         totalFailures: 0,
//         openFracas: 0,
//         criticalAlarms: 1,
//         communicationFailures: 0,
//         mttr: 0,
//         mtbf: 0,
//       };
//     },
//   },

//   users: {
//     getAll: async (): Promise<User[]> => {
//       await new Promise(resolve => setTimeout(resolve, 300));
//       return [DUMMY_USER];
//     },

//     create: async (userData: any): Promise<User> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       throw new Error('Not implemented');
//     },

//     update: async (id: string, updates: Partial<User>): Promise<User> => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       if (mockSession && mockSession.user.id === id) {
//         mockSession.user = { ...mockSession.user, ...updates };
//         saveSession();
//         return mockSession.user;
//       }
//       throw new Error('User not found');
//     },
//   },

//   filterPresets: {
//     getAll: async () => {
//       await new Promise(resolve => setTimeout(resolve, 300));
//       return mockData.filterPresets;
//     },

//     create: async (preset: { name: string; filters: any }) => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       if (!mockSession) throw new Error('Not authenticated');
//       const newPreset = {
//         id: 'preset-' + Date.now(),
//         name: preset.name,
//         filters: preset.filters,
//         user_id: mockSession.user.id,
//         created_at: new Date().toISOString(),
//       };
//       mockData.filterPresets.push(newPreset);
//       return newPreset;
//     },

//     delete: async (id: string) => {
//       await new Promise(resolve => setTimeout(resolve, 400));
//       mockData.filterPresets = mockData.filterPresets.filter(p => p.id !== id);
//     },
//   },
// };