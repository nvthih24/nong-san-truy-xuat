const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { fullName, phone, email, address, password, confirmPassword, role } = req.body;  // Thêm role khi đăng ký (có thể chọn từ form)

  if (password !== confirmPassword) return res.status(400).json({ msg: 'Passwords do not match' });
  if (role === 'admin') return res.status(403).json({ msg: 'Cannot register as admin' });

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    user = new User({ fullName, phone, email, address, password, role });
    await user.save();

    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});


// backend/routes/auth.js
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});



// get all users (admin only)
router.get('/users', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/transactions', auth, async (req, res) => {
  const { txHash, productId, userAddress, action, timestamp,plantingImageUrl,
    harvestImageUrl,
    receiveImageUrl,
    deliveryImageUrl,
    managerReceiveImageUrl, } = req.body;

  if (!txHash || !productId || !userAddress || !action || !timestamp) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const transaction = new Transaction({
      txHash,
      productId,
      userAddress,
      action,
      timestamp,
      plantingImageUrl,
      harvestImageUrl,
      receiveImageUrl,
      deliveryImageUrl,
      managerReceiveImageUrl,
    });
    await transaction.save();
    res.status(201).json({ message: 'Transaction saved successfully', txHash });
  } catch (error) {
    console.error('Error saving transaction:', error);
    res.status(500).json({ error: 'Failed to save transaction' });
  }
});


module.exports = router;