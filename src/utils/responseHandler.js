/**
 * Gestionnaire de réponses standardisées pour l'API
 */

/**
 * Réponse de succès
 */
const successResponse = (res, data = null, message = 'Succès', statusCode = 200) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Réponse de succès avec création
 */
const createdResponse = (res, data = null, message = 'Créé avec succès') => {
  return successResponse(res, data, message, 201);
};

/**
 * Réponse de succès sans contenu
 */
const noContentResponse = (res) => {
  return res.status(204).send();
};

/**
 * Réponse paginée
 */
const paginatedResponse = (res, data, pagination, message = 'Succès') => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    data,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 20,
      total: pagination.total || 0,
      totalPages: Math.ceil((pagination.total || 0) / (pagination.limit || 20)),
      hasNext: pagination.page < Math.ceil((pagination.total || 0) / (pagination.limit || 20)),
      hasPrev: pagination.page > 1,
    },
  };

  return res.status(200).json(response);
};

/**
 * Réponse d'erreur
 */
const errorResponse = (res, message = 'Erreur', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Réponse de validation échouée
 */
const validationErrorResponse = (res, errors) => {
  return errorResponse(res, 'Erreur de validation', 400, errors);
};

/**
 * Réponse non autorisé
 */
const unauthorizedResponse = (res, message = 'Non autorisé') => {
  return errorResponse(res, message, 401);
};

/**
 * Réponse accès interdit
 */
const forbiddenResponse = (res, message = 'Accès interdit') => {
  return errorResponse(res, message, 403);
};

/**
 * Réponse non trouvé
 */
const notFoundResponse = (res, message = 'Ressource non trouvée') => {
  return errorResponse(res, message, 404);
};

/**
 * Réponse conflit
 */
const conflictResponse = (res, message = 'Conflit de ressource') => {
  return errorResponse(res, message, 409);
};

/**
 * Réponse trop de requêtes
 */
const tooManyRequestsResponse = (res, message = 'Trop de requêtes') => {
  return errorResponse(res, message, 429);
};

/**
 * Réponse avec métadonnées
 */
const responseWithMeta = (res, data, meta = {}, message = 'Succès', statusCode = 200) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    data,
    meta,
  };

  return res.status(statusCode).json(response);
};

/**
 * Format de réponse pour les recherches
 */
const searchResponse = (res, results, query, filters = {}, total = 0) => {
  const response = {
    success: true,
    message: 'Résultats de recherche',
    timestamp: new Date().toISOString(),
    data: {
      results,
      query,
      filters,
      count: results.length,
      total,
    },
  };

  return res.status(200).json(response);
};

module.exports = {
  successResponse,
  createdResponse,
  noContentResponse,
  paginatedResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  tooManyRequestsResponse,
  responseWithMeta,
  searchResponse,
};
