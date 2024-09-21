document.addEventListener('DOMContentLoaded', loadUsers);

async function loadUsers() {
  const response = await fetch('http://localhost:3000/api/users', {
    method: 'GET',
  });
  const users = await response.json();
  users.forEach(user => displayUser(user));
}

async function addUser() {
  const name = document.getElementById('name').value;
  const spouse = document.getElementById('spouse').value;
  const email = document.getElementById('email').value;
  const errorMessage = document.getElementById('error-message');

  if (!name || !email) {
    errorMessage.textContent = 'Le nom et l\'email sont obligatoires.';
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, spouse, email }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'ajout de l\'utilisateur.');
    }

    const user = await response.json();
    displayUser(user);
    errorMessage.textContent = ''; // Clear error message on success
  } catch (error) {
    errorMessage.textContent = error.message;
  }
}

async function deleteUser(id) {
  await fetch(`http://localhost:3000/api/users/${id}`, {
    method: 'DELETE',
  });
  document.getElementById(`user-${id}`).remove();
}

async function generatePairs() {
  const response = await fetch('http://localhost:3000/api/generate-pairs', {
    method: 'POST',
  });
  const pairs = await response.json();
  displayPairs(pairs);
}

async function viewPair() {
  const name = document.getElementById('view-name').value;
  const response = await fetch(`http://localhost:3000/api/pairs/${name}`, {
    method: 'GET',
  });
  if (response.ok) {
    const pair = await response.json();
    displayPair(pair);
  } else {
    document.getElementById('pair-result').textContent = 'Aucune paire trouvée';
  }
}

function displayUser(user) {
  const userList = document.getElementById('user-list');
  const userItem = document.createElement('div');
  userItem.id = `user-${user.id}`;
  userItem.innerHTML = `
    ${user.name} (${user.spouse}) - ${user.email}
    <button onclick="deleteUser(${user.id})">Supprimer</button>
  `;
  userList.appendChild(userItem);
}

function displayPairs(pairs) {
  const pairsList = document.getElementById('pairs-list');
  pairsList.innerHTML = '';
  pairs.forEach(pair => {
    const pairItem = document.createElement('div');
    pairItem.textContent = `${pair.giver} -> ${pair.receiver}`;
    pairsList.appendChild(pairItem);
  });
}

function displayPair(pair) {
  const pairResult = document.getElementById('pair-result');
  pairResult.textContent = `Vous devez donner un cadeau à ${pair.receiver}`;
}

async function logout() {
  await fetch('http://localhost:3000/logout', {
    method: 'GET',
  });
  window.location.href = '/';
}