export const flattenPacket = (item: any) => {
  const nms = item.nmsIp || item.nmsip;

  return {
    ...item,
    nmsIpAddress: nms?.ip ?? "",
    divisionName: nms?.division?.name ?? "",
    zoneCode: nms?.division?.zone?.code ?? "",
    firmName: nms?.firm?.name ?? "",
  };
};