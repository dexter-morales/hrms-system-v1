import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { formatDistanceToNow } from "date-fns";

export const handleExport = (
    data,
    format,
    headers = ["Log Name", "Description", "Causer", "Date", "Changes"],
    filename = "activity_logs"
) => {
    const exportData = data.map((log) => ({
        "Log Name": log.log_name || "-",
        Description: log.description || "-",
        Causer: log.causer?.name || "System",
        Date: formatDistanceToNow(new Date(log.created_at), {
            addSuffix: true,
        }),
        Changes: log.properties?.attributes
            ? Object.entries(log.properties.attributes)
                  .map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`)
                  .join(", ")
            : log.properties?.old
            ? Object.entries(log.properties.old)
                  .map(
                      ([key, value]) =>
                          `${key.replace(/_/g, " ")}: ${
                              value?.toString() ?? "—"
                          }`
                  )
                  .join(", ")
            : "No changes recorded",
    }));

    if (format === "pdf") {
        const doc = new jsPDF();
        doc.text(`${filename} Export`, 10, 10);
        doc.autoTable({
            head: [headers],
            body: exportData.map((row) => [
                row["Log Name"],
                row.Description,
                row.Causer,
                row.Date,
                row.Changes,
            ]),
        });
        doc.save(`${filename}.pdf`);
    } else if (format === "excel") {
        const worksheet = XLSX.utils.json_to_sheet(exportData, {
            header: headers,
        });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "ActivityLogs");
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    }
};
