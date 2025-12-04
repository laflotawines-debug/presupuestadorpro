import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CartItem } from '../types';

export const generatePDF = (items: CartItem[], clientName: string, total: number) => {
  const doc = new jsPDF();
  const date = new Date();
  const dateStr = date.toLocaleDateString('es-AR');
  const timeStr = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const budgetId = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3,'0')}`;

  // Colors
  const orange = [228, 124, 0] as [number, number, number]; // #e47c00
  const grayDark = [60, 60, 60] as [number, number, number];
  const grayLight = [240, 240, 240] as [number, number, number];

  // --- HEADER SECTION ---
  // Background for Header
  doc.setFillColor(...grayLight);
  doc.rect(14, 10, 182, 40, 'F');
  
  // Left: Company Logo/Name
  doc.setTextColor(...orange);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('ALFONSA', 20, 25);
  
  doc.setTextColor(...grayDark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DISTRIBUIDORA MAYORISTA', 20, 32);
  doc.setFont('helvetica', 'normal');
  doc.text('Bebidas y Artículos de Almacén', 20, 37);
  doc.text('ventas@alfonsa.com', 20, 42);

  // Right: Document Details "Factura/Presupuesto Box"
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.rect(120, 10, 76, 40); // Box

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('PRESUPUESTO', 158, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`N°: ${budgetId}`, 125, 30);
  doc.text(`Fecha: ${dateStr}`, 125, 36);
  doc.text(`Hora: ${timeStr}`, 125, 42);

  // --- CLIENT SECTION ---
  doc.setDrawColor(228, 124, 0); // Orange border
  doc.setLineWidth(1);
  doc.line(14, 58, 196, 58);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('CLIENTE:', 14, 66);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(clientName || 'Consumidor Final', 40, 66);

  // --- TABLE SECTION ---
  const tableBody = items.map(item => [
    item.id,
    item.name,
    item.quantity,
    `$${item.selectedPrice.toLocaleString('es-AR')}`,
    `$${(item.selectedPrice * item.quantity).toLocaleString('es-AR')}`
  ]);

  autoTable(doc, {
    startY: 75,
    head: [['CÓDIGO', 'DESCRIPCIÓN', 'CANT.', 'UNITARIO', 'SUBTOTAL']],
    body: tableBody,
    theme: 'plain',
    headStyles: { 
      fillColor: orange, 
      textColor: 255, 
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { 
      fontSize: 9, 
      cellPadding: 4,
      valign: 'middle',
      lineWidth: 0, // No inner borders
    },
    columnStyles: {
      0: { cellWidth: 25 }, 
      1: { cellWidth: 'auto' }, 
      2: { cellWidth: 20, halign: 'center' }, 
      3: { cellWidth: 30, halign: 'right' }, 
      4: { cellWidth: 30, halign: 'right' }, 
    },
    // Add Zebra striping manually if needed or rely on plain theme. Let's add borders to bottom
    didParseCell: function (data) {
        if (data.section === 'body') {
            data.cell.styles.lineWidth = { bottom: 0.1 };
            data.cell.styles.lineColor = [220, 220, 220];
        }
    }
  });

  // --- TOTALS SECTION ---
  const finalY = (doc as any).lastAutoTable.finalY + 5;
  
  // Draw a box for totals
  const pageHeight = doc.internal.pageSize.height;
  
  // Ensure we don't go off page
  if (finalY < pageHeight - 50) {
    doc.setFillColor(...grayLight);
    doc.rect(130, finalY, 66, 20, 'F');

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 135, finalY + 13);
    
    doc.setFontSize(14);
    doc.text(`$${total.toLocaleString('es-AR')}`, 192, finalY + 13, { align: 'right' });
  }

  // --- FOOTER ---
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('Este documento es un presupuesto no válido como factura fiscal.', 105, pageHeight - 20, { align: 'center' });
  doc.text('Los precios están sujetos a cambios sin previo aviso.', 105, pageHeight - 15, { align: 'center' });

  // Save
  const safeName = clientName.replace(/[^a-z0-9]/gi, '_').substring(0, 15);
  doc.save(`Presupuesto_${safeName}_${budgetId}.pdf`);
};

export const generateWhatsAppLink = (items: CartItem[], total: number) => {
  let message = `*PEDIDO ALFONSA DISTRIBUIDORA*\n\n`;
  
  items.forEach(item => {
    message += `• *(${item.quantity})* ${item.name} | $${(item.selectedPrice * item.quantity).toLocaleString('es-AR')}\n`;
  });
  
  message += `\n*TOTAL FINAL: $${total.toLocaleString('es-AR')}*`;
  
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};