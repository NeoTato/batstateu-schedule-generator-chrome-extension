/**
 * Injects the "Generate Timetable" button into the BatStateU portal's
 * "Encoded Subjects" modal and manages the visualizer overlay.
 */

(function () {
  let injectedButton = null;

  function initObserver() {
    // Check initially
    checkForSubjectsModal();

    // Observe DOM mutations to detect modal openings
    const observer = new MutationObserver(() => {
      checkForSubjectsModal();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function checkForSubjectsModal() {
    // Look for the "Encoded Subjects" modal header or media-body elements
    const modalHeaders = Array.from(document.querySelectorAll('h4, h5, .modal-title'));
    const subjectsHeader = modalHeaders.find(h => h.innerText.toLowerCase().includes('encoded subjects'));

    const modalContent = document.querySelector('.modal-content, .modal-dialog') || 
                         (subjectsHeader ? subjectsHeader.closest('.modal') : null);

    const hasMediaBodies = document.querySelectorAll('.media-body').length > 0;

    if ((subjectsHeader || hasMediaBodies) && modalContent) {
      injectButtonIntoModal(modalContent, subjectsHeader);
    }
  }

  function injectButtonIntoModal(modalContainer, headerElement) {
    if (document.getElementById('bsu-schedule-gen-btn')) {
      return; // Already injected
    }

    const button = document.createElement('button');
    button.id = 'bsu-schedule-gen-btn';
    button.className = 'bsu-sched-injected-btn';
    button.type = 'button';
    button.innerHTML = `<span>Generate Timetable</span>`;

    button.addEventListener('click', handleGenerateClick);

    // Try to find tabs (List View / Table View) to place next to them
    const viewTabs = modalContainer.querySelector('.nav-tabs, ul.nav, [role="tablist"], .modal-header');
    if (viewTabs) {
      viewTabs.appendChild(button);
    } else if (headerElement && headerElement.parentElement) {
      headerElement.parentElement.appendChild(button);
    } else {
      const modalHeader = modalContainer.querySelector('.modal-header') || modalContainer;
      modalHeader.prepend(button);
    }

    injectedButton = button;
  }

  async function handleGenerateClick(e) {
    if (e) e.preventDefault();

    // 1. Scrape subjects from the DOM
    const subjects = BsuScheduleScraper.scrapeFromDOM(document);

    if (!subjects || subjects.length === 0) {
      alert('No encoded subjects found in the modal. Please ensure the "Encoded Subjects" list is visible.');
      return;
    }

    // 2. Persist data into chrome storage
    const schedulePayload = {
      timestamp: Date.now(),
      section: subjects[0]?.section || 'CS-4102',
      campus: subjects[0]?.campus || 'BatStateU',
      subjects: subjects
    };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ bsu_current_schedule: schedulePayload });
    } else {
      // Fallback for standalone mock testing
      localStorage.setItem('bsu_current_schedule', JSON.stringify(schedulePayload));
    }

    // 3. Open the Timetable Viewer Modal Overlay
    openTimetableModal(schedulePayload);
  }

  function openTimetableModal(payload) {
    // Remove any existing overlay
    const existing = document.getElementById('bsu-sched-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'bsu-sched-overlay';
    overlay.className = 'bsu-sched-modal-overlay';

    const container = document.createElement('div');
    container.className = 'bsu-sched-modal-container';

    // Get iframe URL
    let viewerUrl = '';
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      viewerUrl = chrome.runtime.getURL('src/visualizer/timetable-viewer.html?embedded=true');
    } else {
      viewerUrl = 'src/visualizer/timetable-viewer.html?embedded=true';
    }

    const iframe = document.createElement('iframe');
    iframe.src = viewerUrl;

    // Listen for close message from iframe
    window.addEventListener('message', function onMsg(event) {
      if (event.data && event.data.type === 'BSU_CLOSE_VIEWER') {
        overlay.remove();
        window.removeEventListener('message', onMsg);
      }
    });

    // Close when clicking outside container
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    container.appendChild(iframe);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initObserver);
  } else {
    initObserver();
  }
})();
