// Globale Variablen
const clientId = "DEINE_CLIENT_ID"; // ← Ersetze später!
const redirectUri = "https://deinefamilie.github.io/abenteuerlogbuch";
let accessToken = null;

// Passwort (ÄNDERE DAS!)
const correctPassword = "FamilienGeheimnis2025"; // ← ÄNDERE DIES! (z. B. "Abenteuer2025")

// Initialisierung – nur nach Laden des DOM
document.addEventListener("DOMContentLoaded", () => {
  const loginScreen = document.getElementById("loginScreen");
  const mainScreen = document.getElementById("mainScreen");
  const loginForm = document.getElementById("loginForm");
  const error = document.getElementById("error");

  // Passwort-Formular
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const password = document.getElementById("password").value;

    if (password === correctPassword) {
      loginScreen.style.display = "none";
      mainScreen.style.display = "block";
      error.style.display = "none";
      alert("Willkommen im Abenteuer-Logbuch!");
    } else {
      error.style.display = "block";
      document.getElementById("password").value = "";
    }
  });

  // Lade Einträge
  renderEntries();

  // Karte initialisieren
  const map = L.map("map").setView([51.505, -0.09], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);
});

// Speichere lokal
async function saveLogLocally(entry) {
  const logs = JSON.parse(localStorage.getItem("logs") || "[]");
  logs.push(entry);
  localStorage.setItem("logs", JSON.stringify(logs));
}

// Lade Fotos hoch (OneDrive)
async function uploadPhotoToOneDrive(file, date) {
  const fileName = `${date}-${file.name}`;
  const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent("Abenteuer-Logbuch/photos/")}${fileName}:/content`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": file.type
    },
    body: file
  });

  if (!response.ok) {
    throw new Error("Fehler beim Hochladen des Fotos");
  }

  return `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent("Abenteuer-Logbuch/photos/")}${fileName}`;
}

// Rendere Einträge
function renderEntries() {
  const entriesDiv = document.getElementById("entries");
  const logs = JSON.parse(localStorage.getItem("logs") || "[]");

  entriesDiv.innerHTML = "";

  logs.slice().reverse().forEach(entry => {
    const div = document.createElement("div");
    div.className = "entry";

    let locationText = entry.location;
    if (entry.lat && entry.lon) {
      locationText += ` (${entry.lat}, ${entry.lon})`;
    }

    div.innerHTML = `
      <h3>${entry.date} – ${entry.location}</h3>
      <p>${entry.text}</p>
      ${entry.photo ? `<img src="https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(`Abenteuer-Logbuch/photos/${entry.photo}`)}" alt="Foto" />` : ''}
      <div class="location">${locationText}</div>
    `;
    entriesDiv.appendChild(div);
  });
}
