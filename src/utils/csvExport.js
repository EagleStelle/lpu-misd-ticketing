const CSV_MIME_TYPE = "text/csv;charset=utf-8;";

export function escapeCsv(value) {
  const next = String(value ?? "");
  if (/[",\r\n]/.test(next)) {
    return `"${next.replaceAll('"', '""')}"`;
  }
  return next;
}

export function buildCsv(headers, rows) {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n");
}

export function downloadCsv(filename, headers, rows) {
  const csv = buildCsv(headers, rows);
  const blob = new Blob(["\uFEFF", csv], { type: CSV_MIME_TYPE });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
