

export type Role = 'admin' | 'manager' | 'commercial' | 'production' | 'preparateur' | 'cutting' | 'cooking' | 'packaging';

export type EmployeeRole =
    | 'Administrateur'
    | 'GERANT'
    | 'Responsable Commercial'
    | 'Responsable production et qualité'
    | 'Vendeur'
    | 'Découpe pâte'
    | 'Cuisson'
    | 'Conditionnement';

export type Employee = {
    id: string;
    fullName: string;
    role: EmployeeRole;
    active: boolean; // Toggle
    hireDate: string; // ISO Date
    exitDate?: string; // ISO Date
    salary: number; // Monthly net/gross? Assume net for now or generic amount
    lastPaymentDate?: string;
    phone?: string;
    email?: string; // Optional link to User
    notes?: string;
    paymentHistory?: { id?: string; date: string; amount: number; reference?: string }[];
};


export type Task = {
    id: string;
    title: string;
    description?: string;
    assigned_to?: string; // User ID or Name
    due_date?: string;
    priority: 'high' | 'medium' | 'low';
    status: 'todo' | 'in_progress' | 'done';
    related_to?: {
        type: 'order' | 'client' | 'stock';
        id: string;
        label: string;
    };
    created_at?: string;
    updated_at?: string;
};

export type User = {
    id: string;
    email: string;
    full_name?: string;
    role: Role;
    active?: boolean;
    phone?: string; // New field
    avatar_url?: string; // New field
    created_at: string;
};

export type Product = {
    id: string;
    name: string;
    price: number;
    stock: number;
    minData?: string; // photo url (legacy?)
    image_url?: string; // New field for product image
    alert_threshold: number;
    unit: string; // e.g., '110g', '220g'
};

export type Customer = {
    id: string;
    name: string; // Nom/Prénom/Email/Téléphone combined or separate? Usually separate is better but for simple app maybe combined. Let's separate.
    email?: string;
    phone?: string;
    address?: string; // Adresse complète
    balance: number; // Montant dû
    status: 'active' | 'inactive';
    company_name?: string;
    tax_id?: string; // This might be the same as NIU, but let's be specific
    niu?: string; // Numéro d'Identifiant Unique
    rc?: string; // Registre de Commerce
    last_order_date?: string;
};

export type OrderStatus =
    | 'new'
    | 'preparing'
    | 'ready'
    | 'delivered'
    | 'completed'
    | 'cancelled'
    | 'paid'
    | 'unpaid'
    | 'draft'
    | 'overdue'
    | 'invoiced'
    | 'advance';

export type Order = {
    id: string;
    created_at: string;
    customer_id: string;
    customer?: Customer; // Joined
    status: OrderStatus;
    total_amount: number;
    delivery_date?: string;
    payment_date?: string;
    payment_method?: string;
    notes?: string;
    items?: OrderItem[];
};

export type OrderItem = {
    id: string;
    order_id: string;
    product_id: string;
    product?: Product; // Joined
    quantity: number;
    unit_price: number;
};

export type ContactCategory = 'CLIENT' | 'FOURNISSEUR' | 'PROSPECT' | 'ANNUAIRE';

export type Contact = {
    id: string;
    company: string;      // Entreprise
    contactName: string;  // Nom interlocuteur
    email: string;
    niu: string;          // NIU (Identifiant Unique)
    rc: string;           // RC (Registre Commerce)
    mobile: string;
    officePhone: string;  // Bureau
    address: string;
    website: string;
    category: ContactCategory;
    createdAt: string;
    updatedAt: string;
};

export type DeliveryCost = {
    id: string;
    delivery_date: string;
    origin: string;
    destination: string;
    transport_type: 'Moto' | 'Taxi';
    cost: number;
    cartons?: number;
    driver_name: string;
    driver_phone?: string;
    order_id?: string;
    notes?: string;
    created_at?: string;
};

export type Invoice = {
    id: string;
    created_at: string;
    order_id: string;
    order?: Order;
    customer?: Customer;
    total_amount: number;
    status: OrderStatus; // Synced with Order Status
    payment_date?: string;
    due_date?: string;
};
