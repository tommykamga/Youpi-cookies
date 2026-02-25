"use client";

import { useState, useEffect } from "react";
import { Search, Filter, AlertTriangle, CheckCircle, Package, Loader2, ArrowRight } from "lucide-react";
import { Product } from "@/types";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

// Removed mockProducts

export default function StocksPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const supabase = createClient();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Try 'products' first
                let { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .order('stock', { ascending: true });

                if (error || !data) {
                    // Try 'produits' (French table name strategy)
                    const response = await supabase
                        .from('produits')
                        .select('*')
                        .order('stock', { ascending: true });

                    if (!response.error && response.data) {
                        setProducts(response.data);
                        setLoading(false);
                        return;
                    }
                }

                if (data && data.length > 0) {
                    setProducts(data);
                } else {
                    setProducts([]);
                }
            } catch (err) {
                console.error("Error fetching stocks:", err);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesStatus = true;
        if (statusFilter === 'low_stock') {
            matchesStatus = product.stock <= (product.alert_threshold || 10) && product.stock > 0;
        } else if (statusFilter === 'out_of_stock') {
            matchesStatus = product.stock === 0;
        } else if (statusFilter === 'in_stock') {
            matchesStatus = product.stock > (product.alert_threshold || 10);
        }

        return matchesSearch && matchesStatus;
    });

    const lowStockCount = products.filter(p => p.stock <= (p.alert_threshold || 10) && p.stock > 0).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--cookie-brown)]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[var(--cookie-brown)]">Gestion des Stocks</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card flex items-center gap-4 border-l-4 border-green-500">
                    <div className="p-3 bg-green-50 rounded-full text-green-600">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">En Stock</p>
                        <p className="text-2xl font-bold text-gray-800">{products.length - lowStockCount - outOfStockCount}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-4 border-l-4 border-orange-400">
                    <div className="p-3 bg-orange-50 rounded-full text-orange-500">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Stock Faible</p>
                        <p className="text-2xl font-bold text-gray-800">{lowStockCount}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-4 border-l-4 border-red-500">
                    <div className="p-3 bg-red-50 rounded-full text-red-500">
                        <Package className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Rupture</p>
                        <p className="text-2xl font-bold text-gray-800">{outOfStockCount}</p>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un produit..."
                        className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cookie-brown)]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--cookie-brown)] appearance-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="in_stock">En stock</option>
                        <option value="low_stock">Stock faible</option>
                        <option value="out_of_stock">Rupture</option>
                    </select>
                </div>
            </div>

            {/* Stock List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium">Produit</th>
                                <th className="px-6 py-4 font-medium">Stock Actuel</th>
                                <th className="px-6 py-4 font-medium">Seuil Alerte</th>
                                <th className="px-6 py-4 font-medium">Statut</th>
                                <th className="px-6 py-4 font-medium text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50 group transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {product.name}
                                    </td>
                                    <td className="px-6 py-4 font-bold">
                                        {product.stock}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {product.alert_threshold || 10}
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.stock === 0 ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                                                Rupture
                                            </span>
                                        ) : product.stock <= (product.alert_threshold || 10) ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-600"></div>
                                                Faible
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                                                OK
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <Link
                                            href={`/produits/${product.id}?from=stocks`}
                                            className="text-[var(--cookie-brown)] hover:underline text-xs"
                                        >
                                            Mettre à jour
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
