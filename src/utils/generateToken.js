import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '36500d', // 100 years
  });

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: true, // Must be true for sameSite: 'none'
    sameSite: 'none', // Allows cross-domain cookies
    maxAge: 100 * 365 * 24 * 60 * 60 * 1000, // 100 years
  });
  
  return token;
};

export default generateToken;
