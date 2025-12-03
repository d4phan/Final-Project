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

// Fake data for coastal regions
const coastalRegions = [
    { 
        name: "Pacific Coast", 
        baseTemp: 18,
        info: "The Pacific Coast stretches from Alaska to California, experiencing significant warming trends. Rising ocean temperatures are affecting marine ecosystems and coastal communities.",
        coordinates: { x: 80, y: 180 },
        mapCoords: { x: 0.12, y: 0.35 }
    },
    { 
        name: "Atlantic Coast", 
        baseTemp: 16,
        info: "The Atlantic Coast from Maine to Florida faces increasing hurricane intensity and sea level rise. Coastal erosion threatens infrastructure and habitats.",
        coordinates: { x: 420, y: 200 },
        mapCoords: { x: 0.85, y: 0.4 }
    },
    { 
        name: "Gulf Coast", 
        baseTemp: 22,
        info: "The Gulf Coast experiences some of the fastest warming rates. Wetland loss, intensified storms, and heat waves pose major challenges to this region.",
        coordinates: { x: 300, y: 320 },
        mapCoords: { x: 0.55, y: 0.65 }
    },
    { 
        name: "Mediterranean", 
        baseTemp: 19,
        info: "Mediterranean climate zones in California are shifting toward more extreme dry heat conditions, increasing wildfire risk and water scarcity.",
        coordinates: { x: 100, y: 220 },
        mapCoords: { x: 0.15, y: 0.45 }
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

// Draw simplified US map outline in minimap
const minimapContent = minimapGroup.append("g").attr("class", "minimap-content");

// Simplified US coastline path
const usOutlinePath = "M 20,40 Q 25,35 30,38 L 35,42 Q 40,40 45,45 L 50,50 Q 55,48 60,52 L 70,55 Q 80,50 90,55 L 100,58 Q 110,55 120,60 L 130,65 Q 125,75 120,85 L 115,95 Q 105,100 95,95 L 85,90 Q 75,95 65,90 L 55,85 Q 45,90 35,85 L 25,75 Q 20,65 20,55 Z";

minimapContent.append("path")
    .attr("d", usOutlinePath)
    .attr("fill", "rgba(100, 150, 200, 0.3)")
    .attr("stroke", "rgba(150, 200, 255, 0.6)")
    .attr("stroke-width", 1);

// Add coastal region dots to minimap
coastalRegions.forEach(region => {
    minimapContent.append("circle")
        .attr("cx", 20 + region.mapCoords.x * 110)
        .attr("cy", 30 + region.mapCoords.y * 80)
        .attr("r", 4)
        .attr("fill", "#ff6b35")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);
});

// Create expanded map group (initially hidden)
const expandedMapGroup = svg.append("g")
    .attr("class", "expanded-map-group")
    .attr("transform", `translate(${width/2}, ${height/2})`)
    .style("opacity", 0)
    .style("pointer-events", "none");

// Expanded map background
expandedMapGroup.append("rect")
    .attr("x", -300)
    .attr("y", -220)
    .attr("width", 600)
    .attr("height", 440)
    .attr("rx", 15)
    .attr("fill", "rgba(10, 20, 40, 0.95)")
    .attr("stroke", "rgba(255, 150, 100, 0.6)")
    .attr("stroke-width", 3);

// Expanded map title
expandedMapGroup.append("text")
    .attr("x", 0)
    .attr("y", -180)
    .attr("text-anchor", "middle")
    .attr("fill", "#ffa500")
    .attr("font-size", "24px")
    .attr("font-family", "'Playfair Display', serif")
    .text("Coastal Regions at Risk");

// Close button for expanded map
const closeButton = expandedMapGroup.append("g")
    .attr("class", "close-button")
    .attr("transform", "translate(270, -190)")
    .style("cursor", "pointer");

closeButton.append("circle")
    .attr("r", 15)
    .attr("fill", "rgba(255, 100, 100, 0.3)")
    .attr("stroke", "#ff6b6b")
    .attr("stroke-width", 2);

closeButton.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("fill", "#ff6b6b")
    .attr("font-size", "18px")
    .attr("font-weight", "bold")
    .text("×");

// Draw larger US map in expanded view
const expandedMapContent = expandedMapGroup.append("g").attr("class", "expanded-map-content");

// Larger US outline
const largeUsPath = "M -250,-100 Q -230,-120 -200,-110 L -150,-90 Q -100,-100 -50,-80 L 0,-70 Q 50,-85 100,-70 L 150,-60 Q 200,-75 250,-55 L 280,-40 Q 270,0 260,50 L 250,100 Q 200,130 150,120 L 100,100 Q 50,120 0,110 L -50,90 Q -100,110 -150,100 L -200,70 Q -240,40 -250,0 Z";

expandedMapContent.append("path")
    .attr("d", largeUsPath)
    .attr("fill", "rgba(100, 150, 200, 0.2)")
    .attr("stroke", "rgba(150, 200, 255, 0.5)")
    .attr("stroke-width", 2);

// Add coastline highlights
const coastlines = [
    { path: "M -250,-100 Q -245,-50 -250,0 L -240,50", name: "Pacific" },
    { path: "M 250,-55 Q 270,-20 260,50 L 250,100 Q 220,120 180,110", name: "Atlantic" },
    { path: "M 180,110 Q 100,130 20,120 L -50,100", name: "Gulf" }
];

coastlines.forEach(coast => {
    expandedMapContent.append("path")
        .attr("d", coast.path)
        .attr("fill", "none")
        .attr("stroke", "#ff6b35")
        .attr("stroke-width", 4)
        .attr("stroke-linecap", "round")
        .attr("opacity", 0.7);
});

// Add interactive region markers on expanded map
const regionMarkers = expandedMapGroup.append("g").attr("class", "region-markers");

const markerPositions = [
    { region: coastalRegions[0], x: -240, y: -30 },  // Pacific
    { region: coastalRegions[1], x: 250, y: 30 },    // Atlantic
    { region: coastalRegions[2], x: 80, y: 100 },    // Gulf
    { region: coastalRegions[3], x: -220, y: 20 }    // Mediterranean
];

markerPositions.forEach(marker => {
    const markerGroup = regionMarkers.append("g")
        .attr("class", "region-marker")
        .attr("transform", `translate(${marker.x}, ${marker.y})`)
        .style("cursor", "pointer");
    
    // Pulsing outer ring
    markerGroup.append("circle")
        .attr("class", "pulse-ring")
        .attr("r", 15)
        .attr("fill", "none")
        .attr("stroke", "#ff6b35")
        .attr("stroke-width", 2)
        .attr("opacity", 0.5);
    
    // Main marker
    markerGroup.append("circle")
        .attr("class", "marker-dot")
        .attr("r", 10)
        .attr("fill", "#ff6b35")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);
    
    // Label
    markerGroup.append("text")
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(marker.region.name);
    
    // Click handler for region info
    markerGroup.on("click", function(event) {
        event.stopPropagation();
        showRegionInfo(marker.region);
    });
    
    // Hover effects
    markerGroup.on("mouseenter", function() {
        d3.select(this).select(".marker-dot")
            .transition()
            .duration(200)
            .attr("r", 14)
            .attr("fill", "#ffcc00");
        d3.select(this).select(".pulse-ring")
            .transition()
            .duration(200)
            .attr("r", 20)
            .attr("opacity", 0.8);
    });
    
    markerGroup.on("mouseleave", function() {
        d3.select(this).select(".marker-dot")
            .transition()
            .duration(200)
            .attr("r", 10)
            .attr("fill", "#ff6b35");
        d3.select(this).select(".pulse-ring")
            .transition()
            .duration(200)
            .attr("r", 15)
            .attr("opacity", 0.5);
    });
});

// Info panel for region details
const infoPanel = expandedMapGroup.append("g")
    .attr("class", "info-panel")
    .attr("transform", "translate(0, 160)")
    .style("opacity", 0);

infoPanel.append("rect")
    .attr("x", -250)
    .attr("y", -30)
    .attr("width", 500)
    .attr("height", 70)
    .attr("rx", 8)
    .attr("fill", "rgba(255, 100, 50, 0.15)")
    .attr("stroke", "rgba(255, 150, 100, 0.4)")
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
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("fill", "rgba(255, 255, 255, 0.85)")
    .attr("font-size", "13px");

function showRegionInfo(region) {
    infoTitle.text(region.name + " — Base Temp: " + region.baseTemp + "°C");
    
    // Word wrap the info text
    const words = region.info.split(' ');
    let line1 = '';
    let line2 = '';
    let currentLine = 1;
    
    words.forEach(word => {
        if (currentLine === 1 && line1.length + word.length < 70) {
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

// Add pulsing animation to minimap markers
function pulseMarkers() {
    regionMarkers.selectAll(".pulse-ring")
        .transition()
        .duration(1000)
        .attr("r", 20)
        .attr("opacity", 0.2)
        .transition()
        .duration(1000)
        .attr("r", 15)
        .attr("opacity", 0.5)
        .on("end", pulseMarkers);
}
pulseMarkers();

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