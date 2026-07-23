import html2pdf from 'html2pdf.js';

export interface PrintMarginOptions {
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
}

function convertOklchToRgb(str: string): string {
  if (!str || typeof str !== 'string' || !str.includes('oklch')) return str;

  return str.replace(/oklch\(([^)]+)\)/gi, (match, p1) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#123456';
        ctx.fillStyle = match;
        if (ctx.fillStyle && ctx.fillStyle !== '#123456' && !ctx.fillStyle.includes('oklch')) {
          return ctx.fillStyle;
        }
      }

      // Parse lightness (L) from oklch(L C H ...)
      const parts = p1.trim().split(/\s+/);
      let lightness = 0.5;
      if (parts[0]) {
        lightness = parts[0].endsWith('%') ? parseFloat(parts[0]) / 100 : parseFloat(parts[0]);
      }

      if (lightness >= 0.88) return '#f3f4f6'; // Light background
      if (lightness >= 0.70) return '#e5e7eb'; // Border / light gray
      if (lightness <= 0.35) return '#111827'; // Dark text / bg
      return '#4b5563'; // Medium text
    } catch {
      return '#000000';
    }
  });
}

export async function exportToPdf(
  elementId: string, 
  filename: string, 
  _margins?: PrintMarginOptions
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found.`);
  }

  const opt = {
    margin: [0, 0, 0, 0] as [number, number, number, number],
    filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      onclone: (clonedDoc: Document) => {
        // Remove outer borders/shadows on target element so it fits cleanly on A4 canvas
        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          clonedEl.style.boxShadow = 'none';
          clonedEl.style.border = 'none';
          clonedEl.style.margin = '0 auto';
        }

        // 1. Sanitize all <style> tags in the cloned document containing oklch
        const styleTags = clonedDoc.querySelectorAll('style');
        styleTags.forEach((styleTag) => {
          if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
            styleTag.textContent = convertOklchToRgb(styleTag.textContent);
          }
        });

        // 2. Sanitize inline styles & computed styles on all elements
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (!htmlEl.style) return;

          const styleAttr = htmlEl.getAttribute('style');
          if (styleAttr && styleAttr.includes('oklch')) {
            htmlEl.setAttribute('style', convertOklchToRgb(styleAttr));
          }

          try {
            const computed = window.getComputedStyle(htmlEl);
            const props = ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'fill', 'stroke'];
            props.forEach((prop) => {
              const val = computed.getPropertyValue(prop);
              if (val && val.includes('oklch')) {
                htmlEl.style.setProperty(prop, convertOklchToRgb(val), 'important');
              }
            });
          } catch {
            // Ignore computed style errors
          }
        });
      },
    },
    jsPDF: {
      unit: 'mm' as const,
      format: 'a4' as const,
      orientation: 'portrait' as const,
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
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
