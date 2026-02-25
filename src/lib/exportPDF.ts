import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DeliveryCost } from '@/types';
import { formatPrice } from "@/config/currency";

interface Totals {
    cost: number;
    cartons: number;
    count: number;
}

export const exportTransportPDF = (data: DeliveryCost[], periodLabel: string, totals: Totals) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Rapport Frais de Transport", 14, 20);

    // Metadata
    doc.setFontSize(10);
    doc.text(`Période: ${periodLabel}`, 14, 30);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 35);

    // Summary
    doc.text(`Total Coût: ${formatPrice(totals.cost)}`, 14, 45);
    doc.text(`Nombre de courses: ${totals.count}`, 14, 50);

    // Table
    const tableData = data.map(d => [
        new Date(d.delivery_date).toLocaleDateString('fr-FR'),
        d.destination,
        d.transport_type,
        d.driver_name,
        formatPrice(d.cost)
    ]);

    autoTable(doc, {
        head: [['Date', 'Destination', 'Transport', 'Chauffeur', 'Coût']],
        body: tableData,
        startY: 60,
    });

    // Force download via Blob
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `Transport-${periodLabel.replace(/ /g, '-')}.pdf`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Delay revocation to ensure download starts
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
};
