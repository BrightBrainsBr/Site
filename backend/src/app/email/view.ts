import { OnGetViewFunction } from '@futurebrand/helpers-strapi/integrations'
import { IForm, IFormSanitizedValue } from '@futurebrand/helpers-strapi/types'
import { renderHTMLEmailBox } from '@futurebrand/helpers-strapi/utils'

const ACCENT_COLOR = '#000000'

export const getEmailView: OnGetViewFunction = async (
  form: IForm,
  values: IFormSanitizedValue[]
) => {
  const htmlContent = `
    <div>
      <div>
        <h2 
          style='
            font-size: 24px;
            margin: 0;
            color: ${ACCENT_COLOR};
          '
          color="${ACCENT_COLOR}"
        >
          Form: ${form.name}
        </h2>
      </div>
      <hr width="72" align="left" color="${ACCENT_COLOR}" style="margin-top: 12px;" />
      <div 
        style="
          margin-top: 20px;
        ">
        ${values
          .map((field) =>
            field.value
              ? `
                <p style="
                  margin: 0;
                  margin-top: 12px;
                  line-height: 1.5;
                  font-size: 16px;
                ">
                  <b style="text-transform: capitalize;">${field.label}:</b><br />
                  ${field.value}
                </p>
              `
              : ''
          )
          .join('')}
      </div>
    </div>
  `

  return renderHTMLEmailBox(htmlContent)
}
