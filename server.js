require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('./auth'); // Importer la configuration de Passport
const routes = require('./routes');
const PORT = process.env.PORT;
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;
const app = express();
const pool = require('./db.js');

// Middleware pour parser le JSON
app.use(express.json());

// Configurer sessions
app.use(session({
  secret: process.env.SESSION_SECRET, // Utiliser le secret de session depuis .env
  resave: false,
  saveUninitialized: false
}));

// Initialiser Passport
app.use(passport.initialize());
app.use(passport.session());

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname)));

// Middleware pour vérifier si l'utilisateur est authentifié
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated() || req.query.token) { //@TODO: Ajouter la vérification du token
    return next();
  }
  res.redirect('/');
}

// Utiliser les routes définies dans routes.js avec protection //@TODO: Ajouter la protection des appels API
app.use('/api', routes);

// Fonction pour sécuriser les chemins de fichiers
function securePath(filePath) {
  const basePath = path.join(__dirname);
  const resolvedPath = path.resolve(basePath, filePath);
  if (!resolvedPath.startsWith(basePath)) {
    throw new Error('Tentative d\'accès non autorisé à un fichier.');
  }
  return resolvedPath;
}

async function getUserByName(username) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE name = $1', [username]);
    return result.rows[0];
  } catch (err) {
    console.error('Error executing query', err.stack);
    throw err;
  }
};

app.get('/view-pair-token', async (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(400).send('Token manquant');
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    const username = decoded.name; //OK

    const user = await getUserByName(username);
    if (user.length === 0) {
      return res.status(404).send('Utilisateur non trouvé');
    }

    res.send(`
      <script>
        localStorage.setItem('user', JSON.stringify(${JSON.stringify(user)}));
        window.location.href = '/view-pair';
      </script>
    `);

    //res.sendFile(securePath('view-pair.html'));
  } catch (err) {
    return res.status(400).send("Token invalide");
  }
});

// Route pour servir la page principale
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/view-pair');
  } else {
    res.sendFile(securePath('index.html'));
  }
});

// Route pour démarrer l'authentification avec Google
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

app.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: '/404'
  }), (req, res) => {
    const user = {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    };
    console.log('Utilisateur authentifié:', user); // Message de débogage
    res.send(`
        <script>
          localStorage.setItem('user', JSON.stringify(${JSON.stringify(user)}));
          window.location.href = '/view-pair';
        </script>
      `);
    });

// Route pour servir la page "Voir à qui je donne"
app.get('/view-pair', (req, res) => {
  res.sendFile(securePath('view-pair.html'));
});

// Route pour servir la page d'administration
app.get('/admin', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
  });

app.get('/404', (req, res) => {
    res.sendFile(path.join(__dirname, 'page404.html'));
  });

// Route pour servir la page d'administration
app.get('/welcome', ensureAuthenticated, (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/view-pair');
      } else {
        res.sendFile(securePath('index.html'));
      }
  });

// Route pour se déconnecter
app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});