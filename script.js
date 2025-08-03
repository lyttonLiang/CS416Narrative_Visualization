const width = 1200;
const height = 900;
const margin = { top: 50, right: 50, bottom: 50, left: 140 };
const svg = d3.select("#chart");
const chartWidth = width - margin.left - margin.right;
const chartHeight = height - margin.top - margin.bottom;
const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

const heartPath = "M24 4C18-1 8 1 8 10c0 7 9 12 16 20 7-8 16-13 16-20 0-9-10-11-16-6z"; // SVG path for heart

const educationCategoryMap = {
  "0 to 8 year": "Middle School or below",
  "9 to 11 year": "Some High School",
  "12 (or GED) year": "High School Graduate",
  "More than 12 year": "College or higher",
  "Special education": "Special Education",
  "unknown/invalid": "Unknown"
};

// Global variables for Scene 3
let scene3Data = null;
let scene3Svg = null;
let scene3G = null;
let scene3Tooltip = null;

// Create tooltip for Scene 2
const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("background", "#fff")
  .style("padding", "8px 12px")
  .style("border", "1px solid #ccc")
  .style("border-radius", "6px")
  .style("pointer-events", "none")
  .style("font-size", "14px");

d3.csv("data/mental_health_summary.csv").then(data => {
  // Map EDUC_LEVEL to clean labels
  data.forEach(d => {
    d.EDUC_LEVEL_ORIGINAL = d.EDUC_LEVEL;
    d.EDUC_LEVEL = educationCategoryMap[d.EDUC_LEVEL.trim()] || d.EDUC_LEVEL.trim();
  });

  const genders = Array.from(new Set(data.map(d => d.GENDER_LABEL)));
  const educLevels = Array.from(new Set(data.map(d => d.EDUC_LEVEL)));
  const issues = Array.from(new Set(data.map(d => d.MH1_LABEL)));

  d3.select("#gender").selectAll("option")
    .data(["", ...genders]).enter()
    .append("option").text(d => d);

  d3.select("#education").selectAll("option")
    .data(["", ...educLevels])
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  d3.select("#issue").selectAll("option")
    .data(["", ...issues]).enter()
    .append("option").text(d => d);

  d3.selectAll("select").on("change", update);

  const xDomain = ["20s", "30s", "40s", "50s", "60s"];
  const yDomain = Array.from(new Set(data.map(d => d.MARSTAT_LABEL)));

  const xScale = d3.scaleBand().domain(xDomain).range([0, chartWidth]).padding(0.2);
  const yScale = d3.scaleBand().domain(yDomain).range([0, chartHeight]).padding(0.2);

  const colorScale = d3.scaleLinear().domain([0, 50, 100])
  .range(["#e3f2fd","#d32f2f"]);

  g.append("g")
    .attr("transform", `translate(0,0)`)
    .call(d3.axisLeft(yScale)).selectAll("text").style("font-size", "14px");

  g.append("g")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(xScale)).selectAll("text").style("font-size", "14px");

  function update() {
    const selectedGender = d3.select("#gender").property("value");
    const selectedEducation = d3.select("#education").property("value");
    const selectedIssue = d3.select("#issue").property("value");

    const filtered = data.filter(d =>
      (!selectedGender || d.GENDER_LABEL === selectedGender) &&
      (!selectedEducation || d.EDUC_LEVEL === selectedEducation) &&
      (!selectedIssue || d.MH1_LABEL === selectedIssue)
    );

    const hearts = g.selectAll("path.heart")
      .data(filtered, d => `${d.AGE_GROUP}-${d.MARSTAT_LABEL}`);

    hearts.enter()
      .append("path")
      .attr("class", "heart")
      .attr("d", heartPath)
      .attr("transform", d => {
        const x = xScale(d.AGE_GROUP) + xScale.bandwidth() / 2;
        const y = yScale(d.MARSTAT_LABEL) + yScale.bandwidth() / 2;
        return `translate(${x},${y}) scale(2.2) translate(-12,-12)`;
      })
      .attr("fill", d => colorScale(+d.percentage))
      .attr("stroke", "#444")
      .attr("stroke-width", 1)
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`<strong>${(+d.percentage).toFixed(2)}%</strong><br>${d.EDUC_LEVEL}, ${d.AGE_GROUP}, ${d.MARSTAT_LABEL}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(300).style("opacity", 0);
      })
      .merge(hearts)
      .transition().duration(500)
      .attr("fill", d => colorScale(+d.percentage));

    hearts.exit().remove();
  }

  d3.select("#gender").property("value", genders[0]);
  d3.select("#education").property("value", educLevels[0]);
  d3.select("#issue").property("value", issues[0]);
  update();

  // Initialize Scene 3 data
  scene3Data = data;
  initializeScene3();
  
  // Add dynamic insights and annotations
  addDynamicAnnotations(data);
}).catch(error => {
  console.error("Error loading data:", error);
});

// Scene 3: Education vs Mental Health Diagnosis
function initializeScene3() {
  console.log("initializeScene3 called");
  if (!scene3Data) {
    console.log("No scene3Data available");
    return;
  }
  
  console.log("Initializing Scene 3 with data length:", scene3Data.length);
  
  scene3Svg = d3.select("#scene3-chart");
  console.log("scene3Svg:", scene3Svg);
  
  const scene3Margin = { top: 40, right: 40, bottom: 100, left: 100 };
  const scene3Width = +scene3Svg.attr("width") - scene3Margin.left - scene3Margin.right;
  const scene3Height = +scene3Svg.attr("height") - scene3Margin.top - scene3Margin.bottom;
  scene3G = scene3Svg.append("g").attr("transform", `translate(${scene3Margin.left},${scene3Margin.top})`);

  scene3Tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "#fff")
    .style("padding", "8px 12px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "6px")
    .style("pointer-events", "none")
    .style("font-size", "14px");

  const issueOptions = Array.from(new Set(scene3Data.map(d => d.MH1_LABEL)));
  console.log("issueOptions:", issueOptions);
  
  d3.select("#scene3-issue").selectAll("option")
    .data(issueOptions)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  d3.select("#scene3-issue").on("change", renderScene3);

  // Set initial value and render
  d3.select("#scene3-issue").property("value", issueOptions[0]);
  console.log("Scene 3 initialization complete, calling renderScene3");
  renderScene3();
}

window.renderScene3 = function renderScene3() {
  console.log("renderScene3 called");
  console.log("scene3Data:", scene3Data);
  console.log("scene3G:", scene3G);
  
  if (!scene3Data || !scene3G) {
    console.log("Scene 3 not initialized yet");
    return;
  }

  const selectedIssue = d3.select("#scene3-issue").property("value");
  console.log("selectedIssue:", selectedIssue);
  if (!selectedIssue) return;

  const filtered = scene3Data.filter(d => d.MH1_LABEL === selectedIssue);
  console.log("filtered data length:", filtered.length);

  const eduGroups = d3.rollup(
    filtered,
    v => d3.mean(v, d => +d.percentage),
    d => d.EDUC_LEVEL
  );

  const eduData = Array.from(eduGroups, ([EDUC_LEVEL, avg]) => ({ EDUC_LEVEL, avg }));
  console.log("eduData:", eduData);

  const scene3Width = 1000 - 140; // width - left - right margin
  const scene3Height = 600 - 140; // height - top - bottom margin

  const x = d3.scaleBand()
    .domain(eduData.map(d => d.EDUC_LEVEL))
    .range([0, scene3Width])
    .padding(0.3);

  const y = d3.scaleLinear()
    .domain([0, d3.max(eduData, d => d.avg)]).nice()
    .range([scene3Height, 0]);

  const colorScale = d3.scaleLinear()
    .domain([0, d3.max(eduData, d => d.avg)])
    .range(["#e0f3f8", "#007acc"]);

  scene3G.selectAll("*").remove();

  scene3G.append("g")
    .call(d3.axisLeft(y).tickFormat(d => d + "%"))
    .style("font-size", "14px");

  scene3G.append("g")
    .attr("transform", `translate(0,${scene3Height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-25)")
    .style("text-anchor", "end")
    .style("font-size", "14px");

  scene3G.selectAll("rect")
    .data(eduData)
    .enter()
    .append("rect")
    .attr("x", d => x(d.EDUC_LEVEL))
    .attr("y", d => y(d.avg))
    .attr("width", x.bandwidth())
    .attr("height", d => scene3Height - y(d.avg))
    .attr("fill", d => colorScale(d.avg))
    .on("mouseover", (event, d) => {
      scene3Tooltip.transition().duration(200).style("opacity", 0.95);
      scene3Tooltip.html(`<strong>${d.EDUC_LEVEL}</strong><br>${d.avg.toFixed(2)}%`)
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      scene3Tooltip.transition().duration(300).style("opacity", 0);
    });
  
  console.log("Scene 3 rendered successfully");
}

// Function to add dynamic annotations highlighting interesting patterns
function addDynamicAnnotations(data) {
  // Find interesting patterns in the data
  const insights = analyzeDataForInsights(data);
  
  // Add insights to Scene 2
  addScene2Insights(insights);
  
  // Add insights to Scene 3
  addScene3Insights(insights);
}

function analyzeDataForInsights(data) {
  const insights = {
    highestRate: null,
    lowestRate: null,
    genderDifferences: {},
    agePatterns: {},
    educationPatterns: {}
  };
  
  // Find highest and lowest rates
  let maxRate = 0;
  let minRate = 100;
  
  data.forEach(d => {
    const rate = +d.percentage;
    if (rate > maxRate) {
      maxRate = rate;
      insights.highestRate = d;
    }
    if (rate < minRate && rate > 0) {
      minRate = rate;
      insights.lowestRate = d;
    }
  });
  
  // Analyze gender differences for common conditions
  const commonConditions = ['Depressive disorders', 'Anxiety disorders', 'Bipolar disorders'];
  commonConditions.forEach(condition => {
    const conditionData = data.filter(d => d.MH1_LABEL === condition);
    const genderGroups = d3.rollup(conditionData, v => d3.mean(v, d => +d.percentage), d => d.GENDER_LABEL);
    insights.genderDifferences[condition] = genderGroups;
  });
  
  return insights;
}

function addScene2Insights(insights) {
  // Add insight callout to Scene 2
  const insightDiv = d3.select("#scene2").append("div")
    .attr("class", "insight-callout")
    .style("position", "absolute")
    .style("top", "120px")
    .style("right", "20px")
    .style("background", "#fff3cd")
    .style("border", "2px solid #ffc107")
    .style("border-radius", "8px")
    .style("padding", "15px")
    .style("max-width", "250px")
    .style("box-shadow", "0 4px 8px rgba(0,0,0,0.1)")
    .style("z-index", "1000");
  
  insightDiv.append("h4")
    .style("margin", "0 0 10px 0")
    .style("color", "#856404")
    .text("Quick Insight");
  
  insightDiv.append("p")
    .style("margin", "0")
    .style("font-size", "14px")
    .style("color", "#856404")
    .text("Try filtering by 'Depressive disorders' to see how rates vary across different demographics. You might be surprised by the patterns!");
}

function addScene3Insights(insights) {
  // Add insight callout to Scene 3
  const insightDiv = d3.select("#scene3").append("div")
    .attr("class", "insight-callout")
    .style("position", "absolute")
    .style("top", "120px")
    .style("right", "20px")
    .style("background", "#d1ecf1")
    .style("border", "2px solid #17a2b8")
    .style("border-radius", "8px")
    .style("padding", "15px")
    .style("max-width", "250px")
    .style("box-shadow", "0 4px 8px rgba(0,0,0,0.1)")
    .style("z-index", "1000");
  
  insightDiv.append("h4")
    .style("margin", "0 0 10px 0")
    .style("color", "#0c5460")
    .text("Data Insight");
  
  insightDiv.append("p")
    .style("margin", "0")
    .style("font-size", "14px")
    .style("color", "#0c5460")
    .text("Compare 'Anxiety disorders' vs 'Depressive disorders' across education levels. Notice any interesting patterns?");
}

