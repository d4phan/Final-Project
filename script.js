// Create floating ember particles in header
const header = document.getElementById('header');
for (let i = 0; i < 15; i++) {
    const ember = document.createElement('div');
    ember.className = 'ember';
    ember.style.left = `${Math.random() * 100}%`;
    ember.style.animationDelay = `${Math.random() * 8}s`;
    ember.style.animationDuration = `${6 + Math.random() * 4}s`;
    ember.style.width = `${3 + Math.random() * 4}px`;
    ember.style.height = ember.style.width;
    header.appendChild(ember);
}

let coastalRegions = [];

const projections = [
    { year: 2024, tempIncrease: 0, color: "#4a90e2" },
    { year: 2040, tempIncrease: 0.7, color: "#7fb3d5" },
    { year: 2060, tempIncrease: 1.8, color: "#f39c12" },
    { year: 2080, tempIncrease: 3.1, color: "#e67e22" },
    { year: 2100, tempIncrease: 4.5, color: "#e74c3c" }
];

const svg = d3.select("#visualization");
let width = window.innerWidth;
let height = window.innerHeight;
svg.attr("width", width * 1.5).attr("height", height);
let minimapCollapsedX = width - 180;
let minimapCollapsedY = height - 160;

let isMapExpanded = false;
let currentStep = 0;
let usMapData = null;
let activeChart = null;

const mainGroup = svg.append("g").attr("class", "main-group");
const potGroup = mainGroup.append("g")
    .attr("class", "pot-group")
    .attr("transform", `translate(${width/2}, ${height/2})`);

const minimapGroup = svg.append("g").attr("class", "minimap-group").style("cursor", "pointer");

function positionMinimap(x, y, duration = 0) {
    minimapGroup.transition().duration(duration).attr("transform", `translate(${x}, ${y})`);
}
positionMinimap(minimapCollapsedX, minimapCollapsedY);

minimapGroup.append("rect").attr("width", 150).attr("height", 120).attr("rx", 8)
    .attr("fill", "rgba(0, 0, 0, 0.6)").attr("stroke", "rgba(255, 150, 100, 0.5)").attr("stroke-width", 2);

minimapGroup.append("text").attr("x", 75).attr("y", -10).attr("text-anchor", "middle")
    .attr("fill", "rgba(255, 150, 100, 0.8)").attr("font-size", "12px").text("Click to view map");

const minimapContent = minimapGroup.append("g").attr("transform", "translate(5, 5)");

const expandedMapGroup = svg.append("g").attr("class", "expanded-map-group")
    .attr("transform", `translate(${width * 0.65}, ${height / 2}) scale(0.75)`)
    .style("opacity", 0).style("pointer-events", "none");

const mapBoxWidth = 820, mapBoxHeight = 520, legendBoxWidth = 180, gap = 15;
const totalWidth = mapBoxWidth + gap + legendBoxWidth;
const offsetX = -totalWidth / 2;

expandedMapGroup.append("rect").attr("x", offsetX).attr("y", -mapBoxHeight/2 - 40)
    .attr("width", mapBoxWidth).attr("height", mapBoxHeight).attr("rx", 15)
    .attr("fill", "rgba(10, 20, 40, 0.95)").attr("stroke", "rgba(255, 150, 100, 0.6)").attr("stroke-width", 3);

expandedMapGroup.append("text").attr("x", offsetX + mapBoxWidth/2).attr("y", -mapBoxHeight/2 - 10)
    .attr("text-anchor", "middle").attr("fill", "#ffa500").attr("font-size", "26px")
    .attr("font-family", "'Playfair Display', serif").text("Coastal Regions at Risk in the U.S.A");

const closeButton = expandedMapGroup.append("g").attr("class", "close-button")
    .attr("transform", `translate(${offsetX + mapBoxWidth - 30}, ${-mapBoxHeight/2 - 10})`).style("cursor", "pointer");
closeButton.append("circle").attr("r", 16).attr("fill", "rgba(255, 100, 100, 0.3)")
    .attr("stroke", "#ff6b6b").attr("stroke-width", 2);
closeButton.append("text").attr("text-anchor", "middle").attr("dy", "0.35em")
    .attr("fill", "#ff6b6b").attr("font-size", "20px").attr("font-weight", "bold").text("x");

const legendBox = expandedMapGroup.append("g").attr("transform", `translate(${offsetX + mapBoxWidth + gap}, ${-mapBoxHeight/2 - 40})`);
legendBox.append("rect").attr("width", legendBoxWidth).attr("height", mapBoxHeight).attr("rx", 15)
    .attr("fill", "rgba(10, 20, 40, 0.95)").attr("stroke", "rgba(255, 150, 100, 0.6)").attr("stroke-width", 3);
legendBox.append("text").attr("x", legendBoxWidth/2).attr("y", 35).attr("text-anchor", "middle")
    .attr("fill", "#ffa500").attr("font-size", "16px").attr("font-weight", "bold").text("Legend");

const legendItems = [
    { color: "rgba(255, 107, 53, 0.7)", label: "Pacific Coast" },
    { color: "rgba(100, 200, 255, 0.7)", label: "Atlantic Coast" },
    { color: "rgba(255, 200, 50, 0.7)", label: "Gulf Coast" },
    { color: "rgba(78, 175, 88, 0.82)", label: "Hawaiian Coast" },
    { color: "rgba(100, 150, 200, 0.4)", label: "Other States" }
];
legendItems.forEach((item, i) => {
    const g = legendBox.append("g").attr("transform", `translate(${legendBoxWidth/2}, ${80 + i * 55})`);
    g.append("rect").attr("x", -70).attr("y", -12).attr("width", 24).attr("height", 24).attr("rx", 4)
        .attr("fill", item.color).attr("stroke", "rgba(255, 255, 255, 0.6)");
    g.append("text").attr("x", -38).attr("y", 5).attr("fill", "rgba(255, 255, 255, 0.9)")
        .attr("font-size", "13px").text(item.label);
});

const expandedMapContent = expandedMapGroup.append("g").attr("transform", `translate(${offsetX + mapBoxWidth/2}, 0)`);
const regionMarkers = expandedMapGroup.append("g").attr("transform", `translate(${offsetX + mapBoxWidth/2}, 0)`);

const infoPanel = expandedMapGroup.append("g").attr("transform", `translate(${offsetX + (mapBoxWidth + legendBoxWidth + 15)/2}, ${mapBoxHeight/2 - 25})`).style("opacity", 0);
infoPanel.append("rect").attr("x", -(mapBoxWidth + legendBoxWidth + 15)/2).attr("y", 0)
    .attr("width", mapBoxWidth + legendBoxWidth + 15).attr("height", 80).attr("rx", 12)
    .attr("fill", "rgba(10, 20, 40, 0.95)").attr("stroke", "rgba(255, 150, 100, 0.6)").attr("stroke-width", 2);
const infoTitle = infoPanel.append("text").attr("x", 0).attr("y", 28).attr("text-anchor", "middle")
    .attr("fill", "#ffa500").attr("font-size", "18px").attr("font-weight", "bold");
const infoText = infoPanel.append("text").attr("x", 0).attr("y", 52).attr("text-anchor", "middle")
    .attr("fill", "rgba(255, 255, 255, 0.9)").attr("font-size", "14px");

// Data loading functions
async function loadCoastalData() {
    try {
        const response = await fetch('data/coastal_regions_real_data.json');
        const allData = await response.json();
        coastalRegions = allData.map(region => ({ ...region, processedData: processTemperatureData(region) }));
        
        // Process each region's temperature data
        const processedData = allData.map(region => {
            const processed = processTemperatureData(region);
            return {
                ...region,
                processedData: processed
            };
        });
        
        coastalRegions = processedData;
        updateRegionLabels();
        console.log("Loaded coastal data:", coastalRegions);
        
        // Update region markers with real data
        addRegionMarkers();
        return coastalRegions;
    } catch (error) {
        coastalRegions = [
            { name: "Pacific Coast", baseTemp: 18, info: "Pacific Coast warming trends.", markerPos: { x: -300, y: -140 } },
            { name: "Atlantic Coast", baseTemp: 16, info: "Atlantic Coast sea level rise.", markerPos: { x: 270, y: -60 } },
            { name: "Gulf Coast", baseTemp: 22, info: "Gulf Coast fastest warming.", markerPos: { x: 100, y: 90 } },
            { name: "Mediterranean Climate", baseTemp: 19, info: "Mediterranean dry heat.", markerPos: { x: -270, y: 40 } },
            { name: "Hawaiian Coast", baseTemp: 25, info: "Hawaii coral bleaching.", markerPos: { x: -150, y: 170 } }
        ];
        addRegionMarkers();
        updateRegionLabels();
        return coastalRegions;
    }
}

function processTemperatureData(region) {
    const timeArr = region.time || [], tempArr = region.temperature_series || [];
    if (!timeArr.length) return generateMockTemperatureData(region.name);
    const tempsCelsius = tempArr.map(t => t - 273.15);
    const baseline = tempsCelsius.slice(0, 30).reduce((a, b) => a + b, 0) / 30;
    const anomalies = timeArr.map((year, i) => ({ year, anomaly: tempsCelsius[i] - baseline, actualTemp: tempsCelsius[i] }));
    const historical = anomalies.filter(d => d.year <= 2024);
    const future = generateFutureProjections(historical, baseline);
    return { baseline, historical, future, allData: [...historical, ...future],
        currentAnomaly: historical[historical.length - 1]?.anomaly || 0,
        futureAnomaly2100: future[future.length - 1]?.anomaly || 0 };
}

function generateFutureProjections(historical, baseline) {
    if (historical.length < 10) return [];
    const n = historical.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    historical.forEach(d => { sumX += d.year; sumY += d.anomaly; sumXY += d.year * d.anomaly; sumXX += d.year * d.year; });
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const future = [];
    for (let year = historical[historical.length - 1].year + 1; year <= 2100; year += 5) {
        future.push({ year, anomaly: Math.max(0, slope * year + intercept), actualTemp: baseline + slope * year + intercept, isProjection: true });
    }
    return future;
}

function generateMockTemperatureData(regionName) {
    const configs = { "Pacific Coast": { baseline: 18, trend: 0.025 }, "Atlantic Coast": { baseline: 16, trend: 0.023 },
        "Gulf Coast": { baseline: 22, trend: 0.030 }, "Mediterranean Climate": { baseline: 19, trend: 0.028 }, "Hawaiian Coast": { baseline: 25, trend: 0.020 } };
    const config = configs[regionName] || { baseline: 20, trend: 0.025 };
    const historical = [], future = [];
    for (let year = 1950; year <= 2024; year++) {
        const anomaly = config.trend * (year - 1950) * (0.5 + Math.random());
        historical.push({ year, anomaly, actualTemp: config.baseline + anomaly });
    }
    const lastAnomaly = historical[historical.length - 1].anomaly;
    for (let year = 2025; year <= 2100; year += 5) {
        const anomaly = lastAnomaly + config.trend * 1.5 * (year - 2024);
        future.push({ year, anomaly, actualTemp: config.baseline + anomaly, isProjection: true });
    }
    return { baseline: config.baseline, historical, future, allData: [...historical, ...future], currentAnomaly: lastAnomaly, futureAnomaly2100: future[future.length - 1].anomaly };
}

function createTemperatureChart(region, regionData) {
    if (activeChart) { activeChart.remove(); activeChart = null; }
    const chartContainer = document.createElement('div');
    chartContainer.style.cssText = `position:fixed;top:100px;right:20px;width:500px;height:400px;background:rgba(10,20,40,0.97);border:2px solid rgba(255,150,100,0.7);border-radius:15px;padding:20px;z-index:10001;color:white;`;
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `position:absolute;top:10px;right:10px;background:rgba(255,100,100,0.3);border:2px solid #ff6b6b;color:#ff6b6b;border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:20px;`;
    closeBtn.onclick = () => { chartContainer.remove(); activeChart = null; };
    const title = document.createElement('h3');
    title.textContent = `${region.name} Temperature Trends`;
    title.style.cssText = `margin:0 0 20px 0;color:#ffa500;text-align:center;`;
    const chartCanvas = document.createElement('div');
    chartCanvas.style.cssText = `height:250px;`;
    chartContainer.appendChild(closeBtn);
    chartContainer.appendChild(title);
    chartContainer.appendChild(chartCanvas);
    document.body.appendChild(chartContainer);
    activeChart = chartContainer;
    // Simple chart drawing
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const w = 460 - margin.left - margin.right, h = 180 - margin.top - margin.bottom;
    const chartSvg = d3.select(chartCanvas).append('svg').attr('width', 460).attr('height', 180)
        .append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLinear().domain([1950, 2100]).range([0, w]);
    const y = d3.scaleLinear().domain([0, d3.max(regionData.allData, d => d.anomaly) * 1.1]).range([h, 0]);
    const line = d3.line().x(d => x(d.year)).y(d => y(d.anomaly)).curve(d3.curveMonotoneX);
    chartSvg.append('path').datum(regionData.historical).attr('d', line).attr('fill', 'none').attr('stroke', '#4a90e2').attr('stroke-width', 2);
    if (regionData.future.length) {
        chartSvg.append('path').datum([regionData.historical[regionData.historical.length-1], ...regionData.future])
            .attr('d', line).attr('fill', 'none').attr('stroke', '#e74c3c').attr('stroke-width', 2).attr('stroke-dasharray', '5,5');
    }
    chartSvg.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('d'))).selectAll('text').style('fill', '#fff');
    chartSvg.append('g').call(d3.axisLeft(y).ticks(4)).selectAll('text').style('fill', '#fff');
}

function addRegionMarkers() {
    regionMarkers.selectAll("*").remove();
    coastalRegions.forEach(region => {
        const g = regionMarkers.append("g").attr("transform", `translate(${region.markerPos.x}, ${region.markerPos.y})`).style("cursor", "pointer");
        g.append("circle").attr("class", "pulse-ring").attr("r", 18).attr("fill", "none").attr("stroke", "#ff6b35").attr("stroke-width", 2).attr("opacity", 0.5);
        g.append("circle").attr("class", "marker-dot").attr("r", 12).attr("fill", "#ff6b35").attr("stroke", "#fff").attr("stroke-width", 2);
        const labelWidth = region.name.length * 7 + 16;
        g.append("rect").attr("x", -labelWidth/2).attr("y", -38).attr("width", labelWidth).attr("height", 22).attr("rx", 5).attr("fill", "rgba(0,0,0,0.85)");
        g.append("text").attr("y", -22).attr("text-anchor", "middle").attr("fill", "#fff").attr("font-size", "12px").attr("font-weight", "bold").text(region.name);
        g.on("click", function(event) {
            event.stopPropagation();
            infoTitle.text(`${region.name} — Baseline: ${region.baseTemp || 20}°C`);
            infoText.text(region.info || "Climate data for this region.");
            infoPanel.transition().duration(400).style("opacity", 1);
            if (region.processedData) createTemperatureChart(region, region.processedData);
            else { region.processedData = generateMockTemperatureData(region.name); createTemperatureChart(region, region.processedData); }
        });
        g.on("mouseenter", function() {
            d3.select(this).select(".marker-dot").transition().duration(200).attr("r", 16).attr("fill", "#ffcc00");
        });
        g.on("mouseleave", function() {
            d3.select(this).select(".marker-dot").transition().duration(200).attr("r", 12).attr("fill", "#ff6b35");
        });
    });
}

async function loadUSMap() {
    try {
        const response = await fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json');
        const us = await response.json();
        const states = topojson.feature(us, us.objects.states);
        const nationOutline = topojson.mesh(us, us.objects.states, (a, b) => a === b);
        const projection = d3.geoAlbersUsa().scale(900).translate([0, 0]);
        const path = d3.geoPath().projection(projection);
        const minimapProjection = d3.geoAlbersUsa().scale(150).translate([70, 50]);
        const minimapPath = d3.geoPath().projection(minimapProjection);
        const pacificStates = ["California", "Oregon", "Washington", "Alaska"];
        const atlanticStates = ["Maine", "New Hampshire", "Massachusetts", "Rhode Island", "Connecticut", "New York", "New Jersey", "Delaware", "Maryland", "Virginia", "North Carolina", "South Carolina", "Georgia", "Florida"];
        const gulfStates = ["Texas", "Louisiana", "Mississippi", "Alabama"];
        const stateNames = {"01":"Alabama","02":"Alaska","04":"Arizona","05":"Arkansas","06":"California","08":"Colorado","09":"Connecticut","10":"Delaware","12":"Florida","13":"Georgia","15":"Hawaii","16":"Idaho","17":"Illinois","18":"Indiana","19":"Iowa","20":"Kansas","21":"Kentucky","22":"Louisiana","23":"Maine","24":"Maryland","25":"Massachusetts","26":"Michigan","27":"Minnesota","28":"Mississippi","29":"Missouri","30":"Montana","31":"Nebraska","32":"Nevada","33":"New Hampshire","34":"New Jersey","35":"New Mexico","36":"New York","37":"North Carolina","38":"North Dakota","39":"Ohio","40":"Oklahoma","41":"Oregon","42":"Pennsylvania","44":"Rhode Island","45":"South Carolina","46":"South Dakota","47":"Tennessee","48":"Texas","49":"Utah","50":"Vermont","51":"Virginia","53":"Washington","54":"West Virginia","55":"Wisconsin","56":"Wyoming"};
        expandedMapContent.selectAll("path.state").data(states.features).enter().append("path").attr("d", path)
            .attr("fill", d => {
                const name = stateNames[d.id];
                if (pacificStates.includes(name)) return "rgba(255, 107, 53, 0.5)";
                if (atlanticStates.includes(name)) return "rgba(100, 200, 255, 0.5)";
                if (gulfStates.includes(name)) return "rgba(255, 200, 50, 0.5)";
                if (name === "Hawaii") return "rgba(78, 175, 88, 0.82)";
                return "rgba(100, 150, 200, 0.25)";
            }).attr("stroke", "rgba(150, 200, 255, 0.4)").attr("stroke-width", 0.5);
        expandedMapContent.append("path").datum(nationOutline).attr("d", path).attr("fill", "none").attr("stroke", "rgba(255, 150, 100, 0.8)").attr("stroke-width", 2);
        minimapContent.selectAll("path").data(states.features).enter().append("path").attr("d", minimapPath)
            .attr("fill", d => {
                const name = stateNames[d.id];
                if (pacificStates.includes(name)) return "rgba(255, 107, 53, 0.5)";
                if (atlanticStates.includes(name)) return "rgba(100, 200, 255, 0.5)";
                if (gulfStates.includes(name)) return "rgba(255, 200, 50, 0.5)";
                return "rgba(100, 150, 200, 0.3)";
            }).attr("stroke", "rgba(150, 200, 255, 0.3)").attr("stroke-width", 0.3);
        await loadCoastalData();
    } catch (error) { loadCoastalData(); }
}

const topojsonScript = document.createElement('script');
topojsonScript.src = 'https://cdn.jsdelivr.net/npm/topojson-client@3';
topojsonScript.onload = loadUSMap;
document.head.appendChild(topojsonScript);

// ==============================================
// NEW CROCKPOT DESIGN - Blue to Red, connected to base
// ==============================================

const defs = svg.append("defs");

// Dynamic gradient for pot body (blue to red based on temperature)
const potBodyGradient = defs.append("linearGradient").attr("id", "potBodyGradient").attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
potBodyGradient.append("stop").attr("offset", "0%").attr("stop-color", "#5a9fd4").attr("class", "pot-color-top");
potBodyGradient.append("stop").attr("offset", "50%").attr("stop-color", "#4a8bc4").attr("class", "pot-color-mid");
potBodyGradient.append("stop").attr("offset", "100%").attr("stop-color", "#3a7bb4").attr("class", "pot-color-bottom");

// Glass lid gradient
const lidGradient = defs.append("radialGradient").attr("id", "lidGradient").attr("cx", "50%").attr("cy", "30%").attr("r", "70%");
lidGradient.append("stop").attr("offset", "0%").attr("stop-color", "rgba(180, 210, 240, 0.5)");
lidGradient.append("stop").attr("offset", "50%").attr("stop-color", "rgba(140, 180, 220, 0.3)");
lidGradient.append("stop").attr("offset", "100%").attr("stop-color", "rgba(100, 150, 200, 0.4)");

// Heat glow gradient
const heatGlowGradient = defs.append("radialGradient").attr("id", "heatGlowGradient").attr("cx", "50%").attr("cy", "50%").attr("r", "50%");
heatGlowGradient.append("stop").attr("offset", "0%").attr("stop-color", "rgba(255, 100, 50, 0.8)").attr("class", "glow-inner");
heatGlowGradient.append("stop").attr("offset", "100%").attr("stop-color", "rgba(255, 50, 0, 0)");

// === BASE UNIT (Climate Cooker) - Connected to pot ===
potGroup.append("rect").attr("x", -140).attr("y", 75).attr("width", 280).attr("height", 85).attr("rx", 8)
    .attr("fill", "#1a1a1a").attr("stroke", "#333").attr("stroke-width", 2);

// Control panel
potGroup.append("rect").attr("x", -50).attr("y", 100).attr("width", 100).attr("height", 45).attr("rx", 5)
    .attr("fill", "#222").attr("stroke", "#444").attr("stroke-width", 1);

// Temperature dial
const dialGroup = potGroup.append("g").attr("transform", "translate(-15, 122)");
dialGroup.append("circle").attr("r", 18).attr("fill", "#333").attr("stroke", "#555").attr("stroke-width", 2);
dialGroup.append("circle").attr("r", 12).attr("fill", "#222");
const dialIndicator = dialGroup.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", -10)
    .attr("stroke", "#ff6b35").attr("stroke-width", 3).attr("stroke-linecap", "round");

// Power light
const powerLight = potGroup.append("circle").attr("cx", 30).attr("cy", 122).attr("r", 8).attr("fill", "#00ff00");

// Label
potGroup.append("text").attr("x", 0).attr("y", 152).attr("text-anchor", "middle")
    .attr("fill", "#555").attr("font-size", "11px").text("CLIMATE COOKER");

// === HEAT GLOW (on base, under pot) ===
const heatGlowEllipse = potGroup.append("ellipse").attr("cx", 0).attr("cy", 72).attr("rx", 100).attr("ry", 12)
    .attr("fill", "url(#heatGlowGradient)").attr("opacity", 0).attr("class", "heat-glow");

// === CERAMIC POT BODY - Sits directly on base ===
const potBody = potGroup.append("path")
    .attr("d", "M -120 75 L -120 -25 Q -120 -65 -80 -65 L 80 -65 Q 120 -65 120 -25 L 120 75 Z")
    .attr("fill", "url(#potBodyGradient)").attr("stroke", "#2a5a8a").attr("stroke-width", 3).attr("class", "pot-body");

// Pot highlight
potGroup.append("path").attr("d", "M -115 70 L -115 -20 Q -115 -55 -85 -60 L -75 -60 Q -105 -55 -105 -20 L -105 65 Z")
    .attr("fill", "rgba(255,255,255,0.15)");

// Decorative lines
potGroup.append("line").attr("x1", -115).attr("y1", -15).attr("x2", 115).attr("y2", -15)
    .attr("stroke", "rgba(255,255,255,0.2)").attr("stroke-width", 2);
potGroup.append("line").attr("x1", -115).attr("y1", 15).attr("x2", 115).attr("y2", 15)
    .attr("stroke", "rgba(255,255,255,0.15)").attr("stroke-width", 2);

// === SIDE HANDLES ===
// Left handle
potGroup.append("path").attr("d", "M -120 -15 Q -160 -15 -160 15 Q -160 45 -120 45")
    .attr("fill", "none").attr("stroke", "#333").attr("stroke-width", 14).attr("stroke-linecap", "round");
potGroup.append("path").attr("d", "M -120 -15 Q -155 -15 -155 15 Q -155 45 -120 45")
    .attr("fill", "none").attr("stroke", "#444").attr("stroke-width", 8).attr("stroke-linecap", "round");
// Right handle
potGroup.append("path").attr("d", "M 120 -15 Q 160 -15 160 15 Q 160 45 120 45")
    .attr("fill", "none").attr("stroke", "#333").attr("stroke-width", 14).attr("stroke-linecap", "round");
potGroup.append("path").attr("d", "M 120 -15 Q 155 -15 155 15 Q 155 45 120 45")
    .attr("fill", "none").attr("stroke", "#444").attr("stroke-width", 8).attr("stroke-linecap", "round");

// === LID - Close to pot ===
const lidGroup = potGroup.append("g").attr("class", "lid-group");

// Lid rim sits on pot
lidGroup.append("ellipse").attr("cx", 0).attr("cy", -65).attr("rx", 125).attr("ry", 10)
    .attr("fill", "#555").attr("stroke", "#666").attr("stroke-width", 2);

// Glass dome - close to pot
lidGroup.append("path")
    .attr("d", "M -120 -68 Q -125 -100 -90 -112 Q 0 -130 90 -112 Q 125 -100 120 -68 Q 100 -65 0 -63 Q -100 -65 -120 -68 Z")
    .attr("fill", "url(#lidGradient)").attr("stroke", "rgba(150, 180, 200, 0.5)").attr("stroke-width", 2);

// Lid reflection
lidGroup.append("path").attr("d", "M -80 -85 Q -40 -105 30 -100 Q 50 -95 40 -88 Q -10 -92 -60 -82 Z")
    .attr("fill", "rgba(255,255,255,0.3)");

// Lid handle
lidGroup.append("ellipse").attr("cx", 0).attr("cy", -115).attr("rx", 18).attr("ry", 7).attr("fill", "#333").attr("stroke", "#444").attr("stroke-width", 2);
lidGroup.append("path").attr("d", "M -10 -115 Q 0 -128 10 -115").attr("fill", "none").attr("stroke", "#222").attr("stroke-width", 7).attr("stroke-linecap", "round");

// === BUBBLES GROUP ===
const bubblesGroup = potGroup.append("g").attr("class", "bubbles-group");

// === STEAM GROUP ===
const steamGroup = potGroup.append("g").attr("class", "steam-group");
for (let i = 0; i < 8; i++) {
    steamGroup.append("ellipse").attr("class", "steam-particle")
        .attr("cx", -40 + Math.random() * 80).attr("cy", -120)
        .attr("rx", 5 + Math.random() * 8).attr("ry", 4 + Math.random() * 6)
        .attr("fill", "rgba(255,255,255,0.4)").attr("opacity", 0);
}

// Region labels
const regionsGroup = mainGroup.append("g");
const defaultRegions = [
    { name: "Mediterranean Climate", angle: -Math.PI * 0.75 },
    { name: "Pacific Coast", angle: -Math.PI * 0.25 },
    { name: "Gulf Coast", angle: Math.PI * 0.25 },
    { name: "Atlantic Coast", angle: Math.PI * 0.75 }
];
defaultRegions.forEach(region => {
    const distance = 280;
    const x = width/2 + Math.cos(region.angle) * distance;
    const y = height/2 + Math.sin(region.angle) * distance;
    regionsGroup.append("line").attr("x1", x).attr("y1", y)
        .attr("x2", width/2 + Math.cos(region.angle) * 140).attr("y2", height/2 + Math.sin(region.angle) * 60)
        .attr("stroke", "#666").attr("stroke-width", 2).attr("stroke-dasharray", "5,5").attr("opacity", 0.5);
    regionsGroup.append("text").attr("x", x).attr("y", y).attr("text-anchor", "middle")
        .attr("fill", "#fff").attr("font-size", "14px").text(region.name);
});

// Update region labels when data is loaded
// Update region labels when data is loaded
// Update region labels when data is loaded
function updateRegionLabels() {
    regionsGroup.selectAll("*").remove();
    
    coastalRegions.forEach((region, i) => {
        const angle = (i * Math.PI / 2.5) - Math.PI / 3;
        const startDistance = 400;
        const startX = width/2 + Math.cos(angle) * startDistance;
        const startY = height/2 + Math.sin(angle) * startDistance - 300; // Start above and outside
        
        // Final position INSIDE the pot (much closer to center)
        const potRadius = 100; // Inside the pot
        const endX = width/2 + Math.cos(angle) * potRadius;
        const endY = height/2 + Math.sin(angle) * potRadius * 0.5; // Flatten for pot perspective

        // Create a container group for the label to allow rotation
        const labelGroup = regionsGroup.append("g")
            .attr("class", `region-label-group-${i}`)
            .attr("transform", `translate(${startX}, ${startY})`);

        // Add a glowing background circle
        labelGroup.append("circle")
            .attr("class", `region-glow-${i}`)
            .attr("r", 20)
            .attr("fill", "rgba(255, 107, 53, 0.4)")
            .attr("stroke", "rgba(255, 200, 100, 0.6)")
            .attr("stroke-width", 2)
            .attr("opacity", 0);

        // Region label with drop animation
        const label = labelGroup.append("text")
            .attr("class", `region-label-${i}`)
            .attr("x", 0)
            .attr("y", 5)
            .attr("text-anchor", "middle")
            .attr("fill", "#fff")
            .attr("font-size", "13px")
            .attr("font-weight", "bold")
            .text(region.name)
            .style("opacity", 0);

        // Drop animation - ingredients falling INTO the pot
        labelGroup
            .transition()
            .delay(i * 600)
            .duration(1800)
            .attr("transform", `translate(${endX}, ${endY})`)
            .ease(d3.easeBounceOut)
            .on("start", function() {
                // Fade in the label as it falls
                label.transition()
                    .duration(400)
                    .style("opacity", 1);
                    
                // Show glow during fall
                d3.select(`.region-glow-${i}`)
                    .transition()
                    .duration(400)
                    .attr("opacity", 0.8);
            })
            .on("end", function() {
                // Create splash effect when hitting the "water"
                createSplashEffect(endX, endY, i);
                
                // Pulse glow on impact
                d3.select(`.region-glow-${i}`)
                    .transition()
                    .duration(300)
                    .attr("opacity", 1)
                    .attr("r", 30)
                    .transition()
                    .duration(500)
                    .attr("opacity", 0.6)
                    .attr("r", 20);
            });
    });
}
// Create splash effect when labels "drop" into pot
// Create splash effect when labels "drop" into pot
function createSplashEffect(x, y, index) {
    const splashGroup = regionsGroup.append("g")
        .attr("class", `splash-${index}`)
        .attr("transform", `translate(${x}, ${y})`);
    
    // Create multiple splash particles
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const distance = 20 + Math.random() * 30;
        
        splashGroup.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 4 + Math.random() * 3)
            .attr("fill", "#4a90e2")
            .attr("opacity", 0.9)
            .transition()
            .duration(700)
            .attr("cx", Math.cos(angle) * distance)
            .attr("cy", Math.sin(angle) * distance * 0.6)
            .attr("r", 1)
            .attr("opacity", 0)
            .remove();
    }
    
    // Add ripple effect
    splashGroup.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 10)
        .attr("fill", "none")
        .attr("stroke", "#4a90e2")
        .attr("stroke-width", 3)
        .attr("opacity", 0.8)
        .transition()
        .duration(800)
        .attr("r", 40)
        .attr("stroke-width", 1)
        .attr("opacity", 0)
        .remove();
    
    // Remove splash group after animation
    setTimeout(() => splashGroup.remove(), 900);
}
// Temperature label
const tempLabel = potGroup.append("text").attr("x", 0).attr("y", -145).attr("text-anchor", "middle")
    .attr("fill", "#fff").attr("font-size", "32px").attr("font-weight", "bold")
    .style("text-shadow", "0 2px 10px rgba(0,0,0,0.5)");

// Toggle map expansion
function toggleMapExpansion() {
    isMapExpanded = !isMapExpanded;
    if (isMapExpanded) {
        potGroup.transition().duration(600).attr("transform", `translate(${width / 4}, ${height / 2})`);
        regionsGroup.transition().duration(400).style("opacity", 0);
        minimapGroup.transition().duration(400).style("opacity", 0).style("pointer-events", "none");
        expandedMapGroup.transition().duration(600).style("opacity", 1).style("pointer-events", "all");
        infoPanel.style("opacity", 0);
        if (activeChart) { activeChart.remove(); activeChart = null; }
    } else {
        potGroup.transition().duration(600).attr("transform", `translate(${width/2}, ${height/2})`);
        regionsGroup.transition().duration(600).delay(200).style("opacity", 1);
        minimapGroup.transition().duration(400).delay(400).style("opacity", 1).style("pointer-events", "all");
        expandedMapGroup.transition().duration(600).style("opacity", 0).style("pointer-events", "none");
        if (activeChart) { activeChart.remove(); activeChart = null; }
    }
}

minimapGroup.on("click", toggleMapExpansion);
closeButton.on("click", function(event) { event.stopPropagation(); toggleMapExpansion(); });

function pulseMarkers() {
    regionMarkers.selectAll(".pulse-ring").transition().duration(1000).attr("r", 24).attr("opacity", 0.2)
        .transition().duration(1000).attr("r", 18).attr("opacity", 0.5).on("end", pulseMarkers);
}
setTimeout(pulseMarkers, 1000);

let bubbleInterval = null, steamInterval = null, lidShakeInterval = null;

function updateVisualization(step) {
    currentStep = step;
    const projection = projections[step];
    const temp = projection.tempIncrease;
    const intensity = step / 4;
    
    // Color palette: blue to red
    const potColors = [
        { top: "#5a9fd4", mid: "#4a8bc4", bottom: "#3a7bb4" },  // Blue (cool)
        { top: "#6aafb4", mid: "#5a9fa4", bottom: "#4a8f94" },  // Teal
        { top: "#d4a55a", mid: "#c4954a", bottom: "#b4853a" },  // Orange
        { top: "#d47a5a", mid: "#c46a4a", bottom: "#b45a3a" },  // Orange-red
        { top: "#d45a5a", mid: "#c44a4a", bottom: "#b43a3a" }   // Red (hot)
    ];
    
    const colors = potColors[step];
    d3.select(".pot-color-top").transition().duration(800).attr("stop-color", colors.top);
    d3.select(".pot-color-mid").transition().duration(800).attr("stop-color", colors.mid);
    d3.select(".pot-color-bottom").transition().duration(800).attr("stop-color", colors.bottom);
    
    // Heat glow
    d3.select(".heat-glow").transition().duration(800).attr("opacity", intensity * 0.8);
    
    // Power light
    const lightColors = ["#00ff00", "#7fff00", "#ffff00", "#ff8800", "#ff0000"];
    powerLight.transition().duration(400).attr("fill", lightColors[step]);
    
    // Dial rotation
    dialIndicator.transition().duration(600).attr("transform", `rotate(${-90 + step * 45})`);
    
    // Temperature label
    tempLabel.text(`+${temp.toFixed(1)}°C`);
    
    // Clear animations
    if (bubbleInterval) { clearInterval(bubbleInterval); bubbleInterval = null; }
    if (steamInterval) { clearInterval(steamInterval); steamInterval = null; }
    if (lidShakeInterval) { clearInterval(lidShakeInterval); lidShakeInterval = null; lidGroup.attr("transform", "translate(0, 0)"); }
    bubblesGroup.selectAll("*").remove();
    
    function createBubble() {
        bubblesGroup.append("circle").attr("cx", -80 + Math.random() * 160).attr("cy", 50)
            .attr("r", 2 + Math.random() * 4).attr("fill", "rgba(255, 255, 255, 0.6)")
            .transition().duration(800 + Math.random() * 400).attr("cy", -55).attr("opacity", 0)
            .on("end", function() { d3.select(this).remove(); });
    }
    
    function animateSteam() {
        steamGroup.selectAll(".steam-particle").each(function() {
            const particle = d3.select(this);
            const startX = -30 + Math.random() * 60;
            particle.attr("cx", startX).attr("cy", -120).attr("opacity", 0)
                .transition().delay(Math.random() * 300).duration(1500)
                .attr("cy", -180 - Math.random() * 40).attr("cx", startX + (Math.random() - 0.5) * 30)
                .attr("opacity", 0.4 * intensity).transition().duration(400).attr("opacity", 0);
        });
    }
    
    if (step >= 1) {
        const bubbleRate = [0, 600, 300, 150, 60][step];
        const bubblesPerBurst = [0, 2, 4, 8, 12][step];
        bubbleInterval = setInterval(() => { for (let i = 0; i < bubblesPerBurst; i++) createBubble(); }, bubbleRate);
    }
    
    if (step >= 2) {
        animateSteam();
        steamInterval = setInterval(animateSteam, [0, 0, 1500, 1000, 500][step]);
    }
    
    if (step === 4) {
        lidShakeInterval = setInterval(() => {
            lidGroup.transition().duration(40)
                .attr("transform", `translate(${(Math.random() - 0.5) * 4}, ${(Math.random() - 0.5) * 2})`)
                .transition().duration(40).attr("transform", "translate(0, 0)");
        }, 120);
    }
    
    const knobMarker = d3.select(".knob-marker");
    if (!knobMarker.empty()) knobMarker.style("transform", `translateX(-50%) rotate(${(step / 4) * 180}deg)`);
}

// Scrollama setup
const scroller = scrollama();
scroller.setup({ step: ".step", offset: 0.5, debug: false })
    .onStepEnter(response => updateVisualization(+response.element.dataset.step));

updateVisualization(0);

// Footer flames
const footer = document.getElementById('footer');
for (let i = 0; i < 20; i++) {
    const flame = document.createElement('div');
    flame.className = 'flame';
    flame.style.left = `${Math.random() * 100}%`;
    flame.style.animationDelay = `${Math.random() * 1.5}s`;
    flame.style.animationDuration = `${1 + Math.random()}s`;
    footer.appendChild(flame);
}

window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    svg.attr("width", width).attr("height", height);
    minimapCollapsedX = width - 180;
    minimapCollapsedY = height - 160;
    positionMinimap(minimapCollapsedX, minimapCollapsedY, 0);
    scroller.resize();
});

// Temperature prediction feature
document.addEventListener('DOMContentLoaded', function() {
    const slider = document.getElementById('temperature-slider');
    const predictionValue = document.getElementById('prediction-value');
    const submitBtn = document.getElementById('submit-prediction');
    const tryAgainBtn = document.getElementById('try-again');
    const resultsSection = document.getElementById('prediction-results');
    const userPredictionDisplay = document.getElementById('user-prediction');
    const actualProjectionDisplay = document.getElementById('actual-projection');
    const temperatureDifference = document.getElementById('temperature-difference');
    const resultMessage = document.getElementById('result-message');
    const accuracyFeedback = document.getElementById('accuracy-feedback');
    const feedbackText = document.getElementById('slider-feedback-text');
    
    const ACTUAL_PROJECTION = 4.5;
    
    function updateSliderFeedback(value) {
        if (!feedbackText) return;
        if (value < 1.6) feedbackText.textContent = "Optimistic - below Paris Agreement targets";
        else if (value < 2.6) feedbackText.textContent = "Paris Agreement goal range";
        else if (value < 3.6) feedbackText.textContent = "Current policy trajectory";
        else if (value < 4.6) feedbackText.textContent = "Significant coastal impacts expected";
        else feedbackText.textContent = "Severe coastal disruption";
    }
    
    if (slider && predictionValue) {
        slider.addEventListener('input', function() {
            const value = parseFloat(this.value);
            predictionValue.textContent = `+${value.toFixed(1)}°C`;
            updateSliderFeedback(value);
        });
        updateSliderFeedback(parseFloat(slider.value));
    }
    
    function updateImpactBars(userTemp, actualTemp) {
        const userBar = document.querySelector('.user-prediction .impact-bar');
        const actualBar = document.querySelector('.actual-projection .impact-bar');
        if (userBar) userBar.style.width = `${Math.min(100, (userTemp / 7) * 100)}%`;
        if (actualBar) actualBar.style.width = `${Math.min(100, (actualTemp / 7) * 100)}%`;
    }
    
    function showAccuracyFeedback(userPrediction) {
        const difference = ACTUAL_PROJECTION - userPrediction;
        const absDifference = Math.abs(difference);
        
        if (userPredictionDisplay) userPredictionDisplay.textContent = userPrediction.toFixed(1);
        if (actualProjectionDisplay) actualProjectionDisplay.textContent = ACTUAL_PROJECTION.toFixed(1);
        if (temperatureDifference) temperatureDifference.textContent = `${difference >= 0 ? '+' : ''}${difference.toFixed(1)}°C`;
        
        updateImpactBars(userPrediction, ACTUAL_PROJECTION);
        
        let message, details;
        if (absDifference <= 0.3) { message = "🎯 Excellent!"; details = "Remarkably close to projections."; }
        else if (absDifference <= 0.8) { message = "📊 Good estimate!"; details = `Off by ${absDifference.toFixed(1)}°C.`; }
        else if (absDifference <= 1.5) { message = "📈 In the right range"; details = `${absDifference.toFixed(1)}°C from projection.`; }
        else if (absDifference <= 2.5) { message = "🔽 Significant difference"; details = `Projections show ${difference > 0 ? "higher" : "lower"} warming.`; }
        else { message = "⚠️ Large discrepancy"; details = `${absDifference.toFixed(1)}°C difference.`; }
        
        if (resultMessage) resultMessage.textContent = message;
        if (accuracyFeedback) accuracyFeedback.textContent = details;
        
        if (resultsSection) {
            resultsSection.style.display = 'block';
            resultsSection.style.opacity = '0';
            resultsSection.style.transition = 'opacity 0.5s ease-in-out';
            setTimeout(() => { resultsSection.style.opacity = '1'; }, 50);
        }
    }
    
    if (submitBtn) {
        submitBtn.addEventListener('click', function() {
            if (slider) showAccuracyFeedback(parseFloat(slider.value));
        });
    }
    
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', function() {
            if (slider) slider.value = 2.5;
            if (predictionValue) predictionValue.textContent = '+2.5°C';
            if (feedbackText) feedbackText.textContent = "Moderate increase projected by many climate models";
            if (resultsSection) {
                resultsSection.style.opacity = '0';
                setTimeout(() => { resultsSection.style.display = 'none'; }, 500);
            }
        });
    }
    
    const shareBtn = document.getElementById('share-results');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            if (slider) {
                const shareText = `I predicted a ${parseFloat(slider.value).toFixed(1)}°C rise by 2100. Actual projection: 4.5°C.`;
                if (navigator.share) navigator.share({ title: 'Climate Prediction', text: shareText, url: window.location.href });
                else navigator.clipboard.writeText(shareText).then(() => alert('Copied to clipboard!'));
            }
        });
    }
    
    setTimeout(() => { if (slider) updateImpactBars(parseFloat(slider.value), ACTUAL_PROJECTION); }, 500);
});

// Chart styles
const chartStyle = document.createElement('style');
chartStyle.textContent = `.grid line { stroke: rgba(255,255,255,0.1); } .grid path { stroke-width: 0; }`;
document.head.appendChild(chartStyle);