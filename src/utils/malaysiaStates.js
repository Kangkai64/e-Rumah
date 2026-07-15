// Pos Malaysia assigns postcodes in contiguous numeric ranges per state/
// federal territory, so a postcode's value deterministically identifies its
// state. The State field is auto-filled from this instead of being typed or
// picked, which avoids both free-text typos and a picked state that
// disagrees with the postcode.
export const MALAYSIA_STATES = [
  { name: "Johor", ranges: [[79000, 86900]] },
  { name: "Kedah", ranges: [[5000, 9810]] },
  { name: "Kelantan", ranges: [[15000, 18500]] },
  { name: "Melaka", ranges: [[75000, 78309]] },
  { name: "Negeri Sembilan", ranges: [[70000, 73509]] },
  { name: "Pahang", ranges: [[25000, 28800], [39000, 39200]] },
  { name: "Perak", ranges: [[30000, 36810]] },
  { name: "Perlis", ranges: [[1000, 2800]] },
  { name: "Pulau Pinang", ranges: [[10000, 14400]] },
  { name: "Sabah", ranges: [[88000, 91309]] },
  { name: "Sarawak", ranges: [[93000, 98859]] },
  { name: "Selangor", ranges: [[40000, 48300], [63000, 68100]] },
  { name: "Terengganu", ranges: [[20000, 24300]] },
  { name: "Kuala Lumpur", ranges: [[50000, 60000]] },
  { name: "Labuan", ranges: [[87000, 87033]] },
  { name: "Putrajaya", ranges: [[62000, 62988]] },
];

// Returns the matching state entry for a 5-digit postcode, or null if the
// postcode is malformed or falls outside every known range.
export const getStateForPostcode = (postcode) => {
  if (!/^\d{5}$/.test(postcode || "")) return null;
  const code = parseInt(postcode, 10);
  return (
    MALAYSIA_STATES.find((state) =>
      state.ranges.some(([min, max]) => code >= min && code <= max),
    ) || null
  );
};
