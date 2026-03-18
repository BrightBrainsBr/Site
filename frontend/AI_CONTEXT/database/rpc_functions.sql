-- Bright Brains RPC Functions
-- Purpose: Atomic database operations for Bright Brains agents
-- These functions live in the Bright Brains Supabase database

-- =================================================================
-- Function: get_full_context (Generic name for FluxOS to call)
-- Alias for get_full_patient_context
-- =================================================================
CREATE OR REPLACE FUNCTION get_full_context(
    p_platform_user_id UUID
) RETURNS JSONB AS $$
BEGIN
    RETURN get_full_patient_context(p_platform_user_id);
END;
$$ LANGUAGE plpgsql;

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
        UPDATE conversation_state
        SET 
            current_state = 'ANAMNESIS_COMPLETED',
            anamnesis_temp_responses = '{}'::jsonb,
            updated_at = NOW()
        WHERE patient_id = p_patient_id AND is_active = true;
    END IF;
    
    -- Return transition signal
    RETURN jsonb_build_object(
        'success', TRUE,
        'should_transition', v_is_complete,
        'next_milestone', v_next_milestone,
        'patient_id', p_patient_id  -- Return for webhook call
    );
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- Function: get_full_patient_context
-- Fetches complete patient context in single atomic operation
-- =================================================================
CREATE OR REPLACE FUNCTION get_full_patient_context(
    p_platform_user_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_patient_id UUID;
BEGIN
    -- Get patient ID
    SELECT id INTO v_patient_id
    FROM patients
    WHERE platform_user_id = p_platform_user_id;
    
    -- Build complete context
    SELECT jsonb_build_object(
        'patient', (
            SELECT to_jsonb(p.*) 
            FROM patients p 
            WHERE p.platform_user_id = p_platform_user_id
        ),
        'conversation_state', (
            SELECT to_jsonb(cs.*)
            FROM conversation_state cs
            WHERE cs.platform_user_id = p_platform_user_id
            ORDER BY cs.created_at DESC
            LIMIT 1
        ),
        'recent_anamnesis', (
            SELECT COALESCE(jsonb_agg(ar.*), '[]'::jsonb)
            FROM (
                SELECT * FROM anamnesis_responses
                WHERE patient_id = v_patient_id
                ORDER BY created_at DESC
                LIMIT 10
            ) ar
        ),
        'protocol_count', (
            SELECT COUNT(*)
            FROM protocols
            WHERE patient_id = v_patient_id
        )
    ) INTO v_result;
    
    RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

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
        UPDATE conversation_state
        SET 
            current_state = 'ANAMNESIS_COMPLETED',
            anamnesis_temp_responses = '{}'::jsonb,
            updated_at = NOW()
        WHERE patient_id = p_patient_id AND is_active = true;
    END IF;
    
    -- Return transition signal
    RETURN jsonb_build_object(
        'success', TRUE,
        'should_transition', v_is_complete,
        'next_milestone', v_next_milestone,
        'patient_id', p_patient_id  -- Return for webhook call
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_full_patient_context IS 
'Fetches complete patient context including profile, conversation state, and recent anamnesis in single atomic operation';

-- =================================================================
-- Function: process_qa_agent_response
-- Processes QA agent output and updates patient/conversation state
-- Returns transition signals for FluxOS workflow orchestration
-- =================================================================
CREATE OR REPLACE FUNCTION process_qa_agent_response(
    p_platform_user_id UUID,
    p_agent_output JSONB,
    p_whatsapp_number TEXT DEFAULT NULL  -- NEW: Get WhatsApp from FluxOS
) RETURNS JSONB AS $$
DECLARE
    v_patient_id UUID;
    v_should_transition BOOLEAN := FALSE;
    v_next_milestone TEXT := NULL;
    v_has_name BOOLEAN := FALSE;
    v_has_dob BOOLEAN := FALSE;
    v_has_condition BOOLEAN := FALSE;
    v_extracted_data JSONB;
    v_existing_anamnesis_type TEXT;
    v_full_name TEXT;
    v_birth_date DATE;
    v_full_name_str TEXT;
    v_birth_date_str TEXT;
BEGIN
    -- Extract data from agent output
    v_extracted_data := COALESCE(p_agent_output->'extracted_data', '{}'::jsonb);
    
    -- 🔥 CRITICAL FIX: Properly handle NULL/empty values from LLM
    -- LLM might return: null, "", "null", or missing key
    -- We need to normalize all of these to NULL for database
    
    -- Extract full_name and normalize to NULL if empty/null
    v_full_name_str := v_extracted_data->>'full_name';
    IF v_full_name_str IS NULL OR v_full_name_str = '' OR LOWER(TRIM(v_full_name_str)) = 'null' THEN
        v_full_name := NULL;
    ELSE
        v_full_name := TRIM(v_full_name_str);
    END IF;
    
    -- Extract birth_date and normalize to NULL if empty/null/invalid
    v_birth_date_str := v_extracted_data->>'birth_date';
    IF v_birth_date_str IS NULL OR v_birth_date_str = '' OR LOWER(TRIM(v_birth_date_str)) = 'null' THEN
        v_birth_date := NULL;
    ELSE
        -- Try to cast to date, if fails set to NULL
        BEGIN
            v_birth_date := (v_birth_date_str)::date;
        EXCEPTION WHEN OTHERS THEN
            -- Invalid date format, set to NULL
            v_birth_date := NULL;
        END;
    END IF;
    
    -- Get existing anamnesis_type before update (will be null if first time)
    SELECT anamnesis_type_selected::TEXT INTO v_existing_anamnesis_type
    FROM conversation_state
    WHERE platform_user_id = p_platform_user_id AND is_active = true;
    
    -- UPSERT patient (ALWAYS update if exists, never conflict)
    -- Use ACTUAL WhatsApp number from FluxOS, not 'UNKNOWN'
    INSERT INTO patients (
        platform_user_id, 
        whatsapp_number,
        full_name,
        birth_date,
        created_at, 
        updated_at
    )
    VALUES (
        p_platform_user_id, 
        COALESCE(
            NULLIF(p_whatsapp_number, ''),
            NULLIF(v_extracted_data->>'whatsapp_number', ''),
            NULLIF(v_extracted_data->>'whatsapp_number', 'null')
        ),
        v_full_name,  -- Use normalized value (NULL if empty/invalid)
        v_birth_date,  -- Use normalized value (NULL if empty/invalid)
        NOW(), 
        NOW()
    )
    ON CONFLICT (platform_user_id) 
    DO UPDATE SET
        -- 🔥 CRITICAL FIX: Only update if new value is NOT NULL
        -- This prevents overwriting existing data with NULL values
        full_name = CASE 
            WHEN v_full_name IS NOT NULL THEN v_full_name
            ELSE patients.full_name  -- Keep existing value if new is NULL
        END,
        birth_date = CASE 
            WHEN v_birth_date IS NOT NULL THEN v_birth_date
            ELSE patients.birth_date  -- Keep existing value if new is NULL
        END,
        -- Always update whatsapp_number if we have a new value and old one is NULL/empty/UNKNOWN
        whatsapp_number = COALESCE(
            NULLIF(p_whatsapp_number, ''),  -- Use FluxOS WhatsApp number first
            NULLIF(v_extracted_data->>'whatsapp_number', ''),  -- Then extracted WhatsApp
            NULLIF(v_extracted_data->>'whatsapp_number', 'null'),  -- Handle "null" string
            NULLIF(patients.whatsapp_number, 'UNKNOWN'),  -- Otherwise keep old unless it's 'UNKNOWN'
            patients.whatsapp_number  -- Final fallback
        ),
        updated_at = NOW()
    RETURNING id INTO v_patient_id;
    
    -- Update or create conversation state
    -- NOTE: Requires unique index: idx_conversation_state_active_patient on (patient_id) WHERE is_active = true
    INSERT INTO conversation_state (
        platform_user_id,
        patient_id,
        is_active,
        last_interaction_at,
        anamnesis_type_selected
    )
    VALUES (
        p_platform_user_id,
        v_patient_id,
        true,
        NOW(),
        CASE 
            WHEN p_agent_output->>'anamnesis_type' IS NOT NULL AND p_agent_output->>'anamnesis_type' != ''
            THEN (p_agent_output->>'anamnesis_type')::anamnesis_type
            ELSE NULL
        END
    )
    ON CONFLICT (patient_id) WHERE is_active = true
    DO UPDATE SET
        last_interaction_at = NOW(),
        last_clinic_message_at = NOW(),
        -- Update anamnesis_type only if provided and not null/empty
        anamnesis_type_selected = CASE
            WHEN EXCLUDED.anamnesis_type_selected IS NOT NULL
            THEN EXCLUDED.anamnesis_type_selected
            ELSE conversation_state.anamnesis_type_selected
        END;
    
    -- Check if agent explicitly requested a transition
    -- CRITICAL: Block state transitions if we're already in a PROTOCOL_* state
    -- Protocol states are MANAGED BY N8N and should NEVER be changed by QA agent
    IF p_agent_output ? 'next_milestone' AND (p_agent_output->>'should_update_state')::BOOLEAN = TRUE THEN
        -- Check if next_milestone is null or empty - if so, don't transition
        IF p_agent_output->>'next_milestone' IS NULL OR p_agent_output->>'next_milestone' = '' THEN
            v_should_transition := FALSE;
            v_next_milestone := NULL;
        ELSE
            -- Agent explicitly requested transition - RESPECT IT!
            v_should_transition := TRUE;
            v_next_milestone := p_agent_output->>'next_milestone';
        END IF;
    ELSE
        -- Fallback: Check transition conditions based on actual columns
        SELECT 
            (full_name IS NOT NULL) AS has_name,
            (birth_date IS NOT NULL) AS has_dob,
            FALSE AS has_condition  -- We don't have main_condition column yet
        INTO v_has_name, v_has_dob, v_has_condition
        FROM patients
        WHERE id = v_patient_id;
        
        -- Determine next milestone based on data collected
        IF v_has_name AND v_has_dob AND NOT v_has_condition THEN
            -- Has basic info, move to QUALIFYING
            v_should_transition := TRUE;
            v_next_milestone := 'QUALIFYING';
        ELSIF v_has_name AND v_has_dob AND v_has_condition THEN
            -- Has all info including condition, move to QUALIFIED
            v_should_transition := TRUE;
            v_next_milestone := 'QUALIFIED';
        END IF;
    END IF;
    
    -- Return result with transition signals AND client state for FluxOS
    -- NOTE: main_condition is stored in FluxOS client_state, not in our DB
    -- We only preserve anamnesis_type_selected from our conversation_state
    RETURN jsonb_build_object(
        'success', TRUE,
        'patient_id', v_patient_id,
        'should_transition', v_should_transition,
        'next_milestone', v_next_milestone,
        'client_state_updates', jsonb_build_object(
            'patient_id', v_patient_id,
            'anamnesis_type', COALESCE(
                NULLIF(p_agent_output->>'anamnesis_type', ''),
                v_existing_anamnesis_type
            ),
            'main_condition', p_agent_output->>'main_condition',
            'conversation_state_id', (SELECT id FROM conversation_state WHERE patient_id = v_patient_id AND is_active = true)
        ),
        'data_collected', jsonb_build_object(
            'has_name', v_has_name,
            'has_dob', v_has_dob,
            'has_condition', v_has_condition
        ),
        'chain_next_agent', CASE
            WHEN v_next_milestone = 'ANAMNESIS_STARTING' THEN TRUE
            ELSE FALSE
        END,
        'extracted_data', jsonb_build_object(
            'full_name', (SELECT full_name FROM patients WHERE id = v_patient_id),
            'birth_date', (SELECT birth_date FROM patients WHERE id = v_patient_id),
            'client_specific_data', jsonb_build_object(
                'anamnesis_type', COALESCE(
                    NULLIF(p_agent_output->>'anamnesis_type', ''),
                    v_existing_anamnesis_type
                ),
                'main_condition', p_agent_output->>'main_condition'
            )
        )
    );
END;
$$ LANGUAGE plpgsql;

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
        UPDATE conversation_state
        SET 
            current_state = 'ANAMNESIS_COMPLETED',
            anamnesis_temp_responses = '{}'::jsonb,
            updated_at = NOW()
        WHERE patient_id = p_patient_id AND is_active = true;
    END IF;
    
    -- Return transition signal
    RETURN jsonb_build_object(
        'success', TRUE,
        'should_transition', v_is_complete,
        'next_milestone', v_next_milestone,
        'patient_id', p_patient_id  -- Return for webhook call
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_qa_agent_response IS 
'Processes QA agent output, updates patient/conversation state atomically, and returns transition signals for workflow orchestration';

-- =================================================================
-- Function: get_anamnesis_context
-- Fetches anamnesis-specific context for Anamnesis agent
-- =================================================================
CREATE OR REPLACE FUNCTION get_anamnesis_context(
    p_patient_id UUID,
    p_anamnesis_type TEXT DEFAULT 'SAUDE_MENTAL'
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'patient', (
            SELECT to_jsonb(p.*)
            FROM patients p
            WHERE p.id = p_patient_id
        ),
        'anamnesis_type', p_anamnesis_type,
        'existing_responses', (
            SELECT COALESCE(jsonb_agg(ar.*), '[]'::jsonb)
            FROM anamnesis_responses ar
            WHERE ar.patient_id = p_patient_id
              AND ar.anamnesis_type = p_anamnesis_type
            ORDER BY ar.created_at ASC
        ),
        'total_questions', (
            SELECT COUNT(*)
            FROM anamnesis_questions
            WHERE anamnesis_type = p_anamnesis_type
        ),
        'answered_questions', (
            SELECT COUNT(DISTINCT question_id)
            FROM anamnesis_responses
            WHERE patient_id = p_patient_id
              AND anamnesis_type = p_anamnesis_type
        )
    ) INTO v_result;
    
    RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

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
        UPDATE conversation_state
        SET 
            current_state = 'ANAMNESIS_COMPLETED',
            anamnesis_temp_responses = '{}'::jsonb,
            updated_at = NOW()
        WHERE patient_id = p_patient_id AND is_active = true;
    END IF;
    
    -- Return transition signal
    RETURN jsonb_build_object(
        'success', TRUE,
        'should_transition', v_is_complete,
        'next_milestone', v_next_milestone,
        'patient_id', p_patient_id  -- Return for webhook call
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_anamnesis_context IS 
'Fetches anamnesis context including patient info, existing responses, and progress tracking';

-- =================================================================
-- Function: save_anamnesis_progress
-- Saves anamnesis responses and updates progress
-- =================================================================
CREATE OR REPLACE FUNCTION save_anamnesis_progress(
    p_patient_id UUID,
    p_agent_output JSONB
) RETURNS JSONB AS $$
DECLARE
    v_anamnesis_type TEXT;
    v_response_count INT := 0;
    v_total_questions INT;
    v_completion_percentage INT;
    v_is_complete BOOLEAN := FALSE;
BEGIN
    -- Extract anamnesis type from agent output or patient data
    SELECT profile_data->>'anamnesis_type' INTO v_anamnesis_type
    FROM patients
    WHERE id = p_patient_id;
    
    v_anamnesis_type := COALESCE(v_anamnesis_type, 'SAUDE_MENTAL');
    
    -- Save anamnesis responses if provided
    IF p_agent_output ? 'anamnesis_responses' THEN
        -- Insert each response
        INSERT INTO anamnesis_responses (
            patient_id,
            anamnesis_type,
            question_text,
            response_text,
            metadata,
            created_at
        )
        SELECT
            p_patient_id,
            v_anamnesis_type,
            resp->>'question',
            resp->>'answer',
            resp->'metadata',
            NOW()
        FROM jsonb_array_elements(p_agent_output->'anamnesis_responses') AS resp;
        
        GET DIAGNOSTICS v_response_count = ROW_COUNT;
    END IF;
    
    -- Calculate completion percentage
    SELECT COUNT(*) INTO v_total_questions
    FROM anamnesis_questions
    WHERE anamnesis_type = v_anamnesis_type;
    
    SELECT 
        CASE 
            WHEN v_total_questions > 0 
            THEN (COUNT(DISTINCT question_id)::FLOAT / v_total_questions * 100)::INT
            ELSE 0
        END
    INTO v_completion_percentage
    FROM anamnesis_responses
    WHERE patient_id = p_patient_id
      AND anamnesis_type = v_anamnesis_type;
    
    -- Check if complete
    v_is_complete := (v_completion_percentage >= 100) OR 
                     (p_agent_output->>'is_complete')::BOOLEAN;
    
    -- Update conversation state
    UPDATE conversation_state
    SET 
        state_data = state_data || jsonb_build_object(
            'anamnesis_progress', v_completion_percentage,
            'anamnesis_complete', v_is_complete,
            'last_update', NOW()
        ),
        updated_at = NOW()
    WHERE platform_user_id = (
        SELECT platform_user_id FROM patients WHERE id = p_patient_id
    );
    
    -- Return result
    RETURN jsonb_build_object(
        'success', TRUE,
        'responses_saved', v_response_count,
        'completion_percentage', v_completion_percentage,
        'is_complete', v_is_complete,
        'should_transition', v_is_complete,
        'next_milestone', CASE WHEN v_is_complete THEN 'ANAMNESIS_COMPLETED' ELSE NULL END
    );
END;
$$ LANGUAGE plpgsql;

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
        UPDATE conversation_state
        SET 
            current_state = 'ANAMNESIS_COMPLETED',
            anamnesis_temp_responses = '{}'::jsonb,
            updated_at = NOW()
        WHERE patient_id = p_patient_id AND is_active = true;
    END IF;
    
    -- Return transition signal
    RETURN jsonb_build_object(
        'success', TRUE,
        'should_transition', v_is_complete,
        'next_milestone', v_next_milestone,
        'patient_id', p_patient_id  -- Return for webhook call
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION save_anamnesis_progress IS 
'Saves anamnesis responses, calculates progress, and returns completion status for workflow orchestration';

-- =================================================================
-- Function: save_protocol_draft
-- Saves protocol draft generated by protocol generation agent
-- =================================================================
CREATE OR REPLACE FUNCTION save_protocol_draft(
    p_patient_id UUID,
    p_protocol_data JSONB
) RETURNS JSONB AS $$
DECLARE
    v_protocol_id UUID;
BEGIN
    -- Insert protocol
    INSERT INTO protocols (
        patient_id,
        protocol_type,
        protocol_data,
        status,
        created_at,
        updated_at
    )
    VALUES (
        p_patient_id,
        COALESCE(p_protocol_data->>'protocol_type', 'TMS'),
        p_protocol_data,
        'PENDING_APPROVAL',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_protocol_id;
    
    -- Update conversation state
    UPDATE conversation_state
    SET 
        state_data = state_data || jsonb_build_object(
            'protocol_id', v_protocol_id,
            'protocol_status', 'PENDING_APPROVAL',
            'last_update', NOW()
        ),
        updated_at = NOW()
    WHERE platform_user_id = (
        SELECT platform_user_id FROM patients WHERE id = p_patient_id
    );
    
    -- Return result
    RETURN jsonb_build_object(
        'success', TRUE,
        'protocol_id', v_protocol_id,
        'should_transition', TRUE,
        'next_milestone', 'PROTOCOL_PENDING_APPROVAL'
    );
END;
$$ LANGUAGE plpgsql;

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
        UPDATE conversation_state
        SET 
            current_state = 'ANAMNESIS_COMPLETED',
            anamnesis_temp_responses = '{}'::jsonb,
            updated_at = NOW()
        WHERE patient_id = p_patient_id AND is_active = true;
    END IF;
    
    -- Return transition signal
    RETURN jsonb_build_object(
        'success', TRUE,
        'should_transition', v_is_complete,
        'next_milestone', v_next_milestone,
        'patient_id', p_patient_id  -- Return for webhook call
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION save_protocol_draft IS 
'Saves protocol draft and signals transition to approval milestone';


