const logger = require('../utils/logger');

/**
 * Classe personnalisée pour les erreurs API
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, errors = null, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware pour gérer les erreurs 404
 */
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(
    `Route non trouvée: ${req.method} ${req.originalUrl}`,
    404
  );
  next(error);
};

/**
 * Middleware principal de gestion des erreurs
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Si ce n'est pas une ApiError, la convertir
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Erreur serveur interne';
    error = new ApiError(message, statusCode, null, false);
    error.stack = err.stack;
  }

  // Logger l'erreur
  const errorLog = {
    message: error.message,
    statusCode: error.statusCode,
    errors: error.errors,
    timestamp: error.timestamp,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    user: req.user ? req.user._id : 'anonymous',
  };

  if (error.statusCode >= 500) {
    logger.error('Server Error:', errorLog);
  } else {
    logger.warn('Client Error:', errorLog);
  }

  // Préparer la réponse
  const response = {
    success: false,
    message: error.message,
    statusCode: error.statusCode,
    timestamp: error.timestamp,
  };

  // Ajouter les erreurs de validation si présentes
  if (error.errors) {
    response.errors = error.errors;
  }

  // En développement, inclure la stack trace
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    response.path = req.originalUrl;
    response.method = req.method;
  }

  // Envoyer la réponse
  res.status(error.statusCode).json(response);
};

/**
 * Gestionnaire d'erreurs Mongoose
 */
const handleMongooseError = (error) => {
  // Erreur de validation
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
    }));
    return new ApiError('Erreur de validation', 400, errors);
  }

  // Erreur de clé dupliquée
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    const value = error.keyValue[field];
    return new ApiError(
      `${field} "${value}" existe déjà`,
      409,
      [{ field, message: 'Cette valeur est déjà utilisée' }]
    );
  }

  // Erreur de cast (ID invalide)
  if (error.name === 'CastError') {
    return new ApiError(
      `${error.path} invalide: ${error.value}`,
      400,
      [{ field: error.path, message: 'Format invalide' }]
    );
  }

  return error;
};

/**
 * Gestionnaire d'erreurs JWT
 */
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new ApiError('Token invalide', 401);
  }

  if (error.name === 'TokenExpiredError') {
    return new ApiError('Token expiré', 401);
  }

  return error;
};

/**
 * Gestionnaire d'erreurs Multer (upload)
 */
const handleMulterError = (error) => {
  if (error.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return new ApiError('Fichier trop volumineux', 400);
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return new ApiError('Trop de fichiers', 400);
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return new ApiError('Champ de fichier inattendu', 400);
    }
  }
  return error;
};

/**
 * Wrapper pour les fonctions async
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Transformer les erreurs spécifiques
      let transformedError = error;
      
      transformedError = handleMongooseError(transformedError);
      transformedError = handleJWTError(transformedError);
      transformedError = handleMulterError(transformedError);
      
      next(transformedError);
    });
  };
};

/**
 * Valider les données de requête
 */
const validateRequest = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      
      return next(new ApiError('Erreur de validation', 400, errors));
    }

    // Remplacer les données par les données validées
    req[property] = value;
    next();
  };
};

/**
 * Middleware pour capturer les erreurs non gérées
 */
const unhandledErrorHandler = () => {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', { reason, promise });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // Arrêter le processus proprement
    process.exit(1);
  });
};

module.exports = {
  ApiError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validateRequest,
  unhandledErrorHandler,
  handleMongooseError,
  handleJWTError,
  handleMulterError,
};
