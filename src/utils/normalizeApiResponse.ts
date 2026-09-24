export const normalizeKeys = (obj: any) => {
  const newObj: any = {};

  Object.keys(obj).forEach((key) => {
    let normalizedKey = key;

    // If key contains "_" it is snake case (likely MSG_TYPE)
    if (key.includes("_")) {
      normalizedKey = key
        .toLowerCase()
        .replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    }

    newObj[normalizedKey] = obj[key];
  });

  return newObj;
};

export const normalizeArray = (data: any[]) => {
  return Array.isArray(data) ? data.map(normalizeKeys) : [];
};

