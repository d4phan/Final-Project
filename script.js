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

// Coastal regions data
const coastalRegions = [
    { 
        name: "Pacific Coast", 
        baseTemp: 18,
        info: "The Pacific Coast stretches from Alaska to California, experiencing significant warming trends. Rising ocean temperatures are affecting marine ecosystems and coastal communities.",
        states: ["California", "Oregon", "Washington"],
        markerPos: { x: -280, y: -20 }
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
    }
];

const projections = [
    { year: 2024, tempIncrease: 0, color: "#4a90e2" },
    { year: 2040, tempIncrease: 0.7, color: "#7fb3d5" },
    { year: 2060, tempIncrease: 1.8, color: "#f39c12" },
    { year: 2080, tempIncrease: 3.1, color: "#e67e22" },
    { year: 2100, tempIncrease: 4.5, color: "#e74c3c" }
];

const svg = d3.select("#visualization");
const width = window.innerWidth;
const height = window.innerHeight;
svg.attr("width", width).attr("height", height);

// State management
let isMapExpanded = false;
let currentStep = 0;
let usMapData = null;

// Create main groups
const mainGroup = svg.append("g").attr("class", "main-group");
const potGroup = mainGroup.append("g")
    .attr("class", "pot-group")
    .attr("transform", `translate(${width/2}, ${height/2})`);

// Create minimap group
const minimapGroup = svg.append("g")
    .attr("class", "minimap-group")
    .attr("transform", `translate(${width - 180}, ${height - 160})`)
    .style("cursor", "pointer");

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

// SHIFT everything to the right - offset from center
const rightShift = 120;

// Create expanded map group (initially hidden) - SHIFTED RIGHT
const expandedMapGroup = svg.append("g")
    .attr("class", "expanded-map-group")
    .attr("transform", `translate(${width/2 + rightShift}, ${height/2})`)
    .style("opacity", 0)
    .style("pointer-events", "none");

// Layout dimensions - BIGGER map box
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

// Map box background - BIGGER
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
    .text("Coastal Regions at Risk");

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
    .text("×");

// Legend box - TO THE RIGHT of the map
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

// Legend items - VERTICAL layout
const legendItems = [
    { color: "rgba(255, 107, 53, 0.7)", label: "Pacific Coast" },
    { color: "rgba(100, 200, 255, 0.7)", label: "Atlantic Coast" },
    { color: "rgba(255, 200, 50, 0.7)", label: "Gulf Coast" },
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

function showRegionInfo(region) {
    infoTitle.text(region.name + " — Base Temp: " + region.baseTemp + "°C");
    
    // Word wrap the info text
    const words = region.info.split(' ');
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

// Load and render the US map
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
        const pacificStates = ["California", "Oregon", "Washington"];
        const atlanticStates = ["Maine", "New Hampshire", "Massachusetts", "Rhode Island", "Connecticut", "New York", "New Jersey", "Delaware", "Maryland", "Virginia", "North Carolina", "South Carolina", "Georgia", "Florida"];
        const gulfStates = ["Texas", "Louisiana", "Mississippi", "Alabama"];
        
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
        
        // Add region markers
        addRegionMarkers();
        
    } catch (error) {
        console.error("Error loading map:", error);
        drawFallbackMap();
    }
}

function addRegionMarkers() {
    coastalRegions.forEach(region => {
        const markerGroup = regionMarkers.append("g")
            .attr("class", "region-marker")
            .attr("transform", `translate(${region.markerPos.x}, ${region.markerPos.y})`)
            .style("cursor", "pointer");
        
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
        
        // Click handler for region info
        markerGroup.on("click", function(event) {
            event.stopPropagation();
            showRegionInfo(region);
        });
        
        // Hover effects
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
        });
    });
}

function drawFallbackMap() {
    const usOutlinePath = "M -300,-120 Q -270,-150 -230,-140 L -150,-110 Q -80,-130 0,-100 L 80,-90 Q 150,-110 220,-90 L 300,-70 Q 320,-20 310,40 L 300,100 Q 240,140 160,130 L 80,110 Q 20,130 -40,120 L -120,100 Q -200,130 -260,100 L -300,50 Q -320,0 -300,-60 Z";
    
    expandedMapContent.append("path")
        .attr("d", usOutlinePath)
        .attr("fill", "rgba(100, 150, 200, 0.2)")
        .attr("stroke", "rgba(150, 200, 255, 0.5)")
        .attr("stroke-width", 2);
    
    addRegionMarkers();
}

// Load TopoJSON library and then the map
const topojsonScript = document.createElement('script');
topojsonScript.src = 'https://cdn.jsdelivr.net/npm/topojson-client@3';
topojsonScript.onload = loadUSMap;
document.head.appendChild(topojsonScript);

// === CROCKPOT SVG DEFINITIONS ===
const defs = svg.append("defs");

// Gradient for crockpot body (ceramic look)
const potBodyGradient = defs.append("linearGradient")
    .attr("id", "potBodyGradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "100%");
potBodyGradient.append("stop").attr("offset", "0%").attr("stop-color", "#8B4513");
potBodyGradient.append("stop").attr("offset", "30%").attr("stop-color", "#A0522D");
potBodyGradient.append("stop").attr("offset", "50%").attr("stop-color", "#CD853F");
potBodyGradient.append("stop").attr("offset", "70%").attr("stop-color", "#A0522D");
potBodyGradient.append("stop").attr("offset", "100%").attr("stop-color", "#654321");

// Gradient for metallic rim
const rimGradient = defs.append("linearGradient")
    .attr("id", "rimGradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "0%").attr("y2", "100%");
rimGradient.append("stop").attr("offset", "0%").attr("stop-color", "#E8E8E8");
rimGradient.append("stop").attr("offset", "20%").attr("stop-color", "#C0C0C0");
rimGradient.append("stop").attr("offset", "50%").attr("stop-color", "#A8A8A8");
rimGradient.append("stop").attr("offset", "80%").attr("stop-color", "#808080");
rimGradient.append("stop").attr("offset", "100%").attr("stop-color", "#606060");

// Gradient for glass lid
const lidGradient = defs.append("linearGradient")
    .attr("id", "lidGradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "0%").attr("y2", "100%");
lidGradient.append("stop").attr("offset", "0%").attr("stop-color", "rgba(200, 230, 255, 0.4)");
lidGradient.append("stop").attr("offset", "50%").attr("stop-color", "rgba(150, 200, 240, 0.2)");
lidGradient.append("stop").attr("offset", "100%").attr("stop-color", "rgba(100, 150, 200, 0.3)");

// Water/liquid gradient (will be animated based on temperature)
const waterGradient = defs.append("linearGradient")
    .attr("id", "waterGradient")
    .attr("x1", "0%").attr("y1", "100%")
    .attr("x2", "0%").attr("y2", "0%");
waterGradient.append("stop").attr("offset", "0%").attr("stop-color", "#4a90e2").attr("class", "water-bottom");
waterGradient.append("stop").attr("offset", "100%").attr("stop-color", "#87CEEB").attr("class", "water-top");

// Glow filter for heat effect
const glowFilter = defs.append("filter")
    .attr("id", "heatGlow")
    .attr("x", "-50%").attr("y", "-50%")
    .attr("width", "200%").attr("height", "200%");
glowFilter.append("feGaussianBlur").attr("stdDeviation", "8").attr("result", "blur");
glowFilter.append("feComposite").attr("in", "SourceGraphic").attr("in2", "blur").attr("operator", "over");

// Shadow filter
const shadowFilter = defs.append("filter")
    .attr("id", "potShadow")
    .attr("x", "-20%").attr("y", "-20%")
    .attr("width", "140%").attr("height", "140%");
shadowFilter.append("feDropShadow")
    .attr("dx", "5").attr("dy", "10")
    .attr("stdDeviation", "8")
    .attr("flood-color", "rgba(0,0,0,0.5)");

// === CROCKPOT BASE/HEATING ELEMENT ===
// Outer base (black plastic housing)
potGroup.append("ellipse")
    .attr("cx", 0)
    .attr("cy", 140)
    .attr("rx", 170)
    .attr("ry", 35)
    .attr("fill", "#1a1a1a")
    .attr("stroke", "#333")
    .attr("stroke-width", 2);

// Base front panel
potGroup.append("rect")
    .attr("x", -170)
    .attr("y", 105)
    .attr("width", 340)
    .attr("height", 70)
    .attr("rx", 5)
    .attr("fill", "#1a1a1a")
    .attr("stroke", "#333")
    .attr("stroke-width", 2);

// Control panel area
potGroup.append("rect")
    .attr("x", -60)
    .attr("y", 115)
    .attr("width", 120)
    .attr("height", 45)
    .attr("rx", 3)
    .attr("fill", "#2a2a2a")
    .attr("stroke", "#444")
    .attr("stroke-width", 1);

// Temperature dial
const dialGroup = potGroup.append("g").attr("transform", "translate(-25, 137)");
dialGroup.append("circle")
    .attr("r", 15)
    .attr("fill", "#3a3a3a")
    .attr("stroke", "#555")
    .attr("stroke-width", 2);
dialGroup.append("circle")
    .attr("r", 10)
    .attr("fill", "#222")
    .attr("stroke", "#444")
    .attr("stroke-width", 1);
const dialIndicator = dialGroup.append("line")
    .attr("x1", 0).attr("y1", 0)
    .attr("x2", 0).attr("y2", -8)
    .attr("stroke", "#ff6b35")
    .attr("stroke-width", 2)
    .attr("stroke-linecap", "round");

// Power indicator light
const powerLight = potGroup.append("circle")
    .attr("cx", 25)
    .attr("cy", 137)
    .attr("r", 6)
    .attr("fill", "#00ff00")
    .attr("filter", "url(#heatGlow)");

// Label on base
potGroup.append("text")
    .attr("x", 0)
    .attr("y", 155)
    .attr("text-anchor", "middle")
    .attr("fill", "#666")
    .attr("font-size", "10px")
    .attr("font-family", "Arial, sans-serif")
    .text("CLIMATE COOKER");

// === CERAMIC POT BODY ===
// Shadow under pot
potGroup.append("ellipse")
    .attr("cx", 5)
    .attr("cy", 110)
    .attr("rx", 155)
    .attr("ry", 25)
    .attr("fill", "rgba(0,0,0,0.3)")
    .attr("filter", "url(#potShadow)");

// Main ceramic body
const pot = potGroup.append("path")
    .attr("d", `
        M -150 -30
        Q -160 40 -145 95
        Q -130 105 0 110
        Q 130 105 145 95
        Q 160 40 150 -30
        Q 140 -45 0 -50
        Q -140 -45 -150 -30
        Z
    `)
    .attr("fill", "url(#potBodyGradient)")
    .attr("stroke", "#5D3A1A")
    .attr("stroke-width", 3);

// Ceramic body highlight (left side shine)
potGroup.append("path")
    .attr("d", `
        M -140 -20
        Q -145 30 -135 80
        Q -130 85 -120 85
        Q -125 30 -130 -15
        Z
    `)
    .attr("fill", "rgba(255,255,255,0.15)");

// Decorative band on pot
potGroup.append("ellipse")
    .attr("cx", 0)
    .attr("cy", 30)
    .attr("rx", 152)
    .attr("ry", 12)
    .attr("fill", "none")
    .attr("stroke", "#8B4513")
    .attr("stroke-width", 4)
    .attr("opacity", 0.6);

// === INNER POT (visible through opening) ===
potGroup.append("ellipse")
    .attr("cx", 0)
    .attr("cy", -45)
    .attr("rx", 130)
    .attr("ry", 20)
    .attr("fill", "#1a1a2e");

// === LIQUID/WATER INSIDE ===
const heatLevel = potGroup.append("ellipse")
    .attr("cx", 0)
    .attr("cy", -40)
    .attr("rx", 125)
    .attr("ry", 18)
    .attr("fill", "url(#waterGradient)")
    .attr("opacity", 0.85);

// Liquid surface reflection
potGroup.append("ellipse")
    .attr("cx", -30)
    .attr("cy", -42)
    .attr("rx", 40)
    .attr("ry", 6)
    .attr("fill", "rgba(255,255,255,0.2)");

// === METALLIC RIM ===
potGroup.append("ellipse")
    .attr("cx", 0)
    .attr("cy", -50)
    .attr("rx", 155)
    .attr("ry", 18)
    .attr("fill", "url(#rimGradient)")
    .attr("stroke", "#666")
    .attr("stroke-width", 2);

// Inner rim edge
potGroup.append("ellipse")
    .attr("cx", 0)
    .attr("cy", -48)
    .attr("rx", 135)
    .attr("ry", 14)
    .attr("fill", "none")
    .attr("stroke", "#888")
    .attr("stroke-width", 1);

// === GLASS LID ===
const lidGroup = potGroup.append("g").attr("class", "lid-group");

// Lid dome
lidGroup.append("path")
    .attr("d", `
        M -140 -55
        Q -145 -100 -80 -120
        Q 0 -135 80 -120
        Q 145 -100 140 -55
        Q 130 -50 0 -48
        Q -130 -50 -140 -55
        Z
    `)
    .attr("fill", "url(#lidGradient)")
    .attr("stroke", "rgba(150, 180, 200, 0.6)")
    .attr("stroke-width", 2);

// Lid highlight reflection
lidGroup.append("path")
    .attr("d", `
        M -100 -80
        Q -60 -110 20 -105
        Q 40 -100 30 -85
        Q -20 -90 -80 -75
        Z
    `)
    .attr("fill", "rgba(255,255,255,0.25)");

// Lid handle base
lidGroup.append("ellipse")
    .attr("cx", 0)
    .attr("cy", -125)
    .attr("rx", 25)
    .attr("ry", 8)
    .attr("fill", "#2a2a2a")
    .attr("stroke", "#444")
    .attr("stroke-width", 1);

// Lid handle
lidGroup.append("ellipse")
    .attr("cx", 0)
    .attr("cy", -130)
    .attr("rx", 18)
    .attr("ry", 12)
    .attr("fill", "#1a1a1a")
    .attr("stroke", "#333")
    .attr("stroke-width", 2);

// Handle highlight
lidGroup.append("ellipse")
    .attr("cx", -5)
    .attr("cy", -133)
    .attr("rx", 6)
    .attr("ry", 4)
    .attr("fill", "rgba(255,255,255,0.2)");

// === STEAM VENTS ===
const steamGroup = potGroup.append("g").attr("class", "steam-group");

// Steam particles (will be animated)
for (let i = 0; i < 8; i++) {
    steamGroup.append("ellipse")
        .attr("class", "steam-particle")
        .attr("cx", -40 + Math.random() * 80)
        .attr("cy", -140 - Math.random() * 20)
        .attr("rx", 4 + Math.random() * 6)
        .attr("ry", 3 + Math.random() * 4)
        .attr("fill", "rgba(255,255,255,0.3)")
        .attr("opacity", 0);
}

// === HANDLES ON SIDES ===
// Left handle
const leftHandle = potGroup.append("g").attr("transform", "translate(-155, 20)");
leftHandle.append("path")
    .attr("d", "M 0 -15 Q -25 -15 -30 0 Q -25 15 0 15")
    .attr("fill", "none")
    .attr("stroke", "#1a1a1a")
    .attr("stroke-width", 12)
    .attr("stroke-linecap", "round");
leftHandle.append("path")
    .attr("d", "M 0 -15 Q -25 -15 -30 0 Q -25 15 0 15")
    .attr("fill", "none")
    .attr("stroke", "#333")
    .attr("stroke-width", 8)
    .attr("stroke-linecap", "round");

// Right handle
const rightHandle = potGroup.append("g").attr("transform", "translate(155, 20)");
rightHandle.append("path")
    .attr("d", "M 0 -15 Q 25 -15 30 0 Q 25 15 0 15")
    .attr("fill", "none")
    .attr("stroke", "#1a1a1a")
    .attr("stroke-width", 12)
    .attr("stroke-linecap", "round");
rightHandle.append("path")
    .attr("d", "M 0 -15 Q 25 -15 30 0 Q 25 15 0 15")
    .attr("fill", "none")
    .attr("stroke", "#333")
    .attr("stroke-width", 8)
    .attr("stroke-linecap", "round");

// === BUBBLES GROUP (for animation) ===
const bubblesGroup = potGroup.append("g").attr("class", "bubbles-group");

// === HEAT GLOW UNDER POT ===
const heatGlowEllipse = potGroup.append("ellipse")
    .attr("cx", 0)
    .attr("cy", 115)
    .attr("rx", 140)
    .attr("ry", 20)
    .attr("fill", "rgba(255, 100, 50, 0)")
    .attr("filter", "url(#heatGlow)")
    .attr("class", "heat-glow");

// Region labels feeding into pot
const regionsGroup = mainGroup.append("g");

coastalRegions.forEach((region, i) => {
    const angle = (i * Math.PI / 2) - Math.PI / 4;
    const distance = 250;
    const x = width/2 + Math.cos(angle) * distance;
    const y = height/2 + Math.sin(angle) * distance;

    // Arrow to pot
    regionsGroup.append("line")
        .attr("x1", x)
        .attr("y1", y)
        .attr("x2", width/2 + Math.cos(angle) * 160)
        .attr("y2", height/2 + Math.sin(angle) * 80)
        .attr("stroke", "#666")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("opacity", 0.5);

    // Region label
    regionsGroup.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .attr("font-size", "14px")
        .text(region.name);
});

// Temperature label - positioned above the lid
const tempLabel = potGroup.append("text")
    .attr("x", 0)
    .attr("y", -180)
    .attr("text-anchor", "middle")
    .attr("fill", "#fff")
    .attr("font-size", "32px")
    .attr("font-weight", "bold")
    .attr("filter", "url(#heatGlow)")
    .style("text-shadow", "0 0 10px rgba(255, 150, 100, 0.8)");

// Toggle map expansion
function toggleMapExpansion() {
    isMapExpanded = !isMapExpanded;
    
    if (isMapExpanded) {
        // Shrink pot and show expanded map
        potGroup.transition()
            .duration(600)
            .attr("transform", `translate(${width - 150}, ${height - 130}) scale(0.15)`);
        
        regionsGroup.transition()
            .duration(400)
            .style("opacity", 0);
        
        minimapGroup.transition()
            .duration(400)
            .style("opacity", 0)
            .style("pointer-events", "none");
        
        expandedMapGroup.transition()
            .duration(600)
            .style("opacity", 1)
            .style("pointer-events", "all");
        
        // Hide info panel when opening
        infoPanel.style("opacity", 0);
        
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
            .duration(400)
            .style("opacity", 0)
            .style("pointer-events", "none");
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
let steamInterval = null;
let lidShakeInterval = null;

function updateVisualization(step) {
    currentStep = step;
    const projection = projections[step];
    const temp = projection.tempIncrease;
    const intensity = step / 4; // 0 to 1 based on step
    
    // Update water gradient colors based on temperature
    const waterColors = [
        { bottom: "#4a90e2", top: "#87CEEB" },      // Cool blue
        { bottom: "#5a9fd4", top: "#98d4e8" },      // Slightly warmer
        { bottom: "#e6a756", top: "#f0c87d" },      // Warming orange
        { bottom: "#e67e22", top: "#f39c12" },      // Hot orange
        { bottom: "#c0392b", top: "#e74c3c" }       // Boiling red
    ];
    
    const colors = waterColors[step];
    d3.select(".water-bottom").transition().duration(800).attr("stop-color", colors.bottom);
    d3.select(".water-top").transition().duration(800).attr("stop-color", colors.top);
    
    // Update heat level opacity (more opaque when hotter)
    heatLevel
        .transition()
        .duration(800)
        .attr("opacity", 0.7 + intensity * 0.25);

    // Update heat glow under pot
    d3.select(".heat-glow")
        .transition()
        .duration(800)
        .attr("fill", `rgba(255, ${100 - intensity * 50}, 50, ${intensity * 0.6})`);
    
    // Update power light color (green -> yellow -> red)
    const lightColors = ["#00ff00", "#7fff00", "#ffff00", "#ff8800", "#ff0000"];
    powerLight
        .transition()
        .duration(400)
        .attr("fill", lightColors[step]);
    
    // Rotate dial indicator based on step
    const dialAngle = -90 + (step * 45); // From -90 to 90 degrees
    dialIndicator
        .transition()
        .duration(600)
        .attr("transform", `rotate(${dialAngle})`);

    // Update temperature label
    tempLabel.text(`+${temp.toFixed(1)}°C`);

    // Stop previous animations
    if (bubbleInterval) {
        clearInterval(bubbleInterval);
        bubbleInterval = null;
    }
    if (steamInterval) {
        clearInterval(steamInterval);
        steamInterval = null;
    }
    
    // Clear existing bubbles
    bubblesGroup.selectAll("*").remove();

    // Create bubbles based on temperature (rising from bottom of visible liquid)
    const numBubbles = Math.floor(temp * 4);
    
    function createBubble() {
        const bubble = bubblesGroup.append("circle")
            .attr("cx", (Math.random() - 0.5) * 200)
            .attr("cy", 0)
            .attr("r", 2 + Math.random() * 4)
            .attr("fill", "rgba(255, 255, 255, 0.6)")
            .attr("opacity", 0.8);
        
        bubble.transition()
            .duration(800 + Math.random() * 600)
            .ease(d3.easeLinear)
            .attr("cy", -50)
            .attr("opacity", 0)
            .on("end", function() { d3.select(this).remove(); });
    }
    
    // Steam animation function
    function animateSteam() {
        steamGroup.selectAll(".steam-particle").each(function(d, i) {
            const particle = d3.select(this);
            const delay = Math.random() * 500;
            const startX = -30 + Math.random() * 60;
            
            particle
                .attr("cx", startX)
                .attr("cy", -135)
                .attr("opacity", 0)
                .transition()
                .delay(delay)
                .duration(1500 + Math.random() * 1000)
                .ease(d3.easeOut)
                .attr("cy", -200 - Math.random() * 50)
                .attr("cx", startX + (Math.random() - 0.5) * 40)
                .attr("opacity", 0.4 * intensity)
                .attr("rx", 8 + Math.random() * 8)
                .attr("ry", 6 + Math.random() * 6)
                .transition()
                .duration(500)
                .attr("opacity", 0);
        });
    }
    
    // Set up continuous animations based on temperature step
    if (step >= 1) {
        const bubbleRate = [0, 800, 400, 200, 80][step];
        const bubblesPerBurst = [0, 2, 4, 8, 15][step];
        
        bubbleInterval = setInterval(() => {
            for (let i = 0; i < bubblesPerBurst; i++) {
                createBubble();
            }
        }, bubbleRate);
    }
    
    // Steam only appears at higher temperatures
    if (step >= 2) {
        const steamRate = [0, 0, 2000, 1200, 600][step];
        animateSteam();
        steamInterval = setInterval(animateSteam, steamRate);
    }
    
    // Lid shake animation at highest temperature
    if (step === 4) {
        function shakeLid() {
            lidGroup
                .transition()
                .duration(50)
                .attr("transform", `translate(${(Math.random() - 0.5) * 3}, ${(Math.random() - 0.5) * 2})`)
                .transition()
                .duration(50)
                .attr("transform", "translate(0, 0)");
        }
        lidShakeInterval = setInterval(shakeLid, 150);
    } else if (lidShakeInterval) {
        clearInterval(lidShakeInterval);
        lidShakeInterval = null;
        lidGroup.attr("transform", "translate(0, 0)");
    }

    // Update knob indicator
    const knobRotation = (step / 4) * 180;
    d3.select(".knob-marker")
        .style("transform", `translateX(-50%) rotate(${knobRotation}deg)`);
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
// TEMPERATURE PREDICTION FEATURE
// ==============================================

// Wait for DOM to load
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
('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    svg.attr("width", width).attr("height", height);
    
    // Update minimap position
    minimapCollapsedX = width - 180;
    minimapCollapsedY = height - 160;
    positionMinimap(minimapCollapsedX, minimapCollapsedY, 0);
    
    scroller.resize();
});

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
// TEMPERATURE PREDICTION FEATURE
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