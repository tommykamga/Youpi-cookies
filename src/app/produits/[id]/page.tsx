"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Loader2, Trash2, Image as ImageIcon, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Product } from "@/types";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const from = searchParams.get("from");
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [unit, setUnit] = useState("");
    const [alertThreshold, setAlertThreshold] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();


            if (error || !data) {
                console.error("Error fetching product:", error);
                router.push("/produits"); // Redirect if really not found
            } else if (data) {
                const product = data as Product;
                setName(product.name);
                setPrice(product.price.toString());
                setStock(product.stock.toString());
                setUnit(product.unit);
                setAlertThreshold(product.alert_threshold.toString());
                setImageUrl(product.image_url || "");
                setPreviewUrl(product.image_url || "");
            }
            setLoading(false);
        };

        fetchProduct();
    }, [id, router, supabase]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setImageUrl(""); // Clear URL input if file is chosen
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setPreviewUrl(null);
        setImageUrl("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const uploadImage = async (file: File): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data, error } = await supabase.storage
                .from('product-images')
                .upload(filePath, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error: any) {
            console.error('Error uploading image:', error?.message || error);
            return null;
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !price) {
            alert("Veuillez remplir les champs obligatoires (Nom, Prix)");
            return;
        }

        setIsSaving(true);
        let finalImageUrl = imageUrl;

        // Handle File Upload if exists
        if (imageFile) {
            setIsUploading(true);
            const uploadedUrl = await uploadImage(imageFile);
            if (uploadedUrl) {
                finalImageUrl = uploadedUrl;
            } else {
                alert("L'upload de l'image a échoué. On garde l'ancienne image.");
                finalImageUrl = imageUrl; // Fallback to current
            }
            setIsUploading(false);
        } else if (!previewUrl) {
            // If image was removed
            finalImageUrl = "";
        }

        const { error } = await supabase
            .from('products')
            .update({
                name,
                price: parseFloat(price),
                stock: parseInt(stock) || 0,
                unit,
                alert_threshold: parseInt(alertThreshold) || 10,
                image_url: finalImageUrl
            })
            .eq('id', id);

        if (error) {
            console.error('Error updating product:', error.message, error.details);
            alert(`Erreur lors de la modification du produit: ${error.message}`);
        } else {
            router.push(from === "stocks" ? "/stocks" : "/produits");
        }
        setIsSaving(false);
    };

    const handleDelete = async () => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting product:', error);
            alert("Erreur lors de la suppression.");
        } else {
            router.push(from === "stocks" ? "/stocks" : "/produits");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--cookie-brown)]" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={from === "stocks" ? "/stocks" : "/produits"} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-[var(--cookie-brown)]">Modifier Produit</h1>
                </div>
                <button
                    onClick={handleDelete}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-2"
                >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                </button>
            </div>

            <div className="card">
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Image du produit</label>
                        <div className="space-y-4">
                            {/* Image Preview / Dropzone */}
                            <div
                                onClick={() => !previewUrl && fileInputRef.current?.click()}
                                className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-all flex flex-col items-center justify-center min-h-[160px] cursor-pointer
                                    ${previewUrl ? 'border-transparent' : 'border-gray-300 hover:border-[var(--cookie-brown)] hover:bg-gray-50'}
                                `}
                            >
                                {previewUrl ? (
                                    <>
                                        <img src={previewUrl} alt="Aperçu" className="w-full h-48 object-cover" />
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); removeImage(); }}
                                            className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm text-red-500 rounded-full shadow-lg hover:bg-white transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center p-6">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Upload className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">Cliquez pour changer la photo</p>
                                        <p className="text-xs text-gray-500 mt-1">PNG, JPG ou WEBP jusqu'à 5 Mo</p>
                                    </div>
                                )}
                            </div>

                            {/* Hidden File Input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />

                            {/* Optional URL Fallback */}
                            {!previewUrl && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-px bg-gray-200 flex-1"></div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">OU URL</span>
                                        <div className="h-px bg-gray-200 flex-1"></div>
                                    </div>
                                    <div className="relative">
                                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="url"
                                            className="pl-9 w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none text-sm"
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prix Unitaire (FCFA) <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                required
                                min="0"
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actuel</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Seuil d'alerte stock</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                value={alertThreshold}
                                onChange={(e) => setAlertThreshold(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                        <Link
                            href={from === "stocks" ? "/stocks" : "/produits"}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                        >
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            disabled={isSaving || isUploading}
                            className="btn-primary flex items-center gap-2 px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving || isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {isUploading ? "Upload..." : "Enregistrer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
