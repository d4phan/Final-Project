// Ingredient data
const ingredientsData = [
    { id: 1, name: 'Pacific NW', type: 'Sliced Beef', side: 'spicy', warming: 'High', x: 15, y: 30, color: '#8B4513', originalX: 15, originalY: 30 },
    { id: 2, name: 'California Coast', type: 'Napa Cabbage', side: 'spicy', warming: 'High', x: 25, y: 15, color: '#90EE90', originalX: 25, originalY: 15 },
    { id: 3, name: 'Gulf Coast', type: 'Fish Balls', side: 'spicy', warming: 'High', x: 85, y: 20, color: '#F5DEB3', originalX: 85, originalY: 20 },
    { id: 4, name: 'Atlantic North', type: 'Mushrooms', side: 'bone', warming: 'Moderate', x: 80, y: 70, color: '#D2691E', originalX: 80, originalY: 70 },
    { id: 5, name: 'Atlantic South', type: 'Shrimp', side: 'bone', warming: 'Moderate', x: 70, y: 85, color: '#FFA07A', originalX: 70, originalY: 85 },
    { id: 6, name: 'Mediterranean', type: 'Tofu Slices', side: 'bone', warming: 'Moderate', x: 20, y: 80, color: '#F5F5DC', originalX: 20, originalY: 80 }
];

// Generate fake temperature data
function generateFakeData() {
    return Array.from({ length: 7 }, (_, i) => ({
        year: 2020 + i * 5,
        temp: 15 + Math.random() * 3 + i * 0.5
    }));
}

// State
let currentStep = 0;
let scrollProgress = 0;

// SVG Setup
const svg = d3.select('#hotpot-viz');
const width = 100;
const height = 100;

// Create main groups
const tableGroup = svg.append('g').attr('class', 'table-group');
const potGroup = svg.append('g').attr('class', 'pot-group');
const ingredientsGroup = svg.append('g').attr('class', 'ingredients-group');
const effectsGroup = svg.append('g').attr('class', 'effects-group');

// Draw table surface (darker brown)
tableGroup.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', width)
    .attr('height', height)
    .attr('fill', '#8B4513')
    .attr('opacity', 0.4);

// Draw pot outer ring
const potOuterRing = potGroup.append('circle')
    .attr('class', 'pot-ring')
    .attr('cx', 50)
    .attr('cy', 50)
    .attr('r', 22)
    .style('opacity', 0);

// Draw spicy broth (left half)
const spicyBrothPath = potGroup.append('path')
    .attr('class', 'spicy-broth')
    .attr('d', 'M 50 28 A 22 22 0 0 1 50 72 L 50 50 Z')
    .style('opacity', 0);

// Draw bone broth (right half)
const boneBrothPath = potGroup.append('path')
    .attr('class', 'bone-broth')
    .attr('d', 'M 50 28 A 22 22 0 0 0 50 72 L 50 50 Z')
    .style('opacity', 0);

// Draw spiral divider
const brothDivider = potGroup.append('line')
    .attr('class', 'divider')
    .attr('x1', 50)
    .attr('y1', 28)
    .attr('x2', 50)
    .attr('y2', 72)
    .style('opacity', 0);

// Temperature knob group - positioned at bottom right of pot on the table
const temperatureKnobGroup = svg.append('g')
    .attr('class', 'temp-knob')
    .attr('transform', 'translate(50, 80)')
    .style('opacity', 0);

temperatureKnobGroup.append('circle')
    .attr('class', 'temp-knob-base')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', 4)
    .attr('fill', '#666')
    .attr('stroke', '#333')
    .attr('stroke-width', 0.5);

const temperatureIndicator = temperatureKnobGroup.append('line')
    .attr('class', 'temp-knob-indicator')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', 0)
    .attr('y2', -3.5)
    .attr('stroke', '#D32F2F')
    .attr('stroke-width', 1);

// Add temperature label
temperatureKnobGroup.append('text')
    .attr('x', 0)
    .attr('y', 8)
    .attr('text-anchor', 'middle')
    .attr('font-size', '2.5px')
    .attr('fill', '#333')
    .text('HEAT');

// Draw ingredients
const ingredientCircles = ingredientsGroup.selectAll('.ingredient-group')
    .data(ingredientsData)
    .enter()
    .append('g')
    .attr('class', 'ingredient-group')
    .style('opacity', 0)
    .on('click', function(event, d) {
        showInfoPanel(d);
    });

ingredientCircles.each(function(d) {
    const group = d3.select(this);
    
    if (d.type === 'Fish Balls') {
        // Create pattern for fish ball stripes
        const patternId = `fishball-stripes-${d.id}`;
        
        const defs = svg.append('defs');
        const pattern = defs.append('pattern')
            .attr('id', patternId)
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('width', 8)
            .attr('height', 2);
        
        // Base color
        pattern.append('rect')
            .attr('width', 8)
            .attr('height', 2)
            .attr('fill', d.color);
        
        // Orange/salmon stripes
        pattern.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 8)
            .attr('height', 0.8)
            .attr('fill', '#FF8C69');
        
        // Add circle with pattern
        group.append('circle')
            .attr('class', 'ingredient')
            .attr('cx', d.originalX)
            .attr('cy', d.originalY)
            .attr('r', 4)
            .attr('fill', `url(#${patternId})`);
    } else {
        // Regular solid color circle
        group.append('circle')
            .attr('class', 'ingredient')
            .attr('cx', d.originalX)
            .attr('cy', d.originalY)
            .attr('r', 4)
            .attr('fill', d.color);
    }
});

ingredientCircles.append('text')
    .attr('class', 'ingredient-label')
    .attr('x', d => d.originalX)
    .attr('y', d => d.originalY - 6)
    .text(d => d.type);

// Bubbles (initially hidden)
const bubbleElements = effectsGroup.selectAll('.bubble')
    .data([1, 2, 3, 4, 5])
    .enter()
    .append('circle')
    .attr('class', 'bubble')
    .attr('cx', () => 45 + Math.random() * 10)
    .attr('cy', () => 45 + Math.random() * 10)
    .attr('r', 1)
    .style('opacity', 0);

// Flames at bottom of screen (positioned at bottom of viewport, not table)
const flameGroup = d3.select('body').append('div')
    .attr('class', 'flame-container')
    .style('position', 'fixed')
    .style('bottom', '0')
    .style('left', '0')
    .style('width', '100%')
    .style('height', '150px')
    .style('pointer-events', 'none')
    .style('z-index', '10')
    .style('opacity', 0);

const flameSvg = flameGroup.append('svg')
    .attr('width', '100%')
    .attr('height', '150px')
    .attr('viewBox', '0 0 100 15')
    .attr('preserveAspectRatio', 'none');

const flameElements = flameSvg.selectAll('.flame')
    .data(Array.from({ length: 20 }, (_, i) => i))
    .enter()
    .append('path')
    .attr('class', 'flame')
    .attr('d', (d, i) => {
        const x = i * 5;
        return `M ${x} 15 Q ${x + 1.5} 10 ${x} 5 Q ${x - 1.5} 10 ${x} 15`;
    })
    .attr('fill', '#FF6B35')
    .style('opacity', 0.8);

// Temperature metrics text at bottom of viewport
const metricsContainer = d3.select('body').append('div')
    .attr('class', 'metrics-container')
    .style('position', 'fixed')
    .style('bottom', '160px')
    .style('left', '50%')
    .style('transform', 'translateX(-50%)')
    .style('z-index', '11')
    .style('opacity', 0)
    .style('pointer-events', 'none')
    .style('width', '90%')
    .style('max-width', '900px');

const metricsBox = metricsContainer.append('div')
    .style('background', 'rgba(255, 255, 255, 0.95)')
    .style('padding', '1.5rem 2rem')
    .style('border-radius', '16px')
    .style('box-shadow', '0 4px 20px rgba(0,0,0,0.2)')
    .style('border', '2px solid #D32F2F');

metricsBox.append('h3')
    .style('font-size', '1.5rem')
    .style('font-weight', 'bold')
    .style('color', '#D32F2F')
    .style('margin', '0 0 1rem 0')
    .style('text-align', 'center')
    .text('Global Coastal Warming Trends by 2050');

const metricsGrid = metricsBox.append('div')
    .style('display', 'grid')
    .style('grid-template-columns', 'repeat(3, 1fr)')
    .style('gap', '1.5rem')
    .style('margin-top', '1rem');

// Metric cards
const metrics = [
    { label: 'Average Temperature Rise', value: '+2.5°C', icon: '🌡️' },
    { label: 'Sea Level Rise', value: '+30cm', icon: '🌊' },
    { label: 'Affected Coastal Regions', value: '87%', icon: '🌍' }
];

metrics.forEach(metric => {
    const card = metricsGrid.append('div')
        .style('text-align', 'center')
        .style('padding', '0.75rem')
        .style('background', '#FFF3E0')
        .style('border-radius', '8px');
    
    card.append('div')
        .style('font-size', '2rem')
        .style('margin-bottom', '0.5rem')
        .text(metric.icon);
    
    card.append('div')
        .style('font-size', '1.8rem')
        .style('font-weight', 'bold')
        .style('color', '#D32F2F')
        .style('margin-bottom', '0.25rem')
        .text(metric.value);
    
    card.append('div')
        .style('font-size', '0.9rem')
        .style('color', '#666')
        .text(metric.label);
});

// Scrollama setup
const scroller = scrollama();

scroller
    .setup({
        step: '.step',
        offset: 0.5,
        progress: true
    })
    .onStepEnter(response => {
        const newStep = response.index;
        const isScrollingUp = newStep < currentStep;
        
        currentStep = newStep;
        
        // Handle reverse animations when scrolling up
        if (isScrollingUp) {
            if (currentStep === 3 && response.direction === 'up') {
                returnIngredientsToTable();
            }
            if (currentStep < 5) {
                flameGroup.transition().duration(500).style('opacity', 0);
                metricsContainer.transition().duration(500).style('opacity', 0);
            }
            if (currentStep < 2) {
                temperatureKnobGroup.transition().duration(500).style('opacity', 0);
                temperatureIndicator.attr('transform', 'rotate(0)');
            }
            if (currentStep < 1) {
                potOuterRing.transition().duration(500).style('opacity', 0);
                spicyBrothPath.transition().duration(500).style('opacity', 0);
                boneBrothPath.transition().duration(500).style('opacity', 0);
                brothDivider.transition().duration(500).style('opacity', 0);
            }
        }
        
        updateVisualization();
    })
    .onStepProgress(response => {
        scrollProgress = response.progress;
        updateScrollProgress();
    });

// Update visualization based on step
function updateVisualization() {
    switch(currentStep) {
        case 0:
            resetVisualization();
            break;
        case 1:
            showIngredients();
            break;
        case 2:
            fillBroths();
            showTemperatureKnob(); // Show knob when broths fill
            break;
        case 3:
            maintainBrothsAndKnob();
            break;
        case 4:
            dropIngredients();
            break;
        case 5:
            fullBoil();
            break;
    }
}

// Update based on scroll progress
function updateScrollProgress() {
    // Rotate temperature knob - 60 degrees per step starting from step 2
    if (currentStep >= 2) {
        const stepRotation = (currentStep - 2) * 60; // Base rotation for current step
        const progressRotation = scrollProgress * 60; // Additional rotation based on progress within step
        const totalRotation = Math.min(stepRotation + progressRotation, 360); // Cap at 360
        temperatureIndicator.attr('transform', `rotate(${totalRotation})`);
    } else {
        // Reset rotation when scrolling back to steps 0-1
        temperatureIndicator.attr('transform', 'rotate(0)');
    }
}

// Step functions
function resetVisualization() {
    // Reset ingredients to table
    ingredientCircles.transition().duration(500).style('opacity', 0);
    ingredientCircles.selectAll('.ingredient')
        .transition()
        .duration(500)
        .attr('cx', d => d.originalX)
        .attr('cy', d => d.originalY)
        .attr('r', 4);
    ingredientCircles.selectAll('.ingredient-label')
        .transition()
        .duration(500)
        .attr('x', d => d.originalX)
        .attr('y', d => d.originalY - 6)
        .style('opacity', 0);
    potGroup.selectAll('*').transition().duration(500).style('opacity', 0);
    effectsGroup.selectAll('*').transition().duration(500).style('opacity', 0);
    temperatureKnobGroup.transition().duration(500).style('opacity', 0);
    flameGroup.transition().duration(500).style('opacity', 0);
    metricsContainer.transition().duration(500).style('opacity', 0);
    
    // Reset temperature knob rotation
    temperatureIndicator.attr('transform', 'rotate(0)');
}

function showIngredients() {
    potOuterRing.transition().duration(800).style('opacity', 1);
    
    ingredientCircles.each(function(d, i) {
        const element = d3.select(this);
        element
            .transition()
            .delay(i * 100)
            .duration(800)
            .style('opacity', 1);
        
        // Show labels when on table
        element.select('.ingredient-label')
            .transition()
            .delay(i * 100)
            .duration(800)
            .style('opacity', 1);
    });
}

function fillBroths() {
    spicyBrothPath
        .transition()
        .duration(1000)
        .style('opacity', 0.8);
    
    boneBrothPath
        .transition()
        .delay(300)
        .duration(1000)
        .style('opacity', 0.9);
    
    brothDivider
        .transition()
        .delay(600)
        .duration(500)
        .style('opacity', 1);
    
    // Keep ingredients visible on table
    ingredientCircles.style('opacity', 1);
    ingredientCircles.selectAll('.ingredient-label')
        .style('opacity', 1);
}

function showTemperatureKnob() {
    temperatureKnobGroup
        .transition()
        .duration(800)
        .style('opacity', 1);
}

function maintainBrothsAndKnob() {
    // Keep everything from previous steps visible
    potOuterRing.style('opacity', 1);
    spicyBrothPath.style('opacity', 0.8);
    boneBrothPath.style('opacity', 0.9);
    brothDivider.style('opacity', 1);
    temperatureKnobGroup.style('opacity', 1);
    ingredientCircles.style('opacity', 1);
    ingredientCircles.selectAll('.ingredient-label').style('opacity', 1);
}

function dropIngredients() {
    // Hide labels
    ingredientCircles.selectAll('.ingredient-label')
        .transition()
        .duration(500)
        .style('opacity', 0);
    
    // Calculate positions to fit all ingredients in pot
    const potCenterX = 50;
    const potCenterY = 50;
    
    // Separate ingredients by side
    const spicyIngredients = ingredientsData.filter(d => d.side === 'spicy');
    const boneIngredients = ingredientsData.filter(d => d.side === 'bone');
    
    // Move spicy side ingredients (left)
    spicyIngredients.forEach((d, i) => {
        const totalSpicy = spicyIngredients.length;
        const radius = 14;
        
        // Vertical distribution from top to bottom
        const yPositions = [40, 50, 60];
        const xOffset = -8;
        
        d.x = potCenterX + xOffset;
        d.y = yPositions[i];
        d.inPot = true; // Track that ingredient is in pot
        
        const element = ingredientCircles.filter(ing => ing.id === d.id);
        element.select('.ingredient')
            .transition()
            .delay(i * 150)
            .duration(800)
            .ease(d3.easeBounceOut)
            .attr('cx', d.x)
            .attr('cy', d.y)
            .attr('r', 2.5);
    });
    
    // Move bone broth side ingredients (right)
    boneIngredients.forEach((d, i) => {
        const totalBone = boneIngredients.length;
        const radius = 14;
        
        // Vertical distribution from top to bottom
        const yPositions = [40, 50, 60];
        const xOffset = 8;
        
        d.x = potCenterX + xOffset;
        d.y = yPositions[i];
        d.inPot = true; // Track that ingredient is in pot
        
        const element = ingredientCircles.filter(ing => ing.id === d.id);
        element.select('.ingredient')
            .transition()
            .delay((spicyIngredients.length + i) * 150)
            .duration(800)
            .ease(d3.easeBounceOut)
            .attr('cx', d.x)
            .attr('cy', d.y)
            .attr('r', 2.5);
    });
    
    // Keep broths and knob visible
    potOuterRing.style('opacity', 1);
    spicyBrothPath.style('opacity', 0.8);
    boneBrothPath.style('opacity', 0.9);
    brothDivider.style('opacity', 1);
    temperatureKnobGroup.style('opacity', 1);
}

function returnIngredientsToTable() {
    // Show labels again
    ingredientCircles.selectAll('.ingredient-label')
        .transition()
        .duration(500)
        .style('opacity', 1);
    
    // Move ingredients back to table
    ingredientsData.forEach((d, i) => {
        d.inPot = false;
        
        const element = ingredientCircles.filter(ing => ing.id === d.id);
        element.select('.ingredient')
            .transition()
            .delay(i * 100)
            .duration(800)
            .ease(d3.easeBackOut)
            .attr('cx', d.originalX)
            .attr('cy', d.originalY)
            .attr('r', 4);
    });
    
    // Hide bubbles when returning to step 3
    bubbleElements.transition().duration(300).style('opacity', 0);
}

function fullBoil() {
    // Animate bubbles
    bubbleElements
        .style('opacity', 0.6)
        .each(function(d, i) {
            d3.select(this)
                .attr('cy', 45 + Math.random() * 10)
                .transition()
                .duration(2000)
                .ease(d3.easeLinear)
                .delay(i * 300)
                .attr('cy', 35)
                .style('opacity', 0)
                .on('end', function repeat() {
                    if (currentStep === 5) { // Only continue if still on last step
                        d3.select(this)
                            .attr('cy', 45 + Math.random() * 10)
                            .style('opacity', 0.6)
                            .transition()
                            .duration(2000)
                            .ease(d3.easeLinear)
                            .attr('cy', 35)
                            .style('opacity', 0)
                            .on('end', repeat);
                    }
                });
        });
    
    // Show flame group at bottom of viewport
    flameGroup
        .transition()
        .duration(800)
        .style('opacity', 1);
    
    // Animate flames along bottom
    flameElements
        .each(function(d, i) {
            const flame = d3.select(this);
            function flicker() {
                if (currentStep === 5) { // Only continue if still on last step
                    flame
                        .transition()
                        .duration(400 + Math.random() * 200)
                        .ease(d3.easeSinInOut)
                        .attr('transform', `scale(1, ${1.2 + Math.random() * 0.3})`)
                        .transition()
                        .duration(400 + Math.random() * 200)
                        .ease(d3.easeSinInOut)
                        .attr('transform', 'scale(1, 1)')
                        .on('end', flicker);
                }
            }
            setTimeout(() => flicker(), i * 50);
        });
    
    // Show metrics at bottom of viewport
    metricsContainer
        .transition()
        .delay(500)
        .duration(800)
        .style('opacity', 1);
}

// Info Panel Functions
function showInfoPanel(ingredient) {
    const panel = d3.select('#info-panel');
    const overlay = d3.select('#panel-overlay');
    
    // Set content
    d3.select('#panel-title').text(ingredient.name);
    
    const badge = d3.select('#panel-badge');
    badge.html(`<span class="badge ${ingredient.warming.toLowerCase()}">${ingredient.warming} Warming</span>`);
    
    const description = ingredient.warming === 'High' 
        ? 'This region is experiencing accelerated warming, with temperatures rising faster than the global average. Coastal communities face increased risks from sea level rise and extreme weather events.'
        : 'This region shows moderate warming trends. While changes are occurring, the rate of warming is closer to global averages, though impacts on coastal ecosystems remain significant.';
    
    d3.select('#panel-description').text(description);
    d3.select('#panel-ingredient').text(`Ingredient: ${ingredient.type}`);
    
    // Draw chart
    drawChart(ingredient);
    
    // Show panel
    panel.classed('active', true);
    overlay.classed('active', true);
}

function hideInfoPanel() {
    d3.select('#info-panel').classed('active', false);
    d3.select('#panel-overlay').classed('active', false);
}

// Draw temperature chart
function drawChart(ingredient) {
    const data = generateFakeData();
    const chartSvg = d3.select('#panel-chart');
    chartSvg.selectAll('*').remove();
    
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 360 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;
    
    const g = chartSvg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Scales
    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.year))
        .range([0, width]);
    
    const y = d3.scaleLinear()
        .domain([d3.min(data, d => d.temp) - 1, d3.max(data, d => d.temp) + 1])
        .range([height, 0]);
    
    // Line generator
    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.temp));
    
    // Draw axes
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format('d')))
        .style('color', '#666');
    
    g.append('g')
        .call(d3.axisLeft(y).ticks(5))
        .style('color', '#666');
    
    // Draw line
    const lineColor = ingredient.warming === 'High' ? '#D32F2F' : '#F57C00';
    
    g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', lineColor)
        .attr('stroke-width', 2)
        .attr('d', line);
    
    // Draw dots
    g.selectAll('.dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', d => x(d.year))
        .attr('cy', d => y(d.temp))
        .attr('r', 4)
        .attr('fill', lineColor);
}

// Event listeners
d3.select('#close-panel').on('click', hideInfoPanel);
d3.select('#panel-overlay').on('click', hideInfoPanel);

// Close panel on scroll
let lastScrollY = window.scrollY;
window.addEventListener('scroll', () => {
    if (Math.abs(window.scrollY - lastScrollY) > 100) {
        hideInfoPanel();
        lastScrollY = window.scrollY;
    }
});

// Window resize
window.addEventListener('resize', scroller.resize);