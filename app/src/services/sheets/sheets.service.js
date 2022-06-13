export const sheetsRequest = () => {};

export const saveSheetRequest = (sheet, sheets) => {
  return new Promise((resolve, reject) => {
    const ifNameExists = sheets.filter(
      (s) => s.name.toLowerCase() === sheet.name.toLowerCase()
    );

    if (ifNameExists && ifNameExists.length) {
      reject("Sheet name already exists !");
    }
    resolve("Sheet added successfully");
    r;
  });
};

export const saveCategoryRequest = (category, categories) => {
  return new Promise((resolve, reject) => {
    const ifNameExists = categories.filter(
      (s) => s.name.toLowerCase() === category.name.toLowerCase()
    );
    if (ifNameExists && ifNameExists.length) {
      reject("Category name already exists !");
    }
    resolve("Category added successfully");
  });
};
