export const riskDetails: Record<string, { title: string; description: string }> = {
  a: {
    title: "Industrial Building Deduction without Land & Building",
    description: "Taxpayers who have claimed Industrial Building Deduction Allowance without land and building in their balance sheet."
  },
  b: {
    title: "Sales Variance: IT Return vs EFRIS",
    description: "Variance between sales in the IT return and EFRIS."
  },
  c: {
    title: "Sales Variance: IT Return vs WHT",
    description: "Variance between sales in the IT return and WHT."
  },
  d: {
    title: "IT Returns Missing, EFRIS Activity Present",
    description: "Taxpayers who don'\''t file IT returns but have transactions in EFRIS."
  },
  e: {
    title: "IT Returns Missing, WHT Activity Present",
    description: "Taxpayers who don'\''t file IT returns but have transactions in WHT."
  },
  f: {
    title: "IT Returns Missing, IFMIS Activity Present",
    description: "Taxpayers who don'\''t file IT returns but have transactions in IFMIS."
  },
  g: {
    title: "IT Returns Missing, Import Transactions Present",
    description: "Taxpayers who don'\''t file IT returns but have Imports transactions."
  },
  h: {
    title: "Individualsâ€”Motor Vehicle Importers vs IT Returns",
    description: "Compare high Individual motor vehicle importers with their IT returns."
  },
  i: {
    title: "Overstated Interest Expense",
    description: "Overstated interest expense greater than 30% of total loan amount."
  },
  j: {
    title: "Rental WHT Beneficiaries Not Registered IT Rental",
    description: "Taxpayers who received Rental payments in WHT Returns but are not registered for IT rental."
  },
  k: {
    title: "Rental WHT Beneficiaries Did Not File Rental Return",
    description: "Taxpayers who received Rental payments in WHT Returns did not file rental return."
  },
  l: {
    title: "Rental WHT Under-Declaration in IT Returns",
    description: "Taxpayers who received Rental payments in WHT Returns under-declared rent in their IT Rental return."
  },
  m: {
    title: "Declared Landlords Not Registered for IT Rental",
    description: "Taxpayers declared as landlords in IT Returns but are not registered for IT rental."
  },
  n: {
    title: "Declared Landlords Did Not File Rental Return",
    description: "Taxpayers declared as landlords in IT Returns did not file rental return."
  },
  o: {
    title: "Landlord Declaration or Under-Declaration",
    description: "Taxpayers declared as landlords in IT Returns or under-declared rent in their return."
  },
  p: {
    title: "Presumptive Taxpayers with High Turnover",
    description: "Presumptive taxpayers with gross turnover above 150 million."
  },
  q: {
    title: "PAYE Declared Not Remitted",
    description: "PAYE declared not remitted."
  },
  r: {
    title: "Employeesâ€”Multiple Employers PAYE Rate Comparison",
    description: "Employees with Multiple employers to compare PAYE rates."
  },
  s: {
    title: "Employee Costs Without PAYE Declaration",
    description: "Employee costs in IT without a corresponding PAYE return Declaration."
  },
};
