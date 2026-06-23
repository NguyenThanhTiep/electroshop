export const convertPriceToNumber = (price) => {
  if (
    price === null ||
    price === undefined ||
    price === ""
  ) {
    return 0;
  }

  if (typeof price === "number") {
    return price;
  }

  return Number(
    String(price).replace(/\D/g, "")
  ) || 0;
};

export const formatPrice = (price) => {
  return convertPriceToNumber(price)
    .toLocaleString("vi-VN") + "đ";
};

export const parseProductOptions = (options) => {
  if (!options) {
    return [];
  }

  if (Array.isArray(options)) {
    return options;
  }

  try {
    const parsedOptions = JSON.parse(options);

    if (Array.isArray(parsedOptions)) {
      return parsedOptions;
    }

    return [];
  } catch (error) {
    return [];
  }
};

export const createDefaultSelectedOptions = (optionGroups) => {
  const selectedOptions = {};

  optionGroups.forEach((group) => {
    if (
      group.values &&
      group.values.length > 0
    ) {
      selectedOptions[group.groupName] =
        group.values[0];
    }
  });

  return selectedOptions;
};

export const calculateFinalPriceLikeCellphoneS = (
  basePrice,
  selectedOptions
) => {
  const productBasePrice =
    convertPriceToNumber(basePrice);

  const selectedPrices =
    Object.values(selectedOptions || {})
      .map((option) => {
        return convertPriceToNumber(option?.price);
      })
      .filter((price) => price > 0);

  if (selectedPrices.length === 0) {
    return productBasePrice;
  }

  return Math.max(
    productBasePrice,
    ...selectedPrices
  );
};