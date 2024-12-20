import ApiToken from './apiToken.model.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication token is required' });
    }

    const apiToken = await ApiToken.findOne({
      where: {
        token: token,
        isActive: true
      }
    });

    if (!apiToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (apiToken.expiresAt && new Date() > apiToken.expiresAt) {
      return res.status(401).json({ error: 'Token has expired' });
    }

    // Update last used timestamp
    await apiToken.update({
      lastUsedAt: new Date()
    });

    // Add token info to request for potential use in routes
    req.apiToken = {
      id: apiToken.id,
      name: apiToken.name
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
