import Admin from '../models/Admin.js';
import generateToken from '../utils/generateToken.js';

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Seed initial admin if using initial credentials
    const adminEmail = process.env.ADMIN_INITIAL_EMAIL;
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
    
    if (email === adminEmail && password === adminPassword) {
      let admin = await Admin.findOne({ email });
      if (!admin) {
        admin = await Admin.create({ name: 'Super Admin', email: adminEmail, password: adminPassword, role: 'superadmin' });
      }
    }

    const admin = await Admin.findOne({ email });

    if (admin && (await admin.matchPassword(password))) {
      const token = generateToken(res, admin._id);
      res.json({ success: true, _id: admin._id, name: admin.name, email: admin.email, role: admin.role, token });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logoutAdmin = (req, res) => {
  res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const getAdminProfile = async (req, res) => {
  if (req.admin) {
    res.json({ success: true, _id: req.admin._id, name: req.admin.name, email: req.admin.email, role: req.admin.role });
  } else {
    res.status(404).json({ success: false, message: 'Admin not found' });
  }
};
