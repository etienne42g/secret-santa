const express = require('express');
const pool = require('./db'); // Assurez-vous d'importer votre pool de connexion à la base de données
const router = express.Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();
const secretKey = process.env.SECRET_KEY;

// Route pour obtenir tous les utilisateurs
router.get('/users', async (req, res) => {
  try {
    const users = await pool.query('SELECT * FROM users');
    res.json(users.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Middleware pour vérifier l'authentification
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

function generateToken(name) {
  return jwt.sign({ name }, secretKey, { expiresIn: '1y' }); // Expire dans 1 an
}

// Route pour récupérer le message existant
router.get('/messages/:sender/:receiver', async (req, res) => {
  const { sender, receiver } = req.params;
  try {
    const result = await pool.query('SELECT message FROM messages WHERE sender = $1 AND receiver = $2', [sender, receiver]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Message not found Here');
    }
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).send('Erreur lors de la récupération du message');
  }
});

// Route pour récupérer le message reçu
router.get('/messagesreceived/:receiver', async (req, res) => {
  const { receiver } = req.params;
  try {
    const result = await pool.query('SELECT sender, message FROM messages WHERE receiver = $1', [receiver]);
    if (result.rows.length > 0) {
      res.json(result.rows); // Renvoie tous les messages reçus
    } else {
      res.status(404).send('Messages not found');
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).send('Erreur lors de la récupération des messages');
  }
});

// Route pour envoyer un message
router.post('/messages', ensureAuthenticated, async (req, res) => {
  const { sender, receiver, message } = req.body;

  try {
    // Insertion du message dans la base de données
    const result = await pool.query(
      'INSERT INTO messages (sender, receiver, message) VALUES ($1, $2, $3)',
      [sender, receiver, message]
    );
    console.log('Résultat de l\'insertion:', result); // Log du résultat de l'insertion
    res.status(200).send('Message envoyé avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'insertion du message:', error);
    res.status(500).send('Erreur lors de l\'envoi du message');
  }
});

// Route pour ajouter un utilisateur
router.post('/users', async (req, res) => {
  try {
    const { name, spouse, email } = req.body;
    const newUser = await pool.query(
      'INSERT INTO users (name, spouse, email) VALUES ($1, $2, $3) RETURNING *',
      [name, spouse, email]
    );
    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Route pour supprimer un utilisateur
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

function generatePairs(users) {
    const pairs = [];
    const givers = [...users];
    const receivers = [...users];
  
    // Mélangez les donneurs et les receveurs pour garantir l'aléatoire
    givers.sort(() => Math.random() - 0.5);
    receivers.sort(() => Math.random() - 0.5);
  
    // Assurez-vous que personne ne se donne un cadeau à lui-même
    for (let i = 0; i < givers.length; i++) {
      if (givers[i].id === receivers[i].id) {
        // Si quelqu'un se donne un cadeau à lui-même, échangez avec le suivant
        const temp = receivers[i];
        receivers[i] = receivers[(i + 1) % receivers.length];
        receivers[(i + 1) % receivers.length] = temp;
      }
    }
  
    // Créez les paires
    for (let i = 0; i < givers.length; i++) {
      pairs.push({
        giver: givers[i].name,
        receiver: receivers[i].name,
      });
    }
    return pairs;
  }  

// Route pour générer des paires
router.post('/generate-pairs', async (req, res) => {
    try {
      const users = await pool.query('SELECT * FROM users');
      const pairs = generatePairs(users.rows);
  
      // Enregistrer les paires dans la base de données
      for (const pair of pairs) {
        await pool.query('INSERT INTO pairs (giver, receiver) VALUES ($1, $2)', [pair.giver, pair.receiver]);
      }
  
      res.json(pairs);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });

// Route pour voir une paire spécifique
router.get('/pairs/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const pair = await pool.query('SELECT * FROM pairs WHERE giver = $1', [name]);
      if (pair.rows.length === 0) {
        return res.status(404).json({ message: 'Pair not found' });
      }
      res.json(pair.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });

  router.get('/generate-link/:name', async (req, res) => {
    const { name } = req.params;
    if (!name) {
      return res.status(400).send('Nom manquant');
    }
  
    try {
      const token = generateToken(name);
      res.status(200).json({ token });
    } catch (error) {
      console.error('Error generating link:', error);
      res.status(500).send('Erreur lors de la génération du lien');
    }
  });

module.exports = router;