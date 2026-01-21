/**
 * Content Filter Utility
 * Détecte et filtre les contenus interdits dans les messages
 * (emails, téléphones, URLs, réseaux sociaux)
 */

// Patterns de détection
const PATTERNS = {
    // Email addresses
    email: {
        regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
        name: 'Adresse email'
    },

    // Phone numbers (format international et local)
    phone: {
        regex: /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,4}/g,
        name: 'Numéro de téléphone',
        // Valider que c'est bien un numéro (au moins 8 chiffres)
        validate: (match) => {
            const digits = match.replace(/\D/g, '');
            return digits.length >= 8;
        }
    },

    // URLs and links
    url: {
        regex: /(https?:\/\/|www\.)[^\s<>"\[\]{}|\\^`]+/gi,
        name: 'Lien externe'
    },

    // Social media mentions
    socialMedia: {
        regex: /\b(whatsapp|telegram|facebook|fb|instagram|insta|messenger|viber|signal|snapchat|tiktok|twitter|linkedin|discord|skype)\b/gi,
        name: 'Réseau social'
    },

    // Specific patterns for hiding contact info
    hiddenContact: {
        // "zero cinq" or "zéro cinq" style
        regex: /(zero|zéro|un|deux|trois|quatre|cinq|six|sept|huit|neuf)\s*(zero|zéro|un|deux|trois|quatre|cinq|six|sept|huit|neuf)\s*(zero|zéro|un|deux|trois|quatre|cinq|six|sept|huit|neuf)/gi,
        name: 'Contact masqué'
    },

    // Email variations like "user at domain dot com"
    emailVariation: {
        regex: /\w+\s*(at|@|chez|à)\s*\w+\s*(dot|\.|\s+point\s+)\s*(com|fr|net|org|tn)/gi,
        name: 'Email masqué'
    }
};

/**
 * Analyze a message for forbidden content
 * @param {string} content - The message to analyze
 * @returns {object} - { isClean, violations: [{type, matches}], reason }
 */
function analyzeContent(content) {
    if (!content || typeof content !== 'string') {
        return { isClean: true, violations: [], reason: null };
    }

    const violations = [];

    for (const [type, pattern] of Object.entries(PATTERNS)) {
        const matches = content.match(pattern.regex);

        if (matches && matches.length > 0) {
            // Apply validation if exists
            const validMatches = pattern.validate
                ? matches.filter(m => pattern.validate(m))
                : matches;

            if (validMatches.length > 0) {
                violations.push({
                    type,
                    name: pattern.name,
                    matches: validMatches.map(m => m.substring(0, 50)) // Limit match length
                });
            }
        }
    }

    if (violations.length === 0) {
        return { isClean: true, violations: [], reason: null };
    }

    // Determine the primary reason
    const reason = violations.length > 1 ? 'multiple' : violations[0].type;

    return {
        isClean: false,
        violations,
        reason,
        details: violations.map(v => ({
            type: v.type,
            match: v.matches[0]
        }))
    };
}

/**
 * Sanitize content by removing/masking forbidden content
 * @param {string} content - The message to sanitize
 * @returns {string} - Sanitized content
 */
function sanitizeContent(content) {
    if (!content || typeof content !== 'string') {
        return content;
    }

    let sanitized = content;

    // Replace emails
    sanitized = sanitized.replace(PATTERNS.email.regex, '[email masqué]');

    // Replace phone numbers (only valid ones)
    sanitized = sanitized.replace(PATTERNS.phone.regex, (match) => {
        const digits = match.replace(/\D/g, '');
        return digits.length >= 8 ? '[numéro masqué]' : match;
    });

    // Replace URLs
    sanitized = sanitized.replace(PATTERNS.url.regex, '[lien masqué]');

    // Replace social media mentions
    sanitized = sanitized.replace(PATTERNS.socialMedia.regex, '[contact masqué]');

    // Replace hidden contacts
    sanitized = sanitized.replace(PATTERNS.hiddenContact.regex, '[contact masqué]');

    // Replace email variations
    sanitized = sanitized.replace(PATTERNS.emailVariation.regex, '[email masqué]');

    return sanitized;
}

/**
 * Check if content contains any forbidden patterns
 * Quick check without details
 */
function containsForbiddenContent(content) {
    return !analyzeContent(content).isClean;
}

/**
 * Generate a human-readable report of violations
 */
function generateViolationReport(analysis) {
    if (analysis.isClean) {
        return 'Aucun contenu interdit détecté.';
    }

    const lines = ['⚠️ CONTENU INTERDIT DÉTECTÉ:\n'];

    for (const violation of analysis.violations) {
        lines.push(`• ${violation.name}:`);
        for (const match of violation.matches) {
            lines.push(`  - "${match}"`);
        }
    }

    return lines.join('\n');
}

/**
 * Prepare notification data for admin
 */
function prepareAdminNotification(question, message, analysis) {
    return {
        type: 'CONTENT_VIOLATION',
        severity: analysis.violations.length > 1 ? 'high' : 'medium',
        questionId: question._id,
        productId: question.productId,
        customerId: question.customerId,
        vendorId: question.vendorId,
        messageSender: message.sender,
        originalContent: message.content,
        violations: analysis.violations,
        report: generateViolationReport(analysis),
        timestamp: new Date().toISOString()
    };
}

module.exports = {
    analyzeContent,
    sanitizeContent,
    containsForbiddenContent,
    generateViolationReport,
    prepareAdminNotification,
    PATTERNS
};
