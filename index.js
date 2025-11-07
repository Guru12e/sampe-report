import {
  Body,
  Ecliptic,
  GeoVector,
  AstroTime,
  SiderealTime,
  Observer,
  SearchRiseSet,
} from "astronomy-engine";

const LAHIRI_AYANAMSHA = 23.852;

const SIGNS = [
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

const SIGN_LORDS = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Mars",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Saturn",
  Pisces: "Jupiter",
};

const NAKSHATRAS = [
  ["Ashwini", 0, 13.333333, "Ketu"],
  ["Bharani", 13.333333, 26.666667, "Venus"],
  ["Krittika", 26.666667, 40, "Sun"],
  ["Rohini", 40, 53.333333, "Moon"],
  ["Mrigashira", 53.333333, 66.666667, "Mars"],
  ["Ardra", 66.666667, 80, "Rahu"],
  ["Punarvasu", 80, 93.333333, "Jupiter"],
  ["Pushya", 93.333333, 106.666667, "Saturn"],
  ["Ashlesha", 106.666667, 120, "Mercury"],
  ["Magha", 120, 133.333333, "Ketu"],
  ["Purva Phalguni", 133.333333, 146.666667, "Venus"],
  ["Uttara Phalguni", 146.666667, 160, "Sun"],
  ["Hasta", 160, 173.333333, "Moon"],
  ["Chitra", 173.333333, 186.666667, "Mars"],
  ["Swati", 186.666667, 200, "Rahu"],
  ["Vishakha", 200, 213.333333, "Jupiter"],
  ["Anuradha", 213.333333, 226.666667, "Saturn"],
  ["Jyeshtha", 226.666667, 240, "Mercury"],
  ["Mula", 240, 253.333333, "Ketu"],
  ["Purva Ashadha", 253.333333, 266.666667, "Venus"],
  ["Uttara Ashadha", 266.666667, 280, "Sun"],
  ["Shravana", 280, 293.333333, "Moon"],
  ["Dhanishta", 293.333333, 306.666667, "Mars"],
  ["Shatabhisha", 306.666667, 320, "Rahu"],
  ["Purva Bhadrapada", 320, 333.333333, "Jupiter"],
  ["Uttara Bhadrapada", 333.333333, 346.666667, "Saturn"],
  ["Revati", 346.666667, 360, "Mercury"],
];

const BODY_NAMES = {
  [Body.Sun]: "Sun",
  [Body.Moon]: "Moon",
  [Body.Mercury]: "Mercury",
  [Body.Venus]: "Venus",
  [Body.Mars]: "Mars",
  [Body.Jupiter]: "Jupiter",
  [Body.Saturn]: "Saturn",
};

function tropicalToSidereal(deg) {
  return (deg - LAHIRI_AYANAMSHA + 720) % 360;
}

function degreeToSign(tropicalDeg) {
  const deg = tropicalToSidereal(tropicalDeg);
  for (const [sign, start, end] of SIGNS) {
    if (deg >= start && deg < end) {
      return {
        sign,
        norm_degree: deg - start,
        zodiac_lord: SIGN_LORDS[sign],
      };
    }
  }
  return { sign: "Unknown", norm_degree: deg, zodiac_lord: "Unknown" };
}

function getNakshatra(tropicalDeg) {
  const deg = tropicalToSidereal(tropicalDeg);
  for (const [name, start, end, lord] of NAKSHATRAS) {
    if (deg >= start && deg < end) {
      const pada = Math.floor(((deg - start) / (end - start)) * 4) + 1;
      return { nakshatra: name, nakshatra_lord: lord, pada };
    }
  }
  return { nakshatra: "Unknown", nakshatra_lord: "Unknown", pada: 0 };
}

function getHousePosition(planetSiderealDeg, ascSiderealDeg) {
  const diff = (planetSiderealDeg - ascSiderealDeg + 360) % 360;
  return Math.floor(diff / 30) + 1;
}

function isRetrograde(planet, time) {
  if (planet === Body.Sun || planet === Body.Moon) return false;
  const dt = 0.1;
  const lon1 = Ecliptic(GeoVector(planet, time, true)).elon;
  const t2 = new AstroTime(time.tt + dt);
  const lon2 = Ecliptic(GeoVector(planet, t2, true)).elon;
  const dLon = ((lon2 - lon1 + 540) % 360) - 180;
  return dLon < 0;
}

function calculateAscendantTropical(dateStr, lat, lon) {
  const time = new AstroTime(parseDateToIST(dateStr));

  let gmst = SiderealTime(time);
  let lmst = gmst + lon / 15;
  lmst = (lmst + 24) % 24;
  const ramc = lmst * 15;

  const obl = 23.4393 - 0.0000004 * ((time.tt - 2451545.0) / 36525.0);

  const latRad = (lat * Math.PI) / 180;
  const ramcRad = (ramc * Math.PI) / 180;
  const oblRad = (obl * Math.PI) / 180;

  const tanAsc =
    -Math.cos(ramcRad) /
    (Math.sin(ramcRad) * Math.cos(oblRad) +
      Math.tan(latRad) * Math.sin(oblRad));
  let asc = Math.atan(tanAsc) * (180 / Math.PI);

  if (Math.sin(ramcRad) > 0) asc += 180;
  asc = (asc + 360) % 360;

  return asc + 3;
}

function calculateAscendant(dateStr, lat, lon) {
  const tropicalAsc = calculateAscendantTropical(dateStr, lat, lon);
  return tropicalToSidereal(tropicalAsc);
}

function getPlanetaryPositions(dateStr) {
  const date = new Date(dateStr);
  const time = new AstroTime(date);

  const planetList = [
    Body.Sun,
    Body.Moon,
    Body.Mercury,
    Body.Venus,
    Body.Mars,
    Body.Jupiter,
    Body.Saturn,
  ];

  const positions = [];

  for (const planet of planetList) {
    const vec = GeoVector(planet, time, true);
    const ecl = Ecliptic(vec);
    const tropicalLon = (ecl.elon + 360) % 360;
    const siderealLon = tropicalToSidereal(tropicalLon);

    const signInfo = degreeToSign(tropicalLon);
    const nakInfo = getNakshatra(tropicalLon);

    positions.push({
      Name: BODY_NAMES[planet],
      full_degree: siderealLon,
      norm_degree: signInfo.norm_degree,
      sign: signInfo.sign,
      zodiac_lord: signInfo.zodiac_lord,
      isRetro: isRetrograde(planet, time),
      nakshatra: nakInfo.nakshatra,
      nakshatra_lord: nakInfo.nakshatra_lord,
      pada: nakInfo.pada,
    });
  }

  return positions;
}

function findPlanets(dateStr, lat, lon) {
  const ascSid = calculateAscendant(dateStr, lat, lon);
  const ascTrop = calculateAscendantTropical(dateStr, lat, lon);

  const ascSign = degreeToSign(ascTrop);
  const ascNak = getNakshatra(ascTrop);

  const ascendantObj = {
    Name: "Ascendant",
    full_degree: ascSid,
    norm_degree: ascSign.norm_degree,
    sign: ascSign.sign,
    zodiac_lord: ascSign.zodiac_lord,
    isRetro: false,
    nakshatra: ascNak.nakshatra,
    nakshatra_lord: ascNak.nakshatra_lord,
    pada: ascNak.pada,
  };

  const planets = getPlanetaryPositions(dateStr);

  const all = [ascendantObj, ...planets];

  all.forEach((obj) => {
    obj.pos_from_asc = getHousePosition(obj.full_degree, ascSid);
  });

  return all;
}

function toISTString(date) {
  return date.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getSunriseSunset(lat, lon, dateStr = null) {
  const date = dateStr ? new Date(dateStr) : new Date();

  const observer = new Observer(lat, lon, 0);
  const rise = SearchRiseSet(Body.Sun, observer, +1, date, 300);
  const set = SearchRiseSet(Body.Sun, observer, -1, date, 300);

  const sunrise = rise ? toISTString(rise.date) : null;
  const sunset = set ? toISTString(set.date) : null;

  return { sunrise, sunset };
}

const TITHIS = [
  "Pratipada",
  "Ditiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
  "Purnima",
];

const YOGAS = [
  "Vishkambha",
  "Priti",
  "Ayushman",
  "Saubhagya",
  "Shobhana",
  "Atiganda",
  "Sukarman",
  "Dhriti",
  "Shoola",
  "Ganda",
  "Vriddhi",
  "Dhruva",
  "Vyaghata",
  "Harsana",
  "Vajra",
  "Siddhi",
  "Vyatipata",
  "Variyana",
  "Parigha",
  "Shiva",
  "Siddha",
  "Sadhya",
  "Shubha",
  "Shukla",
  "Brahma",
  "Indra",
  "Vaidhriti",
];

const KARANAS = [
  ["Kinstughna", "Bava"],
  ["Balava", "Kaulava"],
  ["Taitila", "Garaja"],
  ["Vanija", "Vishti"],
  ["Bava", "Balava"],
  ["Kaulava", "Taitila"],
  ["Garaja", "Vanija"],
  ["Vishti", "Bava"],
  ["Balava", "Kaulava"],
  ["Taitila", "Garaja"],
  ["Vanija", "Vishti"],
  ["Bava", "Balava"],
  ["Kaulava", "Taitila"],
  ["Garaja", "Vanija"],
  ["Vishti", "Shakuni"],
  ["Balava", "Kaulava"],
  ["Taitila", "Garaja"],
  ["Vanija", "Vishti"],
  ["Bava", "Balava"],
  ["Kaulava", "Taitila"],
  ["Garaja", "Vanija"],
  ["Vishti", "Bava"],
  ["Balava", "Kaulava"],
  ["Taitila", "Garaja"],
  ["Vanija", "Vishti"],
  ["Bava", "Balava"],
  ["Kaulava", "Taitila"],
  ["Garaja", "Vanija"],
  ["Vishti", "Shakuni"],
  ["Chatushpada", "Nagava"],
];

const ganam_nakshatras = {
  Deva_Ganam: [
    "Ashwini",
    "Mrigashira",
    "Punarvasu",
    "Pushya",
    "Hasta",
    "Swati",
    "Anuradha",
    "Shravana",
    "Revati",
  ],
  Manushya_Ganam: [
    "Bharani",
    "Rohini",
    "Ardra",
    "Purva Phalguni",
    "Uttara Phalguni",
    "Purva Ashadha",
    "Uttara Ashadha",
    "Purva Bhadrapada",
    "Uttara Bhadrapada",
  ],
  Rakshasa_Ganam: [
    "Krittika",
    "Ashlesha",
    "Magha",
    "Chitra",
    "Vishakha",
    "Jyeshtha",
    "Mula",
    "Dhanishta",
    "Shatabhisha",
  ],
};

const nakshatra_yoni = {
  Ashwini: "Horse",
  Bharani: "Elephant",
  Krittika: "Sheep",
  Rohini: "Snake",
  Mrigashira: "Snake",
  Ardra: "Dog",
  Punarvasu: "Cat",
  Pushya: "Sheep",
  Ashlesha: "Cat",
  Magha: "Rat",
  "Purva Phalguni": "Rat",
  "Uttara Phalguni": "Cow",
  Hasta: "Buffalo",
  Chitra: "Tiger",
  Swati: "Buffalo",
  Vishakha: "Tiger",
  Anuradha: "Deer",
  Jyeshtha: "Deer",
  Mula: "Dog",
  "Purva Ashadha": "Monkey",
  "Uttara Ashadha": "Mongoose",
  Shravana: "Monkey",
  Dhanishta: "Lion",
  Shatabhisha: "Horse",
  "Purva Bhadrapada": "Lion",
  "Uttara Bhadrapada": "Cow",
  Revati: "Elephant",
};

function normalize(deg) {
  return ((deg % 360) + 360) % 360;
}

function calculateTithi(sunLon, moonLon) {
  let diff = normalize(moonLon - sunLon);
  let tithiNum = Math.ceil(diff / 12);
  if (tithiNum === 30) return ["Amavasya", 30, "Krishna Paksha"];
  const name = TITHIS[(tithiNum % 15) - 1];
  const paksha = tithiNum <= 15 ? "Shukla Paksha" : "Krishna Paksha";
  return [name, tithiNum, paksha];
}

function calculateNakshatra(moonLon) {
  const deg = normalize(moonLon);
  const index = Math.floor(deg / 13.333333333333334) % 27;
  return [NAKSHATRAS[index][0], index];
}

function calculateYoga(sunLon, moonLon) {
  const sum = normalize(sunLon + moonLon);
  const index = Math.floor(sum / 13.333333333333334) % 27;
  return [YOGAS[index], index + 1];
}

function calculateKarana(tithiNumber, sunLon, moonLon) {
  let diff = normalize(moonLon - sunLon);
  const value = diff / 12.0;
  const roundedValue = Math.round(value * 100) / 100;
  const decimalPart = Math.round((roundedValue * 100) % 100);
  const pair = KARANAS[tithiNumber - 1] || KARANAS[0];
  if (decimalPart > 50) {
    return [pair[1], tithiNumber * 2];
  } else {
    return [pair[0], tithiNumber * 2 - 1];
  }
}

function calculateGanam(nakshatraName) {
  if (ganam_nakshatras.Deva_Ganam.includes(nakshatraName)) return "Deva";
  if (ganam_nakshatras.Manushya_Ganam.includes(nakshatraName))
    return "Manushya";
  return "Rakshasa";
}

function calculatePanchangJS(sun_pos, moon_pos, sunrise, sunset, weekday) {
  const sunLon = normalize(Number(sun_pos));
  const moonLon = normalize(Number(moon_pos));

  const [tithi, tithiNumber, paksha] = calculateTithi(sunLon, moonLon);
  const [nakshatra, nakIndex] = calculateNakshatra(moonLon);
  const [yoga, yogaIndex] = calculateYoga(sunLon, moonLon);
  const [karana, karanaIndex] = calculateKarana(tithiNumber, sunLon, moonLon);
  const panchang = {
    tithi,
    tithi_number: tithiNumber,
    paksha,
    nakshatra,
    nakshatra_number: nakIndex + 1,
    yoga,
    yoga_index: yogaIndex,
    karana,
    karana_number: karanaIndex,
    sunrise: sunrise,
    sunset: sunset,
    ganam: calculateGanam(nakshatra),
    yoni: nakshatra_yoni[nakshatra] || null,
    week_day: weekday,
  };

  return panchang;
}

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function parseDateToIST(dateStr) {
  const date = new Date(dateStr);
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const istTime = new Date(utc + 5.5 * 3600000);
  return istTime;
}

const freeReport = (date, lat, lon) => {
  const planets = findPlanets(date, lat, lon);
  const { sunrise, sunset } = getSunriseSunset(lat, lon, date);
  const dateObj = new Date(date);

  const panchang = calculatePanchangJS(
    planets[1].full_degree,
    planets[2].full_degree,
    sunrise,
    sunset,
    days[dateObj.getDay()]
  );
  console.log(planets, panchang);

  return {
    planets: planets,
    panchang: panchang,
  };
};

freeReport("2023-12-23T03:00:00", 9.9252, 78.1198);
