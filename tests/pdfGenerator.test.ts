import { generateManlevaPDF } from '../server/pdfGenerators/manlevaGenerator';

describe('Manleva PDF Generator', () => {
  it('should generate a PDF buffer', async () => {
    const testData = {
      employeeName: 'Mario Rossi',
      employeeAddress: 'Via Roma 123, Milano',
      employeeCompany: 'Maori Group',
      pcModel: 'HP EliteBook 840',
      pcSerial: 'ABC123456',
      assignmentDate: '22/10/2025',
      location: 'Siena'
    };

    const pdfBuffer = await generateManlevaPDF(testData);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);

    // Check PDF header
    const pdfHeader = pdfBuffer.toString('ascii', 0, 4);
    expect(pdfHeader).toBe('%PDF');
  });

  it('should handle missing optional fields', async () => {
    const testData = {
      employeeName: 'Luigi Verdi',
      pcModel: 'Dell Latitude 7490',
      pcSerial: 'XYZ789012',
      assignmentDate: '22/10/2025',
      location: 'Roma'
    };

    const pdfBuffer = await generateManlevaPDF(testData);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle long content without errors', async () => {
    const longText = 'Lorem ipsum dolor sit amet, '.repeat(50);

    const testData = {
      employeeName: longText,
      employeeAddress: longText,
      employeeCompany: 'Test Company',
      pcModel: 'Test Model',
      pcSerial: 'TEST123',
      assignmentDate: '22/10/2025',
      location: 'Test Location'
    };

    await expect(generateManlevaPDF(testData)).resolves.toBeInstanceOf(Buffer);
  });
});
