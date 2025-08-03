const width = 900;
const height = 600;
const margin = { top: 50, right: 50, bottom: 50, left: 120 };
const svg = d3.select("#chart");
const chartWidth = width - margin.left - margin.right;
const chartHeight = height - margin.top - margin.bottom;
const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

const heartPath = "M24 4C18-1 8 1 8 10c0 7 9 12 16 20 7-8 16-13 16-20 0-9-10-11-16-6z"; // SVG path for heart

d3.csv("data/mental_health_summary_2021.csv").then(data => {
  // Prepare filters
  const genders = Array.from(new Set(data.map(d => d.GENDER_LABEL)));
  const educLevels = Array.from(new Set(data.map(d => d.EDUC_LEVEL)));
  const issues = Array.from(new Set(data.map(d => d.MH1_LABEL)));

  d3.select("#gender").selectAll("option")
    .data(genders).enter()
    .append("option").text(d => d);
  d3.select("#education").selectAll("option")
    .data(educLevels).enter()
    .append("option").text(d => d);
  d3.select("#issue").selectAll("option")
    .data(issues).enter()
    .append("option").text(d => d);

  // Trigger update when filter changes
  d3.selectAll("select").on("change", update);

  const xDomain = ["20s", "30s", "40s", "50s", "60s"];
  const yDomain = Array.from(new Set(data.map(d => d.MARSTAT_LABEL)));

  const xScale = d3.scaleBand().domain(xDomain).range([0, chartWidth]).padding(0.2);
  const yScale = d3.scaleBand().domain(yDomain).range([0, chartHeight]).padding(0.2);

  const colorScale = d3.scaleLinear().domain([0, 100])
    .range(["#ffcccc", "#990000"]); // Light pink to dark red

  g.append("g")
    .attr("transform", `translate(0,0)`)
    .call(d3.axisLeft(yScale));

  g.append("g")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(xScale));

  function update() {
    const selectedGender = d3.select("#gender").property("value");
    const selectedEducation = d3.select("#education").property("value");
    const selectedIssue = d3.select("#issue").property("value");

    const filtered = data.filter(d =>
      d.GENDER_LABEL === selectedGender &&
      d.EDUC_LEVEL === selectedEducation &&
      d.MH1_LABEL === selectedIssue
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
        return `translate(${x},${y}) scale(0.8)`;
      })
      .attr("fill", d => colorScale(+d.percentage))
      .attr("stroke", "#444")
      .attr("stroke-width", 1)
      .merge(hearts)
      .transition().duration(500)
      .attr("fill", d => colorScale(+d.percentage));

    hearts.exit().remove();
  }

  // Trigger initial render
  d3.select("#gender").property("value", genders[0]);
  d3.select("#education").property("value", educLevels[0]);
  d3.select("#issue").property("value", issues[0]);
  update();
});