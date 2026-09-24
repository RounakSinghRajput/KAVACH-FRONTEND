import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import * as XLSX from "xlsx-js-style";
import "react-datepicker/dist/react-datepicker.css";
import { axiosInstance } from "../../services/axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  RefreshCcw,
  FileSpreadsheet,
  SlidersHorizontal,
  Database,
  ArrowLeft,
  X,
  Train,
} from "lucide-react";
import { useLocation } from "react-router-dom";

type FiltersType = {
  fromDate: Date | null;
  toDate: Date | null;
  division: string;
  firm: string;
  search: string;
};

const COLUMN_LABELS: Record<string, string> = {
  SOURCE_STN_ILC_IBS_ID: "NMS_STN",
  NMS_SYSTEM_ID: "NMS_ID",
  DATE_TIME: "DATE",
  MSG_TIME: "TIME",
  STATION_ACTIVE_RADIO: "ACTIVE_RAD",
  DEST_LOCO_ID: "LOCO_ID",
  REF_PROF_ID: "PROF_ID",
  LAST_REF_RFID: "REF_RFID",
  PKT_DIR: "PKT_DIR",
  DEST_LOCO_SOS: "DEST_LOCO_SOS",
  CUR_SIG_ASP: "SIG_ASPECT",
  NEXT_SIG_ASPECT: "NXT_SIG_ASPECT",
  APPR_SIG_DIST: "APPR_SIG_DIST",
  AUTHORITY_TYPE: "AUTH_TYPE",
  AUTHORIZED_SPEED: "AUTH_SPEED",
  MA_W_R_T_SIG: "MA",
  REQ_SHORTEN_MA: "REQ_SHORTEN_MA",
  NEW_MA: "NEW_MA",
  TRN_LEN_INFO_STS: "TLM_STS",
  TRN_LEN_INFO_TYPE: "TLM_TYPE",
  NEXT_STN_COMM: "NXT_STN_COMM",
  APPR_STN_ILC_IBS_ID: "APPR_STN",

  // extra common fields
  ZONE: "ZONE",
  DIVISION: "DIVISION",
  FIRM_NAME: "FIRM",
};

const HIDDEN_COLUMNS = [
  "PKT",
  "PACKET_DATA",
  "CRC",
  "PKT_CRC",
  "CREATED_AT",
  "SOF",
  "SOF_TX_BYTE1",
  "SOF_TX_BYTE2",
  "IP",
];
const AA_COLUMNS = [
  "ZONE",
  "DIVISION",
  "FIRM_NAME",

  "DATE_TIME",
  "NMS_SYSTEM_ID",
  "CREATED_AT",
  "MSG_TIME",

  "STATIONARY_KAVACH_ID",
  "SYSTEM_VERSION",
  "STATION_ACTIVE_RADIO",

  "SOURCE_STN_ILC_IBS_ID",
  "SOURCE_STN_ILC_IBS_VERSION",
  "STN_ILC_IBS_LOC",

  "DEST_LOCO_ID",

  "ALLOTTED_UPLINK_FREQ",
  "ALLOTTED_DOWNLINK_FREQ",
  "ALLOTTED_TDMA_TIMESLOT",

  "STN_RND_NUM_RS",
  "STN_TDMA",
  "MAC_CODE",

  "PKT",
  "PKT_TYPE",
  "PKT_LENGTH",
  "PACKET_DATA",
  "PACKET_DATA_ID",
  "CRC",
  "PKT_CRC",

  "IP",

  // additional fields
  "ID",
  "SOF",
  "MESSAGE_TYPE",
  "MESSAGE_LENGTH",
  "MESSAGE_SEQUENCE",

  "SOF_TX_BYTE1",
  "SOF_TX_BYTE2",

  "NMS_IP_ID",
  "FIRM",

  "SYSTEM_VERSION_NAME",

  "PKT_TBL",

  "FRAME_NUM",

  "PACKET_DATA_TYPE",
  "PADDING_BITS",

  "LOCO_SPECIFIC_MAC_CODE",

  "SUB_PKT_TBL",
  "SUB_PKT_TYPE",

  "FRAME_OFFSET",

  "TRAIN_SECTION_TYPE",

  "CUR_SIG_INFO",
  "CUR_SIG_ASP",
  "NEXT_SIG_ASPECT",
  "APPR_SIG_DIST",

  "AUTHORITY_TYPE",
  "AUTHORIZED_SPEED",
  "MA_W_R_T_SIG",

  "REQ_SHORTEN_MA",
  "NEW_MA",

  "TRN_LEN_INFO_STS",
  "TRN_LEN_INFO_TYPE",

  "REF_FRAME_NUM_TLM",
  "REF_OFFSET_INT_TLM",

  "NEXT_STN_COMM",
  "APPR_STN_ILC_IBS_ID",
];

const AE_COLUMNS = [
  "ZONE",
  "DIVISION",
  "FIRM_NAME",
  "DATE_TIME",
  "CREATED_AT",
  "STATIONARY_KAVACH_ID",
  "NMS_SYSTEM_ID",
  "SYSTEM_VERSION",
  "STATION_ACTIVE_RADIO",
  "PACKET_DATA",
  "PACKET_DATA_ID",
  "PKT",
  "CRC",
  "IP",
  "GEN_SOS_CALL",
  "PADDING_BITS",
];

const SP1_COLUMNS = [
  "ZONE",
  "DIVISION",
  "FIRM_NAME",
  "DATE_TIME",
  "CREATED_AT",
  "MSG_TIME",
  "STATIONARY_KAVACH_ID",
  "NMS_SYSTEM_ID",
  "SYSTEM_VERSION",
  "ONBOARD_ACTIVE_RADIO",
  "PACKET_DATA",
  "PACKET_DATA_ID",
  "NO_OF_MA_SECTION_COUNT",
  "ROUTE_ID",
  "PKT",
  "CRC",
  "IP",
];

const SP2_COLUMNS = [
  "ZONE",
  "DIVISION",
  "FIRM_NAME",
  "DATE_TIME",
  "CREATED_AT",
  "MSG_TIME",
  "STATIONARY_KAVACH_ID",
  "NMS_SYSTEM_ID",
  "SYSTEM_VERSION",
  "ONBOARD_ACTIVE_RADIO",
  "PACKET_DATA",
  "PACKET_DATA_ID",
  "NO_OF_MA_SECTION_COUNT",
  "ROUTE_ID",
  "PKT",
  "CRC",
  "IP",
];
const LR_COLUMNS = [
  "ZONE",
  "DIVISION",
  "FIRM_NAME",
  "NMS_SYSTEM_ID",
  "MSG_TIME",
  "ONBOARD_ACTIVE_RADIO",
  "SOURCE_LOCO_ID",
  "SOURCE_LOCO_VERSION",
  "ABS_LOCO_LOC",
  "TRAIN_INT",
  "TRAIN_LENGTH",
  "TRAIN_SPEED",
  "EMERGENCY_STATUS",
  "LOCO_MODE",
  "LAST_RFID_TAG",
  "TAG_DUP",
  "TAG_LINK_INFO",
  "TIN",
  "BRAKE_APPLIED",
  "NEW_MA_REPLY",
  "LAST_REF_PROFILE_NUM",
  "SIG_OV",
];
const AR_COLUMNS = [
  "ZONE",
  "DIVISION",
  "FIRM_NAME",
  "NMS_SYSTEM_ID",
  "MSG_TIME",
  "ONBOARD_ACTIVE_RADIO",
  "SOURCE_LOCO_ID",
  "SOURCE_LOCO_VERSION",
  "ABS_LOCO_LOC",
  "TRAIN_INT",
  "TRAIN_LENGTH",
  "TRAIN_SPEED",
  "MOVEMENT_DIR",

  "EMERGENCY_STATUS",
  "LOCO_MODE",
  "LAST_RFID_TAG",
  "APPROACHING_STATION_ID",
];
const COMMON_COLUMN_LABELS: Record<string, string> = {
  ZONE: "ZONE",
  DIVISION: "DIV",
  FIRM_NAME: "FIRM",
  DATE_TIME: "DATE",
  CREATED_AT: "CREATED",
  MSG_TIME: "TIME",
};
const MA_COLUMN_LABELS: Record<string, string> = {
  DATE_TIME: "DATE",
  CREATED_AT: "CREATED",
  ID: "ID",
  MSG_TIME: "TIME",
  SOF: "SOF",
  MESSAGE_TYPE: "MSG_TYPE",
  MESSAGE_LENGTH: "MSG_LEN",
  MESSAGE_SEQUENCE: "MSG_SEQ",

  STATIONARY_KAVACH_ID: "KAVACH_ID",
  NMS_SYSTEM_ID: "NMS_ID",
  SYSTEM_VERSION: "SYS_VER",
  STATION_ACTIVE_RADIO: "ACT_RADIO",

  SOF_TX_BYTE1: "SOF_B1",
  SOF_TX_BYTE2: "SOF_B2",

  PACKET_DATA_ID: "PKT_ID",
  PACKET_DATA: "PKT_DATA",
  CRC: "CRC",
  NMS_IP_ID: "IP_ID",

  FIRM: "FIRM",
  IP: "IP",

  SYSTEM_VERSION_NAME: "SYS_VER_NAME",
  PKT_TBL: "PKT_TBL",
  PKT: "PKT",

  PKT_TYPE: "PKT_TYPE",
  PKT_LENGTH: "PKT_LEN",
  FRAME_NUM: "FRAME",

  SOURCE_STN_ILC_IBS_ID: "SRC_STN_ID",
  SOURCE_STN_ILC_IBS_VERSION: "STN_VER",

  DEST_LOCO_ID: "LOCO_ID",
  REF_PROF_ID: "PROF_ID",
  LAST_REF_RFID: "REF_RFID",

  DIST_PKT_START: "DIST_START",
  PKT_DIR: "PKT_DIR",

  PADDING_BITS: "PAD_BITS",
  PACKET_DATA_TYPE: "DATA_TYPE",

  LOCO_SPECIFIC_MAC_CODE: "MAC_CODE",
  PKT_CRC: "PKT_CRC",

  SUB_PKT_TBL: "SUB_PKT",
  SUB_PKT_TYPE: "SUB_TYPE",
  SUB_PKT_LENGTH_MA: "SUB_LEN",

  FRAME_OFFSET: "OFFSET",

  DEST_LOCO_SOS: "SOS",
  TRAIN_SECTION_TYPE: "SEC_TYPE",

  CUR_SIG_INFO: "SIG_INFO",
  CUR_SIG_ASP: "CUR_SIG",
  NEXT_SIG_ASPECT: "NEXT_SIG",

  APPR_SIG_DIST: "SIG_DIST",

  AUTHORITY_TYPE: "AUTH_TYPE",
  AUTHORIZED_SPEED: "AUTH_SPD",

  MA_W_R_T_SIG: "MA",

  REQ_SHORTEN_MA: "SHORT_MA",
  NEW_MA: "NEW_MA",

  TRN_LEN_INFO_STS: "TLM_STS",
  TRN_LEN_INFO_TYPE: "TLM_TYPE",

  REF_FRAME_NUM_TLM: "REF_FRAME",
  REF_OFFSET_INT_TLM: "REF_OFFSET",

  NEXT_STN_COMM: "NXT_STN_COMM",
  APPR_STN_ILC_IBS_ID: "APPR_STN",

  FIRM_NAME: "FIRM",
  DIVISION: "DIV",
  ZONE: "ZONE",
};
const AA_COLUMN_LABELS: Record<string, string> = {
  DATE_TIME: "DATE",
  CREATED_AT: "CREATED",
  ID: "ID",
  MSG_TIME: "TIME",

  SOF: "SOF",
  MESSAGE_TYPE: "MSG_TYPE",
  MESSAGE_LENGTH: "MSG_LEN",
  MESSAGE_SEQUENCE: "MSG_SEQ",

  STATIONARY_KAVACH_ID: "KAVACH_ID",
  NMS_SYSTEM_ID: "NMS_ID",
  SYSTEM_VERSION: "SYS_VER",
  STATION_ACTIVE_RADIO: "ACT_RAD",

  SOF_TX_BYTE1: "SOF_B1",
  SOF_TX_BYTE2: "SOF_B2",

  PACKET_DATA_ID: "PKT_ID",
  PACKET_DATA: "PKT_DATA",
  CRC: "CRC",

  NMS_IP_ID: "IP_ID",
  FIRM: "FIRM",
  IP: "IP",

  SYSTEM_VERSION_NAME: "SYS_VER_NAME",

  PKT_TBL: "PKT_TBL",
  PKT: "PKT",
  PKT_TYPE: "PKT_TYPE",
  PKT_LENGTH: "PKT_LEN",

  FRAME_NUM: "FRAME",

  SOURCE_STN_ILC_IBS_ID: "SRC_STN",
  SOURCE_STN_ILC_IBS_VERSION: "STN_VER",
  STN_ILC_IBS_LOC: "STN_LOC",

  DEST_LOCO_ID: "LOCO_ID",

  ALLOTTED_UPLINK_FREQ: "UP_FREQ",
  ALLOTTED_DOWNLINK_FREQ: "DOWN_FREQ",
  ALLOTTED_TDMA_TIMESLOT: "TDMA_SLOT",

  STN_RND_NUM_RS: "RND_NUM",
  STN_TDMA: "STN_TDMA",

  MAC_CODE: "MAC_CODE",
  PKT_CRC: "PKT_CRC",

  FIRM_NAME: "FIRM_NAME",
  DIVISION: "DIV",
  ZONE: "ZONE",
};
const AE_COLUMN_LABELS: Record<string, string> = {
  DATE_TIME: "DATE",
  CREATED_AT: "CREATED",
  ID: "ID",
  MSG_TIME: "TIME",

  SOF: "SOF",
  MESSAGE_TYPE: "MSG_TYPE",
  MESSAGE_LENGTH: "MSG_LEN",
  MESSAGE_SEQUENCE: "MSG_SEQ",

  STATIONARY_KAVACH_ID: "KAVACH_ID",
  NMS_SYSTEM_ID: "NMS_ID",
  SYSTEM_VERSION: "SYS_VER",
  STATION_ACTIVE_RADIO: "ACT_RAD",

  SOF_TX_BYTE1: "SOF_B1",
  SOF_TX_BYTE2: "SOF_B2",

  PACKET_DATA_ID: "PKT_ID",
  PACKET_DATA: "PKT_DATA",
  CRC: "CRC",

  NMS_IP_ID: "IP_ID",
  FIRM: "FIRM",
  IP: "IP",

  SYSTEM_VERSION_NAME: "SYS_VER_NAME",

  PKT_TBL: "PKT_TBL",
  PKT: "PKT",
  PKT_TYPE: "PKT_TYPE",
  PKT_LENGTH: "PKT_LEN",

  FRAME_NUM: "FRAME",

  SOURCE_STN_ILC_IBS_ID: "SRC_STN",
  SOURCE_STN_ILC_IBS_VERSION: "STN_VER",
  STN_ILC_IBS_LOC: "STN_LOC",

  GEN_SOS_CALL: "SOS_CALL",
  PADDING_BITS: "PAD_BITS",

  PKT_CRC: "PKT_CRC",

  FIRM_NAME: "FIRM_NAME",
  DIVISION: "DIV",
  ZONE: "ZONE",
};

const SP_COLUMN_LABELS: Record<string, string> = {
  DATE_TIME: "DATE",
  CREATED_AT: "CREATED",
  ID: "ID",
  MSG_TIME: "TIME",

  IP: "IP",
  FIRM: "FIRM",

  SOF: "SOF",
  MESSAGE_TYPE: "MSG_TYPE",
  MESSAGE_LENGTH: "MSG_LEN",
  MESSAGE_SEQUENCE: "MSG_SEQ",

  STATIONARY_KAVACH_ID: "KAVACH_ID",
  NMS_SYSTEM_ID: "NMS_ID",
  SYSTEM_VERSION: "SYS_VER",
  ONBOARD_ACTIVE_RADIO: "ONB_RAD",

  SOF_TX_BYTE1: "SOF_B1",
  SOF_TX_BYTE2: "SOF_B2",

  PACKET_DATA_ID: "PKT_ID",
  PACKET_DATA: "PKT_DATA",

  NO_OF_MA_SECTION_COUNT: "MA_SEC_COUNT",
  ROUTE_ID: "ROUTE_ID",

  CRC: "CRC",
  NMS_IP_ID: "IP_ID",

  PKT: "PKT",
  PKT_TBL: "PKT_TBL",

  FIRM_NAME: "FIRM_NAME",
  DIVISION: "DIV",
  ZONE: "ZONE",
};
const LR_COLUMN_LABELS: Record<string, string> = {
  ZONE: "ZONE",
  DIVISION: "DIV",
  FIRM_NAME: "FIRM",
  STATIONARY_KAVACH_ID: "S_KAVACH_ID",
  MSG_TIME: "DATE_TIME",
  ONBOARD_ACTIVE_RADIO: "ACTIVE_RAD",
  SOURCE_LOCO_ID: "LOCO_ID",
  SOURCE_LOCO_VERSION: "LOCO_VER",
  ABS_LOCO_LOC: "LOCO_LOC",
  TRAIN_INT: "TRAIN_INT",
  TRAIN_LENGTH: "TRAIN_LEN",
  TRAIN_SPEED: "TRAIN_SPEED",
  MOVEMENT_DIR: "MVT_DIR",
  EMERGENCY_STATUS: "LOCO_EMR",
  LOCO_MODE: "LOCO_MODE",
  LAST_RFID_TAG: "RFID_TAG",
  TAG_DUP: "TAG_TYP",
  TAG_LINK_INFO: "TAG_LINK",
  TIN: "TIN",
  BRAKE_APPLIED: "BRAKE_STATUS",
  NEW_MA_REPLY: "NEW_MA_REPLY",
  LAST_REF_PROFILE_NUM: "LAST_REF_PROF",
  SIG_OV: "SIG_OV",
};
const AR_COLUMN_LABELS: Record<string, string> = {
  DIVISION: "DIV",
  FIRM_NAME: "FIRM_NAME",
  STATIONARY_KAVACH_ID: "S_KAVACH_ID",
  MSG_TIME: "MSG_TIME",
  ONBOARD_ACTIVE_RADIO: "ONBOARD_ACTIVE_RADIO",
  SOURCE_LOCO_ID: "SOURCE_LOCO_ID",
  SOURCE_LOCO_VERSION: "SOURCE_LOCO_VERSION",
  ABS_LOCO_LOC: "ABS_LOCO_LOC",
  TRAIN_INT: "TRAIN_INT",
  TRAIN_LENGTH: "TRAIN_LENGTH",
  TRAIN_SPEED: "TRAIN_SPEED",
  MOVEMENT_DIR: "MOVEMENT_DIR",

  EMERGENCY_STATUS: "EMERGENCY_STATUS",
  LOCO_MODE: "LOCO_MODE",
  LAST_RFID_TAG: "LAST_RFID_TAG",
  APPROACHING_STATION_ID: "APPROACHING_STATION_ID",
};

//Priority column

const AR_PRIORITY_COLUMNS = [
  "DIVISION",
  "FIRM_NAME",
  "STATIONARY_KAVACH_ID",
  "MSG_TIME",
  "ONBOARD_ACTIVE_RADIO",
  "SOURCE_LOCO_ID",
  "SOURCE_LOCO_VERSION",
  "ABS_LOCO_LOC",
  "TRAIN_INT",
  "TRAIN_LENGTH",
  "TRAIN_SPEED",
  "MOVEMENT_DIR",

  "EMERGENCY_STATUS",
  "LOCO_MODE",
  "LAST_RFID_TAG",
  "APPROACHING_STATION_ID",
];

const MA_PRIORITY_COLUMNS = [
  "ZONE",
  "DIVISION",
  "FIRM_NAME",
  "STATIONARY_KAVACH_ID",
  "DATE_TIME",
  "MSG_TIME",

  "STATION_ACTIVE_RADIO",
  "SOURCE_STN_ILC_IBS_ID",
  "DEST_LOCO_ID",

  "REF_PROF_ID",
  "LAST_REF_RFID",
  "PACKET_DATA_ID",
  "PKT_DIR",

  "DEST_LOCO_SOS",
  "TRAIN_SECTION_TYPE",
  "CUR_SIG_INFO",

  "REF_FRAME_NUM_TLM",
  "REF_OFFSET_INT_TLM",
  "CUR_SIG_ASP",
  "NEXT_SIG_ASPECT",
  "APPR_SIG_DIST",
  "TRN_LEN_INFO_STS",
  "TRN_LEN_INFO_TYPE",
  "AUTHORITY_TYPE",
  "AUTHORIZED_SPEED",
  "MA_W_R_T_SIG",
  "REQ_SHORTEN_MA",
  "NEW_MA",
  "TRN_LEN_INFO_STS",
  "TRN_LEN_INFO_TYPE",
  "NEXT_STN_COMM",
  "APPR_STN_ILC_IBS_ID",

  // remaining full json fields
  "CREATED_AT",
  "ID",
  "SOF",
  "MESSAGE_TYPE",
  "MESSAGE_LENGTH",
  "MESSAGE_SEQUENCE",

  "STATIONARY_KAVACH_ID",
  "SYSTEM_VERSION",

  "SOF_TX_BYTE1",
  "SOF_TX_BYTE2",

  "PACKET_DATA",
  "CRC",
  "NMS_IP_ID",
  "FIRM",
  "IP",

  "SYSTEM_VERSION_NAME",

  "PKT_TBL",
  "PKT",
  "PKT_TYPE",
  "PKT_LENGTH",

  "FRAME_NUM",

  "SOURCE_STN_ILC_IBS_VERSION",

  "DIST_PKT_START",

  "PADDING_BITS",
  "PACKET_DATA_TYPE",

  "LOCO_SPECIFIC_MAC_CODE",
  "PKT_CRC",

  "SUB_PKT_TBL",
  "SUB_PKT_TYPE",
  "SUB_PKT_LENGTH_MA",

  "FRAME_OFFSET",
];

const LR_PRIORITY_COLUMNS = [
  "ZONE",
  "DIVISION",
  "FIRM_NAME",
  "NMS_SYSTEM_ID",
  "MSG_TIME",
  "ONBOARD_ACTIVE_RADIO",
  "SOURCE_LOCO_ID",
  "SOURCE_LOCO_VERSION",
  "ABS_LOCO_LOC",
  "TRAIN_INT",
  "TRAIN_LENGTH",
  "TRAIN_SPEED",
  "EMERGENCY_STATUS",
  "LOCO_MODE",
  "LAST_RFID_TAG",
  "TAG_DUP",
  "TAG_LINK_INFO",
  "MOVEMENT_DIR",
  "TIN",
  "BRAKE_APPLIED",
  "NEW_MA_REPLY",
  "LAST_REF_PROFILE_NUM",
  "SIG_OV",
];

const AA_PRIORITY_COLUMNS = [
  "ZONE",
  "DIVISION",
  "FIRM_NAME",
  "DATE_TIME",
  "MSG_TIME",
  "STATIONARY_KAVACH_ID",
  "NMS_SYSTEM_ID",
  "SYSTEM_VERSION",
  "STATION_ACTIVE_RADIO",
  "SOURCE_STN_ILC_IBS_ID",
  "DEST_LOCO_ID",
  "ALLOTTED_UPLINK_FREQ",
  "ALLOTTED_DOWNLINK_FREQ",
];

const AE_PRIORITY_COLUMNS = [
  "ZONE",
  "DIVISION",
  "FIRM_NAME",
  "DATE_TIME",
  "STATIONARY_KAVACH_ID",
  "NMS_SYSTEM_ID",
  "SYSTEM_VERSION",
  "STATION_ACTIVE_RADIO",
  "GEN_SOS_CALL",
];

const SP1_PRIORITY_COLUMNS = [
  "ZONE",
  "DIVISION",
  "FIRM_NAME",
  "DATE_TIME",
  "MSG_TIME",
  "STATIONARY_KAVACH_ID",
  "NMS_SYSTEM_ID",
  "SYSTEM_VERSION",
  "ONBOARD_ACTIVE_RADIO",
  "NO_OF_MA_SECTION_COUNT",
  "ROUTE_ID",
];

const SP2_PRIORITY_COLUMNS = [
  "ZONE",
  "DIVISION",
  "FIRM_NAME",
  "DATE_TIME",
  "MSG_TIME",
  "STATIONARY_KAVACH_ID",
  "NMS_SYSTEM_ID",
  "SYSTEM_VERSION",
  "ONBOARD_ACTIVE_RADIO",
  "NO_OF_MA_SECTION_COUNT",
  "ROUTE_ID",
];

const DynamicReportPage: React.FC = () => {
  const { id, name } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const reportId = Number(id);

  const subPacketApiMap: Record<number, string> = {
    1: "MT_11_STATION_MOVEMENT_AUTHORITY",
    2: "MT_11_STATION_SPEED_PROF",
    3: "MT_11_STATION_GRADIENT_PROFILE",
    4: "MT_11_STATION_LC_GATE_PROFILE",
    5: "MT_11_STATION_TURNOUT_SPEED_PROFILE",
    6: "MT_11_STATION_TAG_LINKING_INFO",
    7: "MT_11_STATION_TRACK_CONDITION_DATA",
    8: "MT_11_STATION_TSR_PROFILE",
    11: "MT_11_ONBOARD_STATION",
    12: "MT_11_ACCESS_REQUEST",
    13: "MT_17",
    14: "MT_18",
  };

  const reportName = name ? name.replace(/-/g, " ").toUpperCase() : "REPORT";

  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [showColumnPanel, setShowColumnPanel] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const [masters, setMasters] = useState({
    divisions: [] as any[],
    firms: [] as any[],
  });
  const now = new Date();

  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const [filters, setFilters] = useState<FiltersType>({
    fromDate: thirtyMinAgo,
    toDate: now,
    division: location.state?.division || "ALL",
    firm: "ALL",
    search: "",
  });

  useEffect(() => {
    loadMasters();
  }, []);
  const loadMasters = async () => {
    try {
      const [divisionRes, firmRes] = await Promise.all([
        axiosInstance.get("/division/"),
        axiosInstance.get("/firm/"),
      ]);

      setMasters({
        divisions: divisionRes.data?.data || [],
        firms: firmRes.data?.data || [],
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (
    key: keyof typeof filters,
    value: string | Date | null,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const getColumnLabel = (col: string) => {
    if (reportName === "ACCESS AUTHORITY") {
      return AA_COLUMN_LABELS[col] || COMMON_COLUMN_LABELS[col] || col;
    }

    if (reportName === "ADDITIONAL EMERGENCY") {
      return AE_COLUMN_LABELS[col] || COMMON_COLUMN_LABELS[col] || col;
    }

    if (
      reportName === "SIGNAL POSITION" ||
      reportName === "POINT MACHINE POSITION"
    ) {
      return SP_COLUMN_LABELS[col] || COMMON_COLUMN_LABELS[col] || col;
    }
    if (reportName === "LOCO REGULAR") {
      return LR_COLUMN_LABELS[col] || COMMON_COLUMN_LABELS[col] || col;
    }
    if (reportName === "ACCESS REQUEST") {
      return AR_COLUMN_LABELS[col] || COMMON_COLUMN_LABELS[col] || col;
    }

    return MA_COLUMN_LABELS[col] || COMMON_COLUMN_LABELS[col] || col;
  };

  const getReport = async () => {
    setLoading(true);

    try {
      let params: any = {
        fromDate: formatDate(filters.fromDate),
        toDate: formatDate(filters.toDate),
        division: filters.division === "ALL" ? null : filters.division,
        firm: filters.firm === "ALL" ? null : filters.firm,
        page,
        size,
      };

      /* ---------------- REPORT TYPE MAPPING ---------------- */
      if (reportName === "SIGNAL POSITION") {
        params.msgTable = "MSG_TYPE_12";
      } else if (reportName === "POINT MACHINE POSITION") {
        params.msgTable = "MSG_TYPE_12";
      } else if (reportName === "ACCESS AUTHORITY") {
        params.msgTable = "MSG_TYPE_11_1";
        params.packetTable = "MT_11_ACCESS_AUTHORITY";
      } else if (reportName === "ADDITIONAL EMERGENCY") {
        params.msgTable = "MSG_TYPE_11_1";
        params.packetTable = "MT_11_ADDITONAL_EMERGENCY";
      } else if (reportId === 11 || reportId === 12) {
        params.msgTable = "MSG_TYPE_12";
        params.packetTable = subPacketApiMap[reportId];
      } else if (reportId === 13) {
        params.msgTable = "MSG_TYPE_17";
        // params.packetTable = subPacketApiMap[reportId];
      } else if (reportId === 14) {
        params.msgTable = "MSG_TYPE_18";
      } else {
        params.msgTable = "MSG_TYPE_11_1";
        params.packetTable = "MT_11_STATION_ONBOARD";
        params.subpacketTable =
          subPacketApiMap[reportId] || "MT_11_STATION_MOVEMENT_AUTHORITY";
      }

      /* ---------------- API CALL ---------------- */

      const res = await axiosInstance.get("/api/packet/filter", {
        params,
      });

      const rows = res.data?.data || [];

      setTotalPages(res.data?.totalPages || 0);
      setTotalRows(res.data?.total || 0);

      /* ---------------- COLUMN SELECTION ---------------- */

      let selectedColumns: string[] = [];

      if (rows.length > 0) {
        const cols = Object.keys(rows[0]);

        if (reportName === "ACCESS AUTHORITY") {
          selectedColumns = [
            ...AA_PRIORITY_COLUMNS.filter((c) => cols.includes(c)),
            ...AA_COLUMNS.filter(
              (c) => cols.includes(c) && !AA_PRIORITY_COLUMNS.includes(c),
            ),
          ];
        } else if (reportName === "ADDITIONAL EMERGENCY") {
          selectedColumns = [
            ...AE_PRIORITY_COLUMNS.filter((c) => cols.includes(c)),
            ...AE_COLUMNS.filter(
              (c) => cols.includes(c) && !AE_PRIORITY_COLUMNS.includes(c),
            ),
          ];
        } else if (reportName === "SIGNAL POSITION") {
          selectedColumns = [
            ...SP1_PRIORITY_COLUMNS.filter((c) => cols.includes(c)),
            ...SP1_COLUMNS.filter(
              (c) => cols.includes(c) && !SP1_PRIORITY_COLUMNS.includes(c),
            ),
          ];
        } else if (reportName === "POINT MACHINE POSITION") {
          selectedColumns = [
            ...SP2_PRIORITY_COLUMNS.filter((c) => cols.includes(c)),
            ...SP2_COLUMNS.filter(
              (c) => cols.includes(c) && !SP2_PRIORITY_COLUMNS.includes(c),
            ),
          ];
        } else if (reportName === "MOVEMENT AUTHORITY") {
          const priorityColumns: string[] = [
            "ZONE",
            "DIVISION",
            "FIRM_NAME",

            "NMS_SYSTEM_ID",
            "DATE_TIME",
            "MSG_TIME",

            "STATION_ACTIVE_RADIO",
            "SOURCE_STN_ILC_IBS_ID",
            "DEST_LOCO_ID",

            "REF_PROF_ID",
            "LAST_REF_RFID",
            "PACKET_DATA_ID",
            "PKT_DIR",

            "DEST_LOCO_SOS",
            "TRAIN_SECTION_TYPE",
            "CUR_SIG_INFO",

            "REF_FRAME_NUM_TLM",
            "REF_OFFSET_INT_TLM",
            "CUR_SIG_ASP",
            "NEXT_SIG_ASPECT",
            "APPR_SIG_DIST",
            "TRN_LEN_INFO_STS",
            "TRN_LEN_INFO_TYPE",
            "AUTHORITY_TYPE",
            "AUTHORIZED_SPEED",
            "MA_W_R_T_SIG",
            "REQ_SHORTEN_MA",
            "NEW_MA",
            "TRN_LEN_INFO_STS",
            "TRN_LEN_INFO_TYPE",
            "NEXT_STN_COMM",
            "APPR_STN_ILC_IBS_ID",

            // remaining full json fields
            "CREATED_AT",
            "ID",
            "SOF",
            "MESSAGE_TYPE",
            "MESSAGE_LENGTH",
            "MESSAGE_SEQUENCE",

            "STATIONARY_KAVACH_ID",
            "SYSTEM_VERSION",

            "SOF_TX_BYTE1",
            "SOF_TX_BYTE2",

            "PACKET_DATA",
            "CRC",
            "NMS_IP_ID",
            "FIRM",
            "IP",

            "SYSTEM_VERSION_NAME",

            "PKT_TBL",
            "PKT",
            "PKT_TYPE",
            "PKT_LENGTH",

            "FRAME_NUM",

            "SOURCE_STN_ILC_IBS_VERSION",

            "DIST_PKT_START",

            "PADDING_BITS",
            "PACKET_DATA_TYPE",

            "LOCO_SPECIFIC_MAC_CODE",
            "PKT_CRC",

            "SUB_PKT_TBL",
            "SUB_PKT_TYPE",
            "SUB_PKT_LENGTH_MA",

            "FRAME_OFFSET",
          ];

          selectedColumns = [
            ...priorityColumns.filter((c) => cols.includes(c)),
            ...cols.filter((c) => !priorityColumns.includes(c)),
          ];
        } else if (reportName === "LOCO REGULAR") {
          selectedColumns = [
            ...LR_PRIORITY_COLUMNS.filter((c) => cols.includes(c)),
            ...cols.filter((c) => !LR_PRIORITY_COLUMNS.includes(c)),
          ];
        } else if (reportName === "ACCESS REQUEST") {
          selectedColumns = [
            ...AR_PRIORITY_COLUMNS.filter((c) => cols.includes(c)),
            ...cols.filter((c) => !AR_PRIORITY_COLUMNS.includes(c)),
          ];
        } else {
          selectedColumns = cols;
        }
      }

      /* ---------------- APPLY COLUMNS ---------------- */

      setColumns(selectedColumns);
      let defaultVisibleColumns: string[] = [];

      if (reportName === "ACCESS AUTHORITY") {
        defaultVisibleColumns = AA_PRIORITY_COLUMNS.filter((col) =>
          selectedColumns.includes(col),
        );
      } else if (reportName === "ADDITIONAL EMERGENCY") {
        defaultVisibleColumns = AE_PRIORITY_COLUMNS.filter((col) =>
          selectedColumns.includes(col),
        );
      } else if (
        reportName === "SIGNAL POSITION" ||
        reportName === "POINT MACHINE POSITION"
      ) {
        defaultVisibleColumns = SP1_PRIORITY_COLUMNS.filter((col) =>
          selectedColumns.includes(col),
        );
      } else if (reportName.includes("LOCO")) {
        defaultVisibleColumns = LR_PRIORITY_COLUMNS.filter((col) =>
          selectedColumns.includes(col),
        );
      } else if (reportName === "MOVEMENT AUTHORITY") {
        defaultVisibleColumns = MA_PRIORITY_COLUMNS.filter((col) =>
          selectedColumns.includes(col),
        );
      } else if (reportName === "ACCESS REQUEST") {
        defaultVisibleColumns = AR_PRIORITY_COLUMNS.filter((col) =>
          selectedColumns.includes(col),
        );
      } else {
        defaultVisibleColumns = selectedColumns.filter(
          (col) => !HIDDEN_COLUMNS.includes(col),
        );
      }

      setVisibleColumns(defaultVisibleColumns);

      /* ---------------- NORMALIZE DATA ---------------- */

      const normalizedRows = rows.map((row: any) => {
        const newRow: any = {};

        selectedColumns.forEach((col) => {
          newRow[col] = row[col] ?? "-";
        });

        return newRow;
      });

      setTableData(normalizedRows);
    } catch (error) {
      console.log(error);
      setTableData([]);
      setColumns([]);
      setVisibleColumns([]);
    }

    setLoading(false);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    const hh = String(date.getHours()).padStart(2, "0");
    const mi = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  };

  const clearFilters = () => {
    setFilters({
      fromDate: null,
      toDate: null,
      division: "ALL",
      firm: "ALL",
      search: "",
    });

    setTableData([]);
    setColumns([]);
    setVisibleColumns([]);
  };

  const filteredData = useMemo(() => {
    if (!filters.search) return tableData;

    return tableData.filter((row) =>
      Object.values(row)
        .join(" ")
        .toLowerCase()
        .includes(filters.search.toLowerCase()),
    );
  }, [filters.search, tableData]);

  const toggleColumn = (col: string) => {
    if (visibleColumns.includes(col)) {
      setVisibleColumns(visibleColumns.filter((x) => x !== col));
    } else {
      setVisibleColumns([...visibleColumns, col]);
    }
  };
  useEffect(() => {
    getReport();
  }, [page]);

  const exportToExcel = () => {
    if (filteredData.length === 0) return;

    const exportRows = filteredData.map((row) => {
      const obj: any = {};

      visibleColumns.forEach((col) => {
        obj[getColumnLabel(col)] = row[col];
      });

      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Report");

    const range = XLSX.utils.decode_range(ws["!ref"] || "");

    /* Header Style */
    for (let c = 0; c <= range.e.c; c++) {
      const cell = XLSX.utils.encode_cell({ r: 0, c });

      if (ws[cell]) {
        ws[cell].s = {
          fill: {
            fgColor: { rgb: "1E40AF" },
          },
          font: {
            bold: true,
            color: { rgb: "FFFFFF" },
            sz: 12,
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
          },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };
      }
    }

    /* Body Rows Style */
    for (let r = 1; r <= range.e.r; r++) {
      for (let c = 0; c <= range.e.c; c++) {
        const cell = XLSX.utils.encode_cell({ r, c });

        if (ws[cell]) {
          ws[cell].s = {
            fill: {
              fgColor: {
                rgb: r % 2 === 0 ? "DBEAFE" : "FFFFFF",
              },
            },
            alignment: {
              horizontal: "left",
              vertical: "center",
            },
            border: {
              top: { style: "thin", color: { rgb: "D1D5DB" } },
              bottom: { style: "thin", color: { rgb: "D1D5DB" } },
              left: { style: "thin", color: { rgb: "D1D5DB" } },
              right: { style: "thin", color: { rgb: "D1D5DB" } },
            },
          };
        }
      }
    }

    /* Auto Width */
    ws["!cols"] = visibleColumns.map((col) => ({
      wch: Math.max(col.length + 5, 20),
    }));

    XLSX.writeFile(wb, `${reportName}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        {/* LEFT SIDE */}
        <div className="flex items-center gap-3">
          {/* 🔵 COLORFUL BACK BUTTON */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white
                 bg-gradient-to-r from-blue-600 to-indigo-600
                 hover:from-blue-700 hover:to-indigo-700 shadow-md transition"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          {/* 🟣 FILTER TOGGLE BUTTON */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow-md transition
        ${
          showFilters
            ? "bg-gradient-to-r from-purple-600 to-pink-600"
            : "bg-gradient-to-r from-gray-500 to-gray-600"
        }
      `}
          >
            <Filter size={15} />
            Filter
          </button>
        </div>
      </div>
      {/* Filter Section */}
      {showFilters && (
        <div className="bg-white mt-6 rounded-3xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-5">
            {/* LEFT → Title */}
            <div className="flex items-center gap-2">
              <Filter className="text-blue-600" />
              <h2 className="font-bold text-lg text-slate-700">
                Standard Filters
              </h2>
            </div>

            {/* RIGHT → CLOSE BUTTON */}
            <button
              onClick={() => setShowFilters(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full
               bg-red-100 text-red-600
               hover:bg-red-500 hover:text-white
               transition duration-200 shadow-sm"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <DatePickerBox
              label="From Date"
              value={filters.fromDate}
              onChange={(val) => handleChange("fromDate", val)}
            />

            <DatePickerBox
              label="To Date"
              value={filters.toDate}
              minDate={filters.fromDate}
              onChange={(val) => handleChange("toDate", val)}
            />

            {/* <SearchableSelect
              label="Division"
              options={masters.divisions}
              value={filters.division}
              onChange={(val) => handleChange("division", val)}
            /> */}

            <SearchableSelect
              label="Firm"
              options={masters.firms}
              value={filters.firm}
              onChange={(val) => handleChange("firm", val)}
            />

            <div className="flex items-end">
              <button
                onClick={getReport}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
              >
                <Search size={18} />
                Get Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Panel */}
      <div className="bg-white mt-6 rounded-3xl shadow-lg overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b flex items-center justify-between gap-4 flex-wrap">
          {/* LEFT → Search */}
          <div className="relative w-full md:w-80">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={16}
            />
            <input
              placeholder="Search in report..."
              value={filters.search}
              onChange={(e) => handleChange("search", e.target.value)}
              className="w-full border rounded-xl pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* CENTER → REPORT NAME */}
          <div className="flex-1 text-center">
            <h2 className="text-lg font-semibold text-blue-700">
              {reportName}
            </h2>
          </div>

          {/* RIGHT → Buttons */}
          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className="border px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-50"
            >
              <RefreshCcw size={16} />
              Clear
            </button>

            <button
              onClick={() => setShowColumnPanel(!showColumnPanel)}
              className="border px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-50"
            >
              <SlidersHorizontal size={16} />
              Columns
            </button>

            <button
              onClick={exportToExcel}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <FileSpreadsheet size={16} />
              Excel
            </button>
          </div>
        </div>

        {/* Column Panel */}
        {showColumnPanel && (
          <div className="p-4 border-b bg-slate-50 flex flex-wrap gap-3">
            {columns.map((col) => (
              <label
                key={col}
                className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col)}
                  onChange={() => toggleColumn(col)}
                />
                {getColumnLabel(col)}
              </label>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="overflow-auto max-h-[600px]">
          {loading ? (
            <div className="p-20 text-center text-slate-500">
              Loading report...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-20 text-center">
              <Database className="mx-auto text-slate-300 mb-4" size={50} />
              <h3 className="text-xl font-semibold text-slate-600">
                No Data Available
              </h3>
              <p className="text-slate-400 mt-1">
                Apply filters and click Get Report
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-blue-600 text-white z-10">
                <tr>
                  {visibleColumns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left whitespace-nowrap"
                    >
                      {getColumnLabel(col)}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredData.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-blue-50 transition">
                    {visibleColumns.map((col) => (
                      <td
                        key={col}
                        title={String(row[col])}
                        className={`px-4 py-3 whitespace-nowrap ${
                          ["PACKET_DATA", "PKT", "PACKET_DATA_ID"].includes(col)
                            ? "max-w-[200px] overflow-hidden text-ellipsis"
                            : ""
                        }`}
                      >
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-4 border-t bg-white flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm text-slate-600">
            Total Rows: <b>{totalRows}</b>
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 border rounded-xl disabled:opacity-50"
            >
              Prev
            </button>

            <span className="text-sm font-medium">
              Page {page + 1} of {totalPages}
            </span>

            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 border rounded-xl disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicReportPage;

/* Reusable Inputs */

const DatePickerBox = ({
  label,
  value,
  onChange,
  minDate,
}: {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date | null;
}) => (
  <div>
    <label className="text-sm font-medium text-slate-600 mb-1 block">
      {label}
    </label>

    <DatePicker
      selected={value}
      onChange={onChange}
      showTimeSelect
      minDate={minDate || undefined}
      dateFormat="dd-MM-yyyy hh:mm "
      placeholderText="Select date"
      popperPlacement="bottom-start"
      popperClassName="z-[9999]"
      calendarClassName="rounded-xl border shadow-2xl"
      className="w-full border rounded-xl px-5 py-3 text-sm"
    />
  </div>
);

const SearchableSelect = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: any[];
  value: any;
  onChange: (v: any) => void;
}) => {
  const dropdownOptions = [
    { value: "ALL", label: "ALL" },
    ...options.map((item) => ({
      value: item.id,
      label: item.name,
    })),
  ];

  return (
    <div>
      <label className="text-sm font-medium text-slate-600 mb-1 block">
        {label}
      </label>

      <Select
        options={dropdownOptions}
        value={dropdownOptions.find((x) => x.value === value)}
        onChange={(selected: any) => onChange(selected.value)}
        isSearchable
      />
    </div>
  );
};
