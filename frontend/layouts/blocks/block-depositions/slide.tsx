import { animate } from '@futurebrand/helpers-nextjs/utils'
import React, { useState } from 'react'
import { twMerge } from 'tailwind-merge'

import Modal from '~/components/modal'
import VideoPlayer from '~/components/video-player'

import type { ISlide } from './block-depositions'

interface Properties {
  data: ISlide
}

const Slide: React.FC<Properties> = ({ data }) => {
  const { content, video, descriptionText } = data
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Renderizar conteúdo antigo (HTML apenas) - compatibilidade
  if (content && !video) {
    return (
      <div className="h-fit lg:h-[36.67vh] lg:min-h-[19.25rem] flex items-end lg:items-center py-20 lg:p-0">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div
            className={twMerge(
              'lg:col-span-6 lg:col-start-4 relative text-center cms-rich-text text-midnight-950',
              animate({ index: 1 })
            )}
            dangerouslySetInnerHTML={{
              __html: content,
            }}
          />
        </div>
      </div>
    )
  }

  // Renderizar novo conteúdo (vídeo + modal)
  if (video) {
    return (
      <>
        <div
          className="w-full cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <VideoPlayer
            title={video.title || 'Depoimento'}
            youtubeVideo={video.youtubeVideo}
            uploadedVideo={video.uploadedVideo}
            thumbnail={video.thumbnail}
            className="aspect-video"
          />
        </div>

        <Modal isActive={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div className="w-full max-w-4xl mx-auto p-6 lg:p-8">
            <div className="mb-6">
              <VideoPlayer
                title={video.title || 'Depoimento'}
                youtubeVideo={video.youtubeVideo}
                uploadedVideo={video.uploadedVideo}
                thumbnail={video.thumbnail}
                className="w-full aspect-video"
              />
            </div>
            {descriptionText && (
              <div className="prose prose-lg max-w-none text-midnight-950">
                <p className="text-base lg:text-lg leading-relaxed">
                  {descriptionText}
                </p>
              </div>
            )}
          </div>
        </Modal>
      </>
    )
  }

  // Fallback se não houver conteúdo
  return null
}

export default Slide
