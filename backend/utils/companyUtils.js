/**
 * Utility functions for company-based data isolation
 */

/**
 * Checks if a resource belongs to the user's company
 * @param {Object} resource - The resource object with a company field
 * @param {Object} user - The authenticated user object
 * @throws {Error} If access is denied
 */
const checkCompanyAccess = (resource, user) => {
  if (!resource || !resource.company || !user || !user.company) {
    throw new Error('Invalid resource or user data');
  }

  if (!resource.company.equals(user.company)) {
    throw new Error('Access denied: resource belongs to a different company');
  }
};

/**
 * Creates a company filter object for queries
 * @param {Object} user - The authenticated user object
 * @returns {Object} Filter object with company restriction
 */
const createCompanyFilter = (user) => {
  if (!user || !user.company) {
    throw new Error('User company not available');
  }
  return { company: user.company };
};

module.exports = {
  checkCompanyAccess,
  createCompanyFilter
};