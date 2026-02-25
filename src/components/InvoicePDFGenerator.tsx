import { renderToBuffer } from '@react-pdf/renderer';
import InvoicePDF from '@/components/InvoicePDF';
import { Order } from '@/types';

export const generateInvoicePDFBuffer = async (orderData: Order, invoiceId: string, logoBase64?: string) => {
    return await renderToBuffer(<InvoicePDF order={orderData} invoiceId={invoiceId} logoBase64={logoBase64} />);
};
