// Borough ID to name mapping based on the JSON file structure
export const boroughIdToName: { [key: number]: string } = {
  0: "Kingston upon Thames",
  1: "Croydon", 
  2: "Bromley",
  3: "Hounslow",
  4: "Ealing",
  5: "Havering",
  6: "Hillingdon",
  7: "Harrow",
  8: "Brent",
  9: "Barnet",
  10: "Lambeth",
  11: "Southwark",
  12: "Lewisham",
  13: "Greenwich",
  14: "Bexley",
  15: "Enfield",
  16: "Waltham Forest",
  17: "Redbridge", 
  18: "Sutton",
  19: "Richmond upon Thames",
  20: "Merton",
  21: "Wandsworth",
  22: "Hammersmith and Fulham",
  23: "Kensington and Chelsea",
  24: "Westminster",
  25: "Camden",
  26: "Tower Hamlets",
  27: "Islington",
  28: "Hackney",
  29: "Haringey",
  30: "Newham",
  31: "Barking and Dagenham",
  32: "City of London"
};

// Event handler for borough selection
export const createBoroughClickHandler = (setSelectedBorough: (borough: string) => void) => {
  return (name: string, value: any) => {
    if (value && value._vgsid_) {
      const vgsidArray = Array.from(value._vgsid_);
      if (vgsidArray.length > 0) {
        const boroughIndex = vgsidArray[0] as number;
        const boroughName = boroughIdToName[boroughIndex - 1];
        if (boroughName) {
          setSelectedBorough(boroughName);
        }
      }
    }
  };
};

// Event handler for LSOA selection
export const createLsoaClickHandler = (setSelectedLSOA: (lsoa: string) => void) => {
  return (name: string, value: any) => {
    if (value && value.datum && value.datum.properties) {
      const lsoaCode = value.datum.properties.lsoa21cd;
      const lsoaName = value.datum.properties.lsoa21nm;
      setSelectedLSOA(lsoaCode);
      console.log('Selected LSOA:', lsoaName, lsoaCode);
    }
  };
};

// Placeholder handler
export const handleAddToSidebar = (elementId: string, elementName: string, elementType: string): void => {
  throw new Error('Not implemented.');
};
