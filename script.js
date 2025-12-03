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
    { name: "Pacific Coast", x: 200, y: 300, baseTemp: 18 },
    { name: "Atlantic Coast", x: 400, y: 280, baseTemp: 16 },
    { name: "Gulf Coast", x: 350, y: 350, baseTemp: 22 },
    { name: "Mediterranean", x: 500, y: 320, baseTemp: 19 }
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

// Create crockpot
const potGroup = svg.append("g").attr("transform", `translate(${width/2}, ${height/2})`);

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
const regionsGroup = svg.append("g");

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

function updateVisualization(step) {
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