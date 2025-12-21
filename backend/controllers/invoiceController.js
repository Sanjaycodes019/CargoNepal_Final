const PDFDocument = require("pdfkit");
const Booking = require("../models/BookingModel");

// Generate PDF invoice
const generateInvoice = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("truck", "title type ratePerKm")
      .populate("owner", "name email phone address")
      .populate("customer", "name email phone address");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (
      (req.user.role === "customer" && booking.customer._id.toString() !== req.user.id) ||
      (req.user.role === "owner" && booking.owner._id.toString() !== req.user.id)
    ) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const filename = `invoice-${booking._id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    doc.pipe(res);

    // ---------------- HEADER ----------------
    doc
      .fillColor("#1a365d")
      .fontSize(28)
      .font("Helvetica-Bold")
      .text("CargoNepal", { align: "center" })
      .moveDown(0.1);

    doc
      .fontSize(10)
      .fillColor("#666")
      .font("Helvetica")
      .text("Professional Cargo & Transport Services", { align: "center" })
      .moveDown(0.3);

    doc
      .fontSize(14)
      .fillColor("#1a365d")
      .font("Helvetica-Bold")
      .text("TAX INVOICE", { align: "center" })
      .moveDown(0.8);

    doc.strokeColor("#1a365d").lineWidth(2).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.strokeColor("#cbd5e0").lineWidth(0.5).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
    doc.moveDown(0.8);

    // ---------------- INVOICE METADATA ----------------
    const metaY = doc.y;
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#1a365d");
    doc.text("Invoice No:", 40, metaY, { continued: true })
      .font("Helvetica")
      .fillColor("#333")
      .text(` INV-${booking._id.toString().slice(-8).toUpperCase()}`);
    
    doc.font("Helvetica-Bold").fillColor("#1a365d")
      .text("Invoice Date:", 40, doc.y + 2, { continued: true })
      .font("Helvetica")
      .fillColor("#333")
      .text(` ${new Date(booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`);

    doc.font("Helvetica-Bold").fillColor("#1a365d")
      .text("Status:", 350, metaY, { continued: true })
      .font("Helvetica")
      .fillColor("#059669")
      .text(` ${booking.status.toUpperCase()}`);

    doc.font("Helvetica-Bold").fillColor("#1a365d")
      .text("Payment Mode:", 350, doc.y + 2, { continued: true })
      .font("Helvetica")
      .fillColor("#333")
      .text(` Online`);
    
    doc.moveDown(1.2);

    // ---------------- CUSTOMER & PROVIDER CARDS ----------------
    const cardWidth = 240;
    const cardHeight = 95;
    const leftX = 40;
    const rightX = 310;
    const topY = doc.y;

    // Customer Card
    doc.roundedRect(leftX, topY, cardWidth, cardHeight, 3).fillAndStroke("#f8fafc", "#cbd5e0");
    doc.fillColor("#1a365d").font("Helvetica-Bold").fontSize(11).text("BILLED TO", leftX + 10, topY + 10);
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#111").text(booking.customer.name, leftX + 10, topY + 28);
    doc.font("Helvetica").fontSize(9).fillColor("#555");
    if (booking.customer.address) doc.text(booking.customer.address, leftX + 10, doc.y + 3, { width: 220 });
    doc.text(booking.customer.email, leftX + 10, doc.y + 2);
    if (booking.customer.phone) doc.text(`Tel: ${booking.customer.phone}`, leftX + 10, doc.y + 2);

    // Provider Card
    doc.roundedRect(rightX, topY, cardWidth, cardHeight, 3).fillAndStroke("#f8fafc", "#cbd5e0");
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#1a365d").text("SERVICE PROVIDER", rightX + 10, topY + 10);
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#111").text(booking.owner.name, rightX + 10, topY + 28);
    doc.font("Helvetica").fontSize(9).fillColor("#555");
    if (booking.owner.address) doc.text(booking.owner.address, rightX + 10, doc.y + 3, { width: 220 });
    doc.text(booking.owner.email, rightX + 10, doc.y + 2);
    if (booking.owner.phone) doc.text(`Tel: ${booking.owner.phone}`, rightX + 10, doc.y + 2);

    doc.y = topY + cardHeight + 15;

    // ---------------- ROUTE DETAILS ----------------
    const routeY = doc.y;
    doc.roundedRect(40, routeY, 510, 75, 3).fillAndStroke("#eff6ff", "#93c5fd");
    doc.fillColor("#1e40af").font("Helvetica-Bold").fontSize(11).text("ROUTE DETAILS", 45, routeY + 8);
    doc.font("Helvetica").fontSize(9).fillColor("#1e3a8a");
    
    doc.font("Helvetica-Bold").text("Pickup Location:", 45, routeY + 26, { continued: true })
      .font("Helvetica").text(` ${booking.pickup?.address || "N/A"}`, { width: 460 });
    
    doc.font("Helvetica-Bold").text("Dropoff Location:", 45, doc.y + 4, { continued: true })
      .font("Helvetica").text(` ${booking.dropoff?.address || "N/A"}`, { width: 460 });
    
    doc.font("Helvetica-Bold").text("Total Distance:", 45, doc.y + 4, { continued: true })
      .font("Helvetica").text(` ${booking.distanceKm} km`);
    
    doc.y = routeY + 85;

    // ---------------- SERVICE DETAILS ----------------
    const serviceY = doc.y;
    doc.roundedRect(40, serviceY, 510, 65, 3).fillAndStroke("#fef3c7", "#fbbf24");
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#92400e").text("VEHICLE & SERVICE DETAILS", 45, serviceY + 8);
    doc.font("Helvetica").fontSize(9).fillColor("#78350f");
    
    doc.font("Helvetica-Bold").text("Vehicle:", 45, serviceY + 26, { continued: true })
      .font("Helvetica").text(` ${booking.truck.title}`);
    
    doc.font("Helvetica-Bold").text("Type:", 45, doc.y + 4, { continued: true })
      .font("Helvetica").text(` ${booking.truck.type}`);
    
    doc.font("Helvetica-Bold").text("Rate:", 45, doc.y + 4, { continued: true })
      .font("Helvetica").text(` ₹${booking.truck.ratePerKm} per km`);
    
    doc.y = serviceY + 75;

    // ---------------- INVOICE SUMMARY TABLE ----------------
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#1a365d").text("INVOICE SUMMARY", 40, doc.y);
    doc.moveDown(0.6);

    const tableTop = doc.y;
    const descX = 50;
    const qtyX = 320;
    const rateX = 400;
    const amountX = 480;

    // Table Header
    doc.roundedRect(40, tableTop - 5, 510, 25, 2).fillAndStroke("#1a365d", "#1a365d");
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#ffffff");
    doc.text("Description", descX, tableTop + 2);
    doc.text("Distance", qtyX, tableTop + 2);
    doc.text("Rate/km", rateX, tableTop + 2);
    doc.text("Amount", amountX, tableTop + 2);

    // Table Row
    const rowY = tableTop + 30;
    doc.roundedRect(40, rowY - 5, 510, 25, 2).fillAndStroke("#f8fafc", "#e2e8f0");
    doc.font("Helvetica").fontSize(9).fillColor("#333");
    doc.text("Cargo Transport Service", descX, rowY + 2, { width: 250 });
    doc.text(`${booking.distanceKm} km`, qtyX, rowY + 2);
    doc.text(`₹${booking.truck.ratePerKm}`, rateX, rowY + 2);
    doc.text(`₹${booking.price}`, amountX, rowY + 2);

    doc.y = rowY + 35;

    // Subtotal and Total Section
    const summaryX = 350;
    const summaryValueX = 480;
    const summaryY = doc.y;

    doc.font("Helvetica").fontSize(10).fillColor("#555");
    doc.text("Subtotal:", summaryX, summaryY);
    doc.text(`₹${booking.price}`, summaryValueX, summaryY);

    doc.text("Tax (0%):", summaryX, summaryY + 18);
    doc.text("₹0", summaryValueX, summaryY + 18);

    doc.moveTo(summaryX, summaryY + 38).lineTo(550, summaryY + 38).strokeColor("#1a365d").lineWidth(1.5).stroke();

    doc.font("Helvetica-Bold").fontSize(12).fillColor("#1a365d");
    doc.text("Total Amount:", summaryX, summaryY + 45);
    doc.text(`₹${booking.price}`, summaryValueX, summaryY + 45);

    doc.y = summaryY + 75;

    // ---------------- STAMP AND SIGNATURE SECTION ----------------
    const stampY = doc.y;
    
    // Company Stamp (Left side)
    const stampX = 60;
    const stampSize = 80;
    
    // Outer circle
    doc.circle(stampX + stampSize/2, stampY + stampSize/2, stampSize/2)
      .strokeColor("#1a365d")
      .lineWidth(3)
      .stroke();
    
    // Inner circle
    doc.circle(stampX + stampSize/2, stampY + stampSize/2, stampSize/2 - 8)
      .strokeColor("#1a365d")
      .lineWidth(1)
      .stroke();
    
    // Company name in circular stamp
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#1a365d");
    doc.text("CARGO", stampX + 10, stampY + 28, { width: stampSize - 20, align: "center" });
    doc.font("Helvetica").fontSize(7).fillColor("#1a365d");
    doc.fontSize(6).text("NEPAL", stampX + 10, stampY + 52, { width: stampSize - 20, align: "center" });

    // Authorized Signature (Right side)
    const sigX = 400;
    const sigY = stampY + 10;
    
    // Signature line
    doc.font("Helvetica").fontSize(9).fillColor("#666");
    doc.text("Authorized Signatory", sigX, sigY);
    
    // Stylized signature
    doc.fontSize(20).font("Helvetica-BoldOblique").fillColor("#1a365d");
    doc.text("CargoNepal", sigX, sigY + 15);
    
    // Signature line
    doc.moveTo(sigX, sigY + 45).lineTo(sigX + 130, sigY + 45).strokeColor("#333").lineWidth(1).stroke();
    
    doc.font("Helvetica").fontSize(8).fillColor("#666");
    doc.text("CEO, Sanjay Gupta", sigX + 15, sigY + 50);
    doc.fontSize(7).fillColor("#999");
    doc.text(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), sigX + 25, sigY + 62);

    doc.y = Math.max(stampY + stampSize + 20, sigY + 85);

    // ---------------- FOOTER ----------------
    doc.strokeColor("#cbd5e0").lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);
    
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#1a365d")
      .text("Thank you for choosing CargoNepal!", { align: "center" });
    doc.moveDown(0.3);
    
    doc.font("Helvetica").fontSize(8).fillColor("#718096")
      .text("This is a computer-generated invoice and does not require a physical signature.", { align: "center" });
    
    doc.fontSize(7).fillColor("#a0aec0")
      .text("For queries, contact: support@cargonepal.com | +977-9766382090", { align: "center" });

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { generateInvoice };
