// document.addEventListener('DOMContentLoaded', function() {
//     const farmerForm = document.getElementById('farmerForm');
//     let previousCropsChart = null;


//     farmerForm.addEventListener('submit', async function(e) {
//         e.preventDefault();
        
//         // Get all form data
//         const formInputs = {
//             name: document.getElementById('name'),
//             location: document.getElementById('location'),
//             temperature: document.getElementById('temperature'),
//             humidity: document.getElementById('humidity'),
//             rainfall: document.getElementById('rainfall'),
//             soil_n: document.getElementById('soil_n'),
//             soil_p: document.getElementById('soil_p'),
//             soil_k: document.getElementById('soil_k'),
//             soil_ph: document.getElementById('soil_ph'),
//             area: document.getElementById('area'),
//             soil_fertility: document.getElementById('soil_fertility'),
//             irrigation_level: document.getElementById('irrigation_level')
//         };

//         // Reset form validation
//         Object.values(formInputs).forEach(input => {
//             input.classList.remove('is-invalid');
//         });

//         // Validate form inputs
//         let hasError = false;
//         const formData = {};

//         Object.entries(formInputs).forEach(([key, input]) => {
//             if (!input.value.trim()) {
//                 input.classList.add('is-invalid');
//                 hasError = true;
//                 return;
//             }

//             if (key !== 'name' && key !== 'location') {
//                 const value = parseFloat(input.value);
//                 if (isNaN(value)) {
//                     input.classList.add('is-invalid');
//                     hasError = true;
//                     return;
//                 }
//                 formData[key] = value;
//             } else {
//                 formData[key] = input.value.trim();
//             }
//         });

//         if (hasError) {
//             showError('error-container', 'Please fill in all required fields correctly.');
//             return;
//         }

//         // Clear previous error messages
//         document.getElementById('error-container')?.remove();

//         try {
//             // Show loading states
//             ['weatherInfo', 'cropRecommendations', 'yieldPredictions', 'previousCropsChart'].forEach(id => {
//                 showLoading(id);
//             });
            
//             // Fetch all data in parallel
//             const [weatherRes, recRes, yieldRes, histRes] = await Promise.all([
//                 getWeatherData(formData.location),
//                 getCropRecommendations(formData),
//                 getYieldPredictions(formData),
//                 getPreviousCrops(formData.location)
//             ]);

//             // register field and check irrigation once we have a crop
//             if (formData.name && formData.location && recRes && recRes.recommendations && recRes.recommendations.length) {
//                 const cropType = recRes.recommendations[0].name;
//                 await registerField(formData.name, formData.location, cropType);
//                 await checkIrrigation(formData.name, 0);
//             }

//             // Smooth scroll to results
//             document.getElementById('results').scrollIntoView({ 
//                 behavior: 'smooth', 
//                 block: 'start'
//             });
//         } catch (error) {
//             console.error('Error:', error);
//             showError('error-container', 'An error occurred while processing your request. Please try again.');
//             handleNetworkError(error);
//         }
//     });

//     async function getWeatherData(location) {
//         try {
//             const response = await fetch('/get_weather', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Accept': 'application/json'
//                 },
//                 body: JSON.stringify({ location })
//             });

//             if (!response.ok) {
//                 throw new Error('Failed to fetch weather data');
//             }

//             const data = await response.json();
//             displayWeatherInfo(data);
//             return data; // allow caller to use
//         } catch (error) {
//             console.error('Weather Error:', error);
//             document.getElementById('weatherInfo').innerHTML = `
//                 <div class="alert alert-danger">
//                     <div class="d-flex align-items-center">
//                         <i class="fas fa-exclamation-circle me-2"></i>
//                         ${error.message || 'Failed to fetch weather data. Please try again.'}
//                     </div>
//                 </div>`;
//             return null;
//         }
//     }

//     function displayWeatherInfo(data) {
//         const weatherInfo = document.getElementById('weatherInfo');
//         weatherInfo.innerHTML = `
//             <div class="weather-details">
//                 <div class="weather-item">
//                     <h4>Temperature</h4>
//                     <p>${data.temperature}°C</p>
//                 </div>
//                 <div class="weather-item">
//                     <h4>Humidity</h4>
//                     <p>${data.humidity}%</p>
//                 </div>
//                 <div class="weather-item">
//                     <h4>Rainfall</h4>
//                     <p>${data.rainfall || 0} mm</p>
//                 </div>
//             </div>
//         `;
//     }

//     async function getCropRecommendations(formData) {
//         try {
//             const response = await fetch('/recommend_crop', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Accept': 'application/json'
//                 },
//                 body: JSON.stringify(formData)
//             });

//             if (!response.ok) {
//                 throw new Error('Failed to get crop recommendations');
//             }

//             const data = await response.json();
//             displayCropRecommendations(data);
//             return data;
//         } catch (error) {
//             console.error('Recommendations Error:', error);
//             document.getElementById('cropRecommendations').innerHTML = `
//                 <div class="alert alert-danger">
//                     <div class="d-flex align-items-center">
//                         <i class="fas fa-exclamation-circle me-2"></i>
//                         ${error.message || 'Failed to get recommendations. Please try again.'}
//                     </div>
//                 </div>`;
//             return null;
//         }
//     }

//     function displayCropRecommendations(data) {
//         const recommendationsDiv = document.getElementById('cropRecommendations');

//         // Guard against unexpected response shapes
//         if (!data || !Array.isArray(data.recommendations)) {
//             recommendationsDiv.innerHTML = '<p class="text-danger">No crop recommendations available at this time.</p>';
//             return;
//         }

//         if (data.recommendations.length === 0) {
//             recommendationsDiv.innerHTML = '<p class="text-warning">No crops satisfy the current conditions.</p>';
//             return;
//         }

//         let html = '<div class="recommendations-list">';
        
//         data.recommendations.forEach((crop, index) => {
//             const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
//             html += `
//                 <div class="recommendation-card">
//                     <h4>${medal} ${crop.name}</h4>
//                     <p class="confidence">Confidence: <strong>${crop.confidence.toFixed(1)}%</strong></p>
//                     <p class="description">${crop.description || 'No description available.'}</p>
//                     <div class="crop-details">
//                         <div class="detail-item">
//                             <i class="fas fa-temperature-high"></i>
//                             <span>Optimal Temperature: ${crop.optimal_temp}°C</span>
//                         </div>
//                         <div class="detail-item">
//                             <i class="fas fa-cloud-rain"></i>
//                             <span>Required Rainfall: ${crop.required_rainfall} mm</span>
//                         </div>
//                         <div class="detail-item">
//                             <i class="fas fa-clock"></i>
//                             <span>Growing Period: ${crop.growing_period} days</span>
//                         </div>
//                     </div>
//                 </div>
//             `;
//         });

//         html += '</div>';
//         recommendationsDiv.innerHTML = html;
//     }

//     async function getYieldPredictions(formData) {
//         try {
//             const response = await fetch('/predict_yield', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Accept': 'application/json'
//                 },
//                 body: JSON.stringify(formData)
//             });

//             if (!response.ok) {
//                 throw new Error('Failed to get yield predictions');
//             }

//             const data = await response.json();
//             displayYieldPredictions(data);
//             return data;
//         } catch (error) {
//             console.error('Yield Prediction Error:', error);
//             document.getElementById('yieldPredictions').innerHTML = `
//                 <div class="alert alert-danger">
//                     <div class="d-flex align-items-center">
//                         <i class="fas fa-exclamation-circle me-2"></i>
//                         ${error.message || 'Failed to get yield predictions. Please try again.'}
//                     </div>
//                 </div>`;
//             return null;
//         }
//     }

//     function displayYieldPredictions(data) {
//         const predictionsDiv = document.getElementById('yieldPredictions');

//         if (!data || !Array.isArray(data.predictions)) {
//             predictionsDiv.innerHTML = '<p class="text-danger">Yield predictions are not available.</p>';
//             return;
//         }

//         if (data.predictions.length === 0) {
//             predictionsDiv.innerHTML = '<p class="text-warning">No yield predictions returned.</p>';
//             return;
//         }

//         let html = `
//             <div class="yield-predictions">
//                 <h4 class="mb-4">Expected Yield Predictions</h4>
//                 <div class="table-responsive">
//                     <table class="table table-hover">
//                         <thead>
//                             <tr>
//                                 <th>Crop</th>
//                                 <th>Predicted Yield</th>
//                                 <th>Confidence</th>
//                                 <th>Return on Investment</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//         `;

//         data.predictions.forEach(prediction => {
//             const roiClass = prediction.roi >= 0 ? 'text-success' : 'text-danger';
//             const roiSymbol = prediction.roi >= 0 ? '+' : '';

//             html += `
//                 <tr>
//                     <td>${prediction.crop}</td>
//                     <td>${prediction.yield.toLocaleString()} kg/ha</td>
//                     <td>
//                         <div class="progress">
//                             <div class="progress-bar bg-success" role="progressbar" 
//                                 style="width: ${prediction.confidence}%" 
//                                 aria-valuenow="${prediction.confidence}" 
//                                 aria-valuemin="0" 
//                                 aria-valuemax="100">
//                                 ${prediction.confidence}%
//                             </div>
//                         </div>
//                     </td>
//                     <td class="${roiClass}">${roiSymbol}${prediction.roi}%</td>
//                 </tr>
//             `;
//         });

//         html += `
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         `;

//         predictionsDiv.innerHTML = html;
//     }

//     async function getPreviousCrops(location) {
//         try {
//             const response = await fetch('/previous_crops', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Accept': 'application/json'
//                 },
//                 body: JSON.stringify({ 
//                     location: location,
//                     years: 5  // Request last 5 years of data
//                 })
//             });

//             if (!response.ok) {
//                 const errorData = await response.json().catch(() => ({}));
//                 throw new Error(errorData.error || 'Failed to fetch crop history');
//             }

//             const data = await response.json();
            
//             // Validate the data structure
//             if (!data || !Array.isArray(data.years) || !Array.isArray(data.crops) || !Array.isArray(data.yields)) {
//                 throw new Error('Invalid data format received from server');
//             }

//             // Make sure all arrays have the same length
//             if (data.years.length !== data.crops.length || data.years.length !== data.yields.length) {
//                 throw new Error('Inconsistent data received from server');
//             }

//             // Sort data by year in descending order
//             const indices = data.years.map((_, index) => index);
//             indices.sort((a, b) => data.years[b] - data.years[a]);

//             data.years = indices.map(i => data.years[i]);
//             data.crops = indices.map(i => data.crops[i]);
//             data.yields = indices.map(i => data.yields[i]);

//             displayPreviousCrops(data);
//             displayCropHistory(data);
//             return data;
//         } catch (error) {
//             console.error('History Error:', error);
//             const errorMessage = `
//                 <div class="alert alert-danger">
//                     <div class="d-flex align-items-center">
//                         <i class="fas fa-exclamation-circle me-2"></i>
//                         ${error.message || 'Failed to fetch historical data. Please try again.'}
//                     </div>
//                 </div>`;
//             document.getElementById('previousCropsChart').innerHTML = errorMessage;
//             document.getElementById('cropHistory').innerHTML = errorMessage;
            
//             // Clear any previous chart if it exists
//             if (previousCropsChart) {
//                 previousCropsChart.destroy();
//                 previousCropsChart = null;
//             }
//             return null;
//         }
//     }

//     function displayCropHistory(data) {
//         const historyDiv = document.getElementById('cropHistory');
//         let historyHTML = `
//             <div class="crop-history-table mt-4">
//                 <h4>Crop History for ${data.location}</h4>
//                 <div class="table-responsive">
//                     <table class="table table-hover">
//                         <thead>
//                             <tr>
//                                 <th>Year</th>
//                                 <th>Crop</th>
//                                 <th>Yield (kg/hectare)</th>
//                                 <th>Performance</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//         `;

//         // Calculate average yield for performance comparison
//         const avgYield = data.yields.reduce((a, b) => a + b, 0) / data.yields.length;

//         data.years.forEach((year, index) => {
//             const performance = data.yields[index] >= avgYield ? 
//                 '<span class="badge bg-success">Above Average</span>' : 
//                 '<span class="badge bg-warning">Below Average</span>';

//             const cropIcon = getCropIcon(data.crops[index]);

//             historyHTML += `
//                 <tr>
//                     <td>${year}</td>
//                     <td>
//                         <img src="${cropIcon}" alt="${data.crops[index]}" class="crop-icon me-2" width="24" height="24" />
//                         ${data.crops[index].charAt(0).toUpperCase() + data.crops[index].slice(1)}
//                     </td>
//                     <td>${data.yields[index].toLocaleString()}</td>
//                     <td>${performance}</td>
//                 </tr>
//             `;
//         });

//         historyHTML += `
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         `;

//         historyDiv.innerHTML = historyHTML;
//     }

//     function displayPreviousCrops(data) {
//         const ctx = document.getElementById('previousCropsChart').getContext('2d');
        
//         if (previousCropsChart) {
//             previousCropsChart.destroy();
//         }

//         // Clear the chart area first
//         ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

//         // Enhanced color scheme with transparency for better visibility
//         const cropColors = {
//             'rice': {
//                 border: '#27ae60',
//                 background: 'rgba(39, 174, 96, 0.1)',
//                 hover: 'rgba(39, 174, 96, 0.2)'
//             },
//             'wheat': {
//                 border: '#f1c40f',
//                 background: 'rgba(241, 196, 15, 0.1)',
//                 hover: 'rgba(241, 196, 15, 0.2)'
//             },
//             'cotton': {
//                 border: '#e74c3c',
//                 background: 'rgba(231, 76, 60, 0.1)',
//                 hover: 'rgba(231, 76, 60, 0.2)'
//             },
//             'maize': {
//                 border: '#3498db',
//                 background: 'rgba(52, 152, 219, 0.1)',
//                 hover: 'rgba(52, 152, 219, 0.2)'
//             },
//             'sugarcane': {
//                 border: '#9b59b6',
//                 background: 'rgba(155, 89, 182, 0.1)',
//                 hover: 'rgba(155, 89, 182, 0.2)'
//             }
//         };

//         // Get unique crop types and sort them
//         const cropTypes = [...new Set(data.crops)].sort();

//         // Create datasets with improved visualization
//         const datasets = cropTypes.map(cropType => {
//             const cropData = data.years.map((year, index) => {
//                 if (data.crops[index] === cropType) {
//                     return {
//                         x: year,
//                         y: data.yields[index],
//                         crop: data.crops[index]
//                     };
//                 }
//                 return null;
//             }).filter(point => point !== null);

//             const colors = cropColors[cropType.toLowerCase()] || {
//                 border: '#2c3e50',
//                 background: 'rgba(44, 62, 80, 0.1)',
//                 hover: 'rgba(44, 62, 80, 0.2)'
//             };

//             return {
//                 label: cropType.charAt(0).toUpperCase() + cropType.slice(1),
//                 data: cropData,
//                 borderColor: colors.border,
//                 backgroundColor: colors.background,
//                 hoverBackgroundColor: colors.hover,
//                 borderWidth: 2,
//                 tension: 0.4,
//                 fill: true,
//                 pointRadius: 6,
//                 pointHoverRadius: 8,
//                 pointBackgroundColor: 'white',
//                 pointBorderColor: colors.border,
//                 pointBorderWidth: 2,
//                 spanGaps: true
//             };
//         });

//         // Create the chart with improved configuration
//         previousCropsChart = new Chart(ctx, {
//             type: 'line',
//             data: {
//                 datasets: datasets
//             },
//             options: {
//                 responsive: true,
//                 maintainAspectRatio: false,
//                 interaction: {
//                     intersect: false,
//                     mode: 'nearest'
//                 },
//                 animations: {
//                     tension: {
//                         duration: 1000,
//                         easing: 'easeInOutQuart',
//                         from: 0.5,
//                         to: 0.4
//                     }
//                 },
//                 plugins: {
//                     legend: {
//                         position: 'top',
//                         labels: {
//                             padding: 20,
//                             font: {
//                                 size: 12,
//                                 weight: 'bold'
//                             },
//                             usePointStyle: true
//                         }
//                     },
//                     title: {
//                         display: true,
//                         text: `Historical Crop Yields in ${data.location}`,
//                         font: {
//                             size: 16,
//                             weight: 'bold'
//                         },
//                         padding: {
//                             top: 20,
//                             bottom: 20
//                         }
//                     },
//                     tooltip: {
//                         enabled: true,
//                         mode: 'nearest',
//                         intersect: false,
//                         callbacks: {
//                             label: function(context) {
//                                 const point = context.raw;
//                                 return `${point.crop}: ${point.y.toLocaleString()} kg/ha`;
//                             },
//                             title: function(context) {
//                                 return `Year: ${context[0].raw.x}`;
//                             }
//                         }
//                     }
//                 },
//                 scales: {
//                     x: {
//                         type: 'linear',
//                         position: 'bottom',
//                         title: {
//                             display: true,
//                             text: 'Year',
//                             font: {
//                                 weight: 'bold'
//                             }
//                         },
//                         ticks: {
//                             callback: function(value) {
//                                 return Math.floor(value);
//                             }
//                         },
//                         grid: {
//                             color: 'rgba(0,0,0,0.05)'
//                         }
//                     },
//                     y: {
//                         beginAtZero: true,
//                         title: {
//                             display: true,
//                             text: 'Yield (kg/hectare)',
//                             font: {
//                                 weight: 'bold'
//                             }
//                         },
//                         grid: {
//                             color: 'rgba(0,0,0,0.05)'
//                         },
//                         ticks: {
//                             callback: function(value) {
//                                 return value.toLocaleString();
//                             }
//                         }
//                     }
//                 }
//             }
//         });
//     }

//     function getCropIcon(cropName) {
//         const icons = {
//             'rice': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzI3YWU2MCIgZD0iTTExLDEwSDEyQzEyLjUsOC41IDEzLjUsNyAxNSw2QzE1LDQgMTQsMyAxMiwzQzEwLDMgOSw0IDksNkMxMC41LDcgMTEuNSw4LjUgMTEsMTBNMTUsOEMxNC4yMyw4IDEzLjUsOC4zOCAxMyw5QzEzLjUsMTAuNSAxMywxMiAxMSwxM0MxMCwxMSA5LjUsMTAgMTAsMjNDMTAsMjMgMTAuNSwyNCAxMiwyNEMxMy41LDI0IDE0LDIzIDE0LDIzQzE0LjUsMTAgMTQsMTEgMTMsMTNDMTEsMTIgMTAuNSwxMC41IDExLDlDMTAuNSw4LjM4IDkuNzcsOCA5LDhDNy41OCw4IDYuNSw5LjU4IDYuNSwxMUM2LjUsMTIuNCAxMC41LDIxIDEwLjUsMjFDMTAuNSwyMSAxMSwyMiAxMiwyMkMxMywyMiAxMy41LDIxIDEzLjUsMjFDMTMuNSwyMSAxNy41LDEyLjQgMTcuNSwxMUMxNy41LDkuNTggMTYuNDIsOCAxNSw4WiIgLz48L3N2Zz4=',
//             'wheat': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2YxYzQwZiIgZD0iTTE3LDQwTDcsNDBDNS4zNCw0MCA0LDQxLjM0IDQsNDNDNCw0NC42NiA1LjM0LDQ2IDcsNDZMMTcsNDZDMTguNjYsNDYgMjAsNDQuNjYgMjAsNDNDMjAsNDEuMzQgMTguNjYsNDAgMTcsNDBaTTE3LDQ0TDcsNDRDNi40NSw0NCA2LDQzLjU1IDYsNDNDNiw0Mi40NSA2LjQ1LDQyIDcsNDJMMTcsNDJDMTcuNTUsNDIgMTgsNDIuNDUgMTgsNDNDMTgsNDMuNTUgMTcuNTUsNDQgMTcsNDRaIiAvPjwvc3ZnPg==',
//             'cotton': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2U3NGMzYyIgZD0iTTEyLDVDMTMuNjYsNSAxNSw2LjM0IDE1LDhDMTUsOS42NiAxMy42NiwxMSAxMiwxMUMxMC4zNCwxMSA5LDkuNjYgOSw4QzksNi4zNCAxMC4zNCw1IDEyLDVNMTIsMTdDMTcsMTcgMjAsMjAgMjAsMjBINEMzLjk5LDIwIDcsMTcgMTIsMTdNMTIsMUE3LDcgMCAwLDAgNSw4QTcsNyAwIDAsMCAxMiwxNUE3LDcgMCAwLDAgMTksOEE3LDcgMCAwLDAgMTIsMVoiIC8+PC9zdmc+',
//             'maize': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzM0OThkYiIgZD0iTTE5LDNDMTcuOSwzIDE3LDMuOSAxNyw1TDE3LDE1QzE3LDE1LjU1IDE2LjU1LDE2IDE2LDE2TDgsMTZDNy40NSwxNiA3LDE1LjU1IDcsMTVMNyw1QzcsMyA1LDMgNSwzTDUsMjFMMTksMjFMMTksM1oiIC8+PC9zdmc+',
//             'sugarcane': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzliNTliNiIgZD0iTTE1LDJDMTYuNjYsMiAxOCwzLjM0IDE4LDVMMTgsMTVDMTgsMTYuNjYgMTYuNjYsMTggMTUsMThMNSwxOEMzLjM0LDE4IDIsMTYuNjYgMiwxNUwyLDVDMiwzLjM0IDMuMzQsMiA1LDJMMTUsMlpNMTUsNEw1LDRDNC40NSw0IDQsNC40NSA0LDVMNCwxNUM0LDE1LjU1IDQuNDUsMTYgNSwxNkwxNSwxNkMxNS41NSwxNiAxNiwxNS41NSAxNiwxNUwxNiw1QzE2LDQuNDUgMTUuNTUsNCAxNSw0WiIgLz48L3N2Zz4='
//         };
//         return icons[cropName.toLowerCase()] || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzk1YTVhNiIgZD0iTTEyLDJDMTcuNTIsMiAyMiw2LjQ4IDIyLDEyQzIyLDE3LjUyIDE3LjUyLDIyIDEyLDIyQzYuNDgsMjIgMiwxNy41MiAyLDEyQzIsNi40OCA2LjQ4LDIgMTIsMloiIC8+PC9zdmc+';
//     }

//     function showError(elementId, message) {
//         // Remove any existing error container with the same ID
//         document.getElementById(elementId)?.remove();

//         const errorContainer = document.createElement('div');
//         errorContainer.id = elementId;
//         errorContainer.className = 'alert alert-danger alert-dismissible fade show mb-4';
//         errorContainer.innerHTML = `
//             <div class="d-flex align-items-center">
//                 <i class="fas fa-exclamation-circle me-2"></i>
//                 <div class="flex-grow-1">
//                     ${message}
//                 </div>
//                 <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
//             </div>
//         `;

//         // Insert error message at the top of the form
//         const insertLocation = elementId === 'error-container' ? 
//             document.querySelector('#farmerForm') : 
//             document.getElementById(elementId);
        
//         if (insertLocation) {
//             insertLocation.parentNode.insertBefore(errorContainer, insertLocation);

//             // Automatically dismiss the error after 5 seconds
//             setTimeout(() => {
//                 errorContainer.classList.remove('show');
//                 setTimeout(() => errorContainer.remove(), 150);
//             }, 5000);
//         }
//     }

//     function showLoading(elementId) {
//         const element = document.getElementById(elementId);
//         if (element) {
//             element.innerHTML = `
//                 <div class="text-center">
//                     <div class="spinner-border" role="status">
//                         <span class="visually-hidden">Loading...</span>
//                     </div>
//                 </div>`;
//         }
//     }

//     function handleNetworkError(error) {
//         console.error('Network Error:', error);
//         if (!navigator.onLine) {
//             showError('error-container', 'Please check your internet connection and try again.');
//         } else {
//             showError('error-container', 'A network error occurred. Please try again later.');
//         }
//     }

//     // ------------ irrigation / notification helpers ------------
//     async function registerField(farmerId, location, cropType) {
//         try {
//             await fetch('/register_field', {
//                 method: 'POST',
//                 headers: {'Content-Type': 'application/json'},
//                 body: JSON.stringify({farmer_id: farmerId, field_name: location, location, crop_type: cropType})
//             });
//         } catch (e) {
//             console.error('registerField error', e);
//         }
//     }

//     async function checkIrrigation(farmerId, fieldIndex) {
//         try {
//             const res = await fetch('/check_irrigation', {
//                 method: 'POST',
//                 headers: {'Content-Type': 'application/json'},
//                 body: JSON.stringify({farmer_id: farmerId, field_index: fieldIndex})
//             });
//             if (!res.ok) throw new Error('Irrigation API failed');
//             const data = await res.json();
//             if (data.notification) {
//                 displayNotifications([data.notification]);
//             }
//             return data;
//         } catch (e) {
//             console.error('checkIrrigation error', e);
//         }
//     }

//     async function fetchNotifications(farmerId) {
//         try {
//             const res = await fetch(`/get_notifications?farmer_id=${encodeURIComponent(farmerId)}`);
//             if (!res.ok) throw new Error('Failed to fetch notifications');
//             const data = await res.json();
//             if (data.notifications) {
//                 displayNotifications(data.notifications);
//             }
//         } catch (e) {
//             console.error('fetchNotifications error', e);
//         }
//     }

//     function displayNotifications(notes) {
//         const list = document.getElementById('notificationList');
//         if (!list) return;
//         list.innerHTML = '';
//         if (!notes || notes.length === 0) {
//             list.innerHTML = '<p class="text-muted">No notifications</p>';
//             return;
//         }
//         notes.forEach(n => {
//             const div = document.createElement('div');
//             const severityClass = {
//                 'Critical': 'alert-danger',
//                 'High': 'alert-warning',
//                 'Medium': 'alert-info',
//                 'Low': 'alert-success'
//             }[n.severity] || 'alert-info';
            
//             div.className = `alert ${severityClass}`;
//             const time = n.timestamp || '';
//             const droughtLevel = n.drought_level || 'Unknown';
//             const alertType = n.alert_type || 'Normal';
//             const rainfall = n.rainfall_mm || 0;
//             const actionRequired = n.action_required || '';
            
//             div.innerHTML = `
//                 <strong>${n.field_name}</strong> (${n.location})<br/>
//                 <small><i class="fas fa-cloud-rain"></i> Rainfall: ${rainfall}mm | <i class="fas fa-tint"></i> Drought: ${droughtLevel}</small><br/>
//                 <small><i class="fas fa-exclamation-triangle"></i> ${alertType} - ${n.message}</small><br/>
//                 <small><strong>Action:</strong> ${actionRequired}</small><br/>
//                 <small class="text-muted">${time}</small>
//             `;
//             list.appendChild(div);
//         });
//     }

//     document.getElementById('clearNotifications')?.addEventListener('click', async () => {
//         const farmerId = document.getElementById('name').value.trim();
//         if (!farmerId) return;
//         await fetch('/clear_notifications', {
//             method: 'POST',
//             headers: {'Content-Type': 'application/json'},
//             body: JSON.stringify({farmer_id: farmerId})
//         });
//         displayNotifications([]);
//     });
// });


document.addEventListener('DOMContentLoaded', () => {

    const farmerForm = document.getElementById('farmerForm');
    let previousCropsChart = null;

    // ================= FORM SUBMIT =================
    farmerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value.trim(),
            location: document.getElementById('location').value.trim(),
            temperature: parseFloat(document.getElementById('temperature').value),
            humidity: parseFloat(document.getElementById('humidity').value),
            rainfall: parseFloat(document.getElementById('rainfall').value),
            soil_n: parseFloat(document.getElementById('soil_n').value),
            soil_p: parseFloat(document.getElementById('soil_p').value),
            soil_k: parseFloat(document.getElementById('soil_k').value),
            soil_ph: parseFloat(document.getElementById('soil_ph').value),
            area: parseFloat(document.getElementById('area').value),
            soil_fertility: parseFloat(document.getElementById('soil_fertility').value),
            irrigation_level: parseFloat(document.getElementById('irrigation_level').value)
        };

        try {

            showLoading('weatherInfo');
            showLoading('cropRecommendations');
            showLoading('yieldPredictions');

            const weatherPromise = getWeatherData(formData.location);
            const cropPromise = getCropRecommendations(formData);
            const yieldPromise = getYieldPredictions(formData);
            const historyPromise = getPreviousCrops(formData.location);

            await Promise.all([
                weatherPromise,
                cropPromise,
                yieldPromise,
                historyPromise
            ]);

            const resultsElement = document.getElementById('results');
            if (resultsElement) {
                resultsElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }

        } catch (error) {
            console.error(error);
            showError("Something went wrong.");
        }
    });

    // ================= WEATHER =================
    async function getWeatherData(location) {

        try {

            const response = await fetch('/get_weather', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ location })
            });

            const data = await response.json();
            const weatherData = data.weather || data;

            console.log("Weather Response:", data);

            displayWeatherInfo(weatherData);
            return weatherData;

        } catch (error) {
            console.error(error);

            document.getElementById('weatherInfo').innerHTML =
                `<div class="alert alert-danger">
                    Weather data not available
                </div>`;
            throw error;
        }
    }

    function displayWeatherInfo(data) {

        const weatherDiv = document.getElementById('weatherInfo');
        const weather = data.weather || data;

        // OPENWEATHERMAP FORMAT
        const temp = weather.main?.temp || weather.temperature || 0;
        const humidity = weather.main?.humidity || weather.humidity || 0;

        // Rain may not exist
        const rainfall =
            weather.rain?.['1h'] ||
            weather.rain?.['3h'] ||
            weather.rainfall ||
            0;

        const condition =
            weather.weather?.[0]?.description ||
            weather.description ||
            "No data";

        weatherDiv.innerHTML = `
            <div class="card shadow p-3">
                <h4 class="mb-3">Weather Information</h4>

                <div class="row">

                    <div class="col-md-3">
                        <div class="weather-box">
                            <h5>Temperature</h5>
                            <p>${temp} °C</p>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="weather-box">
                            <h5>Humidity</h5>
                            <p>${humidity}%</p>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="weather-box">
                            <h5>Rainfall</h5>
                            <p>${rainfall} mm</p>
                        </div>
                    </div>

                    

                </div>
            </div>
        `;
    }

    // ================= CROP RECOMMENDATIONS =================
    async function getCropRecommendations(formData) {

        try {

            const response = await fetch('/recommend_crop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            console.log("Crop Recommendation:", data);

            displayCropRecommendations(data);

        } catch (error) {

            console.error(error);

            document.getElementById('cropRecommendations').innerHTML =
                `<div class="alert alert-danger">
                    Crop recommendation not available
                </div>`;
        }
    }

    function displayCropRecommendations(data) {

        const div = document.getElementById('cropRecommendations');

        // HANDLE DIFFERENT BACKEND FORMATS
        let recommendations = [];

        if (Array.isArray(data)) {
            recommendations = data;
        } else if (Array.isArray(data.recommendations)) {
            recommendations = data.recommendations;
        } else if (typeof data.recommendation === 'string') {
            recommendations = [{
                name: data.recommendation,
                confidence: data.confidence || 80,
                description: data.description || `${data.recommendation} is suitable for these conditions.`,
                optimal_temp: data.optimal_temp || data.temperature || 0,
                required_rainfall: data.required_rainfall || data.rainfall || 0,
                growing_period: data.growing_period || 120
            }];
        }

        if (recommendations.length === 0) {
            div.innerHTML =
                `<div class="alert alert-warning">
                    No crop recommendations available
                </div>`;
            return;
        }

        let html = `<div class="row">`;

        recommendations.forEach((crop, index) => {

            html += `
                <div class="col-md-4 mb-3">
                    <div class="card shadow h-100 p-3">

                        <h4>${crop.name || crop.crop}</h4>

                        <p>
                            Confidence:
                            <strong>
                                ${crop.confidence || 90}%
                            </strong>
                        </p>

                        <p>
                            ${crop.description || "Suitable crop"}
                        </p>

                    </div>
                </div>
            `;
        });

        html += `</div>`;

        div.innerHTML = html;
    }

    // ================= YIELD PREDICTION =================
    async function getYieldPredictions(formData) {

        try {

            const response = await fetch('/predict_yield', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            console.log("Yield Prediction:", data);

            displayYieldPredictions(data);

        } catch (error) {

            console.error(error);

            document.getElementById('yieldPredictions').innerHTML =
                `<div class="alert alert-danger">
                    Yield prediction not available
                </div>`;
        }
    }

    function displayYieldPredictions(data) {

        const div = document.getElementById('yieldPredictions');

        let predictions = [];

        if (Array.isArray(data)) {
            predictions = data;
        } else if (Array.isArray(data.predictions)) {
            predictions = data.predictions;
        } else if (data.crop && data.predicted_yield != null) {
            predictions = [{
                crop: data.crop,
                yield: data.predicted_yield,
                confidence: data.confidence || 85,
                roi: data.roi || 10
            }];
        }

        if (predictions.length === 0) {

            div.innerHTML =
                `<div class="alert alert-warning">
                    No yield prediction data available
                </div>`;

            return;
        }

        let html = `
            <div class="card shadow p-3">
                <h4 class="mb-3">Yield Predictions</h4>

                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Crop</th>
                            <th>Yield</th>
                            <th>Confidence</th>
                        </tr>
                    </thead>

                    <tbody>
        `;

        predictions.forEach(item => {

            html += `
                <tr>
                    <td>${item.crop || item.name}</td>
                    <td>${item.yield || 0} kg/ha</td>
                    <td>${item.confidence || 90}%</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        div.innerHTML = html;
    }

    // ================= PREVIOUS CROPS =================
    async function getPreviousCrops(location) {

        try {

            const response = await fetch('/previous_crops', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ location })
            });

            const data = await response.json();

            console.log("History:", data);

            displayPreviousCrops(data);

        } catch (error) {

            console.error(error);

            document.getElementById('previousCropsChart').innerHTML =
                `<div class="alert alert-danger">
                    Previous crop data unavailable
                </div>`;
        }
    }

    function displayPreviousCrops(data) {

        const canvas = document.getElementById('previousCropsChart');

        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        if (previousCropsChart) {
            previousCropsChart.destroy();
        }

        // Default sample data if backend empty
        const years = data.years || [2020, 2021, 2022, 2023, 2024];
        const yields = data.yields || [2000, 2400, 2100, 2800, 3000];

        previousCropsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'Crop Yield',
                    data: yields,
                    borderWidth: 3,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // ================= HELPERS =================
    function showLoading(id) {

        const el = document.getElementById(id);

        if (!el) return;

        el.innerHTML = `
            <div class="text-center p-4">
                <div class="spinner-border"></div>
            </div>
        `;
    }

    function showError(message) {

        alert(message);
    }

});