import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [allowedOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Expose Socket.IO instance to routes and controllers
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Connect to MongoDB
import { initQuotaScheduler } from './services/quotaScheduler.js';

connectDB().then(() => {
  initQuotaScheduler();
  server.listen(PORT, () => {
    console.log(`Server running in mode on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to database', err);
});
