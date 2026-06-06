<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Register Staff — UHH Portal</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="topbar">
    <div class="container header-inner">
      <a class="brand" href="index.html" aria-label="UHH dashboard">
        <div class="brand-mark">UHH</div>
        <div>
          <strong>University Hospital Healthcare</strong>
          <span>Caring · Safe · Respectful</span>
        </div>
      </a>
      <nav class="main-nav" aria-label="Main navigation">
        <a href="index.html">Dashboard</a>
        <a href="login.html">Staff Portal</a>
        <a href="lookup.html">Lookup</a>
        <a href="announcements.html">Announcements</a>
        <a href="vacancies.html">Vacancies</a>
        <a href="info.html">Info</a>
      </nav>
    </div>
  </header>

  <div class="page-hero">
    <div class="container">
      <h1>Register a staff member</h1>
      <p>Create a UHH registration record with group ranks, specialities and department.</p>
    </div>
  </div>

  <main class="container" style="padding:34px 0;">
    <div id="successBanner" class="success-banner" style="display:none;"></div>

    <section class="panel">
      <form id="registrationForm" class="form-grid">
        <label>
          Roblox username
          <input required id="username" placeholder="e.g. TommyNHS" />
        </label>

        <label>
          Display name
          <input id="displayName" placeholder="Optional" />
        </label>

        <label>
          Department
          <select required id="department">
            <option value="">Select department</option>
            <option>Accident &amp; Emergency</option>
            <option>Cardiology</option>
            <option>General Medicine</option>
            <option>Surgery</option>
            <option>Paediatrics</option>
            <option>Radiology</option>
            <option>Maternity</option>
            <option>Mental Health</option>
            <option>Administration</option>
            <option>Security</option>
            <option>Education &amp; Training</option>
            <option>Clinical Governance</option>
          </select>
        </label>

        <label>
          Rank level
          <select required id="rank">
            <option value="">Select rank</option>
            <option>Low Rank</option>
            <option>Middle Rank</option>
            <option>High Rank</option>
            <option>Senior High Rank</option>
            <option>Executive</option>
          </select>
        </label>

        <div class="full">
          <label style="margin-bottom:6px;">Group roles / ranks</label>
          <select id="rolePickerSelect" style="width:100%;margin-bottom:8px;border:2px solid var(--border);padding:12px;font:inherit;background:white;"></select>
          <div id="selectedRolesContainer" class="chip-box min-chip-box"></div>
        </div>

        <div class="full">
          <label style="margin-bottom:6px;">Speciality roles</label>
          <select id="specialityPickerSelect" style="width:100%;margin-bottom:8px;border:2px solid var(--border);padding:12px;font:inherit;background:white;"></select>
          <div id="selectedSpecialitiesContainer" class="chip-box min-chip-box"></div>
        </div>

        <label>
          HCPC PIN for staff login
          <input required id="hcpcPin" placeholder="Give this PIN to the staff member" />
        </label>

        <label>
          Registered by
          <input required id="registeredBy" placeholder="Your Roblox username" />
        </label>

        <label class="full">
          Notes
          <textarea id="notes" placeholder="Training, warnings, permissions, or role notes"></textarea>
        </label>

        <button class="primary" type="submit">Generate registration</button>
      </form>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-grid">
      <div><strong>University Hospital Healthcare</strong><p>Fictional Roblox healthcare system. Not affiliated with the NHS, Roblox, or the real HCPC.</p></div>
      <div><strong>Useful links</strong><p><a href="login.html">Staff Portal</a> · <a href="lookup.html">Lookup</a> · <a href="vacancies.html">Vacancies</a></p></div>
    </div>
  </footer>

  <script src="shared.js"></script>
  <script>
    loadAllData();

    const rolePicker = createTagPicker(
      document.getElementById("rolePickerSelect"),
      document.getElementById("selectedRolesContainer"),
      groupRoles
    );

    const specialityPicker = createTagPicker(
      document.getElementById("specialityPickerSelect"),
      document.getElementById("selectedSpecialitiesContainer"),
      specialityRoles
    );

    document.getElementById("registrationForm").addEventListener("submit", e => {
      e.preventDefault();

      const username = document.getElementById("username").value.trim();
      const duplicate = staff.find(s => s.username.toLowerCase() === username.toLowerCase() && s.status === "Active");

      if (duplicate) {
        alert("This Roblox username already has an active registration. Revoke it before creating another.");
        return;
      }

      const selectedRoles = rolePicker.getValues();
      if (selectedRoles.length === 0) {
        alert("Select at least one group role.");
        return;
      }

      const record = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        username,
        displayName: document.getElementById("displayName").value.trim(),
        department: document.getElementById("department").value,
        roles: selectedRoles,
        specialityRoles: specialityPicker.getValues(),
        rank: document.getElementById("rank").value,
        hcpcPin: document.getElementById("hcpcPin").value.trim(),
        registeredBy: document.getElementById("registeredBy").value.trim(),
        notes: document.getElementById("notes").value.trim(),
        registrationNumber: generateRegistrationNumber(),
        status: "Active",
        registeredAt: new Date().toISOString(),
        revokedAt: null
      };

      staff.push(record);
      saveStaff();

      document.getElementById("registrationForm").reset();
      rolePicker.reset();
      specialityPicker.reset();

      const banner = document.getElementById("successBanner");
      banner.innerHTML = `<strong>Registration created:</strong> ${escapeHtml(record.registrationNumber)} for ${escapeHtml(username)}. <a href="staff.html">View staff log</a>`;
      banner.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  </script>
</body>
</html>
