require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const assetsRoutes = require('./routes/assets');
const botRoutes = require('./routes/bot');
const adminRoutes = require('./routes/admin');
const notificationsRoutes = require('./routes/notifications');
const leaderboardRoutes = require('./routes/leaderboard');
const bonusesRoutes = require('./routes/bonuses');
const futuresRoutes = require('./routes/futures');
const walletRoutes = require('./routes/wallet');
const stakingRoutes = require('./routes/staking');
const twofaRoutes  = require('./routes/twofa');
const kycRoutes    = require('./routes/kyc');

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/bot', botRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/bonuses', bonusesRoutes);
app.use('/api/futures', futuresRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/staking', stakingRoutes);
app.use('/api/2fa', twofaRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/uploads', require('express').static(require('path').join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`QuantifyPro backend running on port ${PORT}`);
});
