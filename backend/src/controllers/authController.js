import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { isDbConnected, memFindUserByEmail, memCreateUser } from '../services/memoryDb.js';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'jwtsecret123',
    { expiresIn: '30d' }
  );
};

export const register = async (req, res, next) => {
  try {
    const { email, password, role, fullName } = req.body;

    if (!isDbConnected) {
      const userExists = memFindUserByEmail(email);
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists' });
      }

      const user = await memCreateUser({ email, passwordHash: password, role, fullName });
      const token = generateToken(user);

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          fullName: user.fullName
        }
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      email,
      passwordHash: password, // userSchema pre-save hook will encrypt this
      role,
      fullName
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      }
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Gov admin static login check bypass to match frontend
    if (email === 'admin@fuelguard.gov' && password === 'admin123') {
      let adminUser;
      if (isDbConnected) {
        adminUser = await User.findOneAndUpdate(
          { email },
          { email, passwordHash: 'admin123', role: 'admin', fullName: 'Gov Administrator' },
          { new: true, upsert: true }
        );
      } else {
        adminUser = memFindUserByEmail(email);
      }
      const token = generateToken(adminUser);
      return res.status(200).json({
        success: true,
        token,
        user: { id: adminUser._id, email: adminUser.email, fullName: adminUser.fullName, role: adminUser.role }
      });
    }

    // Petrol pump operator static login check bypass to match frontend
    if (email === 'pump@ceypetco.com' && password === 'pump123') {
      let pumpUser;
      if (isDbConnected) {
        pumpUser = await User.findOneAndUpdate(
          { email },
          { email, passwordHash: 'password123', role: 'pump', fullName: 'Ceypetco Pump Operator' },
          { new: true, upsert: true }
        );
      } else {
        pumpUser = memFindUserByEmail(email);
      }
      const token = generateToken(pumpUser);
      return res.status(200).json({
        success: true,
        token,
        user: { id: pumpUser._id, email: pumpUser.email, fullName: pumpUser.fullName, role: pumpUser.role }
      });
    }

    if (!isDbConnected) {
      const user = memFindUserByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = generateToken(user);
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          fullName: user.fullName
        }
      });
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      }
    });
  } catch (err) {
    next(err);
  }
};
