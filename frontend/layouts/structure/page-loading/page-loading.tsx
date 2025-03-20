import React from 'react'

import Loading from '~/components/loading'

const PageLoading: React.FC = () => {
  return (
    <main className="w-full h-screen flex items-center justify-center">
      <Loading />
    </main>
  )
}

export default PageLoading
