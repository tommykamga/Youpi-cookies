import * as XLSX from 'xlsx';
import { DeliveryCost } from '@/types';

export const exportTransportExcel = (data: DeliveryCost[], filenameLabel: string) => {
    const wb = XLSX.utils.book_new();
    const wsData = [
        ["Date", "Origine", "Destination", "Transport", "Coût", "Cartons", "Chauffeur", "Commande"],
        ...data.map(d => [
            d.delivery_date,
            d.origin,
            d.destination,
            d.transport_type,
            d.cost,
            d.cartons || 0,
            d.driver_name,
            d.order_id || ""
        ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Frais Transport");

    // Force download via Blob
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Transport-${filenameLabel}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Delay revocation to ensure download starts
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
};
