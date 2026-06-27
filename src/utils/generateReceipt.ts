import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Toast } from "react-native-toast-message/lib/src/Toast";

export const amountToWords = (num: number): string => {
    if (num === 0) return "Zero Only";
    const a = [
        "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
        "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
    ];
    const b = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    ];
    const numStr = num.toString();
    if (numStr.length > 9) return "Overflow";
    const n = ("000000000" + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return "";
    let str = "";
    str += n[1] != "00" ? (a[Number(n[1])] || b[Number(n[1][0])] + " " + a[Number(n[1][1])]) + "Crore " : "";
    str += n[2] != "00" ? (a[Number(n[2])] || b[Number(n[2][0])] + " " + a[Number(n[2][1])]) + "Lakh " : "";
    str += n[3] != "00" ? (a[Number(n[3])] || b[Number(n[3][0])] + " " + a[Number(n[3][1])]) + "Thousand " : "";
    str += n[4] != "0" ? (a[Number(n[4])] || b[Number(n[4][0])] + " " + a[Number(n[4][1])]) + "Hundred " : "";
    str += n[5] != "00" ? (str != "" ? "and " : "") + (a[Number(n[5])] || b[Number(n[5][0])] + " " + a[Number(n[5][1])]) + "Only" : "Only";
    return str.trim();
};

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString("en-IN")}.00`;

export const generateSemesterReceipt = async (
    plan: any,
    sem: any,
    profile: any,
    summary: any[]
) => {
    try {
        const receiptNo = `REC-${new Date().getFullYear()}${new Date().getMonth() + 1}-${Math.floor(1000 + Math.random() * 9000)}`;
        const dateStr = new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

        const successfulTxns = summary?.filter(
            (tx) => tx.status.toLowerCase() === "success" || tx.status.toLowerCase() === "succeeded" || tx.status.toLowerCase() === "paid"
        ) || [];

        const componentsHtml = plan?.components?.map((comp: any) => `
            <tr>
                <td>${comp.label}</td>
                <td class="right">${formatCurrency(comp.amount)}</td>
            </tr>
        `).join('') || '';

        const gstHtml = plan?.gstAmount > 0 ? `
            <tr>
                <td>GST (${plan.gstPercent}%)</td>
                <td class="right">${formatCurrency(plan.gstAmount)}</td>
            </tr>
        ` : '';

        const transactionsHtml = successfulTxns.length === 0 ? `
            <p style="color: #64748b; font-style: italic; font-size: 13px; margin: 15px;">No successful transactions found for this account.</p>
        ` : `
            <table>
                <thead>
                    <tr>
                        <th style="border-bottom: 2px solid #cbd5e1;">Date</th>
                        <th style="border-bottom: 2px solid #cbd5e1;">Transaction ID</th>
                        <th style="border-bottom: 2px solid #cbd5e1;">Mode</th>
                        <th class="right" style="border-bottom: 2px solid #cbd5e1;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${successfulTxns.map((tx: any) => `
                        <tr>
                            <td>${tx.paidOn || tx.createdAt}</td>
                            <td>${tx.gatewayTransactionId || tx.id}</td>
                            <td>${tx.paymentMode || "Online"}</td>
                            <td class="right">${formatCurrency(tx.paidAmount)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
                body {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    color: #1e293b;
                    margin: 0;
                    padding: 30px;
                }
                .header-container {
                    display: flex;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .logo-placeholder {
                    width: 70px;
                    height: 70px;
                    background-color: #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #94a3b8;
                    font-size: 14px;
                    font-weight: bold;
                    margin-right: 20px;
                }
                .header-text h1 {
                    margin: 0 0 5px 0;
                    font-size: 28px;
                    color: #1e293b;
                }
                .header-text p {
                    margin: 0;
                    font-size: 12px;
                    color: #64748b;
                    line-height: 1.4;
                }
                .title-band {
                    background-color: #3b82f6;
                    color: white;
                    text-align: center;
                    padding: 12px;
                    font-size: 18px;
                    font-weight: bold;
                    letter-spacing: 1px;
                    margin-bottom: 25px;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .info-col {
                    display: grid;
                    grid-template-columns: 100px 1fr;
                    gap: 5px;
                    font-size: 13px;
                }
                .info-label {
                    font-weight: bold;
                    color: #1e293b;
                }
                .info-value {
                    color: #334155;
                }
                .status-badge {
                    font-weight: bold;
                    color: ${sem?.status === 'PAID' ? '#10b981' : sem?.status === 'PARTIAL' ? '#f59e0b' : '#ef4444'};
                }
                .section-title {
                    background-color: #f1f5f9;
                    padding: 10px 15px;
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    font-size: 13px;
                }
                th, td {
                    padding: 8px 15px;
                    text-align: left;
                    border-bottom: 1px solid #e2e8f0;
                }
                th.right, td.right {
                    text-align: right;
                }
                .subtotal-row {
                    font-weight: bold;
                    background-color: #f8fafc;
                }
                .summary-section {
                    margin-top: 30px;
                    display: flex;
                    justify-content: space-between;
                }
                .words-amount {
                    font-size: 12px;
                }
                .words-amount .label {
                    color: #64748b;
                    margin-bottom: 5px;
                }
                .words-amount .value {
                    font-weight: bold;
                    color: #1e293b;
                }
                .totals-box {
                    width: 250px;
                }
                .total-line {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 14px;
                    font-weight: bold;
                }
                .total-paid { color: #10b981; }
                .total-due { color: #ef4444; }
                .footer {
                    margin-top: 60px;
                    text-align: center;
                    font-size: 10px;
                    color: #94a3b8;
                }
                .signature {
                    text-align: right;
                    margin-top: 40px;
                    margin-bottom: 20px;
                }
                .signature-line {
                    display: inline-block;
                    width: 150px;
                    border-top: 1px solid #cbd5e1;
                    padding-top: 5px;
                    font-size: 12px;
                    color: #1e293b;
                }
            </style>
        </head>
        <body>
            <div class="header-container">
                <div class="logo-placeholder">LOGO</div>
                <div class="header-text">
                    <h1>GKElite Info</h1>
                    <p>360B Meridian Plaza, Ameerpet, Hyderabad - 560001<br>
                    Email: accounts@college.edu | Phone: +91 98765 43210</p>
                </div>
            </div>

            <div class="title-band">FEE PAYMENT RECEIPT</div>

            <div class="info-grid">
                <div class="info-col">
                    <div class="info-label">Student Name:</div>
                    <div class="info-value">${profile?.name?.toUpperCase() || "NOT PROVIDED"}</div>
                    
                    <div class="info-label">Roll / Reg No:</div>
                    <div class="info-value">${profile?.rollNo?.toUpperCase() || "NOT PROVIDED"}</div>
                    
                    <div class="info-label">Program:</div>
                    <div class="info-value">${plan?.programName || "N/A"}</div>
                    
                    <div class="info-label">Semester:</div>
                    <div class="info-value">${sem?.localSemesterName || ('Semester ' + sem?.semesterNumber)}</div>
                </div>
                <div class="info-col" style="grid-template-columns: 80px 1fr;">
                    <div class="info-label">Receipt No:</div>
                    <div class="info-value">${receiptNo}</div>
                    
                    <div class="info-label">Date:</div>
                    <div class="info-value">${dateStr}</div>
                    
                    <div class="info-label">Status:</div>
                    <div class="info-value status-badge">${sem?.status}</div>
                </div>
            </div>

            <div class="section-title" style="display: flex; justify-content: space-between;">
                <span>Fee Particulars</span>
                <span>Amount</span>
            </div>
            <table>
                ${componentsHtml}
                ${gstHtml}
                <tr class="subtotal-row">
                    <td class="right">Total Required Fee:</td>
                    <td class="right">${formatCurrency(sem?.requiredAmount || 0)}</td>
                </tr>
            </table>

            <div class="section-title">Transaction Details (Successful Payments)</div>
            ${transactionsHtml}

            <div class="summary-section">
                <div class="words-amount">
                    <div class="label">Amount in Words (Total Paid):</div>
                    <div class="value">Rupees ${amountToWords(sem?.paidAmount || 0)}</div>
                </div>
                <div class="totals-box">
                    <div class="total-line">
                        <span>Total Amount Paid:</span>
                        <span class="total-paid">${formatCurrency(sem?.paidAmount || 0)}</span>
                    </div>
                    <div class="total-line">
                        <span>Balance Due:</span>
                        <span class="total-due">${formatCurrency(sem?.pendingAmount || 0)}</span>
                    </div>
                </div>
            </div>

            <div class="signature">
                <div class="signature-line">Authorized Signatory</div>
            </div>

            <div class="footer">
                This is a system generated receipt and does not require a physical signature.
            </div>
        </body>
        </html>
        `;

        // Generate PDF
        const { uri } = await Print.printToFileAsync({
            html: htmlContent,
            base64: false
        });

        // Open sharing dialog
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
            await Sharing.shareAsync(uri, {
                UTI: '.pdf',
                mimeType: 'application/pdf',
                dialogTitle: 'Download Fee Receipt'
            });
        } else {
            Toast.show({
                type: 'error',
                text1: 'Sharing Not Available',
                text2: 'Cannot share or save the file on this device.'
            });
        }
    } catch (error: any) {
        console.error("Failed to generate receipt:", error);
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to generate receipt.'
        });
    }
};
