document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    let pairReceiver = null;
  
    if (user) {
      console.log('Utilisateur chargé:', user); // Message de débogage
      document.getElementById('welcome-message').textContent = `Bonjour, ${user.name}`;
      const response = await fetch(`http://localhost:3000/api/pairs/${user.name}`);
      console.log(`Statut de la réponse : ${response.status}`); // Message de débogage
      if (response.ok) {
        const data = await response.json();
        pairReceiver = data.receiver;
        console.log('Receiver from API:', pairReceiver);
      } else {
        console.error('Failed to fetch receiver from API');
        document.getElementById('result').textContent = 'Aucune paire trouvée';
      }
    } else {
      console.log('Aucun utilisateur trouvé dans localStorage'); // Message de débogage
      window.location.href = '/';
    }
  
    const participants = ["Etienne", "Maéva", "Jean-Jacques", "Sandrine", "Antoinette", "Ketsia", "Léa", "André"];
    const segments = participants.map(name => ({ fillStyle: getRandomColor(), text: name }));
  
    let theWheel = new Winwheel({
      'numSegments': segments.length,
      'outerRadius': 150,
      'textFontSize': 16,
      'segments': segments,
      'animation': {
        'type': 'spinToStop',
        'duration': 5,
        'spins': 8,
        'callbackFinished': alertPrize
      }
    });
  
    window.startSpin = function() {
      if (pairReceiver) {
        const winningSegmentIndex = participants.indexOf(pairReceiver);
        if (winningSegmentIndex !== -1) {
          const stopAngle = theWheel.getRandomForSegment(winningSegmentIndex + 1);
          console.log('Calculated stop angle:', stopAngle);
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
  
    function getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }
  });