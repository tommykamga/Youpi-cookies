import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Order } from '@/types';
import { montantLettres } from '@/lib/montantLettres';
import { formatPrice } from '@/config/currency';

const styles = StyleSheet.create({
    page: {
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica',
        position: 'relative',
    },
    // COMPACT PADDING
    contentContainer: {
        paddingTop: 30,
        paddingBottom: 120, // Space for footer
        paddingHorizontal: 30
    },

    // 3-COLUMN HEADER
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    headerLeft: {
        width: '35%',
        alignItems: 'flex-start',
    },
    headerCenter: {
        width: '30%',
        alignItems: 'center',
    },
    headerLogo: {
        height: 60,
        objectFit: 'contain'
    },
    companyName: {
        fontSize: 14,
        color: '#0f766e',
        fontFamily: 'Helvetica-Bold',
        marginBottom: 4,
        textTransform: 'uppercase'
    },
    companyAddress: {
        fontSize: 9,
        color: '#4b5563',
        lineHeight: 1.3
    },
    headerRight: {
        width: '35%',
        alignItems: 'flex-end',
    },
    invoiceTitle: {
        fontSize: 22,
        color: '#f59e0b',
        fontFamily: 'Helvetica-Bold',
        marginBottom: 4
    },
    invoiceNumber: {
        fontSize: 12,
        color: '#111827',
        fontFamily: 'Helvetica-Bold',
    },
    dateContainer: {
        marginTop: 10,
        alignItems: 'flex-end'
    },
    dateLabel: {
        fontSize: 9,
        color: '#6b7280'
    },
    dateValue: {
        fontSize: 11,
        color: '#111827',
        fontFamily: 'Helvetica-Bold',
        marginTop: 2
    },

    // Client Info Section COMPACT
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        backgroundColor: '#f9fafb',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f3f4f6'
    },
    clientBox: {
        width: '48%'
    },
    sectionTitle: {
        fontSize: 9,
        color: '#0f766e',
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        marginBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#ccfbf1',
        paddingBottom: 2
    },
    boldText: {
        fontFamily: 'Helvetica-Bold',
        color: '#111827',
        fontSize: 10,
        marginBottom: 2
    },
    grayText: {
        fontSize: 9,
        color: '#4b5563',
        marginBottom: 2
    },

    // Table COMPACT
    table: {
        width: '100%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRightWidth: 0,
        borderBottomWidth: 0,
        marginBottom: 15
    },
    tableRow: {
        flexDirection: 'row',
        minHeight: 20,
        alignItems: 'center'
    },
    tableHeader: {
        backgroundColor: '#0f766e',
        color: '#ffffff',
    },
    tableColHeaderDesc: { width: '45%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, borderColor: '#e5e7eb', paddingVertical: 4 },
    tableColHeaderNum: { width: '18%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, borderColor: '#e5e7eb', paddingVertical: 4 },
    tableColHeaderTotal: { width: '19%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, borderColor: '#e5e7eb', paddingVertical: 4 },

    tableColRowDesc: { width: '45%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, borderColor: '#e5e7eb', paddingVertical: 4 },
    tableColRowNum: { width: '18%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, borderColor: '#e5e7eb', paddingVertical: 4 },
    tableColRowTotal: { width: '19%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, borderColor: '#e5e7eb', paddingVertical: 4 },

    tableColTitle: { marginHorizontal: 6, fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
    tableColTitleNum: { marginHorizontal: 6, fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#ffffff', textAlign: 'right' },

    tableCell: { marginHorizontal: 6, fontSize: 8, color: '#374151' },
    tableCellNum: { marginHorizontal: 6, fontSize: 8, color: '#374151', textAlign: 'right' },

    // Totals COMPACT
    totalsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 10
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: 180,
        padding: 6,
        backgroundColor: '#fffbeb',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#f59e0b'
    },
    totalTitle: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 12,
        color: '#111827'
    },
    totalAmount: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 12,
        color: '#0f766e',
        textAlign: 'right'
    },

    amountInWords: {
        fontSize: 9,
        marginVertical: 4,
        fontStyle: 'italic',
        color: '#4b5563',
        backgroundColor: '#f3f4f6',
        padding: 6,
        borderRadius: 4
    },

    signatureContainer: {
        alignItems: 'flex-end',
        marginTop: 10,
        paddingRight: 10
    },
    cachet: {
        width: 120,
        height: 60,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderStyle: 'dashed',
        marginBottom: 4,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff'
    },
    cachetText: {
        color: '#9ca3af',
        fontSize: 8
    },
    cachetTitle: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 10,
        color: '#111827'
    },

    // FOOTER (Absolute Position) COMPACT
    footerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 110,
        backgroundColor: '#11655b',
        borderTopWidth: 3,
        borderTopColor: '#f59e0b',
        paddingTop: 12,
        paddingHorizontal: 30,
    },
    footerColumns: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerLeft: {
        width: '45%',
    },
    footerRight: {
        width: '50%',
    },
    footerCompanyTitle: {
        color: '#f59e0b',
        fontFamily: 'Helvetica-Bold',
        fontSize: 11,
        marginBottom: 4,
        textTransform: 'uppercase'
    },
    footerTextLight: {
        color: '#a3dbd8',
        fontSize: 8,
        marginBottom: 2
    },
    footerContactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2
    },
    footerIconWrapper: {
        backgroundColor: '#f59e0b',
        borderRadius: 8,
        width: 10,
        height: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6
    },
    footerIconText: {
        color: '#0f766e',
        fontSize: 6,
        fontFamily: 'Helvetica-Bold'
    },
    footerContactTextWhite: {
        color: '#ffffff',
        fontSize: 8,
        fontFamily: 'Helvetica-Bold'
    },
    footerContactTextLight: {
        color: '#ffffff',
        fontSize: 8
    },

    bankTitle: {
        color: '#f59e0b',
        fontFamily: 'Helvetica-Bold',
        fontSize: 9,
        marginBottom: 3,
        textTransform: 'uppercase'
    },
    bankLine: {
        borderBottomWidth: 0.5,
        borderBottomColor: '#1d877e',
        marginBottom: 6
    },
    bankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3
    },
    bankLabel: {
        width: 70,
        color: '#a3dbd8',
        fontSize: 8
    },
    bankValueWhite: {
        color: '#ffffff',
        fontSize: 8,
        fontFamily: 'Helvetica-Bold'
    },
    bankValueOrange: {
        color: '#f59e0b',
        fontSize: 10,
        fontFamily: 'Helvetica-Bold'
    },
    bankPill: {
        backgroundColor: '#ffffff20',
        paddingHorizontal: 3,
        paddingVertical: 1,
        borderRadius: 2
    },
    bankPillText: {
        color: '#ffffff',
        fontSize: 8,
    },

    footerBottom: {
        marginTop: 10,
        paddingTop: 6,
        borderTopWidth: 0.5,
        borderTopColor: '#1d877e',
        alignItems: 'center'
    },
    footerBottomText: {
        fontSize: 6,
        color: '#68adac',
        letterSpacing: 1.5
    }
});

interface InvoicePDFProps {
    order: Order;
    invoiceId: string;
    logoBase64?: string;
}

export default function InvoicePDF({ order, invoiceId, logoBase64 }: InvoicePDFProps) {
    const customer = order.customer;
    const items = order.items || [];
    const dateStr = new Date(order.created_at).toLocaleDateString('fr-FR');
    const numberCleaned = invoiceId.replace('INV-', '');

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.contentContainer}>

                    {/* HEADER */}
                    <View style={styles.headerContainer}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.companyName}>YELELE DIGIT MARK SARL</Text>
                            <Text style={styles.companyAddress}>12498 Bonabéri, Face DK Hotel</Text>
                            <Text style={styles.companyAddress}>Douala, Cameroun</Text>
                            <Text style={styles.companyAddress}>+237 6 98 08 31 74 / +237 6 82 22 77 91</Text>
                            <Text style={styles.companyAddress}>yeleledigitmark@yahoo.fr</Text>
                        </View>

                        <View style={styles.headerCenter}>
                            <Image src={logoBase64 || "/logo.png"} style={styles.headerLogo} />
                        </View>

                        <View style={styles.headerRight}>
                            <Text style={styles.invoiceTitle}>FACTURE</Text>
                            <Text style={styles.invoiceNumber}>N° CMD-{numberCleaned}</Text>
                            <View style={styles.dateContainer}>
                                <Text style={styles.dateLabel}>Date d'émission</Text>
                                <Text style={styles.dateValue}>{dateStr}</Text>
                            </View>
                        </View>
                    </View>

                    {/* META INFO */}
                    <View style={styles.metaContainer}>
                        <View style={styles.clientBox}>
                            <Text style={styles.sectionTitle}>Facturé à</Text>
                            <Text style={styles.boldText}>{customer?.company_name || customer?.name || "Client Inconnu"}</Text>
                            {customer?.company_name && customer?.name && <Text style={styles.grayText}>{customer?.name}</Text>}
                            <Text style={styles.grayText}>{customer?.address || "Aucune adresse renseignée"}</Text>
                            {customer?.phone && <Text style={styles.grayText}>{customer?.phone}</Text>}
                        </View>

                        <View style={styles.clientBox}>
                            <Text style={styles.sectionTitle}>Détails additionnels</Text>
                            <Text style={styles.grayText}>NUI : {customer?.niu || "-"}</Text>
                            <Text style={styles.grayText}>RC : {customer?.rc || "-"}</Text>
                            {customer?.email && <Text style={styles.grayText}>Email : {customer?.email}</Text>}
                        </View>
                    </View>

                    {/* TABLE */}
                    <View style={styles.table}>
                        {/* Header */}
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <View style={styles.tableColHeaderDesc}>
                                <Text style={styles.tableColTitle}>PRODUIT</Text>
                            </View>
                            <View style={styles.tableColHeaderNum}>
                                <Text style={styles.tableColTitleNum}>PRIX UNIT.</Text>
                            </View>
                            <View style={styles.tableColHeaderNum}>
                                <Text style={styles.tableColTitleNum}>QTE</Text>
                            </View>
                            <View style={styles.tableColHeaderTotal}>
                                <Text style={styles.tableColTitleNum}>TOTAL</Text>
                            </View>
                        </View>

                        {/* Rows */}
                        {items.map((item, i) => (
                            <View style={styles.tableRow} key={i}>
                                <View style={styles.tableColRowDesc}>
                                    <Text style={styles.tableCell}>
                                        {item.product?.name || `Produit #${item.product_id}`}
                                        {item.product?.unit ? ` (${item.product.unit})` : ''}
                                    </Text>
                                </View>
                                <View style={styles.tableColRowNum}>
                                    <Text style={styles.tableCellNum}>{formatPrice(item.unit_price)}</Text>
                                </View>
                                <View style={styles.tableColRowNum}>
                                    <Text style={styles.tableCellNum}>{item.quantity}</Text>
                                </View>
                                <View style={styles.tableColRowTotal}>
                                    <Text style={styles.tableCellNum}>{formatPrice((item.quantity * item.unit_price))}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* TOTALS */}
                    <View style={styles.totalsContainer}>
                        <View>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalTitle}>Total TTC</Text>
                                <Text style={styles.totalAmount}>{formatPrice(order.total_amount)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* AMOUNT IN WORDS */}
                    <View>
                        <Text style={styles.amountInWords}>
                            Arrêtée à la somme de {montantLettres(order.total_amount)} Francs CFA.
                        </Text>
                    </View>

                    {/* CACHET */}
                    <View style={styles.signatureContainer}>
                        <View style={styles.cachet}>
                            <Text style={styles.cachetText}>Cachet & Signature</Text>
                        </View>
                        <Text style={styles.cachetTitle}>La Direction</Text>
                    </View>

                </View>

                {/* FIXED FOOTER */}
                <View style={styles.footerContainer} fixed>
                    <View style={styles.footerColumns}>

                        {/* Left Column */}
                        <View style={styles.footerLeft}>
                            <Text style={styles.footerCompanyTitle}>YELELE DIGIT MARK SARL</Text>
                            <Text style={styles.footerTextLight}>NUI : M032118534812X</Text>
                            <Text style={styles.footerTextLight}>RCCM : RC/DLA/2021/B/1417</Text>

                            <View style={{ marginTop: 6 }} />

                            <View style={styles.footerContactRow}>
                                <View style={styles.footerIconWrapper}>
                                    <Text style={styles.footerIconText}>T</Text>
                                </View>
                                <Text style={styles.footerContactTextWhite}>+237 652 15 76 57</Text>
                            </View>

                            <View style={styles.footerContactRow}>
                                <View style={styles.footerIconWrapper}>
                                    <Text style={styles.footerIconText}>@</Text>
                                </View>
                                <Text style={styles.footerContactTextLight}>yeleledigitmark@yahoo.fr</Text>
                            </View>
                        </View>

                        {/* Right Column (Banking Elements) */}
                        <View style={styles.footerRight}>
                            <Text style={styles.bankTitle}>DÉTAILS BANCAIRES</Text>
                            <View style={styles.bankLine} />

                            <View style={styles.bankRow}>
                                <Text style={styles.bankLabel}>Intitulé :</Text>
                                <Text style={styles.bankValueWhite}>YELELE DIGIT MARK SARL</Text>
                            </View>

                            <View style={styles.bankRow}>
                                <Text style={styles.bankLabel}>N° Compte :</Text>
                                <Text style={styles.bankValueOrange}>00271578301</Text>
                            </View>

                            <View style={styles.bankRow}>
                                <Text style={styles.bankLabel}>Code guichet :</Text>
                                <View style={styles.bankPill}>
                                    <Text style={styles.bankPillText}>10035</Text>
                                </View>
                            </View>

                            <View style={styles.bankRow}>
                                <Text style={styles.bankLabel}>Code banque :</Text>
                                <View style={styles.bankPill}>
                                    <Text style={styles.bankPillText}>10039</Text>
                                </View>
                            </View>
                        </View>

                    </View>

                    <View style={styles.footerBottom}>
                        <Text style={styles.footerBottomText}>COOKIES BY YELELE</Text>
                    </View>
                </View>

            </Page>
        </Document>
    );
}
