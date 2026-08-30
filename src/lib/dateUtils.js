export function formatWib(isoString, withTime = true) {
  const date = new Date(isoString);

  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  if (!withTime) return dateFormatter.format(date);

  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  });

  return `${dateFormatter.format(date)}, ${timeFormatter.format(date)} WIB`;
}
