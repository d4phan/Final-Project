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

// Coastal regions data (will be replaced with real data)
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

let minimapExpandedX = width / 2 + 250;
let minimapExpandedY = height / 2 - 60;

// State management
let isMapExpanded = false;
let currentStep = 0;
let usMapData = null;
let processedRegionData = new Map(); // Store processed temperature data
let activeChart = null; // Track active chart

// Create main groups
const mainGroup = svg.append("g").attr("class", "main-group");
const potGroup = mainGroup.append("g")
    .attr("class", "pot-group")
    .attr("transform", `translate(${width/2}, ${height/2})`);

// Create minimap group
const minimapGroup = svg.append("g")
    .attr("class", "minimap-group")
    .style("cursor", "pointer");

function positionMinimap(x, y, duration = 0) {
    minimapGroup.transition()
        .duration(duration)
        .attr("transform", `translate(${x}, ${y})`);
}
positionMinimap(minimapCollapsedX, minimapCollapsedY);

// Minimap background
minimapGroup.append("rect")
    .attr("class", "minimap-bg")
    .attr("width", 150)
    .attr("height", 120)
    .attr("rx", 8)
    .attr("fill", "rgba(0, 0, 0, 0.6)")
    .attr("stroke", "rgba(255, 150, 100, 0.5)")
    .attr("stroke-width", 2);

// Minimap label
minimapGroup.append("text")
    .attr("class", "minimap-label")
    .attr("x", 75)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .attr("fill", "rgba(255, 150, 100, 0.8)")
    .attr("font-size", "12px")
    .text("Click to view map");

// Minimap content group for the small map
const minimapContent = minimapGroup.append("g")
    .attr("class", "minimap-content")
    .attr("transform", "translate(5, 5)");

// Create expanded map group (initially hidden)
const expandedMapGroup = svg.append("g")
    .attr("class", "expanded-map-group")
    .attr("transform", `translate(${width * 0.65}, ${height / 2}) scale(0.75)`)
    .style("opacity", 0)
    .style("pointer-events", "none");

// Layout dimensions
const mapBoxWidth = 820;
const mapBoxHeight = 520;
const legendBoxWidth = 180;
const legendBoxHeight = mapBoxHeight;
const infoBoxWidth = mapBoxWidth + legendBoxWidth + 15;
const infoBoxHeight = 80;
const gap = 15;

// Total container offset to center everything
const totalWidth = mapBoxWidth + gap + legendBoxWidth;
const offsetX = -totalWidth / 2;

// Map box background
expandedMapGroup.append("rect")
    .attr("x", offsetX)
    .attr("y", -mapBoxHeight/2 - 40)
    .attr("width", mapBoxWidth)
    .attr("height", mapBoxHeight)
    .attr("rx", 15)
    .attr("fill", "rgba(10, 20, 40, 0.95)")
    .attr("stroke", "rgba(255, 150, 100, 0.6)")
    .attr("stroke-width", 3);

// Map title
expandedMapGroup.append("text")
    .attr("x", offsetX + mapBoxWidth/2)
    .attr("y", -mapBoxHeight/2 - 10)
    .attr("text-anchor", "middle")
    .attr("fill", "#ffa500")
    .attr("font-size", "26px")
    .attr("font-family", "'Playfair Display', serif")
    .text("Coastal Regions at Risk in the U.S.A");

// Close button
const closeButton = expandedMapGroup.append("g")
    .attr("class", "close-button")
    .attr("transform", `translate(${offsetX + mapBoxWidth - 30}, ${-mapBoxHeight/2 - 10})`)
    .style("cursor", "pointer");

closeButton.append("circle")
    .attr("r", 16)
    .attr("fill", "rgba(255, 100, 100, 0.3)")
    .attr("stroke", "#ff6b6b")
    .attr("stroke-width", 2);

closeButton.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("fill", "#ff6b6b")
    .attr("font-size", "20px")
    .attr("font-weight", "bold")
    .text("x");

// Legend box
const legendBox = expandedMapGroup.append("g")
    .attr("class", "legend-box")
    .attr("transform", `translate(${offsetX + mapBoxWidth + gap}, ${-mapBoxHeight/2 - 40})`);

legendBox.append("rect")
    .attr("width", legendBoxWidth)
    .attr("height", legendBoxHeight)
    .attr("rx", 15)
    .attr("fill", "rgba(10, 20, 40, 0.95)")
    .attr("stroke", "rgba(255, 150, 100, 0.6)")
    .attr("stroke-width", 3);

// Legend title
legendBox.append("text")
    .attr("x", legendBoxWidth/2)
    .attr("y", 35)
    .attr("text-anchor", "middle")
    .attr("fill", "#ffa500")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text("Legend");

// Legend items
const legendItems = [
    { color: "rgba(255, 107, 53, 0.7)", label: "Pacific Coast" },
    { color: "rgba(100, 200, 255, 0.7)", label: "Atlantic Coast" },
    { color: "rgba(255, 200, 50, 0.7)", label: "Gulf Coast" },
    { color: "rgba(78, 175, 88, 0.82)", label: "Hawaiian Coast" },
    { color: "rgba(100, 150, 200, 0.4)", label: "Other States" }
];

const legendStartY = 80;
const legendItemSpacing = 55;

legendItems.forEach((item, i) => {
    const g = legendBox.append("g")
        .attr("transform", `translate(${legendBoxWidth/2}, ${legendStartY + i * legendItemSpacing})`);
    
    g.append("rect")
        .attr("x", -70)
        .attr("y", -12)
        .attr("width", 24)
        .attr("height", 24)
        .attr("rx", 4)
        .attr("fill", item.color)
        .attr("stroke", "rgba(255, 255, 255, 0.6)")
        .attr("stroke-width", 1);
    
    g.append("text")
        .attr("x", -38)
        .attr("y", 5)
        .attr("fill", "rgba(255, 255, 255, 0.9)")
        .attr("font-size", "13px")
        .text(item.label);
});

// Instructions text in legend
legendBox.append("text")
    .attr("x", legendBoxWidth/2)
    .attr("y", legendBoxHeight - 70)
    .attr("text-anchor", "middle")
    .attr("fill", "rgba(255, 150, 100, 0.7)")
    .attr("font-size", "11px")
    .text("Click on a marker");

legendBox.append("text")
    .attr("x", legendBoxWidth/2)
    .attr("y", legendBoxHeight - 55)
    .attr("text-anchor", "middle")
    .attr("fill", "rgba(255, 150, 100, 0.7)")
    .attr("font-size", "11px")
    .text("to learn more");

// Group for the actual map content
const expandedMapContent = expandedMapGroup.append("g")
    .attr("class", "expanded-map-content")
    .attr("transform", `translate(${offsetX + mapBoxWidth/2}, 0)`);

// Group for region markers
const regionMarkers = expandedMapGroup.append("g")
    .attr("class", "region-markers")
    .attr("transform", `translate(${offsetX + mapBoxWidth/2}, 0)`);

// Info panel - BELOW the map (hidden initially)
const infoPanelY = mapBoxHeight/2 - 40 + gap;
const infoPanel = expandedMapGroup.append("g")
    .attr("class", "info-panel")
    .attr("transform", `translate(${offsetX + infoBoxWidth/2}, ${infoPanelY})`)
    .style("opacity", 0);

infoPanel.append("rect")
    .attr("x", -infoBoxWidth/2)
    .attr("y", 0)
    .attr("width", infoBoxWidth)
    .attr("height", infoBoxHeight)
    .attr("rx", 12)
    .attr("fill", "rgba(10, 20, 40, 0.95)")
    .attr("stroke", "rgba(255, 150, 100, 0.6)")
    .attr("stroke-width", 2);

const infoTitle = infoPanel.append("text")
    .attr("class", "info-title")
    .attr("x", 0)
    .attr("y", 28)
    .attr("text-anchor", "middle")
    .attr("fill", "#ffa500")
    .attr("font-size", "18px")
    .attr("font-weight", "bold");

const infoText = infoPanel.append("text")
    .attr("class", "info-text")
    .attr("x", 0)
    .attr("y", 52)
    .attr("text-anchor", "middle")
    .attr("fill", "rgba(255, 255, 255, 0.9)")
    .attr("font-size", "14px");

// ==============================================
// NEW: TEMPERATURE TREND CHART FUNCTIONS
// ==============================================

// Load and process real coastal data
async function loadCoastalData() {
    try {
        const response = await fetch('data/coastal_regions_real_data.json');
        const allData = await response.json();
        
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
        console.error("Error loading coastal data:", error);
        // Fallback to hardcoded data
        coastalRegions = [
            { 
                name: "Pacific Coast", 
                baseTemp: 18,
                info: "The Pacific Coast stretches from Alaska to California, experiencing significant warming trends. Rising ocean temperatures are affecting marine ecosystems and coastal communities.",
                states: ["California", "Oregon", "Washington", "Alaska"],
                markerPos: { x: -300, y: -140 }
            },
            { 
                name: "Atlantic Coast", 
                baseTemp: 16,
                info: "The Atlantic Coast from Maine to Florida faces increasing hurricane intensity and sea level rise. Coastal erosion threatens infrastructure and habitats.",
                states: ["Maine", "New Hampshire", "Massachusetts", "Rhode Island", "Connecticut", "New York", "New Jersey", "Delaware", "Maryland", "Virginia", "North Carolina", "South Carolina", "Georgia", "Florida"],
                markerPos: { x: 270, y: -60 }
            },
            { 
                name: "Gulf Coast", 
                baseTemp: 22,
                info: "The Gulf Coast experiences some of the fastest warming rates. Wetland loss, intensified storms, and heat waves pose major challenges to this region.",
                states: ["Texas", "Louisiana", "Mississippi", "Alabama", "Florida"],
                markerPos: { x: 100, y: 90 }
            },
            { 
                name: "Mediterranean Climate", 
                baseTemp: 19,
                info: "Mediterranean climate zones in California are shifting toward more extreme dry heat conditions, increasing wildfire risk and water scarcity.",
                states: ["California"],
                markerPos: { x: -270, y: 40 }
            },
            {
                name: "Hawaiian Coast",
                baseTemp: 25,
                info: "Hawaii's coastal regions are vulnerable to sea level rise and coral bleaching due to rising ocean temperatures, impacting tourism and local ecosystems.",
                states: ["Hawaii"],
                markerPos: { x: -150, y: 170 }
            }
        ];
        addRegionMarkers();
        updateRegionLabels();
        return coastalRegions;
    }
}

// Process temperature data for a region
function processTemperatureData(region) {
    const timeArr = region.time || [];
    const tempArr = region.temperature_series || [];
    
    if (!timeArr.length || !tempArr.length) {
        // Generate mock data if no real data
        return generateMockTemperatureData(region.name);
    }
    
    // Convert Kelvin to Celsius
    const tempsCelsius = tempArr.map(temp => temp - 273.15);
    
    // Calculate baseline (average of first 30 years)
    const baselineYears = Math.min(30, timeArr.length);
    const baseline = tempsCelsius.slice(0, baselineYears).reduce((a, b) => a + b, 0) / baselineYears;
    
    // Calculate anomalies
    const anomalies = timeArr.map((year, i) => ({
        year: year,
        anomaly: tempsCelsius[i] - baseline,
        actualTemp: tempsCelsius[i]
    }));
    
    // Separate historical and future data
    const historical = anomalies.filter(d => d.year <= 2024);
    const future = generateFutureProjections(historical, baseline);
    
    return {
        baseline: baseline,
        historical: historical,
        future: future,
        allData: [...historical, ...future],
        currentAnomaly: historical[historical.length - 1]?.anomaly || 0,
        futureAnomaly2100: future[future.length - 1]?.anomaly || 0
    };
}

// Generate future projections based on historical trend
function generateFutureProjections(historical, baseline) {
    if (historical.length < 10) return [];
    
    // Simple linear regression
    const n = historical.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    historical.forEach((d, i) => {
        sumX += d.year;
        sumY += d.anomaly;
        sumXY += d.year * d.anomaly;
        sumXX += d.year * d.year;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate projections to 2100
    const future = [];
    const lastYear = historical[historical.length - 1].year;
    
    for (let year = lastYear + 1; year <= 2100; year += 5) {
        const anomaly = slope * year + intercept;
        future.push({
            year: year,
            anomaly: Math.max(0, anomaly),
            actualTemp: baseline + anomaly,
            isProjection: true
        });
    }
    
    return future;
}

// Generate mock temperature data for demonstration
function generateMockTemperatureData(regionName) {
    const baseConfigs = {
        "Pacific Coast": { baseline: 18, trend: 0.025 },
        "Atlantic Coast": { baseline: 16, trend: 0.023 },
        "Gulf Coast": { baseline: 22, trend: 0.030 },
        "Mediterranean Climate": { baseline: 19, trend: 0.028 },
        "Hawaiian Coast": { baseline: 25, trend: 0.020 }
    };
    
    const config = baseConfigs[regionName] || { baseline: 20, trend: 0.025 };
    
    // Generate historical data (1950-2024)
    const historical = [];
    for (let year = 1950; year <= 2024; year++) {
        const yearsFromStart = year - 1950;
        // Add some randomness to the trend
        const randomFactor = 0.5 + Math.random();
        const anomaly = config.trend * yearsFromStart * randomFactor;
        historical.push({
            year: year,
            anomaly: anomaly,
            actualTemp: config.baseline + anomaly
        });
    }
    
    // Generate future projections
    const future = [];
    const lastAnomaly = historical[historical.length - 1].anomaly;
    const futureTrend = config.trend * 1.5; // Accelerated warming
    
    for (let year = 2025; year <= 2100; year += 5) {
        const yearsFromNow = year - 2024;
        const anomaly = lastAnomaly + (futureTrend * yearsFromNow);
        future.push({
            year: year,
            anomaly: anomaly,
            actualTemp: config.baseline + anomaly,
            isProjection: true
        });
    }
    
    return {
        baseline: config.baseline,
        historical: historical,
        future: future,
        allData: [...historical, ...future],
        currentAnomaly: lastAnomaly,
        futureAnomaly2100: future[future.length - 1].anomaly
    };
}

// Create temperature trend chart
function createTemperatureChart(region, regionData) {
    // Remove existing chart
    if (activeChart) {
        activeChart.remove();
        activeChart = null;
    }
    
    // Create chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'temperature-chart-container';
    chartContainer.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        width: 500px;
        height: 450px;
        background: rgba(10, 20, 40, 0.97);
        border: 2px solid rgba(255, 150, 100, 0.7);
        border-radius: 15px;
        padding: 20px;
        z-index: 10001;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7);
        color: white;
        font-family: 'Arial', sans-serif;
        backdrop-filter: blur(10px);
        overflow-y: auto;
        max-height: 80vh;
    `;
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(255, 100, 100, 0.3);
        border: 2px solid #ff6b6b;
        color: #ff6b6b;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        cursor: pointer;
        font-size: 20px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10002;
    `;
    closeBtn.onclick = () => {
        chartContainer.remove();
        activeChart = null;
    };
    
    // Chart title
    const title = document.createElement('h3');
    title.textContent = `${region.name} Temperature Trends`;
    title.style.cssText = `
        margin: 0 0 20px 0;
        color: #ffa500;
        font-family: 'Playfair Display', serif;
        font-size: 22px;
        text-align: center;
        padding-right: 30px;
    `;
    
    // Chart canvas
    const chartCanvas = document.createElement('div');
    chartCanvas.id = `chart-${region.name.replace(/\s+/g, '-')}`;
    chartCanvas.style.cssText = `
        height: 250px;
        margin-bottom: 20px;
    `;
    
    // Info section
    const infoSection = document.createElement('div');
    infoSection.style.cssText = `
        background: rgba(20, 30, 50, 0.8);
        padding: 15px;
        border-radius: 10px;
        margin-top: 10px;
        font-size: 14px;
        line-height: 1.5;
    `;
    
    // Assemble chart
    chartContainer.appendChild(closeBtn);
    chartContainer.appendChild(title);
    chartContainer.appendChild(chartCanvas);
    chartContainer.appendChild(infoSection);
    document.body.appendChild(chartContainer);
    
    activeChart = chartContainer;
    
    // Draw the chart
    drawChart(chartCanvas, region, regionData);
    
    // Update info section
    updateInfoSection(infoSection, region, regionData);
    
    return chartContainer;
}

// Draw D3 chart
function drawChart(container, region, regionData) {
    const margin = { top: 30, right: 40, bottom: 50, left: 60 };
    const width = 460 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;
    
    // Clear container
    container.innerHTML = '';
    
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Combine data
    const allData = regionData.allData;
    const historical = regionData.historical;
    const future = regionData.future;
    
    // Create scales
    const x = d3.scaleLinear()
        .domain([1950, 2100])
        .range([0, width]);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(allData, d => d.anomaly) * 1.1])
        .range([height, 0]);
    
    // Create line generator
    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.anomaly))
        .curve(d3.curveMonotoneX);
    
    // Add grid
    svg.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .ticks(6)
            .tickSize(-height)
            .tickFormat(''));
    
    svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y)
            .ticks(5)
            .tickSize(-width)
            .tickFormat(''));
    
    // Draw historical line
    svg.append('path')
        .datum(historical)
        .attr('class', 'temperature-line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', '#4a90e2')
        .attr('stroke-width', 3);
    
    // Draw projection line
    if (future.length > 0) {
        const projectionData = [historical[historical.length - 1], ...future];
        svg.append('path')
            .datum(projectionData)
            .attr('class', 'temperature-line projection')
            .attr('d', line)
            .attr('fill', 'none')
            .attr('stroke', '#e74c3c')
            .attr('stroke-width', 3)
            .attr('stroke-dasharray', '5,5');
    }
    
    // Add axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format('d')))
        .selectAll('text')
        .style('fill', 'rgba(255,255,255,0.8)')
        .style('font-size', '12px');
    
    svg.append('g')
        .call(d3.axisLeft(y).ticks(5))
        .selectAll('text')
        .style('fill', 'rgba(255,255,255,0.8)')
        .style('font-size', '12px');
    
    // Axis labels
    svg.append('text')
        .attr('transform', `translate(${width/2},${height + 40})`)
        .style('text-anchor', 'middle')
        .style('fill', 'rgba(255,255,255,0.8)')
        .style('font-size', '12px')
        .text('Year');
    
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 15)
        .attr('x', -height/2)
        .style('text-anchor', 'middle')
        .style('fill', 'rgba(255,255,255,0.8)')
        .style('font-size', '12px')
        .text('Temperature Anomaly (°C)');
    
    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 150}, 10)`);
    
    legend.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', '#4a90e2')
        .attr('stroke-width', 2);
    
    legend.append('text')
        .attr('x', 25)
        .attr('y', 4)
        .text('Historical (1950-2024)')
        .style('fill', 'rgba(255,255,255,0.8)')
        .style('font-size', '11px');
    
    legend.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 20)
        .attr('y2', 20)
        .attr('stroke', '#e74c3c')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
    
    legend.append('text')
        .attr('x', 25)
        .attr('y', 24)
        .text('Projection (2025-2100)')
        .style('fill', 'rgba(255,255,255,0.8)')
        .style('font-size', '11px');
    
    // Add current year marker
    const currentAnomaly = regionData.currentAnomaly;
    svg.append('circle')
        .attr('cx', x(2024))
        .attr('cy', y(currentAnomaly))
        .attr('r', 4)
        .attr('fill', '#ffcc00');
    
    svg.append('text')
        .attr('x', x(2024) + 10)
        .attr('y', y(currentAnomaly) - 10)
        .text(`2024: +${currentAnomaly.toFixed(1)}°C`)
        .style('fill', '#ffcc00')
        .style('font-size', '11px')
        .style('font-weight', 'bold');
    
    // Add 2100 projection marker
    const futureAnomaly = regionData.futureAnomaly2100;
    if (futureAnomaly) {
        svg.append('circle')
            .attr('cx', x(2100))
            .attr('cy', y(futureAnomaly))
            .attr('r', 4)
            .attr('fill', '#e74c3c');
        
        svg.append('text')
            .attr('x', x(2100) - 80)
            .attr('y', y(futureAnomaly) - 10)
            .text(`2100: +${futureAnomaly.toFixed(1)}°C`)
            .style('fill', '#e74c3c')
            .style('font-size', '11px')
            .style('font-weight', 'bold');
    }
}

// Update info section
function updateInfoSection(container, region, regionData) {
    const currentTemp = regionData.baseline + regionData.currentAnomaly;
    const futureTemp = regionData.baseline + regionData.futureAnomaly2100;
    const increase = futureTemp - currentTemp;
    
    const html = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div style="background: rgba(74, 144, 226, 0.2); padding: 10px; border-radius: 8px;">
                <div style="font-size: 12px; color: #7fb3d5;">Current Temp</div>
                <div style="font-size: 24px; color: white; font-weight: bold;">${currentTemp.toFixed(1)}°C</div>
            </div>
            <div style="background: rgba(231, 76, 60, 0.2); padding: 10px; border-radius: 8px;">
                <div style="font-size: 12px; color: #e74c3c;">Projected 2100</div>
                <div style="font-size: 24px; color: white; font-weight: bold;">${futureTemp.toFixed(1)}°C</div>
            </div>
        </div>
        <div style="background: rgba(255, 165, 0, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 15px;">
            <div style="font-size: 12px; color: #ffa500;">Projected Increase</div>
            <div style="font-size: 20px; color: white; font-weight: bold;">+${increase.toFixed(1)}°C</div>
        </div>
        <div style="font-size: 13px; line-height: 1.4;">
            <p><strong>Key Insights:</strong></p>
            <ul style="margin: 5px 0; padding-left: 20px;">
                <li>Baseline temperature: ${regionData.baseline.toFixed(1)}°C</li>
                <li>Current anomaly: +${regionData.currentAnomaly.toFixed(1)}°C</li>
                <li>Projected 2100 anomaly: +${regionData.futureAnomaly2100.toFixed(1)}°C</li>
                <li>Historical data points: ${regionData.historical.length}</li>
            </ul>
        </div>
    `;
    
    container.innerHTML = html;
}

// ==============================================
// MODIFIED REGION MARKER FUNCTIONS
// ==============================================

function addRegionMarkers() {
    // Clear existing markers
    regionMarkers.selectAll("*").remove();
    
    coastalRegions.forEach(region => {
        const markerGroup = regionMarkers.append("g")
            .attr("class", "region-marker")
            .attr("transform", `translate(${region.markerPos.x}, ${region.markerPos.y})`)
            .style("cursor", "pointer");
        
        // Add chart icon to marker
        markerGroup.append("path")
            .attr("class", "chart-icon")
            .attr("d", "M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z")
            .attr("transform", "translate(-6, -24) scale(0.8)")
            .attr("fill", "#ffcc00")
            .attr("opacity", 0)
            .style("pointer-events", "none");
        
        // Pulsing outer ring
        markerGroup.append("circle")
            .attr("class", "pulse-ring")
            .attr("r", 18)
            .attr("fill", "none")
            .attr("stroke", "#ff6b35")
            .attr("stroke-width", 2)
            .attr("opacity", 0.5);
        
        // Main marker
        markerGroup.append("circle")
            .attr("class", "marker-dot")
            .attr("r", 12)
            .attr("fill", "#ff6b35")
            .attr("stroke", "#fff")
            .attr("stroke-width", 2);
        
        // Label background
        const labelText = region.name;
        const labelWidth = labelText.length * 7 + 16;
        markerGroup.append("rect")
            .attr("x", -labelWidth/2)
            .attr("y", -38)
            .attr("width", labelWidth)
            .attr("height", 22)
            .attr("rx", 5)
            .attr("fill", "rgba(0, 0, 0, 0.85)");
        
        // Label
        markerGroup.append("text")
            .attr("y", -22)
            .attr("text-anchor", "middle")
            .attr("fill", "#fff")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .text(region.name);
        
        // Enhanced click handler
        markerGroup.on("click", async function(event) {
            event.stopPropagation();
            
            // Show info panel with fun facts
            showRegionInfo(region);
            
            // Show temperature chart if data exists
            if (region.processedData) {
                createTemperatureChart(region, region.processedData);
            } else {
                // Try to process data on the fly
                const processedData = processTemperatureData(region);
                region.processedData = processedData;
                createTemperatureChart(region, processedData);
            }
        });
        
        // Enhanced hover effects
        markerGroup.on("mouseenter", function() {
            d3.select(this).select(".marker-dot")
                .transition()
                .duration(200)
                .attr("r", 16)
                .attr("fill", "#ffcc00");
            
            d3.select(this).select(".pulse-ring")
                .transition()
                .duration(200)
                .attr("r", 24)
                .attr("opacity", 0.8);
            
            d3.select(this).select(".chart-icon")
                .transition()
                .duration(200)
                .attr("opacity", 1);
        });
        
        markerGroup.on("mouseleave", function() {
            d3.select(this).select(".marker-dot")
                .transition()
                .duration(200)
                .attr("r", 12)
                .attr("fill", "#ff6b35");
            
            d3.select(this).select(".pulse-ring")
                .transition()
                .duration(200)
                .attr("r", 18)
                .attr("opacity", 0.5);
            
            d3.select(this).select(".chart-icon")
                .transition()
                .duration(200)
                .attr("opacity", 0);
        });
    });
}

function showRegionInfo(region) {
    const baseTemp = region.processedData ? 
        region.processedData.baseline.toFixed(1) : 
        region.baseTemp || "N/A";
    
    infoTitle.text(`${region.name} — Baseline: ${baseTemp}°C`);
    
    // Enhanced info text that mentions chart
    const enhancedInfo = `${region.info} Click to see detailed temperature trends and projections.`;
    
    const words = enhancedInfo.split(' ');
    let line1 = '';
    let line2 = '';
    let currentLine = 1;
    
    words.forEach(word => {
        if (currentLine === 1 && line1.length + word.length < 110) {
            line1 += (line1 ? ' ' : '') + word;
        } else {
            currentLine = 2;
            line2 += (line2 ? ' ' : '') + word;
        }
    });
    
    infoText.selectAll("tspan").remove();
    infoText.append("tspan").attr("x", 0).attr("dy", 0).text(line1);
    if (line2) {
        infoText.append("tspan").attr("x", 0).attr("dy", "1.3em").text(line2);
    }
    
    infoPanel.transition()
        .duration(400)
        .style("opacity", 1);
}

// ==============================================
// EXISTING FUNCTIONS (modified)
// ==============================================

async function loadUSMap() {
    try {
        // Load TopoJSON data for US states
        const response = await fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json');
        const us = await response.json();
        
        usMapData = us;
        
        // Convert TopoJSON to GeoJSON
        const states = topojson.feature(us, us.objects.states);
        const statesOutline = topojson.mesh(us, us.objects.states, (a, b) => a !== b);
        const nationOutline = topojson.mesh(us, us.objects.states, (a, b) => a === b);
        
        // Create projection for expanded map
        const projection = d3.geoAlbersUsa()
            .scale(900)
            .translate([0, 0]);
        
        const path = d3.geoPath().projection(projection);
        
        // Create projection for minimap
        const minimapProjection = d3.geoAlbersUsa()
            .scale(150)
            .translate([70, 50]);
        
        const minimapPath = d3.geoPath().projection(minimapProjection);
        
        // Define coastal states for highlighting
        const pacificStates = ["California", "Oregon", "Washington", "Alaska"];
        const atlanticStates = ["Maine", "New Hampshire", "Massachusetts", "Rhode Island", "Connecticut", "New York", "New Jersey", "Delaware", "Maryland", "Virginia", "North Carolina", "South Carolina", "Georgia", "Florida"];
        const gulfStates = ["Texas", "Louisiana", "Mississippi", "Alabama"];
        const hawaiiCoast = ["Hawaii"];
        
        // State names lookup (FIPS codes)
        const stateNames = {
            "01": "Alabama", "02": "Alaska", "04": "Arizona", "05": "Arkansas",
            "06": "California", "08": "Colorado", "09": "Connecticut", "10": "Delaware",
            "11": "District of Columbia", "12": "Florida", "13": "Georgia", "15": "Hawaii",
            "16": "Idaho", "17": "Illinois", "18": "Indiana", "19": "Iowa",
            "20": "Kansas", "21": "Kentucky", "22": "Louisiana", "23": "Maine",
            "24": "Maryland", "25": "Massachusetts", "26": "Michigan", "27": "Minnesota",
            "28": "Mississippi", "29": "Missouri", "30": "Montana", "31": "Nebraska",
            "32": "Nevada", "33": "New Hampshire", "34": "New Jersey", "35": "New Mexico",
            "36": "New York", "37": "North Carolina", "38": "North Dakota", "39": "Ohio",
            "40": "Oklahoma", "41": "Oregon", "42": "Pennsylvania", "44": "Rhode Island",
            "45": "South Carolina", "46": "South Dakota", "47": "Tennessee", "48": "Texas",
            "49": "Utah", "50": "Vermont", "51": "Virginia", "53": "Washington",
            "54": "West Virginia", "55": "Wisconsin", "56": "Wyoming"
        };
        
        // Draw states on expanded map
        expandedMapContent.selectAll("path.state")
            .data(states.features)
            .enter()
            .append("path")
            .attr("class", "state")
            .attr("d", path)
            .attr("fill", d => {
                const stateName = stateNames[d.id];
                if (pacificStates.includes(stateName)) return "rgba(255, 107, 53, 0.5)";
                if (atlanticStates.includes(stateName)) return "rgba(100, 200, 255, 0.5)";
                if (gulfStates.includes(stateName)) return "rgba(255, 200, 50, 0.5)";
                if (hawaiiCoast.includes(stateName)) return "rgba(78, 175, 88, 0.82)";
                return "rgba(100, 150, 200, 0.25)";
            })
            .attr("stroke", "rgba(150, 200, 255, 0.4)")
            .attr("stroke-width", 0.5);
        
        // Draw state borders
        expandedMapContent.append("path")
            .datum(statesOutline)
            .attr("class", "state-borders")
            .attr("d", path)
            .attr("fill", "none")
            .attr("stroke", "rgba(150, 200, 255, 0.6)")
            .attr("stroke-width", 1);
        
        // Draw nation outline
        expandedMapContent.append("path")
            .datum(nationOutline)
            .attr("class", "nation-outline")
            .attr("d", path)
            .attr("fill", "none")
            .attr("stroke", "rgba(255, 150, 100, 0.8)")
            .attr("stroke-width", 2);
        
        // Draw minimap states
        minimapContent.selectAll("path.minimap-state")
            .data(states.features)
            .enter()
            .append("path")
            .attr("class", "minimap-state")
            .attr("d", minimapPath)
            .attr("fill", d => {
                const stateName = stateNames[d.id];
                if (pacificStates.includes(stateName)) return "rgba(255, 107, 53, 0.5)";
                if (atlanticStates.includes(stateName)) return "rgba(100, 200, 255, 0.5)";
                if (gulfStates.includes(stateName)) return "rgba(255, 200, 50, 0.5)";
                if (hawaiiCoast.includes(stateName)) return "rgba(78, 175, 88, 0.82)";
                return "rgba(100, 150, 200, 0.3)";
            })
            .attr("stroke", "rgba(150, 200, 255, 0.4)")
            .attr("stroke-width", 0.3);
        
        // Draw minimap outline
        minimapContent.append("path")
            .datum(nationOutline)
            .attr("class", "minimap-outline")
            .attr("d", minimapPath)
            .attr("fill", "none")
            .attr("stroke", "rgba(255, 150, 100, 0.6)")
            .attr("stroke-width", 1);
        
        // Load coastal data and add markers
        await loadCoastalData();
        
    } catch (error) {
        console.error("Error loading map:", error);
        drawFallbackMap();
    }
}

function drawFallbackMap() {
    const usOutlinePath = "M -300,-120 Q -270,-150 -230,-140 L -150,-110 Q -80,-130 0,-100 L 80,-90 Q 150,-110 220,-90 L 300,-70 Q 320,-20 310,40 L 300,100 Q 240,140 160,130 L 80,110 Q 20,130 -40,120 L -120,100 Q -200,130 -260,100 L -300,50 Q -320,0 -300,-60 Z";
    
    expandedMapContent.append("path")
        .attr("d", usOutlinePath)
        .attr("fill", "rgba(100, 150, 200, 0.2)")
        .attr("stroke", "rgba(150, 200, 255, 0.5)")
        .attr("stroke-width", 2);
    
    // Load coastal data for fallback
    loadCoastalData();
}

// Load TopoJSON library and then the map
const topojsonScript = document.createElement('script');
topojsonScript.src = 'https://cdn.jsdelivr.net/npm/topojson-client@3';
topojsonScript.onload = loadUSMap;
document.head.appendChild(topojsonScript);

// Pot body
const pot = potGroup.append("ellipse")
    .attr("cx", 0)
    .attr("cy", 50)
    .attr("rx", 150)
    .attr("ry", 120)
    .attr("fill", "#333")
    .attr("stroke", "#666")
    .attr("stroke-width", 3);

// Pot rim
potGroup.append("ellipse")
    .attr("cx", 0)
    .attr("cy", -70)
    .attr("rx", 160)
    .attr("ry", 20)
    .attr("fill", "#444")
    .attr("stroke", "#666")
    .attr("stroke-width", 3);

// Water/heat level
const heatLevel = potGroup.append("ellipse")
    .attr("cx", 0)
    .attr("cy", 40)
    .attr("rx", 140)
    .attr("ry", 100)
    .attr("fill", "#4a90e2")
    .attr("opacity", 0.6);

// Bubbles
const bubblesGroup = potGroup.append("g");

// Region labels feeding into pot
const regionsGroup = mainGroup.append("g");

// State for stirring animation
let stirringInterval = null;
let currentRotation = 0;

// Update region labels when data is loadeds
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
const tempLabel = potGroup.append("text")
    .attr("x", 0)
    .attr("y", -100)
    .attr("text-anchor", "middle")
    .attr("fill", "#fff")
    .attr("font-size", "24px")
    .attr("font-weight", "bold");

// Toggle map expansion
function toggleMapExpansion() {
    isMapExpanded = !isMapExpanded;
    
    if (isMapExpanded) {
        // Shrink pot and show expanded map
        potGroup.transition()
            .duration(600)
            .attr("transform", `translate(${width / 4}, ${height / 2}) scale(1)`);
        
        regionsGroup.transition()
            .duration(400)
            .style("opacity", 0);
        
        minimapGroup.transition()
            .duration(400)
            .style("opacity", 0)
            .style("pointer-events", "none");
        
        // Reset position to correct location before showing
        expandedMapGroup
            .attr("transform", `translate(${width * 0.65}, ${height / 2}) scale(0.75)`);
        
        expandedMapGroup.transition()
            .duration(600)
            .style("opacity", 1)
            .style("pointer-events", "all");
        
        // Hide info panel when opening
        infoPanel.style("opacity", 0);
        
        // Close any open chart
        if (activeChart) {
            activeChart.remove();
            activeChart = null;
        }
        
    } else {
        // Restore pot and hide expanded map
        potGroup.transition()
            .duration(600)
            .attr("transform", `translate(${width/2}, ${height/2}) scale(1)`);
        
        regionsGroup.transition()
            .duration(600)
            .delay(200)
            .style("opacity", 1);
        
        minimapGroup.transition()
            .duration(400)
            .delay(400)
            .style("opacity", 1)
            .style("pointer-events", "all");

        expandedMapGroup.transition()
            .duration(600)
            .style("opacity", 0)
            .style("pointer-events", "none");
        
        // Close any open chart
        if (activeChart) {
            activeChart.remove();
            activeChart = null;
        }
    }
}

// Click handlers
minimapGroup.on("click", toggleMapExpansion);
closeButton.on("click", function(event) {
    event.stopPropagation();
    toggleMapExpansion();
});

// Add pulsing animation to markers
function pulseMarkers() {
    regionMarkers.selectAll(".pulse-ring")
        .transition()
        .duration(1000)
        .attr("r", 24)
        .attr("opacity", 0.2)
        .transition()
        .duration(1000)
        .attr("r", 18)
        .attr("opacity", 0.5)
        .on("end", pulseMarkers);
}

// Start pulsing after a delay to let markers load
setTimeout(pulseMarkers, 1000);

let bubbleInterval = null;

function updateVisualization(step) {
    currentStep = step;
    const projection = projections[step];
    const temp = projection.tempIncrease;
    
    // Update heat level color
    heatLevel
        .transition()
        .duration(800)
        .attr("fill", projection.color);

    // Update temperature label
    tempLabel.text(`+${temp.toFixed(1)}°C`);

    // Create bubbles based on temperature
    const numBubbles = Math.floor(temp * 5);
    
    bubblesGroup.selectAll("circle").remove();
    
    for (let i = 0; i < numBubbles; i++) {
        bubblesGroup.append("circle")
            .attr("cx", (Math.random() - 0.5) * 200)
            .attr("cy", 80)
            .attr("r", 3 + Math.random() * 5)
            .attr("fill", "white")
            .attr("opacity", 0.7)
            .transition()
            .duration(1000 + Math.random() * 1000)
            .attr("cy", -50)
            .attr("opacity", 0)
            .remove();
    }

    // Update knob
    const knobRotation = (step / 4) * 180;
    const knobMarker = d3.select(".knob-marker");
    if (!knobMarker.empty()) {
        knobMarker.style("transform", `translateX(-50%) rotate(${knobRotation}deg)`);
    }
    
    // Stop previous bubbling
    if (bubbleInterval) {
        clearInterval(bubbleInterval);
        bubbleInterval = null;
    }
    
    // Configure bubbles based on step
    const bubbleConfigs = [
        { count: 0, interval: 0 },
        { count: 10, interval: 1000 },
        { count: 10, interval: 500 },
        { count: 15, interval: 200 },
        { count: 20, interval: 50 }
    ];

    const config = bubbleConfigs[step];
    if (config.count > 0) {
        bubbleInterval = setInterval(() => {
            for (let i = 0; i < config.count; i++) {
                createBubble();
            }
        }, config.interval);
    }
}

// Scrollama setup
const scroller = scrollama();

scroller
    .setup({
        step: ".step",
        offset: 0.5,
        debug: false
    })
    .onStepEnter(response => {
        const step = +response.element.dataset.step;
        updateVisualization(step);
    });

// Initialize
updateVisualization(0);

// Generate flames in footer
const footer = document.getElementById('footer');
for (let i = 0; i < 20; i++) {
    const flame = document.createElement('div');
    flame.className = 'flame';
    flame.style.left = `${Math.random() * 100}%`;
    flame.style.animationDelay = `${Math.random() * 1.5}s`;
    flame.style.animationDuration = `${1 + Math.random()}s`;
    footer.appendChild(flame);
}

// Resize handler
window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    svg.attr("width", width).attr("height", height);
    
    // Update minimap position
    minimapCollapsedX = width - 180;
    minimapCollapsedY = height - 160;
    positionMinimap(minimapCollapsedX, minimapCollapsedY, 0);
    
    scroller.resize();
});

function createBubble() {
    bubblesGroup.append("circle")
        .attr("cx", (Math.random() - 0.5) * 200)
        .attr("cy", 80)
        .attr("r", 3 + Math.random() * 5)
        .attr("fill", "white")
        .attr("opacity", 0.7)
        .transition()
        .duration(1000 + Math.random() * 1000)
        .attr("cy", -50)
        .attr("opacity", 0)
        .remove();
}

// ==============================================
// Add CSS for charts
// ==============================================
function addChartStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .temperature-chart-container {
            transition: transform 0.3s ease, opacity 0.3s ease;
        }
        
        .temperature-chart-container::-webkit-scrollbar {
            width: 8px;
        }
        
        .temperature-chart-container::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
        }
        
        .temperature-chart-container::-webkit-scrollbar-thumb {
            background: rgba(255,150,100,0.5);
            border-radius: 4px;
        }
        
        .temperature-chart-container::-webkit-scrollbar-thumb:hover {
            background: rgba(255,150,100,0.7);
        }
        
        .grid line {
            stroke: rgba(255,255,255,0.1);
            stroke-width: 1;
        }
        
        .grid path {
            stroke-width: 0;
        }
        
        .temperature-line {
            stroke-linejoin: round;
            stroke-linecap: round;
        }
        
        .temperature-line.projection {
            stroke-linejoin: round;
            stroke-linecap: round;
        }
        
        .chart-icon {
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);
}

// Initialize chart styles
addChartStyles();

// ==============================================
// TEMPERATURE PREDICTION FEATURE (unchanged)
// ==============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - setting up prediction feature');
    
    // Get all elements
    const slider = document.getElementById('temperature-slider');
    const predictionValue = document.getElementById('prediction-value');
    const submitBtn = document.getElementById('submit-prediction');
    const tryAgainBtn = document.getElementById('try-again');
    const scrollToVizBtn = document.getElementById('scroll-to-visualization');
    const resultsSection = document.getElementById('prediction-results');
    const userPredictionDisplay = document.getElementById('user-prediction');
    const actualProjectionDisplay = document.getElementById('actual-projection');
    const temperatureDifference = document.getElementById('temperature-difference');
    const resultMessage = document.getElementById('result-message');
    const accuracyFeedback = document.getElementById('accuracy-feedback');
    const feedbackText = document.getElementById('slider-feedback-text');
    
    console.log('Elements found:', {
        slider: !!slider,
        predictionValue: !!predictionValue,
        submitBtn: !!submitBtn,
        resultsSection: !!resultsSection
    });
    
    const ACTUAL_PROJECTION = 4.5; // Actual projected increase by 2100
    
    // Function to update slider feedback text
    function updateSliderFeedback(value) {
        if (!feedbackText) return;
        
        if (value < 1.6) {
            feedbackText.textContent = "Optimistic - below Paris Agreement targets";
        } else if (value < 2.6) {
            feedbackText.textContent = "Paris Agreement goal range";
        } else if (value < 3.6) {
            feedbackText.textContent = "Current policy trajectory";
        } else if (value < 4.6) {
            feedbackText.textContent = "Significant coastal impacts expected";
        } else {
            feedbackText.textContent = "Severe coastal disruption";
        }
    }
    
    // Update prediction display when slider moves
    if (slider && predictionValue) {
        slider.addEventListener('input', function() {
            const value = parseFloat(this.value);
            console.log('Slider moved:', value);
            predictionValue.textContent = `+${value.toFixed(1)}°C`;
            updateSliderFeedback(value);
        });
        
        // Initialize display
        const initialValue = parseFloat(slider.value);
        predictionValue.textContent = `+${initialValue.toFixed(1)}°C`;
        updateSliderFeedback(initialValue);
    }
    
    // Function to update impact bars
    function updateImpactBars(userTemp, actualTemp) {
        const userBar = document.querySelector('.user-prediction .impact-bar');
        const actualBar = document.querySelector('.actual-projection .impact-bar');
        
        if (userBar) {
            const userPercent = Math.min(100, (userTemp / 7) * 100);
            userBar.style.width = `${userPercent}%`;
        }
        
        if (actualBar) {
            const actualPercent = Math.min(100, (actualTemp / 7) * 100);
            actualBar.style.width = `${actualPercent}%`;
        }
    }
    
    // Function to show accuracy feedback - NO SCROLLING
    function showAccuracyFeedback(userPrediction) {
        console.log('Showing accuracy feedback for:', userPrediction);
        const actual = ACTUAL_PROJECTION;
        const difference = actual - userPrediction;
        const absDifference = Math.abs(difference);
        
        // Update all display elements
        if (userPredictionDisplay) {
            userPredictionDisplay.textContent = userPrediction.toFixed(1);
        }
        
        if (actualProjectionDisplay) {
            actualProjectionDisplay.textContent = actual.toFixed(1);
        }
        
        if (temperatureDifference) {
            temperatureDifference.textContent = `${difference >= 0 ? '+' : ''}${difference.toFixed(1)}°C`;
        }
        
        // Update impact bars
        updateImpactBars(userPrediction, actual);
        
        // Determine accuracy level and set messages
        let message, details;
        
        if (absDifference <= 0.3) {
            message = "🎯 Excellent! Very accurate prediction!";
            details = "Your estimate is remarkably close to scientific projections.";
        } 
        else if (absDifference <= 0.8) {
            message = "📊 Good estimate!";
            details = `Your prediction was off by ${absDifference.toFixed(1)}°C. That's a solid understanding of climate trends.`;
        }
        else if (absDifference <= 1.5) {
            message = "📈 In the right range";
            details = `Your estimate is ${absDifference.toFixed(1)}°C from the projection. The reality is more severe than many expect.`;
        }
        else if (absDifference <= 2.5) {
            message = "🔽 Significant difference";
            details = `Projections show ${difference > 0 ? "higher" : "lower"} warming than you predicted. Climate models indicate ${actual.toFixed(1)}°C increase.`;
        }
        else {
            message = "⚠️ Large discrepancy";
            details = `There's a ${absDifference.toFixed(1)}°C difference. Coastal zones are projected to warm more dramatically.`;
        }
        
        // Additional context based on over/underestimation
        if (userPrediction < actual - 0.5) {
            details += " Many people underestimate how much coastal areas are warming.";
        } else if (userPrediction > actual + 0.5) {
            details += " While your estimate is high, some worst-case scenarios do reach these levels.";
        }
        
        // Set messages
        if (resultMessage) {
            resultMessage.textContent = message;
        }
        
        if (accuracyFeedback) {
            accuracyFeedback.textContent = details;
        }
        
        // Show results section WITHOUT scrolling - just display it in place
        if (resultsSection) {
            console.log('Showing results section');
            resultsSection.style.display = 'block';
            // Add a smooth fade-in effect instead of scrolling
            resultsSection.style.opacity = '0';
            resultsSection.style.transition = 'opacity 0.5s ease-in-out';
            setTimeout(() => {
                resultsSection.style.opacity = '1';
            }, 50);
        }
    }
    
    // Handle submit button
    if (submitBtn) {
        console.log('Submit button found, adding event listener');
        submitBtn.addEventListener('click', function() {
            console.log('Submit button clicked');
            if (slider) {
                const userPrediction = parseFloat(slider.value);
                console.log('User prediction value:', userPrediction);
                showAccuracyFeedback(userPrediction);
            }
        });
    } else {
        console.error('Submit button NOT FOUND! Check your HTML for id="submit-prediction"');
    }
    
    // Handle try again button
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', function() {
            console.log('Try again clicked');
            // Reset slider
            if (slider) {
                slider.value = 2.5;
            }
            
            // Reset prediction display
            if (predictionValue) {
                predictionValue.textContent = '+2.5°C';
            }
            
            // Reset feedback text
            if (feedbackText) {
                feedbackText.textContent = "Moderate increase projected by many climate models";
            }
            
            // Hide results section with fade out
            if (resultsSection) {
                resultsSection.style.opacity = '0';
                setTimeout(() => {
                    resultsSection.style.display = 'none';
                }, 500);
            }
            
            // Focus back on slider
            if (slider) {
                slider.focus();
            }
        });
    }
    
    // Handle "Continue to Visualization" button
    if (scrollToVizBtn) {
        scrollToVizBtn.addEventListener('click', function() {
            console.log('Continue to visualization clicked');
            const scrollySection = document.getElementById('scrolly-section');
            if (scrollySection) {
                scrollySection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Handle share button (optional basic functionality)
    const shareBtn = document.getElementById('share-results');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            if (slider) {
                const userTemp = parseFloat(slider.value).toFixed(1);
                const shareText = `I predicted a ${userTemp}°C temperature rise in coastal zones by 2100. The actual projection is 4.5°C. Test your climate intuition!`;
                
                if (navigator.share) {
                    navigator.share({
                        title: 'My Climate Prediction',
                        text: shareText,
                        url: window.location.href
                    });
                } else {
                    // Fallback: Copy to clipboard
                    navigator.clipboard.writeText(shareText)
                        .then(() => alert('Results copied to clipboard!'))
                        .catch(() => alert('Could not share results.'));
                }
            }
        });
    }
    
    // Initialize impact bars
    setTimeout(() => {
        if (slider) {
            const initialValue = parseFloat(slider.value);
            updateImpactBars(initialValue, ACTUAL_PROJECTION);
        }
    }, 500);
});