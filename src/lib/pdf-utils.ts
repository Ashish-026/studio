import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const downloadPdf = async (elementOrId: HTMLElement | string, fileName: string) => {
  const element = typeof elementOrId === 'string' 
    ? document.getElementById(elementOrId) 
    : elementOrId;

  if (!element) {
    console.error(`Element for PDF generation not found.`);
    return;
  }

  const printContainer = document.createElement('div');
  printContainer.style.position = 'absolute';
  printContainer.style.left = '-9999px';
  printContainer.style.top = '0px';

  const clonedInput = element.cloneNode(true) as HTMLElement;
  clonedInput.style.width = '1200px';
  clonedInput.style.background = 'white';
  
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
    const imgWidth = pdfWidth - 20;
    const imgHeight = imgWidth / ratio;
    
    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= (pdfHeight - 20);

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
      document.body.removeChild(printContainer);
  }
};
