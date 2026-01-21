const ProductQuestion = require('../models/ProductQuestion');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Message = require('../models/Message');
const { analyzeContent, prepareAdminNotification, generateViolationReport } = require('../utils/contentFilter');

/**
 * Envoyer une notification aux admins/modérateurs
 */
const notifyAdmins = async (notification, question) => {
    try {
        // Trouver les admins et modérateurs
        const admins = await User.find({
            role: { $in: ['admin', 'moderator'] }
        }).select('_id');

        // Récupérer les infos du client et vendeur
        const customer = await User.findById(question.customerId).select('firstName lastName email');
        const vendor = await Vendor.findById(question.vendorId).select('companyName');
        const product = await Product.findById(question.productId).select('title');

        const conversationHistory = question.messages.map((m, i) =>
            `[${i + 1}] ${m.sender === 'customer' ? 'Client' : 'Vendeur'} (${new Date(m.createdAt).toLocaleString('fr-FR')}):\n${m.originalContent || m.content}${m.isBlocked ? '\n⚠️ BLOQUÉ: ' + m.blockReason : ''}`
        ).join('\n\n---\n\n');

        const content = `🚨 ALERTE SÉCURITÉ - MESSAGE BLOQUÉ

📦 Produit: ${product?.title || question.productId}
👤 Client: ${customer?.firstName} ${customer?.lastName} (${customer?.email})
🏪 Vendeur: ${vendor?.companyName || question.vendorId}

${notification.report}

📝 HISTORIQUE COMPLET DE LA CONVERSATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${conversationHistory}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 ID Question: ${question._id}`;

        // Envoyer message à chaque admin
        for (const admin of admins) {
            await Message.create({
                sender: question.customerId, // Le système utilise l'ID du client comme expéditeur
                recipient: admin._id,
                subject: `⚠️ Message bloqué - ${notification.violations.map(v => v.name).join(', ')}`,
                content,
                type: 'notification',
                priority: notification.severity === 'high' ? 'urgent' : 'high',
                metadata: {
                    questionId: question._id,
                    productId: question.productId,
                    violationType: notification.type
                }
            });
        }

        console.log(`✉️ Notification envoyée à ${admins.length} admin(s)/modérateur(s)`);
    } catch (error) {
        console.error('Erreur notification admin:', error);
    }
};

/**
 * Créer une nouvelle question (Client)
 * POST /api/products/:productId/questions
 */
exports.createQuestion = async (req, res) => {
    try {
        const { productId } = req.params;
        const { subject, message } = req.body;
        const customerId = req.user.userId;

        // Validation
        if (!subject || !message) {
            return res.status(400).json({ message: 'Sujet et message requis' });
        }

        // Vérifier que le produit existe
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        // Analyser le message pour contenu interdit
        const analysis = analyzeContent(message);

        // Créer la question
        const question = new ProductQuestion({
            productId,
            customerId,
            vendorId: product.vendorId,
            subject,
            messages: [{
                content: analysis.isClean ? message : '[Message bloqué pour contenu suspect]',
                originalContent: !analysis.isClean ? message : undefined,
                sender: 'customer',
                isBlocked: !analysis.isClean,
                blockReason: analysis.reason,
                blockDetails: analysis.details || [],
                createdAt: new Date()
            }]
        });

        await question.save();

        // Si message bloqué, notifier les admins
        if (!analysis.isClean) {
            const notification = prepareAdminNotification(question, question.messages[0], analysis);
            await notifyAdmins(notification, question);

            return res.status(201).json({
                message: 'Votre message a été envoyé mais est en cours de vérification',
                question: question.toClientView(),
                warning: 'Votre message contient du contenu qui doit être vérifié par notre équipe'
            });
        }

        res.status(201).json({
            message: 'Question envoyée avec succès',
            question: question.toClientView()
        });

    } catch (error) {
        console.error('Erreur création question:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

/**
 * Répondre à une question
 * POST /api/product-questions/:questionId/reply
 */
exports.addReply = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { message } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;

        if (!message) {
            return res.status(400).json({ message: 'Message requis' });
        }

        const question = await ProductQuestion.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: 'Question non trouvée' });
        }

        // Déterminer si c'est le client ou le vendeur
        let sender;
        if (question.customerId.toString() === userId) {
            sender = 'customer';
        } else if (userRole === 'vendor') {
            // Vérifier que c'est bien le vendeur du produit
            const vendor = await Vendor.findOne({ userId });
            if (!vendor || vendor._id.toString() !== question.vendorId.toString()) {
                return res.status(403).json({ message: 'Accès non autorisé' });
            }
            sender = 'vendor';
        } else {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        // Analyser le message
        const analysis = analyzeContent(message);

        // Ajouter le message
        const blockedInfo = !analysis.isClean ? {
            reason: analysis.reason,
            details: analysis.details
        } : null;

        await question.addMessage(message, sender, blockedInfo);

        // Si message bloqué, notifier les admins
        if (!analysis.isClean) {
            const lastMessage = question.messages[question.messages.length - 1];
            lastMessage.originalContent = message;
            const notification = prepareAdminNotification(question, lastMessage, analysis);
            await notifyAdmins(notification, question);

            return res.json({
                message: 'Votre réponse a été envoyée mais est en cours de vérification',
                question: sender === 'customer' ? question.toClientView() : question.toVendorView(),
                warning: 'Votre message contient du contenu qui doit être vérifié'
            });
        }

        res.json({
            message: 'Réponse envoyée avec succès',
            question: sender === 'customer' ? question.toClientView() : question.toVendorView()
        });

    } catch (error) {
        console.error('Erreur réponse:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

/**
 * Obtenir les questions d'un produit (publiques, anonymes)
 * GET /api/products/:productId/questions
 */
exports.getQuestionsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const questions = await ProductQuestion.find({
            productId,
            status: { $in: ['answered', 'closed'] }, // Seulement les questions répondues
            isBlocked: false
        })
            .populate('productId', 'title')
            .sort({ lastActivityAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await ProductQuestion.countDocuments({
            productId,
            status: { $in: ['answered', 'closed'] },
            isBlocked: false
        });

        // Retourner une vue anonyme
        const anonymousQuestions = questions.map(q => ({
            _id: q._id,
            subject: q.subject,
            messages: q.messages
                .filter(m => !m.isBlocked)
                .map(m => ({
                    content: m.content,
                    sender: m.sender,
                    senderLabel: m.sender === 'customer' ? 'Client' : 'Vendeur',
                    createdAt: m.createdAt
                })),
            status: q.status,
            createdAt: q.createdAt
        }));

        res.json({
            questions: anonymousQuestions,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Erreur récupération questions produit:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

/**
 * Obtenir mes questions (Client)
 * GET /api/users/product-questions
 */
exports.getCustomerQuestions = async (req, res) => {
    try {
        const customerId = req.user.userId;
        const { page = 1, limit = 20, status } = req.query;

        const query = { customerId };
        if (status) query.status = status;

        const questions = await ProductQuestion.find(query)
            .populate('productId', 'title images')
            .sort({ lastActivityAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await ProductQuestion.countDocuments(query);

        res.json({
            questions: questions.map(q => q.toClientView()),
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Erreur récupération questions client:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

/**
 * Obtenir les questions pour le vendeur
 * GET /api/vendor/product-questions
 */
exports.getVendorQuestions = async (req, res) => {
    try {
        const vendorId = req.user.vendorId;
        const { page = 1, limit = 20, status } = req.query;

        if (!vendorId) {
            return res.status(403).json({ message: 'Accès vendeur requis' });
        }

        const query = { vendorId };
        if (status) query.status = status;

        const questions = await ProductQuestion.find(query)
            .populate('productId', 'title images')
            .sort({ lastActivityAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await ProductQuestion.countDocuments(query);
        const unreadCount = await ProductQuestion.countDocuments({
            vendorId,
            unreadByVendor: { $gt: 0 }
        });

        res.json({
            questions: questions.map(q => q.toVendorView()),
            unreadCount,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Erreur récupération questions vendeur:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

/**
 * Obtenir une question spécifique
 * GET /api/product-questions/:questionId
 */
exports.getQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const vendorId = req.user.vendorId;

        const question = await ProductQuestion.findById(questionId)
            .populate('productId', 'title images');

        if (!question) {
            return res.status(404).json({ message: 'Question non trouvée' });
        }

        // Vérifier l'accès
        const isCustomer = question.customerId.toString() === userId;
        const isVendor = vendorId && question.vendorId.toString() === vendorId;
        const isAdmin = ['admin', 'moderator'].includes(userRole);

        if (!isCustomer && !isVendor && !isAdmin) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        // Marquer comme lu
        if (isCustomer) {
            await question.markAsRead('customer');
            return res.json({ question: question.toClientView() });
        } else if (isVendor) {
            await question.markAsRead('vendor');
            return res.json({ question: question.toVendorView() });
        } else {
            return res.json({ question: question.toAdminView() });
        }

    } catch (error) {
        console.error('Erreur récupération question:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

/**
 * Fermer une question
 * PUT /api/product-questions/:questionId/close
 */
exports.closeQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const userId = req.user.userId;

        const question = await ProductQuestion.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: 'Question non trouvée' });
        }

        // Seul le client peut fermer sa question
        if (question.customerId.toString() !== userId) {
            return res.status(403).json({ message: 'Seul le client peut fermer la question' });
        }

        question.status = 'closed';
        await question.save();

        res.json({
            message: 'Question fermée avec succès',
            question: question.toClientView()
        });

    } catch (error) {
        console.error('Erreur fermeture question:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

/**
 * [Admin] Obtenir toutes les questions avec contenu bloqué
 * GET /api/admin/product-questions/blocked
 */
exports.getBlockedQuestions = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const questions = await ProductQuestion.find({
            'messages.isBlocked': true
        })
            .populate('productId', 'title')
            .populate('customerId', 'firstName lastName email')
            .populate('vendorId', 'companyName')
            .sort({ lastActivityAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await ProductQuestion.countDocuments({
            'messages.isBlocked': true
        });

        res.json({
            questions: questions.map(q => q.toAdminView()),
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Erreur récupération questions bloquées:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

/**
 * [Admin] Débloquer un message
 * PUT /api/admin/product-questions/:questionId/messages/:messageIndex/unblock
 */
exports.unblockMessage = async (req, res) => {
    try {
        const { questionId, messageIndex } = req.params;

        const question = await ProductQuestion.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: 'Question non trouvée' });
        }

        const idx = parseInt(messageIndex);
        if (idx < 0 || idx >= question.messages.length) {
            return res.status(400).json({ message: 'Index de message invalide' });
        }

        const message = question.messages[idx];
        if (!message.isBlocked) {
            return res.status(400).json({ message: 'Ce message n\'est pas bloqué' });
        }

        // Débloquer et restaurer le contenu original
        message.isBlocked = false;
        if (message.originalContent) {
            message.content = message.originalContent;
            message.originalContent = undefined;
        }
        message.blockReason = null;
        message.blockDetails = [];

        await question.save();

        res.json({
            message: 'Message débloqué avec succès',
            question: question.toAdminView()
        });

    } catch (error) {
        console.error('Erreur déblocage message:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
