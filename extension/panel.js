// Verdena Panel Logic

const API_BASE = 'http://localhost:8000';

// Metric labels mapping
const METRIC_LABELS = {
  has_targets: 'Carbon Neutrality Targets',
  uses_renewables: 'Renewable Energy Use',
  reports_scope3: 'Reports Scope 3 Emissions',
  waste_reduction: 'Waste Reduction Programs',
  fair_labor: 'Fair Labor Certifications',
  supplier_audit: 'Supplier Audits',
  diversity_policy: 'Diversity & Inclusion',
  third_party_audit: 'Third-Party Audits',
  open_data: 'Publishes Sustainability Data'
};

// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, setting up event listeners...');
  
  // Search button click
  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      console.log('Search button clicked!');
      searchBrand();
    });
  }
  
  // Enter key in search input
  const brandInput = document.getElementById('brand-input');
  if (brandInput) {
    brandInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        console.log('Enter key pressed!');
        searchBrand();
      }
    });
  }
  
  // Close button
  const closeBtn = document.getElementById('close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      console.log('Close button clicked!');
      closePanel();
    });
  }
});

// Get brand from URL hash on load
window.addEventListener('load', () => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const brand = params.get('brand');
  
  if (brand && brand !== 'Unknown Brand') {
    document.getElementById('brand-input').value = brand;
    searchBrand();
  }
});

// Close panel
function closePanel() {
  window.parent.postMessage({ type: 'Verdena-close' }, '*');
}

// Main search function
async function searchBrand() {
  console.log('Starting search...');
  const input = document.getElementById('brand-input');
  const brand = input.value.trim();
  
  if (!brand || brand.length < 2) {
    showError('Please enter a brand name (at least 2 characters)');
    return;
  }
  
  // Show loading state
  showLoading(brand);
  
  // Disable search button
  const searchBtn = document.getElementById('search-btn');
  //searchBtn.disabled = true;
  
  if (searchBtn)
    searchBtn.textContent = 'Searching...';
  
  try {
    const response = await fetch(`${API_BASE}/search?searchTerm=${encodeURIComponent(brand)}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Search response:', data);
    displayResults(data);
    
  } catch (error) {
    console.error('Search error:', error);
    showError(`Failed to fetch data: ${error.message}. Make sure the backend server is running at ${API_BASE}`);
  } finally {
    // Re-enable search button
    // searchBtn.disabled = false;
    if (searchBtn)
      searchBtn.textContent = 'Search';
  }
}

// Show loading state
function showLoading(brand) {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Searching for <strong>${escapeHtml(brand)}</strong>...</p>
    </div>
  `;
}

// Show error message
function showError(message) {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="error">
      <span style="font-size: 24px;">⚠️</span>
      <div>
        <strong>Error</strong>
        <p style="margin-top: 4px; line-height: 1.6;">${escapeHtml(message)}</p>
      </div>
    </div>
  `;
}

// Display results
function displayResults(data) {
  const content = document.getElementById('content');
  
  if (!data.sustainability_record) {
    showError('No sustainability data available');
    return;
  }
  
  const record = data.sustainability_record;
  let html = '';
  
  // Greenwashing warning
  if (record.greenwashing_flag === 1) {
    html += `
      <div class="warning-banner">
        <span class="warning-icon">⚠️</span>
        <div class="warning-content">
          <h3>Greenwashing Alert</h3>
          <p>This company has been flagged for potential greenwashing. Claims may not be fully substantiated. Review the evidence carefully.</p>
        </div>
      </div>
    `;
  }
  
  // Overall Score Section
  const scoreColor = getScoreColor(record.final_score);
  const scoreRating = getScoreRating(record.final_score);
  
  html += `
    <div class="section">
      <div class="score-overview">
        <div class="score-circle">
          ${createScoreCircle(record.final_score, scoreColor)}
          <div class="score-value">
            <span class="score-number" style="color: ${scoreColor}">${Math.round(record.final_score)}</span>
            <span class="score-label">Overall</span>
          </div>
        </div>
        <div class="score-details">
          <div class="score-rating" style="color: ${scoreColor}">${scoreRating}</div>
          <div class="score-description">
            ${getScoreDescription(record.final_score)}
          </div>
        </div>
      </div>
      
      <div class="category-scores">
        ${createCategoryCard('🌍', 'Environmental', record.environmental_score, '#10b981')}
        ${createCategoryCard('👥', 'Social', record.social_score, '#3b82f6')}
        ${createCategoryCard('📊', 'Transparency', record.transparency_score, '#8b5cf6')}
      </div>
    </div>
  `;
  
  // Sustainability Metrics Section
  html += `
    <div class="section">
      <h2><span class="icon">✓</span>Sustainability Metrics</h2>
      <div class="metrics-grid">
        ${createMetricItem(record.has_targets, 'has_targets')}
        ${createMetricItem(record.uses_renewables, 'uses_renewables')}
        ${createMetricItem(record.reports_scope3, 'reports_scope3')}
        ${createMetricItem(record.waste_reduction, 'waste_reduction')}
        ${createMetricItem(record.fair_labor, 'fair_labor')}
        ${createMetricItem(record.supplier_audit, 'supplier_audit')}
        ${createMetricItem(record.diversity_policy, 'diversity_policy')}
        ${createMetricItem(record.third_party_audit, 'third_party_audit')}
        ${createMetricItem(record.open_data, 'open_data')}
      </div>
    </div>
  `;
  
  // Summary Section
  if (record.explanation) {
    html += `
      <div class="section">
        <h2><span class="icon">📝</span>Detailed Analysis</h2>
        <div class="summary">
          <p>${escapeHtml(record.explanation)}</p>
        </div>
      </div>
    `;
  }
  
  content.innerHTML = html;
}

// Create score circle SVG
function createScoreCircle(score, color) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  return `
    <svg>
      <circle class="score-circle-bg" cx="70" cy="70" r="${radius}"></circle>
      <circle 
        class="score-circle-progress" 
        cx="70" 
        cy="70" 
        r="${radius}"
        stroke="${color}"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${offset}"
      ></circle>
    </svg>
  `;
}

// Create category card
function createCategoryCard(icon, name, score, color) {
  const percentage = Math.round(score);
  
  return `
    <div class="category-card">
      <span class="category-icon">${icon}</span>
      <div class="category-name">${name}</div>
      <span class="category-score-value" style="color: ${color}">${percentage}</span>
      <div class="category-bar">
        <div class="category-bar-fill" style="width: ${percentage}%; background: ${color}"></div>
      </div>
    </div>
  `;
}

// Create metric item
function createMetricItem(value, key) {
  const label = METRIC_LABELS[key] || key;
  const hasMetric = value === 1;
  const iconClass = hasMetric ? 'yes' : 'no';
  const icon = hasMetric ? '✓' : '✕';
  
  return `
    <div class="metric-item">
      <div class="metric-icon ${iconClass}">${icon}</div>
      <div class="metric-label">${label}</div>
    </div>
  `;
}

// Get score color
function getScoreColor(score) {
  if (score >= 70) return '#10b981';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

// Get score rating
function getScoreRating(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 30) return 'Poor';
  return 'Very Poor';
}

// Get score description
function getScoreDescription(score) {
  if (score >= 70) {
    return 'This company demonstrates strong sustainability practices with verified commitments and transparent reporting.';
  } else if (score >= 40) {
    return 'This company shows moderate sustainability efforts but has room for improvement in key areas.';
  } else {
    return 'This company has limited sustainability practices or lacks transparency in their environmental and social commitments.';
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
