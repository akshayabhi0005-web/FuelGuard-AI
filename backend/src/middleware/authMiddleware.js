import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { isDbConnected, memFindUserById } from '../services/memoryDb.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret123');

      if (!isDbConnected) {
        req.user = memFindUserById(decoded.id);
        if (!req.user) {
          return res.status(401).json({ success: false, message: 'Not authorized, user profile not found' });
        }
        return next();
      }

      if (mongoose.Types.ObjectId.isValid(decoded.id)) {
        req.user = await User.findById(decoded.id).select('-passwordHash');
      }
      
      if (!req.user) {
        req.user = memFindUserById(decoded.id);
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user profile not found' });
      }
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Not authorized, token verification failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Access denied, role '${req.user?.role || 'anonymous'}' is not authorized` });
    }
    next();
  };
};
