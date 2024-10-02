document.addEventListener('DOMContentLoaded', async () => {
  let pairReceiver = null;
  let participants = [];

  let user = JSON.parse(localStorage.getItem("user"));;

 console.log('test:', user);

  if (user) {
    document.getElementById('welcome-message').textContent = `Bonjour, ${user.name}`;
    try {
      const response = await fetch(`http://localhost:3000/api/pairs/${user.name}`);
      if (response.ok) {
        const data = await response.json();
        pairReceiver = data.receiver;

        // Charger le message existant depuis la base de données
        const messageResponse = await fetch(`http://localhost:3000/api/messages/${user.name}/${pairReceiver}`);
        if (messageResponse.ok) {
          const messageData = await messageResponse.json();
          document.getElementById('message').value = messageData.message;
        } else {
          console.error('Failed to fetch message from API');
        }
      } else {
        console.error('Failed to fetch receiver from API');
        document.getElementById('result').textContent = 'Aucune paire trouvée';
      }} catch {};

// Récupérer les messages reçus depuis la base de données
try {
  const receivedMessagesResponse = await fetch(`http://localhost:3000/api/messagesreceived/${user.name}`);
  if (receivedMessagesResponse.ok) {
    const receivedMessagesData = await receivedMessagesResponse.json();
    const messageListContent = document.getElementById('message-list-content');
    if (!messageListContent) {
      console.error('Element with ID "message-list-content" not found');
      return;
    }

    receivedMessagesData.forEach(message => {
      const li = document.createElement('li');
      li.textContent = `De ${message.sender}: ${message.message}`;
      li.classList.add('list-group-item');
      messageListContent.appendChild(li);
    });
  } else {
    console.error('Failed to fetch received messages from API');
  }
} catch (error) {
  console.error('Error fetching received messages:', error);
}}

  try {
    const participantsResponse = await fetch('http://localhost:3000/api/users');
    if (participantsResponse.ok) {
      const participantsData = await participantsResponse.json();
      participants = participantsData.map(participant => participant.name);
    } else {
      console.error('Failed to fetch participants from API');
    }
  } catch (error) {
    console.error('Error fetching participants:', error);
  }

  const colors = ['#d4423e', '#095228', '#FFFAFA'];

  const segments = participants.map((name, index) => ({
    fillStyle: colors[index % colors.length],
    text: name,
    textFillStyle: colors[index % colors.length] === '#095228' ? '#FFFFFF' : '#000000'
  }));

  let theWheel = new Winwheel({
    'canvasId': 'canvas',
    'numSegments': segments.length,
    'outerRadius': 150,
    'textFontSize': 16,
    'segments': segments,
    'animation': {
      'type': 'spinToStop',
      'duration': 2.5,
      'spins': 2,
      'callbackFinished': alertPrize
    }
  });

  document.getElementById('spin-button').addEventListener('click', startSpin);

  function startSpin() {
    if (pairReceiver) {
      const winningSegmentIndex = participants.indexOf(pairReceiver);
      if (winningSegmentIndex !== -1) {
        const stopAngle = theWheel.getRandomForSegment(winningSegmentIndex + 1);
        theWheel.animation.stopAngle = stopAngle;
        theWheel.startAnimation();
      } else {
        console.error('Receiver not found in participants list');
      }
    } else {
      console.error('No receiver found for the user');
    }
  }

  function alertPrize(indicatedSegment) {
    document.getElementById('result').textContent = `Vous donnez à : ${indicatedSegment.text}`;
  }

  window.logout = async function() {
    await fetch('http://localhost:3000/logout', {
      method: 'GET',
    });
    localStorage.removeItem('user');
    window.location.href = '/';
  }

  // Gestion de l'envoi du message
  document.getElementById('message-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = document.getElementById('message').value;
    if (!pairReceiver) {
      console.error('pairReceiver is null');
      document.getElementById('message-result').textContent = 'Erreur : destinataire non défini.';
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sender: user.name, receiver: pairReceiver, message: message })
      });
      if (response.ok) {
        document.getElementById('message-result').textContent = 'Message envoyé avec succès !';
      } else {
        document.getElementById('message-result').textContent = 'Échec de l\'envoi du message.';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      document.getElementById('message-result').textContent = 'Erreur lors de l\'envoi du message.';
    }
  });
});