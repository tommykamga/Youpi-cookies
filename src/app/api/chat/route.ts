import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase admin client for the AI to bypass RLS and act as system
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Lazy-init to avoid build-time crash (env vars not available during `next build`)
let _openai: OpenAI | null = null;
function getOpenAI() {
    if (!_openai) {
        _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _openai;
}

// Define System Prompt
const SYSTEM_PROMPT = `Tu es l'assistant YELELE DIGIT MARK SARL (gestion cookies/gaufres).
Tu es poli, concis et très professionnel.
Tu aides avec :
- Clients/Contacts : créer, chercher (nom, tel, entreprise)
- Commandes : produits, quantités, client
- Relances : factures retard (statuts: attente/avance/payé) + commandes
- Tâches : titre, priorité, label (relance tel/chiffrage/rdv/relance devis/envoi facture/relance facture/livraison)
- Stocks : ingrédients/produits
- Employés : nom, poste, salaire, date entrée
- Livraisons : commande, date

Réponds TOUJOURS EN FRANÇAIS. 
Si on te demande de faire une action (créer client, créer commande, voir stock, relancer factures), utilise IMPÉRATIVEMENT les TOOLS fournis. 
Demande confirmation pour des actions très risquées (suppression), sinon pour la création, fonce et dis que c'est fait.
Formate tes réponses avec soin en utilisant des emojis professionnels quand c'est pertinent.`;

// Tool definitions using plain JSON Schema (no Zod conversion issues)
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
        type: 'function',
        function: {
            name: 'create_client',
            description: 'Créer un nouveau client/contact',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Nom complet du client ou nom de contact' },
                    company_name: { type: 'string', description: "Nom de l'entreprise (laisser vide si inconnu)" },
                    phone: { type: 'string', description: 'Numéro de téléphone du client' },
                    email: { type: 'string', description: 'Email du client (laisser vide si inconnu)' },
                },
                required: ['name', 'phone'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'create_order',
            description: 'Créer une nouvelle commande. Doit uniquement être appelé si on connaît le nom du client et les produits.',
            parameters: {
                type: 'object',
                properties: {
                    customer_name: { type: 'string', description: 'Nom du client pour chercher son ID' },
                    products: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                product_name: { type: 'string', description: 'Nom du produit (ex: Gaufres, Cookies)' },
                                quantity: { type: 'number', description: 'Quantité commandée' },
                            },
                            required: ['product_name', 'quantity'],
                        },
                        description: 'Liste des produits commandés',
                    },
                    notes: { type: 'string', description: 'Notes additionnelles (laisser vide si aucune)' },
                },
                required: ['customer_name', 'products'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'create_task',
            description: 'Assigner ou créer une tâche (ex: relancer un client, livreur, etc.)',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'Titre de la tâche' },
                    description: { type: 'string', description: 'Description détaillée de la tâche' },
                    status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE'], description: 'Statut de la tâche' },
                    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], description: 'Priorité' },
                },
                required: ['title', 'status', 'priority'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'relance_overdue',
            description: 'Vérifier et lancer les relances pour les factures ou commandes en retard.',
            parameters: { type: 'object', properties: {}, required: [] },
        },
    },
    {
        type: 'function',
        function: {
            name: 'stock_update',
            description: "Mettre à jour, consulter, ou vérifier l'inventaire/stock des produits ou ingrédients",
            parameters: {
                type: 'object',
                properties: {
                    product_name: { type: 'string', description: 'Nom du produit à chercher' },
                    action: { type: 'string', enum: ['check', 'add', 'remove'], description: 'Garde "check" pour juste consulter' },
                    amount: { type: 'number', description: 'Montant à ajouter ou enlever (mettre 0 si action est check)' },
                },
                required: ['product_name', 'action'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'employee_update',
            description: "Mettre à jour les informations d'un employé",
            parameters: {
                type: 'object',
                properties: {
                    employee_name: { type: 'string', description: "Nom de l'employé" },
                    new_role: { type: 'string', description: 'Nouveau poste (mettre "none" si aucun changement)' },
                    new_salary: { type: 'number', description: 'Nouveau salaire (mettre 0 si aucun changement)' },
                },
                required: ['employee_name'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'delivery_create',
            description: 'Créer une fiche ou une assignation de livraison pour une commande',
            parameters: {
                type: 'object',
                properties: {
                    driver_name: { type: 'string', description: 'Nom du livreur' },
                    destination: { type: 'string', description: 'Lieu de livraison' },
                    cost: { type: 'number', description: 'Coût de la livraison en FCFA' },
                    transport_type: { type: 'string', enum: ['Moto', 'Taxi'], description: 'Type de transport' },
                },
                required: ['driver_name', 'destination', 'cost', 'transport_type'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'stats_monthly',
            description: "Générer les statistiques mensuelles du chiffre d'affaires ou des ventes",
            parameters: {
                type: 'object',
                properties: {
                    month: { type: 'number', description: 'Le mois en chiffre (1-12)' },
                    year: { type: 'number', description: "L'année (ex: 2026)" },
                },
                required: ['month', 'year'],
            },
        },
    },
];

// Tool execution handlers
async function executeTool(name: string, args: Record<string, any>): Promise<string> {
    switch (name) {
        case 'create_client': {
            const { name: clientName, company_name, phone, email } = args;
            const { data, error } = await supabase
                .from('customers')
                .insert({ name: clientName, company_name: company_name || clientName, phone, email })
                .select()
                .single();
            if (error) return JSON.stringify({ success: false, error: error.message });
            return JSON.stringify({ success: true, message: `Client ${clientName} créé avec succès. ID: ${data.id}` });
        }

        case 'create_order': {
            const { customer_name, products, notes } = args;
            const { data: customers } = await supabase
                .from('customers').select('id').ilike('name', `%${customer_name}%`).limit(1);
            if (!customers || customers.length === 0) {
                return JSON.stringify({ success: false, message: `Client introuvable: "${customer_name}"` });
            }
            const orderId = `CMD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
            const { error } = await supabase.from('orders').insert({ id: orderId, customer_id: customers[0].id, status: 'new', notes });
            if (error) return JSON.stringify({ success: false, error: error.message });
            return JSON.stringify({ success: true, message: `Commande ${orderId} créée pour "${customer_name}" avec ${products.length} produits.` });
        }

        case 'create_task': {
            const { title, description, status, priority } = args;
            const { error } = await supabase.from('tasks').insert({ title, description, status, priority }).select().single();
            if (error) return JSON.stringify({ success: false, error: error.message });
            return JSON.stringify({ success: true, message: `Tâche "${title}" (Priorité: ${priority}) créée.` });
        }

        case 'relance_overdue': {
            const { data: invoices, error } = await supabase
                .from('invoices').select('*').in('status', ['DRAFT', 'ISSUED']).lt('due_date', new Date().toISOString());
            if (error) return JSON.stringify({ success: false, error: error.message });
            const count = invoices?.length || 0;
            if (count === 0) return JSON.stringify({ success: true, message: "Aucune facture en retard." });
            return JSON.stringify({ success: true, message: `${count} factures en retard trouvées. Relances préparées.` });
        }

        case 'stock_update': {
            const { product_name, action, amount } = args;
            const { data: products } = await supabase.from('products').select('*').ilike('name', `%${product_name}%`).limit(1);
            if (!products || products.length === 0) return JSON.stringify({ success: false, message: `Produit "${product_name}" introuvable.` });
            const product = products[0];
            if (action === 'check') return JSON.stringify({ success: true, message: `Stock "${product.name}": ${product.stock} unités (${product.price} FCFA).` });
            const newStock = action === 'add' ? product.stock + (amount || 0) : product.stock - (amount || 0);
            const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', product.id);
            if (error) return JSON.stringify({ success: false, error: error.message });
            return JSON.stringify({ success: true, message: `Stock "${product.name}" mis à jour: ${newStock} unités.` });
        }

        case 'employee_update': {
            const { employee_name, new_role, new_salary } = args;
            const { data: employees } = await supabase
                .from('employees').select('id, first_name, last_name')
                .or(`first_name.ilike.%${employee_name}%,last_name.ilike.%${employee_name}%`).limit(1);
            if (!employees || employees.length === 0) return JSON.stringify({ success: false, message: `Employé "${employee_name}" introuvable.` });
            const updates: any = {};
            if (new_role && new_role !== 'none') updates.role = new_role;
            if (new_salary && new_salary > 0) updates.base_salary = new_salary;
            const { error } = await supabase.from('employees').update(updates).eq('id', employees[0].id);
            if (error) return JSON.stringify({ success: false, error: error.message });
            return JSON.stringify({ success: true, message: `Dossier ${employees[0].first_name} ${employees[0].last_name} mis à jour.` });
        }

        case 'delivery_create': {
            const { driver_name, destination, cost, transport_type } = args;
            const { error } = await supabase.from('delivery_costs').insert({
                driver_name, destination, cost, transport_type, origin: 'Nkolbong',
                delivery_date: new Date().toISOString().split('T')[0],
            }).select().single();
            if (error) return JSON.stringify({ success: false, error: error.message });
            return JSON.stringify({ success: true, message: `Livraison ${destination} (${driver_name}, ${transport_type}). Coût: ${cost} FCFA.` });
        }

        case 'stats_monthly': {
            const { month, year } = args;
            const { data: orders, error } = await supabase
                .from('orders').select('total_amount, created_at')
                .gte('created_at', `${year}-${month.toString().padStart(2, '0')}-01`)
                .lt('created_at', `${month === 12 ? year + 1 : year}-${(month === 12 ? 1 : month + 1).toString().padStart(2, '0')}-01`);
            if (error) return JSON.stringify({ success: false, error: error.message });
            const total = orders?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0;
            return JSON.stringify({ success: true, message: `CA ${month}/${year}: ${total} FCFA (${orders?.length || 0} commandes).` });
        }

        default:
            return JSON.stringify({ error: `Tool inconnu: ${name}` });
    }
}

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages,
        ];

        // Allow up to 5 rounds of tool calls
        let response: OpenAI.Chat.Completions.ChatCompletion;

        for (let step = 0; step < 5; step++) {
            response = await getOpenAI().chat.completions.create({
                model: 'gpt-4o-mini',
                messages: chatMessages,
                tools,
            });

            const choice = response.choices[0];

            // If the model wants to call tools
            if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
                chatMessages.push(choice.message);

                for (const toolCall of choice.message.tool_calls) {
                    if (toolCall.type === 'function') {
                        const result = await executeTool(
                            toolCall.function.name,
                            JSON.parse(toolCall.function.arguments)
                        );
                        chatMessages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: result,
                        });
                    }
                }
                // Continue the loop to let the model respond with the tool results
                continue;
            }

            // Model is done, return the text response
            return new Response(
                JSON.stringify({ text: choice.message.content || '' }),
                { headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Fallback if max steps reached
        return new Response(
            JSON.stringify({ text: "Désolé, trop d'étapes de traitement. Essayez une requête plus simple." }),
            { headers: { 'Content-Type': 'application/json' } }
        );
    } catch (e: any) {
        console.error("Error in POST /api/chat:", e);
        return new Response(JSON.stringify({ error: e.message || "Internal Server Error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
