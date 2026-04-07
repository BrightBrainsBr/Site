// frontend/features/b2b-dashboard/constants/cid-codes.ts

export interface CIDCode {
  code: string
  description: string
  category?: string
}

export const CID_CODES_NR1: CIDCode[] = [
  // F00-F09: Transtornos Mentais Orgânicos
  { code: 'F00', description: 'Demência na doença de Alzheimer', category: 'Transtornos Mentais Orgânicos' },
  { code: 'F01', description: 'Demência vascular', category: 'Transtornos Mentais Orgânicos' },
  { code: 'F02', description: 'Demência em outras doenças classificadas', category: 'Transtornos Mentais Orgânicos' },
  { code: 'F03', description: 'Demência não especificada', category: 'Transtornos Mentais Orgânicos' },
  { code: 'F04', description: 'Síndrome amnésica orgânica não induzida por álcool', category: 'Transtornos Mentais Orgânicos' },
  { code: 'F06', description: 'Outros transtornos mentais devidos a lesão e disfunção cerebral', category: 'Transtornos Mentais Orgânicos' },
  { code: 'F07', description: 'Transtornos de personalidade e comportamento devidos a doença cerebral', category: 'Transtornos Mentais Orgânicos' },
  { code: 'F09', description: 'Transtorno mental orgânico ou sintomático não especificado', category: 'Transtornos Mentais Orgânicos' },

  // F10-F19: Transtornos por Uso de Substâncias
  { code: 'F10', description: 'Transtornos mentais e comportamentais devidos ao uso de álcool', category: 'Transtornos por Substâncias' },
  { code: 'F10.1', description: 'Uso nocivo de álcool', category: 'Transtornos por Substâncias' },
  { code: 'F10.2', description: 'Síndrome de dependência do álcool', category: 'Transtornos por Substâncias' },
  { code: 'F11', description: 'Transtornos devidos ao uso de opiáceos', category: 'Transtornos por Substâncias' },
  { code: 'F12', description: 'Transtornos devidos ao uso de canabinóides', category: 'Transtornos por Substâncias' },
  { code: 'F13', description: 'Transtornos devidos ao uso de sedativos e hipnóticos', category: 'Transtornos por Substâncias' },
  { code: 'F14', description: 'Transtornos devidos ao uso de cocaína', category: 'Transtornos por Substâncias' },
  { code: 'F15', description: 'Transtornos devidos ao uso de outros estimulantes', category: 'Transtornos por Substâncias' },
  { code: 'F17', description: 'Transtornos devidos ao uso de fumo/nicotina', category: 'Transtornos por Substâncias' },
  { code: 'F19', description: 'Transtornos devidos ao uso de múltiplas drogas', category: 'Transtornos por Substâncias' },

  // F20-F29: Esquizofrenia e Transtornos Relacionados
  { code: 'F20', description: 'Esquizofrenia', category: 'Esquizofrenia e Transtornos Relacionados' },
  { code: 'F21', description: 'Transtorno esquizotípico', category: 'Esquizofrenia e Transtornos Relacionados' },
  { code: 'F22', description: 'Transtornos delirantes persistentes', category: 'Esquizofrenia e Transtornos Relacionados' },
  { code: 'F23', description: 'Transtornos psicóticos agudos e transitórios', category: 'Esquizofrenia e Transtornos Relacionados' },
  { code: 'F25', description: 'Transtornos esquizoafetivos', category: 'Esquizofrenia e Transtornos Relacionados' },
  { code: 'F28', description: 'Outros transtornos psicóticos não orgânicos', category: 'Esquizofrenia e Transtornos Relacionados' },
  { code: 'F29', description: 'Psicose não orgânica não especificada', category: 'Esquizofrenia e Transtornos Relacionados' },

  // F30-F39: Transtornos do Humor (Afetivos)
  { code: 'F30', description: 'Episódio maníaco', category: 'Transtornos do Humor' },
  { code: 'F31', description: 'Transtorno afetivo bipolar', category: 'Transtornos do Humor' },
  { code: 'F31.0', description: 'Transtorno afetivo bipolar — episódio maníaco atual', category: 'Transtornos do Humor' },
  { code: 'F31.1', description: 'Transtorno afetivo bipolar — episódio maníaco com sintomas psicóticos', category: 'Transtornos do Humor' },
  { code: 'F31.3', description: 'Transtorno afetivo bipolar — episódio depressivo leve/moderado', category: 'Transtornos do Humor' },
  { code: 'F31.4', description: 'Transtorno afetivo bipolar — episódio depressivo grave sem sintomas psicóticos', category: 'Transtornos do Humor' },
  { code: 'F32', description: 'Episódio depressivo', category: 'Transtornos do Humor' },
  { code: 'F32.0', description: 'Episódio depressivo leve', category: 'Transtornos do Humor' },
  { code: 'F32.1', description: 'Episódio depressivo moderado', category: 'Transtornos do Humor' },
  { code: 'F32.2', description: 'Episódio depressivo grave sem sintomas psicóticos', category: 'Transtornos do Humor' },
  { code: 'F32.3', description: 'Episódio depressivo grave com sintomas psicóticos', category: 'Transtornos do Humor' },
  { code: 'F32.8', description: 'Outros episódios depressivos', category: 'Transtornos do Humor' },
  { code: 'F32.9', description: 'Episódio depressivo não especificado', category: 'Transtornos do Humor' },
  { code: 'F33', description: 'Transtorno depressivo recorrente', category: 'Transtornos do Humor' },
  { code: 'F33.0', description: 'Transtorno depressivo recorrente — episódio atual leve', category: 'Transtornos do Humor' },
  { code: 'F33.1', description: 'Transtorno depressivo recorrente — episódio atual moderado', category: 'Transtornos do Humor' },
  { code: 'F33.2', description: 'Transtorno depressivo recorrente — episódio atual grave', category: 'Transtornos do Humor' },
  { code: 'F33.3', description: 'Transtorno depressivo recorrente — episódio atual grave com psicose', category: 'Transtornos do Humor' },
  { code: 'F34', description: 'Transtornos do humor persistentes (Distimia, Ciclotimia)', category: 'Transtornos do Humor' },
  { code: 'F34.0', description: 'Ciclotimia', category: 'Transtornos do Humor' },
  { code: 'F34.1', description: 'Distimia', category: 'Transtornos do Humor' },
  { code: 'F38', description: 'Outros transtornos do humor', category: 'Transtornos do Humor' },
  { code: 'F39', description: 'Transtorno do humor não especificado', category: 'Transtornos do Humor' },

  // F40-F49: Transtornos Neuróticos, Relacionados ao Stress e Somatoformes
  { code: 'F40', description: 'Transtornos fóbico-ansiosos', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F40.0', description: 'Agorafobia', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F40.1', description: 'Fobias sociais', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F40.2', description: 'Fobias específicas (isoladas)', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F41', description: 'Outros transtornos ansiosos', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F41.0', description: 'Transtorno de pânico (ansiedade paroxística episódica)', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F41.1', description: 'Ansiedade generalizada (TAG)', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F41.2', description: 'Transtorno ansioso e depressivo misto', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F41.3', description: 'Outros transtornos ansiosos mistos', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F41.9', description: 'Transtorno ansioso não especificado', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F42', description: 'Transtorno obsessivo-compulsivo (TOC)', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F43', description: 'Reações ao stress grave e transtornos de adaptação', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F43.0', description: 'Reação aguda ao stress', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F43.1', description: 'Transtorno de stress pós-traumático (TEPT)', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F43.2', description: 'Transtornos de adaptação', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F43.8', description: 'Outras reações ao stress grave', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F43.9', description: 'Reação ao stress grave não especificada', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F44', description: 'Transtornos dissociativos (conversivos)', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F45', description: 'Transtornos somatoformes', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F45.0', description: 'Transtorno de somatização', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F45.3', description: 'Disfunção autonômica somatoforme', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F48', description: 'Outros transtornos neuróticos', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F48.0', description: 'Neurastenia — Síndrome de esgotamento profissional (Burnout)', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F48.8', description: 'Outros transtornos neuróticos especificados', category: 'Transtornos Ansiosos e Relacionados ao Stress' },
  { code: 'F48.9', description: 'Transtorno neurótico não especificado', category: 'Transtornos Ansiosos e Relacionados ao Stress' },

  // F50-F59: Síndromes Comportamentais
  { code: 'F50', description: 'Transtornos alimentares (Anorexia, Bulimia)', category: 'Síndromes Comportamentais' },
  { code: 'F51', description: 'Transtornos do sono não orgânicos (Insônia, Hipersonia)', category: 'Síndromes Comportamentais' },
  { code: 'F51.0', description: 'Insônia não orgânica', category: 'Síndromes Comportamentais' },
  { code: 'F51.1', description: 'Hipersonia não orgânica', category: 'Síndromes Comportamentais' },
  { code: 'F54', description: 'Fatores psicológicos e comportamentais associados a transtornos classificados', category: 'Síndromes Comportamentais' },

  // F60-F69: Transtornos de Personalidade e Comportamento
  { code: 'F60', description: 'Transtornos específicos de personalidade', category: 'Transtornos de Personalidade' },
  { code: 'F60.0', description: 'Transtorno de personalidade paranoide', category: 'Transtornos de Personalidade' },
  { code: 'F60.3', description: 'Transtorno de personalidade emocionalmente instável (Borderline)', category: 'Transtornos de Personalidade' },
  { code: 'F60.4', description: 'Transtorno de personalidade histriônica', category: 'Transtornos de Personalidade' },
  { code: 'F60.5', description: 'Transtorno de personalidade anancástica (TOC de personalidade)', category: 'Transtornos de Personalidade' },
  { code: 'F60.6', description: 'Transtorno de personalidade ansiosa (esquiva)', category: 'Transtornos de Personalidade' },
  { code: 'F60.7', description: 'Transtorno de personalidade dependente', category: 'Transtornos de Personalidade' },
  { code: 'F63', description: 'Transtornos dos hábitos e dos impulsos', category: 'Transtornos de Personalidade' },
  { code: 'F68', description: 'Outros transtornos de personalidade e comportamento', category: 'Transtornos de Personalidade' },

  // Z55-Z65: Fatores Psicossociais e Relacionados ao Trabalho
  { code: 'Z55', description: 'Problemas relacionados com a educação e a alfabetização', category: 'Fatores Psicossociais' },
  { code: 'Z56', description: 'Problemas relacionados com o emprego e o desemprego', category: 'Fatores Psicossociais' },
  { code: 'Z56.0', description: 'Desemprego', category: 'Fatores Psicossociais' },
  { code: 'Z56.2', description: 'Ameaça de perda de emprego', category: 'Fatores Psicossociais' },
  { code: 'Z56.3', description: 'Ritmo de trabalho penoso', category: 'Fatores Psicossociais' },
  { code: 'Z56.4', description: 'Desentendimento com o empregador e colegas', category: 'Fatores Psicossociais' },
  { code: 'Z56.5', description: 'Trabalho insalubre ou com condições de trabalho difíceis', category: 'Fatores Psicossociais' },
  { code: 'Z56.6', description: 'Outras dificuldades físicas e mentais relacionadas ao trabalho', category: 'Fatores Psicossociais' },
  { code: 'Z56.7', description: 'Outros problemas relacionados ao emprego', category: 'Fatores Psicossociais' },
  { code: 'Z57', description: 'Exposição a fatores de risco ocupacional', category: 'Fatores Psicossociais' },
  { code: 'Z60', description: 'Problemas relacionados com o ambiente social', category: 'Fatores Psicossociais' },
  { code: 'Z61', description: 'Problemas relacionados com eventos negativos na infância', category: 'Fatores Psicossociais' },
  { code: 'Z62', description: 'Outros problemas relacionados com a criação dos filhos', category: 'Fatores Psicossociais' },
  { code: 'Z63', description: 'Outros problemas relacionados com o grupo primário de suporte', category: 'Fatores Psicossociais' },
  { code: 'Z65', description: 'Problemas relacionados com outras circunstâncias psicossociais', category: 'Fatores Psicossociais' },
  { code: 'Z73', description: 'Problemas relacionados com a gestão de dificuldades da vida', category: 'Fatores Psicossociais' },
  { code: 'Z73.0', description: 'Síndrome de burnout — Sensação de esgotamento vital', category: 'Fatores Psicossociais' },
]
