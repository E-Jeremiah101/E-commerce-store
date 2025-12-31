import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFilePdf } from "react-icons/fa";
import { motion } from "framer-motion";

const ExportTransactionPdf = ({ data, filters = {}, total = 0 }) => {
  const [exporting, setExporting] = useState(false);

  const generatePDF = () => {
    try {
      setExporting(true);

      // Check if data is valid
      if (!data || data.length === 0) {
        alert("No data to export");
        setExporting(false);
        return;
      }

      // Create PDF in LANDSCAPE mode with proper dimensions
      const pdf = new jsPDF("l", "pt", "a4"); // 'l' for landscape, 'pt' units

      // Get page dimensions in points (1pt = 1/72 inch)
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      console.log("Page dimensions:", pageWidth, "x", pageHeight, "pt"); // Should be ~842 x 595 for A4 landscape

      // Set initial Y position with more margin
      let yPos = 60;

      // Add title
      pdf.setFontSize(24);
      pdf.setTextColor(40, 40, 40);
      pdf.text("TRANSACTIONS REPORT", pageWidth / 2, yPos, { align: "center" });
      yPos += 40;

      // Add generation date
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        40,
        yPos
      );
      yPos += 25;

      // Add filters information if any
      const hasFilters =
        filters &&
        (filters.startDate ||
          filters.endDate ||
          filters.searchQuery ||
          filters.sortOrder);

      if (hasFilters) {
        pdf.text("Filters Applied:", 40, yPos);
        yPos += 20;

        if (filters.startDate) {
          pdf.text(
            `Start Date: ${new Date(filters.startDate).toLocaleDateString()}`,
            40,
            yPos
          );
          yPos += 15;
        }
        if (filters.endDate) {
          pdf.text(
            `End Date: ${new Date(filters.endDate).toLocaleDateString()}`,
            40,
            yPos
          );
          yPos += 15;
        }
        if (filters.searchQuery) {
          pdf.text(`Search: ${filters.searchQuery}`, 40, yPos);
          yPos += 15;
        }
        if (filters.sortOrder) {
          pdf.text(
            `Sort Order: ${
              filters.sortOrder === "desc" ? "Newest First" : "Oldest First"
            }`,
            40,
            yPos
          );
          yPos += 15;
        }
      }

      // Add summary section
      pdf.setFontSize(12);
      pdf.setTextColor(40, 40, 40);
      yPos += 10;

      // Calculate totals
      const totalAmount = data.reduce((sum, tx) => {
        const amount = parseFloat(tx.amount) || 0;
        return tx.type === "refund" ? sum - amount : sum + amount;
      }, 0);

      const payments = data.filter((tx) => tx.type === "payment");
      const refunds = data.filter((tx) => tx.type === "refund");

      // Add summary text
      pdf.text(`Total Transactions: ${total}`, 40, yPos);
      pdf.text(`Payments: ${payments.length}`, 200, yPos);
      pdf.text(`Refunds: ${refunds.length}`, 350, yPos);
      pdf.text(`Net Amount: ₦${totalAmount.toLocaleString()}`, 500, yPos);
      yPos += 40;

      // Prepare data for table - ensure all values are strings
      const tableData = data.map((tx, index) => [
        (index + 1).toString(), // Serial number
        tx.transactionId
          ? tx.transactionId.substring(0, 12) +
            (tx.transactionId.length > 12 ? "..." : "")
          : "N/A",
        tx.customer?.name
          ? tx.customer.name.substring(0, 15) +
            (tx.customer.name.length > 15 ? "..." : "")
          : "N/A",
        `${tx.type === "refund" ? "-" : ""}₦${(
          parseFloat(tx.amount) || 0
        ).toLocaleString()}`,
        tx.paymentMethod
          ? tx.paymentMethod.replace(/_/g, " ").substring(0, 10)
          : "N/A",
        tx.type ? tx.type.charAt(0).toUpperCase() + tx.type.slice(1) : "N/A",
        tx.status
          ? tx.status.charAt(0).toUpperCase() + tx.status.slice(1)
          : "N/A",
        tx.date ? new Date(tx.date).toLocaleDateString() : "N/A",
      ]);

      // Define table headers
      const tableHeaders = [
        "#",
        "Transaction ID",
        "Customer",
        "Amount",
        "Method",
        "Type",
        "Status",
        "Date",
      ];

      // Calculate table width 
      const tableWidth = pageWidth - 80; // 40px margin on each side
      console.log("Table width:", tableWidth, "pt");

      // Configure column widths as percentages of table width
      const colWidths = {
        0: 25, // # - 25pt
        1: 100, // Transaction ID - 100pt
        2: 80, // Customer - 80pt
        3: 70, // Amount - 70pt
        4: 60, // Method - 60pt
        5: 50, // Type - 50pt
        6: 60, // Status - 60pt
        7: 70, // Date - 70pt
      };

      // Total width should be less than tableWidth
      const totalColWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);
      console.log("Total column width:", totalColWidth, "pt");

      if (totalColWidth > tableWidth) {
        // Scale down proportionally if needed
        const scaleFactor = tableWidth / totalColWidth;
        Object.keys(colWidths).forEach((key) => {
          colWidths[key] = Math.floor(colWidths[key] * scaleFactor);
        });
      }

      // Generate table using autoTable
      autoTable(pdf, {
        head: [tableHeaders],
        body: tableData,
        startY: yPos,
        margin: { left: 40, right: 40 },
        tableWidth: tableWidth,
        styles: {
          fontSize: 8, // Smaller font
          cellPadding: 3, // Less padding
          overflow: "linebreak",
          cellWidth: "wrap",
        },
        headStyles: {
          fillColor: [59, 130, 246], // Blue header
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          fontSize: 9,
        },
        bodyStyles: {
          textColor: [75, 85, 99],
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        columnStyles: colWidths,
        didParseCell: function (data) {
          // Color code the amount column (index 3)
          if (data.column.index === 3) {
            const cellText = data.cell.text[0];
            if (cellText && cellText.includes("-")) {
              data.cell.styles.textColor = [220, 38, 38]; // Red for refunds
              data.cell.styles.fontStyle = "bold";
            } else {
              data.cell.styles.textColor = [5, 150, 105]; // Green for payments
            }
          }
          // Color code the type column (index 5)
          if (data.column.index === 5) {
            const cellText = data.cell.text[0];
            if (cellText && cellText.toLowerCase() === "refund") {
              data.cell.styles.textColor = [220, 38, 38]; // Red
              data.cell.styles.fontStyle = "bold";
            } else if (cellText && cellText.toLowerCase() === "payment") {
              data.cell.styles.textColor = [5, 150, 105]; // Green
            }
          }
          // Color code the status column (index 6)
          if (data.column.index === 6) {
            const cellText = data.cell.text[0];
            if (cellText) {
              const status = cellText.toLowerCase();
              if (
                status === "success" ||
                status === "processed" ||
                status === "approved"
              ) {
                data.cell.styles.textColor = [5, 150, 105]; // Green
              } else if (status === "pending") {
                data.cell.styles.textColor = [217, 119, 6]; // Yellow/Orange
                data.cell.styles.fontStyle = "bold";
              } else {
                data.cell.styles.textColor = [220, 38, 38]; // Red
                data.cell.styles.fontStyle = "bold";
              }
            }
          }
        },
        willDrawCell: function (data) {
          // Add cell borders
          data.cell.styles.lineWidth = 0.1;
          data.cell.styles.lineColor = [200, 200, 200];
        },
        didDrawPage: function (data) {
          // Add footer
          const pageCount = pdf.internal.getNumberOfPages();
          const currentPage = data.pageNumber;

          pdf.setFontSize(8);
          pdf.setTextColor(150, 150, 150);

          // Left footer
          pdf.text(
            `Exported on ${new Date().toLocaleDateString()}`,
            40,
            pageHeight - 20
          );

          // Right footer
          pdf.text(
            `Page ${currentPage} of ${pageCount}`,
            pageWidth - 60,
            pageHeight - 20,
            { align: "right" }
          );

          // Center footer
          pdf.text("Transactions Report", pageWidth / 2, pageHeight - 20, {
            align: "center",
          });
        },
      });

      // Save the PDF
      const fileName = `transactions-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.button
      onClick={generatePDF}
      disabled={exporting || !data || data.length === 0}
      className="flex items-center gap-2 px-4 py-2 text-green-700 rounded-lg hover:bg-green-200  bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <FaFilePdf className={exporting ? "animate-pulse" : ""} />
      {exporting ? "Generating PDF..." : "Export PDF"}
    </motion.button>
  );
};

export default ExportTransactionPdf;
