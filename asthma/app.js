function getNumberValue(id) {
  const raw = document.getElementById(id).value.trim();
  if (raw === "") {
    return null;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function getCheckboxValue(id) {
  return document.getElementById(id).checked;
}

function getSelectValue(id) {
  return document.getElementById(id).value;
}

function getInputState() {
  return {
    managementPhase: getSelectValue("management-phase"),
    age: getNumberValue("age"),
    typicalSymptoms: getCheckboxValue("typical-symptoms"),
    urgentRedFlags: getCheckboxValue("urgent-red-flags"),
    bronchodilatorHeld: getCheckboxValue("bronchodilator-held"),
    fev1Pre: getNumberValue("fev1-pre"),
    fev1Post: getNumberValue("fev1-post"),
    fvcPre: getNumberValue("fvc-pre"),
    fvcPost: getNumberValue("fvc-post"),
    fev1Predicted: getNumberValue("fev1-predicted"),
    fvcPredicted: getNumberValue("fvc-predicted"),
    bronchoprovocation: getSelectValue("bronchoprovocation"),
    icsResponse: getCheckboxValue("ics-response"),
    dxBronchodilatorResponse: getCheckboxValue("dx-bronchodilator-response"),
    dxIcsImprovement: getCheckboxValue("dx-ics-improvement"),
    dxPositiveBronchoprovocation: getCheckboxValue("dx-positive-bronchoprovocation"),
    daytimeGt2: getCheckboxValue("daytime-gt2"),
    nightWaking4w: getCheckboxValue("night-waking-4w"),
    relieverGt2: getCheckboxValue("reliever-gt2"),
    activityLimitation: getCheckboxValue("activity-limitation"),
    moderateExac: getNumberValue("moderate-exac") === null ? 0 : getNumberValue("moderate-exac"),
    severeExac: getNumberValue("severe-exac") === null ? 0 : getNumberValue("severe-exac"),
    lifeThreateningHistory: getCheckboxValue("life-threatening-history"),
    persistentExacerbations: getCheckboxValue("persistent-exacerbations"),
    eosinophils: getNumberValue("eosinophils"),
    feno: getNumberValue("feno"),
    totalIge: getNumberValue("total-ige"),
    smokingStatus: getSelectValue("smoking-status"),
    allergenDriven: getCheckboxValue("allergen-driven"),
    nasalPolyps: getCheckboxValue("nasal-polyps"),
    atopicDermatitis: getCheckboxValue("atopic-dermatitis"),
    egpa: getCheckboxValue("egpa"),
    maintenanceOcs: getCheckboxValue("maintenance-ocs"),
    poorTechnique: getCheckboxValue("poor-technique"),
    poorAdherence: getCheckboxValue("poor-adherence"),
    icsSideEffects: getCheckboxValue("ics-side-effects"),
    pneumococcalStatus: getSelectValue("pneumococcal-status"),
    rsvStatus: getSelectValue("rsv-status"),
    zosterStatus: getSelectValue("zoster-status"),
    tdapStatus: getSelectValue("tdap-status"),
    fluStatus: getSelectValue("flu-status"),
    covidStatus: getSelectValue("covid-status"),
    currentRegimen: getSelectValue("current-regimen")
  };
}

function uniqueItems(items) {
  return Array.from(new Set(items));
}

function formatSignedNumber(value, decimals) {
  if (!Number.isFinite(value)) {
    return "n/a";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(decimals)}`;
}

function getBronchodilatorAssessment(data) {
  const fev1Available = data.fev1Pre !== null && data.fev1Post !== null && data.fev1Pre > 0;
  const fvcAvailable = data.fvcPre !== null && data.fvcPost !== null && data.fvcPre > 0;

  const fev1DeltaL = fev1Available ? data.fev1Post - data.fev1Pre : null;
  const fev1DeltaMl = fev1Available ? fev1DeltaL * 1000 : null;
  const fev1Percent = fev1Available ? (fev1DeltaL / data.fev1Pre) * 100 : null;
  const fev1PredictedDeltaPercent = fev1Available && data.fev1Predicted !== null && data.fev1Predicted > 0
    ? (fev1DeltaL / (data.fev1Pre / (data.fev1Predicted / 100))) * 100
    : null;

  const fvcDeltaL = fvcAvailable ? data.fvcPost - data.fvcPre : null;
  const fvcDeltaMl = fvcAvailable ? fvcDeltaL * 1000 : null;
  const fvcPercent = fvcAvailable ? (fvcDeltaL / data.fvcPre) * 100 : null;
  const fvcPredictedDeltaPercent = fvcAvailable && data.fvcPredicted !== null && data.fvcPredicted > 0
    ? (fvcDeltaL / (data.fvcPre / (data.fvcPredicted / 100))) * 100
    : null;

  const fev1Positive = fev1Available && fev1Percent >= 12 && fev1DeltaMl >= 200;
  const fvcPositive = fvcAvailable && fvcPercent >= 12 && fvcDeltaMl >= 200;
  const fev1AtsErsPositive = fev1Available && fev1PredictedDeltaPercent !== null && fev1PredictedDeltaPercent > 10;
  const fvcAtsErsPositive = fvcAvailable && fvcPredictedDeltaPercent !== null && fvcPredictedDeltaPercent > 10;
  const fev1HighConfidence = fev1Available && fev1Percent >= 15 && fev1DeltaMl >= 400;
  const fvcHighConfidence = fvcAvailable && fvcPercent >= 15 && fvcDeltaMl >= 400;

  const positive = fev1Positive || fvcPositive || fev1AtsErsPositive || fvcAtsErsPositive;
  const highConfidence = fev1HighConfidence || fvcHighConfidence;

  let summary = "Bronchodilator responsiveness cannot be assessed because paired pre/post spirometry values are incomplete.";
  if (fev1Available || fvcAvailable) {
    const parts = [];
    if (fev1Available) {
      parts.push(`FEV1 change ${formatSignedNumber(fev1DeltaMl, 0)} mL (${formatSignedNumber(fev1Percent, 1)}%)`);
      if (fev1PredictedDeltaPercent !== null) {
        parts.push(`FEV1 change ${formatSignedNumber(fev1PredictedDeltaPercent, 1)}% of predicted`);
      }
    }
    if (fvcAvailable) {
      parts.push(`FVC change ${formatSignedNumber(fvcDeltaMl, 0)} mL (${formatSignedNumber(fvcPercent, 1)}%)`);
      if (fvcPredictedDeltaPercent !== null) {
        parts.push(`FVC change ${formatSignedNumber(fvcPredictedDeltaPercent, 1)}% of predicted`);
      }
    }
    summary = parts.join("; ");
    if (positive) {
      if (highConfidence) {
        summary += ". This meets bronchodilator responsiveness criteria with higher-confidence change.";
      } else if (fev1AtsErsPositive || fvcAtsErsPositive) {
        summary += ". This meets bronchodilator responsiveness criteria, including the ATS/ERS >10% of predicted definition.";
      } else {
        summary += ". This meets bronchodilator responsiveness criteria.";
      }
    } else {
      summary += ". This does not meet bronchodilator responsiveness criteria from the entered data.";
    }
  }

  return {
    available: fev1Available || fvcAvailable,
    positive,
    highConfidence,
    fev1DeltaMl,
    fev1Percent,
    fev1PredictedDeltaPercent,
    fvcDeltaMl,
    fvcPercent,
    fvcPredictedDeltaPercent,
    fev1AtsErsPositive,
    fvcAtsErsPositive,
    summary
  };
}

function getFollowUpDiagnosisSupport(data) {
  const supportItems = [];

  if (data.dxBronchodilatorResponse) {
    supportItems.push("bronchodilator response on spirometry");
  }
  if (data.dxIcsImprovement) {
    supportItems.push("clinical improvement to ICS-containing treatment");
  }
  if (data.dxPositiveBronchoprovocation) {
    supportItems.push("positive bronchoprovocative testing");
  }

  return supportItems;
}

function getDiagnosticEvidenceSummary(data, bdAssessment) {
  if (data.managementPhase === "followup") {
    const supportItems = getFollowUpDiagnosisSupport(data);
    if (supportItems.length > 0) {
      return `Diagnosis basis documented by: ${supportItems.join(", ")}.`;
    }

    return "No prior diagnostic basis was selected in follow-up mode.";
  }

  return bdAssessment.summary;
}

function getDiagnosticStatus(data, bdAssessment) {
  if (data.managementPhase === "followup") {
    const supportItems = getFollowUpDiagnosisSupport(data);
    const objectiveSupport = supportItems.length > 0;

    if (objectiveSupport) {
      return {
        key: "confirmed-followup",
        label: "Prior asthma diagnosis documented",
        confirmed: true,
        objectiveSupport: true,
        supportItems,
        noteLine: `Prior asthma diagnosis documented by: ${supportItems.join(", ")}.`,
        summary: `Follow-up mode documents prior asthma diagnosis by ${supportItems.join(", ")}.`
      };
    }

    return {
      key: "uncertain-followup",
      label: "Prior asthma diagnosis not documented",
      confirmed: false,
      objectiveSupport: false,
      supportItems: [],
      noteLine: "No prior diagnostic basis for asthma was selected in follow-up mode.",
      summary: "Follow-up mode requires documenting how asthma was originally diagnosed."
    };
  }

  const supportItems = [];

  if (bdAssessment.positive) {
    supportItems.push("positive bronchodilator response");
  }
  if (data.icsResponse) {
    supportItems.push("positive response after 4 weeks of ICS-containing treatment");
  }
  if (data.bronchoprovocation === "positive") {
    supportItems.push("positive bronchoprovocation testing");
  }

  const objectiveSupport = supportItems.length > 0;

  if (data.urgentRedFlags) {
    return {
      key: "urgent",
      label: "Urgent red flags present",
      confirmed: false,
      objectiveSupport,
      supportItems,
      noteLine: "Red-flag acute presentation interrupts routine outpatient decision support.",
      summary: "Red-flag acute symptoms are present, so emergency evaluation takes priority over routine stepped asthma management."
    };
  }

  if (data.typicalSymptoms && objectiveSupport) {
    return {
      key: "confirmed",
      label: "Asthma objectively confirmed",
      confirmed: true,
      objectiveSupport,
      supportItems,
      noteLine: `Typical symptoms plus objective support: ${supportItems.join(", ")}.`,
      summary: `Typical variable symptoms are present and objective evidence supports asthma (${supportItems.join(", ")}).`
    };
  }

  if (data.typicalSymptoms && !objectiveSupport) {
    return {
      key: "likely-not-confirmed",
      label: "Asthma likely but not yet objectively confirmed",
      confirmed: false,
      objectiveSupport,
      supportItems,
      noteLine: "Typical symptoms are present but current objective criteria are not yet documented.",
      summary: "Typical symptoms are present, but objective evidence of variable expiratory airflow is not yet documented."
    };
  }

  if (!data.typicalSymptoms && objectiveSupport) {
    return {
      key: "atypical-but-supported",
      label: "Objective variability present, but symptom pattern is atypical",
      confirmed: false,
      objectiveSupport,
      supportItems,
      noteLine: `Objective support is present (${supportItems.join(", ")}), but the symptom pattern entered is atypical.`,
      summary: "Objective variability is present, but the symptom pattern entered is not clearly typical for asthma, so the differential should still be reviewed."
    };
  }

  return {
    key: "uncertain",
    label: "Diagnosis uncertain",
    confirmed: false,
    objectiveSupport,
    supportItems,
    noteLine: "Neither a clearly typical symptom pattern nor objective variability is documented from the entered fields.",
    summary: "The diagnosis remains uncertain from the entered data and alternative diagnoses should be considered."
  };
}

function classifyControl(data) {
  const count = [
    data.daytimeGt2,
    data.nightWaking4w,
    data.relieverGt2,
    data.activityLimitation
  ].filter(Boolean).length;

  let classification = "well controlled";
  if (count >= 3) {
    classification = "uncontrolled";
  } else if (count >= 1) {
    classification = "partly controlled";
  }

  let summary = `GINA symptom control is ${classification} based on ${count}/4 positive control items.`;
  if (classification === "well controlled") {
    summary += " No recent control item was triggered.";
  } else if (classification === "partly controlled") {
    summary += " One or two control items are positive.";
  } else {
    summary += " Three or four control items are positive.";
  }

  return {
    count,
    classification,
    summary,
    noteLine: `${count}/4 GINA symptom-control items positive.`
  };
}

function classifyExacerbationRisk(data) {
  const anyExacerbation = data.moderateExac + data.severeExac >= 1;
  const frequentExacerbation = data.moderateExac >= 2 || data.severeExac >= 1;
  const summary = frequentExacerbation
    ? "Frequent exacerbation-risk profile: at least 2 oral steroid-treated exacerbations or at least 1 hospitalization in the last year."
    : anyExacerbation
      ? "At least one exacerbation occurred in the last year, which raises future-risk concern."
      : "No exacerbation was recorded in the last year.";

  return {
    anyExacerbation,
    frequentExacerbation,
    summary,
    noteLine: `${data.moderateExac} oral steroid-treated and ${data.severeExac} hospitalization-level exacerbations in the last 12 months.`
  };
}

function classifySevereAsthmaState(data, control, exacRisk) {
  const highIntensityRegimen = [
    "mart-medium",
    "ics-laba-saba",
    "high-dose-ics-laba",
    "triple-therapy",
    "biologic-other"
  ].includes(data.currentRegimen) || data.maintenanceOcs;
  const ongoingBurden = control.classification !== "well controlled" ||
    exacRisk.frequentExacerbation ||
    data.persistentExacerbations;
  const type2High = (data.eosinophils !== null && data.eosinophils >= 150) ||
    (data.feno !== null && data.feno >= 20) ||
    data.allergenDriven;

  if (!highIntensityRegimen || !ongoingBurden) {
    return {
      state: "not-triggered",
      type2High,
      summary: "Severe asthma pathway not triggered by the current regimen and burden profile."
    };
  }

  if (data.poorTechnique || data.poorAdherence) {
    return {
      state: "difficult-to-treat",
      type2High,
      summary: "Difficult-to-treat asthma is more likely than true severe asthma because inhaler technique or adherence problems are still present."
    };
  }

  return {
    state: "severe-likely",
    type2High,
    summary: type2High
      ? "Severe asthma is likely and Type 2-high markers are present."
      : "Severe asthma is likely, but elevated Type 2 markers are not clearly documented from the entered data."
  };
}

function updateDiagnosticDisplay() {
  const data = getInputState();
  const bdAssessment = getBronchodilatorAssessment(data);
  const diagnosticStatus = getDiagnosticStatus(data, bdAssessment);

  document.getElementById("bd-response-display").textContent = data.managementPhase === "followup"
    ? data.dxBronchodilatorResponse
      ? "BD response: documented"
      : "BD response: not documented"
    : bdAssessment.positive
      ? "BD response: positive"
      : bdAssessment.available
        ? "BD response: not positive"
        : "BD response: incomplete";

  document.getElementById("diagnosis-support-display").textContent = diagnosticStatus.objectiveSupport
    ? "Objective support: present"
    : "Objective support: absent";

  document.getElementById("bd-calc-note").textContent = getDiagnosticEvidenceSummary(data, bdAssessment);
  document.getElementById("diagnosis-calc-note").textContent = diagnosticStatus.summary;
}

function updateControlDisplay() {
  const control = classifyControl(getInputState());
  document.getElementById("control-display").textContent = `Control: ${control.classification}`;
  document.getElementById("control-note").textContent = control.summary;
}

function initHelpers() {
  [
    "management-phase",
    "typical-symptoms",
    "urgent-red-flags",
    "bronchodilator-held",
    "fev1-pre",
    "fev1-post",
    "fvc-pre",
    "fvc-post",
    "fev1-predicted",
    "fvc-predicted",
    "ics-response",
    "bronchoprovocation",
    "dx-bronchodilator-response",
    "dx-ics-improvement",
    "dx-positive-bronchoprovocation"
  ].forEach((id) => {
    const element = document.getElementById(id);
    const eventName = element.tagName === "SELECT" ? "change" : "input";
    element.addEventListener(eventName, updateDiagnosticDisplay);
    if (element.type === "checkbox") {
      element.addEventListener("change", updateDiagnosticDisplay);
    }
  });

  document.getElementById("management-phase").addEventListener("change", syncManagementPhaseUi);

  [
    "daytime-gt2",
    "night-waking-4w",
    "reliever-gt2",
    "activity-limitation"
  ].forEach((id) => {
    document.getElementById(id).addEventListener("change", updateControlDisplay);
  });

  syncManagementPhaseUi();
  updateDiagnosticDisplay();
  updateControlDisplay();
}

function syncManagementPhaseUi() {
  const phase = getSelectValue("management-phase");
  const initialFields = document.getElementById("initial-diagnostic-fields");
  const followupFields = document.getElementById("followup-diagnostic-fields");

  if (phase === "followup") {
    initialFields.classList.add("hidden");
    followupFields.classList.remove("hidden");
  } else {
    initialFields.classList.remove("hidden");
    followupFields.classList.add("hidden");
  }

  updateDiagnosticDisplay();
}

function getPhaseLabel(phase) {
  return phase === "followup"
    ? "Follow-up asthma management"
    : "Initial asthma management";
}

function getRegimenLabel(regimen) {
  const labels = {
    naive: "No maintenance inhaler / treatment-naive",
    "air-only": "As-needed budesonide-formoterol only (Track 1 Step 1-2)",
    "mart-low": "Low-dose budesonide-formoterol MART (Track 1 Step 3)",
    "mart-medium": "Medium-dose budesonide-formoterol MART (Track 1 Step 4)",
    "ics-laba-saba": "Maintenance ICS-LABA with SABA reliever",
    "high-dose-ics-laba": "High-dose ICS-LABA / Step 5 level inhaled therapy",
    "triple-therapy": "ICS-LABA-LAMA triple inhaled therapy / LAMA-LABA-ICS regimen",
    "biologic-other": "Biologic plus ICS-containing regimen / other complex regimen"
  };

  return labels[regimen] || "Unknown regimen";
}

function getBudesonideFormoterolAirDetail() {
  return "Preferred Track 1 AIR-only dosing: budesonide-formoterol 200/6 mcg metered dose (160/4.5 mcg delivered) by inhaled DPI or pMDI, 1 inhalation as needed for symptoms and before exercise or expected allergen exposure if needed. Maximum total 12 inhalations in 24 hours. Common adverse effects include dysphonia, oropharyngeal candidiasis, tremor, palpitations, headache, and cramps.";
}

function getBudesonideFormoterolLowMartDetail() {
  return "Preferred Track 1 Step 3 MART dosing: budesonide-formoterol 200/6 mcg metered dose (160/4.5 mcg delivered) by inhaled DPI or pMDI, 1 inhalation twice daily or once daily for maintenance plus 1 inhalation as needed for symptoms. Maximum total 12 inhalations in 24 hours. Common adverse effects include dysphonia, oral candidiasis, tremor, headache, and tachycardia.";
}

function getBudesonideFormoterolMediumMartDetail() {
  return "Preferred Track 1 Step 4 MART dosing: budesonide-formoterol 200/6 mcg metered dose (160/4.5 mcg delivered) by inhaled DPI or pMDI, 2 inhalations twice daily for maintenance plus 1 inhalation as needed for symptoms. Maximum total 12 inhalations in 24 hours. Common adverse effects include dysphonia, oral candidiasis, tremor, headache, and tachycardia.";
}

function getLamaDetail() {
  return "LAMA add-on option: tiotropium by mist inhaler or a triple inhaler may be considered as add-on therapy in uncontrolled asthma despite at least medium-dose ICS-LABA. Route: inhaled. Common adverse effects include dry mouth and urinary retention. Ensure sufficient ICS dose is already in place before adding a LAMA.";
}

function getAzithromycinDetail() {
  return "Azithromycin add-on option: 500 mg by mouth three times weekly, generally for at least 6 months, only after specialist referral for persistent symptomatic asthma despite high-dose ICS-LABA. Check sputum for atypical mycobacteria, obtain ECG for QTc before treatment and again after 1 month, and weigh antimicrobial-resistance risk. Diarrhea is more common with this regimen.";
}

function getOmalizumabDetail() {
  return "Omalizumab option for severe allergic asthma: subcutaneous injection every 2 to 4 weeks with dose based on weight and serum IgE. Use when sensitization and payer criteria are met. Common adverse effects include injection-site reactions; anaphylaxis is rare.";
}

function getMepolizumabDetail() {
  return "Mepolizumab option for severe eosinophilic asthma: 100 mg subcutaneously every 4 weeks in adults. Common adverse effects include headache and injection-site reactions.";
}

function getBenralizumabDetail() {
  return "Benralizumab option for severe eosinophilic asthma: 30 mg subcutaneously every 4 weeks for the first 3 doses, then every 8 weeks. Common adverse effects include injection-site reactions; anaphylaxis is rare.";
}

function getReslizumabDetail() {
  return "Reslizumab option for severe eosinophilic asthma: 3 mg/kg by intravenous infusion every 4 weeks. Monitor for infusion or hypersensitivity reactions.";
}

function getDupilumabDetail() {
  return "Dupilumab option for severe eosinophilic or Type 2 asthma and for maintenance OCS-dependent severe asthma: 200 mg or 300 mg subcutaneously every 2 weeks; use 300 mg every 2 weeks for OCS-dependent disease. Common adverse effects include injection-site reactions and transient eosinophilia. Rare EGPA may be unmasked during steroid reduction.";
}

function getTezepelumabDetail() {
  return "Tezepelumab option for severe asthma with exacerbations: 210 mg subcutaneously every 4 weeks. It can be considered even when Type 2 markers are not clearly elevated. Common adverse effects include injection-site reactions; anaphylaxis is rare.";
}

function getPrednisoneLastResortDetail() {
  return "Maintenance oral corticosteroids should be reserved as a last resort. If required, keep prednisone-equivalent dosing as low as possible, often no more than 7.5 mg/day, and monitor for adrenal suppression, osteoporosis, diabetes, cataracts, glaucoma, hypertension, mood change, infection, and fragility fracture risk.";
}

function getSmokingCessationDetails() {
  return [
    "Smoking cessation works best with counseling plus pharmacotherapy. Offer structured cessation support and quit-line referral.",
    "Varenicline: 0.5 mg by mouth once daily on days 1-3, then 0.5 mg twice daily on days 4-7, then 1 mg twice daily for 12 weeks. Review nausea, sleep disturbance, renal dosing, and neuropsychiatric risk.",
    "Bupropion SR: 150 mg by mouth once daily for 3 days, then 150 mg twice daily. Avoid with seizure disorder, eating disorder history, monoamine oxidase inhibitor use, or abrupt sedative or alcohol withdrawal.",
    "Nicotine replacement can be layered as patch plus short-acting gum or lozenge depending on dependence and prior response."
  ];
}

function isHighDoseEquivalentRegimen(data) {
  return ["high-dose-ics-laba", "triple-therapy", "biologic-other"].includes(data.currentRegimen) ||
    data.maintenanceOcs;
}

function getBiologicAgentDetail(agentId) {
  const details = {
    omalizumab: getOmalizumabDetail(),
    mepolizumab: getMepolizumabDetail(),
    benralizumab: getBenralizumabDetail(),
    reslizumab: getReslizumabDetail(),
    dupilumab: getDupilumabDetail(),
    tezepelumab: getTezepelumabDetail()
  };

  return details[agentId] || null;
}

function buildBiologicGuidance(data, severeState, control, exacRisk) {
  const empty = {
    show: false,
    summary: "",
    preferred: [],
    secondary: [],
    considerations: [],
    medicationDetails: [],
    planSummary: ""
  };

  const uncontrolled = control.classification !== "well controlled" ||
    exacRisk.anyExacerbation ||
    data.persistentExacerbations;
  const highDoseEquivalent = isHighDoseEquivalentRegimen(data);
  const eos = data.eosinophils;
  const eos150 = eos !== null && eos >= 150;
  const eos300 = eos !== null && eos >= 300;
  const eosAboveDupilumabEvidence = eos !== null && eos > 1500;
  const feno25 = data.feno !== null && data.feno >= 25;
  const allergicCandidate = data.allergenDriven && data.totalIge !== null;
  const recentExacerbationSignal = exacRisk.anyExacerbation || data.persistentExacerbations;
  const phenotypeMarkers = allergicCandidate || eos150 || feno25 || data.maintenanceOcs ||
    data.nasalPolyps || data.atopicDermatitis || data.egpa;
  const tezepelumabCandidate = recentExacerbationSignal;

  if (severeState.state !== "severe-likely" || !highDoseEquivalent || !uncontrolled) {
    return empty;
  }

  if (!phenotypeMarkers && !tezepelumabCandidate) {
    return empty;
  }

  const preferred = [];
  const secondary = [];
  const considerations = [];
  const preferredIds = [];
  const secondaryIds = [];

  function addPreferred(id, text) {
    if (!preferredIds.includes(id)) {
      preferredIds.push(id);
      preferred.push(text);
    }
  }

  function addSecondary(id, text) {
    if (!preferredIds.includes(id) && !secondaryIds.includes(id)) {
      secondaryIds.push(id);
      secondary.push(text);
    }
  }

  function addConsideration(text) {
    if (!considerations.includes(text)) {
      considerations.push(text);
    }
  }

  const burdenParts = [];
  if (control.classification !== "well controlled") {
    burdenParts.push(`GINA control remains ${control.classification}`);
  }
  if (exacRisk.frequentExacerbation) {
    burdenParts.push("exacerbation burden is high");
  } else if (exacRisk.anyExacerbation) {
    burdenParts.push("there has been at least one recent exacerbation");
  }
  if (data.maintenanceOcs) {
    burdenParts.push("maintenance oral corticosteroids are required");
  }

  const phenotypeParts = [];
  if (eos !== null) {
    phenotypeParts.push(`blood eosinophils ${eos} cells/uL`);
  }
  if (data.feno !== null) {
    phenotypeParts.push(`FeNO ${data.feno} ppb`);
  }
  if (allergicCandidate) {
    phenotypeParts.push(`allergen-driven disease with total IgE ${data.totalIge}`);
  } else if (data.allergenDriven) {
    phenotypeParts.push("allergen-driven symptoms");
  }
  if (data.nasalPolyps) {
    phenotypeParts.push("nasal polyps");
  }
  if (data.atopicDermatitis) {
    phenotypeParts.push("atopic dermatitis");
  }
  if (data.egpa) {
    phenotypeParts.push("EGPA concern");
  }

  let summary;
  if (data.currentRegimen === "biologic-other") {
    summary = "The patient already appears to be on a biologic or another complex Step 5 regimen, so this section is best used to think about the most logical biologic phenotype match or switching strategy if the current response has been incomplete.";
  } else {
    summary = `Biologic escalation is reasonable because ${burdenParts.length > 0 ? burdenParts.join(", ") : "the patient remains uncontrolled"} despite ${getRegimenLabel(data.currentRegimen).toLowerCase()}.`;
  }
  if (phenotypeParts.length > 0) {
    summary += ` Entered phenotype signals include ${phenotypeParts.join(", ")}.`;
  } else {
    summary += " Phenotype markers are limited from the entered data, so a broader-mechanism biologic may be the most practical starting point if local eligibility criteria are met.";
  }

  if (data.egpa) {
    addPreferred("mepolizumab", "Mepolizumab: strongest fit when EGPA is present or strongly suspected, especially if eosinophilia, recurrent exacerbations, or steroid exposure are part of the picture.");
    addPreferred("benralizumab", "Benralizumab: strong alternative for eosinophilic disease when anti-IL5R therapy and a less frequent every-8-week maintenance schedule are attractive.");
    if (recentExacerbationSignal) {
      addSecondary("tezepelumab", "Tezepelumab: fallback option if a more phenotype-specific biologic is not available or not tolerated, but it is less tailored to EGPA.");
    }
    if (!eosAboveDupilumabEvidence && (feno25 || data.atopicDermatitis || data.nasalPolyps)) {
      addSecondary("dupilumab", "Dupilumab: possible backup if Type 2 asthma remains dominant, but it is usually less attractive than anti-IL5 or anti-IL5R therapy when EGPA is active or suspected.");
    }
    addConsideration("EGPA should prompt coordinated specialist review and caution during steroid tapering; anti-IL5 or anti-IL5R strategies are usually more attractive than dupilumab in this setting.");
  } else if (data.maintenanceOcs) {
    if (!eosAboveDupilumabEvidence) {
      addPreferred("dupilumab", data.nasalPolyps || data.atopicDermatitis || feno25
        ? "Dupilumab: strongest fit because maintenance steroid dependence plus FeNO elevation, nasal polyps, or atopic dermatitis favors an OCS-sparing anti-IL4Rα strategy."
        : "Dupilumab: strong first-line biologic direction in maintenance OCS-dependent severe asthma because it has the clearest steroid-sparing signal in this setting."
      );
    }
    if (eos150) {
      addPreferred(data.nasalPolyps ? "mepolizumab" : "benralizumab", eosAboveDupilumabEvidence
        ? data.nasalPolyps
          ? "Mepolizumab: preferred over dupilumab here because very high eosinophils plus nasal polyps makes an anti-IL5 pathway more evidence-aligned."
          : "Benralizumab: preferred over dupilumab here because very high eosinophils make anti-IL5R therapy more evidence-aligned."
        : data.nasalPolyps
          ? "Mepolizumab: strong parallel option because eosinophilia with nasal polyps supports an anti-IL5 pathway."
          : "Benralizumab: strong parallel option because eosinophilia supports an anti-IL5R pathway and less frequent maintenance dosing may be convenient."
      );
      addSecondary(data.nasalPolyps ? "benralizumab" : "mepolizumab", data.nasalPolyps
        ? "Benralizumab: reasonable alternative anti-IL5R option if mepolizumab is not available or payer criteria favor it."
        : "Mepolizumab: reasonable alternative anti-IL5 option if benralizumab is not available or if nasal polyps later become more prominent."
      );
      addSecondary("reslizumab", "Reslizumab: adult IV alternative when infusion therapy is acceptable, but it is used less often than subcutaneous anti-IL5 options.");
    }
    if (allergicCandidate) {
      addSecondary("omalizumab", "Omalizumab: consider mainly if allergic disease clearly dominates and local criteria are met, but it is usually not the first OCS-sparing choice.");
    }
    if (recentExacerbationSignal) {
      addSecondary("tezepelumab", "Tezepelumab: consider if other biologics are not clearly preferred, though OCS-sparing evidence is less established.");
    }
    addConsideration("Maintenance oral corticosteroid use should push biologic choice toward agents with stronger steroid-sparing evidence; omalizumab and tezepelumab are usually less attractive if OCS reduction is the main goal.");
  } else if (data.nasalPolyps || data.atopicDermatitis) {
    addPreferred("dupilumab", data.nasalPolyps && data.atopicDermatitis
      ? "Dupilumab: preferred because it can address severe asthma together with both nasal polyps and atopic dermatitis."
      : data.nasalPolyps
        ? "Dupilumab: preferred because nasal polyps and upper-airway Type 2 disease increase the value of an anti-IL4Rα strategy."
        : "Dupilumab: preferred because moderate-to-severe atopic dermatitis makes an anti-IL4Rα strategy especially appealing."
    );
    if (eos150) {
      addSecondary("mepolizumab", data.nasalPolyps
        ? "Mepolizumab: strong alternative because eosinophilic asthma with nasal polyps often responds well to an anti-IL5 strategy."
        : "Mepolizumab: strong alternative if eosinophilia is prominent and an anti-IL5 strategy is preferred."
      );
      addSecondary("benralizumab", "Benralizumab: reasonable alternative anti-IL5R option, especially if less frequent maintenance dosing matters.");
    }
    if (allergicCandidate) {
      addSecondary("omalizumab", "Omalizumab: consider when allergen-driven symptoms and IgE-based eligibility are clear, especially if allergic disease seems to dominate.");
    }
    if (recentExacerbationSignal) {
      addSecondary("tezepelumab", "Tezepelumab: useful fallback if a broader upstream biologic is preferred or payer criteria limit other agents.");
    }
    addConsideration("Dupilumab becomes especially attractive when nasal polyps or moderate-to-severe atopic dermatitis are clinically active.");
  } else if (eos150) {
    addPreferred(data.nasalPolyps ? "mepolizumab" : "benralizumab", data.nasalPolyps
      ? "Mepolizumab: preferred because eosinophilia with nasal polyps makes an anti-IL5 option especially attractive."
      : "Benralizumab: preferred because eosinophilia supports anti-IL5R therapy and every-8-week maintenance dosing may be convenient."
    );
    addSecondary(data.nasalPolyps ? "benralizumab" : "mepolizumab", data.nasalPolyps
      ? "Benralizumab: close alternative anti-IL5R option if payer criteria or dosing preferences favor it."
      : "Mepolizumab: close alternative anti-IL5 option if payer criteria or comorbidity profile later favor it."
    );
    addSecondary("reslizumab", "Reslizumab: adult IV alternative when infusion delivery is acceptable, but it is generally a backup rather than the first choice.");
    if (!eosAboveDupilumabEvidence && (feno25 || data.nasalPolyps || data.atopicDermatitis)) {
      addSecondary("dupilumab", "Dupilumab: compelling alternative if FeNO is also elevated or if upper-airway or skin Type 2 comorbidity is part of the case.");
    }
    if (allergicCandidate) {
      addSecondary("omalizumab", "Omalizumab: additional option if allergic triggers and IgE-based eligibility are also present.");
    }
    if (recentExacerbationSignal) {
      addSecondary("tezepelumab", "Tezepelumab: broader-mechanism fallback if another biologic is not clearly preferred or not available.");
    }
    addConsideration(data.nasalPolyps
      ? "When nasal polyps are prominent, mepolizumab and dupilumab often rise in priority among eosinophilic options."
      : "Among anti-IL5 or anti-IL5R options, benralizumab may be appealing when less frequent maintenance dosing is important."
    );
  } else if (feno25) {
    addPreferred("dupilumab", "Dupilumab: preferred because elevated FeNO suggests a strong IL-4/IL-13-driven Type 2 signal.");
    if (recentExacerbationSignal) {
      addSecondary("tezepelumab", "Tezepelumab: sensible alternative because higher FeNO also predicts better response to anti-TSLP therapy.");
    }
    if (allergicCandidate) {
      addSecondary("omalizumab", "Omalizumab: consider if allergen-driven symptoms dominate and IgE-based dosing criteria are satisfied.");
    }
    addConsideration("Higher FeNO predicts better response to dupilumab and also tends to favor tezepelumab response.");
  } else if (allergicCandidate) {
    addPreferred("omalizumab", "Omalizumab: best first biologic when the history is clearly allergen-driven, IgE information is available, and eosinophilic or OCS-dependent signals are not the main driver.");
    if (recentExacerbationSignal) {
      addSecondary("tezepelumab", "Tezepelumab: useful fallback if a broader-mechanism biologic is preferred or IgE dosing constraints become limiting.");
    }
    addConsideration("Confirm sensitization and that weight and total IgE fall within the local dosing range before choosing omalizumab.");
  } else if (recentExacerbationSignal) {
    addPreferred("tezepelumab", "Tezepelumab: best broad-mechanism biologic fit when severe exacerbations persist but allergic or eosinophilic signals are weak or inconsistent.");
    addConsideration("Tezepelumab is the easiest biologic to justify when biomarker data are limited, but repeating eosinophils and FeNO could still uncover a more phenotype-specific option.");
  }

  addConsideration("Confirm local payer and regulatory criteria before ordering because required exacerbation counts and biomarker thresholds vary by product and insurer.");
  addConsideration("Review response after an initial biologic trial of about 4 months, extending toward 6 to 12 months if benefit is uncertain before declaring failure.");
  addConsideration("Choose among eligible agents using the phenotype match above plus dosing interval, self-injection versus infusion, comorbidities, and patient preference.");

  if (data.currentRegimen === "biologic-other") {
    addConsideration("Because a biologic may already be in use, this ranking is most helpful for deciding whether the current biologic is still the best fit or whether a switch is more logical.");
  }

  if (data.maintenanceOcs) {
    addConsideration("Maintenance oral steroids can suppress eosinophils, FeNO, and IgE; historical biomarker data may be more informative than a single low value measured while on OCS.");
  }

  if (eosAboveDupilumabEvidence) {
    addConsideration("Blood eosinophils above 1500 cells/uL make dupilumab less attractive because evidence is limited in that range and alternative eosinophilic diagnoses should be revisited.");
  }

  const medicationDetails = [...preferredIds, ...secondaryIds]
    .map((agentId) => getBiologicAgentDetail(agentId))
    .filter(Boolean);
  const secondaryOutput = secondary.length > 0
    ? secondary
    : ["No clear backup biologic stood out from the entered data; if the preferred agent is not feasible, repeat biomarkers and revisit comorbid phenotype before choosing a fallback."];
  const leadAgent = preferred.length > 0
    ? preferred[0].split(":")[0]
    : "phenotype-directed biologic therapy";

  return {
    show: preferred.length > 0 || secondaryOutput.length > 0,
    summary,
    preferred,
    secondary: secondaryOutput,
    considerations: uniqueItems(considerations),
    medicationDetails: uniqueItems(medicationDetails),
    planSummary: `Preferred biologic direction: ${leadAgent}. Review the biologic guidance card below before ordering or switching therapy.`
  };
}

function needsInitialStep3(data, control, exacRisk) {
  return control.classification !== "well controlled" ||
    data.smokingStatus === "current" ||
    exacRisk.anyExacerbation ||
    data.lifeThreateningHistory;
}

function addSevereAsthmaPlan(plan, rationale, medicationDetails, data, severeState, biologicGuidance) {
  plan.push("Promptly refer for expert assessment, severe-asthma phenotyping, and add-on therapy consideration.");
  plan.push("Given persistent symptoms despite escalated therapy re-examine inhaler technique, adherence, smoking and irritant exposure, obesity, chronic rhinosinusitis with or without nasal polyps, GERD, OSA, inducible laryngeal obstruction, and medication adverse effects as contributing factors for persistent poor symptom control.");

  if (data.currentRegimen !== "triple-therapy") {
    plan.push("Consider add-on LAMA if it has not already been trialed.");
    medicationDetails.push(getLamaDetail());
  }

  if (data.currentRegimen === "high-dose-ics-laba" || severeState.state === "severe-likely" || data.persistentExacerbations) {
    plan.push("Low-dose azithromycin can be considered after specialist referral if symptoms or exacerbations persist despite high-dose ICS-LABA.");
    medicationDetails.push(getAzithromycinDetail());
  }

  if (biologicGuidance.show) {
    plan.push(biologicGuidance.planSummary);
    rationale.push("Biologic candidacy is supported by persistent burden despite Step 5-level therapy plus the entered phenotype profile.");
    medicationDetails.push(...biologicGuidance.medicationDetails);
  } else if (severeState.type2High) {
    rationale.push("Type 2-high markers are present, which supports biologic phenotyping.");
    plan.push("Type 2 biology appears relevant, but the entered data do not yet clearly support one biologic. Repeat or expand phenotype testing before choosing an agent.");
  } else {
    rationale.push("Elevated Type 2 markers are not clearly documented from the entered data, so non-biologic add-ons and repeated biomarker review become especially important.");
    plan.push("If Type 2 biomarkers are not elevated, repeat eosinophils and FeNO when clinically appropriate and consider non-biologic add-ons first.");
    if (data.currentRegimen === "high-dose-ics-laba" || data.currentRegimen === "triple-therapy" || data.currentRegimen === "biologic-other") {
      plan.push("Tezepelumab can still be considered in specialist care for severe asthma with exacerbations.");
      medicationDetails.push(getTezepelumabDetail());
    }
  }

  if (data.maintenanceOcs) {
    plan.push("Treat maintenance prednisone as a last-resort bridge only and work to minimize dose and duration.");
    medicationDetails.push(getPrednisoneLastResortDetail());
  }
}

function buildInitialRecommendations(data, diagnosticStatus, control, exacRisk, severeState, biologicGuidance) {
  const plan = [];
  const rationale = [];
  const medicationDetails = [];
  let trackStep = "Diagnostic confirmation first";

  if (data.urgentRedFlags) {
    plan.push("Red-flag symptoms are present today. Arrange immediate acute evaluation or emergency-level care instead of routine outpatient step selection.");
    plan.push("Do not rely on this tool for routine stepped treatment decisions until the patient is stabilized.");
    rationale.push("Safety interrupt triggered by entered red-flag acute presentation.");
    return { plan, rationale, medicationDetails, trackStep: "Emergency evaluation required" };
  }

  if (!diagnosticStatus.confirmed) {
    plan.push("Asthma is not objectively confirmed from the entered data. Repeat spirometry with bronchodilator responsiveness testing or bronchoprovocation before committing to long-term stepped therapy.");
    if (data.currentRegimen !== "naive") {
      plan.push("Because maintenance treatment may already be in use and diagnosis remains uncertain, consider supervised retesting and, when appropriate, step-down with repeat objective assessment or specialist referral.");
    } else {
      plan.push("If treatment must begin before objective confirmation, use an ICS-containing approach rather than SABA-only treatment and schedule repeat objective testing within the next few weeks.");
    }
    if (!data.typicalSymptoms) {
      plan.push("Broaden the differential diagnosis rather than forcing the asthma algorithm.");
    }
    rationale.push("GINA diagnosis in adults requires typical symptoms plus objective evidence of variable expiratory airflow.");
    return { plan, rationale, medicationDetails, trackStep };
  }

  plan.push("Use GINA Track 1 as the preferred treatment pathway.");

  if (needsInitialStep3(data, control, exacRisk)) {
    trackStep = "GINA Track 1 Step 3";
    plan.push("Start low-dose budesonide-formoterol MART because recent symptom-control burden or exacerbation-risk features favor starting above AIR-only therapy.");
    plan.push("Prescribe budesonide-formoterol 200/6 mcg metered dose, 1 inhalation twice daily for maintenance plus 1 inhalation as needed for symptom relief.");
    plan.push("Use the same inhaler before exercise or expected allergen exposure if needed.");
    medicationDetails.push(getBudesonideFormoterolLowMartDetail());
    rationale.push("GINA Track 1 Step 3 is reasonable when recent control burden or exacerbation-risk markers suggest AIR-only therapy may be insufficient.");
  } else {
    trackStep = "GINA Track 1 Step 1-2";
    plan.push("Start as-needed low-dose budesonide-formoterol as both reliever and anti-inflammatory treatment.");
    plan.push("Use budesonide-formoterol 200/6 mcg metered dose, 1 inhalation as needed for symptoms.");
    plan.push("Use the same inhaler before exercise or expected allergen exposure if needed.");
    medicationDetails.push(getBudesonideFormoterolAirDetail());
    rationale.push("GINA Track 1 AIR-only therapy is preferred for adults with mild or infrequent symptoms once asthma is objectively supported.");
  }

  if (exacRisk.frequentExacerbation || data.lifeThreateningHistory || data.maintenanceOcs) {
    plan.push("Because exacerbation risk is already elevated, arrange early specialist follow-up and provide a written asthma action plan from the start.");
  }

  if (severeState.state !== "not-triggered") {
    plan.push("The entered data already suggest difficult-to-treat or severe disease, so specialist review should not be delayed.");
    addSevereAsthmaPlan(plan, rationale, medicationDetails, data, severeState, biologicGuidance);
    trackStep = "Step 5 / severe-asthma pathway";
  }

  if (data.smokingStatus === "current") {
    plan.push("Strongly recommend smoking cessation because smoking worsens asthma control and increases exacerbation risk.");
  }

  plan.push("Do not use SABA-only treatment as the long-term plan.");

  return { plan, rationale, medicationDetails, trackStep };
}

function buildFollowUpRecommendations(data, diagnosticStatus, control, exacRisk, severeState, biologicGuidance) {
  const plan = [];
  const rationale = [];
  const medicationDetails = [];
  let trackStep = "Follow-up reassessment";
  const uncontrolled = control.classification !== "well controlled" ||
    exacRisk.anyExacerbation ||
    data.persistentExacerbations;

  if (data.urgentRedFlags) {
    plan.push("Red-flag symptoms are present today. Arrange immediate acute evaluation or emergency-level care instead of routine follow-up adjustment.");
    plan.push("Resume stepped outpatient logic only after stabilization.");
    rationale.push("Safety interrupt triggered by entered red-flag acute presentation.");
    return { plan, rationale, medicationDetails, trackStep: "Emergency evaluation required" };
  }

  if (!diagnosticStatus.confirmed) {
    plan.push("The diagnosis is still not objectively confirmed, so re-establish diagnostic certainty before escalating chronic asthma therapy.");
    if (data.currentRegimen !== "naive") {
      plan.push("Because ICS-containing treatment is already in use, repeat spirometry or bronchoprovocation and consider supervised retesting or specialist review.");
    }
    rationale.push("Asthma treatment should be built on objective confirmation whenever possible.");
    return { plan, rationale, medicationDetails, trackStep: "Diagnostic confirmation first" };
  }

  if (data.currentRegimen === "naive") {
    plan.push("Follow-up management was selected, but no maintenance regimen is documented. Use the initial-treatment pathway first, then reassess response.");
    rationale.push("Follow-up algorithms assume a maintenance regimen is already in place.");
    return { plan, rationale, medicationDetails, trackStep: "Initial pathway needed" };
  }

  plan.push("Given persistent symptoms despite escalated therapy re-examine inhaler technique, adherence, smoking and irritant exposure, obesity, chronic rhinosinusitis with or without nasal polyps, GERD, OSA, inducible laryngeal obstruction, and medication adverse effects as contributing factors for persistent poor symptom control.");

  if (!uncontrolled) {
    trackStep = "Continue current step";
    plan.push("Current control appears acceptable, so continue the present ICS-containing regimen if benefit is clear and the regimen is tolerated.");
    if (["mart-low", "mart-medium"].includes(data.currentRegimen)) {
      plan.push("If control remains stable for at least 3 months, consider supervised step-down with a written action plan.");
    }
    rationale.push("No clear symptom-control or exacerbation trigger for escalation was entered.");
    return { plan, rationale, medicationDetails, trackStep };
  }

  if (data.currentRegimen === "air-only") {
    trackStep = "GINA Track 1 Step 3";
    plan.push("Step up from AIR-only therapy to low-dose budesonide-formoterol MART.");
    plan.push("Prescribe budesonide-formoterol 200/6 mcg metered dose, 1 inhalation twice daily for maintenance plus 1 inhalation as needed for symptom relief.");
    medicationDetails.push(getBudesonideFormoterolLowMartDetail());
    rationale.push("Symptoms or exacerbations are persisting on AIR-only therapy, so GINA Track 1 MART escalation is appropriate.");
  } else if (data.currentRegimen === "mart-low") {
    trackStep = "GINA Track 1 Step 4";
    plan.push("Step up from low-dose MART to medium-dose budesonide-formoterol MART.");
    plan.push("Prescribe budesonide-formoterol 200/6 mcg metered dose, 2 inhalations twice daily for maintenance plus 1 inhalation as needed for symptom relief.");
    medicationDetails.push(getBudesonideFormoterolMediumMartDetail());
    rationale.push("Persistent symptoms or exacerbations on low-dose MART support Step 4 escalation.");
  } else if (data.currentRegimen === "ics-laba-saba") {
    trackStep = "Switch to preferred Track 1 MART";
    if (control.classification === "uncontrolled" || exacRisk.anyExacerbation) {
      plan.push("Switch from a Track 2-style maintenance ICS-LABA plus SABA reliever regimen to preferred Track 1 budesonide-formoterol MART.");
      plan.push("A practical follow-up option is medium-dose budesonide-formoterol MART: 200/6 mcg metered dose, 2 inhalations twice daily plus 1 inhalation as needed.");
      medicationDetails.push(getBudesonideFormoterolMediumMartDetail());
    } else {
      plan.push("If simplification is desired and formulary access allows, consider switching to low-dose budesonide-formoterol MART.");
      medicationDetails.push(getBudesonideFormoterolLowMartDetail());
    }
    rationale.push("GINA Track 1 is preferred over SABA-reliever strategies because it lowers exacerbation risk and simplifies treatment.");
  }

  if (["mart-medium", "high-dose-ics-laba", "triple-therapy", "biologic-other"].includes(data.currentRegimen) || severeState.state !== "not-triggered") {
    trackStep = "Step 5 / severe-asthma pathway";
    if (data.currentRegimen === "mart-medium") {
      plan.push("Symptoms or exacerbations persist despite medium-dose MART, so move to Step 5 specialist assessment rather than repeatedly escalating inhaled therapy without phenotyping.");
    } else {
      plan.push("The current regimen is already Step 5-like or complex, so ongoing symptoms or exacerbations should trigger a structured severe-asthma review.");
    }

    if (["high-dose-ics-laba", "triple-therapy"].includes(data.currentRegimen) && !data.poorTechnique && !data.poorAdherence) {
      rationale.push("Ongoing disease burden despite high-intensity therapy raises concern for true severe asthma.");
    }

    addSevereAsthmaPlan(plan, rationale, medicationDetails, data, severeState, biologicGuidance);
  }

  if (data.icsSideEffects) {
    plan.push("Because steroid toxicity or ICS adverse effects are a concern, weigh benefit against harm carefully before any further ICS escalation and involve specialist review when possible.");
  }

  return { plan, rationale, medicationDetails, trackStep };
}

function buildPreventiveCare(data) {
  const prevention = [];

  if (data.pneumococcalStatus === "unknown" || data.pneumococcalStatus === "unvaccinated") {
    prevention.push("Recommend pneumococcal vaccination because asthma counts as chronic lung disease. If vaccine-naive, CDC adult defaults include PCV20 or PCV21 once, or PCV15 followed by PPSV23.");
  }

  if (data.age !== null && data.age >= 50 && data.rsvStatus !== "complete") {
    prevention.push("Recommend RSV vaccination because the patient is age 50 or older and asthma counts as chronic lung disease. RSV vaccination is not currently annual.");
  }

  if (data.age !== null && data.age >= 50 && data.zosterStatus !== "complete") {
    prevention.push("Recommend recombinant zoster vaccine (Shingrix) as a 2-dose series because the patient is age 50 or older.");
  }

  if (data.tdapStatus === "unknown" || data.tdapStatus === "not-up-to-date") {
    prevention.push("Recommend Td or Tdap now because no tetanus-containing vaccine is documented within the last 10 years. Use Tdap if prior adult Tdap is absent or unknown.");
  }

  if (data.fluStatus !== "current") {
    prevention.push("Recommend influenza vaccination for the current season.");
  } else {
    prevention.push("Keep influenza vaccination current every year.");
  }

  if (data.covidStatus !== "current") {
    prevention.push("Review and update COVID vaccination using the current local or CDC protocol because this schedule is time-sensitive.");
  } else {
    prevention.push("Keep COVID vaccination current according to the active local protocol.");
  }

  return prevention;
}

function buildNonPharmacologicBundle(data, severeState) {
  const bundle = [
    "Review inhaler technique and adherence at every visit before making step-up decisions.",
    "Provide or refresh a written asthma action plan.",
    "Encourage regular exercise and address weight management when relevant.",
    "Reduce avoidable triggers and exposures, including smoke, irritants, and relevant allergens.",
    "Treat modifiable comorbid contributors such as rhinosinusitis, GERD, OSA, anxiety, or depression when present."
  ];

  if (data.smokingStatus === "current") {
    bundle.push("Advise complete smoking cessation at every visit and offer pharmacotherapy plus counseling.");
  }

  if (severeState.state !== "not-triggered") {
    bundle.push("Use a lower threshold for specialist referral and multidisciplinary support because difficult-to-treat or severe disease is possible.");
  }

  return bundle;
}

function buildCautions(data, diagnosticStatus, control, severeState) {
  const cautions = [];

  if (data.urgentRedFlags) {
    cautions.push("Red-flag acute presentation requires emergency-level evaluation rather than routine outpatient treatment selection.");
  }

  if (!diagnosticStatus.confirmed) {
    cautions.push("Objective confirmation of asthma is still missing from the entered data.");
  }

  if (data.managementPhase === "initial" && !data.bronchodilatorHeld && (data.fev1Pre !== null || data.fev1Post !== null)) {
    cautions.push("Bronchodilator may not have been withheld before spirometry, which can make bronchodilator responsiveness harder to interpret.");
  }

  if (data.managementPhase === "initial" && data.currentRegimen !== "naive") {
    cautions.push("Initial management was selected, but a maintenance regimen is already documented. Confirm whether this should instead be handled as follow-up care.");
  }

  if (data.managementPhase === "followup" && data.currentRegimen === "naive") {
    cautions.push("Follow-up management was selected, but no maintenance regimen is documented. The tool will default toward an initial-treatment style recommendation.");
  }

  if (data.age === null) {
    cautions.push("Age is missing, so age-based vaccine prompts may be incomplete.");
  }

  if (severeState.state !== "not-triggered" && data.eosinophils === null && data.feno === null && !data.allergenDriven) {
    cautions.push("Severe-asthma pathway is in play, but Type 2 biomarker data are sparse. Eosinophils, FeNO, and allergic phenotype review would help refine biologic decisions.");
  }

  if ((data.poorTechnique || data.poorAdherence) && control.classification !== "well controlled") {
    cautions.push("Poor technique or adherence is present, so some apparent treatment failure may be modifiable before advancing to a severe-asthma label.");
  }

  if (data.egpa || (data.eosinophils !== null && data.eosinophils >= 1500)) {
    cautions.push("EGPA or another hypereosinophilic disorder should be considered before routine asthma-only escalation, especially if steroid tapering is planned.");
  }

  if (cautions.length === 0) {
    cautions.push("No major data-quality or safety warning was detected from the entered fields.");
  }

  return cautions;
}

function buildRecommendation(data) {
  const bdAssessment = getBronchodilatorAssessment(data);
  const diagnosticStatus = getDiagnosticStatus(data, bdAssessment);
  const control = classifyControl(data);
  const exacRisk = classifyExacerbationRisk(data);
  const severeState = classifySevereAsthmaState(data, control, exacRisk);
  const biologicGuidance = buildBiologicGuidance(data, severeState, control, exacRisk);
  const prevention = buildPreventiveCare(data);
  const nonPharm = buildNonPharmacologicBundle(data, severeState);
  const cautions = buildCautions(data, diagnosticStatus, control, severeState);

  let therapy;
  if (data.managementPhase === "followup") {
    therapy = buildFollowUpRecommendations(data, diagnosticStatus, control, exacRisk, severeState, biologicGuidance);
  } else {
    therapy = buildInitialRecommendations(data, diagnosticStatus, control, exacRisk, severeState, biologicGuidance);
  }

  if (!data.urgentRedFlags && data.poorAdherence && data.currentRegimen !== "naive") {
    therapy.plan.push("Because adherence is suboptimal, consider checking or repeating FeNO, ideally after observed ICS use when feasible; suppression of a previously elevated FeNO can support poor adherence to ICS therapy.");
    therapy.rationale.push("FeNO can help distinguish ongoing Type 2 inflammation from poor adherence to ICS-containing treatment.");
  }

  if (data.eosinophils === null && data.feno === null && data.totalIge === null) {
    therapy.plan.push("Because biomarker data were not entered, collect blood eosinophils, FeNO, and total IgE when clinically appropriate to help guide future phenotype assessment, escalation decisions, and possible biologic selection.");
    therapy.rationale.push("Biomarker data can help refine future asthma management, especially if symptoms or exacerbations persist.");
  }

  const medicationDetails = [...therapy.medicationDetails];
  if (data.smokingStatus === "current") {
    medicationDetails.push(...getSmokingCessationDetails());
  }

  const phenotypeParts = [];
  if (data.eosinophils !== null) {
    phenotypeParts.push(`blood eosinophils ${data.eosinophils} cells/uL`);
  }
  if (data.feno !== null) {
    phenotypeParts.push(`FeNO ${data.feno} ppb`);
  }
  if (data.totalIge !== null) {
    phenotypeParts.push(`total IgE ${data.totalIge}`);
  }
  if (data.allergenDriven) {
    phenotypeParts.push("allergen-driven features present");
  }
  if (data.nasalPolyps) {
    phenotypeParts.push("nasal polyps/upper-airway Type 2 disease present");
  }
  if (data.maintenanceOcs) {
    phenotypeParts.push("maintenance oral corticosteroids required");
  }
  if (data.egpa) {
    phenotypeParts.push("EGPA present or suspected");
  }

  const phenotypeSummary = phenotypeParts.length > 0
    ? `Phenotype summary: ${phenotypeParts.join(", ")}. ${severeState.summary}`
    : severeState.summary;

  return {
    phaseLabel: getPhaseLabel(data.managementPhase),
    diagnosticLabel: diagnosticStatus.label,
    trackStep: therapy.trackStep,
    symptomSummary: control.summary,
    riskSummary: `${exacRisk.summary} ${phenotypeSummary}`,
    diagnosticNoteLine: diagnosticStatus.noteLine,
    symptomNoteLine: control.noteLine,
    riskNoteLine: exacRisk.noteLine,
    plan: uniqueItems(therapy.plan),
    rationale: uniqueItems([
      diagnosticStatus.summary,
      getDiagnosticEvidenceSummary(data, bdAssessment),
      ...therapy.rationale
    ]),
    medicationDetails: uniqueItems(medicationDetails),
    biologicGuidance,
    prevention: uniqueItems(prevention),
    cautions: uniqueItems(cautions),
    nonPharm: uniqueItems(nonPharm)
  };
}

function fillList(elementId, items, emptyText) {
  const container = document.getElementById(elementId);
  container.innerHTML = "";

  const sourceItems = items.length > 0 ? items : [emptyText];
  sourceItems.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    container.appendChild(li);
  });
}

function getSmokingSummary(data) {
  const labels = {
    current: "Current smoker",
    former: "Former smoker",
    never: "Never smoker"
  };

  return labels[data.smokingStatus] || "Smoking status unknown";
}

function buildNoteText(data, rec) {
  const lines = [];
  const bdAssessment = getBronchodilatorAssessment(data);
  const diagnosticEvidenceSummary = getDiagnosticEvidenceSummary(data, bdAssessment);

  lines.push("Adult Asthma Management Decision Support Summary");
  lines.push(`Management phase: ${rec.phaseLabel}`);
  lines.push(`Diagnosis status: ${rec.diagnosticLabel}`);
  lines.push(`Recommendation anchor: ${rec.trackStep}`);
  lines.push("");
  lines.push("Case summary:");
  if (data.managementPhase === "initial") {
    lines.push(`- Typical variable respiratory symptoms: ${data.typicalSymptoms ? "Yes" : "No / not clearly entered"}.`);
    lines.push(`- Red-flag acute symptoms today: ${data.urgentRedFlags ? "Yes" : "No"}.`);
  } else {
    lines.push(`- Prior asthma diagnosis basis: ${diagnosticEvidenceSummary}`);
  }
  if (data.age !== null) {
    lines.push(`- Age: ${data.age} years.`);
  }
  if (data.managementPhase === "initial" && (data.fev1Pre !== null || data.fev1Post !== null || data.fvcPre !== null || data.fvcPost !== null)) {
    const spirometryParts = [];
    if (data.fev1Pre !== null) {
      spirometryParts.push(`pre-BD FEV1 ${data.fev1Pre.toFixed(2)} L`);
    }
    if (data.fev1Post !== null) {
      spirometryParts.push(`post-BD FEV1 ${data.fev1Post.toFixed(2)} L`);
    }
    if (data.fvcPre !== null) {
      spirometryParts.push(`pre-BD FVC ${data.fvcPre.toFixed(2)} L`);
    }
    if (data.fvcPost !== null) {
      spirometryParts.push(`post-BD FVC ${data.fvcPost.toFixed(2)} L`);
    }
    lines.push(`- Spirometry context: ${spirometryParts.join(", ")}.`);
  }
  if (data.managementPhase === "initial" && data.fev1Predicted !== null) {
    lines.push(`- FEV1 % predicted: ${data.fev1Predicted}%.`);
  }
  if (data.managementPhase === "initial" && data.fvcPredicted !== null) {
    lines.push(`- FVC % predicted: ${data.fvcPredicted}%.`);
  }
  if (data.managementPhase === "initial") {
    lines.push(`- Bronchodilator responsiveness: ${bdAssessment.summary}`);
    lines.push(`- Bronchoprovocation: ${data.bronchoprovocation}.`);
    lines.push(`- Clinical improvement to ICS meeting criteria: ${data.icsResponse ? "Yes" : "No / not documented"}.`);
  }
  lines.push(`- GINA control: ${rec.symptomNoteLine} ${rec.symptomSummary}`);
  lines.push(`- Exacerbation history: ${rec.riskNoteLine}`);
  if (data.eosinophils !== null) {
    lines.push(`- Blood eosinophils: ${data.eosinophils} cells/uL.`);
  } else {
    lines.push("- Blood eosinophils: not available.");
  }
  if (data.feno !== null) {
    lines.push(`- FeNO: ${data.feno} ppb.`);
  } else {
    lines.push("- FeNO: not available.");
  }
  if (data.totalIge !== null) {
    lines.push(`- Total IgE: ${data.totalIge}.`);
  }
  lines.push(`- Smoking status: ${getSmokingSummary(data)}.`);
  lines.push(`- Current regimen: ${getRegimenLabel(data.currentRegimen)}.`);
  if (data.allergenDriven) {
    lines.push("- Allergic or allergen-driven phenotype is present.");
  }
  if (data.nasalPolyps) {
    lines.push("- Nasal polyps / upper-airway Type 2 disease is present.");
  }
  if (data.atopicDermatitis) {
    lines.push("- Atopic dermatitis is present.");
  }
  if (data.egpa) {
    lines.push("- EGPA concern is present or suspected.");
  }
  if (data.maintenanceOcs) {
    lines.push("- Maintenance oral corticosteroids are required.");
  }
  if (data.poorTechnique) {
    lines.push("- Poor inhaler technique is present.");
  }
  if (data.poorAdherence) {
    lines.push("- Poor adherence is present.");
  }
  if (data.icsSideEffects) {
    lines.push("- ICS adverse-effect concerns are present.");
  }
  lines.push("");
  lines.push("Plan:");
  rec.plan.forEach((item, index) => {
    lines.push(`${index + 1}. ${item}`);
  });

  if (rec.medicationDetails.length > 0) {
    lines.push("");
    lines.push("Medication details and administration notes:");
    rec.medicationDetails.forEach((item) => {
      lines.push(`- ${item}`);
    });
  }

  if (rec.biologicGuidance.show) {
    lines.push("");
    lines.push("Biologic guidance:");
    lines.push(`- Overview: ${rec.biologicGuidance.summary}`);
    rec.biologicGuidance.preferred.forEach((item) => {
      lines.push(`- Preferred: ${item}`);
    });
    rec.biologicGuidance.secondary.forEach((item) => {
      lines.push(`- Secondary: ${item}`);
    });
    rec.biologicGuidance.considerations.forEach((item) => {
      lines.push(`- Consideration: ${item}`);
    });
  }

  if (rec.prevention.length > 0) {
    lines.push("");
    lines.push("Prevention and vaccination:");
    rec.prevention.forEach((item) => {
      lines.push(`- ${item}`);
    });
  }

  if (rec.nonPharm.length > 0) {
    lines.push("");
    lines.push("Non-pharmacologic priorities:");
    rec.nonPharm.forEach((item) => {
      lines.push(`- ${item}`);
    });
  }

  if (rec.cautions.length > 0) {
    lines.push("");
    lines.push("Clinical cautions:");
    rec.cautions.forEach((item) => {
      lines.push(`- ${item}`);
    });
  }

  lines.push("");
  lines.push("This note was generated from a GINA 2025-based adult asthma decision-support tool and should be reconciled with clinician judgment, objective testing, contraindications, and local policy.");

  return lines.join("\n");
}

function renderRecommendation(rec, data) {
  document.getElementById("group-output").textContent = `Management phase: ${rec.phaseLabel}. Diagnosis status: ${rec.diagnosticLabel}. Recommendation anchor: ${rec.trackStep}.`;
  document.getElementById("symptom-output").textContent = rec.symptomSummary;
  document.getElementById("risk-output").textContent = rec.riskSummary;

  fillList("plan-list", rec.plan, "No management changes were triggered.");
  fillList("medication-list", rec.medicationDetails, "No medication-specific dosing instructions were triggered by the current scenario.");
  fillList("prevention-list", rec.prevention, "No additional prevention gaps were triggered from the entered fields.");
  fillList("rationale-list", rec.rationale, "No additional rationale notes were needed.");
  fillList("caution-list", rec.cautions, "No cautions identified.");
  fillList("nonpharm-list", rec.nonPharm, "No additional non-pharmacologic recommendations were triggered.");

  const biologicCard = document.getElementById("biologic-guidance-card");
  if (rec.biologicGuidance.show) {
    document.getElementById("biologic-summary").textContent = rec.biologicGuidance.summary;
    fillList("biologic-preferred-list", rec.biologicGuidance.preferred, "No preferred biologic stood out from the entered data.");
    fillList("biologic-secondary-list", rec.biologicGuidance.secondary, "No clear secondary biologic options were generated.");
    fillList("biologic-considerations-list", rec.biologicGuidance.considerations, "No additional biologic-specific considerations were generated.");
    biologicCard.classList.remove("hidden");
  } else {
    biologicCard.classList.add("hidden");
    document.getElementById("biologic-summary").textContent = "";
    document.getElementById("biologic-preferred-list").innerHTML = "";
    document.getElementById("biologic-secondary-list").innerHTML = "";
    document.getElementById("biologic-considerations-list").innerHTML = "";
  }

  document.getElementById("note-output").value = buildNoteText(data, rec);
  document.getElementById("copy-note-status").textContent = "";

  document.getElementById("results").classList.remove("hidden");
  document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function copyNoteOutput() {
  const noteOutput = document.getElementById("note-output");
  const status = document.getElementById("copy-note-status");

  if (!noteOutput.value.trim()) {
    status.textContent = "Generate a recommendation before copying the note.";
    return;
  }

  try {
    await navigator.clipboard.writeText(noteOutput.value);
    status.textContent = "Note copied to clipboard.";
  } catch (error) {
    noteOutput.select();
    document.execCommand("copy");
    status.textContent = "Note copied using fallback copy.";
  }
}

document.getElementById("asthma-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = getInputState();
  const recommendation = buildRecommendation(data);
  renderRecommendation(recommendation, data);
});

document.getElementById("copy-note-btn").addEventListener("click", copyNoteOutput);

initHelpers();
