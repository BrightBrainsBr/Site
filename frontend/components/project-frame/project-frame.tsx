import React from 'react'

const PROJECT_FRAME: Partial<Record<string, string>> = {
  'midnight-950': '/frame-midnight-950.webm',
  'blue-400': '/frame-blue-400.webm',
  'green-400': '/frame-green-400.webm',
  'lime-400': '/frame-midnight-950.webm',
  'violet-400': '/frame-violet-400.webm',
}

type Properties = {
  name: string
}

const ProjectFrame: React.FC<Properties> = ({ name }) => {
  const frameSrc = PROJECT_FRAME[name]

  if (!frameSrc) return

  return (
    <video
      className="fixed top-0 left-0 w-full h-full object-cover object-top"
      src={frameSrc}
      autoPlay
      muted
      loop
    />
  )
}

export default ProjectFrame
