import html2pdf from 'html2pdf.js';

interface ExportPdfOptions {
  elementId: string;
  personName: string;
  cycleLabel: string;
}

export async function exportPageToPdf({ elementId, personName, cycleLabel }: ExportPdfOptions): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Không tìm thấy vùng nội dung để xuất PDF.');
  }

  // Format clean filename for phone/desktop
  const cleanPerson = personName.replace(/[^a-zA-Z0-9_ -]/g, '').trim() || 'NguoiDung';
  const cleanCycle = cycleLabel.replace(/[^a-zA-Z0-9_-]/g, '_').trim() || 'ChuKy';
  const filename = `NganSach_${cleanPerson}_${cleanCycle}.pdf`;

  // Configuration optimized for mobile screens & standard A4 PDF pages
  const opt = {
    margin: [6, 6, 6, 6] as [number, number, number, number], // [top, left, bottom, right] in mm
    filename: filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2, // High resolution crisp text rendering
      useCORS: true,
      logging: false,
      backgroundColor: '#f8fafc', // Clean slate bg
      windowWidth: 800, // Fixed width virtual viewport so mobile layout scales gracefully into A4
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait' as const,
      compress: true,
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] as const },
  };

  try {
    // Add print mode temporary class
    document.body.classList.add('pdf-exporting');
    
    // Generate and download PDF
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('Lỗi xuất PDF qua html2pdf:', error);
    // Fallback to browser native print/save as PDF
    window.print();
  } finally {
    document.body.classList.remove('pdf-exporting');
  }
}
