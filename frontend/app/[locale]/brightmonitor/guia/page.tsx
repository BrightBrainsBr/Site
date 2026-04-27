// frontend/app/[locale]/brightmonitor/guia/page.tsx

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Guia de Metodologia NR-1 | BrightMonitor',
  description:
    'Entenda a metodologia de avaliação de riscos ocupacionais NR-1 do BrightMonitor',
}

const riskBands = [
  {
    label: 'Baixo',
    range: '< 2,0',
    color: 'bg-green-100 text-green-800 border-green-300',
  },
  {
    label: 'Moderado',
    range: '2,0 – 2,99',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  {
    label: 'Alto',
    range: '3,0 – 3,99',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  {
    label: 'Crítico',
    range: '≥ 4,0',
    color: 'bg-red-100 text-red-800 border-red-300',
  },
]

const dominios = [
  {
    nome: 'Físico',
    descricao:
      'Avalia exposição a ruído, vibração, temperaturas extremas, radiações e pressões anormais no ambiente de trabalho.',
  },
  {
    nome: 'Químico',
    descricao:
      'Avalia contato com substâncias químicas como poeiras, fumos, gases, vapores e névoas que possam afetar a saúde.',
  },
  {
    nome: 'Biológico',
    descricao:
      'Avalia exposição a agentes biológicos como vírus, bactérias, fungos, parasitas e materiais potencialmente contaminados.',
  },
  {
    nome: 'Ergonômico',
    descricao:
      'Avalia condições de trabalho como postura, repetitividade, levantamento de peso, jornada e organização do trabalho.',
  },
  {
    nome: 'Psicossocial',
    descricao:
      'Avalia fatores como assédio, sobrecarga mental, falta de autonomia, conflitos interpessoais e pressão por resultados.',
  },
  {
    nome: 'Acidentes',
    descricao:
      'Avalia riscos de acidentes como quedas, choques elétricos, incêndios, máquinas sem proteção e arranjo físico inadequado.',
  },
  {
    nome: 'Percepção',
    descricao:
      'Captura a percepção subjetiva do colaborador sobre seu ambiente de trabalho, incluindo segurança percebida e confiança na gestão.',
  },
]

export default function GuiaPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-[family-name:var(--font-kmr)] text-4xl font-bold tracking-tight text-gray-900">
          Guia de Metodologia NR-1
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Compreenda como o BrightMonitor avalia e classifica riscos
          ocupacionais em conformidade com a Norma Regulamentadora nº 1.
        </p>

        <hr className="my-10 border-gray-200" />

        {/* O que é a NR-1 */}
        <section>
          <h2 className="font-[family-name:var(--font-kmr)] text-2xl font-bold text-gray-900">
            O que é a NR-1
          </h2>
          <p className="mt-3 leading-relaxed text-gray-700">
            A Norma Regulamentadora nº 1 (NR-1) do Ministério do Trabalho e
            Emprego estabelece as disposições gerais sobre segurança e saúde no
            trabalho. Ela define as obrigações do empregador em relação ao
            Gerenciamento de Riscos Ocupacionais (GRO) e ao Programa de
            Gerenciamento de Riscos (PGR), abrangendo riscos físicos, químicos,
            biológicos, ergonômicos, de acidentes e, mais recentemente, riscos
            psicossociais.
          </p>
          <p className="mt-3 leading-relaxed text-gray-700">
            A atualização da NR-1 (§1.5) ampliou o escopo do GRO para incluir
            fatores psicossociais, reconhecendo que o bem-estar mental dos
            trabalhadores é parte essencial da gestão de saúde ocupacional.
          </p>
        </section>

        <hr className="my-10 border-gray-200" />

        {/* Como funciona a avaliação */}
        <section>
          <h2 className="font-[family-name:var(--font-kmr)] text-2xl font-bold text-gray-900">
            Como funciona a avaliação BrightMonitor
          </h2>
          <p className="mt-3 leading-relaxed text-gray-700">
            O BrightMonitor utiliza um questionário estruturado aplicado aos
            colaboradores da empresa. Cada pergunta é respondida em uma escala
            Likert de 1 a 5, onde:
          </p>
          <ul className="mt-4 space-y-2 pl-6 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
              <span>
                <strong>1</strong> — Nunca / Discordo totalmente
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
              <span>
                <strong>2</strong> — Raramente / Discordo parcialmente
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
              <span>
                <strong>3</strong> — Às vezes / Neutro
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
              <span>
                <strong>4</strong> — Frequentemente / Concordo parcialmente
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
              <span>
                <strong>5</strong> — Sempre / Concordo totalmente
              </span>
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-gray-700">
            As respostas são agrupadas por domínio de risco e a média de cada
            domínio é calculada para determinar o nível de risco correspondente.
          </p>
        </section>

        <hr className="my-10 border-gray-200" />

        {/* Classificação de riscos */}
        <section>
          <h2 className="font-[family-name:var(--font-kmr)] text-2xl font-bold text-gray-900">
            Metodologia de classificação de riscos
          </h2>
          <p className="mt-3 leading-relaxed text-gray-700">
            A média Likert de cada domínio é mapeada em faixas de risco. A
            classificação segue a tabela abaixo:
          </p>
          <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Classificação
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Faixa de média
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {riskBands.map((band) => (
                  <tr key={band.label}>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-3 py-0.5 text-xs font-medium ${band.color}`}
                      >
                        {band.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700">
                      {band.range}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Valores mais altos indicam maior frequência/intensidade de exposição
            ao risco, demandando ações corretivas prioritárias.
          </p>
        </section>

        <hr className="my-10 border-gray-200" />

        {/* Domínios avaliados */}
        <section>
          <h2 className="font-[family-name:var(--font-kmr)] text-2xl font-bold text-gray-900">
            Domínios avaliados
          </h2>
          <p className="mt-3 leading-relaxed text-gray-700">
            A avaliação BrightMonitor cobre sete domínios de risco ocupacional:
          </p>
          <div className="mt-6 space-y-4">
            {dominios.map((d) => (
              <div
                key={d.nome}
                className="rounded-lg border border-gray-200 px-5 py-4"
              >
                <h3 className="text-base font-semibold text-gray-900">
                  {d.nome}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  {d.descricao}
                </p>
              </div>
            ))}
          </div>
        </section>

        <hr className="my-10 border-gray-200" />

        {/* Como interpretar */}
        <section>
          <h2 className="font-[family-name:var(--font-kmr)] text-2xl font-bold text-gray-900">
            Como interpretar os resultados
          </h2>
          <div className="mt-4 space-y-3 leading-relaxed text-gray-700">
            <p>
              O dashboard do BrightMonitor apresenta os resultados de forma
              visual, com indicadores por domínio e por departamento. Para
              interpretar corretamente:
            </p>
            <ul className="space-y-2 pl-6">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                <span>
                  <strong>Visão geral:</strong> observe quais domínios
                  apresentam risco Alto ou Crítico — esses demandam ação
                  imediata.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                <span>
                  <strong>Por departamento:</strong> identifique se o risco é
                  generalizado ou concentrado em setores específicos.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                <span>
                  <strong>Evolução temporal:</strong> compare ciclos de
                  avaliação para verificar se as ações implementadas estão
                  reduzindo os riscos.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                <span>
                  <strong>Planos de ação:</strong> utilize os dados para embasar
                  planos de ação específicos, priorizando domínios críticos.
                </span>
              </li>
            </ul>
          </div>
        </section>

        <hr className="my-10 border-gray-200" />

        {/* Glossário */}
        <section>
          <h2 className="font-[family-name:var(--font-kmr)] text-2xl font-bold text-gray-900">
            Glossário de termos NR-1
          </h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-gray-900">GRO — Gerenciamento de Riscos Ocupacionais</dt>
              <dd className="mt-0.5 leading-relaxed text-gray-600">
                Processo sistemático de identificação, avaliação, controle e
                monitoramento dos riscos ocupacionais no ambiente de trabalho.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">PGR — Programa de Gerenciamento de Riscos</dt>
              <dd className="mt-0.5 leading-relaxed text-gray-600">
                Documento que materializa o GRO, contendo inventário de riscos e
                plano de ação com medidas de prevenção.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Inventário de Riscos</dt>
              <dd className="mt-0.5 leading-relaxed text-gray-600">
                Registro de todos os perigos e fatores de risco identificados no
                ambiente de trabalho, incluindo avaliação de severidade e
                probabilidade.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Fator Psicossocial</dt>
              <dd className="mt-0.5 leading-relaxed text-gray-600">
                Aspectos da organização do trabalho e das relações interpessoais
                que podem afetar a saúde mental do trabalhador, como sobrecarga,
                assédio e falta de autonomia.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Escala Likert</dt>
              <dd className="mt-0.5 leading-relaxed text-gray-600">
                Escala de resposta graduada (1 a 5) usada nos questionários para
                medir a frequência ou concordância do trabalhador com cada
                afirmação.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Nexo Causal</dt>
              <dd className="mt-0.5 leading-relaxed text-gray-600">
                Relação de causa e efeito entre as condições de trabalho e o
                agravo à saúde do trabalhador, fundamental para a caracterização
                de doença ocupacional.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">AEP — Avaliação Ergonômica Preliminar</dt>
              <dd className="mt-0.5 leading-relaxed text-gray-600">
                Avaliação inicial das condições ergonômicas de trabalho, etapa
                obrigatória prevista na NR-17 e integrada ao GRO pela NR-1.
              </dd>
            </div>
          </dl>
        </section>

        <hr className="my-10 border-gray-200" />

        {/* Referências legais */}
        <section>
          <h2 className="font-[family-name:var(--font-kmr)] text-2xl font-bold text-gray-900">
            Referências legais
          </h2>
          <div className="mt-4 space-y-3 leading-relaxed text-gray-700">
            <ul className="space-y-2 pl-6">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                <span>
                  <strong>NR-1 §1.5</strong> — Gerenciamento de Riscos
                  Ocupacionais (GRO): disposições gerais que obrigam o
                  empregador a implementar o gerenciamento de riscos
                  ocupacionais, incluindo identificação de perigos, avaliação de
                  riscos e medidas de prevenção.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                <span>
                  <strong>NR-1 §1.5.3.1</strong> — Inventário de Riscos: o
                  empregador deve manter inventário de riscos atualizado,
                  contemplando todos os riscos ocupacionais identificados.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                <span>
                  <strong>NR-1 §1.5.4</strong> — Plano de Ação: exige a
                  elaboração de plano de ação com medidas de prevenção,
                  cronograma e responsáveis.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                <span>
                  <strong>Portaria MTE nº 1.419/2024</strong> — Inclui os riscos
                  psicossociais como parte do GRO, com vigência a partir de maio
                  de 2025.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                <span>
                  <strong>NR-17</strong> — Ergonomia: estabelece parâmetros para
                  adaptação das condições de trabalho às características
                  psicofisiológicas dos trabalhadores.
                </span>
              </li>
            </ul>
          </div>
        </section>

        <div className="mt-16 rounded-lg border border-gray-200 bg-gray-50 px-6 py-5 text-center">
          <p className="text-sm text-gray-600">
            Dúvidas sobre a metodologia? Entre em contato com nossa equipe pelo
            e-mail{' '}
            <a
              href="mailto:contato@brightbrains.com.br"
              className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800"
            >
              contato@brightbrains.com.br
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
