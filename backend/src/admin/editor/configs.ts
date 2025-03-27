// # Colors
export const COLORS = [
  { color: '#FCFFE4', label: 'Lime 50' },
  { color: '#F8FFC4', label: 'Lime 100' },
  { color: '#EFFF90', label: 'Lime 200' },
  { color: '#DFFF50', label: 'Lime 300' },
  { color: '#CFFF22', label: 'Lime 400' },
  { color: '#C4D219', label: 'Lime +' },
  { color: '#AEE600', label: 'Lime 500' },
  { color: '#87B800', label: 'Lime 600' },
  { color: '#658B00', label: 'Lime 700' },
  { color: '#506D07', label: 'Lime 800' },
  { color: '#445C0B', label: 'Lime 900' },
  { color: '#223400', label: 'Lime 950' },
  { color: '#EDF9FF', label: 'Midnight 50' },
  { color: '#D7F0FF', label: 'Midnight 100' },
  { color: '#B9E7FF', label: 'Midnight 200' },
  { color: '#88DAFF', label: 'Midnight 300' },
  { color: '#51C2FF', label: 'Midnight 400' },
  { color: '#28A4FF', label: 'Midnight 500' },
  { color: '#1187FF', label: 'Midnight 600' },
  { color: '#0A6EEB', label: 'Midnight 700' },
  { color: '#0F58BE', label: 'Midnight 800' },
  { color: '#134C95', label: 'Midnight 900' },
  { color: '#091930', label: 'Midnight 950' },
  { color: '#F2FBF8', label: 'Green 50' },
  { color: '#D5F2E9', label: 'Green 100' },
  { color: '#ABE4D2', label: 'Green 200' },
  { color: '#79CFB8', label: 'Green 300' },
  { color: '#5DBBA4', label: 'Green 400' },
  { color: '#339982', label: 'Green 500' },
  { color: '#277A69', label: 'Green 600' },
  { color: '#236256', label: 'Green 700' },
  { color: '#204F46', label: 'Green 800' },
  { color: '#1E433C', label: 'Green 900' },
  { color: '#0C2723', label: 'Green 950' },
  { color: '#F2F8FD', label: 'Blue 50' },
  { color: '#E5F0F9', label: 'Blue 100' },
  { color: '#C4E0F3', label: 'Blue 200' },
  { color: '#91C7E8', label: 'Blue 300' },
  { color: '#54A9DA', label: 'Blue 400' },
  { color: '#308FC7', label: 'Blue 500' },
  { color: '#2072A9', label: 'Blue 600' },
  { color: '#1B5C89', label: 'Blue 700' },
  { color: '#1A4E72', label: 'Blue 800' },
  { color: '#1B425F', label: 'Blue 900' },
  { color: '#122A3F', label: 'Blue 950' },
  { color: '#FBF6FD', label: 'Violet 50' },
  { color: '#F6ECFB', label: 'Violet 100' },
  { color: '#EDD7F7', label: 'Violet 200' },
  { color: '#E0B8EF', label: 'Violet 300' },
  { color: '#CE8DE5', label: 'Violet 400' },
  { color: '#B761D4', label: 'Violet 500' },
  { color: '#9C41B8', label: 'Violet 600' },
  { color: '#8C37A3', label: 'Violet 700' },
  { color: '#6C2C7C', label: 'Violet 800' },
  { color: '#5B2867', label: 'Violet 900' },
  { color: '#3A1042', label: 'Violet 950' },
  { color: '#FFFFFF', label: 'White' },
  { color: '#D8DEDF', label: 'Gray Light' },
  { color: '#7E8586', label: 'Gray Secondary Dark' },
  { color: '#000000', label: 'Black' },
]

// # Font Family
export const FONT_FAMILY = [
  {
    title: 'KMR Apparat',
    className: 'font-kmr', // Tailwind ClassName
  },
  {
    title: 'Roboto',
    className: 'font-roboto', // Tailwind ClassName
  },
]

// Font Sizes
export const FONT_SIZE = [
  {
    title: 'Text xs / 12px',
    className: 'text-xs', // Tailwind ClassName
  },
  {
    title: 'Text sm / 14px',
    className: 'text-sm', // Tailwind ClassName
  },
  {
    title: 'Text base / 16px',
    className: 'text-base', // Tailwind ClassName
  },
  {
    title: 'Text lg / 18px',
    className: 'text-lg', // Tailwind ClassName
  },
  {
    title: 'Heading xl / 20px',
    className: 'text-xl', // Tailwind ClassName
  },
  {
    title: 'Heading 2xl / 24px',
    className: 'heading-2xl', // Tailwind ClassName
  },
  {
    title: 'Heading 3xl / 32px',
    className: 'heading-3xl', // Tailwind ClassName
  },
  {
    title: 'Heading 4xl / 42px',
    className: 'heading-4xl', // Tailwind ClassName
  },
  {
    title: 'Heading 5xl / 64px',
    className: 'heading-5xl', // Tailwind ClassName
  },
  {
    title: 'Heading 6xl / 76px',
    className: 'heading-6xl', // Tailwind ClassName
  },
]

export const STYLES = `
  .ck .text-xs {
    font-size: 12px;
    line-height: 1.333;
  }
  .ck .text-sm {
    font-size: 12px;
    line-height: 1.333;
  }
  .ck .text-base {
    font-size: 14px;
    line-height: 1.333;
  }
  .ck .text-lg {
    font-size: 16px;
    line-height: 1.333;
  }
  .ck .text-xl {
    font-size: 18px;
    line-height: 1.333;
  }
  .ck .heading-2xl {
    font-size: 20px;
    font-weight: 400;
    line-height: 1.333;
  }
  .ck .heading-3xl {
    font-size: 22px;
    font-weight: 300;
    line-height: 1.333;
  }
  .ck .heading-4xl {
    font-size: 24px;
    font-weight: 300;
    line-height: 1.333;
  }
  .ck .heading-5xl {
    font-size: 26px;
    font-weight: 400;
    line-height: 1.333;
  }
  .ck .heading-6xl {
    font-size: 28px;
    font-weight: 200;
    line-height: 1.333;
  }
  .ck .uppercase {
    text-transform: uppercase;
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
