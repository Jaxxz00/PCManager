import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * Componente per il caricamento di file che si presenta come un pulsante e fornisce
 * un'interfaccia modale per la gestione dei file.
 * 
 * Caratteristiche:
 * - Si presenta come un pulsante personalizzabile che apre una modale di caricamento file
 * - Fornisce un'interfaccia modale per:
 *   - Selezione file
 *   - Anteprima file
 *   - Monitoraggio progresso caricamento
 *   - Visualizzazione stato caricamento
 * 
 * Il componente usa Uppy per gestire tutte le funzionalità di caricamento file.
 * Tutte le funzionalità di gestione file sono automaticamente gestite dalla modale Uppy dashboard.
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB di default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", (result) => {
        onComplete?.(result);
        setShowModal(false);
      })
  );

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName}>
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        locale={{
          strings: {
            // Traduzioni italiane
            addMoreFiles: 'Aggiungi più file',
            addingMoreFiles: 'Aggiungendo più file',
            allowAccessDescription: 'Per scattare foto o registrare video, consenti l\'accesso alla fotocamera per questo sito.',
            allowAccessTitle: 'Consenti accesso alla fotocamera',
            authenticateWith: 'Connettiti a %{pluginName}',
            authenticateWithTitle: 'Autenticati con %{pluginName} per selezionare i file',
            back: 'Indietro',
            browse: 'sfoglia',
            browseFiles: 'sfoglia file',
            cancel: 'Annulla',
            cancelUpload: 'Annulla caricamento',
            chooseFiles: 'Scegli file',
            closeModal: 'Chiudi modale',
            companionError: 'Connessione a Companion fallita',
            complete: 'Completato',
            connectedToInternet: 'Connesso a Internet',
            copyLink: 'Copia collegamento',
            copyLinkToClipboardFallback: 'Copia l\'URL qui sotto',
            copyLinkToClipboardSuccess: 'Collegamento copiato negli appunti',
            creatingAssembly: 'Preparando il caricamento...',
            creatingAssemblyFailed: 'Transloadit: Impossibile creare l\'Assembly',
            dashboardTitle: 'Caricatore File',
            dashboardWindowTitle: 'Finestra Caricatore File (Premi escape per chiudere)',
            dataUploadedOfTotal: '%{complete} di %{total}',
            done: 'Fatto',
            dropHereOr: 'Trascina file qui o %{browse}',
            dropHint: 'Trascina i tuoi file qui',
            dropPasteBoth: 'Trascina file qui, incolla o %{browse}',
            dropPasteFiles: 'Trascina file qui, incolla o %{browse}',
            dropPasteFolders: 'Trascina file qui, incolla o %{browse}',
            dropPasteImportBoth: 'Trascina file qui, incolla, %{browse} o importa da',
            dropPasteImportFiles: 'Trascina file qui, incolla, %{browse} o importa da',
            dropPasteImportFolders: 'Trascina file qui, incolla, %{browse} o importa da',
            editFile: 'Modifica file',
            editing: 'Modificando %{file}',
            emptyFolderAdded: 'Nessun file aggiunto dalla cartella vuota',
            encoding: 'Codificando...',
            enterCorrectUrl: 'URL non corretto: Assicurati di inserire un collegamento diretto a un file',
            enterUrlToImport: 'Inserisci URL per importare un file',
            exceedsSize: 'Questo file supera la dimensione massima consentita di %{size}',
            failedToFetch: 'Companion non è riuscito a recuperare questo URL, assicurati che sia corretto',
            failedToUpload: 'Caricamento di %{file} fallito',
            fileSource: 'Origine file: %{name}',
            filesUploadedOfTotal: {
              '0': '%{complete} di %{smart_count} file caricato',
              '1': '%{complete} di %{smart_count} file caricati'
            },
            filter: 'Filtra',
            finishEditingFile: 'Termina modifica file',
            folderAdded: {
              '0': 'Aggiunto %{smart_count} file da %{folder}',
              '1': 'Aggiunti %{smart_count} file da %{folder}'
            },
            import: 'Importa',
            importFrom: 'Importa da %{name}',
            loading: 'Caricando...',
            logOut: 'Disconnetti',
            myDevice: 'Il mio dispositivo',
            noFilesFound: 'Non hai file o cartelle qui',
            noInternetConnection: 'Nessuna connessione Internet',
            pause: 'Pausa',
            pauseUpload: 'Pausa caricamento',
            paused: 'In pausa',
            poweredBy: 'Offerto da %{uppy}',
            processingXFiles: {
              '0': 'Elaborando %{smart_count} file',
              '1': 'Elaborando %{smart_count} file'
            },
            removeFile: 'Rimuovi file',
            resetFilter: 'Ripristina filtro',
            resume: 'Riprendi',
            resumeUpload: 'Riprendi caricamento',
            retry: 'Riprova',
            retryUpload: 'Riprova caricamento',
            save: 'Salva',
            selectFileNamed: 'Seleziona file %{name}',
            showErrorDetails: 'Mostra dettagli errore',
            signInWithService: 'Accedi con %{name}',
            smile: 'Sorridi!',
            startRecording: 'Inizia registrazione video',
            stopRecording: 'Ferma registrazione video',
            takePicture: 'Scatta foto',
            timedOut: 'Caricamento fermo per %{seconds} secondi, annullando.',
            upload: 'Carica',
            uploadComplete: 'Caricamento completato',
            uploadFailed: 'Caricamento fallito',
            uploadPaused: 'Caricamento in pausa',
            uploadXFiles: {
              '0': 'Carica %{smart_count} file',
              '1': 'Carica %{smart_count} file'
            },
            uploadXNewFiles: {
              '0': 'Carica +%{smart_count} file',
              '1': 'Carica +%{smart_count} file'
            },
            uploading: 'Caricando',
            uploadingXFiles: {
              '0': 'Caricando %{smart_count} file',
              '1': 'Caricando %{smart_count} file'
            },
            xFilesSelected: {
              '0': '%{smart_count} file selezionato',
              '1': '%{smart_count} file selezionati'
            },
            xMoreFilesAdded: {
              '0': '%{smart_count} file aggiunto',
              '1': '%{smart_count} file aggiunti'
            },
            xTimeLeft: '%{time} rimanenti',
            youCanOnlyUploadFileTypes: 'Puoi caricare solo: %{types}',
            youCanOnlyUploadX: {
              '0': 'Puoi caricare solo %{smart_count} file',
              '1': 'Puoi caricare solo %{smart_count} file'
            },
            youHaveToAtLeastSelectX: {
              '0': 'Devi selezionare almeno %{smart_count} file',
              '1': 'Devi selezionare almeno %{smart_count} file'
            }
          }
        }}
      />
    </div>
  );
}