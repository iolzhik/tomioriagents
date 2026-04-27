export const KAZAKHSTAN_EVENTS = [
  { name: "New Year", date: "01-01", theme: "Gifting luxury watches/diamonds" },
  { name: "Orthodox Christmas", date: "01-07", theme: "Family gifts" },
  { name: "Valentine's Day", date: "02-14", theme: "Engagement rings, Hearts" },
  { name: "International Women's Day", date: "03-08", theme: "Earrings, Necklaces for women" },
  { name: "Nauryz Holiday", date: "03-21", theme: "Traditional gold motifs, Heritage collection" },
  { name: "Oraza Ait", date: "dynamic", theme: "Gifting loved ones" },
  { name: "Astana Day", date: "07-06", theme: "City pride, ТРЦ \"Керуен\" showroom tour" },
  { name: "Independence Day", date: "12-16", theme: "High-end luxury collection" },
  { name: "Wedding Season (Start)", date: "05-01", theme: "Bespoke engagement rings, GIA diamonds" },
  { name: "Prom Season", date: "06-05", theme: "Minimalist jewelry for graduates" }
];

export function getUpcomingEvents() {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  
  return KAZAKHSTAN_EVENTS.filter(e => {
    if (e.date === "dynamic") return true;
    const [m, d] = e.date.split('-').map(Number);
    return m === currentMonth || (m === currentMonth + 1);
  });
}
