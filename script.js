/**
 * Dishwashing Management System Logic
 */

// CONFIGURATION - USER MUST UPDATE THIS
// Replace with your actual Web App URL after deployment
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbx6p6jLILk1EgP8g5DdToNs8MZYwNNwbsXDOJrcLZm4L_ZRO1S1C_YFordrxrSJQMYi/exec'; 

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Determine which page we are on
    const path = window.location.pathname;
    
    if (path.endsWith('register.html')) {
        initRegister();
    } else if (path.endsWith('dashboard.html')) {
        initDashboard();
    }
});

/**
 * Initialize Registration Page Logic
 */
function initRegister() {
    const form = document.getElementById('registerForm');
    const loading = document.getElementById('loading');
    const message = document.getElementById('message');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (GAS_API_URL.includes('YOUR_WEB_APP_URL_HERE')) {
            alert('Error: Please update the GAS_API_URL in script.js');
            return;
        }

        const note = document.getElementById('note').value;
        const submitBtn = form.querySelector('button[type="submit"]');

        // UI State: Loading
        loading.classList.remove('hidden');
        submitBtn.disabled = true;
        message.classList.add('hidden');

        try {
            // Note: GAS requires no-cors for simple POSTs usually, but for receiving JSON response we use standard fetch
            // However, browsers block cross-origin reading of response with simple fetch.
            // Standard idiom for GAS API call:
            // Since we need to read the response, we rely on GAS ContentService returning properly.
            // Using 'no-cors' mode would hide the response 
            const response = await fetch(GAS_API_URL, {
                method: 'POST',
                mode: 'cors', // Ensure we can read response. GAS script must handle CORS? 
                              // Actually standard GAS Web Apps handle CORS automatically if ContentService is used.
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8', 
                    // Use text/plain to avoid preflight OPTIONS request which GAS doesn't handle well
                },
                body: JSON.stringify({ note: note })
            });

            const result = await response.json();

            if (result.status === 'success') {
                showMessage(`✅ Registered! Count: ${result.data.count}`, 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);
            } else {
                throw new Error(result.message || 'Unknown error');
            }

        } catch (error) {
            console.error(error);
            showMessage(`❌ Error: ${error.message}`, 'error');
            loading.classList.add('hidden');
            submitBtn.disabled = false;
        }
    });

    function showMessage(text, type) {
        message.textContent = text;
        message.className = `message ${type}`;
        message.classList.remove('hidden');
    }
}

/**
 * Initialize Dashboard Page Logic
 */
async function initDashboard() {
    const totalCountEl = document.getElementById('totalCount');
    const totalCostEl = document.getElementById('totalCost');
    const historyList = document.getElementById('historyList');
    const monthFilter = document.getElementById('monthFilter');
    const loading = document.getElementById('loading');
    
    // UI State: Loading
    loading.classList.remove('hidden');

    try {
        if (GAS_API_URL.includes('YOUR_WEB_APP_URL_HERE')) {
            throw new Error('Please configure GAS_API_URL in script.js');
        }

        const response = await fetch(GAS_API_URL + '?action=getHistory');
        const json = await response.json();
        
        if (json.status !== 'success') {
            throw new Error(json.message);
        }

        const data = json.data; // Array of objects
        
        // Populate Filter Dropdown
        const months = [...new Set(data.map(item => item.month))].sort().reverse();
        
        // Add "All Time" option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = '全期間';
        monthFilter.appendChild(allOption);

        months.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            monthFilter.appendChild(opt);
        });

        // Set default to current month if exists, else first available
        const currentMonth = new Date().toISOString().slice(0, 7);
        if (months.includes(currentMonth)) {
            monthFilter.value = currentMonth;
        } else if (months.length > 0) {
            monthFilter.value = months[0];
        }

        // Render function
        const render = (filterValue) => {
            historyList.innerHTML = '';
            let filteredData = data;
            
            if (filterValue !== 'all') {
                filteredData = data.filter(item => item.month === filterValue);
            }

            // Update Stats
            const count = filteredData.length;
            const cost = count * 100;
            
            totalCountEl.textContent = count;
            totalCostEl.textContent = `¥${cost.toLocaleString()}`;

            // Update List
            filteredData.forEach(item => {
                const li = document.createElement('li');
                li.className = 'history-item';
                
                // Format date nicely
                const dateObj = new Date(item.date + 'T' + item.time);
                const dateDisplay = `${item.date} ${item.time.slice(0,5)}`; // YYYY-MM-DD HH:MM

                li.innerHTML = `
                    <div class="history-info">
                        <span class="history-date">${dateDisplay}</span>
                        ${item.note ? `<span class="history-note">${item.note}</span>` : ''}
                    </div>
                `;
                historyList.appendChild(li);
            });
        };

        // Initial Render
        render(monthFilter.value);

        // Event Listener
        monthFilter.addEventListener('change', (e) => {
            render(e.target.value);
        });

        loading.classList.add('hidden');

    } catch (error) {
        console.error(error);
        historyList.innerHTML = `<li class="message error">Failed to load data: ${error.message}</li>`;
        loading.classList.add('hidden');
    }
}
