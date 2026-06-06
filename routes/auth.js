import express from "express";
import axios from "axios";

const router = express.Router();

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function getPublicSiteUrl() {
  return getRequiredEnv("PUBLIC_SITE_URL").replace(/\/$/, "");
}

router.get("/roblox", (req, res) => {
  const params = new URLSearchParams({
    client_id: getRequiredEnv("ROBLOX_CLIENT_ID"),
    redirect_uri: getRequiredEnv("ROBLOX_REDIRECT_URI"),
    response_type: "code",
    scope: "openid profile",
    state: "uhh_staff_portal"
  });

  return res.redirect(
    `https://apis.roblox.com/oauth/v1/authorize?${params.toString()}`
  );
});

router.get("/roblox/callback", async (req, res) => {
  const publicSiteUrl = getPublicSiteUrl();

  try {
    const code = req.query.code;

    if (!code) {
      return res.redirect(`${publicSiteUrl}/staff-portal.html?login=failed`);
    }

    const tokenResponse = await axios.post(
      "https://apis.roblox.com/oauth/v1/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: getRequiredEnv("ROBLOX_CLIENT_ID"),
        client_secret: getRequiredEnv("ROBLOX_CLIENT_SECRET"),
        redirect_uri: getRequiredEnv("ROBLOX_REDIRECT_URI")
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get(
      "https://apis.roblox.com/oauth/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const robloxUser = userResponse.data;

    const robloxId = robloxUser.sub || robloxUser.id;
    const robloxName =
      robloxUser.preferred_username ||
      robloxUser.name ||
      robloxUser.nickname ||
      "Roblox User";

    const redirectUrl = new URL(`${publicSiteUrl}/staff-portal.html`);
    redirectUrl.searchParams.set("login", "success");
    redirectUrl.searchParams.set("robloxId", robloxId);
    redirectUrl.searchParams.set("robloxName", robloxName);

    return res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("Roblox login error:", error.response?.data || error.message);
    return res.redirect(`${publicSiteUrl}/staff-portal.html?login=failed`);
  }
});

router.post("/verify-hcpc", (req, res) => {
  const { robloxId, hcpcPin } = req.body;

  if (!robloxId || !hcpcPin) {
    return res.status(400).json({
      ok: false,
      message: "Roblox ID and HCPC PIN are required."
    });
  }

  return res.json({
    ok: true,
    message: "HCPC verification placeholder passed."
  });
});

export default router;
