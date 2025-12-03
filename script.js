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
        markerPos: { x: -320, y: 30 }
    },
    { 
        name: "Atlantic Coast", 
        baseTemp: 16,
        info: "The Atlantic Coast from Maine to Florida faces increasing hurricane intensity and sea level rise. Coastal erosion threatens infrastructure and habitats.",
        states: ["Maine", "New Hampshire", "Massachusetts", "Rhode Island", "Connecticut", "New York", "New Jersey", "Delaware", "Maryland", "Virginia", "North Carolina", "South Carolina", "Georgia", "Florida"],
        markerPos: { x: 310, y: -10 }
    },
    { 
        name: "Gulf Coast", 
        baseTemp: 22,
        info: "The Gulf Coast experiences some of the fastest warming rates. Wetland loss, intensified storms, and heat waves pose major challenges to this region.",
        states: ["Texas", "Louisiana", "Mississippi", "Alabama", "Florida"],
        markerPos: { x: 120, y: 140 }
    },
    { 
        name: "Mediterranean Climate", 
        baseTemp: 19,
        info: "Mediterranean climate zones in California are shifting toward more extreme dry heat conditions, increasing wildfire risk and water scarcity.",
        states: ["California"],
        markerPos: { x: -310, y: 90 }
    }
];

const projections = [
    { year: 2024, tempIncrease: 0, color: "#4a90e2" },
    { year: 2030, tempIncrease: 1.2, color: "#7fb3d5" },
    { year: 2035, tempIncrease: 2.1, color: "#f39c12" },
    { year: 2040, tempIncrease: 3.5, color: "#e67e22" },
    { year: 2050, tempIncrease: 4.8, color: "#e74c3c" }
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

// Create expanded map group (initially hidden) - CENTERED
const expandedMapGroup = svg.append("g")
    .attr("class", "expanded-map-group")
    .attr("transform", `translate(${width/2}, ${height/2})`)
    .style("opacity", 0)
    .style("pointer-events", "none");

// Map box dimensions - BIGGER
const mapBoxWidth = 800;
const mapBoxHeight = 480;

// Expanded map background box
expandedMapGroup.append("rect")
    .attr("x", -mapBoxWidth/2)
    .attr("y", -mapBoxHeight/2 - 40)
    .attr("width", mapBoxWidth)
    .attr("height", mapBoxHeight)
    .attr("rx", 15)
    .attr("fill", "rgba(10, 20, 40, 0.95)")
    .attr("stroke", "rgba(255, 150, 100, 0.6)")
    .attr("stroke-width", 3);

// Expanded map title
expandedMapGroup.append("text")
    .attr("x", 0)
    .attr("y", -mapBoxHeight/2 - 10)
    .attr("text-anchor", "middle")
    .attr("fill", "#ffa500")
    .attr("font-size", "28px")
    .attr("font-family", "'Playfair Display', serif")
    .text("Coastal Regions at Risk");

// Close button for expanded map
const closeButton = expandedMapGroup.append("g")
    .attr("class", "close-button")
    .attr("transform", `translate(${mapBoxWidth/2 - 30}, ${-mapBoxHeight/2 - 10})`)
    .style("cursor", "pointer");

closeButton.append("circle")
    .attr("r", 18)
    .attr("fill", "rgba(255, 100, 100, 0.3)")
    .attr("stroke", "#ff6b6b")
    .attr("stroke-width", 2);

closeButton.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("fill", "#ff6b6b")
    .attr("font-size", "22px")
    .attr("font-weight", "bold")
    .text("×");

// Group for the actual map - adjusted position
const expandedMapContent = expandedMapGroup.append("g")
    .attr("class", "expanded-map-content")
    .attr("transform", "translate(0, -20)");

// Group for region markers
const regionMarkers = expandedMapGroup.append("g").attr("class", "region-markers");

// Legend box dimensions
const legendBoxWidth = mapBoxWidth;
const legendBoxHeight = 60;
const legendBoxY = mapBoxHeight/2 - 30;

// Legend box background - SEPARATE BOX BELOW MAP
const legendBox = expandedMapGroup.append("g")
    .attr("class", "legend-box")
    .attr("transform", `translate(0, ${legendBoxY})`);

legendBox.append("rect")
    .attr("x", -legendBoxWidth/2)
    .attr("y", 0)
    .attr("width", legendBoxWidth)
    .attr("height", legendBoxHeight)
    .attr("rx", 10)
    .attr("fill", "rgba(10, 20, 40, 0.95)")
    .attr("stroke", "rgba(255, 150, 100, 0.6)")
    .attr("stroke-width", 2);

// Legend content
const legendContent = legendBox.append("g")
    .attr("transform", `translate(0, ${legendBoxHeight/2})`);

const legendItems = [
    { color: "rgba(255, 107, 53, 0.7)", label: "Pacific Coast" },
    { color: "rgba(100, 200, 255, 0.7)", label: "Atlantic Coast" },
    { color: "rgba(255, 200, 50, 0.7)", label: "Gulf Coast" }
];

const legendSpacing = 200;
const legendStartX = -legendSpacing;

legendItems.forEach((item, i) => {
    const g = legendContent.append("g")
        .attr("transform", `translate(${legendStartX + i * legendSpacing}, 0)`);
    
    g.append("rect")
        .attr("x", -10)
        .attr("y", -10)
        .attr("width", 20)
        .attr("height", 20)
        .attr("rx", 4)
        .attr("fill", item.color)
        .attr("stroke", "rgba(255, 255, 255, 0.6)")
        .attr("stroke-width", 1);
    
    g.append("text")
        .attr("x", 18)
        .attr("y", 5)
        .attr("fill", "rgba(255, 255, 255, 0.9)")
        .attr("font-size", "14px")
        .attr("font-weight", "500")
        .text(item.label);
});

// Info panel for region details - positioned above legend
const infoPanel = expandedMapGroup.append("g")
    .attr("class", "info-panel")
    .attr("transform", `translate(0, ${legendBoxY - 70})`)
    .style("opacity", 0);

infoPanel.append("rect")
    .attr("x", -mapBoxWidth/2 + 20)
    .attr("y", -25)
    .attr("width", mapBoxWidth - 40)
    .attr("height", 60)
    .attr("rx", 8)
    .attr("fill", "rgba(255, 100, 50, 0.2)")
    .attr("stroke", "rgba(255, 150, 100, 0.5)")
    .attr("stroke-width", 1);

const infoTitle = infoPanel.append("text")
    .attr("class", "info-title")
    .attr("x", 0)
    .attr("y", -5)
    .attr("text-anchor", "middle")
    .attr("fill", "#ffa500")
    .attr("font-size", "16px")
    .attr("font-weight", "bold");

const infoText = infoPanel.append("text")
    .attr("class", "info-text")
    .attr("x", 0)
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .attr("fill", "rgba(255, 255, 255, 0.9)")
    .attr("font-size", "13px");

function showRegionInfo(region) {
    infoTitle.text(region.name + " — Base Temp: " + region.baseTemp + "°C");
    
    // Word wrap the info text
    const words = region.info.split(' ');
    let line1 = '';
    let line2 = '';
    let currentLine = 1;
    
    words.forEach(word => {
        if (currentLine === 1 && line1.length + word.length < 100) {
            line1 += (line1 ? ' ' : '') + word;
        } else {
            currentLine = 2;
            line2 += (line2 ? ' ' : '') + word;
        }
    });
    
    infoText.selectAll("tspan").remove();
    infoText.append("tspan").attr("x", 0).attr("dy", 0).text(line1);
    if (line2) {
        infoText.append("tspan").attr("x", 0).attr("dy", "1.2em").text(line2);
    }
    
    infoPanel.transition()
        .duration(300)
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
        
        // Create projection for expanded map - BIGGER SCALE
        const projection = d3.geoAlbersUsa()
            .scale(1000)
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
        // Fallback to simple representation if map fails to load
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
            .attr("fill", "rgba(0, 0, 0, 0.8)");
        
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
    // Simple fallback if TopoJSON fails to load
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