// SSB Application PDF generation
// Fills the /Application_Form.pdf template (pdf-lib) from a wizard formData
// snapshot. Shared by ApplicationController (submission / nominee-change
// regeneration) and admin-side regeneration (e.g. after a valuation completes).

import {
  PDFDocument,
  PDFName,
  PDFDict,
  PDFRawStream,
  drawCheckBox,
  rgb,
} from "pdf-lib";

// Radio fields whose widgets sit directly on top of the printed option text
// (e.g. "Sex : Male / Female"). Their default PDF appearance fills a dot over
// a letter and obscures it, so we redraw the "on" state as an underline instead.
const UNDERLINE_RADIO_FIELDS = [
  "applicant_sex",
  "jApplicant_sex",
  "nominee_sex",
  "nominee2_sex",
  "applicant_presentHouse",
  "applicant_bankAccType",
  "applicant_prefer",
  "jApplicant_relationship",
  "property_type",
  "property_tenureTitle",
  "property_encumbered",
];

// Radio fields whose widgets sit next to a standalone option (e.g. a tick
// box before "Newspaper" / "Lump Sum"). pdf-lib's default appearance for a
// selected radio widget is a filled dot, but these boxes are meant to be
// ticked like the form's real checkboxes, so we redraw the "on" state with
// a checkmark instead.
const TICK_RADIO_FIELDS = [
  "fromWhere",
  "applicant_payout",
  "applicant_lumpSumUsage",
  "applicant_payment",
  "ssb_prefererence",
  "property_fireInsurance",
  "property_fireInsurance_notAvailable",
  "property_renewalFireInsurance",
];

const tickRadioAppearanceProvider = (_radioGroup, widget) => {
  const { width, height } = widget.getRectangle();
  const borderWidth = widget.getBorderStyle()?.getWidth() ?? 0;
  const black = rgb(0, 0, 0);
  const options = {
    x: borderWidth / 2,
    y: borderWidth / 2,
    width: width - borderWidth,
    height: height - borderWidth,
    thickness: 1.5,
    borderWidth,
    borderColor: black,
    markColor: black,
  };
  return {
    normal: {
      on: drawCheckBox({ ...options, filled: true }),
      off: drawCheckBox({ ...options, filled: false }),
    },
  };
};

const applyTickAppearanceForRadioFields = (form) => {
  for (const fieldName of TICK_RADIO_FIELDS) {
    try {
      const field = form.getRadioGroup(fieldName);
      field.updateAppearances(tickRadioAppearanceProvider);
    } catch (e) {
      // Field doesn't exist in this template, skip
    }
  }
};

const applyUnderlineAppearanceForDotFields = (pdfDoc, form) => {
  const { context } = pdfDoc;
  for (const fieldName of UNDERLINE_RADIO_FIELDS) {
    let field;
    try {
      field = form.getRadioGroup(fieldName);
    } catch (e) {
      continue; // Field doesn't exist in this template, skip
    }
    for (const widget of field.acroField.getWidgets()) {
      const apRef = widget.dict.get(PDFName.of("AP"));
      if (!apRef) continue;
      const apDict = context.lookup(apRef, PDFDict);
      const nRef = apDict.get(PDFName.of("N"));
      const nDict = context.lookup(nRef, PDFDict);
      for (const state of nDict.keys()) {
        if (state.toString() === "/Off") continue;
        const streamRef = nDict.get(state);
        const stream = context.lookup(streamRef);
        const bbox = stream.dict.get(PDFName.of("BBox"));
        const width = bbox ? bbox.get(2).asNumber() : 13;
        const height = bbox ? bbox.get(3).asNumber() : 13;
        const y = height * 0.12;
        const content = `q\n0 G\n1 w\n${width * 0.08} ${y} m\n${width * 0.92} ${y} l\nS\nQ`;
        const newDict = context.obj({
          Type: "XObject",
          Subtype: "Form",
          FormType: 1,
          BBox: [0, 0, width, height],
        });
        context.assign(
          streamRef,
          PDFRawStream.of(newDict, new TextEncoder().encode(content)),
        );
      }
    }
  }
};

// Helper to fill text fields safely
const fillTextField = (form, fieldName, value) => {
  try {
    if (value) {
      const field = form.getTextField(fieldName);
      field.setText(String(value));
    }
  } catch (e) {
    // Field doesn't exist, skip
  }
};

// Helper to fill checkboxes safely
const fillCheckBox = (form, fieldName, checked) => {
  try {
    const field = form.getCheckBox(fieldName);
    if (checked) field.check();
    else field.uncheck();
    // Force pdf-lib to redraw a tick mark instead of reusing the
    // template's existing "Yes" appearance stream (which renders as a dot)
    field.defaultUpdateAppearances();
  } catch (e) {
    // Field doesn't exist, skip
  }
};

/**
 * Generate the filled SSB application PDF from a wizard formData snapshot.
 * @param {object} data - The full application formData (matches application_data.form_data / submitted_form_data shape)
 * @returns {Promise<Blob>} application/pdf blob
 */
export const generateApplicationPDF = async (data) => {
  const existingPdfBytes = await fetch("/Application_Form.pdf").then((res) =>
    res.arrayBuffer(),
  );
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const form = pdfDoc.getForm();
  applyUnderlineAppearanceForDotFields(pdfDoc, form);
  applyTickAppearanceForRadioFields(form);

  // Helper to fill radio groups safely
  const fillRadio = (form, fieldName, value) => {
    try {
      if (value) {
        const field = form.getRadioGroup(fieldName);
        field.select(value);
      }
    } catch (e) {
      // Field doesn't exist or value invalid, skip
    }
  };

  // Helper to clean "Other:" prefix
  const cleanOther = (value) => {
    if (!value) return value;
    return value.startsWith("Other:") ? value.substring(6).trim() : value;
  };

  // Step 1: Personal Information
  fillTextField(form, "applicant_salutation", cleanOther(data.salutation));
  fillTextField(form, "application_name", data.nameAsPerNRIC);
  fillTextField(form, "applicant_ic", data.nricNo);
  fillTextField(form, "applicant_address", data.address);
  fillTextField(form, "applicant_address_postcode", data.postcode);
  fillTextField(form, "applicant_email", data.email);
  fillTextField(form, "applicant_residencePhone", data.residencePhone);
  fillTextField(form, "applicant_telephone", data.telephone);
  fillTextField(form, "applicant_dob_dd", data.dobDay);
  fillTextField(form, "applicant_dob_mm", data.dobMonth);
  fillTextField(form, "applicant_dob_yyyy", data.dobYear);
  fillTextField(form, "applicant_race", cleanOther(data.race));
  if (data.malaysian) fillCheckBox(form, "applicant_malaysian", true);
  fillRadio(form, "applicant_sex", data.sex?.toLowerCase());
  fillTextField(
    form,
    "applicant_maritalStatus",
    cleanOther(data.maritalStatus),
  );
  fillTextField(form, "applicant_numOfDepend", data.numOfDependents);
  fillTextField(form, "applicant_numOfDepend_1", data.dependentAge1);
  fillTextField(form, "applicant_numOfDepend_2", data.dependentAge2);
  fillTextField(form, "applicant_numOfDepend_3", data.dependentAge3);
  fillTextField(form, "applicant_numOfDepend_4", data.dependentAge4);
  fillTextField(form, "applicant_numOfDepend_5", data.dependentAge5);
  fillRadio(form, "applicant_presentHouse", data.presentHouse);
  fillTextField(form, "applicant_occupation", data.occupation);
  fillTextField(form, "applicant_employerName", data.employerName);
  fillTextField(form, "applicant_employerAddress", data.employerAddress);
  fillTextField(
    form,
    "applicant_employerAddress_postcode",
    data.employerPostcode,
  );
  fillTextField(form, "applicant_purpose", data.purposeOfApplication);
  fillRadio(form, "applicant_payout", data.payoutOption);
  // Only fill lumpSumUsage if payoutOption is 'lumpSum', otherwise clear the field
  if (data.payoutOption === "lumpSum") {
    fillRadio(form, "applicant_lumpSumUsage", data.lumpSumUsage);
  } else {
    fillRadio(form, "applicant_lumpSumUsage", "");
  }
  fillRadio(form, "applicant_payment", data.paymentOption);
  fillRadio(form, "fromWhere", data.howDidYouKnow);
  fillRadio(form, "ssb_prefererence", data.preferredScheme);

  // Step 2: Joint Applicant
  if (data.isJointApplicant) {
    fillCheckBox(form, "joint?", true);
    fillTextField(
      form,
      "jApplicant_salutation",
      cleanOther(data.jSalutation),
    );
    fillTextField(form, "jApplicant_name", data.jName);
    fillTextField(form, "jApplicant_ic", data.jIc);
    fillTextField(form, "jApplicant_address", data.jAddress);
    fillTextField(form, "jApplicant_address_postcode", data.jPostcode);
    fillTextField(form, "jApplicant_email", data.jEmail);
    fillTextField(form, "jApplicant_residencePhone", data.jResidencePhone);
    fillTextField(form, "jApplicant_telephone", data.jTelephone);
    fillTextField(form, "jApplicant_dob_dd", data.jDobDay);
    fillTextField(form, "jApplicant_dob_mm", data.jDobMonth);
    fillTextField(form, "jApplicant_dob_yyyy", data.jDobYear);
    fillRadio(form, "jApplicant_sex", data.jSex?.toLowerCase());
    fillTextField(form, "jApplicant_race", cleanOther(data.jRace));
    if (data.jMalaysian) fillCheckBox(form, "jApplicant_malaysian", true);
    fillTextField(form, "jApplicant_marital", cleanOther(data.jMarital));
    fillTextField(form, "jApplicant_occupation", data.jOccupation);
    fillTextField(form, "jApplicant_employerName", data.jEmployerName);
    fillTextField(form, "jApplicant_employerAddress", data.jEmployerAddress);
    fillTextField(
      form,
      "jApplicant_employerAddress_postcode",
      data.jEmployerPostcode,
    );
    fillRadio(form, "jApplicant_relationship", data.jRelationship);
  }

  // Banking Information
  fillTextField(
    form,
    "applicant_bankName",
    data.bankName === "Other" ? data.otherBankName : data.bankName,
  );
  fillTextField(form, "applicant_accNumber", data.accountNumber);
  fillRadio(form, "applicant_bankAccType", data.accountType);
  fillRadio(form, "applicant_prefer", data.accountPreference);

  // Step 3: Property Information
  // Map hyphenated values to camelCase for PDF
  const propertyTypeValue =
    data.propertyType === "semi-detach" ? "semiDetach" : data.propertyType;
  fillRadio(form, "property_type", propertyTypeValue);
  const propertyAddressLine = [
    data.propertyAddress,
    data.propertySchemeName,
    data.propertyDistrict,
  ]
    .filter(Boolean)
    .join(", ");
  fillTextField(form, "property_address", propertyAddressLine);
  fillTextField(form, "property_address_postcode", data.propertyPostcode);
  fillTextField(
    form,
    "property_indicativeMarketValue",
    data.indicativeMarketValue,
  );
  fillTextField(form, "property_valDate_dd", data.valuationDay);
  fillTextField(form, "property_valDate_mm", data.valuationMonth);
  fillTextField(form, "property_valDate_yyyy", data.valuationYear);
  fillTextField(
    form,
    "property_expectedMarketValue",
    data.expectedMarketValue,
  );
  fillTextField(form, "property_purchasePrice", data.purchasePrice);
  fillTextField(form, "property_purchDate_dd", data.purchaseDay);
  fillTextField(form, "property_purchDate_mm", data.purchaseMonth);
  fillTextField(form, "property_purchDate_yyyy", data.purchaseYear);
  fillRadio(form, "property_tenureTitle", data.tenureTitle);
  // Only fill in expiry date of lease if tenure title is leasehold
  if (data.tenureTitle == "leasehold") {
    fillTextField(form, "property_expiryDoL_dd", data.expiryDay);
    fillTextField(form, "property_expiryDoL_mm", data.expiryMonth);
    fillTextField(form, "property_expiryDoL_yyyy", data.expiryYear);
  }
  fillTextField(form, "property_buildUpArea", data.buildUpArea);
  fillTextField(form, "property_landArea", data.landArea);
  fillRadio(form, "property_encumbered", data.propertyEncumbered);
  // Only fill bank name and balance if property is encumbered
  if (data.propertyEncumbered === "yes") {
    fillTextField(form, "property_bankName", data.propertyBankName);
    fillTextField(
      form,
      "property_estOutstandingBalance",
      data.estOutstandingBalance,
    );
  }
  fillRadio(form, "property_fireInsurance", data.fireInsurance);
  // Only fill insurance company and validity if insurance is in force
  if (data.fireInsurance === "inForce") {
    fillTextField(
      form,
      "property_fireInsurance_inForce_insurCompany",
      data.insuranceCompany,
    );
    fillTextField(
      form,
      "property_fireInsurance_inForce_periodValidity",
      data.periodValidity,
    );
  }
  // Auto-select YES when fire insurance is not available (Cagamas will purchase)
  if (data.fireInsurance === "notAvailable") {
    fillRadio(form, "property_fireInsurance_notAvailable", "yes");
  }
  fillRadio(form, "property_renewalFireInsurance", data.renewalFireInsurance);

  // Step 4: Nominee 1
  fillTextField(
    form,
    "nominee1_salutation",
    cleanOther(data.nominee1Salutation),
  );
  fillTextField(form, "nominee1_name", data.nominee1Name);
  fillTextField(form, "nominee1_ic", data.nominee1Ic);
  fillTextField(form, "nominee1_address", data.nominee1Address);
  fillTextField(form, "nominee1_address_postcode", data.nominee1Postcode);
  fillTextField(form, "nominee1_email", data.nominee1Email);
  fillTextField(form, "nominee1_residencePhone", data.nominee1ResidencePhone);
  fillTextField(form, "nominee1_telephone", data.nominee1Telephone);
  fillTextField(form, "nominee1_dob_dd", data.nominee1DobDay);
  fillTextField(form, "nominee1_dob_mm", data.nominee1DobMonth);
  fillTextField(form, "nominee1_dob_yyyy", data.nominee1DobYear);
  fillRadio(form, "nominee_sex", data.nominee1Sex?.toLowerCase());
  fillTextField(form, "nominee1_race", cleanOther(data.nominee1Race));
  if (data.nominee1Malaysian) fillCheckBox(form, "nominee1_malaysian", true);
  fillTextField(form, "nominee1_marital", cleanOther(data.nominee1Marital));
  fillTextField(form, "nominee1_relationship", data.nominee1Relationship);

  // Nominee 2
  if (data.hasSecondNominee) {
    fillTextField(
      form,
      "nominee2_salutation",
      cleanOther(data.nominee2Salutation),
    );
    fillTextField(form, "nominee2_name", data.nominee2Name);
    fillTextField(form, "nominee2_ic", data.nominee2Ic);
    fillTextField(form, "nominee2_address", data.nominee2Address);
    fillTextField(form, "nominee2_address_postcode", data.nominee2Postcode);
    fillTextField(form, "nominee2_email", data.nominee2Email);
    fillTextField(
      form,
      "nominee2_residencePhone",
      data.nominee2ResidencePhone,
    );
    fillTextField(form, "nominee2_telephone", data.nominee2Telephone);
    fillTextField(form, "nominee2_dob_dd", data.nominee2DobDay);
    fillTextField(form, "nominee2_dob_mm", data.nominee2DobMonth);
    fillTextField(form, "nominee2_dob_yyyy", data.nominee2DobYear);
    fillRadio(form, "nominee2_sex", data.nominee2Sex?.toLowerCase());
    fillTextField(form, "nominee2_race", cleanOther(data.nominee2Race));
    if (data.nominee2Malaysian)
      fillCheckBox(form, "nominee2_malaysian", true);
    fillTextField(form, "nominee2_marital", cleanOther(data.nominee2Marital));
    fillTextField(form, "nominee2_relationship", data.nominee2Relationship);
  }

  // Step 5: Signatures
  fillTextField(
    form,
    "applicant_signature_name",
    data.applicant_signature_name,
  );
  fillTextField(
    form,
    "applicant_signature_date",
    data.applicant_signature_date,
  );

  if (data.isJointApplicant) {
    fillTextField(
      form,
      "jApplicant_signature_name",
      data.jApplicant_signature_name,
    );
    fillTextField(
      form,
      "jApplicant_signature_date",
      data.jApplicant_signature_date,
    );
  }

  // Step 6: Acknowledgement
  fillTextField(form, "ackNominee_name", data.ack_nomineeName);
  fillTextField(form, "ackNominee_ic", data.ack_nomineeNRIC);
  fillTextField(form, "ackNominee_address", data.ack_nomineeAddress);
  fillTextField(form, "ackNominee_applicantName", data.ack_applicantName);
  fillTextField(form, "ackNominee_applicantIc", data.ack_applicantNRIC);
  if (data.isJointApplicant) {
    fillTextField(
      form,
      "ackNominee_jApplicantName",
      data.ack_jointApplicantName,
    );
  }
  fillTextField(
    form,
    "ackNominee_applicantAddress",
    data.ack_applicantAddress,
  );

  // Application date as combined string
  if (
    data.ack_applicationDay &&
    data.ack_applicationMonth &&
    data.ack_applicationYear
  ) {
    fillTextField(
      form,
      "ackNominee_applicationDate",
      `${data.ack_applicationDay}/${data.ack_applicationMonth}/${data.ack_applicationYear}`,
    );
  }
  fillTextField(form, "ackNominee_date_dd", data.ack_applicationDay);
  fillTextField(form, "ackNominee_date_mm", data.ack_applicationMonth);
  fillTextField(form, "ackNominee_date_yyyy", data.ack_applicationYear);

  // Signature fields for acknowledgement
  fillTextField(form, "ackNominee_sign_name", data.ack_nomineeName);
  fillTextField(form, "ackNominee_sign_ic", data.ack_nomineeNRIC);

  // Embed signature images using widget positions (ORIGINAL WORKING LOGIC)
  if (
    data.applicant_signature ||
    data.jApplicant_signature ||
    data.ackNominee_signature
  ) {
    // Collect signature fields to process
    const signatureFieldsToProcess = [];
    if (data.applicant_signature)
      signatureFieldsToProcess.push("applicant_signature");
    if (data.jApplicant_signature && data.isJointApplicant)
      signatureFieldsToProcess.push("jApplicant_signature");
    if (data.ackNominee_signature)
      signatureFieldsToProcess.push("ackNominee_signature");

    // Collect field positions
    const fieldPositions = [];
    for (const fieldName of signatureFieldsToProcess) {
      try {
        const field = form.getField(fieldName);
        const widgets = field.acroField.getWidgets();
        if (widgets.length > 0) {
          const widget = widgets[0];
          const rect = widget.getRectangle();

          // Hardcode page numbers based on PDF structure
          let pageIndex = -1;
          if (
            fieldName === "applicant_signature" ||
            fieldName === "jApplicant_signature"
          ) {
            pageIndex = 3; // Page 4 (0-indexed)
          } else if (fieldName === "ackNominee_signature") {
            pageIndex = 5; // Page 6 (0-indexed)
          }

          const page = pageIndex >= 0 ? pdfDoc.getPages()[pageIndex] : null;
          fieldPositions.push({ fieldName, rect, pageIndex, page });
        }
      } catch (e) {
        console.error(`Error getting ${fieldName} position:`, e.message);
      }
    }

    // Draw signature images at widget positions
    for (const { fieldName, rect, pageIndex, page } of fieldPositions) {
      try {
        let signatureData = null;
        if (fieldName === "applicant_signature")
          signatureData = data.applicant_signature;
        else if (fieldName === "jApplicant_signature")
          signatureData = data.jApplicant_signature;
        else if (fieldName === "ackNominee_signature")
          signatureData = data.ackNominee_signature;

        if (signatureData && (pageIndex >= 0 || page)) {
          const pngImageBytes = signatureData.split(",")[1];
          const pngImage = await pdfDoc.embedPng(
            "data:image/png;base64," + pngImageBytes,
          );

          const targetPage = page || pdfDoc.getPages()[pageIndex];

          // Add small padding
          const padding = 2;
          targetPage.drawImage(pngImage, {
            x: rect.x + padding,
            y: rect.y + padding,
            width: rect.width - padding * 2,
            height: rect.height - padding * 2,
          });
        }
      } catch (e) {
        console.error(`Failed to draw ${fieldName}:`, e.message);
      }
    }

    // Hide the signature fields after drawing
    for (const fieldName of signatureFieldsToProcess) {
      try {
        const field = form.getField(fieldName);
        const widgets = field.acroField.getWidgets();
        for (const widget of widgets) {
          try {
            widget.setFlagTo(1, false); // Invisible flag
            widget.setFlagTo(2, true); // Hidden flag
          } catch (e) {
            // If flags don't work, just continue
          }
        }
      } catch (e) {
        // Field doesn't exist, skip
      }
    }
  }

  // Don't flatten - it causes issues with some PDFs
  // form.flatten()
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
};
