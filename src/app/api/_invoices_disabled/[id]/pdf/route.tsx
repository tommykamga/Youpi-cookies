import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInvoicePDFBuffer } from '@/components/InvoicePDFGenerator';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const maxDuration = 60; // Just in case PDF takes long or avoids some static timeout
export const runtime = 'nodejs';

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

        // Generate PDF Buffer using the separate generator to avoid Next.js 15 Web/Node streams conflicts in the API Route
        const pdfBuffer = await generateInvoicePDFBuffer(orderData, invoiceId, logoBase64);

        // Convert Node Buffer to standard Uint8Array so Next.js/TypeScript accepts it as BodyInit
        const uint8Array = new Uint8Array(pdfBuffer);

        return new Response(uint8Array, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=Facture-${invoiceId}.pdf`,
                'Content-Length': uint8Array.length.toString(),
            }
        });

    } catch (error: any) {
        console.error("PDF Generation API Error:", error);
        return NextResponse.json({ error: "Failed to generate PDF", details: error.message }, { status: 500 });
    }
}
