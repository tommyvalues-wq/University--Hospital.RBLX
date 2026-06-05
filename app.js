const STORAGE_KEY = "uhh_staff_registry_v1";
const CASES_KEY = "uhh_hcpc_cases_v1";
const TEAM_KEY = "uhh_hcpc_team_v1";
const GROUP_ROLES_KEY = "uhh_group_roles_v1";
const SPECIALITY_ROLES_KEY = "uhh_speciality_roles_v1";

const DEFAULT_GROUP_ROLES = [
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
  "Director of Nursing",
  "Director of Operations",
  "Director of Hospital Affairs",
  "Deputy Chief Executive",
  "Chief Executive Officer"
];

const DEFAULT_SPECIALITIES = [
  "None",
  "Emergency Medicine",
  "Trauma Surgery",
  "General Surgery",
  "Cardiology",
  "Neurology",
  "Respiratory Medicine",
  "Paediatrics",
  "Obstetrics & Gynaecology",
  "Maternity",
  "Radiology",
  "Anaesthetics",
  "Intensive Care",
  "Mental Health",
  "Paramedic Practice",
  "Pharmacy",
  "Physiotherapy",
  "Safeguarding",
  "Clinical Education",
  "Infection Prevention",
  "Patient Safety",
  "Governance & Compliance"
];

let staff = loadJson(STORAGE_KEY, []);
let cases = loadJson(CASES_KEY, []);
let hcpcTeam = loadJson(TEAM_KEY, []);
let groupRoles = loadJson(GROUP_ROLES_KEY, DEFAULT_GROUP_ROLES);
let specialityRoles = loadJson(SPECIALITY_ROLES_KEY, DEFAULT_SPECIALITIES);

function loadJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function saveStaff() { saveJson(STORAGE_KEY, staff); }
function saveCases() { saveJson(CASES_KEY, cases); }
function saveTeam() { saveJson(TEAM_KEY, hcpcTeam); }
function saveGroupRoles() { saveJson(GROUP_ROLES_KEY, groupRoles); }
function saveSpecialityRoles() { saveJson(SPECIALITY_ROLES_KEY, specialityRoles); }

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
  return new Date(iso).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function updateStats() {
  document.getElementById("totalStaff").textContent = staff.length;
  document.getElementById("activeStaff").textContent = staff.filter(s => s.status === "Active").length;
  document.getElementById("revokedStaff").textContent = staff.filter(s => s.status === "Revoked").length;
  document.getElementById("totalCases").textContent = cases.length;
}

function populateSelect(selectId, values, placeholder) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const current = select.value;
  select.innerHTML = `<option value="">${placeholder}</option>`;
  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
  if (values.includes(current)) select.value = current;
}

function refreshRoleSelects() {
  populateSelect("role", groupRoles, "Select group role");
  populateSelect("specialityRole", specialityRoles, "Select speciality role");
  renderRoleChips();
}

function renderStaff(list = staff) {
  const staffTable = document.getElementById("staffTable");
  staffTable.innerHTML = "";

  if (list.length === 0) {
    staffTable.innerHTML = `<tr><td colspan="9">No staff records found.</td></tr>`;
    updateStats();
    refreshCaseStaffOptions();
    return;
  }

  list
    .slice()
    .sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt))
    .forEach(record => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span class="badge ${record.status === "Active" ? "active-badge" : "revoked-badge"}">${escapeHtml(record.status)}</span></td>
        <td><strong>${escapeHtml(record.registrationNumber)}</strong></td>
        <td>${escapeHtml(record.username)}${record.displayName ? `<br><small>${escapeHtml(record.displayName)}</small>` : ""}</td>
        <td>${escapeHtml(record.role)}</td>
        <td>${escapeHtml(record.specialityRole || "None")}</td>
        <td>${escapeHtml(record.department)}</td>
        <td>${escapeHtml(record.rank)}</td>
        <td>${formatDate(record.registeredAt)}<br><small>By ${escapeHtml(record.registeredBy)}</small></td>
        <td>
          <div class="row-actions">
            ${
              record.status === "Active"
                ? `<button class="small revoke" onclick="revokeRecord('${record.id}')">Revoke</button>`
                : `<button class="small restore" onclick="restoreRecord('${record.id}')">Restore</button>`
            }
            <button class="small" onclick="deleteRecord('${record.id}')">Delete</button>
          </div>
        </td>
      `;
      staffTable.appendChild(tr);
    });

  updateStats();
  refreshCaseStaffOptions();
}

function refreshCaseStaffOptions() {
  const caseStaff = document.getElementById("caseStaff");
  if (!caseStaff) return;
  caseStaff.innerHTML = `<option value="">Select staff member</option>`;
  staff.forEach(s => {
    const option = document.createElement("option");
    option.value = s.id;
    option.textContent = `${s.username} — ${s.role} — ${s.registrationNumber}`;
    caseStaff.appendChild(option);
  });
}

function refreshCaseAddedByOptions() {
  const caseAddedBy = document.getElementById("caseAddedBy");
  if (!caseAddedBy) return;
  caseAddedBy.innerHTML = `<option value="">Select HCPC team member</option>`;

  const activeTeam = hcpcTeam.filter(t => t.status === "Active");
  if (activeTeam.length === 0) {
    const option = document.createElement("option");
    option.value = "System Administrator";
    option.textContent = "System Administrator";
    caseAddedBy.appendChild(option);
    return;
  }

  activeTeam.forEach(t => {
    const option = document.createElement("option");
    option.value = t.username;
    option.textContent = `${t.username} — ${t.teamRole}`;
    caseAddedBy.appendChild(option);
  });
}

function renderCases(list = cases) {
  const caseCards = document.getElementById("caseCards");
  if (!caseCards) return;
  caseCards.innerHTML = "";

  if (list.length === 0) {
    caseCards.innerHTML = `<div class="verify-box">No tribunal cases found.</div>`;
    updateStats();
    return;
  }

  list
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach(c => {
      const staffRecord = staff.find(s => s.id === c.staffId);
      const username = staffRecord ? staffRecord.username : c.staffUsername || "Unknown staff member";
      const role = staffRecord ? staffRecord.role : c.staffRole || "Unknown role";
      const speciality = staffRecord ? staffRecord.specialityRole || "None" : c.specialityRole || "None";
      const reg = staffRecord ? staffRecord.registrationNumber : c.registrationNumber || "Unknown registration";

      const div = document.createElement("div");
      const revokedClass = c.outcome === "Registration Revoked" ? "revoked-case" : "";
      const closedClass = c.status === "Closed" ? "closed-case" : "";
      div.className = `case-card ${revokedClass} ${closedClass}`;

      div.innerHTML = `
        <div class="case-head">
          <div>
            <h3>${escapeHtml(c.caseNumber)}: ${escapeHtml(username)}</h3>
            <div class="meta">${escapeHtml(role)} · ${escapeHtml(speciality)} · ${escapeHtml(reg)}</div>
          </div>
          <span class="case-outcome">${escapeHtml(c.outcome)}</span>
        </div>
        <p><strong>Case type:</strong> ${escapeHtml(c.caseType)}</p>
        <p><strong>Status:</strong> ${escapeHtml(c.status)}${c.hearingDate ? ` · <strong>Hearing date:</strong> ${new Date(c.hearingDate).toLocaleDateString("en-GB")}` : ""}</p>
        <p><strong>Punishment:</strong> ${escapeHtml(c.punishment || "None")}</p>
        <p><strong>Summary:</strong><br>${escapeHtml(c.summary)}</p>
        ${c.sanctions ? `<p><strong>Punishment details / notes:</strong><br>${escapeHtml(c.sanctions)}</p>` : ""}
        <p class="meta">Added by ${escapeHtml(c.addedBy)} on ${formatDate(c.createdAt)}</p>
        <div class="row-actions admin-only">
          <button class="small" onclick="editCaseOutcome('${c.id}')">Update outcome</button>
          <button class="small revoke" onclick="deleteCase('${c.id}')">Delete case</button>
        </div>
      `;
      caseCards.appendChild(div);
    });

  updateStats();
}

function renderPublicLookup() {
  const input = document.getElementById("publicLookupInput");
  const result = document.getElementById("publicLookupResult");
  const query = input.value.trim().toLowerCase();

  if (!query) {
    result.className = "lookup-card";
    result.innerHTML = "Search for a staff member to view their registration status, role, speciality, tribunal cases and punishments.";
    return;
  }

  const record = staff.find(s =>
    s.registrationNumber.toLowerCase() === query ||
    s.username.toLowerCase() === query ||
    s.username.toLowerCase().includes(query)
  );

  if (!record) {
    result.className = "lookup-card revoked";
    result.innerHTML = `<strong>No registration found.</strong><br>No UHH record matched that registration number or username.`;
    return;
  }

  const linkedCases = cases.filter(c => c.staffId === record.id || c.registrationNumber === record.registrationNumber);
  const punishments = linkedCases.filter(c => c.punishment && c.punishment !== "None");

  result.className = `lookup-card ${record.status === "Active" ? "active" : "revoked"}`;
  result.innerHTML = `
    <h3>${record.status === "Active" ? "Valid registration" : "Revoked registration"}</h3>
    <div class="profile-grid">
      <div><strong>Roblox username</strong><br>${escapeHtml(record.username)}</div>
      <div><strong>Display name</strong><br>${escapeHtml(record.displayName || "Not listed")}</div>
      <div><strong>Registration number</strong><br>${escapeHtml(record.registrationNumber)}</div>
      <div><strong>Status</strong><br>${escapeHtml(record.status)}</div>
      <div><strong>Group role</strong><br>${escapeHtml(record.role)}</div>
      <div><strong>Speciality</strong><br>${escapeHtml(record.specialityRole || "None")}</div>
      <div><strong>Department</strong><br>${escapeHtml(record.department)}</div>
      <div><strong>Rank level</strong><br>${escapeHtml(record.rank)}</div>
      <div><strong>Registered by</strong><br>${escapeHtml(record.registeredBy)}</div>
      <div><strong>Registered on</strong><br>${formatDate(record.registeredAt)}</div>
    </div>
    ${record.status === "Revoked" ? `<p><strong>Revocation reason:</strong> ${escapeHtml(record.revocationReason || "Not recorded")}</p>` : ""}
    <h4>Tribunal cases (${linkedCases.length})</h4>
    ${
      linkedCases.length === 0
        ? `<p>No tribunal cases are recorded for this registration.</p>`
        : linkedCases.map(c => `
          <div class="case-card ${c.outcome === "Registration Revoked" ? "revoked-case" : ""}">
            <strong>${escapeHtml(c.caseNumber)} — ${escapeHtml(c.caseType)}</strong><br>
            <span class="meta">Status: ${escapeHtml(c.status)} · Outcome: ${escapeHtml(c.outcome)} · Punishment: ${escapeHtml(c.punishment || "None")}</span>
            <p>${escapeHtml(c.summary)}</p>
            ${c.sanctions ? `<p><strong>Punishment details:</strong> ${escapeHtml(c.sanctions)}</p>` : ""}
          </div>
        `).join("")
    }
    <h4>Punishments (${punishments.length})</h4>
    ${
      punishments.length === 0
        ? `<p>No punishments are recorded for this registration.</p>`
        : `<ul>${punishments.map(c => `<li><strong>${escapeHtml(c.punishment)}</strong> — ${escapeHtml(c.caseNumber)} (${escapeHtml(c.outcome)})</li>`).join("")}</ul>`
    }
  `;
}

function renderTeam() {
  const table = document.getElementById("hcpcTeamTable");
  table.innerHTML = "";

  if (hcpcTeam.length === 0) {
    table.innerHTML = `<tr><td colspan="6">No HCPC team members added yet.</td></tr>`;
    refreshCaseAddedByOptions();
    return;
  }

  hcpcTeam
    .slice()
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
    .forEach(t => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span class="badge ${t.status === "Active" ? "active-badge" : "revoked-badge"}">${escapeHtml(t.status)}</span></td>
        <td>${escapeHtml(t.username)}</td>
        <td>${escapeHtml(t.teamRole)}</td>
        <td>${escapeHtml(t.permission)}</td>
        <td>${formatDate(t.addedAt)}<br><small>By ${escapeHtml(t.addedBy)}</small></td>
        <td>
          <div class="row-actions">
            ${
              t.status === "Active"
                ? `<button class="small revoke" onclick="disableTeamMember('${t.id}')">Disable</button>`
                : `<button class="small restore" onclick="enableTeamMember('${t.id}')">Enable</button>`
            }
            <button class="small" onclick="removeTeamMember('${t.id}')">Delete</button>
          </div>
        </td>
      `;
      table.appendChild(tr);
    });

  refreshCaseAddedByOptions();
}

function renderRoleChips() {
  const groupBox = document.getElementById("groupRoleChips");
  const specBox = document.getElementById("specialityRoleChips");
  if (groupBox) {
    groupBox.innerHTML = groupRoles.map((role, index) => `
      <span class="chip">${escapeHtml(role)} <button onclick="removeGroupRole(${index})">x</button></span>
    `).join("");
  }
  if (specBox) {
    specBox.innerHTML = specialityRoles.map((role, index) => `
      <span class="chip">${escapeHtml(role)} <button onclick="removeSpecialityRole(${index})">x</button></span>
    `).join("");
  }
}

document.getElementById("registrationForm").addEventListener("submit", event => {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const duplicate = staff.find(s => s.username.toLowerCase() === username.toLowerCase() && s.status === "Active");

  if (duplicate) {
    alert("This Roblox username already has an active registration. Revoke it before creating another.");
    return;
  }

  const record = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    username,
    displayName: document.getElementById("displayName").value.trim(),
    department: document.getElementById("department").value,
    role: document.getElementById("role").value,
    specialityRole: document.getElementById("specialityRole").value || "None",
    rank: document.getElementById("rank").value,
    registeredBy: document.getElementById("registeredBy").value.trim(),
    notes: document.getElementById("notes").value.trim(),
    registrationNumber: generateRegistrationNumber(),
    status: "Active",
    registeredAt: new Date().toISOString(),
    revokedAt: null
  };

  staff.push(record);
  saveStaff();
  renderStaff();
  document.getElementById("registrationForm").reset();
  renderPublicLookup();
});

document.getElementById("caseForm").addEventListener("submit", event => {
  event.preventDefault();

  const staffRecord = staff.find(s => s.id === document.getElementById("caseStaff").value);
  if (!staffRecord) {
    alert("Select a valid staff member.");
    return;
  }

  const outcome = document.getElementById("caseOutcome").value;
  const punishment = document.getElementById("casePunishment").value;

  const tribunalCase = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    caseNumber: generateCaseNumber(),
    staffId: staffRecord.id,
    staffUsername: staffRecord.username,
    staffRole: staffRecord.role,
    specialityRole: staffRecord.specialityRole || "None",
    registrationNumber: staffRecord.registrationNumber,
    caseType: document.getElementById("caseType").value,
    status: document.getElementById("caseStatus").value,
    outcome,
    punishment,
    hearingDate: document.getElementById("caseDate").value,
    addedBy: document.getElementById("caseAddedBy").value,
    summary: document.getElementById("caseSummary").value.trim(),
    sanctions: document.getElementById("caseSanctions").value.trim(),
    createdAt: new Date().toISOString()
  };

  cases.push(tribunalCase);

  if (outcome === "Registration Revoked" || punishment === "Removal from Register" || punishment === "Permanent Blacklist") {
    staffRecord.status = "Revoked";
    staffRecord.revokedAt = new Date().toISOString();
    staffRecord.revocationReason = `Revoked by tribunal case ${tribunalCase.caseNumber}`;
    saveStaff();
  }

  saveCases();
  document.getElementById("caseForm").reset();
  refreshCaseStaffOptions();
  renderCases();
  renderStaff();
  renderPublicLookup();
});

document.getElementById("hcpcTeamForm").addEventListener("submit", event => {
  event.preventDefault();

  const username = document.getElementById("teamUsername").value.trim();
  const duplicate = hcpcTeam.find(t => t.username.toLowerCase() === username.toLowerCase() && t.status === "Active");

  if (duplicate) {
    alert("This username is already an active HCPC team member.");
    return;
  }

  hcpcTeam.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    username,
    teamRole: document.getElementById("teamRole").value,
    permission: document.getElementById("teamPermission").value,
    addedBy: document.getElementById("teamAddedBy").value.trim(),
    status: "Active",
    addedAt: new Date().toISOString()
  });

  saveTeam();
  document.getElementById("hcpcTeamForm").reset();
  renderTeam();
});

document.getElementById("groupRoleForm").addEventListener("submit", event => {
  event.preventDefault();
  const value = document.getElementById("newGroupRole").value.trim();
  if (value && !groupRoles.includes(value)) {
    groupRoles.push(value);
    saveGroupRoles();
    refreshRoleSelects();
  }
  event.target.reset();
});

document.getElementById("specialityRoleForm").addEventListener("submit", event => {
  event.preventDefault();
  const value = document.getElementById("newSpecialityRole").value.trim();
  if (value && !specialityRoles.includes(value)) {
    specialityRoles.push(value);
    saveSpecialityRoles();
    refreshRoleSelects();
  }
  event.target.reset();
});

document.getElementById("loadDefaultRoles").addEventListener("click", () => {
  groupRoles = [...new Set([...groupRoles, ...DEFAULT_GROUP_ROLES])];
  saveGroupRoles();
  refreshRoleSelects();
});

document.getElementById("loadDefaultSpecialities").addEventListener("click", () => {
  specialityRoles = [...new Set([...specialityRoles, ...DEFAULT_SPECIALITIES])];
  saveSpecialityRoles();
  refreshRoleSelects();
});

document.getElementById("clearGroupRoles").addEventListener("click", () => {
  if (!confirm("Clear all group roles?")) return;
  groupRoles = [];
  saveGroupRoles();
  refreshRoleSelects();
});

document.getElementById("clearSpecialityRoles").addEventListener("click", () => {
  if (!confirm("Clear all speciality roles?")) return;
  specialityRoles = [];
  saveSpecialityRoles();
  refreshRoleSelects();
});

document.getElementById("publicLookupButton").addEventListener("click", renderPublicLookup);
document.getElementById("publicLookupInput").addEventListener("keydown", event => {
  if (event.key === "Enter") renderPublicLookup();
});
document.getElementById("clearPublicLookup").addEventListener("click", () => {
  document.getElementById("publicLookupInput").value = "";
  renderPublicLookup();
});

document.getElementById("caseSearchInput").addEventListener("input", () => {
  const query = document.getElementById("caseSearchInput").value.trim().toLowerCase();
  if (!query) {
    renderCases();
    return;
  }

  const filtered = cases.filter(c =>
    c.caseNumber.toLowerCase().includes(query) ||
    c.staffUsername.toLowerCase().includes(query) ||
    c.registrationNumber.toLowerCase().includes(query) ||
    c.caseType.toLowerCase().includes(query) ||
    c.status.toLowerCase().includes(query) ||
    c.outcome.toLowerCase().includes(query) ||
    String(c.punishment || "").toLowerCase().includes(query)
  );

  renderCases(filtered);
});

document.getElementById("clearCaseSearch").addEventListener("click", () => {
  document.getElementById("caseSearchInput").value = "";
  renderCases();
});

document.getElementById("exportJson").addEventListener("click", () => {
  const data = { staff, cases, hcpcTeam, groupRoles, specialityRoles };
  downloadFile("uhh-registry-full-export.json", JSON.stringify(data, null, 2), "application/json");
});

document.getElementById("exportCsv").addEventListener("click", () => {
  const headers = ["Status", "Registration Number", "Username", "Display Name", "Department", "Role", "Speciality", "Rank", "Registered By", "Registered At", "Revoked At", "Revocation Reason", "Notes"];
  const rows = staff.map(s => [
    s.status, s.registrationNumber, s.username, s.displayName, s.department, s.role, s.specialityRole || "None", s.rank,
    s.registeredBy, s.registeredAt, s.revokedAt || "", s.revocationReason || "", s.notes || ""
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  downloadFile("uhh-staff-registry.csv", csv, "text/csv");
});

document.getElementById("resetData").addEventListener("click", () => {
  if (!confirm("Reset all saved registry, tribunal, team and role data?")) return;
  staff = [];
  cases = [];
  hcpcTeam = [];
  groupRoles = [...DEFAULT_GROUP_ROLES];
  specialityRoles = [...DEFAULT_SPECIALITIES];
  saveStaff();
  saveCases();
  saveTeam();
  saveGroupRoles();
  saveSpecialityRoles();
  refreshRoleSelects();
  renderStaff();
  renderCases();
  renderTeam();
  renderPublicLookup();
});

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

window.revokeRecord = function(id) {
  const record = staff.find(s => s.id === id);
  if (!record) return;

  const reason = prompt("Reason for revocation:", "No reason provided");
  record.status = "Revoked";
  record.revokedAt = new Date().toISOString();
  record.revocationReason = reason || "No reason provided";
  saveStaff();
  renderStaff();
  renderPublicLookup();
};

window.restoreRecord = function(id) {
  const record = staff.find(s => s.id === id);
  if (!record) return;

  record.status = "Active";
  record.revokedAt = null;
  record.revocationReason = "";
  saveStaff();
  renderStaff();
  renderPublicLookup();
};

window.deleteRecord = function(id) {
  if (!confirm("Delete this staff record permanently?")) return;
  staff = staff.filter(s => s.id !== id);
  saveStaff();
  renderStaff();
  renderPublicLookup();
};

window.editCaseOutcome = function(id) {
  const c = cases.find(x => x.id === id);
  if (!c) return;

  const newOutcome = prompt("Update outcome:", c.outcome);
  if (!newOutcome) return;

  c.outcome = newOutcome;
  if (newOutcome === "Registration Revoked") {
    const staffRecord = staff.find(s => s.id === c.staffId);
    if (staffRecord) {
      staffRecord.status = "Revoked";
      staffRecord.revokedAt = new Date().toISOString();
      staffRecord.revocationReason = `Revoked by tribunal case ${c.caseNumber}`;
      saveStaff();
    }
  }

  saveCases();
  renderCases();
  renderStaff();
  renderPublicLookup();
};

window.deleteCase = function(id) {
  if (!confirm("Delete this tribunal case?")) return;
  cases = cases.filter(c => c.id !== id);
  saveCases();
  renderCases();
  renderPublicLookup();
};

window.disableTeamMember = function(id) {
  const t = hcpcTeam.find(x => x.id === id);
  if (!t) return;
  t.status = "Disabled";
  saveTeam();
  renderTeam();
};

window.enableTeamMember = function(id) {
  const t = hcpcTeam.find(x => x.id === id);
  if (!t) return;
  t.status = "Active";
  saveTeam();
  renderTeam();
};

window.removeTeamMember = function(id) {
  if (!confirm("Delete this HCPC team member?")) return;
  hcpcTeam = hcpcTeam.filter(t => t.id !== id);
  saveTeam();
  renderTeam();
};

window.removeGroupRole = function(index) {
  groupRoles.splice(index, 1);
  saveGroupRoles();
  refreshRoleSelects();
};

window.removeSpecialityRole = function(index) {
  specialityRoles.splice(index, 1);
  saveSpecialityRoles();
  refreshRoleSelects();
};

refreshRoleSelects();
refreshCaseStaffOptions();
refreshCaseAddedByOptions();
renderStaff();
renderCases();
renderTeam();
renderPublicLookup();
