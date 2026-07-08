// Shared list of Malaysian banks used by the bank-selection dropdowns
export const MALAYSIAN_BANKS = [
  "Maybank",
  "CIMB Bank",
  "Public Bank",
  "RHB Bank",
  "Hong Leong Bank",
  "AmBank",
  "Bank Islam",
  "Bank Rakyat",
  "Affin Bank",
  "Alliance Bank",
  "OCBC Bank",
  "Standard Chartered",
  "HSBC Bank",
  "Other",
]

// Finds a listed bank (excluding "Other") whose name matches or is closely
// contained within the free-typed name, so users who type a bank that's
// already in the dropdown can be redirected to select it instead.
export function findMatchingListedBank(typedName) {
  const typed = (typedName || "").trim().toLowerCase()
  if (typed.length < 3) return null

  return MALAYSIAN_BANKS.find(bank => {
    if (bank === "Other") return false
    const bankLower = bank.toLowerCase()
    return bankLower === typed || bankLower.includes(typed) || typed.includes(bankLower)
  }) || null
}
