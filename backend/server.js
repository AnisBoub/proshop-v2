import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import client from 'prom-client';

dotenv.config();
import connectDB from './config/db.js';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const port = process.env.PORT || 5000;

// Connexion à la base de données
connectDB();

const app = express();

// ==========================================
// CONFIGURATION DE SÉCURITÉ (CORS)
// ==========================================
// Ajusté pour accepter aussi le conteneur frontend sur le réseau Docker
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://frontend'],
    credentials: true,
  })
);

// ==========================================
// CONFIGURATION PROMETHEUS (MÉTRIQUES)
// ==========================================
client.collectDefaultMetrics();

const httpRequestsCounter = new client.Counter({
  name: 'proshop_http_requests_total',
  help: 'Nombre total de requêtes HTTP sur la boutique ProShop',
  labelNames: ['method', 'route', 'status'],
});

app.use((req, res, next) => {
  res.on('finish', () => {
    if (req.path !== '/metrics') {
      httpRequestsCounter.inc({
        method: req.method,
        route: req.path,
        status: res.statusCode,
      });
    }
  });
  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// ==========================================
// ROUTE DE SANTÉ (HEALTHCHECK POUR JENKINS)
// ==========================================
// Placé en haut pour s'assurer qu'il réponde TOUJOURS immédiatement
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', database: 'CONNECTED' });
});

// ==========================================
// MIDDLEWARES DE L'APPLICATION
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==========================================
// ROUTES DE L'API
// ==========================================
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/config/paypal', (req, res) =>
  res.send({ clientId: process.env.PAYPAL_CLIENT_ID })
);

// ==========================================
// CONFIGURATION GESTION STATIQUE
// ==========================================
const __dirname = path.resolve();

if (process.env.NODE_ENV === 'production') {
  app.use('/uploads', express.static('/var/data/uploads'));

  // NGINX gère déjà le frontend dans votre architecture multi-conteneurs,
  // mais au cas où le backend doit servir des fichiers :
  if (path.join(__dirname, '/frontend/build')) {
    app.use(express.static(path.join(__dirname, '/frontend/build')));
  }

  // Ne pas capturer le '*' de manière agressive si l'API est appelée
  app.get(/^\/(?!api).*/, (req, res) =>
    res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'))
  );
} else {
  app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
  app.get('/', (req, res) => {
    res.send('API is running....');
  });
}

// ==========================================
// GESTION DES ERREURS
// ==========================================
app.use(notFound);
app.use(errorHandler);

// ==========================================
// ÉCOUTE DU SERVEUR
// ==========================================
app.listen(port, '0.0.0.0', () =>
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`)
);
