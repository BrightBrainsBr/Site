create table public.patients (
  id uuid not null default gen_random_uuid (),
  platform_user_id uuid null,  -- Link to FluxOS platform_users table
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  full_name text null,
  whatsapp_number text null,  -- NOT NULL removed - it's stored for reference, not as primary ID
  email text null,
  birth_date date null,
  cpf text null,
  gender public.gender null,
  nationality text null,
  civil_status public.civil_status null,
  religion text null,
  profession text null,
  occupation text null,
  surgeries_history text null,
  treatments_history text null,
  current_medications text null,
  father_history text null,
  mother_history text null,
  siblings_history text null,
  uses_alcohol boolean null default false,
  alcohol_description text null,
  is_smoker boolean null default false,
  smoker_description text null,
  pdf_url text null,
  constraint patients_pkey primary key (id),
  constraint patients_cpf_key unique (cpf),
  -- NOTE: whatsapp_number is NOT UNIQUE! Same number can exist for different platform_user_ids
  constraint patients_platform_user_id_key unique (platform_user_id)  -- CRITICAL: One patient per FluxOS user (UPSERT on this!)
) TABLESPACE pg_default;

-- IMPORTANT: 
-- - platform_user_id is the LINK to FluxOS (UUID from platform_users table)
-- - whatsapp_number is stored for reference but NOT unique (same phone can belong to multiple FluxOS users)
-- - RPCs MUST UPSERT on platform_user_id ONLY



create table public.conversation_state (
  id uuid not null default gen_random_uuid (),
  platform_user_id uuid null,  -- Link to FluxOS platform_users table
  patient_id uuid not null,
  current_state public.conversation_status_enum_v2 not null default 'PROTOCOL_PENDING_DOCTORS_APPROVAL'::conversation_status_enum_v2,
  anamnesis_type_selected public.anamnesis_type null,
  active_anamnesis_response_id uuid null,
  active_document_ids jsonb null,
  is_active boolean not null default true,
  created_at timestamp with time zone null default now(),
  last_interaction_at timestamp with time zone null default now(),
  anamnesis_current_question_index integer null default 0,
  anamnesis_total_questions integer null,
  anamnesis_temp_responses jsonb null default '{}'::jsonb,
  protocol_generation_phase text null,
  protocol_generation_started_at timestamp with time zone null,
  protocol_generation_completed_at timestamp with time zone null,
  protocol_type_determined text null,
  active_protocol_documents jsonb null,
  questionnaire_selection_completed boolean null default false,
  last_message_from text null,
  last_patient_message_at timestamp with time zone null,
  last_clinic_message_at timestamp with time zone null,
  nudge_eligible_since timestamp with time zone null,
  last_nudge_sent_at timestamp with time zone null,
  nudge_attempts integer null default 0,
  last_nudge_attempt_at timestamp with time zone null,
  constraint conversation_state_pkey primary key (id),
  constraint conversation_state_active_anamnesis_response_id_fkey foreign KEY (active_anamnesis_response_id) references anamnesis_responses (id) on delete set null,
  constraint conversation_state_patient_id_fkey foreign KEY (patient_id) references patients (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_active_conversation_per_patient on public.conversation_state using btree (patient_id) TABLESPACE pg_default
where
  (is_active = true);

-- Unique index to support ON CONFLICT in RPC functions
create unique index IF not exists idx_conversation_state_active_patient on public.conversation_state (patient_id) 
where (is_active = true);

create trigger "Protocol Generation Trigger"
after
update on conversation_state for EACH row
execute FUNCTION supabase_functions.http_request (
  'https://n8n-webhook-clients-1.fluxosai.com.br/webhook/protocol-agent',
  'POST',
  '{"Content-type":"application/json"}',
  '{}',
  '5000'
);

create trigger anamnesis_completed_trigger BEFORE
update on conversation_state for EACH row
execute FUNCTION trigger_protocol_generation ();



create table public.anamnesis_responses (
  id uuid not null default gen_random_uuid (),
  patient_id uuid not null,
  created_at timestamp with time zone null default now(),
  questionnaire_type public.anamnesis_type not null,
  response_data jsonb not null,
  source_document_url text null,
  constraint anamnesis_responses_pkey primary key (id),
  constraint anamnesis_responses_patient_id_fkey foreign KEY (patient_id) references patients (id) on delete CASCADE
) TABLESPACE pg_default;




-- Create questions table for each anamnesis type
CREATE TABLE anamnesis_questions (
    id SERIAL PRIMARY KEY,
    anamnesis_type anamnesis_type NOT NULL,
    question_order INTEGER NOT NULL,
    category VARCHAR(50) NOT NULL,
    question_text TEXT NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    question_type VARCHAR(20) NOT NULL, -- 'text', 'yes_no', 'select', 'date', 'number'
    options JSONB, -- For select type questions
    is_required BOOLEAN DEFAULT true,
    validation_rules JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(anamnesis_type, question_order),
    UNIQUE(anamnesis_type, field_name)
);


-- Create simplified routing table
CREATE TABLE agent_routing (
    current_state conversation_status_enum PRIMARY KEY,
    target_agent TEXT NOT NULL,
    description TEXT
);

INSERT INTO agent_routing VALUES
('NEW_CONTACT', 'QA_AGENT', 'Handle initial contact and identification'),
('QUALIFYING', 'QA_AGENT', 'Qualify the lead and determine needs'),
('EXISTING_CLIENT', 'SALES_AGENT', 'Show existing quote to returning client'),
('ANAMNESIS_STARTING', 'ANAMNESIS_AGENT', 'Begin anamnesis collection process'),
('ANAMNESIS_IN_PROGRESS', 'ANAMNESIS_AGENT', 'Handle anamnesis form completion'),
('ANAMNESIS_COMPLETED', 'PROTOCOL_AGENT', 'Process completed anamnesis'),
('GENERATING_PROTOCOL', 'PROTOCOL_AGENT', 'Generate treatment protocol'),
('GENERATING_QUOTE', 'PROTOCOL_AGENT', 'Generate pricing and treatment plan'),
('PENDING_APPROVAL', 'PROTOCOL_AGENT', 'Handle approval workflow'),
('PRESENTING_PLAN', 'SALES_AGENT', 'Present final plan to patient'),
('AWAITING_DECISION', 'SALES_AGENT', 'Handle patient questions and decision'),
('NEGOTIATING', 'SALES_AGENT', 'Negotiate terms and pricing'),
('CONVERTED', 'FOLLOWUP_AGENT', 'Handle post-conversion process'),
('LOST', 'FOLLOWUP_AGENT', 'Handle lost lead process'),
('ESCALATED_TO_HUMAN', 'HUMAN_HANDOFF', 'Transfer to human agent'),
('ON_HOLD', 'QA_AGENT', 'Resume paused conversation');

-- Function to get target agent for current state
CREATE OR REPLACE FUNCTION get_target_agent(state conversation_status_enum)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT target_agent FROM agent_routing WHERE current_state = state);
END;
$$ LANGUAGE plpgsql;

-- Function to get question count for anamnesis type
CREATE OR REPLACE FUNCTION get_anamnesis_question_count(atype anamnesis_type)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM anamnesis_questions WHERE anamnesis_type = atype);
END;
$$ LANGUAGE plpgsql;

-- Function to initialize anamnesis for a patient
CREATE OR REPLACE FUNCTION start_anamnesis(p_patient_id UUID, atype anamnesis_type)
RETURNS VOID AS $$
DECLARE
    question_count INTEGER;
BEGIN
    -- Get total questions for this anamnesis type
    SELECT get_anamnesis_question_count(atype) INTO question_count;
    
    -- Update conversation state
    UPDATE conversation_state 
    SET 
        current_state = 'ANAMNESIS_STARTING',
        anamnesis_type_selected = atype,
        anamnesis_current_question_index = 0,
        anamnesis_total_questions = question_count,
        anamnesis_temp_responses = '{}'::jsonb,
        last_interaction_at = now()
    WHERE patient_id = p_patient_id;
END;
$$ LANGUAGE plpgsql;





-- Create a function to call n8n webhook when anamnesis is completed
CREATE TABLE IF NOT EXISTS webhook_queue (
    id SERIAL PRIMARY KEY,
    webhook_url TEXT NOT NULL,
    payload JSONB NOT NULL,
    headers JSONB DEFAULT '{"Content-Type": "application/json"}'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT now(),
    processed_at TIMESTAMPTZ NULL,
    error_message TEXT NULL
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_webhook_queue_status ON webhook_queue(status, created_at);




create table public.protocols (
  id uuid not null default gen_random_uuid (),
  patient_id uuid null,
  conversation_state_id uuid null,
  relatorio_diagnostico text null,
  plano_tratamento text null,
  protocolo_clinico text null,
  condition_treated text null,
  status text null default 'draft'::text,
  doctor_feedback text null,
  created_at timestamp with time zone null default now(),
  approved_at timestamp with time zone null,
  approved_by uuid null,
  patient_name text null,
  total_sessions text null,
  total_investment text null,
  primary_modality text null,
  raw_agent_response text null,
  ai_validation_agent_score numeric(3, 1) null,
  ai_validation_details jsonb null,
  reviewer_name text null,
  reviewer_status text null,
  reviewer_feedback text null,
  constraint protocols_pkey primary key (id),
  constraint protocols_conversation_state_id_fkey foreign KEY (conversation_state_id) references conversation_state (id),
  constraint protocols_patient_id_fkey foreign KEY (patient_id) references patients (id)
) TABLESPACE pg_default;
-- ### Functions ###







-- Updated trigger function using queue approach
CREATE OR REPLACE FUNCTION trigger_protocol_generation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger if status changed TO anamnesis_completed
    IF NEW.current_state = 'ANAMNESIS_COMPLETED' 
       AND OLD.current_state != 'ANAMNESIS_COMPLETED' THEN
        
        -- Insert webhook request into queue
        INSERT INTO webhook_queue (webhook_url, payload)
        VALUES (
            'https://n8n-webhook-clients-1.fluxosai.com.br/webhook/protocol-agent',
            json_build_object(
                'patient_id', NEW.patient_id,
                'conversation_id', NEW.id,
                'anamnesis_response_id', NEW.active_anamnesis_response_id,
                'timestamp', extract(epoch from now())
            )
        );
        
        -- Update state to indicate protocol generation started
        NEW.current_state := 'GENERATING_PROTOCOL';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;




-- !DEPRECATED

INSERT INTO agent_routing VALUES
('NEW_CONTACT', 'QA_AGENT', 'Handle initial contact and identification'),
('QUALIFYING', 'QA_AGENT', 'Qualify the lead and determine needs'),
('EXISTING_CLIENT', 'SALES_AGENT', 'Show existing quote to returning client'),
('ANAMNESIS_STARTING', 'ANAMNESIS_AGENT', 'Begin anamnesis collection process'),
('ANAMNESIS_IN_PROGRESS', 'ANAMNESIS_AGENT', 'Handle anamnesis form completion'),
('ANAMNESIS_COMPLETED', 'PROTOCOL_AGENT', 'Process completed anamnesis'),
('GENERATING_PROTOCOL', 'PROTOCOL_AGENT', 'Generate treatment protocol'),
('GENERATING_QUOTE', 'PROTOCOL_AGENT', 'Generate pricing and treatment plan'),
('PENDING_APPROVAL', 'PROTOCOL_AGENT', 'Handle approval workflow'),
('PRESENTING_PLAN', 'SALES_AGENT', 'Present final plan to patient'),
('AWAITING_DECISION', 'SALES_AGENT', 'Handle patient questions and decision'),
('NEGOTIATING', 'SALES_AGENT', 'Negotiate terms and pricing'),
('CONVERTED', 'FOLLOWUP_AGENT', 'Handle post-conversion process'),
('LOST', 'FOLLOWUP_AGENT', 'Handle lost lead process'),
('ESCALATED_TO_HUMAN', 'HUMAN_HANDOFF', 'Transfer to human agent'),
('ON_HOLD', 'QA_AGENT', 'Resume paused conversation');



-- !CURRENT

CREATE TYPE conversation_status_enum_v2 AS ENUM (
    'NEW_CONTACT',
    'COLLECTING_PATIENT_BASIC_INFO',
    'QUALIFYING', 
    'QUALIFIED', 
    'EXISTING_CLIENT',
    'ANAMNESIS_STARTING',
    'ANAMNESIS_IN_PROGRESS',
    'ANAMNESIS_COMPLETED',
    'PROTOCOL_GENERATION_STARTED',
    'PROTOCOL_GENERATION_COMPLETED', 
    'PROTOCOL_GENERATION_FAILED',
    'PROTOCOL_PENDING_DOCTORS_APPROVAL',
    'PROTOCOL_APPROVED_BY_DOCTOR',
    'PROTOCOL_SEND_TO_PATIENT'
);



-- First, let's add the new anamnesis types
-- (Run this after creating the new enum values)

-- Clear existing GERAL questions (optional - you may want to keep them)
-- DELETE FROM anamnesis_questions WHERE anamnesis_type = 'GERAL';



-- Create conversation history table with vector embeddings
CREATE TABLE public.conversation_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_state_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('user', 'assistant', 'system')),
  message_content text NOT NULL,
  message_embedding vector(1536), -- OpenAI embeddings are 1536 dimensions
  agent_name text NULL,
  agent_response_data jsonb NULL,
  metadata jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT conversation_history_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_history_conversation_state_id_fkey 
    FOREIGN KEY (conversation_state_id) 
    REFERENCES conversation_state (id) ON DELETE CASCADE,
  CONSTRAINT conversation_history_patient_id_fkey 
    FOREIGN KEY (patient_id) 
    REFERENCES patients (id) ON DELETE CASCADE
);


-- Create HNSW index for fast vector similarity search
CREATE INDEX conversation_history_embedding_idx 
ON conversation_history 
USING hnsw (message_embedding vector_cosine_ops);

-- Create indexes for filtering
CREATE INDEX idx_conversation_history_conversation_state_id 
ON conversation_history (conversation_state_id);

CREATE INDEX idx_conversation_history_patient_id 
ON conversation_history (patient_id);

CREATE INDEX idx_conversation_history_created_at 
ON conversation_history (created_at DESC);

CREATE INDEX idx_conversation_history_message_type 
ON conversation_history (message_type);


-- Function to search conversation history by semantic similarity
CREATE OR REPLACE FUNCTION search_conversation_history(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 10,
  filter_patient_id uuid DEFAULT NULL,
  filter_conversation_state_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  conversation_state_id uuid,
  patient_id uuid,
  message_type text,
  message_content text,
  agent_name text,
  metadata jsonb,
  created_at timestamp with time zone,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ch.id,
    ch.conversation_state_id,
    ch.patient_id,
    ch.message_type,
    ch.message_content,
    ch.agent_name,
    ch.metadata,
    ch.created_at,
    1 - (ch.message_embedding <=> query_embedding) AS similarity
  FROM conversation_history ch
  WHERE 
    (filter_patient_id IS NULL OR ch.patient_id = filter_patient_id)
    AND (filter_conversation_state_id IS NULL OR ch.conversation_state_id = filter_conversation_state_id)
    AND 1 - (ch.message_embedding <=> query_embedding) > match_threshold
  ORDER BY ch.message_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;



-- Function to auto-update anamnesis responses when patient demographics change
CREATE OR REPLACE FUNCTION auto_update_anamnesis_demographics()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if full_name or birth_date actually changed
    IF (OLD.full_name IS DISTINCT FROM NEW.full_name) OR 
       (OLD.birth_date IS DISTINCT FROM NEW.birth_date) THEN
        
        -- Update all existing anamnesis responses for this patient
        UPDATE anamnesis_responses 
        SET response_data = response_data || jsonb_build_object(
            'full_name', NEW.full_name,
            'birth_date', NEW.birth_date::text
        )
        WHERE patient_id = NEW.id
        AND (
            -- Only update if these fields don't exist or are different
            NOT (response_data ? 'full_name') OR 
            NOT (response_data ? 'birth_date') OR
            (response_data->>'full_name' != NEW.full_name) OR
            (response_data->>'birth_date' != NEW.birth_date::text)
        );
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_update_anamnesis_demographics_trigger ON patients;
CREATE TRIGGER auto_update_anamnesis_demographics_trigger
    AFTER UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_anamnesis_demographics();

-- Simplified anamnesis save function (no need to pull from patients table)
CREATE OR REPLACE FUNCTION save_anamnesis_responses_simple(
    p_patient_id UUID,
    p_conversation_state_id UUID,
    p_anamnesis_type anamnesis_type,
    p_temp_responses JSONB
)
RETURNS UUID AS $$
DECLARE
    anamnesis_response_id UUID;
BEGIN
    -- Just save the anamnesis responses as-is
    -- The trigger will handle demographics automatically
    INSERT INTO anamnesis_responses (
        patient_id,
        questionnaire_type,
        response_data
    ) VALUES (
        p_patient_id,
        p_anamnesis_type,
        COALESCE(p_temp_responses, '{}'::jsonb)
    ) RETURNING id INTO anamnesis_response_id;
    
    -- Update conversation state
    UPDATE conversation_state 
    SET 
        current_state = 'ANAMNESIS_COMPLETED',
        active_anamnesis_response_id = anamnesis_response_id,
        anamnesis_temp_responses = '{}'::jsonb,
        last_interaction_at = now()
    WHERE id = p_conversation_state_id;
    
    RETURN anamnesis_response_id;
END;
$$ LANGUAGE plpgsql;




-- questions v3

-- === INSERT questions for SAUDE_MENTAL anamnesis ===
INSERT INTO public.anamnesis_questions (
  anamnesis_type, question_order, category, question_text, field_name, question_type, options, is_required
) VALUES
('SAUDE_MENTAL', 1, 'queixa_principal', 'O que motivou a busca por este tratamento?', 'main_complaint', 'textarea', null, true),
('SAUDE_MENTAL', 2, 'diagnosticos_previos', 'Diagnóstico(s) prévios (se houver):', 'previous_diagnoses', 'multiselect', '["Depressão maior", "Transtorno bipolar tipo I ou II", "Transtorno de ansiedade generalizada", "Transtorno do pânico", "Fobia social", "TOC", "Esquizofrenia ou transtorno esquizoafetivo", "Nenhum / Não diagnosticado", "Outros"]', false),
('SAUDE_MENTAL', 3, 'sintomas', 'Sintomas atuais (últimas 2 semanas ou mais):', 'current_symptoms', 'multiselect', '["Tristeza persistente", "Irritabilidade", "Euforia excessiva", "Perda de interesse/prazer", "Cansaço excessivo", "Oscilação de humor", "Insônia ou sono excessivo", "Apetite alterado", "Perda/ganho de peso", "Preocupação excessiva", "Ataques de pânico", "Medo de julgamento", "Inquietação física", "Pensamentos repetitivos", "Rituais compulsivos", "Dificuldade distinguir realidade", "Pensamentos suicidas", "Agressividade", "Abuso de substâncias"]', false),
('SAUDE_MENTAL', 4, 'historico', 'Qual sua idade no início dos sintomas?', 'age_of_onset', 'number', null, false),
('SAUDE_MENTAL', 5, 'tratamentos', 'Já realizou psicoterapia?', 'psychotherapy_history', 'select', '["Sim", "Não"]', false),
('SAUDE_MENTAL', 6, 'seguranca', 'Você tem epilepsia ou já teve uma convulsão ou um ataque epilético?', 'has_epilepsy_or_seizure', 'select', '["Sim", "Não"]', true),
('SAUDE_MENTAL', 7, 'expectativas', 'O que espera como resultado do tratamento na Bright Brains?', 'treatment_expectation', 'textarea', null, false);

-- === INSERT questions for DOR anamnesis ===
INSERT INTO public.anamnesis_questions (
  anamnesis_type, question_order, category, question_text, field_name, question_type, options, is_required
) VALUES
('DOR', 1, 'inicio_dor', 'Quando a dor começou?', 'pain_start_time', 'select', '["Menos de 3 meses", "Entre 3 e 6 meses", "Entre 6 meses e 2 anos", "Mais de 2 anos"]', true),
('DOR', 2, 'localizacao', 'Localização principal da dor (marque todas que se aplicam):', 'pain_location', 'multiselect', '["Cabeça/face", "Pescoço/coluna cervical", "Costas", "Membros superiores", "Membros inferiores", "Abdome", "Pelve", "Quadril", "Generalizada", "Outros"]', true),
('DOR', 3, 'caracteristica_dor', 'Como você descreveria sua dor?', 'pain_character', 'multiselect', '["Queimação", "Choque", "Facada", "Pressão", "Latejante", "Formigamento", "Cólica", "Difícil de descrever"]', true),
('DOR', 4, 'intensidade', 'Qual a intensidade da sua dor? (0–10)', 'pain_intensity', 'number', null, true),
('DOR', 5, 'fatores_agravantes', 'O que geralmente piora sua dor?', 'pain_worsening_factors', 'multiselect', '["Atividade física", "Estresse", "Posturas", "Movimento específico", "Frio", "Falta de sono", "Ambiente ruidoso", "Outro"]', false),
('DOR', 6, 'doencas_cronicas', 'Você é portador(a) de alguma doença crônica?', 'has_chronic_diseases', 'text', null, false),
('DOR', 7, 'impacto_dor', 'Como a dor afeta suas atividades diárias?', 'daily_life_impact', 'multiselect', '["Dificuldade para dormir", "Limitação para trabalhar", "Dificuldade com lazer", "Tarefas domésticas", "Afeta relacionamentos", "Causa depressão ou ansiedade", "Fadiga excessiva", "Nenhuma alteração significativa"]', false);

-- === INSERT questions for BRAIN_ENHANCEMENT anamnesis ===
INSERT INTO public.anamnesis_questions (
  anamnesis_type, question_order, category, question_text, field_name, question_type, options, is_required
) VALUES
('BRAIN_ENHANCEMENT', 1, 'motivacao', 'Quais são suas principais motivações para buscar neuromodulação?', 'enhancement_goals', 'multiselect', '["Melhora da atenção / foco", "Aumento da memória", "Redução da fadiga mental", "Controle de ansiedade / estresse", "Otimização do desempenho acadêmico", "Potencialização da criatividade", "Melhora da qualidade do sono", "Outras"]', true),
('BRAIN_ENHANCEMENT', 2, 'sono', 'Qualidade do sono:', 'sleep_quality', 'select', '["Boa", "Regular", "Ruim"]', false),
('BRAIN_ENHANCEMENT', 3, 'atividade_fisica', 'Atividade física semanal (descreva a frequência):', 'physical_activity_freq', 'text', null, false),
('BRAIN_ENHANCEMENT', 4, 'alimentacao', 'Como você classificaria sua alimentação?', 'diet_quality', 'select', '["Equilibrada", "Irregular", "Restritiva / Especial"]', false),
('BRAIN_ENHANCEMENT', 5, 'evento_proximo', 'Há um evento próximo que motiva essa busca?', 'upcoming_event', 'text', null, false);





CREATE OR REPLACE FUNCTION append_and_get_history(
    p_conversation_state_id uuid,
    p_patient_id uuid,
    p_message_body text,
    p_sender_id text,
    p_sender_name text
)
RETURNS TABLE (
    message_type text,
    message text,
    agent_name text,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANT: Allows the function to perform inserts/updates
AS $$
BEGIN
    -- 1. Insert the human message
    INSERT INTO conversation_history (conversation_state_id, patient_id, message_type, message, metadata)
    VALUES (p_conversation_state_id, p_patient_id, 'human', p_message_body, jsonb_build_object('phone_number', p_sender_id, 'patient_name', p_sender_name));

    -- 2. Update conversation state
    UPDATE conversation_state
    SET 
        last_message_from = 'user',
        last_interaction_at = NOW()
    WHERE patient_id = p_patient_id;

    -- 3. Return the last 10 messages
    RETURN QUERY
    SELECT 
        ch.message_type,
        ch.message,
        ch.agent_name,
        ch.created_at
    FROM conversation_history ch
    WHERE ch.conversation_state_id = p_conversation_state_id
    ORDER BY ch.created_at DESC
    LIMIT 10;
END;
$$;

-- =================================================================
-- Function: get_anamnesis_questions_cached
-- Fetches anamnesis questions with metadata for caching
-- =================================================================
CREATE OR REPLACE FUNCTION get_anamnesis_questions_cached(
    p_anamnesis_type TEXT
) RETURNS JSONB AS $$
DECLARE
    v_questions JSONB;
BEGIN
    -- Fetch all questions for this type, ordered
    SELECT 
        jsonb_build_object(
            'questions', COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'anamnesis_type', anamnesis_type,
                    'question_order', question_order,
                    'category', category,
                    'question_text', question_text,
                    'field_name', field_name,
                    'question_type', question_type,
                    'options', options,
                    'is_required', is_required,
                    'validation_rules', validation_rules
                ) ORDER BY question_order
            ), '[]'::jsonb),
            'total_count', COUNT(*),
            'anamnesis_type', p_anamnesis_type,
            'fetched_at', NOW()
        )
    INTO v_questions
    FROM anamnesis_questions
    WHERE anamnesis_type = p_anamnesis_type;
    
    RETURN v_questions;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- Function: process_anamnesis_agent_response
-- Processes anamnesis agent output and updates state
-- =================================================================
CREATE OR REPLACE FUNCTION process_anamnesis_agent_response(
    p_platform_user_id UUID,
    p_patient_id UUID,
    p_agent_output JSONB
) RETURNS JSONB AS $$
DECLARE
    v_is_complete BOOLEAN := FALSE;
    v_next_milestone TEXT := NULL;
BEGIN
    -- Check if anamnesis is complete
    v_is_complete := COALESCE((p_agent_output->>'is_complete')::BOOLEAN, FALSE);
    
    -- If complete, return milestone transition signal
    IF v_is_complete THEN
        v_next_milestone := 'ANAMNESIS_COMPLETED';
        
        -- Update conversation state to mark anamnesis as complete
        -- Use patient_id + is_active to ensure we only update ONE row (unique index guarantee)
        -- This prevents "query returned more than one row" error
        UPDATE conversation_state
        SET 
            current_state = 'ANAMNESIS_COMPLETED',
            anamnesis_temp_responses = '{}'::jsonb,
            updated_at = NOW()
        WHERE patient_id = p_patient_id AND is_active = true;
    END IF;
    
    -- Return transition signal with client state updates for FluxOS
    RETURN jsonb_build_object(
        'success', TRUE,
        'should_transition', v_is_complete,
        'next_milestone', v_next_milestone,
        'patient_id', p_patient_id,  -- Return for webhook call
        'client_state_updates', jsonb_build_object(
            'anamnesis_completed', v_is_complete,
            'patient_id', p_patient_id
        )
    );
END;
$$ LANGUAGE plpgsql;




-- =================================================================
-- BRIGHT PRECISION — ASSESSMENT PORTAL TABLES
-- Product #1: Web-based mental health assessment portal
-- These tables are LIVE in production (bright-brains Supabase project)
-- =================================================================

-- Primary table storing all completed assessments
CREATE TABLE public.mental_health_evaluations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_name text NULL,
  patient_email text NULL,
  patient_cpf text NULL,
  patient_phone text NULL,
  patient_birth_date text NULL,
  patient_sex text NULL,
  -- Profile determines which assessment form was used
  patient_profile text NULL, -- 'adulto' | 'infantil' | 'neuro' | 'executivo' | 'longevidade'
  form_data jsonb NULL,       -- ~86 fields from the assessment form
  scores jsonb NULL,          -- Computed clinical scale scores
  status text NULL,           -- 'pending' | 'processing' | 'completed' | 'error' | etc.
  doctor_uploads jsonb NULL,  -- Array of { name, url, type, path, uploaded_at }
  extracted_documents_text text NULL, -- Cached extracted text from uploaded docs
  report_stage1 text NULL,    -- Intermediate LLM output (Stage 1)
  report_markdown text NULL,  -- Final combined markdown report
  report_pdf_url text NULL,   -- Public URL of generated PDF in Storage
  report_history jsonb NULL,  -- Array of { report_markdown, report_pdf_url, generated_at }
  reviewer_status text NULL,  -- 'pending_review' | 'approved' | 'rejected'
  reviewer_notes text NULL,
  approved_at timestamp with time zone NULL,
  approved_by text NULL,
  form_data_history jsonb NULL, -- Audit log of form edits
  processing_error text NULL,
  processing_logs jsonb NULL,   -- Array of { t: timestamp_ms, m: message }
  created_at timestamp with time zone NULL DEFAULT now(),

  -- === B2B DASHBOARD COLUMNS (Migration — Phase 1 of Product #2) ===
  -- Populated when a company access code was used at the assessment gate
  company_id uuid NULL,           -- FK → companies.id (NULL for non-B2B assessments)
  employee_department text NULL,  -- Department at time of assessment
  cycle_id uuid NULL,             -- FK → assessment_cycles.id (NULL for non-B2B)

  CONSTRAINT mental_health_evaluations_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Storage bucket: assessment-pdfs
-- Upload path:  uploads/pending/{uuid}/{timestamp}.{ext}
-- Report PDFs:  report_{evaluationId}_{timestamp}.pdf


-- Patient-facing access codes (gate for /{locale}/avaliacao)
-- Non-B2B: any active code works for any patient
-- B2B: code is also tracked in company_access_codes and stamped onto the evaluation
CREATE TABLE public.avaliacao_codigo (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  codigo_verificacao text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT avaliacao_codigo_pkey PRIMARY KEY (id),
  CONSTRAINT avaliacao_codigo_codigo_verificacao_key UNIQUE (codigo_verificacao)
) TABLESPACE pg_default;


-- Doctor/portal access codes (gate for /{locale}/portal)
-- Codes with label LIKE '%Portal%' grant doctor portal access
CREATE TABLE public.assessment_access_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  label text NULL,   -- Must contain 'Portal' to grant portal access
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT assessment_access_codes_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_access_codes_code_key UNIQUE (code)
) TABLESPACE pg_default;




-- =================================================================
-- B2B COMPANY DASHBOARD — NEW TABLES
-- Product #2: Company HR dashboard (Bright Precision B2B)
-- Status: PENDING MIGRATION — not yet applied in production
-- =================================================================

-- One row per client company
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  -- NR-1 compliance — set manually by Bright Brains admin
  gro_issued_at timestamp with time zone NULL,
  gro_valid_until timestamp with time zone NULL,
  -- NR-1 required documents config: array of {slug,name,legal_deadline_days}
  -- consumed by alerts/route.ts (nr1_docs_missing rule). Default [] until populated.
  nr1_required_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT companies_pkey PRIMARY KEY (id),
  CONSTRAINT companies_cnpj_key UNIQUE (cnpj)
) TABLESPACE pg_default;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS nr1_required_documents jsonb NOT NULL DEFAULT '[]'::jsonb;


-- Semiannual assessment cycles per company (e.g. "Jan–Jun 2026")
CREATE TABLE public.assessment_cycles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  label text NOT NULL,      -- e.g. 'Jan–Jun 2026'
  starts_at date NOT NULL,
  ends_at date NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT assessment_cycles_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_cycles_company_id_fkey
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Enforce only one active cycle per company at a time
CREATE UNIQUE INDEX idx_assessment_cycles_one_current_per_company
  ON assessment_cycles (company_id)
  WHERE is_current = true;


-- Links Supabase Auth users to a company (invite-only, created by Bright Brains admin)
CREATE TABLE public.company_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,    -- FK → auth.users.id
  company_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'hr', -- 'hr' is the only role for MVP
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT company_users_pkey PRIMARY KEY (id),
  CONSTRAINT company_users_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT company_users_company_id_fkey
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
  CONSTRAINT company_users_user_id_key UNIQUE (user_id) -- one company per HR user (MVP)
) TABLESPACE pg_default;

ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR user sees own row"
  ON public.company_users FOR SELECT
  USING (auth.uid() = user_id);


-- B2B access codes distributed to company employees for their assessments
-- HR shares the full URL (/avaliacao?c=CODE), not the raw code.
-- Separate from avaliacao_codigo (open) and assessment_access_codes (portal/doctor)
CREATE TABLE public.company_access_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  cycle_id uuid NULL,                  -- FK → assessment_cycles.id
  code text NOT NULL,
  department text NULL,                -- e.g. 'Engenharia', 'RH & Adm'
  -- Optional: pre-assign a specific employee to this code at generation time
  employee_email text NULL,            -- also written by pre-registration step if not pre-assigned
  -- Completion tracking
  started_at timestamp with time zone NULL,  -- set when employee submits the pre-registration step
  used_at timestamp with time zone NULL,     -- set on assessment submit
  used_by_evaluation_id uuid NULL,           -- FK → mental_health_evaluations.id
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT company_access_codes_pkey PRIMARY KEY (id),
  CONSTRAINT company_access_codes_code_key UNIQUE (code),
  CONSTRAINT company_access_codes_company_id_fkey
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
  CONSTRAINT company_access_codes_cycle_id_fkey
    FOREIGN KEY (cycle_id) REFERENCES assessment_cycles (id) ON DELETE SET NULL,
  CONSTRAINT company_access_codes_used_by_evaluation_id_fkey
    FOREIGN KEY (used_by_evaluation_id) REFERENCES mental_health_evaluations (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Index to look up completion status quickly (started but not used = dropout)
CREATE INDEX idx_company_access_codes_started_not_used
  ON company_access_codes (company_id)
  WHERE started_at IS NOT NULL AND used_at IS NULL;


-- Foreign key constraints to add to mental_health_evaluations as part of the B2B migration
-- (Run after companies + assessment_cycles tables are created)
ALTER TABLE public.mental_health_evaluations
  ADD CONSTRAINT mental_health_evaluations_company_id_fkey
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE SET NULL;

ALTER TABLE public.mental_health_evaluations
  ADD CONSTRAINT mental_health_evaluations_cycle_id_fkey
    FOREIGN KEY (cycle_id) REFERENCES assessment_cycles (id) ON DELETE SET NULL;


-- =================================================================
-- NR-1 REALIGNMENT — Phase 1 Database Changes
-- Applied 2026-04-27
-- =================================================================

-- === NR-1 columns on mental_health_evaluations ===
-- Identification
ALTER TABLE mental_health_evaluations
  ADD COLUMN IF NOT EXISTS nr1_role TEXT,
  ADD COLUMN IF NOT EXISTS nr1_work_time TEXT;

-- Physical environment (1–5 Likert)
ALTER TABLE mental_health_evaluations
  ADD COLUMN IF NOT EXISTS noise_level SMALLINT,
  ADD COLUMN IF NOT EXISTS temperature_level SMALLINT,
  ADD COLUMN IF NOT EXISTS lighting_level SMALLINT,
  ADD COLUMN IF NOT EXISTS vibration_level SMALLINT,
  ADD COLUMN IF NOT EXISTS humidity_level SMALLINT;

-- Chemical & biological exposures
ALTER TABLE mental_health_evaluations
  ADD COLUMN IF NOT EXISTS chemical_exposures TEXT[],
  ADD COLUMN IF NOT EXISTS chemical_details TEXT,
  ADD COLUMN IF NOT EXISTS biological_exposures TEXT[],
  ADD COLUMN IF NOT EXISTS biological_details TEXT;

-- Ergonomic factors (1–5 Likert)
ALTER TABLE mental_health_evaluations
  ADD COLUMN IF NOT EXISTS posture_level SMALLINT,
  ADD COLUMN IF NOT EXISTS repetition_level SMALLINT,
  ADD COLUMN IF NOT EXISTS manual_force_level SMALLINT,
  ADD COLUMN IF NOT EXISTS breaks_level SMALLINT,
  ADD COLUMN IF NOT EXISTS screen_level SMALLINT,
  ADD COLUMN IF NOT EXISTS mobility_level SMALLINT;

-- Psychosocial & organizational (1–5 Likert)
ALTER TABLE mental_health_evaluations
  ADD COLUMN IF NOT EXISTS cognitive_effort_level SMALLINT,
  ADD COLUMN IF NOT EXISTS workload_level SMALLINT,
  ADD COLUMN IF NOT EXISTS pace_level SMALLINT,
  ADD COLUMN IF NOT EXISTS autonomy_level SMALLINT,
  ADD COLUMN IF NOT EXISTS leadership_level SMALLINT,
  ADD COLUMN IF NOT EXISTS relationships_level SMALLINT,
  ADD COLUMN IF NOT EXISTS recognition_level SMALLINT,
  ADD COLUMN IF NOT EXISTS clarity_level SMALLINT,
  ADD COLUMN IF NOT EXISTS balance_level SMALLINT;

-- Violence & harassment (1–5 Likert)
ALTER TABLE mental_health_evaluations
  ADD COLUMN IF NOT EXISTS violence_level SMALLINT,
  ADD COLUMN IF NOT EXISTS harassment_level SMALLINT;

-- Accident / near-miss / work disease flags
ALTER TABLE mental_health_evaluations
  ADD COLUMN IF NOT EXISTS had_accident BOOLEAN,
  ADD COLUMN IF NOT EXISTS accident_description TEXT,
  ADD COLUMN IF NOT EXISTS had_near_miss BOOLEAN,
  ADD COLUMN IF NOT EXISTS near_miss_description TEXT,
  ADD COLUMN IF NOT EXISTS had_work_disease BOOLEAN,
  ADD COLUMN IF NOT EXISTS work_disease_description TEXT;

-- Satisfaction & open-text
ALTER TABLE mental_health_evaluations
  ADD COLUMN IF NOT EXISTS satisfaction_level SMALLINT,
  ADD COLUMN IF NOT EXISTS biggest_risk TEXT,
  ADD COLUMN IF NOT EXISTS suggestion TEXT;

-- AI-computed domain scores (0.00–1.00)
ALTER TABLE mental_health_evaluations
  ADD COLUMN IF NOT EXISTS score_physical NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS score_ergonomic NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS score_psychosocial NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS score_violence NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS score_overall NUMERIC(3,2);

-- Assessment type discriminator
ALTER TABLE mental_health_evaluations
  ADD COLUMN IF NOT EXISTS assessment_kind TEXT DEFAULT 'nr1';

ALTER TABLE mental_health_evaluations
  ADD CONSTRAINT mental_health_evaluations_assessment_kind_check
  CHECK (assessment_kind IN ('nr1', 'insights', 'clinical'));

-- Updated report_type to include 'nr1'
ALTER TABLE mental_health_evaluations DROP CONSTRAINT IF EXISTS mental_health_evaluations_report_type_check;
ALTER TABLE mental_health_evaluations ADD CONSTRAINT mental_health_evaluations_report_type_check
  CHECK (report_type IN ('clinical', 'b2b-laudo', 'nr1'));

-- Indexes for NR-1 queries
CREATE INDEX IF NOT EXISTS idx_mhe_assessment_kind
  ON mental_health_evaluations(assessment_kind)
  WHERE assessment_kind = 'nr1';

CREATE INDEX IF NOT EXISTS idx_mhe_company_cycle_kind
  ON mental_health_evaluations(company_id, cycle_id, assessment_kind);


-- === Feature flag on companies ===
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS bright_insights_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN companies.bright_insights_enabled
  IS 'Feature flag: when true, NR-1 form appends clinical scales and dashboard shows Insights tab';


-- === Anonymous harassment reports ===
CREATE TABLE IF NOT EXISTS harassment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES assessment_cycles(id),
  department TEXT,
  description TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'harassment',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backfill + constraint for existing deployments
ALTER TABLE harassment_reports
  ADD COLUMN IF NOT EXISTS report_type TEXT NOT NULL DEFAULT 'harassment';
UPDATE harassment_reports SET report_type = 'harassment' WHERE report_type IS NULL;
ALTER TABLE harassment_reports DROP CONSTRAINT IF EXISTS harassment_reports_report_type_check;
ALTER TABLE harassment_reports
  ADD CONSTRAINT harassment_reports_report_type_check
  CHECK (report_type IN ('harassment', 'general'));

COMMENT ON TABLE harassment_reports
  IS 'Anonymous reports from the NR-1 questionnaire. No employee_id, no assessment_id — anonymity is structural. report_type discriminates: harassment (from AcidentesStep) or general (from DenunciaAnonimaStep).';

CREATE INDEX IF NOT EXISTS idx_harassment_reports_company
  ON harassment_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_harassment_reports_cycle
  ON harassment_reports(cycle_id);
CREATE INDEX IF NOT EXISTS idx_harassment_reports_type
  ON harassment_reports(report_type);

ALTER TABLE harassment_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY harassment_reports_insert_policy
  ON harassment_reports FOR INSERT WITH CHECK (true);

CREATE POLICY harassment_reports_select_policy
  ON harassment_reports FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );


-- === b2b_events: expanded event_type constraint ===
ALTER TABLE b2b_events DROP CONSTRAINT IF EXISTS b2b_events_event_type_check;
ALTER TABLE b2b_events ADD CONSTRAINT b2b_events_event_type_check
  CHECK (event_type IN ('afastamento', 'relato_canal', 'acidente', 'incidente', 'near_miss', 'work_disease', 'atestado', 'outro'));