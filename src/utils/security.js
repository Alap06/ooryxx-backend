/**
 * Security utilities for input validation and sanitization
 * Protects against SQL injection, XSS, and malicious content
 */

// Dangerous patterns to detect SQL injection attempts
const SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|UNION|GRANT|REVOKE)\b)/gi,
    /(--|#|\/\*|\*\/)/g,
    /(\bOR\b|\bAND\b)\s*[\d'"]?\s*[=<>]/gi,
    /['";].*(--)|(\/\*)/g,
    /(\bEXEC\b|\bEXECUTE\b|\bXP_\b)/gi,
    /\b(CHAR|NCHAR|VARCHAR|NVARCHAR)\s*\(/gi,
    /(\bCONCAT\b|\bCONCAT_WS\b)/gi,
    /\\x[0-9a-fA-F]{2}/g, // Hex encoding
    /0x[0-9a-fA-F]+/g // Hex values
];

// XSS attack patterns
const XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick, onload, etc.
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<link/gi,
    /<meta\s+http-equiv/gi,
    /data:\s*text\/html/gi,
    /vbscript:/gi
];

// File extension patterns for malicious files
const DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.jse',
    '.scr', '.pif', '.msi', '.dll', '.com', '.hta', '.cpl', '.jar',
    '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl'
];

// Virus signature patterns (basic detection)
const VIRUS_PATTERNS = [
    /EICAR-STANDARD-ANTIVIRUS-TEST-FILE/i,
    /X5O!P%@AP\[4\\PZX54\(P\^\)7CC\)7\}/,
    /<\?php\s+(eval|exec|system|passthru|shell_exec)/gi,
    /base64_decode\s*\(/gi,
    /\$_(GET|POST|REQUEST|COOKIE|SERVER)\s*\[/gi
];

/**
 * Check if a string contains SQL injection patterns
 */
function containsSQLInjection(str) {
    if (typeof str !== 'string') return false;

    for (const pattern of SQL_INJECTION_PATTERNS) {
        if (pattern.test(str)) {
            return true;
        }
    }
    return false;
}

/**
 * Check if a string contains XSS patterns
 */
function containsXSS(str) {
    if (typeof str !== 'string') return false;

    for (const pattern of XSS_PATTERNS) {
        if (pattern.test(str)) {
            return true;
        }
    }
    return false;
}

/**
 * Check if a URL is potentially malicious
 */
function isMaliciousURL(url) {
    if (typeof url !== 'string') return false;

    // Check for data URLs with executable content
    if (/^data:/i.test(url) && !/^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);/i.test(url)) {
        return true;
    }

    // Check for javascript: protocol
    if (/^javascript:/i.test(url)) {
        return true;
    }

    // Check for dangerous file extensions in URL
    for (const ext of DANGEROUS_EXTENSIONS) {
        if (url.toLowerCase().endsWith(ext)) {
            return true;
        }
    }

    return false;
}

/**
 * Check for virus-like patterns
 */
function containsVirusPattern(str) {
    if (typeof str !== 'string') return false;

    for (const pattern of VIRUS_PATTERNS) {
        if (pattern.test(str)) {
            return true;
        }
    }
    return false;
}

/**
 * Sanitize a string by removing dangerous characters
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return str;

    return str
        // Remove null bytes
        .replace(/\0/g, '')
        // Remove control characters except newlines and tabs
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Escape HTML entities
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        // Trim whitespace
        .trim();
}

/**
 * Validate and sanitize a product object
 * Returns { isValid: boolean, errors: string[], sanitized: object }
 */
function validateAndSanitizeProduct(product, index = 0) {
    const errors = [];
    const sanitized = {};

    // Validate required fields
    if (!product.name && !product.title) {
        errors.push(`Produit ${index + 1}: Nom manquant`);
    }

    if (product.price === undefined || product.price === null || isNaN(parseFloat(product.price))) {
        errors.push(`Produit ${index + 1}: Prix invalide`);
    }

    // Check for SQL injection in all string fields
    const stringFields = ['name', 'title', 'description', 'category', 'sku', 'brand', 'status'];
    for (const field of stringFields) {
        if (product[field]) {
            if (containsSQLInjection(product[field])) {
                errors.push(`Produit ${index + 1}: Tentative d'injection SQL détectée dans ${field}`);
                continue;
            }
            if (containsXSS(product[field])) {
                errors.push(`Produit ${index + 1}: Contenu XSS détecté dans ${field}`);
                continue;
            }
            if (containsVirusPattern(product[field])) {
                errors.push(`Produit ${index + 1}: Pattern viral détecté dans ${field}`);
                continue;
            }
            // Sanitize the field
            sanitized[field] = sanitizeString(product[field]);
        }
    }

    // Validate and sanitize URLs in images
    if (product.images) {
        const imageUrls = Array.isArray(product.images) ? product.images : [product.images];
        const safeImages = [];

        for (const img of imageUrls) {
            const url = typeof img === 'string' ? img : img?.url;
            if (url) {
                if (isMaliciousURL(url)) {
                    errors.push(`Produit ${index + 1}: URL d'image potentiellement malveillante: ${url.substring(0, 50)}...`);
                } else {
                    safeImages.push(url);
                }
            }
        }
        sanitized.images = safeImages;
    }

    // Copy numeric fields with validation
    sanitized.price = Math.max(0, parseFloat(product.price) || 0);
    sanitized.comparePrice = Math.max(0, parseFloat(product.comparePrice) || 0);
    sanitized.stock = Math.max(0, parseInt(product.stock) || 0);

    // Validate currency
    const validCurrencies = ['TND', 'EUR', 'USD', 'CNY'];
    sanitized.currency = validCurrencies.includes(product.currency) ? product.currency : 'TND';

    // Validate status
    const validStatuses = ['active', 'draft', 'inactive'];
    sanitized.status = validStatuses.includes(product.status) ? product.status : 'active';

    // Boolean fields
    sanitized.isFeatured = product.isFeatured === true || product.isFeatured === 'true';

    return {
        isValid: errors.length === 0,
        errors,
        sanitized: {
            ...sanitized,
            name: sanitized.name || sanitized.title,
            title: sanitized.title || sanitized.name
        }
    };
}

/**
 * Validate a batch of products
 * Returns { isValid, products, errors, securityAlerts }
 */
function validateProductBatch(products, maxProducts = 300) {
    const results = {
        isValid: true,
        products: [],
        errors: [],
        securityAlerts: [],
        stats: {
            total: products.length,
            valid: 0,
            rejected: 0
        }
    };

    // Check batch size limit
    if (products.length > maxProducts) {
        results.securityAlerts.push({
            type: 'BATCH_SIZE_EXCEEDED',
            message: `Tentative d'import de ${products.length} produits (limite: ${maxProducts})`,
            timestamp: new Date().toISOString()
        });
        results.isValid = false;
        results.errors.push(`Limite de ${maxProducts} produits dépassée`);
    }

    // Validate each product
    for (let i = 0; i < Math.min(products.length, maxProducts); i++) {
        const validation = validateAndSanitizeProduct(products[i], i);

        if (validation.isValid) {
            results.products.push(validation.sanitized);
            results.stats.valid++;
        } else {
            results.errors.push(...validation.errors);
            results.stats.rejected++;

            // Check for security-related errors
            const securityErrors = validation.errors.filter(e =>
                e.includes('injection') || e.includes('XSS') || e.includes('viral') || e.includes('malveillante')
            );

            if (securityErrors.length > 0) {
                results.securityAlerts.push({
                    type: 'SECURITY_THREAT',
                    message: securityErrors.join('; '),
                    productIndex: i,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    if (results.stats.rejected > 0) {
        results.isValid = false;
    }

    return results;
}

module.exports = {
    containsSQLInjection,
    containsXSS,
    containsVirusPattern,
    isMaliciousURL,
    sanitizeString,
    validateAndSanitizeProduct,
    validateProductBatch,
    DANGEROUS_EXTENSIONS
};
