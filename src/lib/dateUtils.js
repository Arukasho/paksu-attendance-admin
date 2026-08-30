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

// Converts a UTC ISO string (from the backend) into the "YYYY-MM-DDTHH:mm"
// format a <input type="datetime-local"> needs, representing WIB wall-clock time.
export function toWibInputValue(isoString) {
  const date = new Date(isoString);
  const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${wib.getUTCFullYear()}-${pad(wib.getUTCMonth() + 1)}-${pad(wib.getUTCDate())}T${pad(wib.getUTCHours())}:${pad(wib.getUTCMinutes())}`;
}

// Converts a datetime-local input's raw value (interpreted as WIB wall-clock
// time) back into a correct UTC ISO string to send to the backend.
export function fromWibInputValue(inputValue) {
  const [datePart, timePart] = inputValue.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const utcMs =
    Date.UTC(year, month - 1, day, hour, minute) - 7 * 60 * 60 * 1000;
  return new Date(utcMs).toISOString();
}
