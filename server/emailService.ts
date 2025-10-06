/**
 * Email Service - Simplified without SendGrid
 * 
 * Instead of sending emails automatically, the system generates an invite link
 * that admins can share manually via WhatsApp, email, or other channels.
 */

interface GenerateInviteLinkParams {
  firstName: string;
  lastName: string;
  inviteToken: string;
}

/**
 * Generates an invite URL that can be shared manually
 */
export function generateInviteLink(params: GenerateInviteLinkParams): string {
  const baseUrl = process.env.APP_URL || process.env.BASE_URL || 'http://localhost:5000';
  return `${baseUrl}/invite/${params.inviteToken}`;
}

/**
 * Generates a formatted message that can be copied and sent
 */
export function generateInviteMessage(params: GenerateInviteLinkParams): string {
  const inviteUrl = generateInviteLink(params);
  
  return `🎉 Benvenuto in Maori Group PC Manager!

Ciao ${params.firstName} ${params.lastName}!

È stato creato un account per te nel sistema di gestione PC.
Per completare la registrazione e impostare la tua password, clicca su questo link:

${inviteUrl}

⏰ Nota: Questo link è valido per 24 ore.

---
Maori Group - Sistema di Gestione PC Aziendali`;
}