import type { NextApiRequest, NextApiResponse } from 'next';
import { generateInvoicePDFBuffer } from '@/components/InvoicePDFGenerator';
import { createServerClient, serializeCookieHeader } from '@supabase/ssr';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const orderId = req.query.id as string;

        if (!orderId) {
            return res.status(400).json({ error: "Missing Invoice ID" });
        }

        // Initialize Supabase Client for Pages Router
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return Object.keys(req.cookies).map((name) => ({
                            name,
                            value: req.cookies[name] || '',
                        }))
                    },
                    setAll(cookiesToSet) {
                        res.setHeader(
                            'Set-Cookie',
                            cookiesToSet.map(({ name, value, options }) =>
                                serializeCookieHeader(name, value, options)
                            )
                        )
                    },
                },
            }
        );

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
            return res.status(404).json({ error: "Order not found" });
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

        // Generate PDF Buffer using the separate generator to avoid App Router streams conflicts
        const pdfBuffer = await generateInvoicePDFBuffer(orderData, invoiceId, logoBase64);

        // Send Response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Facture-${invoiceId}.pdf`);
        res.setHeader('Content-Length', pdfBuffer.length.toString());
        res.status(200).send(pdfBuffer);

    } catch (error: any) {
        console.error("PDF Generation API Error:", error);
        return res.status(500).json({ error: "Failed to generate PDF", details: error.message });
    }
}
