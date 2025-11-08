import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const downloadPdf = async (elementId: string, fileName: string) => {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }

  // Define a print-specific container
  const printContainer = document.createElement('div');
  printContainer.style.position = 'absolute';
  printContainer.style.left = '-9999px'; // Position off-screen
  
  // Clone the original element to avoid altering the live DOM
  const clonedInput = input.cloneNode(true) as HTMLElement;
  clonedInput.style.width = '1200px'; // A fixed, wider width for better layout in PDF
  clonedInput.style.background = 'white'; // Ensure background is not transparent
  
  printContainer.appendChild(clonedInput);
  document.body.appendChild(printContainer);


  try {
    const canvas = await html2canvas(clonedInput, {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: clonedInput.scrollWidth,
      windowHeight: clonedInput.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    const ratio = canvasWidth / canvasHeight;
    const imgWidth = pdfWidth - 20; // 10mm margin on each side
    const imgHeight = imgWidth / ratio;
    
    let heightLeft = imgHeight;
    let position = 10; // Top margin

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= (pdfHeight - 20); // 10mm top and bottom margin

    while (heightLeft > 0) {
        position = -heightLeft - 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
    }
    
    pdf.save(`${fileName}.pdf`);

  } catch (error) {
    console.error("Error generating PDF:", error);
  } finally {
      // Clean up the cloned element from the DOM
      document.body.removeChild(printContainer);
  }
};
