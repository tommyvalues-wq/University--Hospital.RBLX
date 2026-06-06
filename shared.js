const STORAGE_KEY = "uhh_staff_registry_v1";
const ANNOUNCEMENTS_KEY = "uhh_announcements_v1";
const GROUP_ROLES_KEY = "uhh_group_roles_v1";
const SPECIALITY_ROLES_KEY = "uhh_speciality_roles_v1";

let staff = [];
let announcements = [];
let groupRoles = [
  "Awaiting Training",
  "Medical Student",
  "Trainee Healthcare Assistant",
  "Healthcare Assistant",
  "Student Nurse",
  "Staff Nurse",
  "Senior Staff Nurse",
  "Junior Doctor",
  "Registrar",
  "Consultant",
  "Senior Consultant",
  "Matron",
  "Clinical Lead",
  "Clinical Director",
  "Medical Director",
  "Chief Executive Officer"
];

let specialityRoles = [
  "Emergency Medicine",
  "Trauma Surgery",
  "General Surgery",
  "Cardiology",
  "Neurology",
  "Respiratory Medicine",
  "Paediatrics",
  "Radiology",
  "Anaesthetics",
  "Intensive Care",
  "Mental Health",
  "Pharmacy",
  "Physiotherapy",
  "Safeguarding"
];

function loadJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadAllData() {
  staff = loadJson(STORAGE_KEY, []);
  announcements = loadJson(ANNOUNCEMENTS_KEY, []);
  groupRoles = loadJson(GROUP_ROLES_KEY, groupRoles);
  specialityRoles = loadJson(SPECIALITY_ROLES_KEY, specialityRoles);
}

function saveStaff() {
  saveJson(STORAGE_KEY, staff);
}

function saveAnnouncements() {
  saveJson(ANNOUNCEMENTS_KEY, announcements);
}

function generateRegistrationNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `UHH-HCPC-${year}-${random}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createTagPicker(selectEl, containerEl, options) {
  let selected = [];

  function render() {
    containerEl.innerHTML = selected.length
      ? selected.map((v, i) => `<span class="chip">${escapeHtml(v)} <button type="button" data-remove="${i}">×</button></span>`).join("")
      : "None selected";

    containerEl.querySelectorAll("button[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => {
        selected.splice(Number(btn.dataset.remove), 1);
        render();
      });
    });

    selectEl.innerHTML = `<option value="">Add...</option>`;
    options
      .filter(option => !selected.includes(option))
      .forEach(option => {
        const opt = document.createElement("option");
        opt.value = option;
        opt.textContent = option;
        selectEl.appendChild(opt);
      });
  }

  selectEl.addEventListener("change", () => {
    if (selectEl.value && !selected.includes(selectEl.value)) {
      selected.push(selectEl.value);
      selectEl.value = "";
      render();
    }
  });

  render();

  return {
    getValues() {
      return [...selected];
    },
    reset() {
      selected = [];
      render();
    }
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const currentFile = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll("nav a").forEach(a => {
    if (a.getAttribute("href") === currentFile) {
      a.classList.add("nav-active");
    }
  });
});
