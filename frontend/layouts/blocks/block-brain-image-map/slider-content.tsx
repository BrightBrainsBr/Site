import React from 'react'

import type { ISymptom } from './block-brain-image-map'

interface Properties {
  data: ISymptom[]
}

const SliderContent: React.FC<Properties> = ({ data }) => {
  if (!data || data.length === 0) return null

  return <div className="lg:hidden"></div>
}

export default SliderContent
