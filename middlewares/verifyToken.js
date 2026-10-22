import jwt from 'jsonwebtoken';
import { User } from '../modules/auth/user.model.js';

export const verifyUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password').lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.'
      });
    }

    // Attach userId, email, and the live linkedVillages array to req.user
    req.user = {
      userId: user._id,
      email: user.email,
      linkedVillages: user.linkedVillages || []
    };

    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired session. Please log in again.' 
    });
  }
};