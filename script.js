// Globale Variablen
const clientId = "DEINE_CLIENT_ID"; // ← Ersetze das später!
const redirectUri = "https://deinefamilie.github.io/abenteuerlogbuch"; // ← Deine GitHub Pages URL
let accessToken = null;

// Initialisierung
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("logForm");
  const entriesDiv = document.getElementById("entries");
  const map = L.map("map").setView([51.505, -0.09], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  // Formular-Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const date = document.getElementById("date").value;
    const location = document.getElementById("location").value;
    const lat = document.getElementById("lat").value;
    const lon = document.getElementById("lon").value;
    const text = document.getElementById("text").value;
    const photoInput = document.getElementById("photo");
    const photoFile = photoInput.files[0];

    // Erstelle Bericht
    const logEntry = {
      date,
      location,
      lat: lat || null,
      lon: lon || null,
      text,
      photo: photoFile ? photoFile.name : null
    };

    // Speichere lokal
    await saveLogLocally(logEntry);

    // Lade Foto hoch (falls vorhanden)
    let photoUrl = null;
    if (photoFile) {
      photoUrl = await uploadPhotoToOneDrive(photoFile, date);
    }

    // Aktualisiere Karte
    if (lat && lon) {
      map.setView([parseFloat(lat), parseFloat(lon)], 15);
      L.marker([parseFloat(lat), parseFloat(lon)]).addTo(map)
        .bindPopup(`<b>${location}</b><br>${text}`);
    }

    // Aktualisiere Übersicht
    renderEntries();

    alert("Eintrag erfolgreich gespeichert und hochgeladen!");
  });

  // Lade Einträge
  renderEntries();

  // Karte initialisieren
  map.setView([51.505, -0.09], 13);
});

// Speichere lokal (in localStorage)
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
