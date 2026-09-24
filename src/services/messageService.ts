import { axiosInstance } from "./axios";

export const getDecodedMessages = async (type: string, filters?: any) => {
  let url = "";

  if (type === "11") {
    url = "/msgType/division";
  // } else if (type === "17") {
  //   url = "/msg-type-17/getJoin";
  } else {
    url = `/msg-type-${type}/paginated`;
  }

  const res = await axiosInstance.get(url, {
    params: {
      divisionName: filters?.divisionName || undefined,
      firmName: filters?.firmName || undefined,
      fromDate: filters?.fromDate || undefined,
      toDate: filters?.toDate || undefined,
      page: filters?.page || 0,
      size: filters?.size || 10,
    },
  });

  return res.data?.data || res.data;
};
export const getExceptionalMessages = async (filters?: any) => {
  const res = await axiosInstance.get(
    `/msg-type-exceptional/paginated`,
    {
      params: {
        division: filters?.divisionName || undefined, 
        firmName: filters?.firmName || undefined,
        fromDate: filters?.fromDate || undefined,
        toDate: filters?.toDate || undefined,
        page: filters?.page || 0,
        size: filters?.size || 10,
      },
    }
  );

  return res.data?.data || res.data;
};