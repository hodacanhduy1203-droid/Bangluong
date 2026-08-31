import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface ExportPdfOptions {
  elementId: string;
  personName: string;
  cycleLabel: string;
  customFileName?: string;
}

export async function exportPageToPdf({ elementId, personName, cycleLabel, customFileName }: ExportPdfOptions): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Không tìm thấy vùng nội dung để xuất PDF.');
  }

  // Format clean filename for phone/desktop
  let filename = '';
  if (customFileName && customFileName.trim()) {
    let clean = customFileName.trim();
    if (!clean.toLowerCase().endsWith('.pdf')) {
      clean += '.pdf';
    }
    filename = clean;
  } else {
    const cleanPerson = personName.replace(/[^a-zA-Z0-9_ -]/g, '').trim() || 'NguoiDung';
    const cleanCycle = cycleLabel.replace(/[^a-zA-Z0-9_-]/g, '_').trim() || 'ChuKy';
    filename = `NganSach_${cleanPerson}_${cleanCycle}.pdf`;
  }

  try {
    // Add print mode temporary class
    document.body.classList.add('pdf-exporting');

    // Small delay to allow CSS transitions or hidden elements to settle
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Render using html-to-image which captures modern CSS3/CSS4, Tailwind colors (oklch), gradients, shadows natively
    const canvas = await toCanvas(element, {
      filter: (node: HTMLElement) => {
        if (node.classList && (node.classList.contains('no-print') || node.getAttribute?.('data-no-print') === 'true')) {
          return false;
        }
        return true;
      },
      pixelRatio: 2,
      backgroundColor: '#f8fafc',
      cacheBust: true,
    });

    const marginMm = 6; // mm
    const pdfPageWidthMm = 210; // Standard A4 width in mm
    const printableWidthMm = pdfPageWidthMm - marginMm * 2; // 198 mm

    // Calculate exact height needed in mm to render all content continuously without page breaks
    const totalImgHeightMm = (canvas.height * printableWidthMm) / canvas.width;
    const totalPdfHeightMm = Math.max(totalImgHeightMm + marginMm * 2, 100);

    // Create a continuous single-page PDF with exact height
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfPageWidthMm, totalPdfHeightMm],
      compress: true,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.96);
    pdf.addImage(imgData, 'JPEG', marginMm, marginMm, printableWidthMm, totalImgHeightMm);

    // Save PDF directly to user's device
    pdf.save(filename);
  } catch (error) {
    console.error('Lỗi xuất PDF qua html-to-image/jsPDF:', error);
    // Fallback to browser native print
    window.print();
  } finally {
    document.body.classList.remove('pdf-exporting');
  }
}
