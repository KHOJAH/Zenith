export const Platform = {
  OS: 'ios',
  select: (obj) => obj.ios || obj.default,
};

export const Share = {
  share: async (options) => ({ action: 'sharedAction' }),
};

export const Alert = {
  alert: () => {},
};

export const StyleSheet = {
  create: (styles) => styles,
  hairlineWidth: 1,
};
