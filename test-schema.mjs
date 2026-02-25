import { tool } from 'ai';
import { z } from 'zod';

const create_client = tool({
    description: 'Créer un nouveau client/contact',
    parameters: z.object({
        name: z.string().describe('Nom complet du client ou nom de contact'),
        company_name: z.string().optional().describe('Nom de l\'entreprise (optionnel)'),
        phone: z.string().describe('Numéro de téléphone du client'),
        email: z.string().email().optional().describe('Email du client (optionnel)'),
    }),
    execute: async () => ({ success: true })
});

console.log(JSON.stringify(create_client, null, 2));
