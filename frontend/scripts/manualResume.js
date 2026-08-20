// scripts/manualResume.js

/* ========== THEME SYNC ========== */
function initializeTheme() {
    const theme = localStorage.getItem("theme") || "light";
    document.body.setAttribute("data-theme", theme);
}

function syncThemeWithGlobal() {
    window.addEventListener("theme-change", (e) => {
        const theme = e.detail || "light";
        document.body.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Initialize theme
    initializeTheme();
    syncThemeWithGlobal();

    // Add at least one empty block for each multi section
    addEducationItem();
    addExperienceItem();
    addProjectItem();
    addCertItem();
    addAchievementItem();

    // Button listeners
    document.getElementById("add-education-btn").addEventListener("click", addEducationItem);
    document.getElementById("add-experience-btn").addEventListener("click", addExperienceItem);
    document.getElementById("add-project-btn").addEventListener("click", addProjectItem);
    document.getElementById("add-cert-btn").addEventListener("click", addCertItem);
    document.getElementById("add-achievement-btn").addEventListener("click", addAchievementItem);

    document.getElementById("save-draft-btn").addEventListener("click", () => {
        const data = collectFormData();
        saveDraftToLocal(data);
    });

    document.getElementById("save-backend-btn").addEventListener("click", async () => {
        const data = collectFormData();
        const ok = basicValidate(data);
        if (!ok) return;
        saveDraftToLocal(data); // optional auto draft
        await saveToBackend(data);
    });

   const aiBtn = document.getElementById("ai-fill-btn");

    if (aiBtn) {
         aiBtn.addEventListener("click", async () => {
            await generateAIResume();
        });
    }

    // Load saved draft if exists
    loadDraftFromLocal();
});

/* ========== AI RESUME GENERATION ========== */

async function generateAIResume() {
    showStatus("", "");

    const aiBtn = document.getElementById("ai-fill-btn");
    const originalText = aiBtn.textContent;

    aiBtn.disabled = true;
    aiBtn.textContent = "⏳ Generating...";

    try {

        const currentData = collectFormData();

        const baseUrl = window.API_BASE || "http://127.0.0.1:3000";

        console.log("[AI Resume] Sending request to backend...");

        const response = await fetch(`${baseUrl}/api/ai/resume/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + (localStorage.getItem("token") || "")
            },
            body: JSON.stringify({
                name: currentData.fullName,
                email: currentData.email,
                phone: currentData.phone,
                title:
                    currentData.experience.length > 0
                        ? currentData.experience[0].role
                        : "Student",
                experience:
                    currentData.experience
                        .map(e => `${e.role} at ${e.company}`)
                        .join(", "),
                skills: currentData.technicalSkills,
                summary: currentData.summary
            })
        });

        let aiData;

        if (response.ok) {

            const result = await response.json();

            console.log(result);

            aiData = {
                fullName: currentData.fullName,
                email: currentData.email,
                phone: currentData.phone,
                location: currentData.location,
                linkedin: currentData.linkedin,
                github: currentData.github,
                portfolio: currentData.portfolio,
                summary: currentData.summary,
                technicalSkills: currentData.technicalSkills,
                softSkills: currentData.softSkills,
                languages: currentData.languages,
                hobbies: currentData.hobbies,
                education: currentData.education,
                experience: currentData.experience,
                projects: currentData.projects,
                certifications: currentData.certifications,
                achievements: currentData.achievements
            };

        } else {

            console.warn("Backend AI unavailable. Using mock data.");

            aiData = generateMockResumeData();
        }

        fillFormWithAIData(aiData);

        showStatus("✅ AI Resume Generated Successfully", "success");

    } catch (err) {

        console.error(err);

        fillFormWithAIData(generateMockResumeData());

        showStatus("⚠ Using Mock Resume", "error");
    }

    aiBtn.disabled = false;
    aiBtn.textContent = originalText;
}
function fillFormWithAIData(data) {

    console.log("[AI Resume] Filling form...");

    if (!data) return;

    // Basic Details
    document.getElementById("fullName").value = data.fullName || "";
    document.getElementById("email").value = data.email || "";
    document.getElementById("phone").value = data.phone || "";
    document.getElementById("location").value = data.location || "";
    document.getElementById("linkedin").value = data.linkedin || "";
    document.getElementById("github").value = data.github || "";
    document.getElementById("portfolio").value = data.portfolio || "";
    document.getElementById("summary").value = data.summary || "";
    document.getElementById("technicalSkills").value = data.technicalSkills || "";
    document.getElementById("softSkills").value = data.softSkills || "";
    document.getElementById("languages").value = data.languages || "";
    document.getElementById("hobbies").value = data.hobbies || "";

    // ===========================
    // Education
    // ===========================
    const eduList = document.getElementById("education-list");
    eduList.innerHTML = "";

    if (data.education && data.education.length) {
        data.education.forEach(e => addEducationItem(e));
    } else {
        addEducationItem();
    }

    // ===========================
    // Experience
    // ===========================
    const expList = document.getElementById("experience-list");
    expList.innerHTML = "";

    if (data.experience && data.experience.length) {
        data.experience.forEach(e => addExperienceItem(e));
    } else {
        addExperienceItem();
    }

    // ===========================
    // Projects
    // ===========================
    const projectList = document.getElementById("project-list");
    projectList.innerHTML = "";

    if (data.projects && data.projects.length) {
        data.projects.forEach(p => addProjectItem(p));
    } else {
        addProjectItem();
    }

    // ===========================
    // Certifications
    // ===========================
    const certList = document.getElementById("cert-list");
    certList.innerHTML = "";

    if (data.certifications && data.certifications.length) {
        data.certifications.forEach(c => addCertItem(c));
    } else {
        addCertItem();
    }

    // ===========================
    // Achievements
    // ===========================
    const achievementList = document.getElementById("achievement-list");
    achievementList.innerHTML = "";

    if (data.achievements && data.achievements.length) {
        data.achievements.forEach(a => addAchievementItem(a));
    } else {
        addAchievementItem();
    }

    console.log("✅ Resume Form Filled Successfully");
}

function generateMockResumeData() {
    console.log("[AI Resume] Generating mock resume data...");
    
    return {
        fullName: "John Doe",
        email: "john.doe@example.com",
        phone: "+1 (555) 123-4567",
        location: "San Francisco, CA",
        linkedin: "https://linkedin.com/in/johndoe",
        github: "https://github.com/johndoe",
        portfolio: "https://johndoe.com",
        summary: "Experienced Full Stack Developer with 5+ years of expertise in designing and implementing scalable web applications. Passionate about clean code, modern technologies, and delivering exceptional user experiences.",
        technicalSkills: "JavaScript, React, Node.js, MongoDB, PostgreSQL, Docker, AWS, Git, REST APIs, GraphQL",
        softSkills: "Team Leadership, Problem Solving, Communication, Project Management, Agile Methodology",
        languages: "English (Fluent), Spanish (Intermediate), French (Basic)",
        hobbies: "Open Source Contribution, Tech Blogging, Hiking, Photography",
        education: [
            {
                degree: "Bachelor of Science in Computer Science",
                institute: "University of California, Berkeley",
                duration: "2018 - 2022",
                score: "3.8 / 4.0"
            },
            {
                degree: "Advanced Diploma in Web Development",
                institute: "Tech Academy",
                duration: "2017 - 2018",
                score: "95%"
            }
        ],
        experience: [
            {
                company: "Tech Solutions Inc.",
                position: "Senior Full Stack Developer",
                duration: "Jan 2022 - Present",
                description: "Led development of microservices architecture. Improved performance by 40%. Mentored 3 junior developers."
            },
            {
                company: "Digital Innovations Ltd.",
                position: "Full Stack Developer",
                duration: "Jun 2020 - Dec 2021",
                description: "Developed and maintained 5+ production applications. Implemented CI/CD pipelines. Reduced load time by 50%."
            }
        ],
        projects: [
            {
                title: "E-Commerce Platform",
                description: "Built scalable e-commerce platform using MERN stack. 10K+ active users.",
                link: "https://github.com/johndoe/ecommerce"
            },
            {
                title: "Real-time Collaboration Tool",
                description: "Developed WebSocket-based real-time collaboration platform with 99.9% uptime.",
                link: "https://github.com/johndoe/collab-tool"
            }
        ],
        certifications: [
            {
                name: "AWS Certified Solutions Architect",
                org: "Amazon Web Services",
                date: "2023"
            },
            {
                name: "Google Cloud Professional Cloud Architect",
                org: "Google Cloud",
                date: "2022"
            }
        ],
        achievements: [
            {
                text: "Ranked #1 Developer at Company Hackathon 2023",
                extra: "Innovative solution for real-time data processing"
            },
            {
                text: "Open Source Contributor - 500+ Stars",
                extra: "Active contributor to popular GitHub projects"
            },
            {
                text: "Tech Speaker - JSConf 2023",
                extra: "Presented on 'Scaling Node.js Applications'"
            }
        ]
    };
}

function showStatus(message, type = "") {
    const el = document.getElementById("statusText");
    if (!el) return;
    el.textContent = message || "";
    el.classList.remove("success", "error");
    if (type) el.classList.add(type);
}

/* ---------- Dynamic blocks ---------- */

function createRemoveButton(container, item) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "remove-btn";
    btn.textContent = "Remove";
    btn.addEventListener("click", () => {
        container.removeChild(item);
    });
    return btn;
}

function addEducationItem(prefill = {}) {
    const list = document.getElementById("education-list");
    const item = document.createElement("div");
    item.className = "multi-item education-item";
    item.innerHTML = `
        <div class="two-col">
            <div class="form-group">
                <label>Degree</label>
                <input type="text" class="education-degree" placeholder="B.Tech CSE" />
            </div>
            <div class="form-group">
                <label>Institute</label>
                <input type="text" class="education-institute" placeholder="JNTU, College Name" />
            </div>
        </div>
        <div class="two-col">
            <div class="form-group">
                <label>Duration</label>
                <input type="text" class="education-duration" placeholder="2021 - 2025" />
            </div>
            <div class="form-group">
                <label>CGPA / Percentage</label>
                <input type="text" class="education-score" placeholder="8.5 / 10" />
            </div>
        </div>
    `;
    list.appendChild(item);

    if (list.children.length > 1) {
        item.appendChild(createRemoveButton(list, item));
    }

    // prefill if data passed
    if (prefill.degree) item.querySelector(".education-degree").value = prefill.degree;
    if (prefill.institute) item.querySelector(".education-institute").value = prefill.institute;
    if (prefill.duration) item.querySelector(".education-duration").value = prefill.duration;
    if (prefill.score) item.querySelector(".education-score").value = prefill.score;
}

function addExperienceItem(prefill = {}) {
    const list = document.getElementById("experience-list");
    const item = document.createElement("div");
    item.className = "multi-item experience-item";
    item.innerHTML = `
        <div class="two-col">
            <div class="form-group">
                <label>Role / Position</label>
                <input type="text" class="exp-role" placeholder="Software Intern" />
            </div>
            <div class="form-group">
                <label>Company</label>
                <input type="text" class="exp-company" placeholder="Company Name" />
            </div>
        </div>
        <div class="two-col">
            <div class="form-group">
                <label>Duration</label>
                <input type="text" class="exp-duration" placeholder="Jun 2024 - Aug 2024" />
            </div>
            <div class="form-group">
                <label>Location</label>
                <input type="text" class="exp-location" placeholder="Hyderabad (Remote)" />
            </div>
        </div>
        <div class="form-group">
            <label>Responsibilities / Work (bullet style text)</label>
            <textarea class="exp-details" rows="2"
                placeholder="- Built feature X
- Improved Y by 20%"></textarea>
        </div>
    `;
    list.appendChild(item);

    if (list.children.length > 1) {
        item.appendChild(createRemoveButton(list, item));
    }

    if (prefill.role) item.querySelector(".exp-role").value = prefill.role;
    if (prefill.company) item.querySelector(".exp-company").value = prefill.company;
    if (prefill.duration) item.querySelector(".exp-duration").value = prefill.duration;
    if (prefill.location) item.querySelector(".exp-location").value = prefill.location;
    if (prefill.details) item.querySelector(".exp-details").value = prefill.details;
}

function addProjectItem(prefill = {}) {
    const list = document.getElementById("project-list");
    const item = document.createElement("div");
    item.className = "multi-item project-item";
    item.innerHTML = `
        <div class="two-col">
            <div class="form-group">
                <label>Project Title</label>
                <input type="text" class="proj-title" placeholder="AI Interview Prep Assistant" />
            </div>
            <div class="form-group">
                <label>Tech Stack</label>
                <input type="text" class="proj-tech" placeholder="React, Node.js, MongoDB" />
            </div>
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea class="proj-desc" rows="2"
                placeholder="Short description of what the project does and your role."></textarea>
        </div>
        <div class="form-group">
            <label>GitHub / Live Link</label>
            <input type="url" class="proj-link" placeholder="https://github.com/..." />
        </div>
    `;
    list.appendChild(item);

    if (list.children.length > 1) {
        item.appendChild(createRemoveButton(list, item));
    }

    if (prefill.title) item.querySelector(".proj-title").value = prefill.title;
    if (prefill.tech) item.querySelector(".proj-tech").value = prefill.tech;
    if (prefill.desc) item.querySelector(".proj-desc").value = prefill.desc;
    if (prefill.link) item.querySelector(".proj-link").value = prefill.link;
}

function addCertItem(prefill = {}) {
    const list = document.getElementById("cert-list");
    const item = document.createElement("div");
    item.className = "multi-item cert-item";
    item.innerHTML = `
        <div class="two-col">
            <div class="form-group">
                <label>Certificate Name</label>
                <input type="text" class="cert-name" placeholder="AWS Cloud Practitioner" />
            </div>
            <div class="form-group">
                <label>Issued By</label>
                <input type="text" class="cert-org" placeholder="Amazon Web Services" />
            </div>
        </div>
        <div class="form-group">
            <label>Year / Date</label>
            <input type="text" class="cert-date" placeholder="2024" />
        </div>
    `;
    list.appendChild(item);

    if (list.children.length > 1) {
        item.appendChild(createRemoveButton(list, item));
    }

    if (prefill.name) item.querySelector(".cert-name").value = prefill.name;
    if (prefill.org) item.querySelector(".cert-org").value = prefill.org;
    if (prefill.date) item.querySelector(".cert-date").value = prefill.date;
}

function addAchievementItem(prefill = {}) {
    const list = document.getElementById("achievement-list");
    const item = document.createElement("div");
    item.className = "multi-item achievement-item";
    item.innerHTML = `
        <div class="form-group">
            <label>Achievement</label>
            <input type="text" class="ach-text"
                placeholder="Ranked top 5 in coding contest, etc." />
        </div>
        <div class="form-group">
            <label>Year / Details (optional)</label>
            <input type="text" class="ach-extra" placeholder="2023, College Level" />
        </div>
    `;
    list.appendChild(item);

    if (list.children.length > 1) {
        item.appendChild(createRemoveButton(list, item));
    }

    if (prefill.text) item.querySelector(".ach-text").value = prefill.text;
    if (prefill.extra) item.querySelector(".ach-extra").value = prefill.extra;
}

/* ---------- Collect form data ---------- */

function collectFormData() {
    const data = {
        fullName: document.getElementById("fullName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        location: document.getElementById("location").value.trim(),
        linkedin: document.getElementById("linkedin").value.trim(),
        github: document.getElementById("github").value.trim(),
        portfolio: document.getElementById("portfolio").value.trim(),
        summary: document.getElementById("summary").value.trim(),
        technicalSkills: document.getElementById("technicalSkills").value.trim(),
        softSkills: document.getElementById("softSkills").value.trim(),
        languages: document.getElementById("languages").value.trim(),
        hobbies: document.getElementById("hobbies").value.trim(),
        education: [],
        experience: [],
        projects: [],
        certifications: [],
        achievements: []
    };

    // Education
    document.querySelectorAll(".education-item").forEach(item => {
        const degree = item.querySelector(".education-degree").value.trim();
        const institute = item.querySelector(".education-institute").value.trim();
        const duration = item.querySelector(".education-duration").value.trim();
        const score = item.querySelector(".education-score").value.trim();
        if (degree || institute || duration || score) {
            data.education.push({ degree, institute, duration, score });
        }
    });

    // Experience
    document.querySelectorAll(".experience-item").forEach(item => {
        const role = item.querySelector(".exp-role").value.trim();
        const company = item.querySelector(".exp-company").value.trim();
        const duration = item.querySelector(".exp-duration").value.trim();
        const location = item.querySelector(".exp-location").value.trim();
        const details = item.querySelector(".exp-details").value.trim();
        if (role || company || duration || details) {
            data.experience.push({ role, company, duration, location, details });
        }
    });

    // Projects
    document.querySelectorAll(".project-item").forEach(item => {
        const title = item.querySelector(".proj-title").value.trim();
        const tech = item.querySelector(".proj-tech").value.trim();
        const desc = item.querySelector(".proj-desc").value.trim();
        const link = item.querySelector(".proj-link").value.trim();
        if (title || desc || tech || link) {
            data.projects.push({ title, tech, desc, link });
        }
    });

    // Certifications
    document.querySelectorAll(".cert-item").forEach(item => {
        const name = item.querySelector(".cert-name").value.trim();
        const org = item.querySelector(".cert-org").value.trim();
        const date = item.querySelector(".cert-date").value.trim();
        if (name || org || date) {
            data.certifications.push({ name, org, date });
        }
    });

    // Achievements
    document.querySelectorAll(".achievement-item").forEach(item => {
        const text = item.querySelector(".ach-text").value.trim();
        const extra = item.querySelector(".ach-extra").value.trim();
        if (text || extra) {
            data.achievements.push({ text, extra });
        }
    });

    return data;
}

/* ---------- Validation ---------- */

function basicValidate(data) {
    if (!data.fullName) {
        showStatus("Full Name is required.", "error");
        return false;
    }
    if (!data.email) {
        showStatus("Email is required.", "error");
        return false;
    }
    return true;
}

/* ---------- Local storage ---------- */

const DRAFT_KEY = "manualResumeDraft";

function saveDraftToLocal(data) {
    try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        showStatus("Draft saved locally on this device ✅", "success");
    } catch (err) {
        console.error("Error saving draft", err);
        showStatus("Unable to save draft (local storage error).", "error");
    }
}

function loadDraftFromLocal() {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);

        document.getElementById("fullName").value = data.fullName || "";
        document.getElementById("email").value = data.email || "";
        document.getElementById("phone").value = data.phone || "";
        document.getElementById("location").value = data.location || "";
        document.getElementById("linkedin").value = data.linkedin || "";
        document.getElementById("github").value = data.github || "";
        document.getElementById("portfolio").value = data.portfolio || "";
        document.getElementById("summary").value = data.summary || "";
        document.getElementById("technicalSkills").value = data.technicalSkills || "";
        document.getElementById("softSkills").value = data.softSkills || "";
        document.getElementById("languages").value = data.languages || "";
        document.getElementById("hobbies").value = data.hobbies || "";

        // Clear default items and repopulate lists
        document.getElementById("education-list").innerHTML = "";
        (data.education || []).forEach(e => addEducationItem(e));
        if (!data.education || data.education.length === 0) addEducationItem();

        document.getElementById("experience-list").innerHTML = "";
        (data.experience || []).forEach(e => addExperienceItem(e));
        if (!data.experience || data.experience.length === 0) addExperienceItem();

        document.getElementById("project-list").innerHTML = "";
        (data.projects || []).forEach(p => addProjectItem(p));
        if (!data.projects || data.projects.length === 0) addProjectItem();

        document.getElementById("cert-list").innerHTML = "";
        (data.certifications || []).forEach(c => addCertItem(c));
        if (!data.certifications || data.certifications.length === 0) addCertItem();

        document.getElementById("achievement-list").innerHTML = "";
        (data.achievements || []).forEach(a => addAchievementItem(a));
        if (!data.achievements || data.achievements.length === 0) addAchievementItem();

        showStatus("Draft loaded from local storage ✨");
    } catch (err) {
        console.error("Error loading draft", err);
    }
}

/* ---------- Backend save ---------- */

async function saveToBackend(data) {
    // Use correct backend URL and endpoint
    const baseUrl = window.API_BASE || "http://127.0.0.1:3000";
    const url = baseUrl + "/api/resumes"; // Backend route is /api/resumes

    const token = localStorage.getItem("token");
    if (!token) {
        showStatus("Please login first. Token not found.", "error");
        return;
    }

    showStatus("Saving resume to server...", "");

    try {
        console.log('[Frontend] Sending resume to:', url);
        console.log('[Frontend] Resume data keys:', Object.keys(data));
        
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify(data)
        });

        console.log('[Frontend] Response status:', res.status);
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
            console.error("[Frontend] Save failed:", res.status, errorData);
            showStatus(`Server error: ${errorData.message || 'Failed to save'}`, "error");
            return;
        }

        const json = await res.json().catch(() => ({}));
        console.log("[Frontend] Resume saved:", json);
        showStatus("Resume saved to your account successfully ✅", "success");
    } catch (err) {
        console.error("[Frontend] Network error saving resume", err);
        showStatus("Network error. Could not save resume.", "error");
    }
}
/* ---------- PDF DOWNLOAD FEATURE ---------- */

document.getElementById("download-pdf-btn").addEventListener("click", () => {
    const data = collectFormData();
    generatePDF(data);
});

function generatePDF(data) {

    let expSection = data.experience.map(e =>
        `${e.role} - ${e.company} (${e.duration})
${e.details.split("\n").map(line => "• " + line).join("\n")}
`
    ).join("\n");

    let eduSection = data.education.map(e =>
        `• ${e.degree} - ${e.institute} (${e.duration}) | CGPA: ${e.score}`
    ).join("\n");

    let projectSection = data.projects.map(p =>
        `• ${p.title} [${p.tech}]\n  ${p.desc}\n  ${p.link ? "🔗 " + p.link : ""}`
    ).join("\n\n");

    let certSection = data.certifications.map(c =>
        `• ${c.name} - ${c.org} (${c.date})`
    ).join("\n");

    let achievementSection = data.achievements.map(a =>
        `• ${a.text} ${a.extra ? "(" + a.extra + ")" : ""}`
    ).join("\n");

    const docDefinition = {
        content: [
            { text: data.fullName, style: "header" },
            { text: `${data.phone} | ${data.email} | ${data.location}`, style: "sub" },
            { text: data.linkedin ? "LinkedIn: " + data.linkedin : "", style: "sub" },
            { text: data.github ? "GitHub: " + data.github : "", style: "sub" },
            { text: data.portfolio ? "Portfolio: " + data.portfolio : "", style: "sub" },

            { text: "\nPROFESSIONAL SUMMARY", style: "section" },
            { text: data.summary || "—", margin: [0, 0, 0, 10] },

            { text: "EXPERIENCE", style: "section" },
            { text: expSection || "—", margin: [0, 0, 0, 10] },

            { text: "EDUCATION", style: "section" },
            { text: eduSection || "—", margin: [0, 0, 0, 10] },

            { text: "SKILLS", style: "section" },
            { text: `Technical: ${data.technicalSkills}`, margin: [0, 0, 0, 5] },
            { text: `Soft Skills: ${data.softSkills}`, margin: [0, 0, 0, 10] },

            { text: "PROJECTS", style: "section" },
            { text: projectSection || "—", margin: [0, 0, 0, 10] },

            { text: "CERTIFICATIONS", style: "section" },
            { text: certSection || "—", margin: [0, 0, 0, 10] },

            { text: "ACHIEVEMENTS", style: "section" },
            { text: achievementSection || "—", margin: [0, 0, 0, 10] },

            { text: "LANGUAGES", style: "section" },
            { text: data.languages || "—", margin: [0, 0, 0, 10] },

            { text: "HOBBIES & INTERESTS", style: "section" },
            { text: data.hobbies || "—", margin: [0, 0, 0, 10] }
        ],

        styles: {
            header: {
                fontSize: 22,
                bold: true,
                margin: [0, 0, 0, 6]
            },
            sub: {
                fontSize: 10,
                color: "#555"
            },
            section: {
                fontSize: 14,
                bold: true,
                margin: [0, 12, 0, 4]
            }
        },

        pageMargins: [40, 40, 40, 40]
    };

    pdfMake.createPdf(docDefinition).download(`${data.fullName}_Resume.pdf`);
}
