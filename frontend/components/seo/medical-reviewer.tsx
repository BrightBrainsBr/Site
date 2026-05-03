import React from 'react'

interface MedicalReviewerProps {
  authorName?: string
  reviewerName?: string
  dateUpdated?: string
  datePublished?: string
}

const MedicalReviewer: React.FC<MedicalReviewerProps> = ({
  authorName,
  reviewerName,
  dateUpdated,
  datePublished,
}) => {
  // If we have absolutely no EEAT data, render nothing to avoid empty fields.
  if (!authorName && !reviewerName && !dateUpdated && !datePublished) {
    return null
  }

  const formattedDate = (dateString?: string) => {
    if (!dateString) return null
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(new Date(dateString))
    } catch {
      return null
    }
  }

  const updated = formattedDate(dateUpdated)
  const published = formattedDate(datePublished)

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4 my-6 text-sm text-gray-600 shadow-sm flex flex-col sm:flex-row gap-4 sm:items-center">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          {authorName && <p className="font-medium text-gray-900">Escrito por: <span className="font-normal text-gray-600">{authorName}</span></p>}
          {reviewerName && <p className="font-medium text-gray-900">Revisão Médica: <span className="font-normal text-gray-600">{reviewerName}</span></p>}
        </div>
      </div>
      {(updated || published) && (
        <div className="sm:ml-auto border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-4">
          {updated ? (
            <p>Atualizado em: <span className="font-medium">{updated}</span></p>
          ) : published && (
            <p>Publicado em: <span className="font-medium">{published}</span></p>
          )}
        </div>
      )}
    </div>
  )
}

export default MedicalReviewer
