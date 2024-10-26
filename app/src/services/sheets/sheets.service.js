/* eslint-disable prettier/prettier */

export const saveCategoryRequest = (category, categories) => {
  return new Promise((resolve, reject) => {
    const ifNameExists = categories.filter(
      s => s.name.toLowerCase() === category.name.toLowerCase(),
    );
    if (ifNameExists && ifNameExists.length) {
      reject('Category name already exists !');
    }
    resolve('Category added successfully');
  });
};
