import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import InvoicePDF from '@/components/InvoicePDF';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const orderId = resolvedParams.id;

        if (!orderId) {
            return NextResponse.json({ error: "Missing Invoice ID" }, { status: 400 });
        }

        const supabase = await createClient();

        // Check if an invoice exists for this order
        const { data: invoiceData } = await supabase
            .from('invoices')
            .select('id')
            .eq('order_id', orderId)
            .single();

        const invoiceId = invoiceData?.id || `INV-${orderId.replace('CMD-', '')}`;

        // Fetch the full order data with all relations
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select(`
                *,
                items:order_items(
                    *,
                    product:products(*)
                ),
                customer:customers(*)
            `)
            .eq('id', orderId)
            .single();

        if (orderError || !orderData) {
            console.error("Error fetching order for PDF:", orderError);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        let logoBase64 = undefined;
        try {
            const logoPath = path.join(process.cwd(), 'public', 'logo.png');
            if (fs.existsSync(logoPath)) {
                const imageBuffer = fs.readFileSync(logoPath);
                logoBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
            }
        } catch (e) {
            console.warn("Could not load logo.png", e);
        }

        // Generate PDF Stream
        const stream = await renderToStream(<InvoicePDF order={orderData} invoiceId={invoiceId} logoBase64={logoBase64} />);

        // We can't return the stream directly in Next.js 14+ NextResponse sometimes,
        // so we collect the chunks into a Buffer first, or return new Response(stream as any).
        // Returning Response directly with the readable stream is the recommended way.

        return new Response(stream as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=Facture-${invoiceId}.pdf`
            }
        });

    } catch (error: any) {
        console.error("PDF Generation API Error:", error);
        return NextResponse.json({ error: "Failed to generate PDF", details: error.message }, { status: 500 });
    }
}
