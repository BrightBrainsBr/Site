import Link from 'next/link'
import React from 'react'

export interface BreadcrumbItem {
  name: string
  item: string
}

interface VisualBreadcrumbsProps {
  items: BreadcrumbItem[]
}

const VisualBreadcrumbs: React.FC<VisualBreadcrumbsProps> = ({ items }) => {
  if (!items || items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-6">
      <ol className="flex items-center space-x-2">
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={index} className="flex items-center space-x-2">
              {isLast ? (
                <span className="text-gray-900 font-medium truncate" aria-current="page">
                  {crumb.name}
                </span>
              ) : (
                <>
                  <Link href={crumb.item} className="hover:text-primary transition-colors">
                    {crumb.name}
                  </Link>
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default VisualBreadcrumbs
