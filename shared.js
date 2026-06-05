const STORAGE_KEY = "uhh_staff_registry_v1";
const CASES_KEY = "uhh_hcpc_cases_v1";
const TEAM_KEY = "uhh_hcpc_team_v1";
const GROUP_ROLES_KEY = "uhh_group_roles_v1";
const SPECIALITY_ROLES_KEY = "uhh_speciality_roles_v1";
const ANNOUNCEMENTS_KEY = "uhh_announcements_v1";

const DEFAULT_GROUP_ROLES = [
  "Awaiting Training", "Medical Student", "Trainee Healthcare Assistant",
  "Healthcare Assistant", "Student Nurse", "Staff Nurse", "Senior Staff Nurse",
  "Junior Doctor", "Registrar", "Consultant", "Senior Consultant", "Matron",
  "Clinical Lead", "Clinical Director", "Medical Director", "Director of Nursing",
  "Director of Operations", "Director of Hospital Affairs", "Deputy Chief Executive",
  "Chief Executive Officer"
];

const DEFAULT_SPECIALITIES = [
  "Emergency Medicine", "Trauma Surgery", "General Surgery", "Cardiology",
  "Neurology", "Respiratory Medicine", "Paediatrics", "Obstetrics & Gynaecology",
  "Maternity", "Radiology", "Anaesthetics", "Intensive Care", "Mental Health",
  "Paramedic Practice", "Pharmacy", "Physiotherapy", "Safeguarding",
  "Clinical Education", "Infection Prevention", "Patient Safety", "Governance & Compliance"
];

let staff = [];
let cases = [];
let hcpcTeam = [];
let groupRoles = [];
let specialityRoles = [];
let announcements = [];

function loadJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : fallback;
  } catch { return fallback; }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function migrateStaffRecord(r) {
  if (!r.roles) {
    r.roles = r.role ? [r.role] : [];
    delete r.role;
  }
  if (!r.specialityRoles) {
    const old = r.specialityRole;
    r.specialityRoles = old && old !== "None" ? [old] : [];
    delete r.specialityRole;
  }
  return r;
}

function loadAllData() {
  staff = loadJson(STORAGE_KEY, []).map(migrateStaffRecord);
  cases = loadJson(CASES_KEY, []);
  hcpcTeam = loadJson(TEAM_KEY, []);
  groupRoles = loadJson(GROUP_ROLES_KEY, DEFAULT_GROUP_ROLES);
  specialityRoles = loadJson(SPECIALITY_ROLES_KEY, DEFAULT_SPECIALITIES);
  announcements = loadJson(ANNOUNCEMENTS_KEY, []);
}

function saveStaff() { saveJson(STORAGE_KEY, staff); }
function saveCases() { saveJson(CASES_KEY, cases); }
function saveTeam() { saveJson(TEAM_KEY, hcpcTeam); }
function saveGroupRoles() { saveJson(GROUP_ROLES_KEY, groupRoles); }
function saveSpecialityRoles() { saveJson(SPECIALITY_ROLES_KEY, specialityRoles); }
function saveAnnouncements() { saveJson(ANNOUNCEMENTS_KEY, announcements); }

function generateRegistrationNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  const checksum = Math.floor(10 + Math.random() * 89);
  return `UHH-HCPC-RBX-${year}-${random}-${checksum}`;
}

function generateCaseNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `UHH-TRB-${year}-${random}`;
}

function formatDate(iso) {
  if (!iso) return "Not recorded";
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

function updateStats() {
  const el = id => document.getElementById(id);
  if (el("totalStaff")) el("totalStaff").textContent = staff.length;
  if (el("activeStaff")) el("activeStaff").textContent = staff.filter(s => s.status === "Active").length;
  if (el("revokedStaff")) el("revokedStaff").textContent = staff.filter(s => s.status === "Revoked").length;
  if (el("totalCases")) el("totalCases").textContent = cases.length;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function createTagPicker(selectEl, containerEl, initialOptions, initialValues) {
  let options = [...(initialOptions || [])];
  let selected = [...(initialValues || [])];

  containerEl.addEventListener("click", e => {
    const btn = e.target.closest("[data-remove]");
    if (btn) {
      selected.splice(parseInt(btn.dataset.remove), 1);
      render();
    }
  });

  selectEl.addEventListener("change", () => {
    const val = selectEl.value;
    if (val && !selected.includes(val)) {
      selected.push(val);
      selectEl.value = "";
      render();
    }
  });

  function render() {
    containerEl.innerHTML = selected.length === 0
      ? `<span class="picker-placeholder">None selected — use the dropdown above to add</span>`
      : selected.map((v, i) =>
          `<span class="chip">${escapeHtml(v)} <button type="button" data-remove="${i}">&#215;</button></span>`
        ).join("");

    selectEl.innerHTML = `<option value="">Add...</option>`;
    options.filter(o => !selected.includes(o)).forEach(o => {
      const opt = document.createElement("option");
      opt.value = o;
      opt.textContent = o;
      selectEl.appendChild(opt);
    });
  }

  render();

  return {
    getValues() { return [...selected]; },
    setOptions(opts) { options = [...opts]; render(); },
    reset() { selected = []; render(); }
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const currentFile = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav a").forEach(a => {
    if (a.getAttribute("href") === currentFile) a.classList.add("nav-active");
  });
});


function makeLinkHtml(url) {
  const clean = String(url || "").trim();
  if (!clean) return "";
  const href = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
  return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(clean)}</a>`;
}

function renderHospitalNews(limit = 3) {
  const list = document.getElementById("hospitalNewsList");
  if (!list) return;

  const items = announcements
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);

  if (items.length === 0) {
    list.innerHTML = `
      <div class="empty-news">
        <strong>No announcements yet.</strong>
        <p>Staff can create hospital updates from the Announcements page.</p>
      </div>`;
    return;
  }

  list.innerHTML = items.map(a => `
    <article class="news-card">
      ${a.image ? `<img src="${escapeHtml(a.image)}" alt="${escapeHtml(a.title)} announcement image" />` : ""}
      <div class="news-card-body">
        <div class="news-meta">${escapeHtml(a.category || "Hospital News")} · ${formatDate(a.createdAt)}</div>
        <h3>${escapeHtml(a.title)}</h3>
        <p>${escapeHtml(a.text).replace(/\n/g, "<br>")}</p>
        <div class="news-footer">
          <span>Posted by ${escapeHtml(a.author || "UHH Staff")}</span>
          ${a.link ? makeLinkHtml(a.link) : ""}
        </div>
      </div>
    </article>
  `).join("");
}

function renderAnnouncementManager() {
  const list = document.getElementById("announcementManagerList");
  if (!list) return;

  const items = announcements
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (items.length === 0) {
    list.innerHTML = `<div class="empty-news"><strong>No announcements created yet.</strong></div>`;
    return;
  }

  list.innerHTML = items.map(a => `
    <article class="news-card manager-card">
      ${a.image ? `<img src="${escapeHtml(a.image)}" alt="${escapeHtml(a.title)} announcement image" />` : ""}
      <div class="news-card-body">
        <div class="news-meta">${escapeHtml(a.category || "Hospital News")} · ${formatDate(a.createdAt)}</div>
        <h3>${escapeHtml(a.title)}</h3>
        <p>${escapeHtml(a.text).replace(/\n/g, "<br>")}</p>
        <div class="news-footer">
          <span>Posted by ${escapeHtml(a.author || "UHH Staff")}</span>
          ${a.link ? makeLinkHtml(a.link) : ""}
        </div>
        <div class="row-actions" style="margin-top:12px;">
          <button class="small revoke" onclick="deleteAnnouncement('${a.id}')">Delete</button>
        </div>
      </div>
    </article>
  `).join("");
}

function deleteAnnouncement(id) {
  if (!confirm("Delete this announcement?")) return;
  announcements = announcements.filter(a => a.id !== id);
  saveAnnouncements();
  renderAnnouncementManager();
  renderHospitalNews();
}
