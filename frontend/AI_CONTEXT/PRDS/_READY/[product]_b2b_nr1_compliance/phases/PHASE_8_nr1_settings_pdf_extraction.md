# BrightMonitor NR-1 — Phase 8: Settings Extensions + PDF Upload Pipeline

**Cursor Agent:** /frontend-engineer
**Wave:** 3
**Objective:** Extend the Settings tab with NR-1 company fields, PDF upload with AI extraction, and SST signature upload. Build the reusable PDF upload + extraction component.
**Depends on:** Phase 4 (extract-pdf API), Phase 5 (settings API update), Phase 6 (filter bar)

**Files owned by this phase:**
- `frontend/features/b2b-dashboard/components/tabs/B2BSettingsTab.tsx` (modify)
- `frontend/features/b2b-dashboard/components/shared/B2BNR1FieldsComponent.tsx` (new)
- `frontend/features/b2b-dashboard/components/shared/B2BPdfUploadComponent.tsx` (new)
- `frontend/features/b2b-dashboard/hooks/useB2BExtractPdfMutationHook.ts` (new)

---

## 2. What to Build

### `B2BSettingsTab.tsx` — Modify

Currently wraps `CompanySettingsComponent` (662 lines). Add a new section below existing settings:

```
┌─────────────────────────────────────────────────────────┐
│ [Existing: Company Settings]                             │
│  - Domains, Departments, Users, Collaborators            │
├─────────────────────────────────────────────────────────┤
│ [NEW: Dados NR-1 da Empresa]                             │
│  B2BNR1FieldsComponent                                   │
└─────────────────────────────────────────────────────────┘
```

### `B2BNR1FieldsComponent.tsx` — New

Editable form for the 3 company-provided NR-1 fields + SST responsible.

**Sections:**

1. **Responsável SST**
   - Name text input
   - Role text input
   - Signature image upload → `company-signatures` bucket → save URL to `companies.sst_signature_url`

2. **Dados da Empresa**
   - CNAE text input
   - Grau de Risco text input

3. **Campos NR-1** (tabs per department, or single set)
   - "Descrição dos Processos de Trabalho" — textarea per department
   - "Descrição das Atividades" — textarea per department
   - "Medidas Preventivas Existentes" — tag-style input (add/remove measures)

4. **Upload Documentos**
   - "Ou importe de um PDF" button → opens `B2BPdfUploadComponent` with `extractionType='nr1-fields'`
   - After extraction: shows extracted data in editable form for review
   - "Confirmar e Salvar" button → saves to `companies` table via settings API

5. **SOPs de Emergência**
   - Upload area for emergency SOP PDFs → `company-documents` bucket
   - List of uploaded SOPs with name + date + download link
   - Saved as `companies.emergency_sop_urls` (jsonb array of `{name, url, uploaded_at}`)

All saves go through `POST /api/b2b/[companyId]/settings` with action `update_nr1_fields`.

### `B2BPdfUploadComponent.tsx` — New Shared Component

Reusable PDF upload + AI extraction component. Used in:
- Settings (NR-1 field extraction)
- Events tab (bulk event import)

**Props:**
```typescript
interface PdfUploadProps {
  companyId: string
  extractionType: 'nr1-fields' | 'events-bulk'
  onExtracted: (data: any) => void
  onCancel: () => void
}
```

**Flow:**
1. Drag & drop or click to upload PDF
2. Upload to `company-documents` bucket → get public URL
3. Show loading state: "Analisando documento com IA..."
4. Call `useB2BExtractPdfMutationHook` → POST to `/api/b2b/[companyId]/extract-pdf`
5. Show extracted data in editable review form:
   - For `nr1-fields`: 3 text areas with extracted content
   - For `events-bulk`: table of extracted events with edit capability
6. Show confidence score and warnings from AI
7. User confirms → calls `onExtracted(confirmedData)` → parent component saves

### `useB2BExtractPdfMutationHook.ts` — New

```typescript
function useB2BExtractPdfMutationHook(companyId: string) {
  return useMutation({
    mutationFn: async (params: { fileUrl: string, extractionType: string }) => {
      const res = await fetch(`/api/b2b/${companyId}/extract-pdf`, {
        method: 'POST',
        body: JSON.stringify(params)
      })
      return res.json()
    }
  })
}
```

## 3. Phase Completion Checklist

- [ ] Modified: `B2BSettingsTab.tsx` with NR-1 section
- [ ] Created: `B2BNR1FieldsComponent.tsx` with all fields + signature upload
- [ ] Created: `B2BPdfUploadComponent.tsx` with drag-drop + AI extraction + review
- [ ] Created: `useB2BExtractPdfMutationHook.ts`
- [ ] SST signature upload works end-to-end
- [ ] PDF extraction for NR-1 fields works end-to-end
- [ ] PDF extraction for events bulk import works (wired in B2BEventsTab)
- [ ] Emergency SOP upload + list works
- [ ] All data saves correctly to `companies` table

**Next:** `PHASE_9_nr1_percepcao_tab.md` — Percepção Organizacional tab (reads form responses)
