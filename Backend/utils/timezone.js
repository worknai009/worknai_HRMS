// Backend/utils/timezone.js

/**
 * Returns date parts (year, month, day, hour, minute, second) in given IANA timezone.
 * No extra dependency (moment/luxon) to keep server light.
 */
function getPartsInTZ(date = new Date(), timeZone = 'Asia/Kolkata') {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = dtf.formatToParts(date);
  const obj = {};
  for (const p of parts) {
    if (p.type !== 'literal') obj[p.type] = p.value;
  }

  return {
    year: Number(obj.year),
    month: Number(obj.month),
    day: Number(obj.day),
    hour: Number(obj.hour),
    minute: Number(obj.minute),
    second: Number(obj.second)
  };
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * YYYY-MM-DD in timezone (company timezone safe)
 */
function getDateStringInTZ(timeZone = 'Asia/Kolkata', date = new Date()) {
  const p = getPartsInTZ(date, timeZone);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

/**
 * Get current month start/end (YYYY-MM-DD) in timezone
 * Used in stats query: { $gte: start, $lte: end }
 */
function getMonthRangeStringsInTZ(timeZone = 'Asia/Kolkata', date = new Date()) {
  const p = getPartsInTZ(date, timeZone);
  const start = `${p.year}-${pad2(p.month)}-01`;

  // last day of month
  // month is 1-12, for Date.UTC last day use (month, 0)
  const lastDay = new Date(Date.UTC(p.year, p.month, 0)).getUTCDate();
  const end = `${p.year}-${pad2(p.month)}-${pad2(lastDay)}`;

  return { start, end };
}

/**
 * Convert "YYYY-MM-DD" + "HH:mm" interpreted in a timezone to a real JS Date (UTC instant).
 * DST aware, no external libs.
 *
 * Example: dateFromYMDHMInTZ("2026-01-12", "09:30", "Asia/Kolkata")
 */
function dateFromYMDHMInTZ(ymd, hm, timeZone = 'Asia/Kolkata') {
  if (!ymd || !hm) return null;
  const [Y, M, D] = String(ymd).split('-').map(Number);
  const [h, m] = String(hm).split(':').map(Number);

  if (![Y, M, D, h, m].every(Number.isFinite)) return null;

  // initial guess as if UTC
  let guess = new Date(Date.UTC(Y, M - 1, D, h, m, 0));

  // Correct guess so that its TZ parts match desired local time
  // 2 passes are enough even for DST transitions.
  for (let i = 0; i < 2; i++) {
    const p = getPartsInTZ(guess, timeZone);
    const gotY = p.year, gotM = p.month, gotD = p.day, gotH = p.hour, gotMin = p.minute;

    const diffMinutes =
      ((Y - gotY) * 525600) +
      ((M - gotM) * 43200) +
      ((D - gotD) * 1440) +
      ((h - gotH) * 60) +
      (m - gotMin);

    if (diffMinutes === 0) break;
    guess = new Date(guess.getTime() + diffMinutes * 60000);
  }

  return guess;
}

module.exports = {
  getPartsInTZ,
  getDateStringInTZ,
  getMonthRangeStringsInTZ,
  dateFromYMDHMInTZ
};
