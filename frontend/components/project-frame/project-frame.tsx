import Image from 'next/image'
import React from 'react'

const PROJECT_FRAME: Partial<Record<string, string>> = {
  'midnight-950': '/frame-midnight-950.webm',
  'blue-400': '/frame-blue-400.webm',
  'green-400': '/frame-green-400.webm',
  'lime-400': '/frame-midnight-950.webm',
  'violet-400': '/frame-violet-400.webm',
}

const PROJECT_IMAGE_MB: Partial<Record<string, string>> = {
  'midnight-950': '/frame-midnight-950.svg',
  'blue-400': '/frame-blue-400.svg',
  'green-400': '/frame-green-400.svg',
  'lime-400': '/frame-midnight-950.svg',
  'violet-400': '/frame-violet-400.svg',
}

type Properties = {
  name: string
}

const ProjectFrame: React.FC<Properties> = ({ name }) => {
  const frameSrc = PROJECT_FRAME[name]
  const imageSrc = PROJECT_IMAGE_MB[name]

  if (!frameSrc || !imageSrc) return

  return (
    <>
      <video
        className="fixed top-0 left-0 w-full h-full object-cover object-top pointer-events-none hidden lg:block"
        src={frameSrc}
        autoPlay
        controls={false}
        muted
        loop
      />
      <Image
        className="fixed top-0 left-0 w-full h-full object-cover object-top pointer-events-none lg:hidden"
        src={imageSrc}
        alt="Project Frame"
        width={1200}
        height={800}
      />
    </>
  )
}

export default ProjectFrame
