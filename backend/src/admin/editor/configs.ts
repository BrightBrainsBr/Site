// # Colors
export const COLORS = [
  { color: '#000000', label: 'Black' },
  { color: '#FFFFFF', label: 'White' },
  { color: '#295991', label: 'Blue Medium' },
  { color: '#255185', label: 'Blue Light' },
  { color: '#224A78', label: 'Blue Dark' },
  { color: '#747480', label: 'Gray Darkness' },
  { color: '#9E9EAE', label: 'Gray Dark' },
  { color: '#CFCFD6', label: 'Gray Medium' },
  { color: '#EEEEF6', label: 'Gray Light' },
]

// # Font Family
export const FONT_FAMILY = [
  {
    title: 'deafult',
    className: 'font-galano', // Tailwind ClassName
  },
  {
    title: 'roboto',
    className: 'font-roboto', // Tailwind ClassName
  },
]

// Font Sizes
export const FONT_SIZE = [
  {
    title: 'Base',
    className: 'text-base', // Tailwind ClassName
  },
  {
    title: '12',
    className: 'text-xs', // Tailwind ClassName
  },
  {
    title: '14',
    className: 'text-sm', // Tailwind ClassName
  },
  {
    title: '18',
    className: 'text-lg', // Tailwind ClassName
  },
  {
    title: '20',
    className: 'text-xl', // Tailwind ClassName
  },
]

export const STYLES = `
  .ck .text-base {
    font-size: 16px;
    line-height: 1.333;
  }
  .ck .text-xs {
    font-size: 12px;
    line-height: 1.333;
  }
  .ck .text-sm {
    font-size: 14px;
    line-height: 1.333;
  }
  .ck .text-lg {
    font-size: 18px;
    line-height: 1.333;
  }
  .ck .text-xl {
    font-size: 20px;
    line-height: 1.333;
  }
`

// Create more complex fontsize object
export const fontFamily = {
  options: FONT_FAMILY.map((option) => ({
    title: option.title,
    model: option.title,
    view: {
      name: 'span',
      classes: [option.className],
    },
  })),
}

// Create more complex fontsize object
export const fontSize = {
  options: FONT_SIZE.map((option) => ({
    title: option.title,
    model: option.title,
    view: {
      name: 'span',
      classes: [option.className],
    },
  })),
}

//
export const fontColor = {
  colors: COLORS,
}
