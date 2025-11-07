import {
  atma_names,
  ista_devatas,
  nakshatraNumber,
  nakshatras,
  zodiac,
  zodiac_lord,
} from "./constant/constant.js";
import {
  context,
  dasa_status_table,
  elements_content,
  elements_data,
  exaltation,
  karagan,
  Planet_Gemstone_Desc,
  planetTable,
} from "./constant/report.js";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const DesignColors = [
  "#BDE0FE",
  "#FEFAE0",
  "#FFC8DD",
  "#CAF0F8",
  "#FBE0CE",
  "#C2BCFF",
  "#9DE3DB",
  "#EDBBA3",
  "#EDF2F4",
  "#FFD6A5",
  "#CBF3DB",
  "#94D8FD",
  "#DEE2FF",
  "#FEEAFA",
  "#D7AEFF",
  "#EEE4E1",
];

const hexToRgb = (hex) => {
  const m = hex.replace("#", "").match(/.{2}/g);
  return m ? m.map((x) => parseInt(x, 16)) : [0, 0, 0];
};

function findStatus(planet, lord, sign) {
  if (sign in exaltation[planet]) {
    return exaltation[planet].index(sign) == 0 ? "Exalted" : "Debilitated";
  }

  return lord in planetTable[planet][0]
    ? "Friend"
    : lord in planetTable[planet][1]
    ? "Enemy"
    : "Neutral";
}

const monthsDict = {
  1: "Jan",
  2: "Feb",
  3: "Mar",
  4: "Apr",
  5: "May",
  6: "Jun",
  7: "Jul",
  8: "Aug",
  9: "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dec",
};

let favourableDasa = "";

function no_of_lines(doc, text, cell_width) {
  const words = text.split(" ");
  let current_line = "";
  let lines = 0;

  words.forEach((word) => {
    const test_line = current_line + word + " ";
    const test_line_width = doc.widthOfString(test_line);

    if (test_line_width <= cell_width) {
      current_line = test_line;
    } else {
      lines += 1;
      current_line = word + " ";
    }
  });

  if (current_line) {
    lines += 1;
  }

  return lines;
}

function draw_bar(doc, x, y, width, height, color) {
  doc
    .save()
    .fillColor(color)
    .rect(x, y - height, width, height)
    .fill()
    .restore();
}

function draw_bar_chart(
  doc,
  x_start,
  y_base,
  bar_width,
  bar_spacing,
  data,
  colors,
  max_height,
  path
) {
  const values = Object.values(data);
  const max_value = Math.max(...values);

  let x = x_start;

  for (const [i, label] of Object.keys(data).entries()) {
    const value = data[label];
    const bar_height = (value / max_value) * max_height;
    const color = colors[i % colors.length];
    doc.font("Linotte-SemiBold").fontSize(12).fillColor("#000");
    doc.text(label, x, y_base + 10, { width: bar_width, align: "center" });
    draw_bar(doc, x, y_base, bar_width, bar_height, color);
    draw_labels(doc, x, y_base - bar_height - 15, label, path);
    x += bar_width + bar_spacing;
  }
}

function draw_labels(doc, x, y, label, imagePath) {
  if (label == "Vadha" || label == "Kapha" || label == "Pitta") {
    doc.image(path.join(imagePath, `${label}.png`), x - 10 / 2, y, {
      width: 10,
      height: 10,
    });
  } else {
    doc.fillColor("#FFE6CC");
    doc.circle(x + 25, y - 15, 22.5).fill();
    doc.image(path.join(imagePath, `${label}.png`), x + 12.5, y - 27.5, {
      width: 25,
      height: 25,
    });
  }
}

const drawDasa = (doc, dasa, bhukthi, x, y, start, end, imagePath) => {
  const lineColor = "#BF4229";
  const boxWidth = 160;
  const boxHeight = 330;

  doc
    .save()
    .strokeColor(lineColor)
    .roundedRect(x - 2.5, y + 10, boxWidth, boxHeight, 5)
    .stroke()
    .restore();

  const dasaImg = path.join(imagePath, `${dasa}.png`);
  if (fs.existsSync(dasaImg)) {
    doc.image(dasaImg, x + 20, y + 15, { width: 40, height: 40 });
  }

  doc
    .font("Linotte-Heavy")
    .fontSize(16)
    .fillColor("#000")
    .text(`${dasa}`, x + 25, y + 17.5, { width: boxWidth, align: "center" });

  doc
    .font("Linotte-Regular")
    .fontSize(12)
    .text(`(${start}-${end})Age`, x + 25, doc.y, {
      width: boxWidth,
      align: "center",
    });

  doc
    .save()
    .strokeColor(lineColor)
    .moveTo(x + 30, doc.y + 27.5)
    .lineTo(x + boxWidth - 30, doc.y + 27.5)
    .stroke()
    .restore();

  doc
    .font("Linotte-SemiBold")
    .fontSize(14)
    .text(
      `${monthsDict[bhukthi[0].start_month + 1]} ${bhukthi[0].start_year}`,
      x,
      doc.y + 32.5,
      { width: boxWidth, align: "center" }
    );
  doc.text(
    `${monthsDict[bhukthi[bhukthi.length - 1].end_month + 1]} ${
      bhukthi[bhukthi.length - 1].end_year
    }`,
    x,
    doc.y + 5,
    { width: boxWidth, align: "center" }
  );

  doc
    .save()
    .strokeColor(lineColor)
    .moveTo(x + 30, doc.y + 2.5)
    .lineTo(x + boxWidth - 30, doc.y + 2.5)
    .stroke()
    .restore();

  let currentY = doc.y + 14.5;
  const time = new Date().getFullYear();
  const subBoxHeight = 22.5;
  bhukthi.forEach((b, index) => {
    let fillColor;
    if (dasa_status_table[dasa]?.[0]?.includes(b.bhukti)) {
      fillColor = "#DAFFDC";
      if (favourableDasa === "" && b.start_year > time) {
        favourableDasa = `${b.start_year} to ${b.end_year}`;
      }
    } else if (dasa_status_table[dasa]?.[1]?.includes(b.bhukti)) {
      fillColor = "#FFDADA";
    } else {
      fillColor = "#DAE7FF";
    }

    doc
      .save()
      .fillColor(fillColor)
      .roundedRect(
        x - 2,
        currentY,
        boxWidth - 1,
        subBoxHeight,
        index === bhukthi.length - 1 ? 3 : 0
      )
      .fill()
      .restore();

    doc
      .font("Linotte-Regular")
      .fontSize(12)
      .fillColor("#000")
      .text(`${b.bhukti}`, x + 4, currentY + 5, {
        width: 60,
        align: "left",
        height: subBoxHeight,
      })
      .text(
        `upto ${monthsDict[b.end_month + 1]} ${b.end_year}`,
        doc.x + 55,
        currentY + 5,
        {
          width: boxWidth - 65,
          align: "right",
          height: subBoxHeight,
        }
      );

    currentY += subBoxHeight;
  });
};

const drawPlanetTable = (doc, planet, x, y, color, imagePath) => {
  const boxWidth = 185;
  const boxHeight = 185;

  doc
    .save()
    .fillColor(color)
    .roundedRect(x - 5, y - 5, boxWidth, boxHeight, 5)
    .fill()
    .restore();

  const imgPath =
    planet.Name !== "Ascendant"
      ? path.join(imagePath, `${planet.Name}.png`)
      : path.join(imagePath, `${planet.sign}.png`);

  if (fs.existsSync(imgPath)) {
    doc.image(imgPath, x - 20, y - 32.5, { width: 55, height: 55 });
  }

  doc.text(
    planet.Name === "Ascendant"
      ? `${planet.Name} (Lagna)`
      : `Planet: ${planet.Name}`,
    x,
    y,
    {
      width: boxWidth,
      align: "center",
    }
  );
  doc.text(`Full Degree: ${planet.full_degree.toFixed(5)}`, x, doc.y + 9, {
    width: boxWidth,
    align: "center",
  });
  doc.text(`Sign: ${planet.sign}`, x, doc.y + 9, {
    width: boxWidth,
    align: "center",
  });
  doc.text(`Sign Lord: ${planet.zodiac_lord}`, x, doc.y + 9, {
    width: boxWidth,
    align: "center",
  });
  doc.text(`Retrograde: ${planet.isRetro}`, x, doc.y + 9, {
    width: boxWidth,
    align: "center",
  });
  doc.text(`Nakshatra: ${planet.nakshatra}`, x, doc.y + 9, {
    width: boxWidth,
    align: "center",
  });
  doc.text(`Karagan: ${karagan[planet.Name]}`, x, doc.y + 9, {
    width: boxWidth,
    align: "center",
  });

  const status =
    planet.Name === "Ascendant"
      ? "Ubayam"
      : findStatus(planet.Name, planet.zodiac_lord, planet.sign);
  doc.text(`Status: ${status}`, x, doc.y + 9, {
    width: boxWidth,
    align: "center",
  });
};

const gradientRect = (doc, x, y, w, h, c1, c2, steps = 80) => {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  for (let i = 0; i < steps; i++) {
    const r = Math.round(r1 + ((r2 - r1) * i) / steps);
    const g = Math.round(g1 + ((g2 - g1) * i) / steps);
    const b = Math.round(b1 + ((b2 - b1) * i) / steps);
    doc
      .fillColor(`rgb(${r},${g},${b})`)
      .rect(x, y + i * (h / steps), w, h / steps)
      .fill();
  }
};

const textBlock = (
  doc,
  text,
  {
    x,
    y,
    w,
    align = "left",
    fontSize = 14,
    font = "Linotte-Regular",
    color = "#000",
    lineGap = 2,
  }
) => {
  doc.font(font).fontSize(fontSize).fillColor(color);
  doc.text(text, x, y, { width: w, align, lineGap });
};

const newPage = (doc, IMAGES, title = null) => {
  doc.addPage();
  doc.image(path.join(IMAGES, "border.png"), 0, 0, {
    width: doc.page.width,
    height: doc.page.height,
  });
  if (title) {
    doc.font("Linotte-Heavy").fontSize(26).fillColor("#966A2F");
    doc.text(title, 0, 25, { align: "center", width: doc.page.width });
  }
};

function ProReport(
  reportPath,
  planets,
  panchang,
  dasa,
  charts,
  formatted_date,
  formatted_time,
  location,
  year,
  month,
  name,
  gender,
  outputDir
) {
  const IMAGES = path.join(reportPath, "report", "images");
  const FONTS = path.join(reportPath, "report", "fonts");
  const ICONS = path.join(reportPath, "report", "icons");

  const font = {
    regular: path.join(FONTS, "Linotte-Regular.otf"),
    semi: path.join(FONTS, "Linotte-SemiBold.otf"),
    heavy: path.join(FONTS, "Linotte-Heavy.ttf"),
  };

  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    font: path.join(FONTS, "Linotte-Regular.otf"),
  });

  doc.registerFont("Linotte-Regular", font.regular);
  doc.registerFont("Linotte-SemiBold", font.semi);
  doc.registerFont("Linotte-Heavy", font.heavy);

  doc.font("Linotte-Regular");

  doc.pipe(
    fs.createWriteStream(path.join(outputDir, `${name} - Pro Report.pdf`))
  );

  doc.font(font.regular);
  doc.registerFont("Linotte-Regular", font.regular);
  doc.registerFont("Linotte-SemiBold", font.semi);
  doc.registerFont("Linotte-Heavy", font.heavy);

  doc.image(path.join(IMAGES, "book-cover1.png"), 0, 0, {
    width: doc.page.width,
    height: doc.page.height,
  });
  newPage(doc, IMAGES);
  doc.font("Linotte-SemiBold").fontSize(38).fillColor("#040606");
  doc.text(`${name.split(" ")[0]}'s First Astrology Report`, 60, 120, {
    align: "center",
    width: doc.page.width - 120,
  });
  doc.image(
    path.join(IMAGES, "starting.png"),
    doc.page.width / 2 - 150,
    doc.page.height / 2 - 150,
    { width: 300, height: 300 }
  );

  const paragraphWidth = doc.page.width - 120;
  const yLimit = doc.page.height - 100;

  doc.font("Linotte-SemiBold").fontSize(22).fillColor("#000");
  doc.text(
    `The Precious Child Born on the auspicious day ${formatted_date} at ${formatted_time.toUpperCase()}. Place of birth is ${location}.`,
    60,
    doc.y + 400,
    { width: paragraphWidth, align: "justify" }
  );

  newPage(doc, IMAGES);
  doc.font("Linotte-SemiBold").text(`Contents`, 60, 80, {
    align: "center",
    width: doc.page.width - 120,
  });

  doc.font("Linotte-SemiBold").fontSize(16).fillColor("#000");
  doc.y += 10;

  context[3].forEach((item, index) => {
    if (doc.y > yLimit) {
      newPage(doc, IMAGES);
      doc.font("Linotte-SemiBold").fontSize(16).fillColor("#000");
      doc.y = 80;
    }
    doc.text(`${index + 1}. ${item}`, 80, doc.y + 15, {
      width: doc.page.width - 160,
      align: "left",
      lineGap: 10,
    });
  });

  newPage(doc, IMAGES);
  doc.font("Linotte-Heavy").fontSize(36).fillColor("#000");

  const widthString = doc.widthOfString(`${name}'s Astrology Details`);
  let yPosition = doc.page.height / 2 - 18;

  if (widthString > doc.page.width - 300) {
    yPosition += 18;
  }

  doc.text(`${name}'s Astrology Details`, 150, yPosition, {
    align: "center",
    width: doc.page.width - 300,
  });

  newPage(doc, IMAGES);
  doc.font("Linotte-Heavy").fontSize(42).fillColor("#E85D2B");
  doc.text(`Horoscope Details`, 50, 90, {
    align: "center",
    width: doc.page.width - 100,
  });

  const asc = planets.find((p) => p.Name === "Ascendant");

  const ascIndex = asc ? Math.max(0, zodiac.indexOf(asc.sign)) : 0;

  const wrapIndex = (i) => ((i % 12) + 12) % 12;

  const ninthHouseLord = zodiac_lord[wrapIndex(((ascIndex + 9) % 12) - 1)];
  const signLord = planets.find((p) => p.Name === ninthHouseLord) || {};
  const isthadevathaLord = signLord.nakshatra_lord;
  const isthaDeva = ista_devatas?.[isthadevathaLord] || [];

  let atma = planets.find((p) => p.order === 1) || planets[0];
  if (atma && atma.Name === "Ascendant") {
    atma = planets.find((p) => p.order === 2) || atma;
  }

  const moon = planets.find((p) => p.Name === "Moon") || {};

  const start = Math.max(0, nakshatras.indexOf(moon.nakshatra));
  const nakshatrasOrder = nakshatras
    .slice(start)
    .concat(nakshatras.slice(0, start));

  const favourableNakshatraList = [];
  nakshatrasOrder.forEach((nk, idx) => {
    if (idx % 9 === 1) favourableNakshatraList.push(nk);
  });
  const favourableNakshatra =
    favourableNakshatraList.join(", ") +
    (favourableNakshatraList.length ? ", " : "");

  const luckyNumber = nakshatraNumber?.[panchang.nakshatra] || [];

  const fiveHouseLord = zodiac_lord[wrapIndex(((ascIndex + 5) % 12) - 1)];
  const ninthHouseLord2 = zodiac_lord[wrapIndex(((ascIndex + 9) % 12) - 1)];

  const stones = [
    Planet_Gemstone_Desc?.[asc?.zodiac_lord] || {},
    Planet_Gemstone_Desc?.[fiveHouseLord] || {},
    Planet_Gemstone_Desc?.[ninthHouseLord2] || {},
  ];

  const left_column_text = [
    "Name :",
    "Date Of Birth :",
    "Time Of Birth :",
    "Place Of Birth :",
    "Birth Nakshatra, Lord :",
    "Birth Rasi, Lord :",
    "Birth Lagnam, Lord :",
    "Tithi :",
    "Nithya Yogam :",
    "Karanam :",
    "Birth Week Day :",
    "Atma Karagam, Lord : ",
    "Ishta Devata :",
    "Benefic Stars :",
    "Benefic Number :",
    "Life Stone :",
    "Benefictical Stone :",
    "Lucky Stone :",
  ];

  const right_column_text = [
    `${name}`,
    `${formatted_date}`,
    `${formatted_time}`,
    `${location}`,
    `${panchang.nakshatra}, ${planets[2]?.nakshatra_lord}`,
    `${planets[2]?.sign}, ${planets[2]?.zodiac_lord}`,
    `${planets[0]?.sign}, ${planets[0]?.zodiac_lord}`,
    `${panchang.tithi}`,
    `${panchang.yoga}`,
    `${panchang.karana}`,
    `${panchang.week_day}`,
    `${atma?.Name}, ${atma_names?.[atma?.Name] ?? ""}`,
    `${isthaDeva ?? ""}`,
    `${favourableNakshatra}`,
    `${luckyNumber[0] ?? ""}, ${luckyNumber[1] ?? ""}`,
    `${stones[0]?.Gemstone ?? ""}`,
    `${stones[1]?.Gemstone ?? ""}`,
    `${stones[2]?.Gemstone ?? ""}`,
  ];

  const left_x = 80;
  const right_x = doc.page.width / 2 - 10;
  let start_y = 150;
  for (let i = 0; i < left_column_text.length; i++) {
    doc.font("Linotte-SemiBold").fontSize(16).fillColor("#000");
    doc.text(left_column_text[i], left_x, start_y, {
      width: doc.page.width / 2 - 100,
      align: "right",
    });
    doc.font("Linotte-Regular").fontSize(16).fillColor("#000");
    doc.text(right_column_text[i], right_x, start_y, {
      width: doc.page.width / 2 - 100,
      align: "left",
      lineGap: 2,
    });
    start_y = doc.y + 10;
  }

  newPage(doc, IMAGES);
  doc.font("Linotte-Heavy").fontSize(26).fillColor("#000");
  doc.text("Birth Chart", 0, 80, {
    align: "center",
    width: doc.page.width,
  });

  doc.image(
    path.join(reportPath, "generated", "charts", charts.birth_chart),
    doc.page.width / 2 - 125,
    doc.y + 20,
    {
      width: 250,
    }
  );
  doc.text("Navamsa Chart", 0, doc.y + 300, {
    align: "center",
    width: doc.page.width,
  });
  doc.image(
    path.join(reportPath, "generated", "charts", charts.navamsa_chart),
    doc.page.width / 2 - 125,
    doc.y + 20,
    {
      width: 250,
    }
  );

  newPage(doc, IMAGES);
  doc.font("Linotte-Heavy").fontSize(32).fillColor("#000");
  doc.text("Planetary Positions", 0, 70, {
    align: "center",
    width: doc.page.width,
  });

  const colors = [
    "#FFFDAC",
    "#EAECE8",
    "#FFAF7B",
    "#C6B9A9",
    "#FFE8B2",
    "#FDD29D",
    "#C3B3AA",
    "#A4EDFF",
    "#C5FFB5",
    "#FFF6F6",
  ];

  const startX = 65;
  const startY = doc.y + 36;
  const spacingX = 240;
  const spacingY = 230;
  doc.font("Linotte-Regular").fontSize(12).fillColor("#000");

  planets.forEach((planet, i) => {
    let x, y;
    if (i === 6) {
      newPage(doc, IMAGES);
      x = startX + 30;
      y = 90;
    } else if (i === 7) {
      x = startX + spacingX + 30;
      y = 90;
    } else if (i === 8) {
      x = startX + 30;
      y = 90 + spacingY;
    } else if (i === 9) {
      x = startX + spacingX + 30;
      y = 90 + spacingY;
    } else {
      x = startX + (i % 2) * spacingX + 30;
      y = startY + Math.floor(i / 2) * spacingY;
    }

    drawPlanetTable(doc, planet, x, y, colors[i % colors.length], IMAGES);
  });

  newPage(doc, IMAGES);
  doc.font("Linotte-Heavy").fontSize(32).fillColor("#000");
  doc.text(`${name}'s Favorable Times`, 0, 40, {
    align: "center",
    width: doc.page.width,
  });

  let i = 0;
  for (const [d, b] of Object.entries(dasa)) {
    let x, y;
    if (i < 6) {
      x = 50 + (i % 3) * 170;
      y = 80 + Math.floor(i / 3) * 340;
    } else {
      if (i === 6) {
        newPage(doc, IMAGES);
      }
      x = 50 + ((i - 6) % 3) * 170;
      y = 80 + Math.floor((i - 6) / 3) * 340;
    }

    const start_age = i === 0 ? 0 : parseInt(b[0].end_year) - year;
    const end_age = parseInt(b[b.length - 1].end_year) - year;

    drawDasa(doc, d, b, x, y, start_age, end_age, IMAGES);
    i++;
  }

  const noteColors = {
    Favourable: "#DAFFDC",
    Unfavourable: "#FFDADA",
    Moderate: "#DAE7FF",
  };

  doc
    .font("Linotte-Heavy")
    .fontSize(22)
    .text("Note:", 60, doc.y + 30);

  Object.entries(noteColors).forEach(([label, color]) => {
    doc
      .save()
      .fillColor(color)
      .roundedRect(100, doc.y + 20, 25, 25, 5)
      .fill()
      .restore();

    doc
      .font("Linotte-SemiBold")
      .fontSize(16)
      .fillColor("#000")
      .text(label, 140, doc.y + 25);
  });

  newPage(doc, IMAGES);

  doc.font("Linotte-Heavy").fontSize(26).fillColor("#966A2F");
  doc.text(`${name}'s Five Natural Elements`, 0, 55, {
    align: "center",
    width: doc.page.width,
  });

  const elements = {
    Fire: 0,
    Earth: 0,
    Air: 0,
    Water: 0,
  };

  planets.forEach((pla) => {
    for (const [d, k] of Object.entries(elements)) {
      if (
        pla["Name"] == "Ascendant" ||
        pla["Name"] == "Rahu" ||
        pla["Name"] == "Ketu"
      ) {
        continue;
      }
      if (elements_data[d].includes(pla["sign"])) {
        elements[d] = elements[d] + 1;
      }
    }
  });

  for (const [d, k] of Object.entries(elements)) {
    elements[d] = (elements[d] / 7) * 100;
  }

  const max_key1 = Object.keys(elements).reduce((a, b) =>
    elements[a] > elements[b] ? a : b
  );

  let max_value2 = 0;
  let max_key2 = "";
  for (const [k, v] of Object.entries(elements)) {
    if (k === max_key1) {
      continue;
    }
    if (v > max_value2) {
      max_value2 = v;
      max_key2 = k;
    }
  }

  const dominantElementData = elements_content[max_key1];

  doc
    .save()
    .fillColor("#BAF596")
    .roundedRect(60, doc.y + 15, doc.page.width - 120, 40, 10)
    .strokeColor("#06FF4C")
    .fillAndStroke()
    .restore();

  doc.fontSize(14).fillColor("#04650D");
  const textHeight = doc.currentLineHeight();
  doc.text(
    `${name}'s Dominant Element are ${max_key1} and ${max_key2}`,
    0,
    doc.y + 15 + (40 - textHeight) / 2,
    {
      align: "center",
      width: doc.page.width,
    }
  );

  doc.font("Linotte-Regular").fontSize(16).fillColor("#000");

  doc
    .save()
    .fillColor("#FFF2D7")
    .roundedRect(
      50,
      doc.y + 25,
      doc.page.width - 100,
      no_of_lines(doc, dominantElementData[0], doc.page.width - 120) *
        (doc.currentLineHeight() + 4) +
        20,
      10
    )
    .fill()
    .restore();

  doc.text(dominantElementData[0], 60, doc.y + 32.5, {
    align: "justify",
    width: doc.page.width - 120,
    lineGap: 4,
  });

  const elementsColors = ["#FF0000", "#43A458", "#B1DC36", "#4399FF"];

  draw_bar_chart(
    doc,
    60,
    doc.y + 230,
    55,
    30,
    elements,
    elementsColors,
    160,
    IMAGES
  );

  let y = doc.y - 200;
  let x = doc.x + 100;
  for (const [i, [label, value]] of Object.entries(Object.entries(elements))) {
    doc.font("Linotte-SemiBold").fontSize(18).fillColor(elementsColors[i]);
    doc.text(`${label}: ${value.toFixed(2)}%`, x, y);
    y += 50;
  }

  doc.y += 40;
  doc.fillColor("#000");
  doc.text("Impacts on Personality", 0, doc.y + 20, {
    align: "center",
    width: doc.page.width,
  });

  doc
    .font("Linotte-Heavy")
    .fontSize(14)
    .text("Strength : ", 60, doc.y + 15, { continued: true });
  doc
    .font("Linotte-Regular")
    .text(dominantElementData[1].join(", "), 60, doc.y, {
      width: doc.page.width - 120,
    });

  doc
    .font("Linotte-Heavy")
    .text("Challenges : ", 60, doc.y + 15, { continued: true });
  doc
    .font("Linotte-Regular")
    .text(dominantElementData[2].join(", "), 60, doc.y, {
      width: doc.page.width,
      indent: 200,
    });

  doc.end();

  return;
}

ProReport(
  "D:\\astrokids\\public\\",
  [
    {
      Name: "Ascendant",
      full_degree: 242.4099704642797,
      norm_degree: 2.409970464279695,
      sign: "Sagittarius",
      zodiac_lord: "Jupiter",
      isRetro: false,
      nakshatra: "Mula",
      nakshatra_lord: "Ketu",
      pada: 1,
      pos_from_asc: 1,
      order: 9,
    },
    {
      Name: "Sun",
      full_degree: 249.69692891100487,
      norm_degree: 9.696928911004875,
      sign: "Sagittarius",
      zodiac_lord: "Jupiter",
      isRetro: false,
      nakshatra: "Mula",
      nakshatra_lord: "Ketu",
      pada: 3,
      pos_from_asc: 1,
      order: 5,
    },
    {
      Name: "Moon",
      full_degree: 52.07729307747468,
      norm_degree: 22.07729307747468,
      sign: "Taurus",
      zodiac_lord: "Venus",
      isRetro: false,
      nakshatra: "Rohini",
      nakshatra_lord: "Moon",
      pada: 4,
      pos_from_asc: 6,
      order: 2,
      dasa: 0.905799245308714,
    },
    {
      Name: "Mercury",
      full_degree: 228.210161238488,
      norm_degree: 18.210161238488013,
      sign: "Scorpio",
      zodiac_lord: "Mars",
      isRetro: false,
      nakshatra: "Jyeshtha",
      nakshatra_lord: "Mercury",
      pada: 1,
      pos_from_asc: 12,
      order: 3,
    },
    {
      Name: "Venus",
      full_degree: 226.51128412181004,
      norm_degree: 16.511284121810036,
      sign: "Scorpio",
      zodiac_lord: "Mars",
      isRetro: false,
      nakshatra: "Anuradha",
      nakshatra_lord: "Saturn",
      pada: 4,
      pos_from_asc: 12,
      order: 4,
    },
    {
      Name: "Mars",
      full_degree: 215.69878960705864,
      norm_degree: 5.698789607058643,
      sign: "Scorpio",
      zodiac_lord: "Mars",
      isRetro: false,
      nakshatra: "Anuradha",
      nakshatra_lord: "Saturn",
      pada: 1,
      pos_from_asc: 12,
      order: 6,
    },
    {
      Name: "Jupiter",
      full_degree: 172.7095264059061,
      norm_degree: 22.709526405906104,
      sign: "Virgo",
      zodiac_lord: "Mercury",
      isRetro: false,
      nakshatra: "Hasta",
      nakshatra_lord: "Moon",
      pada: 4,
      pos_from_asc: 10,
      order: 1,
    },
    {
      Name: "Saturn",
      full_degree: 91.60836288654787,
      norm_degree: 1.6083628865478659,
      sign: "Cancer",
      zodiac_lord: "Moon",
      isRetro: true,
      nakshatra: "Punarvasu",
      nakshatra_lord: "Jupiter",
      pada: 4,
      pos_from_asc: 7,
      order: 10,
    },
    {
      Name: "Rahu",
      full_degree: 4.842453337258803,
      norm_degree: 4.842453337258803,
      sign: "Aries",
      zodiac_lord: "Mars",
      isRetro: true,
      nakshatra: "Ashwini",
      nakshatra_lord: "Ketu",
      pada: 2,
      pos_from_asc: 5,
      order: 8,
    },
    {
      Name: "Ketu",
      full_degree: 184.84245333725892,
      norm_degree: 4.842453337258917,
      sign: "Libra",
      zodiac_lord: "Venus",
      isRetro: true,
      nakshatra: "Chitra",
      nakshatra_lord: "Mars",
      pada: 4,
      pos_from_asc: 11,
      order: 7,
    },
  ],
  {
    tithi: "Chaturdashi",
    tithi_number: 14,
    paksha: "Shukla Paksha",
    nakshatra: "Rohini",
    nakshatra_number: 4,
    yoga: "Shubha",
    yoga_index: 23,
    karana: "Vanija",
    karana_number: 28,
    sunrise: "06:31:14",
    sunset: "18:04:09",
    ganam: "Manushya",
    yoni: "Snake",
    week_day: "Saturday",
  },
  {
    Moon: [
      {
        bhukti: "Moon",
        start_year: 1994,
        end_year: 1995,
        start_month: 11,
        end_month: 10,
      },
      {
        bhukti: "Mars",
        start_year: 1995,
        end_year: 1996,
        start_month: 10,
        end_month: 6,
      },
      {
        bhukti: "Rahu",
        start_year: 1996,
        end_year: 1998,
        start_month: 6,
        end_month: 1,
      },
      {
        bhukti: "Jupiter",
        start_year: 1998,
        end_year: 1999,
        start_month: 1,
        end_month: 4,
      },
      {
        bhukti: "Saturn",
        start_year: 1999,
        end_year: 2000,
        start_month: 4,
        end_month: 10,
      },
      {
        bhukti: "Mercury",
        start_year: 2000,
        end_year: 2002,
        start_month: 10,
        end_month: 3,
      },
      {
        bhukti: "Ketu",
        start_year: 2002,
        end_year: 2002,
        start_month: 3,
        end_month: 10,
      },
      {
        bhukti: "Venus",
        start_year: 2002,
        end_year: 2004,
        start_month: 10,
        end_month: 6,
      },
      {
        bhukti: "Sun",
        start_year: 2004,
        end_year: 2005,
        start_month: 6,
        end_month: 1,
      },
    ],
    Mars: [
      {
        bhukti: "Mars",
        start_year: 2005,
        end_year: 2005,
        start_month: 1,
        end_month: 5,
      },
      {
        bhukti: "Rahu",
        start_year: 2005,
        end_year: 2006,
        start_month: 5,
        end_month: 5,
      },
      {
        bhukti: "Jupiter",
        start_year: 2006,
        end_year: 2007,
        start_month: 5,
        end_month: 5,
      },
      {
        bhukti: "Saturn",
        start_year: 2007,
        end_year: 2008,
        start_month: 5,
        end_month: 6,
      },
      {
        bhukti: "Mercury",
        start_year: 2008,
        end_year: 2009,
        start_month: 6,
        end_month: 6,
      },
      {
        bhukti: "Ketu",
        start_year: 2009,
        end_year: 2009,
        start_month: 6,
        end_month: 10,
      },
      {
        bhukti: "Venus",
        start_year: 2009,
        end_year: 2010,
        start_month: 10,
        end_month: 11,
      },
      {
        bhukti: "Sun",
        start_year: 2010,
        end_year: 2011,
        start_month: 11,
        end_month: 4,
      },
      {
        bhukti: "Moon",
        start_year: 2011,
        end_year: 2011,
        start_month: 4,
        end_month: 10,
      },
    ],
    Rahu: [
      {
        bhukti: "Rahu",
        start_year: 2011,
        end_year: 2014,
        start_month: 10,
        end_month: 7,
      },
      {
        bhukti: "Jupiter",
        start_year: 2014,
        end_year: 2016,
        start_month: 7,
        end_month: 11,
      },
      {
        bhukti: "Saturn",
        start_year: 2016,
        end_year: 2019,
        start_month: 11,
        end_month: 10,
      },
      {
        bhukti: "Mercury",
        start_year: 2019,
        end_year: 2022,
        start_month: 10,
        end_month: 5,
      },
      {
        bhukti: "Ketu",
        start_year: 2022,
        end_year: 2023,
        start_month: 5,
        end_month: 5,
      },
      {
        bhukti: "Venus",
        start_year: 2023,
        end_year: 2026,
        start_month: 5,
        end_month: 5,
      },
      {
        bhukti: "Sun",
        start_year: 2026,
        end_year: 2027,
        start_month: 5,
        end_month: 4,
      },
      {
        bhukti: "Moon",
        start_year: 2027,
        end_year: 2028,
        start_month: 4,
        end_month: 10,
      },
      {
        bhukti: "Mars",
        start_year: 2028,
        end_year: 2029,
        start_month: 10,
        end_month: 10,
      },
    ],
    Jupiter: [
      {
        bhukti: "Jupiter",
        start_year: 2029,
        end_year: 2031,
        start_month: 10,
        end_month: 11,
      },
      {
        bhukti: "Saturn",
        start_year: 2031,
        end_year: 2034,
        start_month: 11,
        end_month: 6,
      },
      {
        bhukti: "Mercury",
        start_year: 2034,
        end_year: 2036,
        start_month: 6,
        end_month: 9,
      },
      {
        bhukti: "Ketu",
        start_year: 2036,
        end_year: 2037,
        start_month: 9,
        end_month: 9,
      },
      {
        bhukti: "Venus",
        start_year: 2037,
        end_year: 2040,
        start_month: 9,
        end_month: 5,
      },
      {
        bhukti: "Sun",
        start_year: 2040,
        end_year: 2041,
        start_month: 5,
        end_month: 3,
      },
      {
        bhukti: "Moon",
        start_year: 2041,
        end_year: 2042,
        start_month: 3,
        end_month: 6,
      },
      {
        bhukti: "Mars",
        start_year: 2042,
        end_year: 2043,
        start_month: 6,
        end_month: 6,
      },
      {
        bhukti: "Rahu",
        start_year: 2043,
        end_year: 2045,
        start_month: 6,
        end_month: 10,
      },
    ],
    Saturn: [
      {
        bhukti: "Saturn",
        start_year: 2045,
        end_year: 2048,
        start_month: 10,
        end_month: 10,
      },
      {
        bhukti: "Mercury",
        start_year: 2048,
        end_year: 2051,
        start_month: 10,
        end_month: 7,
      },
      {
        bhukti: "Ketu",
        start_year: 2051,
        end_year: 2052,
        start_month: 7,
        end_month: 8,
      },
      {
        bhukti: "Venus",
        start_year: 2052,
        end_year: 2055,
        start_month: 8,
        end_month: 9,
      },
      {
        bhukti: "Sun",
        start_year: 2055,
        end_year: 2056,
        start_month: 9,
        end_month: 9,
      },
      {
        bhukti: "Moon",
        start_year: 2056,
        end_year: 2058,
        start_month: 9,
        end_month: 4,
      },
      {
        bhukti: "Mars",
        start_year: 2058,
        end_year: 2059,
        start_month: 4,
        end_month: 5,
      },
      {
        bhukti: "Rahu",
        start_year: 2059,
        end_year: 2062,
        start_month: 5,
        end_month: 4,
      },
      {
        bhukti: "Jupiter",
        start_year: 2062,
        end_year: 2064,
        start_month: 4,
        end_month: 10,
      },
    ],
    Mercury: [
      {
        bhukti: "Mercury",
        start_year: 2064,
        end_year: 2067,
        start_month: 10,
        end_month: 3,
      },
      {
        bhukti: "Ketu",
        start_year: 2067,
        end_year: 2068,
        start_month: 3,
        end_month: 3,
      },
      {
        bhukti: "Venus",
        start_year: 2068,
        end_year: 2071,
        start_month: 3,
        end_month: 1,
      },
      {
        bhukti: "Sun",
        start_year: 2071,
        end_year: 2071,
        start_month: 1,
        end_month: 11,
      },
      {
        bhukti: "Moon",
        start_year: 2071,
        end_year: 2073,
        start_month: 11,
        end_month: 4,
      },
      {
        bhukti: "Mars",
        start_year: 2073,
        end_year: 2074,
        start_month: 4,
        end_month: 4,
      },
      {
        bhukti: "Rahu",
        start_year: 2074,
        end_year: 2076,
        start_month: 4,
        end_month: 10,
      },
      {
        bhukti: "Jupiter",
        start_year: 2076,
        end_year: 2079,
        start_month: 10,
        end_month: 2,
      },
      {
        bhukti: "Saturn",
        start_year: 2079,
        end_year: 2081,
        start_month: 2,
        end_month: 10,
      },
    ],
    Ketu: [
      {
        bhukti: "Ketu",
        start_year: 2081,
        end_year: 2082,
        start_month: 10,
        end_month: 3,
      },
      {
        bhukti: "Venus",
        start_year: 2082,
        end_year: 2083,
        start_month: 3,
        end_month: 4,
      },
      {
        bhukti: "Sun",
        start_year: 2083,
        end_year: 2083,
        start_month: 4,
        end_month: 8,
      },
      {
        bhukti: "Moon",
        start_year: 2083,
        end_year: 2084,
        start_month: 8,
        end_month: 3,
      },
      {
        bhukti: "Mars",
        start_year: 2084,
        end_year: 2084,
        start_month: 3,
        end_month: 7,
      },
      {
        bhukti: "Rahu",
        start_year: 2084,
        end_year: 2085,
        start_month: 7,
        end_month: 7,
      },
      {
        bhukti: "Jupiter",
        start_year: 2085,
        end_year: 2086,
        start_month: 7,
        end_month: 7,
      },
      {
        bhukti: "Saturn",
        start_year: 2086,
        end_year: 2087,
        start_month: 7,
        end_month: 8,
      },
      {
        bhukti: "Mercury",
        start_year: 2087,
        end_year: 2088,
        start_month: 8,
        end_month: 8,
      },
    ],
    Venus: [
      {
        bhukti: "Venus",
        start_year: 2088,
        end_year: 2091,
        start_month: 8,
        end_month: 11,
      },
      {
        bhukti: "Sun",
        start_year: 2091,
        end_year: 2092,
        start_month: 11,
        end_month: 11,
      },
      {
        bhukti: "Moon",
        start_year: 2092,
        end_year: 2094,
        start_month: 11,
        end_month: 7,
      },
      {
        bhukti: "Mars",
        start_year: 2094,
        end_year: 2095,
        start_month: 7,
        end_month: 9,
      },
      {
        bhukti: "Rahu",
        start_year: 2095,
        end_year: 2098,
        start_month: 9,
        end_month: 9,
      },
      {
        bhukti: "Jupiter",
        start_year: 2098,
        end_year: 2101,
        start_month: 9,
        end_month: 5,
      },
      {
        bhukti: "Saturn",
        start_year: 2101,
        end_year: 2104,
        start_month: 5,
        end_month: 6,
      },
      {
        bhukti: "Mercury",
        start_year: 2104,
        end_year: 2107,
        start_month: 6,
        end_month: 4,
      },
      {
        bhukti: "Ketu",
        start_year: 2107,
        end_year: 2108,
        start_month: 4,
        end_month: 6,
      },
    ],
    Sun: [
      {
        bhukti: "Sun",
        start_year: 2108,
        end_year: 2108,
        start_month: 6,
        end_month: 9,
      },
      {
        bhukti: "Moon",
        start_year: 2108,
        end_year: 2109,
        start_month: 9,
        end_month: 4,
      },
      {
        bhukti: "Mars",
        start_year: 2109,
        end_year: 2109,
        start_month: 4,
        end_month: 8,
      },
      {
        bhukti: "Rahu",
        start_year: 2109,
        end_year: 2110,
        start_month: 8,
        end_month: 7,
      },
      {
        bhukti: "Jupiter",
        start_year: 2110,
        end_year: 2111,
        start_month: 7,
        end_month: 5,
      },
      {
        bhukti: "Saturn",
        start_year: 2111,
        end_year: 2112,
        start_month: 5,
        end_month: 5,
      },
      {
        bhukti: "Mercury",
        start_year: 2112,
        end_year: 2113,
        start_month: 5,
        end_month: 4,
      },
      {
        bhukti: "Ketu",
        start_year: 2113,
        end_year: 2113,
        start_month: 4,
        end_month: 8,
      },
      {
        bhukti: "Venus",
        start_year: 2113,
        end_year: 2114,
        start_year: 2113,
        end_year: 2114,
        start_month: 8,
        end_month: 8,
      },
    ],
  },
  { birth_chart: "88301714.png", navamsa_chart: "6446444.png" },
  "25 December 2004",
  "05:50:00 am",
  "Kadambur, Tamil Nadu, India",
  2004,
  12,
  "Guru",
  "male",
  "D:\\astrokids\\public\\generated\\reports"
);
