/** One hue per itinerary day, cycling; each is dark enough to carry white numerals. */
const DAY_COLORS = ["#24533a", "#ab4d26", "#3a6073", "#8a5a2b", "#5b4b8a", "#2d5b8c", "#6b6252"];

export function dayColor(day: number) {
  return DAY_COLORS[day % DAY_COLORS.length];
}
