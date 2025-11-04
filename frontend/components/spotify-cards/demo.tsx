import React from 'react'

import { SpotifyCardsContainer } from './index'
import type { IPodcastData } from './types'

// Mock data for testing
const mockPodcasts: IPodcastData[] = [
  {
    id: 1,
    attributes: {
      spotifyId: '78nhI3lKmaBWPQeGfEDUU8',
      title: 'Os perigos da automedicação: quando o cuidado se transforma em risco.',
      description: 'Tomar um remédio "por conta própria" pode parecer inofensivo. Uma forma rápida de aliviar um sintoma, mas essa prática aparentemente simples pode esconder riscos significativos para a saúde.',
      imageUrl: 'https://i.scdn.co/image/ab6765630000ba8a0f8b3d8b0f8b3d8b0f8b3d8b',
      spotifyUrl: 'https://open.spotify.com/episode/78nhI3lKmaBWPQeGfEDUU8',
      duration: 600000, // 10 minutes in milliseconds
      publishedDate: '2025-11-04',
      createdAt: '2025-11-04T12:00:00.000Z',
      updatedAt: '2025-11-04T12:00:00.000Z',
      publishedAt: '2025-11-04T12:00:00.000Z',
    },
  },
  {
    id: 2,
    attributes: {
      spotifyId: '1bGnSk4wHOAuTT5oK1erB2',
      title: 'Dispraxia: o desafio invisível do corpo e do cérebro de Daniel Radcliffe.',
      description: 'Por trás do sucesso e da fama, há histórias de superação que lembram o quanto o cérebro humano é complexo e resiliente.',
      imageUrl: 'https://i.scdn.co/image/ab6765630000ba8a0f8b3d8b0f8b3d8b0f8b3d8b',
      spotifyUrl: 'https://open.spotify.com/episode/1bGnSk4wHOAuTT5oK1erB2',
      duration: 480000, // 8 minutes in milliseconds
      publishedDate: '2025-11-02',
      createdAt: '2025-11-02T12:00:00.000Z',
      updatedAt: '2025-11-02T12:00:00.000Z',
      publishedAt: '2025-11-02T12:00:00.000Z',
    },
  },
  {
    id: 3,
    attributes: {
      spotifyId: '76ZcHn9hThl6g0L3fS2F8o',
      title: 'Vencendo o vício em apostas: o cérebro e o transtorno do jogo.',
      description: 'Apostar pode parecer inofensivo no começo. Uma forma de diversão, emoção ou alívio rápido. Mas, para algumas pessoas, essa atividade pode se transformar em um transtorno sério.',
      imageUrl: 'https://i.scdn.co/image/ab6765630000ba8a0f8b3d8b0f8b3d8b0f8b3d8b',
      spotifyUrl: 'https://open.spotify.com/episode/76ZcHn9hThl6g0L3fS2F8o',
      duration: 540000, // 9 minutes in milliseconds
      publishedDate: '2025-11-02',
      createdAt: '2025-11-02T11:00:00.000Z',
      updatedAt: '2025-11-02T11:00:00.000Z',
      publishedAt: '2025-11-02T11:00:00.000Z',
    },
  },
]

const SpotifyCardsDemo: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Spotify Cards Demo</h1>
      
      {/* Test with data */}
      <SpotifyCardsContainer
        podcasts={mockPodcasts}
        title="Últimos Episódios do Podcast"
        className="mb-12"
      />
      
      {/* Test without data */}
      <SpotifyCardsContainer
        podcasts={[]}
        title="Estado Vazio"
        className="mb-12"
      />
    </div>
  )
}

export default SpotifyCardsDemo