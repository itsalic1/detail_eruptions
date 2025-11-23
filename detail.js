// dichiarazione delle variabili
let data;
let img;
let eruptions = [];
let selectedName;
let selectedYear;
let selectedDeaths;
let startIndex = 0;
let visibleCount = 3;
let skullIcon; bandAidIcon; coinIcon; houseIcon;

function preload() {
  data = loadTable("data_impatto.csv", "csv", "header");
  img = loadImage("world_map.png");
  skullIcon = loadImage("human-skull.png");
  bandAidIcon = loadImage("band-aid.png");
  coinIcon = loadImage("coin.png")
  houseIcon = loadImage("home.png")
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Helvetica");

  // lettura e trasformazione dei parametri (in particolar modo dell'anno in numero intero) nell'URL
  selectedName = getQueryParam("name");
  selectedYear = int(getQueryParam("year"));
  selectedDeaths = getQueryParam("deaths");

  if (!selectedName) return;

  /* scorre le righe dal CSV, controlla se appartiene al vulcano scelto e,
  in caso di corrispondenza, legge i dati e li salva in eruptions[] */
  for (let i = 0; i < data.getRowCount(); i++) {
    if (data.getString(i, "Name") === selectedName) {
      eruptions.push({
        year: int(data.getString(i, "Year")),
        type: data.getString(i, "Type"),
        country: data.getString(i, "Country"),
        vei: data.getString(i, "VEI") || "Not Available",
        deaths: data.getString(i, "Deaths") || "Not Available",
        injuries: data.getString(i, "Injuries") || "Not Available",
        lat: data.getString(i, "Latitude"),
        lon: data.getString(i, "Longitude")
      });
    }
  }

  // serve ad ordinare l'array in base all'anno (dal più antico al più recente)
  eruptions.sort((a, b) => a.year - b.year);

  /* -- ORGANIZZAZIONE TIMELINE -- 
  è necessario per capire quale eruzione viene mostrata come selezionata e, 
  di conseguenza, posizionare correttamente la timeline in modo che l'eruzione sia visibile */
let selectedIndex = -1;
for (let i = 0; i < eruptions.length; i++) {
  let eruption = eruptions[i];
  if (eruption.year === selectedYear && String(eruption.deaths) === String(selectedDeaths)) {
    selectedIndex = i;
    break;
  }
}

// se non trova nulla, prende la prima eruzione
if (selectedIndex === -1 && eruptions.length > 0) {
  selectedIndex = 0;
  selectedYear = eruptions[0].year;
  selectedDeaths = String(eruptions[0].deaths);
}

// calcola da dove far partire la timeline
let maxStart = 0;
if (eruptions.length > visibleCount) {
  maxStart = eruptions.length - visibleCount;
}

// calcola quante eruzione devono essere posizionate a sinistra
let halfVisible = Math.floor(visibleCount / 2);
startIndex = selectedIndex - halfVisible;

// assicuro che startIndex resti nei limiti
if (startIndex < 0) {
  startIndex = 0;
}
if (startIndex > maxStart) {
  startIndex = maxStart;
}
}

function draw() {
  background(0);
  image(img, 0, 0, width, height);

  /* controlla se l'array eruptions[] è vuoto e, in quel caso, 
  presenta il messaggio di fallback */
  if (eruptions.length === 0) {
    fill(255);
    text("Nessun vulcano selezionato", 50, 50);
    return;
  }

  // cerca nell'array l'eruzione che corrisponde ai dat selezionati
  let selected = null;
  for (let i = 0; i < eruptions.length; i++) {
  let e = eruptions[i];
  // controlla se l'eruzione ha lo stesso anno e lo stesso numero di morti della selezionata
  if (e.year === selectedYear && String(e.deaths) === String(selectedDeaths)) {
    // se la condizione è vera, assegno alla variabile selected
    selected = e;
    break;
  }
}

// -- COMPOSIZIONE DELLA SCENA - richiamo funzioni --
  drawVolcanoType(selected.type);
  drawInfoBox(selected);
  drawDeathsIcons(selected.deaths);      
  drawInjuriesIcons(selected.injuries);  
  drawDamagesIcons(selected.damages); 
  drawHousesIcons(selected.houses); 
  drawTimeline();
  drawBackButton();
}

// funzione per leggere i parametri dell'URL 
function getQueryParam(param) {
  let urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// -- CLASSIFICAZIONE DELLE ICONE --

 // DEATHS - soglia per la colorazione delle icone 
function deathsToIcons(value) {
  // se non c'è valore, ritorna subito "N/A"
  if (value === null || value === undefined) {
    return { count: 0, label: "N/A", num: NaN };
  }
  // trasforma in stringa e toglie spazi
  let s = String(value).trim();
  // se è vuoto o scritto "not available" o "na" - ritona di nuovo "N/A"
  if (s === "" || s.toLowerCase() === "not available" || s.toLowerCase() === "na") {
    return { count: 0, label: "N/A", num: NaN };
  }
  // rimuove virgole e converte in numero intero
  let num = parseInt(s.replace(/,/g, ""), 10);
  // se non è un numero valido, ritorna "N/A"
  if (isNaN(num)) {
    return { count: 0, label: "N/A", num: NaN };
  }
  // decido quante icone mostrare in base al numero
  let count = 0;
  if (num < 50) {
    count = 1;
  } else if (num < 250) {
    count = 2;
  } else if (num < 1500) {
    count = 3;
  } else if (num < 5000) {
    count = 4;
  } else {
    count = 5;
  }
  // ritorno un oggetto con i dati
  return { count: count, label: s, num: num };
}

// INJURIES - soglia per la colorazione delle icone
function injuriesToIcons(value) {
  if (value === null || value === undefined) {
    return { count: 0, label: "N/A", num: NaN };
  }
  
  let s = String(value).trim();

  if (s === "" || s.toLowerCase() === "not available" || s.toLowerCase() === "na") {
    return { count: 0, label: "N/A", num: NaN };
  }

  let num = parseInt(s.replace(/,/g, ""), 10);

  if (isNaN(num)) {
    return { count: 0, label: "N/A", num: NaN };
  }

  let count = 0;
  if (num < 50) {
    count = 1;
  } else if (num < 250) {
    count = 2;
  } else if (num < 500) {
    count = 3;
  } else if (num < 1000) {
    count = 4;
  } else {
    count = 5;
  }

  return { count: count, label: s, num: num };
}

// DAMAGES (in milioni) - soglia per la colorazione delle icone
function damagesToIcons(value) {
  if (value === null || value === undefined) {
    return { count: 0, label: "N/A", num: NaN };
  }

  let s = String(value).trim();

  if (s === "" || s.toLowerCase() === "not available" || s.toLowerCase() === "na") {
    return { count: 0, label: "N/A", num: NaN };
  }

  let num = parseInt(s.replace(/,/g, ""), 10);

  if (isNaN(num)) {
    return { count: 0, label: "N/A", num: NaN };
  }

  let count = 0;
  if (num < 25) {
    count = 1;
  } else if (num < 75) {
    count = 2;
  } else if (num < 150) {
    count = 3;
  } else if (num < 500) {
    count = 4;
  } else {
    count = 5;
  }

  return { count: count, label: s, num: num };
}

// HOUSES DESTROYED - soglia per la colorazione delle icone
function housesToIcons(value) {
  if (value === null || value === undefined) {
    return { count: 0, label: "N/A", num: NaN };
  }

  let s = String(value).trim();

  if (s === "" || s.toLowerCase() === "not available" || s.toLowerCase() === "na") {
    return { count: 0, label: "N/A", num: NaN };
  }

  let num = parseInt(s.replace(/,/g, ""), 10);

  if (isNaN(num)) {
    return { count: 0, label: "N/A", num: NaN };
  }

  let count = 0;
  if (num < 50) {
    count = 1;
  } else if (num < 150) {
    count = 2;
  } else if (num < 500) {
    count = 3;
  } else if (num < 2500) {
    count = 4;
  } else {
    count = 5;
  }

  return { count: count, label: s, num: num };
}

// -- DISEGNO DEI VULCANI -- 
function drawVolcanoType(type) {
  push();
  translate(width / 2, height / 2);
  stroke(245, 40, 0);
  strokeWeight(3);

  // selezione in base alla tipologia di vulcano
  switch (type) {
  case "Stratovolcano":
    noFill();
    for (let r = 160; r >= 60; r -= 30) {
      ellipse(0, 0, r, r * 0.8);
    }
    break;

  case "Shield volcano":
    fill(100, 30, 30);
    ellipse(0, 0, 200, 80);
    break;

  case "Caldera":
    noFill();
    ellipse(0, 0, 180, 120);
    fill(20);
    ellipse(0, 0, 60, 40);
    break;

  default:
    noFill();
    ellipse(0, 0, 140, 100);
}
pop();
}

// -- INFO BOX --
function drawInfoBox(v) {
  let boxWidth = 200;
  let boxHeight = 120;
  let marginRight = 60;
  let marginTop = 40;
  let padding = 12;

  // posizionamento della info box sul canvas
  let x = width - boxWidth - marginRight;
  let y = marginTop;

  noFill();
  stroke(245, 40, 0);
  strokeWeight(3);
  rect(x, y, boxWidth, boxHeight, 12);

  noStroke();
  fill(245, 40, 0);
  textAlign(LEFT, TOP);

  // titolo - nome del vulcano
  textSize(18);
  textStyle(BOLD);
  text(selectedName, x + padding, y + padding);

  // testo - informazioni aggiuntive
  textSize(14);
  textStyle(NORMAL);
  let otherInfo =
    "Country: " + v.country + "\n" +
    "Type: " + v.type + "\n" +
    "VEI: " + v.vei;

  // posizionamento del testo 
  text(otherInfo, x + padding, y + padding + 34);
}

// -- ICONE DEATHS --
function drawDeathsIcons(value) {
  let x = 40;
  let y = height / 2 - 150;
  let maxIcons = 5;
  let iconSize = 24;
  let spacingX = 40;

  // normalizzazione dei dati (icone attive, testo e numero convertito)
  let info = deathsToIcons(value);

  // se info è pari a NaN, allora l'icona sarà grigia
  let activeColor;
  if (isNaN(info.num)) {
    activeColor = color(150);
  } else {
    // altrimenti l'icona è arancione
    activeColor = color(255, 255, 0);
  }

  // definisce se l'icona i è attiva
  for (let i = 0; i < maxIcons; i++) {
    if (i < info.count) {
      // definizione stato attivo
      tint(activeColor);
    } else {
      // devinizione stato inattivo
      tint(100);
    }

    // se skullIcon esiste e ha larghezza > 0, disegna l'immagine
    if (skullIcon && skullIcon.width > 0) {
      image(skullIcon, x + i * spacingX, y, iconSize, iconSize);
      // fallback per icona non disponibile
    } else {
      noStroke();
      if (i < info.count) {
        fill(activeColor);
      } else {
        fill(color(100));
      }
      rect(x + i * spacingX, y, iconSize, iconSize, 6);
    }
  }
  // utile per evitare che influenzi altri disegni
  noTint();

  // stile e dimensioni del testo
  fill(255);
  textSize(14);
  textAlign(LEFT, CENTER);
  text("Deaths: " + info.label, x + spacingX * maxIcons + 20, y + iconSize / 2);
}

//-- ICONE INJURIES --
function drawInjuriesIcons(value) {
  let x = 40;
  let y = height / 2 - 110;
  let maxIcons = 5;
  let iconSize = 24;
  let spacingX = 40;

  let info = injuriesToIcons(value);

  let activeColor;
  if (isNaN(info.num)) {
    activeColor = color(150);
  } else {
    activeColor = color(255, 255, 0);
  }

  for (let i = 0; i < maxIcons; i++) {
    if (i < info.count) {
      tint(activeColor);
    } else {
      tint(100);
    }

    if (bandAidIcon && bandAidIcon.width > 0) {
      image(bandAidIcon, x + i * spacingX, y, iconSize, iconSize);
    } else {
      noStroke();
      if (i < info.count) {
        fill(activeColor);
      } else {
        fill(color(100));
      }
      rect(x + i * spacingX, y, iconSize, iconSize, 6);
    }
  }

  noTint();

  fill(255);
  textSize(14);
  textAlign(LEFT, CENTER);
  text("Injuries: " + info.label, x + spacingX * maxIcons + 20, y + iconSize / 2);
}

// -- ICONE DAMAGES --
function drawDamagesIcons(value) {
  let x = 40;
  let y = height / 2 - 70; 
  let maxIcons = 5;
  let iconSize = 24;
  let spacingX = 40;

  let info = damagesToIcons(value);

  let activeColor;
  if (isNaN(info.num)) {
    activeColor = color(150); 
  } else {
    activeColor = color(255, 255, 0); 
  }

  for (let i = 0; i < maxIcons; i++) {
    if (i < info.count) {
      tint(activeColor);
    } else {
      tint(100);
    }

    if (coinIcon && coinIcon.width > 0) {
      image(coinIcon, x + i * spacingX, y, iconSize, iconSize);
    } else {
      noStroke();
      if (i < info.count) {
        fill(activeColor);
      } else {
        fill(color(100));
      }
      rect(x + i * spacingX, y, iconSize, iconSize, 6);
    }
  }

  noTint();

  fill(255);
  textSize(14);
  textAlign(LEFT, CENTER);
  text("Damages (M): " + info.label, x + spacingX * maxIcons + 20, y + iconSize / 2);
}

// -- ICONE HOUSE DESTRUCTIONS --
function drawHousesIcons(value) {
  let x = 40;
  let y = height / 2 - 30;
  let maxIcons = 5;
  let iconSize = 24;
  let spacingX = 40;

  let info = housesToIcons(value);

  let activeColor;
  if (isNaN(info.num)) {
    activeColor = color(150); 
  } else {
    activeColor = color(255, 255, 0); 
  }

  for (let i = 0; i < maxIcons; i++) {
    if (i < info.count) {
      tint(activeColor);
    } else {
      tint(100);
    }

    if (houseIcon && houseIcon.width > 0) {
      image(houseIcon, x + i * spacingX, y, iconSize, iconSize);
    } else {
      noStroke();
      if (i < info.count) {
        fill(activeColor);
      } else {
        fill(color(100));
      }
      rect(x + i * spacingX, y, iconSize, iconSize, 6);
    }
  }

  noTint();

  fill(255);
  textSize(14);
  textAlign(LEFT, CENTER);
  text("Houses destroyed: " + info.label, x + spacingX * maxIcons + 20, y + iconSize / 2);
}

// -- TIMELINE -- 
function drawTimeline() {
  let y = height - 100;
  let orange = color(245, 40, 0);
  let orangeLight = "#FFA733";

  // calcolo della lunghezza e posizione della linea 
  let lineLength = width / 2;
  let lineStart = (width - lineLength) / 2;
  let lineEnd = lineStart + lineLength;

   // disegna la linea della timeline
  stroke(orange);
  strokeWeight(5);
  line(lineStart, y, lineEnd, y);

  // seleziona il sottoinsieme di eruzioni visibili
  let endIndex = min(startIndex + visibleCount, eruptions.length);
  let subset = eruptions.slice(startIndex, endIndex);

  // dimensione dei pallini
  let dotSize = 16;

  // calcola le posizioni dei punti in base a quante eruzioni sono visibili
  let positions = [];
  if (subset.length === 1) {
    positions = [lineStart + lineLength / 2];
  } else if (subset.length === 2) {
    positions = [lineStart + lineLength / 3, lineStart + (2 * lineLength) / 3];
  } else {
    let spacing = lineLength / (visibleCount + 1);
    positions = [lineStart + spacing, lineStart + 2 * spacing, lineStart + 3 * spacing];
  }

  for (let i = 0; i < subset.length; i++) {
    let x = positions[i];
    let isHovered = dist(mouseX, mouseY, x, y) < dotSize / 2;

    // evidenzia selezionato (year + deaths) o hover
    if (
      subset[i].year === selectedYear &&
      String(subset[i].deaths) === String(selectedDeaths)
    ) {
      fill(orangeLight);
    } else if (isHovered) {
      fill(orangeLight);
    } else {
      fill(orange);
    }

    noStroke();
    ellipse(x, y, dotSize);

    // etichetta anno
    fill(255);
    textAlign(CENTER);
    textSize(12);
    text(formatYear(subset[i].year), x, y - dotSize - 6);
  }

  // frecce di navigazione
  fill(orange);
  noStroke();
  if (startIndex > 0) {
    triangle(lineStart - 20, y, lineStart - 10, y - 5, lineStart - 10, y + 5);
  }
  if (endIndex < eruptions.length) {
    triangle(lineEnd + 20, y, lineEnd + 10, y - 5, lineEnd + 10, y + 5);
  }
}

// funzione di supporto per formattare gli anni
function formatYear(year) {
  if (year < 0) {
    return Math.abs(year) + " a.C"; // anni negativi converiti in positivi + "a.C"
  } else {
    return year.toString(); // anni "positivi" invariati
  }
}

// -- BACK BUTTON --

function drawBackButton() {
  fill(255);
  textSize(18);
  textAlign(CENTER, CENTER);
  text("←", 50, 40);
}

// -- INTERAZIONE --

function mousePressed() {
  // collegamento page principale
  if (mouseX > 20 && mouseX < 80 && mouseY > 20 && mouseY < 60) {
    window.location.href = "index.html";
    return;
  }

  // geometria timeline
  let y = height - 100;
  let lineLength = width / 2;
  let lineStart = (width - lineLength) / 2;
  let lineEnd = lineStart + lineLength;

  // freccia sinistra
  if (mouseX > lineStart - 30 && mouseX < lineStart && mouseY > y - 10 && mouseY < y + 10) {
    if (startIndex > 0) startIndex--;
    return;
  }

  // freccia destra
  if (mouseX > lineEnd && mouseX < lineEnd + 30 && mouseY > y - 10 && mouseY < y + 10) {
    if (startIndex + visibleCount < eruptions.length) startIndex++;
    return;
  }

  // click su pallino timeline, con link name + year + deaths 
  let endIndex = min(startIndex + visibleCount, eruptions.length);
  let subset = eruptions.slice(startIndex, endIndex);

  // posizioni coerent con la funzione drawTimeline
  let positions = [];
  if (subset.length === 1) {
    positions = [lineStart + lineLength / 2];
  } else if (subset.length === 2) {
    positions = [lineStart + lineLength / 3, lineStart + (2 * lineLength) / 3];
  } else {
    let spacing = lineLength / (visibleCount + 1);
    positions = [lineStart + spacing, lineStart + 2 * spacing, lineStart + 3 * spacing];
  }

  let dotSize = 16;

  for (let i = 0; i < subset.length; i++) {
    let x = positions[i];
    if (dist(mouseX, mouseY, x, y) < dotSize / 2) {
      let href = `detail.html?name=${encodeURIComponent(selectedName)}&year=${encodeURIComponent(subset[i].year)}&deaths=${encodeURIComponent(subset[i].deaths)}`;
      window.location.href = href;
      return;
    }
  }
}

// -- RESPONSIVITÀ -- //
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
