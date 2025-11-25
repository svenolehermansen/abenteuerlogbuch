// Globale Variablen
const clientId = "DEINE_CLIENT_ID"; // ← Ersetze später!
const redirectUri = "https://deinefamilie.github.io/abenteuerlogbuch";
let accessToken = null;

// Passwort (ÄNDERE DIES!)
const correctPassword = "FamilienGeheimnis2025"; // ← ÄNDERE DIES! (z. B. "Abenteuer2025")

// Reise-Objekt
let reisen = [];

// Globale Karte
let map = null;

// Initialisierung
document.addEventListener("DOMContentLoaded", async () => {
  const loginScreen = document.getElementById("loginScreen");
  const mainScreen = document.getElementById("mainScreen");
  const loginForm = document.getElementById("loginForm");
  const error = document.getElementById("error");
  const reiseSelect = document.getElementById("reise");

  // Prüfe, ob bereits eingeloggt
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  if (isLoggedIn === "true") {
    loginScreen.style.display = "none";
    mainScreen.style.display = "block";
  }

  // Lade Reisen
  try {
    const response = await fetch("reisen.json");
    reisen = await response.json();
    reisen = reisen.reisen;
    populateReiseSelect();
  } catch (e) {
    console.error("Fehler beim Laden der Reisen:", e);
  }

  // Passwort-Formular
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const password = document.getElementById("password").value;

    if (password === correctPassword) {
      loginScreen.style.display = "none";
      mainScreen.style.display = "block";
      error.style.display = "none";
      localStorage.setItem("isLoggedIn", "true");
      alert("Willkommen im Abenteuer-Logbuch!");
    } else {
      error.style.display = "block";
      document.getElementById("password").value = "";
    }
  });

  // Neue Reise erstellen
  document.getElementById("neueReiseButton").addEventListener("click", () => {
    const name = document.getElementById("neueReiseName").value;
    const start = document.getElementById("neueReiseStart").value;
    const end = document.getElementById("neueReiseEnde").value;

    if (!name || !start || !end) {
      alert("Bitte alle Felder ausfüllen!");
      return;
    }

    const neueReise = {
      name,
      start,
      end,
      ort: "Unbekannt",
      beschreibung: "Neue Reise",
      punkte: []
    };

    reisen.push(neueReise);
    localStorage.setItem("reisen", JSON.stringify(reisen));
    populateReiseSelect();
    alert("Reise erfolgreich erstellt!");
    document.getElementById("neueReiseName").value = "";
    document.getElementById("neueReiseStart").value = "";
    document.getElementById("neueReiseEnde").value = "";
  });

  // Lade Einträge
  renderEntries();

  // Reise-Auswahl
  reiseSelect.addEventListener("change", () => {
    const reiseName = reiseSelect.value;
    if (reiseName) {
      const reise = reisen.find(r => r.name === reiseName);
      if (reise) {
        showReiseInfo(reise);
        showReiseRoute(reise);
      }
    } else {
      document.getElementById("reiseInfo").innerHTML = "<p>Keine Reise ausgewählt.</p>";
      if (map) map.setView([51.505, -0.09], 13);
    }
  });
});

// Fülle Reise-Auswahl
function populateReiseSelect() {
  const select = document.getElementById("reise");
  select.innerHTML = "<option value=''>Keine Reise ausgewählt</option>";
  reisen.forEach(reise => {
    const option = document.createElement("option");
    option.value = reise.name;
    option.textContent = reise.name;
    select.appendChild(option);
  });
}

// Zeige Reise-Info
function showReiseInfo(reise) {
  const infoDiv = document.getElementById("reiseInfo");
  const start = new Date(reise.start).toLocaleDateString("de-DE");
  const end = new Date(reise.end).toLocaleDateString("de-DE");
  const days = Math.ceil((new Date(reise.end) - new Date(reise.start)) / (1000 * 60 * 60 * 24));

  infoDiv.innerHTML = `
    <h3>${reise.name}</h3>
    <p><strong>Start:</strong> ${start}</p>
    <p><strong>Ende:</strong> ${end}</p>
    <p><strong>Dauer:</strong> ${days} Tage</p>
    <p><strong>Ort:</strong> ${reise.ort}</p>
    <p><strong>Beschreibung:</strong> ${reise.beschreibung}</p>
  `;
}

// Zeige Reise-Route
function showReiseRoute(reise) {
  // Wenn Karte noch nicht existiert → erstelle sie
  if (!map) {
    map = L.map("map").setView([51.505, -0.09], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap"
    }).addTo(map);
  }

  // Lösche alte Layer
  map.eachLayer(layer => {
    if (layer instanceof L.Polyline || layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  // Zeige Linien
  const points = reise.punkte.map(p => [p.lat, p.lon]);
  L.polyline(points, { color: "blue", weight: 3 }).addTo(map);

  // Zeige Marker
  const bounds = L.latLngBounds();
  reise.punkte.forEach(p => {
    L.marker([p.lat, p.lon]).addTo(map)
      .bindPopup(`<b>${p.ort}</b><br>${p.datum}`);
    bounds.extend([p.lat, p.lon]);
  });

  // Zoom auf Route
  map.fitBounds(bounds);
}

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
