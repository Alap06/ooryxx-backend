// Test d'envoi d'email - Ooryxx
// Ce script teste la configuration email
require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔧 Configuration Email:');
console.log('HOST:', process.env.EMAIL_HOST);
console.log('PORT:', process.env.EMAIL_PORT);
console.log('USER:', process.env.EMAIL_USER);
console.log('FROM:', process.env.EMAIL_FROM);
console.log('PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Défini' : '❌ Non défini');
console.log('\n📧 Tentative d\'envoi d\'email de test...\n');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_PORT == 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  debug: true, // Active les logs détaillés
  logger: true // Active le logger
});

// Vérifier la connexion
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ Erreur de connexion SMTP:', error);
    console.log('\n💡 Solutions possibles:');
    console.log('1. Vérifiez que EMAIL_USER et EMAIL_PASSWORD sont corrects dans .env');
    console.log('2. Pour Gmail, utilisez un mot de passe d\'application:');
    console.log('   https://myaccount.google.com/apppasswords');
    console.log('3. Vérifiez que la validation en 2 étapes est activée sur Gmail');
    console.log('4. Vérifiez que le port 587 n\'est pas bloqué par votre firewall');
  } else {
    console.log('✅ Serveur prêt à envoyer des emails');
    
    // Envoyer un email de test
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Envoyer à soi-même pour le test
      subject: '✅ Test Email - Configuration Ooryxx Réussie',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
            .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Configuration Email Réussie !</h1>
            </div>
            <div class="content">
              <div class="success-box">
                <strong>🎉 Félicitations !</strong><br>
                Votre configuration email pour Ooryxx fonctionne correctement.
              </div>
              
              <h3>Informations de configuration :</h3>
              <ul>
                <li><strong>Serveur SMTP:</strong> ${process.env.EMAIL_HOST}</li>
                <li><strong>Port:</strong> ${process.env.EMAIL_PORT}</li>
                <li><strong>Email:</strong> ${process.env.EMAIL_USER}</li>
                <li><strong>Date de test:</strong> ${new Date().toLocaleString('fr-FR')}</li>
              </ul>
              
              <p>Vous pouvez maintenant utiliser les fonctionnalités suivantes :</p>
              <ul>
                <li>✅ Réinitialisation de mot de passe par email</li>
                <li>✅ Emails de bienvenue</li>
                <li>✅ Confirmations de commande</li>
                <li>✅ Notifications de livraison</li>
              </ul>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé par le système de test <strong>Ooryxx</strong></p>
              <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">
                © 2025 Ooryxx. Tous droits réservés.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Erreur lors de l\'envoi:', error);
      } else {
        console.log('\n✅ Email de test envoyé avec succès !');
        console.log('📬 ID du message:', info.messageId);
        console.log('📧 Vérifiez votre boîte email:', process.env.EMAIL_USER);
        console.log('\n🎉 La configuration est correcte ! Vous pouvez maintenant utiliser le système d\'email.');
      }
      process.exit(error ? 1 : 0);
    });
  }
});
