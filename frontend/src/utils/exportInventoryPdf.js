import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Export inventory data as PDF from frontend
 * @param {Array} inventoryData - Array of inventory items
 * @param {Object} summary - Summary statistics
 * @param {string} type - Export type ('detailed' or 'summary')
 */
export const exportInventoryPDF = (
  inventoryData,
  summary = {},
  type = "detailed"
) => {
  try {
    // Create PDF in portrait mode with smaller margins
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    // Set document properties
    doc.setProperties({
      title: "Inventory Report",
      subject: "Inventory Management System",
      author: "Admin",
      keywords: "inventory, stock, report",
      creator: "Inventory Management System",
    });

    // ========== COVER PAGE ==========
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("INVENTORY REPORT", 105, 40, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text("Comprehensive Stock Analysis", 105, 50, { align: "center" });

    // Add date
    doc.setFontSize(10);
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(`Generated: ${currentDate}`, 105, 60, { align: "center" });

    // Add summary box
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(30, 75, 150, 70, 3, 3, "F");

    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text("SUMMARY", 105, 85, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);

    const summaryData = [
      {
        label: "Total Products",
        value: summary.totalProducts || inventoryData.length || 0,
      },
      {
        label: "Total Value",
        value: `₦${(summary.totalValue || 0).toLocaleString()}`,
      },
      { label: "Low Stock Items", value: summary.lowStockCount || 0 },
      { label: "Out of Stock", value: summary.outOfStockCount || 0 },
    ];

    summaryData.forEach((item, index) => {
      doc.text(`${item.label}:`, 40, 98 + index * 10);
      doc.setFont("helvetica", "bold");
      doc.text(item.value.toString(), 100, 98 + index * 10);
      doc.setFont("helvetica", "normal");
    });

    // Add decorative line
    doc.setDrawColor(200, 200, 200);
    doc.line(30, 155, 180, 155);

    // Add page number
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Page 1 of 1", 105, 280, { align: "center" });

    // ========== DETAILED INVENTORY PAGE ==========
    if (type === "detailed" && inventoryData.length > 0) {
      doc.addPage();

      // Page header
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text("DETAILED INVENTORY", 105, 15, { align: "center" });

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Showing ${inventoryData.length} items`, 105, 22, {
        align: "center",
      });

      // Prepare table data with proper formatting
      const tableData = inventoryData.map((item, index) => [
        (index + 1).toString(),
        item.name || item.product || "N/A",
        item.category || "Uncategorized",
        formatVariant(item),
        (item.countInStock || item.stock || 0).toString(),
        formatCurrency(item.price || 0),
        formatCurrency(
          (item.countInStock || item.stock || 0) * (item.price || 0)
        ),
      ]);

      // Create table with autoTable - FIXED COLUMN WIDTHS
      autoTable(doc, {
        head: [
          ["#", "Product", "Category", "Variant", "Stock", "Price", "Value"],
        ],
        body: tableData,
        startY: 30,
        margin: { left: 10, right: 10 }, // Smaller margins
        tableWidth: 190, // Total table width (A4 width is 210mm, minus margins)
        styles: {
          fontSize: 8,
          cellPadding: 2, // Reduced padding
          overflow: "linebreak",
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [41, 128, 185], // Blue header
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
          cellPadding: 3,
        },
        bodyStyles: {
          textColor: [50, 50, 50],
          fontSize: 8,
          cellPadding: 2,
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
        // FIXED: Proper column widths that fit in A4
        columnStyles: {
          0: { cellWidth: 10, halign: "center" }, // # (10mm)
          1: { cellWidth: 40 }, // Product (40mm)
          2: { cellWidth: 30 }, // Category (30mm)
          3: { cellWidth: 40 }, // Variant (40mm)
          4: { cellWidth: 20, halign: "center" }, // Stock (20mm)
          5: { cellWidth: 25, halign: "right" }, // Price (25mm)
          6: { cellWidth: 25, halign: "right" }, // Value (25mm)
        },
        // Total width: 10 + 40 + 30 + 40 + 20 + 25 + 25 = 190mm (fits in 210mm A4 with margins)
        didParseCell: function (data) {
          // Color code stock column
          if (data.column.index === 4) {
            const stock = parseInt(data.cell.text[0]) || 0;
            if (stock === 0) {
              data.cell.styles.textColor = [231, 76, 60]; // Red
              data.cell.styles.fontStyle = "bold";
            } else if (stock <= 5) {
              data.cell.styles.textColor = [230, 126, 34]; // Orange
              data.cell.styles.fontStyle = "bold";
            } else {
              data.cell.styles.textColor = [39, 174, 96]; // Green
            }
          }

          // Truncate long text
          if (
            [1, 3].includes(data.column.index) &&
            data.cell.text[0] &&
            data.cell.text[0].length > 30
          ) {
            data.cell.text[0] = data.cell.text[0].substring(0, 27) + "...";
          }
        },
        didDrawPage: function (data) {
          // Footer with page numbers
          const pageCount = doc.internal.getNumberOfPages();
          const currentPage = data.pageNumber;

          doc.setFontSize(7);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Page ${currentPage} of ${pageCount}`,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          );

          doc.text(
            `Inventory Report • ${currentDate}`,
            doc.internal.pageSize.width - data.settings.margin.right,
            doc.internal.pageSize.height - 10,
            { align: "right" }
          );
        },
      });
    }

    // Save the PDF
    doc.save(`inventory-report-${new Date().toISOString().split("T")[0]}.pdf`);

    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF: " + error.message);
  }
};

/**
 * Export simple inventory table as PDF (most reliable)
 */
export const exportSimpleInventoryPDF = (inventoryData) => {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Title
    doc.setFontSize(16);
    doc.text("Inventory Report", 14, 15);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

    // Prepare table data
    const tableData = inventoryData.map((item, index) => [
      (index + 1).toString(),
      truncateText(item.name || item.product || "N/A", 25),
      truncateText(item.category || "Uncategorized", 15),
      truncateText(formatVariant(item), 20),
      (item.countInStock || item.stock || 0).toString(),
      formatCurrency(item.price || 0),
      formatCurrency(
        (item.countInStock || item.stock || 0) * (item.price || 0)
      ),
    ]);

    // Create simple table with minimal styling
    autoTable(doc, {
      head: [
        ["#", "Product", "Category", "Variant", "Stock", "Price", "Value"],
      ],
      body: tableData,
      startY: 30,
      margin: { left: 10, right: 10 },
      tableWidth: 190,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
      },
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 3,
      },
      // FIXED: Column widths that definitely fit
      columnStyles: {
        0: { cellWidth: 8, halign: "center" }, // # (8mm)
        1: { cellWidth: 45 }, // Product (45mm)
        2: { cellWidth: 25 }, // Category (25mm)
        3: { cellWidth: 35 }, // Variant (35mm)
        4: { cellWidth: 15, halign: "center" }, // Stock (15mm)
        5: { cellWidth: 25, halign: "right" }, // Price (25mm)
        6: { cellWidth: 37, halign: "right" }, // Value (37mm)
      },
      // Total: 8 + 45 + 25 + 35 + 15 + 25 + 37 = 190mm (safe)
      didParseCell: function (data) {
        // Color code stock
        if (data.column.index === 4) {
          const stock = parseInt(data.cell.text[0]) || 0;
          if (stock === 0) {
            data.cell.styles.textColor = [255, 0, 0];
            data.cell.styles.fontStyle = "bold";
          } else if (stock <= 5) {
            data.cell.styles.textColor = [255, 165, 0];
          }
        }

        // Right align for price/value columns
        if ([5, 6].includes(data.column.index)) {
          data.cell.styles.halign = "right";
        }
      },
      theme: "grid",
    });

    // Add footer to all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }

    doc.save(`inventory-${Date.now()}.pdf`);
    return true;
  } catch (error) {
    console.error("Error generating simple PDF:", error);
    throw error;
  }
};

/**
 * Quick export - one function call
 */
export const quickExportInventory = (stockLevels) => {
  try {
    // Flatten variants data
    const exportData = stockLevels.flatMap((product) => {
      if (!product.variants || product.variants.length === 0) {
        return [
          {
            product: product.name,
            category: product.category,
            variant: "Default",
            stock: product.totalStock || 0,
            price: product.price || 0,
          },
        ];
      }

      return product.variants.map((variant) => ({
        product: product.name,
        category: product.category,
        color: variant.color,
        size: variant.size,
        stock: variant.countInStock || 0,
        price: variant.price || product.price || 0,
      }));
    });

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Simple header
    doc.setFontSize(14);
    doc.text("Inventory Report", 14, 15);
    doc.setFontSize(9);
    doc.text(new Date().toLocaleDateString(), 14, 22);

    // Prepare table
    const tableData = exportData.map((item, index) => [
      (index + 1).toString(),
      truncateText(item.product, 30),
      truncateText(item.category, 15),
      truncateText(formatVariant(item), 20),
      item.stock.toString(),
      formatCurrency(item.price),
      formatCurrency(item.stock * item.price),
    ]);

    autoTable(doc, {
      head: [
        ["#", "Product", "Category", "Variant", "Stock", "Price", "Value"],
      ],
      body: tableData,
      startY: 30,
      margin: { left: 10, right: 10 },
      tableWidth: 190,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "ellipsize",
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 8,
      },
      // SAFE column widths
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 50 },
        2: { cellWidth: 25 },
        3: { cellWidth: 35 },
        4: { cellWidth: 15, halign: "center" },
        5: { cellWidth: 25, halign: "right" },
        6: { cellWidth: 32, halign: "right" },
      },
      // Total: 8 + 50 + 25 + 35 + 15 + 25 + 32 = 190mm
    });

    doc.save(`inventory-quick-${Date.now()}.pdf`);
    return true;
  } catch (error) {
    console.error("Quick export error:", error);
    alert("Failed to export PDF. Please try again.");
    return false;
  }
};

// ========== HELPER FUNCTIONS ==========

/**
 * Format variant string
 */
const formatVariant = (item) => {
  if (item.variant) return item.variant;
  if (item.color || item.size) {
    return `${item.color || "Default"} - ${item.size || "One Size"}`;
  }
  return "Default";
};

/**
 * Format currency
 */
const formatCurrency = (amount) => {
  return `₦${parseFloat(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Truncate text with ellipsis
 */
const truncateText = (text, maxLength) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
};

/**
 * Minimal export for debugging
 */
export const exportMinimalPDF = (data) => {
  const doc = new jsPDF();

  // Very simple table with minimal columns
  const tableData = data.map((item, index) => [
    (index + 1).toString(),
    truncateText(item.name || item.product, 35),
    (item.countInStock || item.stock || 0).toString(),
    `₦${(item.price || 0).toFixed(2)}`,
  ]);

  autoTable(doc, {
    head: [["#", "Product", "Stock", "Price"]],
    body: tableData,
    startY: 20,
    margin: { left: 10, right: 10 },
    tableWidth: 190,
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 120 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
    },
  });

  doc.save("inventory-minimal.pdf");
};
