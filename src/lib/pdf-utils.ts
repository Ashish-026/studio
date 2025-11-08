import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const downloadPdf = async (elementId: string, fileName: string) => {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }

  try {
    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    
    // a4 size [210mm x 297mm]
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;
    
    const width = pdfWidth - 20; // with some margin
    const height = width / ratio;

    pdf.addImage(imgData, 'PNG', 10, 10, width, height);
    pdf.save(`${fileName}.pdf`);

  } catch (error) {
    console.error("Error generating PDF:", error);
  }
};
