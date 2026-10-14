const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const APP_ID = "com.salle-des-fetes.app";
const LICENSE_FORMAT = "sdf1";

function decodeLicense(serialKey) {
  if (typeof serialKey !== "string" || serialKey.trim().length === 0 || serialKey.length > 4096) {
    throw new Error("The license key is not valid.");
  }
  const parts = serialKey.trim().split(".");
  if (parts.length !== 3 || parts[0] !== LICENSE_FORMAT) {
    throw new Error("The license key format is not valid.");
  }
  const payloadBytes = Buffer.from(parts[1], "base64url");
  const signature = Buffer.from(parts[2], "base64url");
  if (!payloadBytes.length || signature.length !== 64) {
    throw new Error("The license key is not valid.");
  }

  let payload;
  try {
    payload = JSON.parse(payloadBytes.toString("utf8"));
  } catch {
    throw new Error("The license key payload is not valid.");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("The license key payload is not valid.");
  }
  return { payload, payloadBytes, signature };
}

function verifyLicense(serialKey, publicKey, now = Date.now()) {
  const { payload, payloadBytes, signature } = decodeLicense(serialKey);
  if (!crypto.verify(null, payloadBytes, publicKey, signature)) {
    throw new Error("This license key has an invalid signature.");
  }
  if (
    payload.appId !== APP_ID ||
    typeof payload.licenseId !== "string" ||
    !/^LIC-\d{4,}$/.test(payload.licenseId) ||
    !["lifetime", "1-year", "6-months", "30-days", "custom"].includes(
      payload.type,
    ) ||
    !(
      payload.expiresAt === null ||
      (typeof payload.expiresAt === "string" &&
        Number.isFinite(Date.parse(payload.expiresAt)))
    ) ||
    typeof payload.issuedAt !== "string" ||
    !Number.isFinite(Date.parse(payload.issuedAt))
  ) {
    throw new Error("The license key contains invalid license details.");
  }
  if (payload.type === "lifetime" && payload.expiresAt !== null) {
    throw new Error("A lifetime license cannot have an expiration date.");
  }
  if (payload.type !== "lifetime" && payload.expiresAt === null) {
    throw new Error("This license is missing its expiration date.");
  }
  if (payload.expiresAt !== null && now >= Date.parse(payload.expiresAt)) {
    throw new Error("This license has expired.");
  }
  return payload;
}

function createLicenseService(licensePath, publicKeyPath) {
  function readPublicKey() {
    const publicKey = crypto.createPublicKey(
      fs.readFileSync(publicKeyPath, "utf8"),
    );
    if (publicKey.asymmetricKeyType !== "ed25519") {
      throw new Error("The embedded license public key must use Ed25519.");
    }
    return publicKey;
  }

  function readStoredLicense() {
    const publicKey = readPublicKey();
    if (!fs.existsSync(licensePath)) return { status: "unactivated" };
    let saved;
    try {
      saved = JSON.parse(fs.readFileSync(licensePath, "utf8"));
    } catch {
      return { status: "invalid" };
    }
    try {
      const license = verifyLicense(saved.serialKey, publicKey);
      return {
        status: "active",
        license: {
          licenseId: license.licenseId,
          type: license.type,
          expiresAt: license.expiresAt,
        },
      };
    } catch (error) {
      return {
        status:
          error instanceof Error && error.message.includes("expired")
            ? "expired"
            : "invalid",
      };
    }
  }

  return {
    status: readStoredLicense,
    activate(serialKey) {
      const publicKey = readPublicKey();
      const license = verifyLicense(serialKey, publicKey);
      fs.mkdirSync(path.dirname(licensePath), { recursive: true });
      const temporaryPath = `${licensePath}.${process.pid}.tmp`;
      fs.writeFileSync(
        temporaryPath,
        JSON.stringify({ serialKey: serialKey.trim() }),
        {
          encoding: "utf8",
          mode: 0o600,
        },
      );
      fs.renameSync(temporaryPath, licensePath);
      return {
        status: "active",
        license: {
          licenseId: license.licenseId,
          type: license.type,
          expiresAt: license.expiresAt,
        },
      };
    },
  };
}

module.exports = { APP_ID, createLicenseService, verifyLicense };
