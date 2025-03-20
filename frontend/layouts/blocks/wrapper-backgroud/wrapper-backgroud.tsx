import type { IWrapperProps } from '@futurebrand/types/contents'
import React from 'react'

import Background from '~/layouts/shared/backgroud'

interface Properties {
  color: 'black' | 'white'
  padding?: boolean
}

const WrapperBackground: React.FC<IWrapperProps<Properties>> = async ({
  blockData,
  children,
}) => {
  return <Background {...blockData}>{children}</Background>
}

export default WrapperBackground
