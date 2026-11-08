/* Bond Energy Workbench — built-in problems (all gas phase). Formulas must be in the molecule library. */
var BEW_PROBLEMS = [
  // Level 1: diatomic molecules
  { id: 'B1-01', level: 1, reaction: 'H2 + Cl2 -> 2HCl' },
  { id: 'B1-02', level: 1, reaction: 'H2 + F2 -> 2HF' },
  { id: 'B1-03', level: 1, reaction: 'H2 + Br2 -> 2HBr' },
  { id: 'B1-04', level: 1, reaction: '2H2 + O2 -> 2H2O' },
  { id: 'B1-05', level: 1, reaction: 'N2 + 3H2 -> 2NH3', text: 'Use average bond energies to estimate ΔH for the Haber process (gas phase).' },
  // Level 2: small organic reactions
  { id: 'B2-01', level: 2, reaction: 'C2H4 + H2 -> C2H6', text: 'Use average bond energies to estimate ΔH for the hydrogenation of ethylene.' },
  { id: 'B2-02', level: 2, reaction: 'C2H2 + 2H2 -> C2H6' },
  { id: 'B2-03', level: 2, reaction: 'CH4 + Cl2 -> CH3Cl + HCl' },
  { id: 'B2-04', level: 2, reaction: 'C2H4 + HCl -> C2H5Cl' },
  { id: 'B2-05', level: 2, reaction: 'CH4 + 4Cl2 -> CCl4 + 4HCl' },
  { id: 'B2-06', level: 2, reaction: 'CO + 2H2 -> CH3OH', text: 'Use average bond energies to estimate ΔH for making methanol from CO and H₂ (gas phase).' },
  // Level 3: combustion
  { id: 'B3-01', level: 3, reaction: 'CH4 + 2O2 -> CO2 + 2H2O' },
  { id: 'B3-02', level: 3, reaction: 'C3H8 + 5O2 -> 3CO2 + 4H2O' },
  { id: 'B3-03', level: 3, reaction: '2C2H6 + 7O2 -> 4CO2 + 6H2O' },
  { id: 'B3-04', level: 3, reaction: '2CH3OH + 3O2 -> 2CO2 + 4H2O' },
  { id: 'B3-05', level: 3, reaction: 'C2H5OH + 3O2 -> 2CO2 + 3H2O' },
  { id: 'B3-06', level: 3, reaction: '2C8H18 + 25O2 -> 16CO2 + 18H2O', text: 'Use average bond energies to estimate ΔH for the combustion of octane (slide 15). Then divide by 2 to compare with the slide’s value per mole of octane.' },
  { id: 'B3-07', level: 3, reaction: '2C2H2 + 5O2 -> 4CO2 + 2H2O' },
  // Level 4: multiple bonds & nitrogen
  { id: 'B4-01', level: 4, reaction: 'N2H4 + O2 -> N2 + 2H2O', text: 'Hydrazine is a rocket fuel. Use average bond energies to estimate ΔH for its reaction with oxygen (gas phase).' },
  { id: 'B4-02', level: 4, reaction: '2H2O2 -> 2H2O + O2' },
  { id: 'B4-03', level: 4, reaction: 'CH2O + O2 -> CO2 + H2O' },
  { id: 'B4-04', level: 4, reaction: 'N2 + 2H2 -> N2H4' },
  { id: 'B4-05', level: 4, reaction: '2CO + O2 -> 2CO2' },
  { id: 'B4-06', level: 4, reaction: 'CH4 + NH3 -> HCN + 3H2' }
];
if (typeof module !== 'undefined') module.exports = BEW_PROBLEMS;
