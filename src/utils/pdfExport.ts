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

    const marginMm = 8; // mm
    const pdfPageWidthMm = 210; // A4 width mm
    const pdfPageHeightMm = 297; // A4 height mm
    const printableWidthMm = pdfPageWidthMm - marginMm * 2; // 194 mm
    const printableHeightMm = pdfPageHeightMm - marginMm * 2; // 281 mm

    const totalImgHeightMm = (canvas.height * printableWidthMm) / canvas.width;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // If fits in single page
    if (totalImgHeightMm <= printableHeightMm) {
      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      pdf.addImage(imgData, 'JPEG', marginMm, marginMm, printableWidthMm, totalImgHeightMm);
    } else {
      // Multiple page pagination
      const pageHeightPx = Math.floor((printableHeightMm * canvas.width) / printableWidthMm);
      let remainingHeightPx = canvas.height;
      let currentSrcY = 0;
      let pageNum = 0;

      while (remainingHeightPx > 0) {
        if (pageNum > 0) {
          pdf.addPage();
        }

        const chunkHeightPx = Math.min(remainingHeightPx, pageHeightPx);

        // Render this slice onto a temporary canvas
        const chunkCanvas = document.createElement('canvas');
        chunkCanvas.width = canvas.width;
        chunkCanvas.height = chunkHeightPx;
        const ctx = chunkCanvas.getContext('2d');

        if (ctx) {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(0, 0, chunkCanvas.width, chunkCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            currentSrcY,
            canvas.width,
            chunkHeightPx,
            0,
            0,
            canvas.width,
            chunkHeightPx
          );

          const chunkImgData = chunkCanvas.toDataURL('image/jpeg', 0.96);
          const chunkHeightMm = (chunkHeightPx * printableWidthMm) / canvas.width;

          pdf.addImage(chunkImgData, 'JPEG', marginMm, marginMm, printableWidthMm, chunkHeightMm);
        }

        currentSrcY += chunkHeightPx;
        remainingHeightPx -= chunkHeightPx;
        pageNum++;
      }
    }

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
