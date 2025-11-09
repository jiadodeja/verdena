// Verdena Content Script
// Injects a floating button and detects brand name

(function () {
  // Don't inject on extension pages or non-commerce sites
  if (window.location.protocol === 'chrome-extension:' || window.location.protocol === 'about:') {
    return;
  }

  // Track if panel is already open
  let isPanelOpen = false;

  // Detect brand name from page
  function guessBrand() {
    // Try multiple sources
    const metaOgSiteName = document.querySelector('meta[property="og:site_name"]')?.content || "";
    const metaOgTitle = document.querySelector('meta[property="og:title"]')?.content || "";
    const title = document.title || "";
    const metaAppName = document.querySelector('meta[name="application-name"]')?.content || "";
    
    // Try to extract brand from title (usually before " - " or " | ")
    let brand = metaOgSiteName || metaAppName || title;
    
    // Clean up
    brand = brand
      .replace(/\(.*?\)/g, '') // Remove parentheses
      .replace(/[™®©]/g, '') // Remove trademark symbols
      .trim()
      .slice(0, 60); // Limit length
    
    return brand || "Unknown Brand";
  }

  // Create floating button
  function createButton() {
    // Check if button already exists
    if (document.getElementById('Verdena-btn')) {
      return;
    }

    const btn = document.createElement('button');
    btn.textContent = "🌱 Check Sustainability";
    btn.id = "Verdena-btn";
    btn.className = "Verdena-floating-btn";
    
    // Style the button
    Object.assign(btn.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      zIndex: "2147483646",
      padding: "12px 20px",
      backgroundColor: "#10b981",
      color: "white",
      border: "none",
      borderRadius: "25px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
      transition: "all 0.3s ease",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    });
    
    // Hover effect
    btn.addEventListener('mouseenter', () => {
      btn.style.backgroundColor = "#059669";
      btn.style.transform = "translateY(-2px)";
      btn.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.5)";
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.backgroundColor = "#10b981";
      btn.style.transform = "translateY(0)";
      btn.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.4)";
    });
    
    btn.onclick = openPanel;
    
    document.body.appendChild(btn);
  }

  // Open sustainability panel
  function openPanel() {
    if (isPanelOpen) {
      closePanel();
      return;
    }

    const brand = guessBrand();
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'Verdena-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 2147483647;
      backdrop-filter: blur(2px);
    `;
    overlay.onclick = closePanel;
    
    // Create panel iframe
    const panel = document.createElement('iframe');
    panel.id = 'Verdena-panel';
    panel.src = chrome.runtime.getURL('panel.html') + `#brand=${encodeURIComponent(brand)}`;
    panel.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: min(480px, 100vw);
      height: 100vh;
      border: none;
      z-index: 2147483648;
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.2);
      background: white;
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(panel);
    
    isPanelOpen = true;
    
    // Update button
    const btn = document.getElementById('Verdena-btn');
    if (btn) {
      btn.textContent = "✕ Close";
      btn.style.backgroundColor = "#ef4444";
    }
  }

  // Close panel
  function closePanel() {
    const overlay = document.getElementById('Verdena-overlay');
    const panel = document.getElementById('Verdena-panel');
    
    if (overlay) overlay.remove();
    if (panel) panel.remove();
    
    isPanelOpen = false;
    
    // Reset button
    const btn = document.getElementById('Verdena-btn');
    if (btn) {
      btn.textContent = "🌱 Check Sustainability";
      btn.style.backgroundColor = "#10b981";
    }
  }

  // Listen for close messages from panel
  window.addEventListener('message', (event) => {
    if (event.data.type === 'Verdena-close') {
      closePanel();
    }
  });

  // Initialize after page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createButton);
  } else {
    createButton();
  }
})();
