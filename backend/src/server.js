import http from 'http';
import { Server } from 'socket.io';
import app, { corsOrigins } from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
