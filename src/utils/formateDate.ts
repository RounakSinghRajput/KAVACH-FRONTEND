// export const formatDate = (value?: string) => {
//   if (!value) return "-";
//   return new Date(value).toLocaleString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// };



export const formatDate = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  return `${day}-${month}-${year}`;
};
