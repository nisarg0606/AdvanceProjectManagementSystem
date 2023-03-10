const jwt = require('jsonwebtoken');
const auth = (userType) => (req, res, next) => {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    // Check if not token
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }else{
      // Verify token
      try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
        req.user = decoded;
        console.log(req.user);
        // Check user type
        if (userType && req.user.userType !== userType) {
          return res.status(401).json({ msg: 'Unauthorized user type' });
        }
        next();
      }catch(err){
        res.status(401).json({ msg: 'Token is not valid' });
      }
    }
  };