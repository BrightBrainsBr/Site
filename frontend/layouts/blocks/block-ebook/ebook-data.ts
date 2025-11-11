// Dados estáticos dos ebooks
// Para adicionar novos ebooks:
// 1. Adicione o PDF em public/ebooks/
// 2. Adicione um novo objeto neste array
// 3. Commit + push

export interface IEbook {
  id: number
  title: string
  description: string
  fileUrl: string
  category?: string
  coverImage?: string
}

export const EBOOKS: IEbook[] = [
  {
    id: 1,
    title: 'Neuromodulação não invasiva',
    description:
      'Conheça as principais técnicas de neuromodulação não invasiva e seus benefícios para o tratamento de diversas condições neurológicas.',
    fileUrl:
      'https://painel-website.brightbrains.com.br/uploads/Bright_Brains_E_book_Neuromodulacao_nao_invasiva_df8a35c1b8.pdf',
    category: 'Neurociência',
  },
  // Adicione mais ebooks aqui conforme necessário
]
