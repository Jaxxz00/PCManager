import { MailService } from '@sendgrid/mail';

let mailService: MailService | null = null;

function initializeMailService(): MailService | null {
  if (!process.env.SENDGRID_API_KEY) {
    console.log("SendGrid API key not configured - email functionality disabled");
    return null;
  }
  
  if (!mailService) {
    mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);
  }
  
  return mailService;
}

interface SendInviteEmailParams {
  to: string;
  firstName: string;
  lastName: string;
  inviteToken: string;
  from?: string;
}

export async function sendUserInviteEmail(params: SendInviteEmailParams): Promise<boolean> {
  const service = initializeMailService();
  
  if (!service) {
    console.log(`Would send invite email to ${params.to} with token ${params.inviteToken}`);
    return false; // Return false to indicate email wasn't sent
  }

  const inviteUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/set-password?token=${params.inviteToken}`;
  
  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Benvenuto in Maori Group PC Manager</h1>
      </div>
      
      <div style="padding: 30px; background: #f8fafc; border-left: 4px solid #3b82f6;">
        <h2 style="color: #1e40af; margin-top: 0;">Ciao ${params.firstName} ${params.lastName}!</h2>
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          È stato creato un account per te nel sistema di gestione PC di Maori Group. 
          Per completare la registrazione e impostare la tua password, clicca sul link qui sotto:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" 
             style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    display: inline-block; 
                    font-weight: bold; 
                    font-size: 16px;">
            Imposta la tua Password
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280;">
          <strong>Nota:</strong> Questo link è valido per 24 ore. Se non riesci a cliccare sul pulsante, 
          copia e incolla questo URL nel tuo browser:
        </p>
        <p style="font-size: 14px; color: #3b82f6; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px;">
          ${inviteUrl}
        </p>
      </div>
      
      <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb;">
        <p>© 2025 Maori Group - Sistema di Gestione PC Aziendali</p>
        <p>Questo è un messaggio automatico, non rispondere a questa email.</p>
      </div>
    </div>
  `;

  const textContent = `
Benvenuto in Maori Group PC Manager

Ciao ${params.firstName} ${params.lastName}!

È stato creato un account per te nel sistema di gestione PC di Maori Group. 
Per completare la registrazione e impostare la tua password, visita questo link:

${inviteUrl}

Nota: Questo link è valido per 24 ore.

© 2025 Maori Group - Sistema di Gestione PC Aziendali
Questo è un messaggio automatico, non rispondere a questa email.
  `;

  try {
    await service.send({
      to: params.to,
      from: params.from || 'noreply@maorigroup.com',
      subject: 'Invito - Maori Group PC Manager',
      html: htmlContent,
      text: textContent,
    });
    
    console.log(`Invite email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}