// frontend/components/ui/use-toast.ts

'use client'

export function useToast() {
  return {
    toast: (opts: {
      title?: string
      description?: string
      variant?: string
    }) => {
      if (typeof window !== 'undefined' && opts.title) {
        console.warn('[toast]', opts.title, opts.description)
      }
    },
  }
}
