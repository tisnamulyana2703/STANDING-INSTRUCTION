import html2pdf from 'html2pdf.js';

export interface PrintMarginOptions {
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
}

export async function exportToPdf(
  elementId: string, 
  filename: string, 
  margins?: PrintMarginOptions
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found.`);
  }

  const top = margins?.marginTop ?? 5;
  const bottom = margins?.marginBottom ?? 5;
  const left = margins?.marginLeft ?? 5;
  const right = margins?.marginRight ?? 5;

  const opt = {
    margin: [top, left, bottom, right] as [number, number, number, number],
    filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
    },
    jsPDF: {
      unit: 'mm' as const,
      format: 'a4' as const,
      orientation: 'portrait' as const,
    },
  };

  return html2pdf().set(opt).from(element).save();
}

export function printDocument(elementId: string, margins?: PrintMarginOptions): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const top = margins?.marginTop ?? 10;
  const bottom = margins?.marginBottom ?? 10;
  const left = margins?.marginLeft ?? 12;
  const right = margins?.marginRight ?? 12;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Document - Standing Instruction</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page {
            size: A4 portrait;
            margin: ${top}mm ${right}mm ${bottom}mm ${left}mm;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            font-family: serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #standing-instruction-document {
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @media print {
            body {
              padding: 0;
            }
            #standing-instruction-document {
              border: none !important;
              box-shadow: none !important;
              width: 100% !important;
            }
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
        <script>
          setTimeout(() => {
            window.print();
            window.close();
          }, 500);
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
