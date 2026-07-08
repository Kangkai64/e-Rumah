// Application Controller - Smart React Component
// Entry point for users - manages all state and business logic
// Renders ApplicationFormView (pure presentational component)
// NO imports from other controllers allowed!

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { PDFDocument, PDFName, PDFDict, PDFRawStream } from "pdf-lib";
import Application from "../models/Application";
import { validateStep } from "../utils/applicationValidation";
import ApplicationFormView from "../views/ApplicationFormView";
import { parseICNumber, getCurrentDate, calculateAge, isSalutationCompatibleWithSex } from "../utils/icParser";
import { getCurrentUser } from "../services/authService";
import {
  loadApplicationData,
  saveApplicationData,
  saveToLocalStorage,
  loadFromLocalStorage,
  checkDuplicateNRIC,
  checkDuplicateNomineeNRIC,
} from "../services/applicationService";
import { uploadDocument, deleteDocument } from "../services/fileUploadService";
import { supabase } from "../config/supabase";
import { useToast } from "../client_controller/common/ToastContext";

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

function ApplicationController({ editNomineeOnly = false }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { applicationId: urlApplicationId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const promoteNominee2 = queryParams.get("promote") === "true";

  const [currentStep, setCurrentStep] = useState(editNomineeOnly ? 4 : 1);
  const totalSteps = 7;
  const [errors, setErrors] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [applicationId, setApplicationId] = useState(null);
  const [flaggedCode, setFlaggedCode] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [showNomineeForm, setShowNomineeForm] = useState(true);
  const [existingNomineeData, setExistingNomineeData] = useState(null);
  const saveTimeoutRef = useRef(null);
  const isInitialized = useRef(false);
  const hasRedirected = useRef(false);

  // Initialize form data - will be loaded from Supabase
  const [formData, setFormData] = useState({
    // How do you know about SSB
    howDidYouKnow: "",
    isJointApplicant: false,
    preferredScheme: "",

    // Applicant Information
    salutation: "",
    nameAsPerNRIC: "",
    nricNo: "",
    address: "",
    postcode: "",
    email: "",
    residencePhone: "",
    telephone: "",
    dobDay: "",
    dobMonth: "",
    dobYear: "",
    race: "",
    malaysian: false,
    sex: "",
    maritalStatus: "",
    numOfDependents: "0",
    dependentAge1: "",
    dependentAge2: "",
    dependentAge3: "",
    dependentAge4: "",
    dependentAge5: "",
    presentHouse: "",
    occupation: "",
    employerName: "",
    employerAddress: "",
    employerPostcode: "",
    purposeOfApplication: "",
    payoutOption: "",
    lumpSumUsage: "",
    paymentOption: "",

    // Joint Applicant
    jSalutation: "",
    jName: "",
    jIc: "",
    jAddress: "",
    jPostcode: "",
    jEmail: "",
    jResidencePhone: "",
    jTelephone: "",
    jDobDay: "",
    jDobMonth: "",
    jDobYear: "",
    jMarital: "",
    jRace: "",
    jMalaysian: false,
    jSex: "",
    jRelationship: "",
    jOccupation: "",
    jEmployerName: "",
    jEmployerAddress: "",
    jEmployerPostcode: "",

    // Banking
    bankName: "",
    otherBankName: "",
    accountType: "",
    accountPreference: "",
    accountNumber: "",

    // Property
    propertyType: "",
    propertyAddress: "",
    propertySchemeName: "",
    propertyDistrict: "",
    propertyMukim: "",
    propertyPostcode: "",
    indicativeMarketValue: "",
    valuationDay: "",
    valuationMonth: "",
    valuationYear: "",
    expectedMarketValue: "",
    purchasePrice: "",
    purchaseDay: "",
    purchaseMonth: "",
    purchaseYear: "",
    tenureTitle: "",
    expiryDay: "",
    expiryMonth: "",
    expiryYear: "",
    buildUpArea: "",
    landArea: "",
    propertyEncumbered: "",
    propertyBankName: "",
    estOutstandingBalance: "",
    fireInsurance: "",
    insuranceCompany: "",
    periodValidity: "",
    fireInsuranceNotAvailable: "",
    renewalFireInsurance: "",

    // Nominees
    hasSecondNominee: false,
    nominee1Salutation: "",
    nominee1Name: "",
    nominee1Ic: "",
    nominee1Address: "",
    nominee1Postcode: "",
    nominee1Email: "",
    nominee1ResidencePhone: "",
    nominee1Telephone: "",
    nominee1DobDay: "",
    nominee1DobMonth: "",
    nominee1DobYear: "",
    nominee1Sex: "",
    nominee1Race: "",
    nominee1Malaysian: false,
    nominee1Marital: "",
    nominee1Relationship: "",
    nominee1Occupation: "",
    nominee1EmployerName: "",

    nominee2Salutation: "",
    nominee2Name: "",
    nominee2Ic: "",
    nominee2Address: "",
    nominee2Postcode: "",
    nominee2Email: "",
    nominee2ResidencePhone: "",
    nominee2Telephone: "",
    nominee2DobDay: "",
    nominee2DobMonth: "",
    nominee2DobYear: "",
    nominee2Sex: "",
    nominee2Race: "",
    nominee2Malaysian: false,
    nominee2Marital: "",
    nominee2Relationship: "",
    nominee2Occupation: "",
    nominee2EmployerName: "",

    // Acknowledgement
    ack_nomineeName: "",
    ack_nomineeNRIC: "",
    ack_nomineeAddress: "",
    ack_applicantName: "",
    ack_applicantNRIC: "",
    ack_jointApplicantName: "",
    ack_jointApplicantNRIC: "",
    ack_applicantAddress: "",
    ack_applicationDay: "",
    ack_applicationMonth: "",
    ack_applicationYear: "",
    ack_dateDay: "",
    ack_dateMonth: "",
    ack_dateYear: "",
    ack_signName: "",
    ack_signIC: "",
    ackNominee_signature: "",

    // Signatures
    applicant_signature: "",
    applicant_signature_name: "",
    applicant_signature_date: "",
    jApplicant_signature: "",
    jApplicant_signature_name: "",
    jApplicant_signature_date: "",

    // Privacy & Documents
    privacyConsent: false,
    acknowledgeDeclaration: false,

    // Supporting Documents (URLs stored after upload)
    documents: {
      applicantNRIC: { url: "", fileName: "", uploadedAt: "" },
      jointApplicantNRIC: { url: "", fileName: "", uploadedAt: "" },
      birthCertificate: { url: "", fileName: "", uploadedAt: "" },
      marriageCertificate: { url: "", fileName: "", uploadedAt: "" },
      payslips: [
        { url: "", fileName: "", uploadedAt: "" },
        { url: "", fileName: "", uploadedAt: "" },
        { url: "", fileName: "", uploadedAt: "" },
      ],
      bankStatements: [
        { url: "", fileName: "", uploadedAt: "" },
        { url: "", fileName: "", uploadedAt: "" },
        { url: "", fileName: "", uploadedAt: "" },
        { url: "", fileName: "", uploadedAt: "" },
        { url: "", fileName: "", uploadedAt: "" },
        { url: "", fileName: "", uploadedAt: "" },
      ],
      epfStatement: { url: "", fileName: "", uploadedAt: "" },
      grantTitle: { url: "", fileName: "", uploadedAt: "" },
      saleAgreement: { url: "", fileName: "", uploadedAt: "" },
      valuationReport: { url: "", fileName: "", uploadedAt: "" },
      fireInsurance: { url: "", fileName: "", uploadedAt: "" },
      propertyLoanStatement: { url: "", fileName: "", uploadedAt: "" },
    },
  });

  // ==========================================
  // INITIAL LOAD: Get user and load application data
  // ==========================================
  useEffect(() => {
    const initializeApplication = async () => {
      // Prevent double-initialization in React Strict Mode
      if (isInitialized.current) {
        return;
      }
      isInitialized.current = true;

      try {
        setIsLoading(true);

        // Get current authenticated user
        const { user, error: userError } = await getCurrentUser();

        if (userError || !user) {
          // No user logged in - redirect to login
          console.warn("No user authenticated, redirecting to login");
          // For now, use localStorage as fallback (until auth pages are ready)
          const localData = loadFromLocalStorage("guest");
          setFormData((prev) => ({ ...prev, ...localData.formData }));
          setCurrentStep(localData.currentStep);
          setIsLoading(false);
          return;
        }

        setCurrentUser(user);
        console.log("👤 User authenticated:", user.id);

        // Fetch user profile data for auto-complete
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("full_name, email, ic_number, phone")
          .eq("id", user.id)
          .single();

        const applyProfileDefaults = (data) => {
          if (!userProfile || profileError) {
            return data;
          }

          return {
            ...data,
            nameAsPerNRIC: data.nameAsPerNRIC || userProfile.full_name || "",
            email: data.email || userProfile.email || "",
            nricNo: data.nricNo || userProfile.ic_number || "",
            telephone: data.telephone || userProfile.phone || "",
          };
        };

        // Get or create application (includes draft applications)
        const { getOrCreateApplication } =
          await import("../services/applicationService");
        const { application, applicationData, error } =
          await getOrCreateApplication(user.id);

        if (error) {
          console.error("❌ Error loading from Supabase:", error);
          // Fallback to localStorage
          const localData = loadFromLocalStorage(user.id);
          setFormData((prev) =>
            applyProfileDefaults({ ...prev, ...localData.formData }),
          );
          setCurrentStep(localData.currentStep);
          console.log("📂 Using localStorage fallback");
        } else {
          // Successfully loaded or created application
          setApplicationId(application?.id);
          setFlaggedCode(application?.flagged_code || null);
          setApplicationStatus(application?.status || null);

          // Nominee editing after approval is only allowed when support has
          // flagged a nominee as inactive (replacement flow)
          if (
            editNomineeOnly &&
            (application?.status === "approved" ||
              application?.status === "terminated") &&
            ![
              "nominee1_inactive",
              "nominee2_inactive",
              "both_nominees_inactive",
            ].includes(application?.flagged_code)
          ) {
            showToast(
              "Nominee details can no longer be edited after the application has been approved.",
              "warning",
            );
            navigate("/user/application", { replace: true });
            return;
          }

          if (
            applicationData?.form_data &&
            Object.keys(applicationData.form_data).length > 0
          ) {
            // Has existing data - load it
            let loadedData = { ...applicationData.form_data };

            // Store original data BEFORE any modifications for edit nominee mode
            if (editNomineeOnly) {
              setExistingNomineeData(loadedData);
            }

            // If promoting nominee 2 to nominee 1
            if (promoteNominee2 && loadedData.nominee2Name) {
              loadedData = {
                ...loadedData,
                // Copy nominee 2 to nominee 1
                nominee1Salutation: loadedData.nominee2Salutation || "",
                nominee1Name: loadedData.nominee2Name,
                nominee1Ic: loadedData.nominee2Ic,
                nominee1DobDay: loadedData.nominee2DobDay,
                nominee1DobMonth: loadedData.nominee2DobMonth,
                nominee1DobYear: loadedData.nominee2DobYear,
                nominee1Sex: loadedData.nominee2Sex,
                nominee1Race: loadedData.nominee2Race,
                nominee1Malaysian: loadedData.nominee2Malaysian,
                nominee1Marital: loadedData.nominee2Marital,
                nominee1Relationship: loadedData.nominee2Relationship,
                nominee1Address: loadedData.nominee2Address,
                nominee1Postcode: loadedData.nominee2Postcode,
                nominee1Email: loadedData.nominee2Email,
                nominee1Telephone: loadedData.nominee2Telephone,
                nominee1ResidencePhone: loadedData.nominee2ResidencePhone,
                nominee1Occupation: loadedData.nominee2Occupation,
                nominee1EmployerName: loadedData.nominee2EmployerName || "",
                // Note: nominee 2 signature NOT available, user must provide new one
                // Clear nominee 2
                nominee2Salutation: "",
                nominee2Name: "",
                nominee2Ic: "",
                nominee2DobDay: "",
                nominee2DobMonth: "",
                nominee2DobYear: "",
                nominee2Sex: "",
                nominee2Race: "",
                nominee2Malaysian: false,
                nominee2Marital: "",
                nominee2Relationship: "",
                nominee2Address: "",
                nominee2Postcode: "",
                nominee2Email: "",
                nominee2Telephone: "",
                nominee2ResidencePhone: "",
                nominee2Occupation: "",
                nominee2EmployerName: "",
                hasSecondNominee: false,
                // Clear old nominee 1 signature - user must re-sign
                ackNominee_signature: "",
              };
              console.log("✅ Promoting nominee 2 to nominee 1");
            }

            setFormData((prev) =>
              applyProfileDefaults({ ...prev, ...loadedData }),
            );

            // Don't override currentStep in editNomineeOnly mode - keep it at 4
            if (!editNomineeOnly) {
              setCurrentStep(applicationData.current_step || 1);
            }

            // If in edit nominee mode, just load the data as-is without blanking
            if (editNomineeOnly) {
              setShowNomineeForm(false);
            }
            console.log(
              "✅ Loaded from Supabase - App ID:",
              application?.id,
              "Step:",
              applicationData.current_step,
              "Fields:",
              Object.keys(loadedData).length,
            );
          } else {
            // New application - auto-populate with user profile data
            if (!profileError && userProfile) {
              setFormData((prev) => applyProfileDefaults(prev));
              console.log(
                "✅ Created new application with auto-filled user data - App ID:",
                application?.id,
              );
            } else {
              console.log(
                "✅ Created new application - App ID:",
                application?.id,
              );
            }
          }
        }

        window.scrollTo(0, 0);
      } catch (error) {
        console.error("Error initializing application:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApplication();
  }, []);

  // Log applicationStatus changes for debugging
  useEffect(() => {
    console.log(
      "🔍 Application Status:",
      applicationStatus,
      "Loading:",
      isLoading,
    );
  }, [applicationStatus, isLoading]);

  // ==========================================
  // AUTO-FILL: Steps 5, 6, 7 when data is available
  // ==========================================
  useEffect(() => {
    if (isLoading) return; // Don't run during initial load

    const currentDate = getCurrentDate();
    const updates = {};

    // Step 5: Signature fields
    if (formData.nameAsPerNRIC && !formData.applicant_signature_name) {
      updates.applicant_signature_name = formData.nameAsPerNRIC;
      updates.applicant_signature_date = `${currentDate.day}/${currentDate.month}/${currentDate.year}`;
    }

    if (formData.jName && !formData.jApplicant_signature_name) {
      updates.jApplicant_signature_name = formData.jName;
      updates.jApplicant_signature_date = `${currentDate.day}/${currentDate.month}/${currentDate.year}`;
    }

    // Step 6: Acknowledgement fields
    if (formData.nominee1Name && !formData.ack_nomineeName) {
      updates.ack_nomineeName = formData.nominee1Name;
    }
    if (formData.nominee1Ic && !formData.ack_nomineeNRIC) {
      updates.ack_nomineeNRIC = formData.nominee1Ic;
    }
    if (formData.nominee1Address && !formData.ack_nomineeAddress) {
      updates.ack_nomineeAddress = formData.nominee1Address;
    }
    if (formData.nameAsPerNRIC && !formData.ack_applicantName) {
      updates.ack_applicantName = formData.nameAsPerNRIC;
      updates.ack_signName = formData.nameAsPerNRIC;
    }
    if (formData.nricNo && !formData.ack_applicantNRIC) {
      updates.ack_applicantNRIC = formData.nricNo;
      updates.ack_signIC = formData.nricNo;
    }
    if (formData.address && !formData.ack_applicantAddress) {
      updates.ack_applicantAddress = formData.address;
    }
    if (formData.jName && !formData.ack_jointApplicantName) {
      updates.ack_jointApplicantName = formData.jName;
    }
    if (formData.jIc && !formData.ack_jointApplicantNRIC) {
      updates.ack_jointApplicantNRIC = formData.jIc;
    }

    // Auto-fill dates for acknowledgement
    if (!formData.ack_dateDay) {
      updates.ack_dateDay = currentDate.day;
      updates.ack_dateMonth = currentDate.month;
      updates.ack_dateYear = currentDate.year;
      updates.ack_applicationDay = currentDate.day;
      updates.ack_applicationMonth = currentDate.month;
      updates.ack_applicationYear = currentDate.year;
    }

    // Apply updates if there are any
    if (Object.keys(updates).length > 0) {
      setFormData((prev) => ({ ...prev, ...updates }));
    }
  }, [
    formData.nameAsPerNRIC,
    formData.jName,
    formData.nominee1Name,
    formData.nominee1Ic,
    formData.nominee1Address,
    formData.nricNo,
    formData.address,
    formData.jIc,
    isLoading,
  ]);

  // ==========================================
  // AUTO-FILL: Derive birthdate/sex/citizenship from NRIC (Step 1)
  // Runs whenever nricNo is populated by any means (typing, profile
  // auto-fill, or a loaded application) since the NRIC field itself is
  // locked from editing and can no longer rely solely on its onChange
  // handler to trigger the derivation.
  // ==========================================
  useEffect(() => {
    if (isLoading || !formData.nricNo) return;

    const parsed = parseICNumber(formData.nricNo);
    if (!parsed.isValid || !parsed.birthDate) return;

    const citizenshipType =
      parsed.placeOfBirth && !parsed.placeOfBirth.isMalaysiaBorn
        ? "PR"
        : "Citizen";

    const needsUpdate =
      formData.dobDay !== parsed.birthDate.day ||
      formData.dobMonth !== parsed.birthDate.month ||
      formData.dobYear !== parsed.birthDate.year ||
      formData.sex !== parsed.sex ||
      formData.citizenshipType !== citizenshipType ||
      !formData.malaysian;

    if (needsUpdate) {
      setFormData((prev) => ({
        ...prev,
        dobDay: parsed.birthDate.day,
        dobMonth: parsed.birthDate.month,
        dobYear: parsed.birthDate.year,
        sex: parsed.sex,
        malaysian: true,
        citizenshipType,
        salutation: isSalutationCompatibleWithSex(prev.salutation, parsed.sex)
          ? prev.salutation
          : "",
      }));
    }

    const applicantAge = calculateAge(parsed.birthDate);
    setErrors((prev) => {
      const next = { ...prev };
      if (applicantAge < 55) {
        next.nricNo = "Applicant must be at least 55 years old";
      } else if (next.nricNo === "Applicant must be at least 55 years old") {
        delete next.nricNo;
      }
      if (citizenshipType === "PR") {
        next.citizenshipType =
          "Applicant must be a Malaysian citizen. Permanent Residents (PR) are not eligible for SSB.";
      } else {
        delete next.citizenshipType;
      }
      return next;
    });
  }, [formData.nricNo, isLoading]);

  // ==========================================
  // AUTO-SAVE: Debounced save to Supabase
  // ==========================================
  const debouncedSave = useCallback(
    async (data, step) => {
      if (!currentUser) {
        // No user yet - save to localStorage only
        console.log("⚠️ No user, saving to localStorage only");
        saveToLocalStorage("guest", data, step);
        return;
      }

      try {
        setIsSaving(true);

        // If no applicationId, try to get or create one
        let appId = applicationId;
        if (!appId) {
          const { application, error: appError } = await loadApplicationData(
            currentUser.id,
          );
          if (!appError && application?.id) {
            appId = application.id;
            setApplicationId(application.id);
            console.log("✅ Application ID set:", application.id);
          } else {
            console.error("❌ Failed to get application ID:", appError);
            saveToLocalStorage(currentUser.id, data, step);
            setIsSaving(false);
            return;
          }
        }

        // Save to Supabase
        console.log("💾 Saving to Supabase:", {
          appId,
          step,
          fieldCount: Object.keys(data).length,
          fields: Object.keys(data).slice(0, 5), // First 5 field names
        });

        const { error } = await saveApplicationData(appId, data, step);

        if (error) {
          console.error("❌ Error saving to Supabase:", error);
          saveToLocalStorage(currentUser.id, data, step);
        } else {
          console.log("✅ Auto-saved to Supabase (App ID:", appId, ")");
          // Also save to localStorage as backup
          saveToLocalStorage(currentUser.id, data, step);
        }
      } catch (error) {
        console.error("❌ Save error:", error);
        saveToLocalStorage(currentUser.id, data, step);
      } finally {
        setIsSaving(false);
      }
    },
    [currentUser, applicationId],
  );

  // Trigger auto-save when formData or currentStep changes
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load

    // Don't auto-save blank nominee data in editNomineeOnly mode
    if (editNomineeOnly && !formData.nominee1Name) return;

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save by 1 second
    saveTimeoutRef.current = setTimeout(() => {
      debouncedSave(formData, currentStep);
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, currentStep, debouncedSave, isLoading]);

  /**
   * Handle form field changes with auto-fill logic
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Determined here (from the `formData` closure, not `prev` inside the
    // setFormData updater) so it's available synchronously — React does not
    // guarantee the updater runs before this function returns, so mutating
    // an outer variable from inside it and reading that variable right after
    // setFormData() is unreliable.
    let salutationClearedMessage = null;
    if (value) {
      if (name === "nricNo") {
        const parsed = parseICNumber(value);
        if (
          parsed.isValid &&
          parsed.birthDate &&
          !isSalutationCompatibleWithSex(formData.salutation, parsed.sex)
        ) {
          salutationClearedMessage =
            "Your salutation has been cleared because it no longer matches the gender detected from the IC number. Please select your salutation again.";
        }
      } else if (name === "jIc") {
        const parsed = parseICNumber(value);
        if (
          parsed.isValid &&
          parsed.birthDate &&
          !isSalutationCompatibleWithSex(formData.jSalutation, parsed.sex)
        ) {
          salutationClearedMessage =
            "The joint applicant's salutation has been cleared because it no longer matches the gender detected from the IC number. Please select the salutation again.";
        }
      } else if (name === "nominee1Ic") {
        const parsed = parseICNumber(value);
        if (
          parsed.isValid &&
          parsed.birthDate &&
          !isSalutationCompatibleWithSex(formData.nominee1Salutation, parsed.sex)
        ) {
          salutationClearedMessage =
            "Nominee 1's salutation has been cleared because it no longer matches the gender detected from the IC number. Please select the salutation again.";
        }
      } else if (name === "nominee2Ic") {
        const parsed = parseICNumber(value);
        if (
          parsed.isValid &&
          parsed.birthDate &&
          !isSalutationCompatibleWithSex(formData.nominee2Salutation, parsed.sex)
        ) {
          salutationClearedMessage =
            "Nominee 2's salutation has been cleared because it no longer matches the gender detected from the IC number. Please select the salutation again.";
        }
      }
    }

    // Clear error for this field when it changes
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });

    setFormData((prev) => {
      let updates = {
        [name]: type === "checkbox" ? checked : value,
      };

      // Auto-fill: Sync accountPreference with preferredScheme
      if (name === "accountPreference") {
        updates.preferredScheme = value;
      }

      // Auto-fill: Parse IC number and fill birthdate + sex for main applicant
      if (name === "nricNo") {
        updates.dobDay = "";
        updates.dobMonth = "";
        updates.dobYear = "";
        updates.sex = "";
        updates.citizenshipType = "";

        let ageError = null;
        let citizenshipError = null;
        let icFormatError = null;

        if (value) {
          const parsed = parseICNumber(value);
          if (parsed.isValid && parsed.birthDate) {
            updates.dobDay = parsed.birthDate.day;
            updates.dobMonth = parsed.birthDate.month;
            updates.dobYear = parsed.birthDate.year;
            updates.sex = parsed.sex;

            if (!isSalutationCompatibleWithSex(prev.salutation, parsed.sex)) {
              updates.salutation = "";
            }

            // Auto-check Malaysian checkbox
            updates.malaysian = true;

            // Set Citizenship Type (Citizen vs PR)
            // If born in Malaysia (01-59) -> Citizen
            // If born outside (60-99) -> PR / Foreign Born
            if (parsed.placeOfBirth && !parsed.placeOfBirth.isMalaysiaBorn) {
              updates.citizenshipType = "PR";
              citizenshipError =
                "Applicant must be a Malaysian citizen. Permanent Residents (PR) are not eligible for SSB.";
            } else {
              updates.citizenshipType = "Citizen";
            }

            const applicantAge = calculateAge(parsed.birthDate);
            if (applicantAge < 55) {
              ageError = "Applicant must be at least 55 years old";
            }
          } else if (value.replace(/[-\s]/g, "").length === 12) {
            icFormatError =
              "Invalid IC number. Please check the digits and try again.";
          }
        }

        setErrors((prev) => {
          const next = { ...prev };
          if (ageError) {
            next.nricNo = ageError;
          } else if (icFormatError) {
            next.nricNo = icFormatError;
          } else {
            delete next.nricNo;
          }
          if (citizenshipError) {
            next.citizenshipType = citizenshipError;
          } else {
            delete next.citizenshipType;
          }
          return next;
        });
      }

      // Auto-fill: Parse IC number and fill birthdate + sex for joint applicant
      if (name === "jIc") {
        updates.jDobDay = "";
        updates.jDobMonth = "";
        updates.jDobYear = "";
        updates.jSex = "";
        updates.jCitizenshipType = "";

        let jointAgeError = null;
        let jointCitizenshipError = null;
        let jointIcFormatError = null;

        if (value) {
          const parsed = parseICNumber(value);
          if (parsed.isValid && parsed.birthDate) {
            updates.jDobDay = parsed.birthDate.day;
            updates.jDobMonth = parsed.birthDate.month;
            updates.jDobYear = parsed.birthDate.year;
            updates.jSex = parsed.sex;

            if (!isSalutationCompatibleWithSex(prev.jSalutation, parsed.sex)) {
              updates.jSalutation = "";
            }

            // Auto-check Malaysian checkbox
            updates.jMalaysian = true;

            // Set Citizenship Type
            if (parsed.placeOfBirth && !parsed.placeOfBirth.isMalaysiaBorn) {
              updates.jCitizenshipType = "PR";
              jointCitizenshipError =
                "Joint Applicant must be a Malaysian citizen. Permanent Residents (PR) are not eligible for SSB.";
            } else {
              updates.jCitizenshipType = "Citizen";
            }

            const jointApplicantAge = calculateAge(parsed.birthDate);
            if (jointApplicantAge < 55) {
              jointAgeError = "Joint Applicant must be at least 55 years old";
            }
          } else if (value.replace(/[-\s]/g, "").length === 12) {
            jointIcFormatError =
              "Invalid IC number. Please check the digits and try again.";
          }
        }

        setErrors((prev) => {
          const next = { ...prev };
          if (jointAgeError) {
            next.jIc = jointAgeError;
          } else if (jointIcFormatError) {
            next.jIc = jointIcFormatError;
          } else {
            delete next.jIc;
          }
          if (jointCitizenshipError) {
            next.jCitizenshipType = jointCitizenshipError;
          } else {
            delete next.jCitizenshipType;
          }
          return next;
        });
      }

      // Auto-fill: Parse IC number and fill birthdate + sex + citizenship for nominee 1
      if (name === "nominee1Ic") {
        updates.nominee1DobDay = "";
        updates.nominee1DobMonth = "";
        updates.nominee1DobYear = "";
        updates.nominee1Sex = "";
        updates.nominee1CitizenshipType = "";
        updates.nominee1Malaysian = false;

        let nominee1IcFormatError = null;

        if (value) {
          const parsed = parseICNumber(value);
          if (parsed.isValid && parsed.birthDate) {
            updates.nominee1DobDay = parsed.birthDate.day;
            updates.nominee1DobMonth = parsed.birthDate.month;
            updates.nominee1DobYear = parsed.birthDate.year;
            updates.nominee1Sex = parsed.sex;

            if (!isSalutationCompatibleWithSex(prev.nominee1Salutation, parsed.sex)) {
              updates.nominee1Salutation = "";
            }

            // Nominee holds a Malaysian IC, so citizenship is already verified
            updates.nominee1Malaysian = true;

            // Set Citizenship Type for Nominee 1
            if (parsed.placeOfBirth && !parsed.placeOfBirth.isMalaysiaBorn) {
              updates.nominee1CitizenshipType = "PR";
            } else {
              updates.nominee1CitizenshipType = "Citizen";
            }
          } else if (value.replace(/[-\s]/g, "").length === 12) {
            nominee1IcFormatError =
              "Invalid IC number. Please check the digits and try again.";
          }
        }

        setErrors((prev) => {
          const next = { ...prev };
          if (nominee1IcFormatError) {
            next.nominee1Ic = nominee1IcFormatError;
          } else {
            delete next.nominee1Ic;
          }
          return next;
        });
      }

      // Auto-fill: Parse IC number and fill birthdate + sex + citizenship for nominee 2
      if (name === "nominee2Ic") {
        updates.nominee2DobDay = "";
        updates.nominee2DobMonth = "";
        updates.nominee2DobYear = "";
        updates.nominee2Sex = "";
        updates.nominee2CitizenshipType = "";
        updates.nominee2Malaysian = false;

        let nominee2IcFormatError = null;

        if (value) {
          const parsed = parseICNumber(value);
          if (parsed.isValid && parsed.birthDate) {
            updates.nominee2DobDay = parsed.birthDate.day;
            updates.nominee2DobMonth = parsed.birthDate.month;
            updates.nominee2DobYear = parsed.birthDate.year;
            updates.nominee2Sex = parsed.sex;

            if (!isSalutationCompatibleWithSex(prev.nominee2Salutation, parsed.sex)) {
              updates.nominee2Salutation = "";
            }

            // Nominee holds a Malaysian IC, so citizenship is already verified
            updates.nominee2Malaysian = true;

            // Set Citizenship Type for Nominee 2
            if (parsed.placeOfBirth && !parsed.placeOfBirth.isMalaysiaBorn) {
              updates.nominee2CitizenshipType = "PR";
            } else {
              updates.nominee2CitizenshipType = "Citizen";
            }
          } else if (value.replace(/[-\s]/g, "").length === 12) {
            nominee2IcFormatError =
              "Invalid IC number. Please check the digits and try again.";
          }
        }

        setErrors((prev) => {
          const next = { ...prev };
          if (nominee2IcFormatError) {
            next.nominee2Ic = nominee2IcFormatError;
          } else {
            delete next.nominee2Ic;
          }
          return next;
        });
      }

      // Auto-fill: Signature names and dates for applicant
      if (name === "nameAsPerNRIC" && value) {
        updates.applicant_signature_name = value;
        const currentDate = getCurrentDate();
        updates.applicant_signature_date = `${currentDate.day}/${currentDate.month}/${currentDate.year}`;
      }

      // Auto-fill: Signature names and dates for joint applicant
      if (name === "jName" && value) {
        updates.jApplicant_signature_name = value;
        const currentDate = getCurrentDate();
        updates.jApplicant_signature_date = `${currentDate.day}/${currentDate.month}/${currentDate.year}`;
      }

      // Auto-fill: Acknowledgement form fields from previously entered data
      // Sync nominee information
      if (name === "nominee1Name" && value) {
        updates.ack_nomineeName = value;
      }
      if (name === "nominee1Ic" && value) {
        updates.ack_nomineeNRIC = value;
      }
      if (name === "nominee1Address" && value) {
        updates.ack_nomineeAddress = value;
      }

      // Sync applicant information
      if (name === "nameAsPerNRIC" && value) {
        updates.ack_applicantName = value;
        updates.ack_signName = value;
      }
      if (name === "nricNo" && value) {
        updates.ack_applicantNRIC = value;
        updates.ack_signIC = value;
      }
      if (name === "address" && value) {
        updates.ack_applicantAddress = value;
      }

      // Sync joint applicant information
      if (name === "jName" && value) {
        updates.ack_jointApplicantName = value;
      }
      if (name === "jIc" && value) {
        updates.ack_jointApplicantNRIC = value;
      }

      // Auto-fill current date for acknowledgement
      const currentDate = getCurrentDate();
      updates.ack_dateDay = currentDate.day;
      updates.ack_dateMonth = currentDate.month;
      updates.ack_dateYear = currentDate.year;
      updates.ack_applicationDay = currentDate.day;
      updates.ack_applicationMonth = currentDate.month;
      updates.ack_applicationYear = currentDate.year;

      return {
        ...prev,
        ...updates,
      };
    });

    if (salutationClearedMessage) {
      showToast(salutationClearedMessage, "info");
    }
  };

  /**
   * Handle file upload
   */
  const handleFileUpload = async (e, documentType, arrayIndex = null) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!currentUser) {
      showToast("Please log in to upload files", "warning");
      return;
    }

    try {
      const uploadKey =
        arrayIndex !== null ? `${documentType}_${arrayIndex}` : documentType;

      // Show uploading indicator
      setUploadProgress((prev) => ({
        ...prev,
        [uploadKey]: { uploading: true },
      }));

      // Upload file with numbered suffix for array items
      const uploadDocType =
        arrayIndex !== null
          ? `${documentType}_${arrayIndex + 1}`
          : documentType;

      const { url, fileName, uploadedAt, error } = await uploadDocument(
        file,
        currentUser.id,
        uploadDocType,
      );

      if (error) {
        showToast("Upload failed: " + error.message, "error");
        setUploadProgress((prev) => ({
          ...prev,
          [uploadKey]: { uploading: false },
        }));
        return;
      }

      // Update form data with file URL
      setFormData((prev) => {
        const newData = { ...prev };

        if (arrayIndex !== null) {
          // Handle array documents (payslips, bank statements)
          const fieldName = documentType.includes("payslip")
            ? "payslips"
            : "bankStatements";
          const newArray = [...newData.documents[fieldName]];
          newArray[arrayIndex] = { url, fileName, uploadedAt };
          newData.documents[fieldName] = newArray;
        } else {
          // Handle single documents
          newData.documents[documentType] = { url, fileName, uploadedAt };
        }

        return newData;
      });

      // Clear upload progress
      setUploadProgress((prev) => ({
        ...prev,
        [uploadKey]: { uploading: false },
      }));

      // Clear error for this field if it exists
      if (arrayIndex !== null) {
        // For array documents (payslips/bankStatements)
        const errorKey = documentType.includes("payslip")
          ? `payslip${arrayIndex + 1}`
          : `bankStatement${arrayIndex + 1}`;
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[errorKey];
          return newErrors;
        });
      } else {
        // For single documents
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[documentType];
          return newErrors;
        });
      }

      console.log("✅ File uploaded:", fileName);
    } catch (error) {
      console.error("Upload error:", error);
      showToast("Upload failed. Please try again.", "error");
      const uploadKey =
        arrayIndex !== null ? `${documentType}_${arrayIndex}` : documentType;
      setUploadProgress((prev) => ({
        ...prev,
        [uploadKey]: { uploading: false },
      }));
    }
  };

  /**
   * Handle file deletion
   */
  const handleFileDelete = async (documentType, arrayIndex = null) => {
    if (!currentUser) {
      showToast("Please log in to delete files", "warning");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      let fileUrl = "";
      const uploadKey =
        arrayIndex !== null ? `${documentType}_${arrayIndex}` : documentType;

      if (arrayIndex !== null) {
        const fieldName = documentType.includes("payslip")
          ? "payslips"
          : "bankStatements";
        fileUrl = formData.documents[fieldName][arrayIndex].url;
      } else {
        fileUrl = formData.documents[documentType].url;
      }

      if (!fileUrl) return;

      // Delete from storage
      const { success, error } = await deleteDocument(fileUrl, currentUser.id);

      if (error) {
        showToast("Delete failed: " + error.message, "error");
        return;
      }

      // Update form data
      setFormData((prev) => {
        const newData = { ...prev };

        if (arrayIndex !== null) {
          const fieldName = documentType.includes("payslip")
            ? "payslips"
            : "bankStatements";
          const newArray = [...newData.documents[fieldName]];
          newArray[arrayIndex] = { url: "", fileName: "", uploadedAt: "" };
          newData.documents[fieldName] = newArray;
        } else {
          newData.documents[documentType] = {
            url: "",
            fileName: "",
            uploadedAt: "",
          };
        }

        return newData;
      });

      // Clear upload progress to prevent "Uploading" stuck state
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[uploadKey];
        return newProgress;
      });

      console.log("✅ File deleted");
    } catch (error) {
      console.error("Delete error:", error);
      showToast("Failed to delete file. Please try again.", "error");
    }
  };

  // ==========================================
  // NOMINEE FORM HANDLERS
  // ==========================================
  const handlePopulateNomineeForm = () => {
    if (existingNomineeData) {
      setFormData((prev) => ({ ...prev, ...existingNomineeData }));
      setShowNomineeForm(true);
    }
  };

  const handleBackToMaintainApplication = () => {
    // Restore existing nominee data before navigating back
    if (existingNomineeData) {
      setFormData((prev) => ({
        ...prev,
        nominee1Salutation: existingNomineeData.nominee1Salutation || "",
        nominee1Name: existingNomineeData.nominee1Name || "",
        nominee1Ic: existingNomineeData.nominee1Ic || "",
        nominee1DobDay: existingNomineeData.nominee1DobDay || "",
        nominee1DobMonth: existingNomineeData.nominee1DobMonth || "",
        nominee1DobYear: existingNomineeData.nominee1DobYear || "",
        nominee1Sex: existingNomineeData.nominee1Sex || "",
        nominee1Race: existingNomineeData.nominee1Race || "",
        nominee1Malaysian: existingNomineeData.nominee1Malaysian || false,
        nominee1Marital: existingNomineeData.nominee1Marital || "",
        nominee1Relationship: existingNomineeData.nominee1Relationship || "",
        nominee1Address: existingNomineeData.nominee1Address || "",
        nominee1Postcode: existingNomineeData.nominee1Postcode || "",
        nominee1Email: existingNomineeData.nominee1Email || "",
        nominee1Telephone: existingNomineeData.nominee1Telephone || "",
        nominee1ResidencePhone:
          existingNomineeData.nominee1ResidencePhone || "",
        nominee1Occupation: existingNomineeData.nominee1Occupation || "",
        nominee1EmployerName: existingNomineeData.nominee1EmployerName || "",
        nominee2Salutation: existingNomineeData.nominee2Salutation || "",
        nominee2Name: existingNomineeData.nominee2Name || "",
        nominee2Ic: existingNomineeData.nominee2Ic || "",
        nominee2DobDay: existingNomineeData.nominee2DobDay || "",
        nominee2DobMonth: existingNomineeData.nominee2DobMonth || "",
        nominee2DobYear: existingNomineeData.nominee2DobYear || "",
        nominee2Sex: existingNomineeData.nominee2Sex || "",
        nominee2Race: existingNomineeData.nominee2Race || "",
        nominee2Malaysian: existingNomineeData.nominee2Malaysian || false,
        nominee2Marital: existingNomineeData.nominee2Marital || "",
        nominee2Relationship: existingNomineeData.nominee2Relationship || "",
        nominee2Address: existingNomineeData.nominee2Address || "",
        nominee2Postcode: existingNomineeData.nominee2Postcode || "",
        nominee2Email: existingNomineeData.nominee2Email || "",
        nominee2Telephone: existingNomineeData.nominee2Telephone || "",
        nominee2ResidencePhone:
          existingNomineeData.nominee2ResidencePhone || "",
        nominee2Occupation: existingNomineeData.nominee2Occupation || "",
        nominee2EmployerName: existingNomineeData.nominee2EmployerName || "",
        ackNominee_signature: existingNomineeData.ackNominee_signature || "",
        ackNominee_signature_name:
          existingNomineeData.ackNominee_signature_name || "",
        ackNominee_signature_date:
          existingNomineeData.ackNominee_signature_date || "",
      }));
    }
    // Navigate after a small delay to ensure state update completes
    setTimeout(() => {
      navigate("/user/application");
    }, 100);
  };

  /**
   * Validate and move to next step
   */
  const handleNext = async () => {
    // For editNomineeOnly mode, validate nominee form before saving
    if (editNomineeOnly && currentStep === 4) {
      // Post-approval nominee edits are only allowed for the inactive-nominee
      // replacement flow (mirrors the guard applied on load)
      if (
        (applicationStatus === "approved" ||
          applicationStatus === "terminated") &&
        ![
          "nominee1_inactive",
          "nominee2_inactive",
          "both_nominees_inactive",
        ].includes(flaggedCode)
      ) {
        showToast(
          "Nominee details can no longer be edited after the application has been approved.",
          "warning",
        );
        return;
      }

      // Validate nominee form
      const stepErrors = validateStep(4, formData);

      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        // Scroll to first error
        window.scrollTo(0, 0);
        return;
      }

      try {
        // In editNomineeOnly mode, force update acknowledgement fields with new nominee data
        const updatedFormData = {
          ...formData,
          // Update acknowledgement fields to match new nominee 1
          ack_nomineeName: formData.nominee1Name,
          ack_nomineeNRIC: formData.nominee1Ic,
          ack_nomineeAddress: formData.nominee1Address,
          // Clear the old nominee signature - new nominee must re-sign
          ackNominee_signature: formData.ackNominee_signature || "",
        };

        // Update local state with these changes
        setFormData(updatedFormData);

        // Save the form data first
        if (currentUser && applicationId) {
          console.log("💾 Saving nominee updates...", {
            applicationId,
            currentStep,
          });
          console.log("📋 Nominee data to save:", {
            nominee1Name: updatedFormData.nominee1Name,
            nominee1Ic: updatedFormData.nominee1Ic,
            nominee1Address: updatedFormData.nominee1Address,
            ack_nomineeName: updatedFormData.ack_nomineeName,
            ack_nomineeNRIC: updatedFormData.ack_nomineeNRIC,
            ack_nomineeAddress: updatedFormData.ack_nomineeAddress,
          });
          const { data: savedData, error } = await saveApplicationData(
            applicationId,
            updatedFormData,
            currentStep,
          );
          console.log("📦 Save result:", { savedData, error });
          if (error) {
            console.error("❌ Error saving nominee data:", error);
            showToast("Error saving nominee data. Please try again.", "error");
            return;
          }
          console.log("✅ Nominee data saved to Supabase");
        } else {
          console.error("❌ Missing currentUser or applicationId:", {
            currentUser: !!currentUser,
            applicationId,
          });
          showToast(
            "Error: Missing user or application data. Please refresh and try again.",
            "error",
          );
          return;
        }

        // Clear flagged status when nominee is updated
        if (applicationId) {
          console.log(
            "🧹 Clearing flagged status for application:",
            applicationId,
          );
          const result = await Application.clearFlaggedStatus(applicationId);
          if (!result.success) {
            console.error("Error clearing flagged status:", result.error);
          } else {
            console.log("✅ Cleared flagged status for application");
          }
        }

        // Regenerate and upload updated PDF with new nominee data and signature
        if (currentUser) {
          try {
            console.log("📄 Regenerating PDF with updated nominee data...");
            console.log("📋 Full nominee data for PDF:", {
              nominee1Name: updatedFormData.nominee1Name,
              nominee1Ic: updatedFormData.nominee1Ic,
              nominee1Salutation: updatedFormData.nominee1Salutation,
              nominee1Address: updatedFormData.nominee1Address,
              nominee1Postcode: updatedFormData.nominee1Postcode,
              nominee1Email: updatedFormData.nominee1Email,
              nominee1Telephone: updatedFormData.nominee1Telephone,
              nominee1DobDay: updatedFormData.nominee1DobDay,
              nominee1DobMonth: updatedFormData.nominee1DobMonth,
              nominee1DobYear: updatedFormData.nominee1DobYear,
              nominee1Sex: updatedFormData.nominee1Sex,
              nominee1Race: updatedFormData.nominee1Race,
              ack_nomineeName: updatedFormData.ack_nomineeName,
              ack_nomineeNRIC: updatedFormData.ack_nomineeNRIC,
              ack_nomineeAddress: updatedFormData.ack_nomineeAddress,
              ackNominee_signature: !!updatedFormData.ackNominee_signature,
            });
            // Use the updatedFormData which includes all updated nominee 1 data and acknowledgement fields
            const pdfBlob = await generatePDF(updatedFormData);

            console.log("☁️ Uploading updated PDF to storage...");
            const fileName = `SSB_Application_${updatedFormData.nricNo?.replace(/[^0-9]/g, "")}.pdf`;
            const filePath = `${currentUser.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from("application-forms")
              .upload(filePath, pdfBlob, {
                contentType: "application/pdf",
                cacheControl: "3600",
                upsert: true,
              });

            if (uploadError) {
              console.error("⚠️ PDF upload failed:", uploadError);
              // Don't block the flow if PDF upload fails
            } else {
              console.log("✅ Updated PDF uploaded to storage");
            }
          } catch (pdfError) {
            console.error("⚠️ PDF generation/upload failed:", pdfError);
            console.error("pdfError details:", pdfError);
            // Don't block the flow if PDF generation fails
          }
        }

        // Redirect back to user application page
        console.log("Redirecting to user application page...");
        navigate("/user/application");
      } catch (error) {
        console.error("Error during nominee update completion:", error);
        showToast("Error updating nominee. Please try again.", "error");
      }
      return;
    }

    // Normal validation for other steps
    const stepErrors = validateStep(currentStep, formData);

    // Check for duplicate NRICs (Step 1 only)
    if (currentStep === 1 && Object.keys(stepErrors).length === 0) {
      if (formData.nricNo) {
        // We await here, so handleNext must be async (it already is)
        // Pass currentUser.id to exclude own record
        const { exists } = await checkDuplicateNRIC(
          formData.nricNo,
          currentUser?.id,
        );
        if (exists) {
          stepErrors.nricNo =
            "This NRIC is already registered to another user account.";
        }
      }
    }

    // Check for duplicate Joint Applicant NRIC (Step 2 only)
    if (currentStep === 2 && Object.keys(stepErrors).length === 0) {
      if (formData.isJointApplicant && formData.jIc) {
        // For joint applicant, we check against ALL users (do not exclude current user)
        const { exists } = await checkDuplicateNRIC(formData.jIc, null);
        if (exists) {
          stepErrors.jIc =
            "This NRIC is already registered to another user account.";
        }
      }
    }

    // Check for duplicate Nominee NRICs (Step 4 only)
    if (currentStep === 4 && Object.keys(stepErrors).length === 0) {
      if (formData.nominee1Ic) {
        // Exclude current application ID to allow editing existing nominees in this application
        const { exists } = await checkDuplicateNomineeNRIC(
          formData.nominee1Ic,
          applicationId,
        );
        if (exists) {
          stepErrors.nominee1Ic =
            "This NRIC is already used as a nominee in another application.";
        }
      }

      if (formData.nominee2Ic) {
        const { exists } = await checkDuplicateNomineeNRIC(
          formData.nominee2Ic,
          applicationId,
        );
        if (exists) {
          stepErrors.nominee2Ic =
            "This NRIC is already used as a nominee in another application.";
        }
      }
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      // ... same scroll logic ...
      // After setting errors, scroll to the first error field smoothly.
      setTimeout(() => {
        try {
          const firstKey = Object.keys(stepErrors)[0];
          // Try to find an element by name matching the error key
          let el = document.querySelector(`[name="${firstKey}"]`);

          // If not found, find the first element with the error class within the form
          if (!el) {
            el =
              document.querySelector(".app-container .error") ||
              document.querySelector(".application-form .error") ||
              document.querySelector(".error");
          }

          // If still not found, fall back to error summary (top of form)
          if (!el) {
            el = document.querySelector(".error-summary");
          }

          if (el && typeof el.scrollIntoView === "function") {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            // Focus the element where appropriate
            try {
              el.focus && el.focus();
            } catch (e) {
              /* ignore */
            }
          } else {
            window.scrollTo(0, 0);
          }
        } catch (e) {
          window.scrollTo(0, 0);
        }
      }, 60);
      return;
    }

    setErrors({});

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  /**
   * Move to previous step
   */
  const handleBack = () => {
    if (currentStep > 1) {
      setErrors({}); // Clear errors when going back to avoid confusion
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  /**
   * Generate and download PDF
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      console.log("📋 Starting application submission...");

      // 1. Submit to database (create nominees and property records)
      if (currentUser && applicationId) {
        const { submitApplicationComplete } =
          await import("../services/applicationService");
        const { success, error } = await submitApplicationComplete(
          applicationId,
          formData,
        );

        if (error) {
          console.error("❌ Database submission failed:", error);
          showToast("Failed to submit application to database: " + error.message, "error");
          setIsSubmitting(false);
          return;
        }

        console.log("✅ Application submitted to database");
      }

      // 2. Generate PDF
      console.log("📄 Generating PDF...");
      const pdfBlob = await generatePDF(formData);

      // 3. Upload PDF to Supabase Storage
      console.log("☁️ Uploading PDF to storage...");
      const fileName = `SSB_Application_${formData.nricNo?.replace(/[^0-9]/g, "")}.pdf`;
      const filePath = `${currentUser.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("application-forms")
        .upload(filePath, pdfBlob, {
          contentType: "application/pdf",
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("❌ PDF upload failed:", uploadError);
        showToast(
          "PDF was generated but failed to upload to storage. Downloading locally...",
          "warning",
        );
        downloadPDF(pdfBlob);
      } else {
        console.log("✅ PDF uploaded to storage");

        // Download PDF for user
        downloadPDF(pdfBlob);
      }

      showToast(
        "Application submitted successfully! Redirecting to your dashboard...",
        "success",
      );

      // 4. Navigate to user dashboard
      // Reload the page to refresh auth context and application status
      window.location.href = "/user/dashboard";
    } catch (error) {
      console.error("Error during submission:", error);
      showToast("Error submitting application. Please try again.", "error");
      setIsSubmitting(false);
    }
  };

  /**
   * Helper to fill text fields safely
   */
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

  /**
   * Helper to fill checkboxes safely
   */
  const fillCheckBox = (form, fieldName, checked) => {
    try {
      const field = form.getCheckBox(fieldName);
      if (checked) field.check();
      else field.uncheck();
    } catch (e) {
      // Field doesn't exist, skip
    }
  };

  /**
   * Download PDF blob
   */
  const downloadPDF = (blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "SSB_Application.pdf";
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Generate PDF from form data
   */
  const generatePDF = async (data) => {
    const existingPdfBytes = await fetch("/Application_Form.pdf").then((res) =>
      res.arrayBuffer(),
    );
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();
    applyUnderlineAppearanceForDotFields(pdfDoc, form);

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
    console.log("Property Type value:", data.propertyType);
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
    console.log("Signature data check:", {
      applicant: !!data.applicant_signature,
      jApplicant: !!data.jApplicant_signature,
      ack: !!data.ackNominee_signature,
    });

    if (
      data.applicant_signature ||
      data.jApplicant_signature ||
      data.ackNominee_signature
    ) {
      console.log("📝 Embedding signature images...");

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
            console.log(`✓ Embedded ${fieldName} signature`);
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

  // Render the View component with all props
  return (
    <ApplicationFormView
      currentStep={currentStep}
      totalSteps={totalSteps}
      formData={formData}
      errors={errors}
      handleChange={handleChange}
      handleNext={handleNext}
      handleBack={handleBack}
      handleSubmit={handleSubmit}
      handleFileUpload={handleFileUpload}
      handleFileDelete={handleFileDelete}
      uploadProgress={uploadProgress}
      isLoading={isLoading}
      isSaving={isSaving}
      isSubmitting={isSubmitting}
      editNomineeOnly={editNomineeOnly}
      promoteNominee2={promoteNominee2}
      nomineeCount={formData.nominee1Name ? (formData.nominee2Name ? 2 : 1) : 0}
      showNomineeForm={showNomineeForm}
      handlePopulateNomineeForm={handlePopulateNomineeForm}
      handleBackToMaintainApplication={handleBackToMaintainApplication}
      flaggedCode={flaggedCode}
    />
  );
}

export default ApplicationController;
