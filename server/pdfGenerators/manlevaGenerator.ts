import jsPDF from 'jspdf';

interface ManlevaData {
  employeeName: string;
  employeeAddress?: string;
  pcModel: string;
  pcSerial: string;
  assignmentDate: string;
  location: string;
}

export function generateManlevaPDF(data: ManlevaData): Buffer {
  const doc = new jsPDF();
  
  // Margini e posizioni
  const leftMargin = 20;
  const rightMargin = 190;
  const lineHeight = 7;
  let currentY = 40;

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSEGNAZIONE PERSONAL COMPUTER AZIENDALE', leftMargin, currentY);
  currentY += lineHeight * 2;

  // Destinatario
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Egregio/Gentile Sig.', leftMargin, currentY);
  currentY += lineHeight;

  doc.setFont('helvetica', 'bold');
  doc.text(data.employeeName.toUpperCase(), leftMargin, currentY);
  currentY += lineHeight * 2;

  if (data.employeeAddress) {
    doc.setFont('helvetica', 'normal');
    doc.text(data.employeeAddress, leftMargin, currentY);
    currentY += lineHeight * 2;
  }

  // Oggetto
  doc.setFont('helvetica', 'bold');
  doc.text('OGGETTO: Assegnazione del Personal Computer aziendale', leftMargin, currentY);
  currentY += lineHeight * 2;

  // Corpo della lettera
  doc.setFont('helvetica', 'normal');
  const bodyText = [
    `Formuliamo la presente per assegnarle il Computer aziendale, modello ${data.pcModel}`,
    `SN ${data.pcSerial}.`,
    '',
    'Il computer deve essere utilizzato unicamente per fini aziendali/lavorativi.',
    '',
    'L\'assegnazione del computer è funzionale e strettamente correlata alle mansioni',
    'e al ruolo ricoperto; pertanto, in caso di modifica delle attività svolte,',
    'l\'Azienda si riserva la facoltà di revocare tale assegnazione.',
    '',
    'Il computer deve essere utilizzato secondo i canoni di diligenza e deve essere',
    'riconsegnato, ove richiesto, nelle condizioni in cui è stato assegnato,',
    'ad eccezione della normale usura.'
  ];

  bodyText.forEach(line => {
    doc.text(line, leftMargin, currentY, { maxWidth: rightMargin - leftMargin });
    currentY += lineHeight;
  });

  currentY += lineHeight * 3;

  // Data e firme
  doc.text(`${data.location}, ${data.assignmentDate}`, leftMargin, currentY);
  currentY += lineHeight * 3;

  doc.text('Il Datore di lavoro', leftMargin + 100, currentY);
  currentY += lineHeight * 3;

  doc.text('_____________________________________', leftMargin + 80, currentY);
  currentY += lineHeight * 3;

  doc.text('Il Lavoratore/La Lavoratrice per ricevuta', leftMargin + 80, currentY);
  currentY += lineHeight * 2;

  doc.text('________________________________________', leftMargin + 80, currentY);

  return Buffer.from(doc.output('arraybuffer'));
}