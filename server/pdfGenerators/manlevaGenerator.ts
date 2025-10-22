import PDFDocument from 'pdfkit';

interface ManlevaData {
  employeeName: string;
  employeeAddress?: string;
  employeeCompany?: string;
  pcModel: string;
  pcSerial: string;
  assignmentDate: string;
  location: string;
}

export function generateManlevaPDF(data: ManlevaData): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 60, bottom: 60, left: 60, right: 60 }
  });
  const buffers: Buffer[] = [];

  doc.on('data', buffers.push.bind(buffers));

  // Margini e posizioni - A4 standard
  const leftMargin = 60;
  const rightMargin = 540;
  const pageWidth = 595; // A4 width
  const pageHeight = 842; // A4 height
  const bottomMargin = 100; // Spazio riservato per firme
  const lineHeight = 15;
  let currentY = 80;

  // Helper function per gestire overflow pagina
  const checkPageBreak = (neededSpace: number) => {
    if (currentY + neededSpace > pageHeight - bottomMargin) {
      doc.addPage();
      currentY = 60; // Reset Y position
      return true;
    }
    return false;
  };

  // Header - Centrato perfettamente
  doc.fontSize(18).font('Helvetica-Bold');
  const companyHeader = data.employeeCompany || 'MAORI GROUP S.R.L.';
  const companyWidth = doc.widthOfString(companyHeader);
  doc.text(companyHeader, (pageWidth - companyWidth) / 2, currentY);
  currentY += lineHeight * 1.5;

  doc.fontSize(16).font('Helvetica-Bold');
  const titleText = 'ASSEGNAZIONE ASSET AZIENDALE';
  const titleWidth = doc.widthOfString(titleText);
  doc.text(titleText, (pageWidth - titleWidth) / 2, currentY);
  currentY += lineHeight * 2;

  // Destinatario - Ben formattato
  checkPageBreak(lineHeight * 4);
  doc.fontSize(12).font('Helvetica');
  doc.text('Egregio/Gentile Sig.', leftMargin, currentY);
  currentY += lineHeight;

  doc.fontSize(14).font('Helvetica-Bold');
  doc.text(data.employeeName.toUpperCase(), leftMargin, currentY);
  currentY += lineHeight * 1.5;

  if (data.employeeAddress) {
    doc.fontSize(11).font('Helvetica');
    doc.text(data.employeeAddress, leftMargin, currentY);
    currentY += lineHeight * 1.5;
  }

  // Oggetto - Ben evidenziato
  currentY += lineHeight;
  checkPageBreak(lineHeight * 2);
  doc.fontSize(12).font('Helvetica-Bold');
  doc.text('OGGETTO: Assegnazione Asset aziendale', leftMargin, currentY);
  currentY += lineHeight * 1.5;

  // Corpo della lettera - Ben formattato
  doc.fontSize(11).font('Helvetica');

  // Paragrafo iniziale
  currentY += lineHeight * 0.5;
  checkPageBreak(lineHeight * 3);
  const paragraph1 = `Formuliamo la presente per assegnarle l'asset aziendale, modello ${data.pcModel} SN ${data.pcSerial}.`;
  doc.text(paragraph1, leftMargin, currentY, { width: rightMargin - leftMargin, align: 'left' });
  currentY += doc.heightOfString(paragraph1, { width: rightMargin - leftMargin }) + 10;

  // Paragrafo 1
  checkPageBreak(lineHeight * 2);
  const paragraph2 = 'L\'asset deve essere utilizzato unicamente per fini aziendali/lavorativi.';
  doc.text(paragraph2, leftMargin, currentY, { width: rightMargin - leftMargin, align: 'left' });
  currentY += doc.heightOfString(paragraph2, { width: rightMargin - leftMargin }) + 10;

  // Paragrafo 2
  checkPageBreak(lineHeight * 4);
  const paragraph3 = 'L\'assegnazione dell\'asset è funzionale e strettamente correlata alle mansioni e al ruolo ricoperto; pertanto, in caso di modifica delle attività svolte, l\'Azienda si riserva la facoltà di revocare tale assegnazione.';
  doc.text(paragraph3, leftMargin, currentY, { width: rightMargin - leftMargin, align: 'left' });
  currentY += doc.heightOfString(paragraph3, { width: rightMargin - leftMargin }) + 10;

  // Paragrafo 3
  checkPageBreak(lineHeight * 4);
  const paragraph4 = 'L\'asset deve essere utilizzato secondo i canoni di diligenza e deve essere riconsegnato, ove richiesto, nelle condizioni in cui è stato assegnato, ad eccezione della normale usura.';
  doc.text(paragraph4, leftMargin, currentY, { width: rightMargin - leftMargin, align: 'left' });
  currentY += doc.heightOfString(paragraph4, { width: rightMargin - leftMargin }) + 10;

  // Lista impegni
  currentY += lineHeight;
  checkPageBreak(lineHeight * 8);
  doc.font('Helvetica-Bold');
  doc.text('Il dipendente si impegna a:', leftMargin, currentY);
  currentY += lineHeight;

  doc.font('Helvetica');
  const commitments = [
    '• Utilizzare l\'asset esclusivamente per attività lavorative',
    '• Mantenere la riservatezza delle informazioni aziendali',
    '• Non installare software non autorizzato',
    '• Segnalare immediatamente eventuali malfunzionamenti',
    '• Restituire l\'asset al termine del rapporto di lavoro o su richiesta'
  ];

  commitments.forEach(commitment => {
    checkPageBreak(lineHeight * 2);
    doc.text(commitment, leftMargin + 20, currentY);
    currentY += lineHeight * 1.3;
  });

  currentY += lineHeight * 2;

  // Assicurati che ci sia spazio per firme, altrimenti nuova pagina
  if (currentY > pageHeight - 180) {
    doc.addPage();
    currentY = 60;
  }

  // Data e firme
  doc.fontSize(11).font('Helvetica');
  doc.text(`${data.location}, ${data.assignmentDate}`, leftMargin, currentY);
  currentY += lineHeight * 3;

  // Sezione firme - Layout a due colonne
  const signatureY = currentY;

  // Colonna sinistra - Datore di lavoro
  doc.text('Il Datore di lavoro', leftMargin, signatureY);
  doc.text('_____________________________________', leftMargin, signatureY + lineHeight * 2);

  // Colonna destra - Lavoratore
  const rightColumnX = leftMargin + 250;
  doc.text('Il Lavoratore/La Lavoratrice', rightColumnX, signatureY);
  doc.text('________________________________________', rightColumnX, signatureY + lineHeight * 2);

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
  });
}
