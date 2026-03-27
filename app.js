document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const form = document.getElementById('report-form');
    const inputs = form.querySelectorAll('input, textarea, select');
    const reportPreview = document.getElementById('reportPreview');
    const clearBtn = document.getElementById('clearBtn');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const printBtn = document.getElementById('printBtn');
    const themeToggle = document.getElementById('theme-toggle');
    const reportTimestamp = document.getElementById('report-timestamp');

    // Theme Setup
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }

    // Toggle Theme
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.body.removeAttribute('data-theme');
            themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
        } else {
            document.body.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        }
    });

    // Format Date for top bar
    const updateTimestamp = () => {
        const now = new Date();
        reportTimestamp.textContent = now.toLocaleString();
    };
    updateTimestamp();
    setInterval(updateTimestamp, 60000);

    // Initial Empty State HTML
    const emptyStateHTML = `
        <div class="placeholder-state">
            <i class="fa-solid fa-file-medical empty-icon"></i>
            <p>Start typing in the form to see the automated patient summary here.</p>
        </div>
    `;

    // Data collection and render function
    let debounceTimer;
    const generateReport = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            // Collect data
            const data = {
                patientName: document.getElementById('patientName').value.trim(),
                age: document.getElementById('age').value.trim(),
                gender: document.getElementById('gender').value.trim(),
                visitDate: document.getElementById('visitDate').value,
                chiefComplaint: document.getElementById('chiefComplaint').value.trim(),
                hpi: document.getElementById('hpi').value.trim(),
                medicalHistory: document.getElementById('medicalHistory').value.trim(),
                bp: document.getElementById('bp').value.trim(),
                hr: document.getElementById('hr').value.trim(),
                temp: document.getElementById('temp').value.trim(),
                rr: document.getElementById('rr').value.trim(),
                spo2: document.getElementById('spo2').value.trim(),
                physicalExam: document.getElementById('physicalExam').value.trim(),
                assessment: document.getElementById('assessment').value.trim(),
                plan: document.getElementById('plan').value.trim(),
            };

            // Format Date
            let formattedDate = '';
            if (data.visitDate) {
                const d = new Date(data.visitDate);
                formattedDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000).toLocaleDateString();
            }

            // Check if form is completely empty
            const isCompletelyEmpty = Object.values(data).every(val => !val);

            if (isCompletelyEmpty) {
                reportPreview.innerHTML = emptyStateHTML;
                return;
            }

            try {
                // Show loading state
                reportPreview.innerHTML = `
                    <div class="placeholder-state">
                        <i class="fa-solid fa-spinner fa-spin empty-icon"></i>
                        <p>Generating report from backend...</p>
                    </div>
                `;

                // Fetch from Python Backend
                const backendUrl = `http://127.0.0.1:8000/api/generate-report`;
                const response = await fetch(backendUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (!response.ok) throw new Error("Backend Error");
                
                const result = await response.json();
                const reportText = result.report.replace(/\n/g, '<br>');

                // Construct HTML 
                const html = `
                    <div class="patient-header">
                        <h1>${data.patientName || 'Anonymous Patient'}</h1>
                        <div class="patient-meta">
                            <span><strong>Age:</strong> ${data.age || '--'}</span>
                            <span><strong>Gender:</strong> ${data.gender || '--'}</span>
                            <span><strong>Date of Visit:</strong> ${formattedDate || '--'}</span>
                            <span><strong>Vector DB ID:</strong> ${result.report_id.substring(0,8) || '--'}</span>
                        </div>
                    </div>

                    <div class="soap-section" style="margin-top: 1.5rem;">
                        <h3>Clinical Note</h3>
                        <div class="soap-content" style="line-height: 1.6;">
                            ${reportText}
                        </div>
                    </div>
                `;

                reportPreview.innerHTML = html;
                document.querySelector('.report-footer').style.display = 'block'; // Show sig line for printing
            } catch (error) {
                console.error("Error connecting to backend:", error);
                reportPreview.innerHTML = `
                    <div class="placeholder-state" style="color: #dc2626;">
                        <i class="fa-solid fa-triangle-exclamation empty-icon"></i>
                        <p>Failed to connect to backend on port 8000.</p>
                        <p style="font-size: 0.8em; margin-top: 0.5rem; opacity: 0.8;">Make sure uvicorn is running: <code>uvicorn main:app --reload</code> in the backend dir.</p>
                    </div>
                `;
            }
        }, 1200); // 1.2s debounce to avoid spamming the backend/vector DB
    };

    // Live update listener
    inputs.forEach(input => {
        input.addEventListener('input', generateReport);
        input.addEventListener('change', generateReport);
    });

    // Generate Button (acts as force refresh + scroll to mobile view)
    generateBtn.addEventListener('click', () => {
        generateReport();
        if (window.innerWidth < 1024) {
            document.querySelector('.output-section').scrollIntoView({ behavior: 'smooth' });
        }
    });

    // Clear Button
    clearBtn.addEventListener('click', () => {
        if(confirm("Are you sure you want to clear the form?")) {
            form.reset();
            reportPreview.innerHTML = emptyStateHTML;
            document.querySelector('.report-footer').style.display = 'none';
        }
    });

    // Copy to Clipboard
    copyBtn.addEventListener('click', () => {
        // Create plain text version
        const data = {
            name: document.getElementById('patientName').value.trim() || 'Anonymous',
            date: document.getElementById('visitDate').value || '--',
            cc: document.getElementById('chiefComplaint').value.trim() || 'N/A',
            hpi: document.getElementById('hpi').value.trim() || 'N/A',
            pmh: document.getElementById('medicalHistory').value.trim() || 'N/A',
            exam: document.getElementById('physicalExam').value.trim() || 'N/A',
            assessment: document.getElementById('assessment').value.trim() || 'N/A',
            plan: document.getElementById('plan').value.trim() || 'N/A',
        };

        const v = [
            document.getElementById('bp').value ? `BP: ${document.getElementById('bp').value}` : '',
            document.getElementById('hr').value ? `HR: ${document.getElementById('hr').value}` : '',
            document.getElementById('temp').value ? `Temp: ${document.getElementById('temp').value}` : '',
            document.getElementById('rr').value ? `RR: ${document.getElementById('rr').value}` : '',
            document.getElementById('spo2').value ? `SpO2: ${document.getElementById('spo2').value}` : ''
        ].filter(Boolean).join(', ');

        const textToCopy = `
CLINICAL ENCOUNTER NOTE

Patient Name: ${data.name}
Date format: ${data.date}

SUBJECTIVE
Chief Complaint: ${data.cc}
HPI: 
${data.hpi}

Past Medical History: 
${data.pmh}

OBJECTIVE
Vitals: ${v || 'Not recorded'}
Physical Exam:
${data.exam}

ASSESSMENT
${data.assessment}

PLAN
${data.plan}
        `.trim();

        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fa-solid fa-check text-green-500"></i>';
            setTimeout(() => {
                copyBtn.innerHTML = originalIcon;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('Could not copy text. Please try again.');
        });
    });

    // Print / PDF Button
    printBtn.addEventListener('click', () => {
        window.print();
    });
});
