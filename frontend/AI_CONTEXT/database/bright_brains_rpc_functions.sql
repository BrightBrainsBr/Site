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

COMMENT ON FUNCTION get_full_patient_context IS 
'Fetches complete patient context including profile, conversation state, and recent anamnesis in single atomic operation';

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
    WHERE anamnesis_type::TEXT = p_anamnesis_type;
    
    RETURN v_questions;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- Function: process_qa_agent_response
-- Processes QA agent output and updates patient/conversation state
-- Returns transition signals for FluxOS workflow orchestration
-- =================================================================
CREATE OR REPLACE FUNCTION process_qa_agent_response(
    p_platform_user_id UUID,
    p_agent_output JSONB,
    p_whatsapp_number TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_patient_id UUID;
    v_should_transition BOOLEAN := FALSE;
    v_next_milestone TEXT := NULL;
    v_has_name BOOLEAN := FALSE;
    v_has_dob BOOLEAN := FALSE;
    v_has_condition BOOLEAN := FALSE;
    v_extracted_data JSONB;
    v_full_name TEXT;
    v_birth_date DATE;
    v_conversation_state_id UUID;
    v_anamnesis_type_selected TEXT;
BEGIN
    -- Extract data from agent output
    v_extracted_data := COALESCE(p_agent_output->'extracted_data', '{}'::jsonb);
    
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
        COALESCE(p_whatsapp_number, v_extracted_data->>'whatsapp_number'),
        v_extracted_data->>'full_name',
        (v_extracted_data->>'birth_date')::date,
        NOW(), 
        NOW()
    )
    ON CONFLICT (platform_user_id) 
    DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, patients.full_name),
        birth_date = COALESCE(EXCLUDED.birth_date, patients.birth_date),
        whatsapp_number = COALESCE(
            NULLIF(EXCLUDED.whatsapp_number, ''),
            NULLIF(patients.whatsapp_number, 'UNKNOWN'),
            patients.whatsapp_number
        ),
        updated_at = NOW()
    RETURNING id INTO v_patient_id;
    
    -- Update or create conversation state
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
        anamnesis_type_selected = CASE
            WHEN EXCLUDED.anamnesis_type_selected IS NOT NULL
            THEN EXCLUDED.anamnesis_type_selected
            ELSE conversation_state.anamnesis_type_selected
        END;
    
    -- Get ACTUAL patient data
    SELECT 
        full_name,
        birth_date,
        (full_name IS NOT NULL) AS has_name,
        (birth_date IS NOT NULL) AS has_dob,
        FALSE AS has_condition
    INTO v_full_name, v_birth_date, v_has_name, v_has_dob, v_has_condition
    FROM patients
    WHERE id = v_patient_id;
    
    -- Check if agent explicitly requested a transition
    IF p_agent_output ? 'next_milestone' AND (p_agent_output->>'should_update_state')::BOOLEAN = TRUE THEN
        v_should_transition := TRUE;
        v_next_milestone := p_agent_output->>'next_milestone';
    ELSE
        -- Fallback: Determine next milestone based on data collected
        IF v_has_name AND v_has_dob AND NOT v_has_condition THEN
            v_should_transition := TRUE;
            v_next_milestone := 'QUALIFYING';
        ELSIF v_has_name AND v_has_dob AND v_has_condition THEN
            v_should_transition := TRUE;
            v_next_milestone := 'QUALIFIED';
        END IF;
    END IF;
    
    -- Get conversation_state_id AND anamnesis_type for chained agent invocation
    SELECT 
        id,
        anamnesis_type_selected::TEXT
    INTO v_conversation_state_id, v_anamnesis_type_selected
    FROM conversation_state
    WHERE patient_id = v_patient_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Return result with ACTUAL DATA
    RETURN jsonb_build_object(
        'success', TRUE,
        'patient_id', v_patient_id,
        'should_transition', v_should_transition,
        'next_milestone', v_next_milestone,
        'chain_next_agent', (v_next_milestone = 'ANAMNESIS_STARTING'),
        'client_state_updates', jsonb_build_object(
            'patient_id', v_patient_id,
            'conversation_state_id', v_conversation_state_id,
            'anamnesis_type', COALESCE(p_agent_output->>'anamnesis_type', v_anamnesis_type_selected),
            'main_condition', p_agent_output->>'main_condition'
        ),
        'extracted_data', jsonb_build_object(
            'full_name', v_full_name,
            'birth_date', v_birth_date,
            'client_specific_data', jsonb_build_object(
                'anamnesis_type', p_agent_output->>'anamnesis_type',
                'main_condition', p_agent_output->>'main_condition'
            )
        ),
        'data_collected', jsonb_build_object(
            'has_name', v_has_name,
            'has_dob', v_has_dob,
            'has_condition', v_has_condition
        )
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_qa_agent_response IS 
'Processes QA agent output, updates patient/conversation state atomically, and returns transition signals for workflow orchestration';

-- =================================================================
-- Function: process_anamnesis_agent_response
-- Processes anamnesis agent output and updates state
-- NOTE: This RPC is called AFTER the agent has already updated
-- conversation_state internally. We just need to check completion
-- and return the updated state to FluxOS.
-- =================================================================
CREATE OR REPLACE FUNCTION process_anamnesis_agent_response(
    p_platform_user_id UUID,
    p_patient_id UUID,
    p_agent_output JSONB
) RETURNS JSONB AS $$
DECLARE
    v_is_complete BOOLEAN := FALSE;
    v_next_milestone TEXT := NULL;
    v_current_index INTEGER;
    v_temp_responses JSONB;
    v_current_state TEXT;
    v_should_transition BOOLEAN := FALSE;
    v_conversation_state_id UUID;
    v_temp_responses_count INTEGER;
BEGIN
    -- Check if anamnesis is complete
    v_is_complete := COALESCE((p_agent_output->>'is_complete')::BOOLEAN, FALSE);
    
    -- Get current state from conversation_state table
    -- (The agent has already updated this via update_conversation_state)
    -- ⚠️ CRITICAL FIX: Use patient_id + is_active ONLY (guaranteed unique by index)
    -- This prevents "query returned more than one row" error
    SELECT 
        id,
        anamnesis_current_question_index,
        anamnesis_temp_responses,
        current_state
    INTO v_conversation_state_id, v_current_index, v_temp_responses, v_current_state
    FROM conversation_state
    WHERE patient_id = p_patient_id
      AND is_active = true
    LIMIT 1;
    
    -- Count temp_responses keys properly (jsonb_object_keys returns SETOF, need to count)
    SELECT count(*) INTO v_temp_responses_count
    FROM jsonb_object_keys(COALESCE(v_temp_responses, '{}'::jsonb));
    
    -- If complete, transition to ANAMNESIS_COMPLETED
    IF v_is_complete THEN
        v_next_milestone := 'ANAMNESIS_COMPLETED';
        v_should_transition := TRUE;
        
        -- Update conversation state to mark anamnesis as complete
        -- (Should already be done by agent, but double-check)
        -- ⚠️ CRITICAL FIX: Use id directly (most specific) to avoid multi-row updates
        UPDATE conversation_state
        SET 
            current_state = 'ANAMNESIS_COMPLETED',
            anamnesis_temp_responses = '{}'::jsonb,
            last_interaction_at = NOW()
        WHERE id = v_conversation_state_id;
    -- If this is the first question answered (index > 0) and state is still STARTING, transition to IN_PROGRESS
    ELSIF v_current_state = 'ANAMNESIS_STARTING' AND v_current_index > 0 THEN
        v_next_milestone := 'ANAMNESIS_IN_PROGRESS';
        v_should_transition := TRUE;
    END IF;
    
    -- Return transition signal with client state updates for FluxOS
    -- Include current progress even if not complete
    RETURN jsonb_build_object(
        'success', TRUE,
        'should_transition', v_should_transition,
        'next_milestone', v_next_milestone,
        'patient_id', p_patient_id,
        'client_state_updates', jsonb_build_object(
            'anamnesis_completed', v_is_complete,
            'patient_id', p_patient_id,
            'current_question_index', v_current_index,
            'temp_responses_count', v_temp_responses_count
        )
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_anamnesis_agent_response IS 
'Processes anamnesis agent output and returns transition signals for workflow orchestration';

