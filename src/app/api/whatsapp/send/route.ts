import { NextResponse } from 'next/server';
import axios from 'axios';

// Environment variables
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

export async function POST(req: Request) {
    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
        return NextResponse.json(
            { error: "WhatsApp credentials not configured (WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID)" },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();
        const { type, phone, orderId, pdfUrl, customerName, amount, invoiceId } = body;

        // Basic validation
        if (!phone) {
            return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
        }

        // Format phone number (remove +, spaces, ensure country code if needed - for now assume raw input is mostly correct or clean it slightly)
        // Meta requires country code without +.
        const formattedPhone = phone.replace(/\D/g, '');

        let messageData: any = {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "template",
            template: {
                name: type === 'invoice' ? "invoice_available" : "payment_reminder", // These template names must exist in WABA
                language: { code: "fr" },
                components: []
            }
        };

        // Construct Template Components based on type
        // NOTE: You must create these templates in Facebook Business Manager first!
        // This is a generic implementation assuming standard placeholders.

        if (type === 'invoice') {
            // Template: "Bonjour {{1}}, votre facture #{{2}} est disponible. ..."
            // Header: Document (PDF)
            messageData.template.components = [
                {
                    type: "header",
                    parameters: [
                        {
                            type: "document",
                            document: {
                                link: pdfUrl,
                                filename: `Facture-${invoiceId || orderId}.pdf`
                            }
                        }
                    ]
                },
                {
                    type: "body",
                    parameters: [
                        { type: "text", text: customerName || "Client" }, // {{1}}
                        { type: "text", text: invoiceId || orderId || "---" }   // {{2}}
                    ]
                }
            ];
        } else if (type === 'reminder') {
            // Template: "Rappel : La facture #{{1}} de {{2}} est en attente..."
            messageData.template.components = [
                {
                    type: "body",
                    parameters: [
                        { type: "text", text: invoiceId || orderId || "---" }, // {{1}}
                        { type: "text", text: amount || "0 FCFA" }      // {{2}}
                    ]
                }
            ];
        } else {
            // Fallback text message if no template matches/for testing
            messageData = {
                messaging_product: "whatsapp",
                to: formattedPhone,
                type: "text",
                text: { body: `Message regarding Order #${orderId}` }
            };
        }

        // Send to Meta Graph API
        const response = await axios.post(
            `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
            messageData,
            {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return NextResponse.json({ success: true, data: response.data });

    } catch (error: any) {
        console.error("WhatsApp API Error:", error.response?.data || error.message);
        return NextResponse.json(
            {
                error: "Failed to send WhatsApp message",
                details: error.response?.data || error.message
            },
            { status: 500 }
        );
    }
}
