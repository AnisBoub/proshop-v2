import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import client from 'prom-client'; // Import du client Prometheus

dotenv.config();
import connectDB from './config/db.js';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const port = process.env.PORT || 5000;

connectDB();

const app = express();

// ==========================================
// CONFIGURATION PROMETHEUS (MÉTRIQUES)
// ==========================================

// 1. Activer la collecte des métriques système par défaut (CPU, mémoire, etc.)
client.collectDefaultMetrics();

// 2. Créer un compteur personnalisé pour suivre les requêtes de la boutique
const httpRequestsCounter = new client.Counter({
  name: 'proshop_http_requests_total',
  help: 'Nombre total de requêtes HTTP sur la boutique ProShop',
  labelNames: ['method', 'route', 'status'],
});

// 3. Middleware global pour enregistrer le trafic (placé avant les routes)
app.use((req, res, next) => {
  res.on('finish', () => {
    // On ignore la route /metrics elle-même pour ne pas fausser les stats
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

// 4. Route d'exposition des métriques que Prometheus viendra lire
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
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
// CONFIGURATION DE PRODUCTION / GESTION STATIQUE
// ==========================================

if (process.env.NODE_ENV === 'production') {
  const __dirname = path.resolve();
  app.use('/uploads', express.static('/var/data/uploads'));
  app.use(express.static(path.join(__dirname, '/frontend/build')));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'))
  );
} else {
  const __dirname = path.resolve();
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

app.listen(port, () =>
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`)
);
