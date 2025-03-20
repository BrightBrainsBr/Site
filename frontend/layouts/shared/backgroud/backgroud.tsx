import React from 'react'
import { tv } from 'tailwind-variants'

interface Properties extends React.PropsWithChildren {
  color: 'black' | 'white'
  padding?: boolean
  className?: string
}

const backgroundClassName = tv({
  base: 'wrapper-background section-medium relative',
  variants: {
    color: {
      black: 'bg-black dark',
      white: 'bg-white ',
    },
    padding: {
      true: 'section-padding',
    },
  },
})

const WrapperBackground: React.FC<Properties> = async ({
  color,
  padding = true,
  children,
  className,
}) => {
  return (
    <div
      className={backgroundClassName({
        color,
        padding,
        className,
      })}
    >
      {children}
    </div>
  )
}

export default WrapperBackground
