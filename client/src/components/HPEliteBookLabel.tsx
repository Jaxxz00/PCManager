import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface LabelData {
  assetId: string;
  model: string;
  serialNumber: string;
  url?: string;
}

export const HPEliteBookLabel: React.FC<LabelData> = ({
  assetId,
  model,
  serialNumber,
  url = 'Ticket@maorigroup.it'
}) => {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, assetId, {
          format: 'CODE128',
          width: 1.2,
          height: 50,
          displayValue: false,
          margin: 0
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
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
      boxSizing: 'border-box',
      pageBreakAfter: 'always',
      pageBreakInside: 'avoid'
    }}>
      {/* Riga superiore: SD icon e Asset ID */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2mm'
      }}>
        {/* SD Icon a sinistra */}
        <div style={{
          fontSize: '11px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '3px'
        }}>
          <span>SD</span>
          <div style={{
            width: '14px',
            height: '18px',
            border: '1.5px solid black',
            borderRadius: '2px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '7px',
            fontWeight: 'bold',
            backgroundColor: 'white'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              lineHeight: '0.6',
              letterSpacing: '-0.5px'
            }}>
              <span>××</span>
              <span>××</span>
            </div>
          </div>
        </div>

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

          <div style={{
            fontSize: '7px',
            lineHeight: '1.1',
            wordBreak: 'break-all'
          }}>
            {url}
          </div>
        </div>
      </div>
    </div>
  );
};

// CSS per la stampa (aggiungi nel tuo file CSS globale o in un tag <style>)
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

// Esempio di utilizzo nel tuo progetto:
/*
import { HPEliteBookLabel } from './components/HPEliteBookLabel';

function App() {
  const pcData = {
    assetId: 'LL221048954',
    model: 'HP EliteBook 840 G8 Notebook PC',
    serialNumber: '5CG2433UU0'
    // url non necessario, usa il default 'Ticket@maorigroup.it'
  };

  return (
    <div>
      <HPEliteBookLabel {...pcData} />
      <button onClick={() => window.print()}>Stampa</button>
    </div>
  );
}
*/
