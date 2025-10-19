import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface LabelData {
  assetId: string;
  model: string;
  serialNumber: string;
}

export const HPEliteBookLabel: React.FC<LabelData> = ({ 
  assetId, 
  model, 
  serialNumber
}) => {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, assetId, {
        format: 'CODE128',
        width: 1.2,
        height: 50,
        displayValue: false,
        margin: 0
      });
    }
  }, [assetId]);

  return (
    <div style={{
      width: '70mm',
      height: '30mm',
      backgroundColor: '#e8e8e8',
      padding: '3mm',
      fontFamily: 'Arial, sans-serif',
      border: '1px solid #ccc',
      borderRadius: '6px',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      {/* Riga superiore: Asset ID */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: '2mm'
      }}>
        {/* Asset ID a destra */}
        <div style={{ 
          fontSize: '13px', 
          fontWeight: 'bold',
          lineHeight: '1.2'
        }}>
          Asset: {assetId}
        </div>
      </div>

      {/* Riga centrale: Barcode e Info */}
      <div style={{
        display: 'flex',
        gap: '4mm',
        flex: 1,
        alignItems: 'center'
      }}>
        {/* Barcode a sinistra */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '30mm'
        }}>
          <svg ref={barcodeRef}></svg>
        </div>

        {/* Info a destra */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '1.5mm'
        }}>
          <div style={{ 
            fontSize: '9px',
            lineHeight: '1.1',
            fontWeight: '500'
          }}>
            Model: {model}
          </div>
          
          <div style={{ 
            fontSize: '9px',
            lineHeight: '1.1'
          }}>
            S/N: {serialNumber}
          </div>
          
          {/* URL con icona SD */}
          <div style={{ 
            fontSize: '7px',
            lineHeight: '1.1',
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}>
            <div style={{
              fontSize: '8px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}>
              <span>SD</span>
              <div style={{
                width: '10px',
                height: '12px',
                border: '1.2px solid black',
                borderRadius: '1.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '5px',
                fontWeight: 'bold',
                backgroundColor: 'white'
              }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  lineHeight: '0.5',
                  letterSpacing: '-0.3px'
                }}>
                  <span>×</span>
                  <span>×</span>
                </div>
              </div>
            </div>
            <span>Ticket@maorigroup.it</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// CSS per la stampa (aggiungi nel tuo file CSS globale o component)
export const printStyles = `
  @media print {
    @page {
      size: 70mm 30mm;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
    }
    .no-print {
      display: none !important;
    }
  }
`;
