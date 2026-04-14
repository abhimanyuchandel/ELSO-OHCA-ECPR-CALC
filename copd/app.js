const {
  DEFAULT_NO_RISK_ISSUE,
  describeFev1FvcEntry,
  classifySymptoms,
  classifyExacerbationRisk,
  assignGoldGroup,
  isRoflumilastCandidate,
  isLungCancerScreenEligible,
  getLungCancerScreeningCaveat
} = window.copdLogic;

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

function formatRatio(value) {
  return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function getFev1FvcStateFromDom() {
  const input = document.getElementById("fev1fvc");
  const raw = input.value.trim();

  if (raw === "") {
    return {
      hasEntry: false,
      rawValue: null,
      ratio: null,
      entryMode: null
    };
  }

  const parsed = Number(raw);
  const normalized = describeFev1FvcEntry(parsed);

  return {
    hasEntry: true,
    rawValue: Number.isFinite(parsed) ? parsed : null,
    ratio: normalized.ratio,
    entryMode: normalized.entryMode
  };
}

function getInputState() {
  const fev1fvcState = getFev1FvcStateFromDom();

  return {
    managementPhase: getSelectValue("management-phase"),
    age: getNumberValue("age"),
    spirometryConfirmed: getCheckboxValue("spirometry-confirmed"),
    fev1fvc: fev1fvcState.ratio,
    fev1fvcEntryMode: fev1fvcState.entryMode,
    fev1fvcRawValue: fev1fvcState.rawValue,
    fev1Predicted: getNumberValue("fev1-predicted"),
    restingSpo2: getNumberValue("resting-spo2"),
    catScore: getNumberValue("cat-score"),
    mmrcScore: getNumberValue("mmrc-score"),
    moderateExac: getNumberValue("moderate-exac"),
    severeExac: getNumberValue("severe-exac"),
    eosinophils: getNumberValue("eosinophils"),
    smokingStatus: getSelectValue("smoking-status"),
    packYears: getNumberValue("pack-years"),
    cigarettesPerDay: getNumberValue("cigarettes-per-day"),
    yearsSinceQuit: getNumberValue("years-since-quit"),
    firstCigarette30: getCheckboxValue("first-cigarette-30"),
    chronicBronchitis: getCheckboxValue("chronic-bronchitis"),
    concomitantAsthma: getCheckboxValue("concomitant-asthma"),
    endemicAreaExposure: getCheckboxValue("endemic-area-exposure"),
    aatdStatus: getSelectValue("aatd-status"),
    pneumococcalStatus: getSelectValue("pneumococcal-status"),
    rsvStatus: getSelectValue("rsv-status"),
    zosterStatus: getSelectValue("zoster-status"),
    tdapStatus: getSelectValue("tdap-status"),
    currentRegimen: getSelectValue("current-regimen"),
    persistentDyspnea: getCheckboxValue("persistent-dyspnea"),
    icsSideEffects: getCheckboxValue("ics-side-effects")
  };
}

function getCatCalculatorState() {
  const inputs = Array.from(document.querySelectorAll("[data-cat-item]"));
  const values = inputs.map((input) => {
    if (input.value === "") {
      return null;
    }

    const score = Number(input.value);
    return Number.isFinite(score) ? score : null;
  });

  const answered = values.filter((value) => value !== null).length;
  const complete = answered === values.length && values.length > 0;
  const total = values.reduce((sum, value) => sum + (value === null ? 0 : value), 0);

  return { answered, complete, total, itemCount: values.length, inputs };
}

function updateCatCalculatorDisplay() {
  const state = getCatCalculatorState();
  const display = document.getElementById("cat-total-display");
  const note = document.getElementById("cat-calc-note");

  display.textContent = `CAT total: ${state.total}/40`;
  if (state.complete) {
    note.textContent = "CAT questionnaire complete. Click Apply CAT Total to copy this value.";
  } else {
    note.textContent = `CAT questionnaire incomplete (${state.answered}/${state.itemCount} items answered).`;
  }
}

function applyCatScore() {
  const state = getCatCalculatorState();
  const note = document.getElementById("cat-calc-note");

  if (!state.complete) {
    note.textContent = "Complete all 8 CAT items before applying the total.";
    return;
  }

  document.getElementById("cat-score").value = String(state.total);
  note.textContent = `Applied CAT score ${state.total} to symptom input.`;
}

function clearCatCalculator() {
  const state = getCatCalculatorState();
  state.inputs.forEach((input) => {
    input.value = "";
  });
  document.getElementById("cat-score").value = "";
  updateCatCalculatorDisplay();
}

function getSelectedMmrc() {
  const selected = document.querySelector('input[name="mmrc-choice"]:checked');
  if (!selected) {
    return null;
  }

  const score = Number(selected.value);
  return Number.isFinite(score) ? score : null;
}

function updateMmrcDisplay() {
  const selected = getSelectedMmrc();
  const display = document.getElementById("mmrc-display");
  const note = document.getElementById("mmrc-note");

  if (selected === null) {
    display.textContent = "mMRC selected: --/4";
    note.textContent = "Select one mMRC statement, then click Apply mMRC Score.";
    return;
  }

  display.textContent = `mMRC selected: ${selected}/4`;
  note.textContent = "mMRC statement selected. Click Apply mMRC Score to copy this value.";
}

function applyMmrcScore() {
  const selected = getSelectedMmrc();
  const note = document.getElementById("mmrc-note");

  if (selected === null) {
    note.textContent = "Select one mMRC statement before applying.";
    return;
  }

  document.getElementById("mmrc-score").value = String(selected);
  note.textContent = `Applied mMRC score ${selected} to symptom input.`;
}

function clearMmrcCalculator() {
  document.querySelectorAll('input[name="mmrc-choice"]').forEach((input) => {
    input.checked = false;
  });
  document.getElementById("mmrc-score").value = "";
  updateMmrcDisplay();
}

function initSymptomCalculators() {
  document.querySelectorAll("[data-cat-item]").forEach((input) => {
    input.addEventListener("change", updateCatCalculatorDisplay);
  });
  document.getElementById("calc-cat-btn").addEventListener("click", applyCatScore);
  document.getElementById("clear-cat-btn").addEventListener("click", clearCatCalculator);

  document.querySelectorAll('input[name="mmrc-choice"]').forEach((input) => {
    input.addEventListener("change", updateMmrcDisplay);
  });
  document.getElementById("apply-mmrc-btn").addEventListener("click", applyMmrcScore);
  document.getElementById("clear-mmrc-btn").addEventListener("click", clearMmrcCalculator);

  updateCatCalculatorDisplay();
  updateMmrcDisplay();
}

function updateFev1FvcHelperChip() {
  const display = document.getElementById("fev1fvc-normalized");
  const state = getFev1FvcStateFromDom();

  if (!state.hasEntry) {
    display.textContent = "Normalized ratio: --";
    return state;
  }

  if (state.ratio === null) {
    display.textContent = "Normalized ratio: unable to interpret entry";
    return state;
  }

  if (state.entryMode === "percent") {
    display.textContent = `Normalized ratio: ${formatRatio(state.ratio)} (interpreted from ${state.rawValue})`;
  } else {
    display.textContent = `Normalized ratio: ${formatRatio(state.ratio)} (entered as ratio)`;
  }

  return state;
}

function syncSpirometryConfirmationFromRatio() {
  const confirmationInput = document.getElementById("spirometry-confirmed");
  const state = updateFev1FvcHelperChip();

  if (state.ratio === null) {
    return;
  }

  confirmationInput.checked = state.ratio < 0.7;
}

function initSpirometryHelpers() {
  const ratioInput = document.getElementById("fev1fvc");
  ["input", "change", "blur"].forEach((eventName) => {
    ratioInput.addEventListener(eventName, syncSpirometryConfirmationFromRatio);
  });
  syncSpirometryConfirmationFromRatio();
}

function syncSmokingFields() {
  const smokingStatus = getSelectValue("smoking-status");
  const yearsSinceQuitWrap = document.getElementById("years-since-quit-wrap");
  const yearsSinceQuitInput = document.getElementById("years-since-quit");

  if (smokingStatus === "former") {
    yearsSinceQuitWrap.classList.remove("hidden");
    yearsSinceQuitInput.disabled = false;
    return;
  }

  yearsSinceQuitWrap.classList.add("hidden");
  yearsSinceQuitInput.disabled = true;
  yearsSinceQuitInput.value = "";
}

function initSmokingFieldHelpers() {
  document.getElementById("smoking-status").addEventListener("change", syncSmokingFields);
  syncSmokingFields();
}

function setNoExacerbationCounts() {
  document.getElementById("moderate-exac").value = "0";
  document.getElementById("severe-exac").value = "0";
}

function initExacerbationHelpers() {
  document.getElementById("set-no-exac-btn").addEventListener("click", setNoExacerbationCounts);
}

function getPhaseLabel(phase) {
  return phase === "followup"
    ? "Follow-up pharmacologic management"
    : "Initial pharmacologic management";
}

function getRegimenLabel(regimen) {
  const labels = {
    naive: "No maintenance inhaler (treatment-naive)",
    mono: "Single long-acting bronchodilator",
    "laba-lama": "LABA + LAMA",
    triple: "LABA + LAMA + ICS",
    other: "Other / unclear regimen"
  };

  return labels[regimen] || "Unknown regimen";
}

function getRoflumilastDetail() {
  return "Roflumilast: 250 mcg daily x4 weeks, then 500 mcg daily. Not a rescue bronchodilator. Avoid in moderate-severe hepatic impairment; monitor weight loss, insomnia, anxiety, depression, and suicidality.";
}

function getAzithromycinDetail() {
  return "Azithromycin prophylaxis: 250 mg daily or 500 mg three times weekly for 1 year. Review QT risk, interacting drugs, hearing toxicity, and antimicrobial resistance; benefit is lower in active smokers.";
}

function getEnsifentrineDetail() {
  return "Ensifentrine: 3 mg nebulized BID using a standard jet nebulizer with mouthpiece. Do not mix with other nebulized drugs. Use as maintenance therapy, not rescue therapy.";
}

function getDupilumabDetail() {
  return "Dupilumab: 300 mg SC every 2 weeks as add-on maintenance therapy. Rotate injection sites. Not for acute bronchospasm. Review helminth risk and avoid live vaccines during therapy.";
}

function getMepolizumabDetail() {
  return "Mepolizumab: 100 mg SC every 4 weeks as add-on maintenance therapy. Not for acute bronchospasm. Consider zoster vaccination before treatment when appropriate.";
}

function getAzithromycinRoflumilastInteractionDetail() {
  return "If azithromycin and roflumilast are used together, review the medication list for interactions and monitor tolerability/adverse effects.";
}

function getSmokingCessationDetails(data) {
  const details = [];

  details.push("Smoking cessation is most effective with counseling plus pharmacotherapy; refer to a structured program and offer quit-line support.");
  details.push("Varenicline: start 1 week before quit date; 0.5 mg daily days 1-3, 0.5 mg BID days 4-7, then 1 mg BID for 12 weeks. Review renal dosing and monitor for nausea, sleep disturbance, neuropsychiatric symptoms, hypersensitivity, and seizure risk.");
  details.push("Bupropion SR: 150 mg daily for 3 days, then 150 mg BID, starting before the quit date. Avoid with seizure disorder, eating disorder history, abrupt sedative/alcohol withdrawal, MAOI use, or another bupropion product.");

  if (data.cigarettesPerDay !== null) {
    if (data.cigarettesPerDay > 10) {
      details.push("Nicotine patch (if >10 cigarettes/day): 21 mg daily x6 weeks, then 14 mg x2 weeks, then 7 mg x2 weeks. Do not smoke while using the patch; use caution after recent MI or stroke.");
    } else {
      details.push("Nicotine patch (if <=10 cigarettes/day): 14 mg daily x6 weeks, then 7 mg x2 weeks. Do not smoke while using the patch; use caution after recent MI or stroke.");
    }
  } else {
    details.push("Nicotine patch dosing depends on baseline cigarette consumption; use caution after a recent myocardial infarction or stroke.");
  }

  if (data.firstCigarette30) {
    details.push("High nicotine dependence: first cigarette within 30 minutes of waking.");
    details.push("Nicotine gum/lozenge 4 mg if first cigarette is within 30 minutes of waking. Use every 1-2 hours for weeks 1-6; gum minimum 9/day (max 24/day), lozenge max 20/day.");
  } else {
    details.push("Nicotine gum/lozenge 2 mg if first cigarette is >30 minutes after waking. Use every 1-2 hours for weeks 1-6; gum minimum 9/day (max 24/day), lozenge max 20/day.");
  }

  return details;
}

function hasAdvancedCopdFeatures(data) {
  const severeAirflowObstruction = data.fev1Predicted !== null && data.fev1Predicted < 50;
  const severeSymptomBurden =
    (data.catScore !== null && data.catScore >= 20) ||
    (data.mmrcScore !== null && data.mmrcScore >= 3);
  const severeEventHistory = data.severeExac !== null && data.severeExac >= 1;
  const hypoxemiaSignal = data.restingSpo2 !== null && data.restingSpo2 <= 92;

  return severeAirflowObstruction || (severeSymptomBurden && severeEventHistory) || hypoxemiaSignal;
}

function shouldRecommendParasitePrecaution(data) {
  return data.eosinophils !== null && data.eosinophils > 300 && data.endemicAreaExposure;
}

function getParasitePrecautionRecommendation() {
  return "If eosinophils are >300 cells/uL and endemic exposure is present, evaluate for parasitic infection before biologic therapy.";
}

function buildInitialRecommendations(group, data, symptoms) {
  const plan = [];
  const rationale = [];
  const medicationDetails = [];
  const followUpRecommendation = "Follow up: Consider clinical follow-up in 3-6 months and annual spirometry.";

  if (group === "A") {
    plan.push("Start a bronchodilator for breathlessness; prefer a long-acting agent unless symptoms are very occasional.");
    plan.push("Continue bronchodilator therapy only if clinical benefit is documented.");
  }

  if (group === "B") {
    plan.push("Start LABA/LAMA (preferred initial therapy).");
    plan.push("If LABA/LAMA is not feasible, use a single long-acting bronchodilator based on response, cost, and tolerability.");
  }

  if (group === "E") {
    plan.push("Start LABA/LAMA (preferred initial therapy for GOLD E).");
    if (data.eosinophils !== null && data.eosinophils >= 300) {
      plan.push("Consider initial triple therapy when eosinophils are >=300 cells/uL.");
    }
    plan.push("Avoid LABA/ICS alone in COPD; if ICS is indicated, use triple therapy.");
  }

  if (group === "A/B/E (exacerbation history required to classify)") {
    plan.push("Confirm prior-year moderate and severe exacerbation counts before finalizing GOLD classification and initial inhaled therapy.");
    rationale.push("GOLD A/B/E grouping cannot be assigned definitively when exacerbation history is missing.");
  }

  if (group === "A/B (symptom score required to distinguish)" || symptoms.high === null) {
    plan.push("Complete CAT/CAAT or mMRC scoring before finalizing symptom-based treatment intensity.");
  }

  if (data.concomitantAsthma) {
    plan.push("Use an ICS-containing regimen because asthma overlap is present; avoid LABA without ICS.");
    if (group === "B" || group === "E") {
      plan.push("Given asthma overlap and higher-intensity COPD needs, consider triple therapy to maintain ICS coverage.");
    }
    rationale.push("Asthma overlap changes the initial pathway because GOLD states COPD with concomitant asthma should be treated like asthma and requires ICS.");
  }

  plan.push("Ensure PRN rescue inhaler is available.");
  rationale.push("Initial treatment path follows GOLD 2026 Figure 3.8 for treatment-naive COPD.");

  return { plan, rationale, medicationDetails, followUpRecommendation };
}

function buildFollowUpRecommendations(data, exacRisk) {
  const plan = [];
  const rationale = [];
  const medicationDetails = [];
  const hasExacerbation = exacRisk.high === true;
  const exacHistoryMissing = exacRisk.high === null;
  let managementChangeRecommended = false;
  let followUpRecommendation = "Follow up: Consider clinical follow-up in 6-12 months and annual spirometry.";

  if (data.currentRegimen === "naive") {
    managementChangeRecommended = true;
    plan.push("No maintenance regimen is documented; start with the initial treatment pathway, then reassess.");
    if (data.concomitantAsthma) {
      plan.push("Because asthma overlap is present, the next maintenance regimen should include ICS.");
    }
    rationale.push("Follow-up algorithms in GOLD 2026 are intended for patients already receiving maintenance treatment.");
    followUpRecommendation = "Follow up: Consider clinical follow-up in 3-6 months and annual spirometry.";
    return { plan, rationale, medicationDetails, followUpRecommendation };
  }

  if (hasExacerbation) {
    managementChangeRecommended = true;
    rationale.push("Exacerbation pathway selected because GOLD prioritizes exacerbation prevention when both dyspnea and exacerbations are present.");

    if (data.currentRegimen === "mono") {
      plan.push("Escalate monotherapy to LABA/LAMA because exacerbations occurred on monotherapy.");
    } else if (data.currentRegimen === "laba-lama") {
      if (data.eosinophils !== null && data.eosinophils >= 100) {
        plan.push("Escalate LABA/LAMA to triple therapy because exacerbations occurred and eosinophils are >=100 cells/uL.");
      } else {
        plan.push("With exacerbations on LABA/LAMA and eosinophils <100 cells/uL or unavailable, consider non-ICS add-on therapy.");
        if (data.eosinophils === null) {
          plan.push("Obtain a blood eosinophil count to guide ICS benefit.");
        }
        if (data.smokingStatus !== "current") {
          plan.push("Consider chronic azithromycin add-on therapy in a non-current smoker.");
          medicationDetails.push(getAzithromycinDetail());
        }
        if (isRoflumilastCandidate(data)) {
          plan.push("Consider roflumilast for FEV1 <50%, chronic bronchitis, and exacerbations despite maintenance therapy.");
          medicationDetails.push(getRoflumilastDetail());
        }
      }
    } else if (data.currentRegimen === "triple") {
      if (data.eosinophils !== null && data.eosinophils >= 300) {
        if (data.chronicBronchitis) {
          plan.push("Consider add-on biologic therapy (dupilumab or mepolizumab) for eosinophils >=300 cells/uL with chronic bronchitis; use one biologic only.");
          medicationDetails.push(getDupilumabDetail());
        } else {
          plan.push("Consider mepolizumab add-on therapy for eosinophils >=300 cells/uL.");
        }
        if (shouldRecommendParasitePrecaution(data)) {
          plan.push(getParasitePrecautionRecommendation());
        }
        medicationDetails.push(getMepolizumabDetail());
      }
      if (data.smokingStatus !== "current") {
        plan.push("Consider chronic azithromycin for persistent exacerbations in a non-current smoker.");
        medicationDetails.push(getAzithromycinDetail());
      }
      if (isRoflumilastCandidate(data)) {
        plan.push("Consider roflumilast for FEV1 <50%, chronic bronchitis, and ongoing exacerbations despite optimized inhaled therapy.");
        medicationDetails.push(getRoflumilastDetail());
      }
      if (data.icsSideEffects) {
        if (data.eosinophils !== null && data.eosinophils >= 300) {
          plan.push("Avoid routine ICS withdrawal when eosinophils are >=300 cells/uL because exacerbation risk may increase.");
        } else {
          plan.push("If ICS was ineffective, inappropriate, or harmful, consider ICS de-escalation with close follow-up.");
        }
      }
    } else {
      plan.push("Clarify the maintenance regimen and align it with a standard pathway before adjustment.");
    }
  } else if (data.persistentDyspnea) {
    managementChangeRecommended = true;
    rationale.push("Dyspnea pathway selected because persistent breathlessness is the main follow-up issue.");

    if (data.currentRegimen === "mono") {
      plan.push("Escalate monotherapy to LABA/LAMA for persistent dyspnea or exercise limitation.");
    } else if (data.currentRegimen === "laba-lama") {
      plan.push("If dyspnea persists on LABA/LAMA, reassess device/molecule selection and escalate nonpharmacologic therapy, including pulmonary rehabilitation.");
      plan.push("Consider ensifentrine if available.");
      medicationDetails.push(getEnsifentrineDetail());
    } else if (data.currentRegimen === "triple") {
      plan.push("Persistent dyspnea on triple therapy should prompt reassessment of technique/device, comorbid contributors, and rehabilitation needs.");
      plan.push("Consider ensifentrine if symptoms remain limiting despite optimized inhaler therapy and rehabilitation.");
      medicationDetails.push(getEnsifentrineDetail());
    } else {
      plan.push("Clarify the maintenance regimen and optimize bronchodilation before further escalation.");
    }

    plan.push("Evaluate non-COPD contributors to dyspnea (e.g., cardiac disease, deconditioning, anemia, anxiety).");
  } else if (exacHistoryMissing) {
    plan.push("Exacerbation history is incomplete; confirm prior-year counts before deciding no escalation is needed.");
    rationale.push("Follow-up maintenance recommendations should not assume zero exacerbations when history is missing.");
    followUpRecommendation = "Follow up: Consider clinical follow-up in 3-6 months and annual spirometry.";
  } else {
    plan.push("Continue current maintenance therapy; no escalation indicated.");
    rationale.push("Follow-up reassessment did not identify a dominant dyspnea or exacerbation target.");
  }

  if (data.concomitantAsthma) {
    rationale.push("Asthma overlap changes the follow-up pathway because GOLD states COPD with concomitant asthma should be treated like asthma and requires ICS.");

    if (data.currentRegimen === "mono") {
      managementChangeRecommended = true;
      plan.push("Transition to an ICS-containing regimen because asthma overlap is present.");
    } else if (data.currentRegimen === "laba-lama") {
      managementChangeRecommended = true;
      plan.push("Escalate LABA/LAMA to triple therapy because asthma overlap is present, unless ICS is contraindicated.");
    } else if (data.currentRegimen === "triple") {
      plan.push("Continue ICS-containing therapy given asthma overlap; consider ICS withdrawal only if harms clearly outweigh benefit.");
    } else {
      managementChangeRecommended = true;
      plan.push("Clarify the maintenance regimen and ensure ICS is included because asthma overlap is present.");
    }
  }

  plan.push("At each follow-up, reassess adherence, inhaler technique/device fit, and comorbid contributors before escalation.");
  plan.push("Ensure PRN rescue inhaler is available.");

  if (managementChangeRecommended) {
    followUpRecommendation = "Follow up: Consider clinical follow-up in 3-6 months and annual spirometry.";
  }

  return { plan, rationale, medicationDetails, followUpRecommendation };
}

function buildPreventiveCare(data) {
  const prevention = [];

  if (data.aatdStatus === "unknown" || data.aatdStatus === "not-done") {
    prevention.push("Order one-time AATD screening, as recommended for all patients with COPD.");
  } else if (data.aatdStatus === "known-aatd") {
    prevention.push("Known AATD: confirm specialist follow-up and consider family screening.");
  }

  if (isLungCancerScreenEligible(data)) {
    prevention.push("Meets ACS lung cancer screening criteria; recommend annual LDCT.");
    const screeningCaveat = getLungCancerScreeningCaveat(data);
    if (screeningCaveat) {
      prevention.push(screeningCaveat);
    }
  }

  if (data.pneumococcalStatus === "unknown" || data.pneumococcalStatus === "unvaccinated") {
    prevention.push("Give PCV20 or PCV21 now because vaccination status is incomplete/unknown and COPD qualifies.");
  }

  if (data.age !== null && data.age >= 50 && data.rsvStatus !== "complete") {
    prevention.push("Recommend RSV vaccination (age >=50 with chronic lung disease).");
  }

  if (data.age !== null && data.age >= 50 && data.zosterStatus !== "complete") {
    prevention.push("Recommend recombinant zoster vaccine (Shingrix) 2-dose series (dose 2 in 2-6 months).");
  }

  if (data.tdapStatus === "unknown" || data.tdapStatus === "not-up-to-date") {
    prevention.push("Give tetanus-containing booster now because none is documented within 10 years.");
  }

  prevention.push("Keep influenza and COVID-19 vaccination up to date.");

  if (data.restingSpo2 !== null && data.restingSpo2 <= 92) {
    prevention.push("Resting SpO2 <=92%; obtain ABG and assess oxygen need.");
  }

  if (hasAdvancedCopdFeatures(data)) {
    prevention.push("Advanced COPD features are present; assess for LTOT, home NIV if hypercapnic, lung volume reduction/LVRS eligibility, and supportive or palliative care needs.");
  }

  if (data.smokingStatus === "current") {
    prevention.push("Offer intensive smoking cessation now; combine counseling with pharmacotherapy.");
  }

  return prevention;
}

function buildNonPharmacologicBundle(data) {
  const bundle = [
    "Check inhaler technique and adherence at every review and correct barriers before further escalation.",
    "Provide written self-management education and an exacerbation action plan.",
    "Offer pulmonary rehabilitation when dyspnea, reduced exercise tolerance, or advanced disease features are present.",
    "Address multimorbidity actively, including cardiovascular disease, mood symptoms, osteoporosis, sleep-disordered breathing, and malignancy risk."
  ];

  if (data.smokingStatus === "current") {
    bundle.push("Advise complete smoking cessation at every visit and document readiness to quit.");
  }

  return bundle;
}

function getSmokingSummary(data) {
  const labels = {
    current: "Current smoker",
    former: "Former smoker",
    never: "Never smoker"
  };
  const parts = [labels[data.smokingStatus] || "Smoking status unknown"];

  if (data.packYears !== null) {
    parts.push(`${data.packYears} pack-years`);
  }

  if (data.smokingStatus === "current" && data.cigarettesPerDay !== null) {
    parts.push(`${data.cigarettesPerDay} cigarettes/day`);
  }

  if (data.smokingStatus === "former" && data.yearsSinceQuit !== null) {
    parts.push(`quit ${data.yearsSinceQuit} years ago`);
  }

  return parts.join(", ");
}

function buildCautions(data, exacRisk) {
  const cautions = [];

  if (data.fev1fvcRawValue !== null && data.fev1fvc === null) {
    cautions.push("FEV1/FVC entry is invalid; enter a ratio (e.g., 0.65) or percent (e.g., 65).");
  }
  if (!data.spirometryConfirmed) {
    cautions.push("Confirm airflow obstruction with post-bronchodilator spirometry before making long-term treatment decisions.");
  }
  if (data.fev1fvc !== null && data.fev1fvc >= 0.7) {
    cautions.push("FEV1/FVC is >=0.70; reassess the diagnosis and differential before applying the COPD pathway.");
  }
  if (exacRisk.high === null) {
    cautions.push("Exacerbation history is incomplete; GOLD classification and escalation recommendations are provisional until prior-year counts are confirmed.");
  } else if (exacRisk.missing) {
    cautions.push(`${exacRisk.missing[0].toUpperCase() + exacRisk.missing.slice(1)} exacerbation count is missing and was provisionally treated as 0; confirm the full prior-year exacerbation history.`);
  }
  if (data.concomitantAsthma) {
    cautions.push("Asthma overlap is present; use an ICS-containing regimen, avoid LABA without ICS, and use caution with ICS withdrawal.");
  }
  if (data.managementPhase === "initial" && data.currentRegimen !== "naive") {
    cautions.push("Initial management was selected despite an existing maintenance regimen; confirm whether follow-up management is more appropriate.");
  }
  if (data.managementPhase === "followup" && data.currentRegimen === "naive") {
    cautions.push("Follow-up management was selected without a documented maintenance regimen; the recommendation will default to an initial-treatment pathway.");
  }
  if ((data.smokingStatus === "current" || data.smokingStatus === "former") && data.packYears === null) {
    cautions.push("Pack-year history is missing; lung cancer screening eligibility cannot be fully assessed.");
  }
  if (data.age === null) {
    cautions.push("Age is missing, so age-based vaccine and lung cancer screening recommendations may be incomplete.");
  }

  if (cautions.length === 0) {
    cautions.push(DEFAULT_NO_RISK_ISSUE);
  }

  return cautions;
}

function buildRecommendation(data) {
  const symptoms = classifySymptoms(data);
  const exacRisk = classifyExacerbationRisk(data);
  const group = assignGoldGroup(symptoms, exacRisk);
  const prevention = buildPreventiveCare(data);
  const nonPharm = buildNonPharmacologicBundle(data);
  const cautions = buildCautions(data, exacRisk);

  let therapy;
  if (data.managementPhase === "followup") {
    therapy = buildFollowUpRecommendations(data, exacRisk);
  } else {
    therapy = buildInitialRecommendations(group, data, symptoms);
  }

  const medicationDetails = [...therapy.medicationDetails];
  if (data.smokingStatus === "current") {
    medicationDetails.push(...getSmokingCessationDetails(data));
  }

  const hasAzithromycin = medicationDetails.some((item) => item.includes("Azithromycin"));
  const hasRoflumilast = medicationDetails.some((item) => item.includes("Roflumilast"));
  if (hasAzithromycin && hasRoflumilast) {
    medicationDetails.push(getAzithromycinRoflumilastInteractionDetail());
  }

  return {
    phaseLabel: getPhaseLabel(data.managementPhase),
    group,
    symptomSummary: symptoms.summary,
    symptomNoteLine: symptoms.noteLine,
    riskSummary: exacRisk.summary,
    riskNoteLine: exacRisk.noteLine,
    followUpRecommendation: therapy.followUpRecommendation,
    plan: therapy.plan,
    rationale: therapy.rationale,
    medicationDetails,
    prevention,
    cautions,
    nonPharm
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

function buildNoteText(data, rec) {
  const lines = [];
  const aatdLabel = {
    unknown: "Unknown / not documented",
    "not-done": "Not done",
    completed: "Completed and negative",
    "known-aatd": "Known alpha-1 antitrypsin deficiency"
  };
  const pneumococcalLabel = {
    unknown: "Unknown",
    unvaccinated: "Unvaccinated / incomplete",
    complete: "Complete (PCV20/PCV21 or equivalent)"
  };
  const rsvLabel = {
    unknown: "Unknown",
    unvaccinated: "Unvaccinated",
    complete: "Complete"
  };
  const zosterLabel = {
    unknown: "Unknown",
    unvaccinated: "Unvaccinated / incomplete",
    complete: "Complete"
  };
  const tdapLabel = {
    unknown: "Unknown / not documented within the last 10 years",
    "not-up-to-date": "No tetanus-containing vaccine documented within the last 10 years",
    "up-to-date": "Documented within the last 10 years"
  };

  lines.push("COPD Management Decision Support Summary");
  lines.push(`Management phase: ${rec.phaseLabel}`);
  lines.push("");
  lines.push("Case summary:");
  lines.push(`- COPD confirmed by post-bronchodilator spirometry: ${data.spirometryConfirmed ? "Yes" : "No / not documented"}.`);

  if (data.age !== null) {
    lines.push(`- Age: ${data.age} years.`);
  }
  if (data.fev1fvc !== null || data.fev1Predicted !== null) {
    const spirometryParts = [];
    if (data.fev1fvc !== null) {
      spirometryParts.push(`FEV1/FVC ${formatRatio(data.fev1fvc)}`);
    }
    if (data.fev1Predicted !== null) {
      spirometryParts.push(`FEV1 ${data.fev1Predicted}% predicted`);
    }
    lines.push(`- Spirometry details: ${spirometryParts.join(", ")}.`);
  }
  if (data.restingSpo2 !== null) {
    lines.push(`- Resting SpO2: ${data.restingSpo2}%.`);
  }

  lines.push(`- Symptoms: ${rec.symptomNoteLine}`);
  lines.push(`- Exacerbation history: ${rec.riskNoteLine}`);
  lines.push(`- GOLD group: ${rec.group}.`);

  if (data.eosinophils !== null) {
    lines.push(`- Blood eosinophils: ${data.eosinophils} cells/uL.`);
  } else {
    lines.push("- Blood eosinophils: not available.");
  }

  lines.push(`- Smoking status: ${getSmokingSummary(data)}.`);
  lines.push(`- Current maintenance regimen: ${getRegimenLabel(data.currentRegimen)}.`);
  lines.push(`- Chronic bronchitis phenotype: ${data.chronicBronchitis ? "Present (chronic productive cough for 3 months in the year)" : "Not documented"}.`);
  lines.push(`- Concomitant asthma: ${data.concomitantAsthma ? "Suspected / confirmed" : "Not documented"}.`);
  if (data.endemicAreaExposure) {
    lines.push("- History of living or residing in an endemic area for parasitic infection: yes.");
  }
  lines.push(`- AATD screening status: ${aatdLabel[data.aatdStatus] || "Unknown"}.`);
  lines.push(`- Pneumococcal vaccine status: ${pneumococcalLabel[data.pneumococcalStatus] || "Unknown"}.`);
  lines.push(`- RSV vaccine status: ${rsvLabel[data.rsvStatus] || "Unknown"}.`);
  lines.push(`- Zoster vaccine status: ${zosterLabel[data.zosterStatus] || "Unknown"}.`);
  lines.push(`- Tdap / tetanus booster status: ${tdapLabel[data.tdapStatus] || "Unknown"}.`);
  lines.push("");
  lines.push("Plan:");
  rec.plan.forEach((item, index) => {
    lines.push(`${index + 1}. ${item}`);
  });
  lines.push(`${rec.plan.length + 1}. ${rec.followUpRecommendation}`);

  if (rec.medicationDetails.length > 0) {
    lines.push("");
    lines.push("Medication details and administration notes:");
    rec.medicationDetails.forEach((item) => {
      lines.push(`- ${item}`);
    });
  }

  if (rec.prevention.length > 0) {
    lines.push("");
    lines.push("Prevention and screening:");
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

  const noteCautions = rec.cautions.filter((item) => item !== DEFAULT_NO_RISK_ISSUE);

  if (noteCautions.length > 0) {
    lines.push("");
    lines.push("Clinical cautions:");
    noteCautions.forEach((item) => {
      lines.push(`- ${item}`);
    });
  }

  return lines.join("\n");
}

function renderRecommendation(rec, data) {
  document.getElementById("group-output").textContent = `Management phase: ${rec.phaseLabel}. Assigned GOLD category: ${rec.group}`;
  document.getElementById("symptom-output").textContent = rec.symptomSummary;
  document.getElementById("risk-output").textContent = rec.riskSummary;

  fillList("plan-list", rec.plan, "No treatment changes were triggered.");
  fillList("medication-list", rec.medicationDetails, "No medication-specific dosing instructions were triggered by the current scenario.");
  fillList("prevention-list", rec.prevention, "No additional preventive care gaps were triggered from the entered fields.");
  fillList("rationale-list", rec.rationale, "No extra rationale notes were needed.");
  fillList("caution-list", rec.cautions, "No cautions identified.");
  fillList("nonpharm-list", rec.nonPharm, "No additional non-pharmacologic recommendations were triggered.");

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

document.getElementById("copd-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = getInputState();
  const recommendation = buildRecommendation(data);
  renderRecommendation(recommendation, data);
});

document.getElementById("copy-note-btn").addEventListener("click", copyNoteOutput);

initSymptomCalculators();
initSpirometryHelpers();
initSmokingFieldHelpers();
initExacerbationHelpers();
