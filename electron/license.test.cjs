const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  APP_ID,
  createLicenseService,
  verifyLicense,
} = require("./license.cjs");

const keys = crypto.generateKeyPairSync("ed25519");
const publicKey = keys.publicKey.export({ type: "spki", format: "pem" });

function makeKey(overrides = {}) {
  const payload = {
    appId: APP_ID,
    licenseId: "LIC-0001",
    type: "lifetime",
    expiresAt: null,
    issuedAt: new Date().toISOString(),
    ...overrides,
  };
  const bytes = Buffer.from(JSON.stringify(payload));
  return `sdf1.${bytes.toString("base64url")}.${crypto.sign(null, bytes, keys.privateKey).toString("base64url")}`;
}

test("accepts a valid lifetime license and rejects altered or malformed keys", () => {
  const key = makeKey();
  assert.equal(verifyLicense(key, publicKey).licenseId, "LIC-0001");
  assert.throws(
    () => verifyLicense(`${key.slice(0, -2)}xx`, publicKey),
    /signature|valid/i,
  );
  assert.throws(() => verifyLicense("not-a-license", publicKey), /format/i);
});

test("checks expiry, expiration metadata, and application identity", () => {
  assert.throws(
    () =>
      verifyLicense(
        makeKey({ type: "30-days", expiresAt: "2000-01-01T00:00:00.000Z" }),
        publicKey,
      ),
    /expired/i,
  );
  assert.throws(
    () => verifyLicense(makeKey({ appId: "another.app" }), publicKey),
    /details/i,
  );
  assert.throws(
    () =>
      verifyLicense(
        makeKey({ type: "lifetime", expiresAt: "2099-01-01T00:00:00.000Z" }),
        publicKey,
      ),
    /lifetime/i,
  );
});

test("persists an activation and reports it after service recreation", (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "sdf-license-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const publicKeyPath = path.join(directory, "public.pem");
  const licensePath = path.join(directory, "settings", "license.json");
  fs.writeFileSync(publicKeyPath, publicKey);
  const firstInstance = createLicenseService(licensePath, publicKeyPath);
  assert.equal(firstInstance.status().status, "unactivated");
  assert.equal(firstInstance.activate(makeKey()).license.licenseId, "LIC-0001");
  assert.equal(
    firstInstance.activate(makeKey({ licenseId: "LIC-0002" })).license
      .licenseId,
    "LIC-0002",
  );
  assert.equal(
    createLicenseService(licensePath, publicKeyPath).status().status,
    "active",
  );
  assert.equal(
    createLicenseService(licensePath, publicKeyPath).status().license.licenseId,
    "LIC-0002",
  );
});
