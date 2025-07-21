// Mock library data generator for LSOA

const LIBRARY_YEARS = [2017, 2018, 2019, 2020, 2021, 2022, 2023];
function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function generateMockLibrariesData() {
  // Visits per 1,000 people for each year
  return LIBRARY_YEARS.map(year => ({
    year,
    visits_per_1000: getRandomInt(200, 8000)
  }));
} 