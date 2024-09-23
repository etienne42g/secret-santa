document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM is fully loaded and parsed");
  const user = JSON.parse(localStorage.getItem("user"));
  let pairReceiver = null;

  if (user) {
    logDebug("Utilisateur chargé: " + user.name);
    document.getElementById(
      "welcome-message"
    ).textContent = `Bonjour, ${user.name}`;

    try {
      const response = await fetch(
        `http://localhost:3000/api/pairs/${user.name}`
      );
      if (response.ok) {
        const data = await response.json();
        pairReceiver = data.receiver;
        logDebug("Receiver from API: " + pairReceiver);
      } else {
        logDebug("Failed to fetch receiver from API");
        document.getElementById("result").textContent = "Aucune paire trouvée";
      }
    } catch (error) {
      logDebug("Error fetching receiver: " + error);
    }
  } else {
    logDebug("Aucun utilisateur trouvé dans localStorage");
    window.location.href = "/";
  }
});

const participants = [
  "Etienne",
  "Maéva",
  "Jean-Jacques",
  "Sandrine",
  "Antoinette",
  "Ketsia",
  "Léa",
  "André",
];
const segments = participants.map((name) => ({
  fillStyle: getRandomColor(),
  text: name,
}));

let theWheel = new Winwheel({
  numSegments: segments.length,
  outerRadius: 150,
  textFontSize: 16,
  segments: segments,
  animation: {
    type: "spinToStop",
    duration: 5,
    spins: 8,
    callbackFinished: alertPrize,
  },
});

window.startSpin = function () {
  if (pairReceiver) {
    const winningSegmentIndex = participants.indexOf(pairReceiver);
    if (winningSegmentIndex !== -1) {
      const stopAngle = theWheel.getRandomForSegment(winningSegmentIndex + 1);
      logDebug("Calculated stop angle: " + stopAngle);
      theWheel.animation.stopAngle = stopAngle;
      theWheel.startAnimation();
    } else {
      logDebug("Receiver not found in participants list");
    }
  } else {
    logDebug("No receiver found for the user");
  }
};

function alertPrize(indicatedSegment) {
  document.getElementById(
    "result"
  ).textContent = `Vous donnez à : ${indicatedSegment.text}`;
}

window.logout = async function () {
  await fetch("http://localhost:3000/logout", {
    method: "GET",
  });
  localStorage.removeItem("user");
  window.location.href = "/";
};

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Gestion de l'envoi du message
document
  .getElementById("message-form")
  .addEventListener("submit", async (event) => {
    console.log("Message form submitted");

    const message = document.getElementById("message").value;
    logDebug("pairReceiver before sending message: " + pairReceiver);

    if (!pairReceiver) {
      logDebug("pairReceiver is null");
      document.getElementById("message-result").textContent =
        "Erreur : destinataire non défini.";
      return;
    }

    try {
      logDebug("Envoi du message à: " + pairReceiver);
      const response = await fetch("http://localhost:3000/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: user.name,
          receiver: pairReceiver,
          message: message,
        }),
      });

      if (response.ok) {
        document.getElementById("message-result").textContent =
          "Message envoyé avec succès !";
      } else {
        document.getElementById("message-result").textContent =
          "Échec de l'envoi du message.";
      }
    } catch (error) {
      logDebug("Error sending message: " + error);
      document.getElementById("message-result").textContent =
        "Erreur lors de l'envoi du message.";
    }
  });
