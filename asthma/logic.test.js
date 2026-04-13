const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  classifyExacerbationRisk,
  pickInitialTrack1Step,
  classifyControl,
  classifySevereAsthmaState,
  getDupilumabEvidenceFlag,
  getMepolizumabDetail,
  getBenralizumabDetail
} = require("./logic.js");

test("treats missing exacerbation history as unknown instead of zero", () => {
  const risk = classifyExacerbationRisk({ moderateExac: null, severeExac: 0 });
  assert.equal(risk.anyExacerbation, null);
  assert.match(risk.summary, /not fully entered/i);
});

test("classifies explicit zero exacerbations correctly", () => {
  const risk = classifyExacerbationRisk({ moderateExac: 0, severeExac: 0 });
  assert.equal(risk.anyExacerbation, false);
  assert.equal(risk.frequentExacerbation, false);
});

test("classifies frequent exacerbations correctly", () => {
  assert.equal(classifyExacerbationRisk({ moderateExac: 2, severeExac: 0 }).frequentExacerbation, true);
  assert.equal(classifyExacerbationRisk({ moderateExac: 0, severeExac: 1 }).frequentExacerbation, true);
});

test("maps infrequent initial symptoms to Track 1 Step 1-2", () => {
  const step = pickInitialTrack1Step({
    symptomDaysCategory: "infrequent",
    nightWakingCategory: "none",
    acuteExacerbationToday: false,
    fev1Predicted: 92,
    smokingStatus: "never"
  });

  assert.equal(step.regimen, "air-only");
});

test("maps most-days symptoms to Track 1 Step 3", () => {
  const step = pickInitialTrack1Step({
    symptomDaysCategory: "most-days",
    nightWakingCategory: "less-than-weekly",
    acuteExacerbationToday: false,
    fev1Predicted: 88,
    smokingStatus: "never"
  });

  assert.equal(step.regimen, "mart-low");
});

test("maps daily symptoms plus low lung function to Track 1 Step 4", () => {
  const step = pickInitialTrack1Step({
    symptomDaysCategory: "daily",
    nightWakingCategory: "weekly-or-more",
    acuteExacerbationToday: false,
    fev1Predicted: 72,
    smokingStatus: "never"
  });

  assert.equal(step.regimen, "mart-medium");
});

test("acute exacerbation start maps to Track 1 Step 4", () => {
  const step = pickInitialTrack1Step({
    symptomDaysCategory: "infrequent",
    nightWakingCategory: "none",
    acuteExacerbationToday: true,
    fev1Predicted: 95,
    smokingStatus: "never"
  });

  assert.equal(step.regimen, "mart-medium");
});

test("medium-intensity regimen does not satisfy severe definition by itself", () => {
  const control = classifyControl({
    daytimeGt2: true,
    nightWaking4w: true,
    relieverGt2: false,
    activityLimitation: false
  });
  const exacRisk = classifyExacerbationRisk({ moderateExac: 0, severeExac: 0 });
  const state = classifySevereAsthmaState({
    currentRegimen: "mart-medium",
    maintenanceOcs: false,
    persistentExacerbations: false,
    poorTechnique: false,
    poorAdherence: false,
    eosinophils: 300,
    feno: 35,
    allergenDriven: false
  }, control, exacRisk);

  assert.equal(state.state, "difficult-to-treat-possible");
});

test("high-dose regimen with persistent burden satisfies severe definition", () => {
  const control = classifyControl({
    daytimeGt2: true,
    nightWaking4w: true,
    relieverGt2: true,
    activityLimitation: false
  });
  const exacRisk = classifyExacerbationRisk({ moderateExac: 2, severeExac: 0 });
  const state = classifySevereAsthmaState({
    currentRegimen: "high-dose-ics-laba",
    maintenanceOcs: false,
    persistentExacerbations: false,
    poorTechnique: false,
    poorAdherence: false,
    eosinophils: 300,
    feno: 35,
    allergenDriven: false
  }, control, exacRisk);

  assert.equal(state.state, "severe-definition-met");
});

test("dupilumab threshold is inclusive at 1500", () => {
  assert.equal(getDupilumabEvidenceFlag(1500), true);
  assert.equal(getDupilumabEvidenceFlag(1499), false);
});

test("EGPA dosing details do not reuse asthma-only benralizumab schedule", () => {
  assert.match(getBenralizumabDetail({ egpa: true }), /EGPA dosing differs/i);
  assert.doesNotMatch(getBenralizumabDetail({ egpa: true }), /every 8 weeks thereafter/i);
  assert.match(getMepolizumabDetail({ egpa: true }), /EGPA dosing differs/i);
});

test("asthma app uses endemic-area exposure phrasing for parasite precautions", () => {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");

  assert.ok(html.includes('id="endemic-area-exposure"'));
  assert.ok(html.includes("Patient has lived or resided in an endemic area for parasitic infection"));
  assert.ok(!html.includes('id="parasite-risk"'));
  assert.ok(app.includes("Because blood eosinophils are above 300 cells/uL and the patient has lived or resided in an endemic area, consider parasite testing or treatment before starting"));
  assert.ok(!app.includes("Review parasite risk and consider testing or treatment before starting a biologic, especially if eosinophilia is prominent."));
});
