import dynamic from 'next/dynamic'

export default dynamic(async () => await import('./social-icon'))
