import { api } from "../services/api";
import { axiosInstance } from "../services/axios";

export interface KavachIncidentRequest {
  tripDateFrom: string;
  tripDateTo: string;
  locoId: number | null;
  locoFirmId: number | null;
  stationId: number | null;
  stationFirmId: number | null;
  incidentCategoryId: number | null;
  incidentSubCategoryId: number | null;
  criticalityLevel: string | null;
  isNMSGenerated: boolean | null;
  zoneId: number | null;
  divisionId: number | null;
  page: number;
  size: number;
  sortBy: string;
  sortDir: string;
  export?: boolean;
}

export interface KavachIncidentApiResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface LocoItem {
  sno: number;
  locoId: number;
  firm: {
    id: number;
    name: string;
  };
  locoType: string;
  locoVersion: string;
  condemned: string;
  shed: string;
  createdDate: string;
}

export const fetchKavachIncidentsPaginated = async (
  requestBody: KavachIncidentRequest,
) => {
  const response = await axiosInstance.post("/kavachIncident/paginated", requestBody);
  return response.data?.data as KavachIncidentApiResponse<any>;
};

export const exportKavachIncidentsToExcel = async (
  requestBody: KavachIncidentRequest,
) => {
  const response = await axiosInstance.post("/kavachIncident/paginated", requestBody, {
    responseType: "blob",
  });
  return response;
};

export interface IncidentCategoryItem {
  id: number;
  name: string;
}

export interface StationItem {
  id: number;
  name: string;
  code: string;
  division: {
    id: number;
    name: string;
    code: string;
    divisionalId: string;
    zone: {
      id: number;
      name: string;
      code: string;
      createdAt: string;
      updatedAt: string;
      createdBy: string;
      updatedBy: string;
      zonalId: string;
    };
  };
  firm: {
    id: number;
    name: string;
  };
  nmsVersion: string;
  sectionId: string;
  section: string;
  kavachSubSystemId: number;
}

export const fetchLocoNumbers = async () => {
  const response = await axiosInstance.get("/kavachIncident/getDistinctLocos");
  return response.data?.data as LocoItem[];
};

export const fetchStationNumbers = async () => {
  const response = await axiosInstance.get("/kavachIncident/getDistinctStations");
  return response.data?.data as StationItem[];
};
export const fetchPacketPopup = async (
  messageId: number,
  msgTable: string = "MSG_TYPE_12",
  packetTable: string="MT_11_ONBOARD_STATION",
) => {
  const response = await axiosInstance.get("/msgType12/onboardStation", {
    params: {
      messageId,
    },
  });

  return response.data;
};

export const fetchIncidentCategories = async () => {
  const response = await axiosInstance.get("/incidentCategory/");
  return response.data?.data as IncidentCategoryItem[];
};
