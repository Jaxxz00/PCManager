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
  const doc = new PDFDocument({ size: 'A4' });
  const buffers: Buffer[] = [];
  
  doc.on('data', buffers.push.bind(buffers));
  
  // Margini e posizioni - A4 standard
  const leftMargin = 60;
  const rightMargin = 540;
  const pageWidth = 595; // A4 width
  const lineHeight = 15; // Bilanciato per evitare sovrapposizioni ma contenere in 1-2 pagine
  let currentY = 80;

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
  doc.fontSize(12).font('Helvetica-Bold');
  doc.text('OGGETTO: Assegnazione Asset aziendale', leftMargin, currentY);
  currentY += lineHeight * 1.5;

  // Corpo della lettera - Ben formattato
  doc.fontSize(11).font('Helvetica');
  
  // Paragrafo iniziale
  currentY += lineHeight * 0.5;
  doc.text(`Formuliamo la presente per assegnarle l'asset aziendale, modello ${data.pcModel} SN ${data.pcSerial}.`, leftMargin, currentY, { width: rightMargin - leftMargin, align: 'left' });
  currentY += lineHeight * 1.8; // Bilanciato

  // Paragrafo 1
  doc.text('L\'asset deve essere utilizzato unicamente per fini aziendali/lavorativi.', leftMargin, currentY, { width: rightMargin - leftMargin, align: 'left' });
  currentY += lineHeight * 1.8; // Bilanciato

  // Paragrafo 2
  doc.text('L\'assegnazione dell\'asset è funzionale e strettamente correlata alle mansioni e al ruolo ricoperto; pertanto, in caso di modifica delle attività svolte, l\'Azienda si riserva la facoltà di revocare tale assegnazione.', leftMargin, currentY, { width: rightMargin - leftMargin, align: 'left' });
  currentY += lineHeight * 1.8; // Bilanciato

  // Paragrafo 3
  doc.text('L\'asset deve essere utilizzato secondo i canoni di diligenza e deve essere riconsegnato, ove richiesto, nelle condizioni in cui è stato assegnato, ad eccezione della normale usura.', leftMargin, currentY, { width: rightMargin - leftMargin, align: 'left' });
  currentY += lineHeight * 1.8; // Bilanciato

  // Lista impegni
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
    doc.text(commitment, leftMargin + 20, currentY);
    currentY += lineHeight * 1.3; // Bilanciato
  });

  currentY += lineHeight * 2.5; // Bilanciato

  // Data e firme - Layout bilanciato
  doc.fontSize(11).font('Helvetica');
  doc.text(`${data.location}, ${data.assignmentDate}`, leftMargin, currentY);
  currentY += lineHeight * 2.5; // Bilanciato

  // Sezione firme - Layout bilanciato
  const signatureY = currentY;
  
  // Colonna sinistra - Datore di lavoro
  doc.text('Il Datore di lavoro', leftMargin, signatureY);
  currentY += lineHeight * 1.8; // Bilanciato
  doc.text('_____________________________________', leftMargin, currentY);
  currentY += lineHeight * 2.5; // Bilanciato

  // Colonna destra - Lavoratore
  const rightColumnX = leftMargin + 250;
  doc.text('Il Lavoratore/La Lavoratrice', rightColumnX, signatureY);
  currentY = signatureY + lineHeight * 1.8; // Bilanciato
  doc.text('________________________________________', rightColumnX, currentY);

  // Sezione ricevuta rimossa per mantenere 1-2 pagine

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
  });
}