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

  // Lade Einträge
  renderEntries();

  // Karte initialisieren
  const map = L.map("map").setView([51.505, -0.09], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

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
      map.setView([51.505, -0.09], 13);
    }
  });
});
