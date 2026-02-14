import { Product } from "@/types";

export const mockProducts: Product[] = [
    { id: "1", name: "Gaufres fines rhum (110g)", price: 1500, stock: 150, alert_threshold: 20, unit: "110g", image_url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&q=80" },
    { id: "2", name: "Gaufres fines chocolats (110g)", price: 1800, stock: 85, alert_threshold: 20, unit: "110g", image_url: "https://images.unsplash.com/photo-1562007908-17c67e8724db?w=500&q=80" },
    { id: "3", name: "Gaufres fines rhum (220g)", price: 2800, stock: 12, alert_threshold: 15, unit: "200g", image_url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&q=80" },
    { id: "4", name: "Gaufres fines chocolats (220g)", price: 3200, stock: 200, alert_threshold: 15, unit: "200g", image_url: "https://images.unsplash.com/photo-1562007908-17c67e8724db?w=500&q=80" },
    { id: "5", name: "Gaufres vanille (110g)", price: 1400, stock: 0, alert_threshold: 20, unit: "110g", image_url: "https://images.unsplash.com/photo-1612203985729-1cfa233d45da?w=500&q=80" },
];
