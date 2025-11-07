import fs from "fs";
import path from "path";
import { createCanvas, loadImage, registerFont } from "canvas";

const signs = [
  ["Aries", 0, 30],
  ["Taurus", 30, 60],
  ["Gemini", 60, 90],
  ["Cancer", 90, 120],
  ["Leo", 120, 150],
  ["Virgo", 150, 180],
  ["Libra", 180, 210],
  ["Scorpio", 210, 240],
  ["Sagittarius", 240, 270],
  ["Capricorn", 270, 300],
  ["Aquarius", 300, 330],
  ["Pisces", 330, 360],
];

const signDegree = {
  Aries: 30,
  Taurus: 60,
  Gemini: 90,
  Cancer: 120,
  Leo: 150,
  Virgo: 180,
  Libra: 210,
  Scorpio: 240,
  Sagittarius: 270,
  Capricorn: 300,
  Aquarius: 330,
  Pisces: 360,
};

const navamsaSign = {
  Aries: [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
  ],
  Taurus: [
    "Capricorn",
    "Aquarius",
    "Pisces",
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
  ],
  Gemini: [
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
    "Aries",
    "Taurus",
    "Gemini",
  ],
  Cancer: [
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ],
  Leo: [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
  ],
  Virgo: [
    "Capricorn",
    "Aquarius",
    "Pisces",
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
  ],
  Libra: [
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
    "Aries",
    "Taurus",
    "Gemini",
  ],
  Scorpio: [
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ],
  Sagittarius: [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
  ],
  Capricorn: [
    "Capricorn",
    "Aquarius",
    "Pisces",
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
  ],
  Aquarius: [
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
    "Aries",
    "Taurus",
    "Gemini",
  ],
  Pisces: [
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ],
};

function findPlanets(planets) {
  const navamsaPlanets = [];

  for (const planet of planets) {
    let found = false;
    for (const [label, start, stop] of signs) {
      if (start < planet.full_degree && planet.full_degree <= stop) {
        const norm = Math.abs(planet.full_degree - start);
        const second = norm * 60;
        let navamsa = Math.round(second / 200) - 1;
        if (navamsa < 0) navamsa = 0;
        const degree = signDegree[navamsaSign[label][navamsa]] - 5;
        navamsaPlanets.push({ Name: planet.Name, full_degree: degree });
        found = true;
        break;
      }
    }
    if (!found && planet.full_degree >= 330) {
      const norm = Math.abs(planet.full_degree - 330);
      const second = norm * 60;
      let navamsa = Math.round(second / 200) - 1;
      if (navamsa < 0) navamsa = 0;
      const degree = signDegree[navamsaSign["Pisces"][navamsa]] - 5;
      navamsaPlanets.push({ Name: planet.Name, full_degree: degree });
    }
  }

  return [planets, navamsaPlanets];
}

async function drawBirthChart(
  positions,
  filename,
  chartPath,
  name = "",
  dob = "",
  location = ""
) {
  let backgroundImage;
  let canvasSize = { width: 800, height: 800 };

  try {
    backgroundImage = await loadImage(
      path.join(chartPath, "static", "image.png")
    );
    canvasSize = {
      width: backgroundImage.width,
      height: backgroundImage.height,
    };
  } catch (err) {
    console.log("Background image not found, using white canvas");
  }

  const canvas = createCanvas(canvasSize.width, canvasSize.height);
  const ctx = canvas.getContext("2d");

  if (backgroundImage) {
    ctx.drawImage(backgroundImage, 0, 0);
  } else {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const blue = "#03045e";
  const black = "#000000";

  const largeSquareSize = canvasSize.width;
  const smallSquareSize = largeSquareSize / 4;
  const largeSquareOffset = 0;

  let font = "22px sans-serif";
  try {
    registerFont(path.join(chartPath, "static", "Linotte-SemiBold.otf"), {
      family: "Linotte",
    });
    font = "22px Linotte";
  } catch (err) {
    console.log("Font not found, using default");
  }

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  ctx.font = "25px Linotte";
  ctx.fillStyle = black;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, centerX, centerY - 40);

  ctx.font = "25px Linotte";
  ctx.fillText(dob, centerX, centerY);
  ctx.fillText(location, centerX, centerY + 40);

  const smallSquares = [
    { x: largeSquareOffset, y: largeSquareOffset },
    { x: largeSquareOffset + smallSquareSize, y: largeSquareOffset },
    { x: largeSquareOffset + 2 * smallSquareSize, y: largeSquareOffset },
    { x: largeSquareOffset + 3 * smallSquareSize, y: largeSquareOffset },
    {
      x: largeSquareOffset + 3 * smallSquareSize,
      y: largeSquareOffset + smallSquareSize,
    },
    {
      x: largeSquareOffset + 3 * smallSquareSize,
      y: largeSquareOffset + 2 * smallSquareSize,
    },
    {
      x: largeSquareOffset + 3 * smallSquareSize,
      y: largeSquareOffset + 3 * smallSquareSize,
    },
    {
      x: largeSquareOffset + 2 * smallSquareSize,
      y: largeSquareOffset + 3 * smallSquareSize,
    },
    {
      x: largeSquareOffset + smallSquareSize,
      y: largeSquareOffset + 3 * smallSquareSize,
    },
    { x: largeSquareOffset, y: largeSquareOffset + 3 * smallSquareSize },
    { x: largeSquareOffset, y: largeSquareOffset + 2 * smallSquareSize },
    { x: largeSquareOffset, y: largeSquareOffset + smallSquareSize },
  ];

  const rashiLabels = [
    "Pisces",
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
  ];

  const zodiacBoundaries = {
    Pisces: [330, 360],
    Aries: [0, 30],
    Taurus: [30, 60],
    Gemini: [60, 90],
    Cancer: [90, 120],
    Leo: [120, 150],
    Virgo: [150, 180],
    Libra: [180, 210],
    Scorpio: [210, 240],
    Sagittarius: [240, 270],
    Capricorn: [270, 300],
    Aquarius: [300, 330],
  };

  if (positions && positions.length > 0) {
    const planetsInCells = Array(12)
      .fill()
      .map(() => []);

    for (const planet of positions) {
      const planetName = planet.Name;
      const planetDegree = planet.full_degree;

      for (const [label, [start, end]] of Object.entries(zodiacBoundaries)) {
        if (start <= planetDegree && planetDegree < end) {
          const cellIndex = rashiLabels.indexOf(label);
          const shortName = planetName === "Ascendant" ? "Asc" : planetName;
          planetsInCells[cellIndex].push([shortName, planetDegree]);
          break;
        }
      }
    }

    ctx.font = font;
    ctx.fillStyle = blue;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let index = 0; index < planetsInCells.length; index++) {
      const planets = planetsInCells[index];
      if (planets.length === 0) continue;

      const cell = smallSquares[index];
      const cellCenterX = cell.x + smallSquareSize / 2;
      const cellCenterY = cell.y + smallSquareSize / 2;

      if (planets.length > 1) {
        const radius = smallSquareSize * 0.3;
        const angleStep = (2 * Math.PI) / planets.length;
        planets.forEach(([planetName], i) => {
          const angle = i * angleStep;
          const x = cellCenterX + radius * Math.cos(angle);
          const y = cellCenterY + radius * Math.sin(angle) + 20;
          ctx.fillText(planetName, x, y);
        });
      } else {
        const [planetName] = planets[0];
        ctx.fillText(planetName, cellCenterX, cellCenterY + 20);
      }
    }
  }

  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(filename, buffer);
  console.log(`Saved: ${filename}`);
}

function generateBirthNavamsaChart(
  planets,
  chartPath,
  dob,
  location,
  name = ""
) {
  return new Promise(async (resolve) => {
    const [positions, navamsa] = findPlanets(planets);
    const number = Math.floor(Math.random() * 100000000) + 1;
    const number2 = Math.floor(Math.random() * 10000000) + 1;

    const birthChartPath = path.join(chartPath, `${number2}.png`);
    const navamsaChartPath = path.join(chartPath, `${number}.png`);

    await drawBirthChart(
      positions,
      birthChartPath,
      chartPath,
      name,
      dob,
      location
    );
    await drawBirthChart(
      navamsa,
      navamsaChartPath,
      chartPath,
      name,
      dob,
      location
    );

    resolve({
      birth_chart: `${number2}.png`,
      navamsa_chart: `${number}.png`,
    });
  });
}

async function run() {
  const planets = [
    {
      Name: "Ascendant",
      full_degree: 201.83730433212315,
      norm_degree: 21.837304332123153,
      sign: "Libra",
      zodiac_lord: "Venus",
      isRetro: false,
      nakshatra: "Vishakha",
      nakshatra_lord: "Jupiter",
      pada: 1,
      pos_from_asc: 1,
      order: 5,
    },
    {
      Name: "Sun",
      full_degree: 246.91701421936102,
      norm_degree: 6.917014219361022,
      sign: "Sagittarius",
      zodiac_lord: "Jupiter",
      isRetro: false,
      nakshatra: "Mula",
      nakshatra_lord: "Ketu",
      pada: 3,
      pos_from_asc: 2,
      order: 9,
    },
    {
      Name: "Moon",
      full_degree: 16.76923578247829,
      norm_degree: 16.76923578247829,
      sign: "Aries",
      zodiac_lord: "Mars",
      isRetro: false,
      nakshatra: "Bharani",
      nakshatra_lord: "Venus",
      pada: 2,
      pos_from_asc: 6,
      order: 6,
    },
    {
      Name: "Mercury",
      full_degree: 246.64773731710864,
      norm_degree: 6.647737317108636,
      sign: "Sagittarius",
      zodiac_lord: "Jupiter",
      isRetro: true,
      nakshatra: "Mula",
      nakshatra_lord: "Ketu",
      pada: 2,
      pos_from_asc: 2,
      order: 10,
    },
    {
      Name: "Venus",
      full_degree: 207.739168781672,
      norm_degree: 27.739168781671992,
      sign: "Libra",
      zodiac_lord: "Venus",
      isRetro: false,
      nakshatra: "Vishakha",
      nakshatra_lord: "Jupiter",
      pada: 3,
      pos_from_asc: 1,
      order: 1,
    },
    {
      Name: "Mars",
      full_degree: 236.74060040949792,
      norm_degree: 26.740600409497915,
      sign: "Scorpio",
      zodiac_lord: "Mars",
      isRetro: false,
      nakshatra: "Jyeshtha",
      nakshatra_lord: "Mercury",
      pada: 4,
      pos_from_asc: 2,
      order: 4,
    },
    {
      Name: "Jupiter",
      full_degree: 11.844096074682056,
      norm_degree: 11.844096074682056,
      sign: "Aries",
      zodiac_lord: "Mars",
      isRetro: true,
      nakshatra: "Ashwini",
      nakshatra_lord: "Ketu",
      pada: 4,
      pos_from_asc: 6,
      order: 7,
    },
    {
      Name: "Saturn",
      full_degree: 308.63420309740104,
      norm_degree: 8.634203097401041,
      sign: "Aquarius",
      zodiac_lord: "Saturn",
      isRetro: false,
      nakshatra: "Shatabhisha",
      nakshatra_lord: "Rahu",
      pada: 1,
      pos_from_asc: 4,
      order: 8,
    },
    {
      Name: "Rahu",
      full_degree: 357.5083828767039,
      norm_degree: 27.508382876703877,
      sign: "Pisces",
      zodiac_lord: "Jupiter",
      isRetro: true,
      nakshatra: "Revati",
      nakshatra_lord: "Mercury",
      pada: 4,
      pos_from_asc: 6,
      order: 2,
    },
    {
      Name: "Ketu",
      full_degree: 177.50838287670388,
      norm_degree: 27.508382876703877,
      sign: "Virgo",
      zodiac_lord: "Mercury",
      isRetro: true,
      nakshatra: "Chitra",
      nakshatra_lord: "Mars",
      pada: 2,
      pos_from_asc: 12,
      order: 3,
    },
  ];

  const result = await generateBirthNavamsaChart(
    planets,
    "D:/report-js/chart",
    "05 Nov 1990, 10:30 AM",
    "Delhi, India",
    "John Doe"
  );

  console.log("Generated:", result);
}

run();
