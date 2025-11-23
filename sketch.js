let data;
let allYears = []; // anni interi
let allCountries = []; // paesi corrispondendi
let allNames = []; // nomi corrispondenti

let baseRadius = 80; // raggio interno minimo
let maxRadius = 850; // raggio esterno massimo
let centerY; // centro dell'arco

let minYear = -4400; // anno minimo

let continents = ["Europe", "Asia", "Africa", "Americas", "Oceania"]; // lista continenti
let continentAngles = {}; // intervallo angolare per ogni continente
let circles = []; // limiti temporali 
let eruptionPositions = []; // posizioni dei pallini eruzioni

let continentSelector; // selezione continenti
let activeContinent = "Europe";

let timeSelector; // selezione fasce temporali
let activeRange = null; // indice della fascia selezionata (null=tutte)

// variabili colori
let colBackground;
let colBaseLine;
let colCircleLines;
let colCircleText;
let colDots;
let colDotHover;
let colTooltipBg;
let colTooltipText;
let colTitle;


// --- CONTINENTI ---
function getContinent(country) {
  country = country ? country.toLowerCase() : "";

  if (["italy","greece","iceland","france","spain","germany","united kingdom","portugal",
       "norway","sweden","switzerland","austria","russia","turkey"]
      .some(c => country.includes(c))) return "Europe";

  if (["japan","china","indonesia","philippines","india","iran","saudi arabia","south korea",
       "north korea","thailand","taiwan","mongolia"]
      .some(c => country.includes(c))) return "Asia";

  if (["egypt","ethiopia","tanzania","kenya","uganda","south africa","congo","algeria","morocco"]
      .some(c => country.includes(c))) return "Africa";

  if (["chile","mexico","ecuador","peru","canada","usa","guatemala","colombia",
       "nicaragua","costa rica"]
      .some(c => country.includes(c))) return "Americas";

  if (["australia","new zealand","papua new guinea","fiji","tonga","samoa","vanuatu"]
      .some(c => country.includes(c))) return "Oceania";

  return "Other";
}

function preload() {
  data = loadTable("data_impatto.csv", "csv", "header");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(RADIANS);
  textFont("Helvetica");

  // posizione semicirconferenza (centro dell'arco in basso)
  centerY = height * 0.90;

  // --- COLORI ---
  colBackground       = color(10);            
  colBaseLine         = color(80);       
  colCircleLines      = color(80);      
  colCircleText       = color(255, 43, 0);           
  colDots             = color(80);           
  colDotHover         = color(255, 43, 0);  
  colTooltipBg        = color(210, 50);       
  colTooltipText      = color(255, 43, 0);           
  colTitle            = color(255, 43, 0);           

  // --- SEMICIRCONFERENZA ---
  for (let c of continents) continentAngles[c] = { start: PI, end: TWO_PI };

  // carica dati
  for (let i = 0; i < data.getRowCount(); i++) {
    allYears.push(Number(data.getString(i, "Year")));
    allCountries.push(data.getString(i, "Country"));
    allNames.push(data.getString(i, "Name"));
  }

  let maxYear = max(allYears); // anno più recente

  // costruisco fasce temporali
  for (let y = minYear; y <= 1800; y += 1000) circles.push(y); // fino al 1800 ogni 1000 anni
  for (let y = 1800; y <= maxYear; y += 50) circles.push(y); // dal 1800 ogni 50 anni
  circles.push(maxYear + 1); // include l'ultimo anno

  // --- MENU CONTINENTI ---
  continentSelector = createSelect();
  continentSelector.position(30, 70);
  continentSelector.style("font-size", "16px");
  for (let c of continents) continentSelector.option(c);
  continentSelector.changed(() => {
    activeContinent = continentSelector.value();
    computeEruptions();
  });

  // --- MENU FASCE TEMPORALI ---
  timeSelector = createSelect();
  timeSelector.position(30, 110);
  timeSelector.style("font-size", "16px");

  timeSelector.option("All years", "all");
  for (let i = 0; i < circles.length - 1; i++) {
    let a = circles[i];
    let b = circles[i + 1];
    let label = (a < 0 ? `${-a} BC` : `${a} AD`) + " → " + (b < 0 ? `${-b} BC` : `${b} AD`);
    timeSelector.option(label, i);
  }

  timeSelector.changed(() => {
    let v = timeSelector.value();
    if (v === "all") activeRange = null;
    else activeRange = int(v);
    computeEruptions();
  });

  computeEruptions(); // per calcolare le posizioni iniziali
}

function computeEruptions() {
  // resetta l'array eruptionPositions ogni volta che si cambia continente o fascia temporale
  eruptionPositions = []; // reset

  // se c'è una fascia selezionata, memorizza i suoi limiti
  let selectedLower = null;
  let selectedUpper = null;
  if (activeRange !== null) {
    selectedLower = circles[activeRange];
    selectedUpper = circles[activeRange + 1];
  }

  let filtered = []; // variabile per continente filtrato

  // trova la fascia di appartenenza
  for (let i = 0; i < allYears.length; i++) {
    let year = allYears[i];
    let country = allCountries[i];
    let continent = getContinent(country);
    if (continent !== activeContinent) continue;

    // cerca tra i due cerchi e imposta lower e upper
    let lower = circles[0];
    let upper = circles[circles.length - 1];
    for (let c = 0; c < circles.length - 1; c++) {
      if (year >= circles[c] && year < circles[c + 1]) {
        lower = circles[c];
        upper = circles[c + 1];
        break;
      }
    }

    // se c'è una fascia attiva: filtra e prende solo i punti che stanno dentro
    if (activeRange !== null) {
      if (year < selectedLower || year >= selectedUpper) continue;
      filtered.push({ i, year, country });
    } else { // nessuna fascia attiva: salva il punto con metadati per la mappatura originale
      filtered.push({ i, year, country, lower, upper });
    }
  }

  // --- MODALITÀ SENZA ZOOM SU UNA FASCIA ---
  if (activeRange === null) {
    for (let f of filtered) {
      let r1 = map(circles.indexOf(f.lower), 0, circles.length - 1, baseRadius, maxRadius); // raggi mappati corrispondenti al limite della fascia
      let r2 = map(circles.indexOf(f.upper), 0, circles.length - 1, baseRadius, maxRadius);
      let radius = map(f.year, f.lower, f.upper, r1, r2); // interpolato linearmente tra r1 e r2 in base all'anno dentro la fscia (anno + vicino all'upper = raggio + grande)
      let angle = random(PI, TWO_PI); // angolo casuale per spargere i punti
      eruptionPositions.push({ // oggetto contenente i metadati
        i: f.i,
        x: width / 2 + cos(angle) * radius,
        y: centerY + sin(angle) * radius,
        year: f.year,
        country: f.country,
        continent: activeContinent
      });
    }
    return;
  }

  // --- MODALITÀ ZOOM SU UNA FASCIA ---
  filtered.sort((a, b) => a.year - b.year); // ordina gli anni
  let count = filtered.length; // calcola la lunghezza
  let angleStep = (TWO_PI - PI) / count; // intervallo angolare tra i punti lungo la cironferenza

  // mappa tutto il range della fascia su baseRadius e maxRadius
  // limite inferiore diventa raggio interno
  // limite superiore diventa il raggio esterno
  // (effetto zoom)
  // angoli uniformi --> punti non si sovrappongono (equispaziati lungo l'arco)
  for (let idx = 0; idx < count; idx++) {
    let f = filtered[idx];
    let radius = map(f.year, selectedLower, selectedUpper, baseRadius, maxRadius);
    let angle = PI + idx * angleStep;
    eruptionPositions.push({
      i: f.i,
      x: width / 2 + cos(angle) * radius,
      y: centerY + sin(angle) * radius,
      year: f.year,
      country: f.country,
      continent: activeContinent
    });
  }
}

function draw() {
  background(colBackground);

  // linea di base
  stroke(colBaseLine);
  strokeWeight(2);
  line(width/2 - maxRadius, centerY, width/2 + maxRadius, centerY);

  // disegna cerchi e etichette temporali
  drawTimeCircles();

  // disegna punti eruzioni + hover distanza dal mouse
  let closest = null;
  let closestDist = Infinity;

  fill(colDots);
  noStroke();
  // calcola la distanza
  for (let e of eruptionPositions) {
    ellipse(e.x, e.y, 12);
    let d = dist(mouseX, mouseY, e.x, e.y);
    if (d < closestDist && d < 12) {
      closestDist = d;
      closest = e;
    }
  }

  // hover informazioni eruzione
  if (closest) {
    fill(colDotHover);
    ellipse(closest.x, closest.y, 18);
    noFill();
    push();
    stroke(255, 43, 0);
    rect(width - 350, 80, 250, 120, 10);
    pop();
    fill(colTooltipText);
    textSize(15);
    textAlign(LEFT, TOP);
    text(
      allNames[closest.i] + "\n" +
      "Country: " + closest.country + "\n" +
      "Continent: " + closest.continent + "\n" +
      "Year: " + closest.year,
      width - 330,
      100
    );
  }

  // titolo
  fill(colTitle);
  textSize(26);
  textAlign(LEFT, TOP);
  text("Volcanic Eruptions – " + activeContinent, 30, 30);
}

// disegna tutti i cerchi e mappa i pallini
function drawTimeCircles() {
  if (activeRange === null) {
    for (let i = 0; i < circles.length; i++) {
      let r = map(i, 0, circles.length - 1, baseRadius, maxRadius);
      drawCircle(r, circles[i]);
    }
  } else { // se c'è una fascia attiva disegna solo due cerchi con limite antico e limite recente
    let lower = circles[activeRange];
    let upper = circles[activeRange + 1];
    drawCircle(baseRadius, lower);
    drawCircle(maxRadius, upper);
  }
}

// disegna l'arco e l'etichetta della fascia
function drawCircle(radius, yearLabel) {
  noFill();
  stroke(colCircleLines);
  strokeWeight(3);
  arc(width / 2, centerY, radius * 2, radius * 2, PI, TWO_PI);

  noStroke();
  fill(colCircleText);
  textSize(15);
  textAlign(CENTER, BOTTOM);
  let txt = (yearLabel < 0 ? `${-yearLabel} BC` : `${yearLabel} AD`);
  text(txt, width / 2, centerY - radius - 10);
}

function mousePressed() {
  for (let e of eruptionPositions) {
    if (dist(mouseX, mouseY, e.x, e.y) < 10) {
      let name = encodeURIComponent(allNames[e.i]);
      let year = encodeURIComponent(e.year);
      let deaths = encodeURIComponent(e.deaths)
      let href = `detail.html?name=${name}&deaths=${deaths}`;
      window.location.href = href;
    }
  }
}
