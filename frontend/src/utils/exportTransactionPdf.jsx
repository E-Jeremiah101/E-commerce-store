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

      if (!data || data.length === 0) {
        alert("No data to export");
        setExporting(false);
        return;
      }

      const pdf = new jsPDF("l", "pt", "a4"); 

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      console.log("Page dimensions:", pageWidth, "x", pageHeight, "pt"); 

      let yPos = 60;

      pdf.setFontSize(24);
      pdf.setTextColor(40, 40, 40);
      pdf.text("TRANSACTIONS REPORT", pageWidth / 2, yPos, { align: "center" });
      yPos += 40;

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        40,
        yPos
      );
      yPos += 25;

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

      pdf.setFontSize(12);
      pdf.setTextColor(40, 40, 40);
      yPos += 10;

      const totalAmount = data.reduce((sum, tx) => {
        const amount = parseFloat(tx.amount) || 0;
        return tx.type === "refund" ? sum - amount : sum + amount;
      }, 0);

      const payments = data.filter((tx) => tx.type === "payment");
      const refunds = data.filter((tx) => tx.type === "refund");

      pdf.text(`Total Transactions: ${total}`, 40, yPos);
      pdf.text(`Payments: ${payments.length}`, 200, yPos);
      pdf.text(`Refunds: ${refunds.length}`, 350, yPos);
      pdf.text(`Net Amount: ₦${totalAmount.toLocaleString()}`, 500, yPos);
      yPos += 40;

      const tableData = data.map((tx, index) => [
        (index + 1).toString(), 
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

      const tableWidth = pageWidth - 80; 
      console.log("Table width:", tableWidth, "pt");

      const colWidths = {
        0: 25, 
        1: 100, 
        2: 80,
        3: 70, 
        4: 60, 
        5: 50, 
        6: 60, 
        7: 70,
      };

      const totalColWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);
      console.log("Total column width:", totalColWidth, "pt");

      if (totalColWidth > tableWidth) {
  
        const scaleFactor = tableWidth / totalColWidth;
        Object.keys(colWidths).forEach((key) => {
          colWidths[key] = Math.floor(colWidths[key] * scaleFactor);
        });
      }

      autoTable(pdf, {
        head: [tableHeaders],
        body: tableData,
        startY: yPos,
        margin: { left: 40, right: 40 },
        tableWidth: tableWidth,
        styles: {
          fontSize: 8, 
          cellPadding: 3,
          overflow: "linebreak",
          cellWidth: "wrap",
        },
        headStyles: {
          fillColor: [59, 130, 246], 
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
      
          if (data.column.index === 3) {
            const cellText = data.cell.text[0];
            if (cellText && cellText.includes("-")) {
              data.cell.styles.textColor = [220, 38, 38]; 
              data.cell.styles.fontStyle = "bold";
            } else {
              data.cell.styles.textColor = [5, 150, 105]; 
            }
          }
         
          if (data.column.index === 5) {
            const cellText = data.cell.text[0];
            if (cellText && cellText.toLowerCase() === "refund") {
              data.cell.styles.textColor = [220, 38, 38]; // Red
              data.cell.styles.fontStyle = "bold";
            } else if (cellText && cellText.toLowerCase() === "payment") {
              data.cell.styles.textColor = [5, 150, 105]; // Green
            }
          }
       
          if (data.column.index === 6) {
            const cellText = data.cell.text[0];
            if (cellText) {
              const status = cellText.toLowerCase();
              if (
                status === "success" ||
                status === "processed" ||
                status === "approved"
              ) {
                data.cell.styles.textColor = [5, 150, 105]; 
              } else if (status === "pending") {
                data.cell.styles.textColor = [217, 119, 6];
                data.cell.styles.fontStyle = "bold";
              } else {
                data.cell.styles.textColor = [220, 38, 38];
                data.cell.styles.fontStyle = "bold";
              }
            }
          }
        },
        willDrawCell: function (data) {
    
          data.cell.styles.lineWidth = 0.1;
          data.cell.styles.lineColor = [200, 200, 200];
        },
        didDrawPage: function (data) {
        
          const pageCount = pdf.internal.getNumberOfPages();
          const currentPage = data.pageNumber;

          pdf.setFontSize(8);
          pdf.setTextColor(150, 150, 150);

          pdf.text(
            `Exported on ${new Date().toLocaleDateString()}`,
            40,
            pageHeight - 20
          );

          pdf.text(
            `Page ${currentPage} of ${pageCount}`,
            pageWidth - 60,
            pageHeight - 20,
            { align: "right" }
          );

          pdf.text("Transactions Report", pageWidth / 2, pageHeight - 20, {
            align: "center",
          });
        },
      });

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
