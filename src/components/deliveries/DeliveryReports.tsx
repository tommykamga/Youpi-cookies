"use client";

import { useState, useMemo } from "react";
import { DeliveryCost } from "@/types";
import { formatPrice } from "@/config/currency";
import { Download, FileText, Filter, Calendar, Truck, RefreshCw, FileSpreadsheet } from "lucide-react";
import { exportTransportPDF } from "@/lib/exportPDF";
import { exportTransportExcel } from "@/lib/exportExcel";

interface DeliveryReportsProps {
    deliveries: DeliveryCost[];
}

type PeriodType = 'month' | 'quarter' | 'year';

export default function DeliveryReports({ deliveries }: DeliveryReportsProps) {
    const [periodType, setPeriodType] = useState<PeriodType>('month');
    const [selectedDate, setSelectedDate] = useState(new Date()); // Defaults to current month/year
    const [driverFilter, setDriverFilter] = useState("all");
    const [destinationFilter, setDestinationFilter] = useState("all");

    // Extract unique drivers and destinations for dropdowns
    const drivers = useMemo(() => {
        const unique = new Set(deliveries.map(d => d.driver_name).filter(Boolean));
        return Array.from(unique).sort();
    }, [deliveries]);

    const destinations = useMemo(() => {
        const unique = new Set(deliveries.map(d => d.destination).filter(Boolean));
        return Array.from(unique).sort();
    }, [deliveries]);

    // Filtering Logic
    const filteredData = useMemo(() => {
        return deliveries.filter(d => {
            const date = new Date(d.delivery_date);
            const yearMatch = date.getFullYear() === selectedDate.getFullYear();
            let periodMatch = false;

            if (periodType === 'year') {
                periodMatch = yearMatch;
            } else if (periodType === 'quarter') {
                const q = Math.floor(date.getMonth() / 3);
                const selectedQ = Math.floor(selectedDate.getMonth() / 3);
                periodMatch = yearMatch && q === selectedQ;
            } else { // month
                periodMatch = yearMatch && date.getMonth() === selectedDate.getMonth();
            }

            const driverMatch = driverFilter === "all" || d.driver_name === driverFilter;
            const destMatch = destinationFilter === "all" || d.destination === destinationFilter;

            return periodMatch && driverMatch && destMatch;
        });
    }, [deliveries, periodType, selectedDate, driverFilter, destinationFilter]);

    // Stats
    const totalCost = filteredData.reduce((sum, d) => sum + d.cost, 0);
    const totalDeliveries = filteredData.length;
    const totalCartons = filteredData.reduce((sum, d) => sum + (Number(d.cartons) || 0), 0);

    const periodLabel = periodType === 'month'
        ? selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        : selectedDate.getFullYear().toString();

    // Export Excel
    const handleExportExcel = () => {
        const filenameLabel = periodLabel.replace(/ /g, '-');
        exportTransportExcel(filteredData, filenameLabel);
    };

    // Export PDF
    const handleExportPDF = () => {
        exportTransportPDF(filteredData, periodLabel, {
            cost: totalCost,
            cartons: totalCartons,
            count: totalDeliveries
        });
    };

    // Helper to change month/year
    const shiftDate = (months: number) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + months);
        setSelectedDate(newDate);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">

                {/* Filters Group 1: Period */}
                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setPeriodType('month')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${periodType === 'month' ? 'bg-white shadow-sm text-[var(--cookie-brown)]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Mensuel
                        </button>
                        <button
                            onClick={() => setPeriodType('quarter')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${periodType === 'quarter' ? 'bg-white shadow-sm text-[var(--cookie-brown)]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Trimestriel
                        </button>
                        <button
                            onClick={() => setPeriodType('year')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${periodType === 'year' ? 'bg-white shadow-sm text-[var(--cookie-brown)]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Annuel
                        </button>
                    </div>

                    <div className="flex items-center bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
                        <button onClick={() => shiftDate(periodType === 'year' ? -12 : periodType === 'quarter' ? -3 : -1)} className="text-gray-400 hover:text-gray-600">◀</button>
                        <span className="mx-3 text-sm font-medium text-gray-700 min-w-[120px] text-center">
                            {periodLabel}
                        </span>
                        <button onClick={() => shiftDate(periodType === 'year' ? 12 : periodType === 'quarter' ? 3 : 1)} className="text-gray-400 hover:text-gray-600">▶</button>
                    </div>
                </div>

                {/* Filters Group 2: Context */}
                <div className="flex items-center gap-2 flex-wrap">
                    <select
                        value={driverFilter}
                        onChange={(e) => setDriverFilter(e.target.value)}
                        className="text-sm border-gray-200 rounded-lg focus:ring-[var(--cookie-brown)] focus:border-[var(--cookie-brown)] bg-gray-50 py-1.5 px-3"
                    >
                        <option value="all">👨🔧 Tous chauffeurs</option>
                        {drivers.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <select
                        value={destinationFilter}
                        onChange={(e) => setDestinationFilter(e.target.value)}
                        className="text-sm border-gray-200 rounded-lg focus:ring-[var(--cookie-brown)] focus:border-[var(--cookie-brown)] bg-gray-50 py-1.5 px-3"
                    >
                        <option value="all">📍 Toutes destinations</option>
                        {destinations.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-auto">
                    <button
                        type="button"
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors border border-green-200"
                    >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        Excel
                    </button>
                    <button
                        type="button"
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors border border-red-200"
                    >
                        <FileText className="h-3.5 w-3.5" />
                        PDF
                    </button>
                </div>
            </div>

            {/* Preview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500">Coût Total (Période)</div>
                    <div className="text-2xl font-bold text-[var(--cookie-brown)]">
                        {formatPrice(totalCost)}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500">Nombre de courses</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {totalDeliveries}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500">Total Cartons</div>
                    <div className="text-2xl font-bold text-blue-600">
                        {totalCartons}
                    </div>
                </div>
            </div>

            {/* Preview Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 font-medium">Date</th>
                            <th className="px-6 py-3 font-medium">Destination</th>
                            <th className="px-6 py-3 font-medium">Chauffeur</th>
                            <th className="px-6 py-3 font-medium text-right">Cartons</th>
                            <th className="px-6 py-3 font-medium text-right">Coût</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredData.length > 0 ? filteredData.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3">
                                    {new Date(item.delivery_date).toLocaleDateString('fr-FR')}
                                </td>
                                <td className="px-6 py-3">{item.destination}</td>
                                <td className="px-6 py-3">{item.driver_name}</td>
                                <td className="px-6 py-3 text-right">{item.cartons || "-"}</td>
                                <td className="px-6 py-3 text-right font-medium text-[var(--cookie-brown)]">
                                    {formatPrice(item.cost)}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                    Aucune donnée pour cette période.
                                </td>
                            </tr>
                        )}

                        {/* Summary Footer Row */}
                        {filteredData.length > 0 && (
                            <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                                <td colSpan={3} className="px-6 py-4 text-right text-[var(--cookie-brown)] uppercase text-xs tracking-wider">
                                    TOTAL {periodLabel} :
                                </td>
                                <td className="px-6 py-4 text-right text-[var(--cookie-brown)]">
                                    {formatPrice(totalCost)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {totalCartons} cartons
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    {totalDeliveries} livraisons
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
