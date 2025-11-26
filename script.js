// Sample data based on coastal_regions_real_data.json
const years = Array.from({length: 25}, (_, i) => 1850 + i * 10); 

// Temperature data (simplified - use actual JSON data)
const tempSoCal = [17.3, 17.4, 17.5, 17.7, 17.9, 18.2, 18.6, 19.1, 19.5, 19.9, 20.3, 20.7, 21.1, 21.3, 21.5, 21.6, 21.7, 21.8, 21.9, 22.0, 22.1, 22.2, 22.3, 22.4, 21.5];
const precipSoCal = Array(25).fill(9.3e-6); 

const tempEast = [25.3, 25.4, 25.5, 25.7, 25.9, 26.2, 26.5, 26.7, 27.0, 27.4, 27.8, 28.2, 28.6, 28.8, 29.0, 29.1, 29.2, 29.3, 29.4, 29.5, 29.6, 29.7, 29.8, 29.9, 29.1];
const precipEast = Array(25).fill(3.7e-5); 

//Main visualization
Plotly.newPlot('chart', [
  {
    x: years,
    y: tempSoCal,
    name: 'Southern California Temp (°C)',
    type: 'scatter',
    mode: 'lines+markers',
    line: {color: '#e67e22', width: 3},
    marker: {size: 6}
  },
  {
    x: years,
    y: tempEast,
    name: 'East Coast Temp (°C)',
    type: 'scatter',
    mode: 'lines+markers',
    line: {color: '#c0392b', width: 3},
    marker: {size: 6}
  }
], {
  title: {
    text: 'Temperature Trends: Coastal Zones (1850–2100)',
    font: {size: 20, color: '#1a4a6a'}
  },
  xaxis: {
    title: 'Year',
    tickfont: {size: 12}
  },
  yaxis: {
    title: 'Temperature (°C)',
    tickfont: {size: 12}
  },
  legend: {
    x: 0.5,
    xanchor: 'center',
    y: 1.15,
    orientation: 'h'
  },
  annotations: [{
    x: 2025,
    y: 20,
    text: '← Predicted Data Begins',
    showarrow: true,
    arrowhead: 2,
    ax: -60,
    ay: -40,
    font: {size: 12, color: '#667eea'}
  }],
  plot_bgcolor: '#f9f9f9',
  paper_bgcolor: '#ffffff'
});
