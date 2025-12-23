export const todayYMD = () => new Date().toISOString().slice(0,10);
export const addDaysYMD = (startYmd, days) => {
  const d = new Date(startYmd + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + Number(days));
  return d.toISOString().slice(0,10);
};
