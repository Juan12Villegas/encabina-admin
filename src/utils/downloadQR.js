import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Descarga un código QR como PDF.
 * @param {string} djName - El nombre del DJ para el nombre del archivo.
 * @param {string} djId - El ID del DJ (no se usa actualmente pero se mantiene por compatibilidad).
 * @param {HTMLElement} qrElement - El elemento que contiene el QR.
 * @param {number} size - Tamaño del QR en el PDF (en px).
 */
export const downloadQRCodeAsPDF = (djName, djId, qrElement, size = 100) => {
    if (!qrElement) return;

    html2canvas(qrElement).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF();
        pdf.text("Código QR de tu perfil", 10, 10);
        pdf.addImage(imgData, "PNG", 10, 20, size, size); // Usamos el tamaño proporcionado
        pdf.save(`QR_${djName}.pdf`);
    });
};