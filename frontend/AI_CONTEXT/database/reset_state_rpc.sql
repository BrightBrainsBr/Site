-- ========================================================
-- !CLIENT RESET STATE RPC (Bright Brains Specific)
-- ========================================================
-- This function is called by FluxOS when a user resets their state
-- It cleans up ALL client-specific data for a given platform_user_id

CREATE OR REPLACE FUNCTION reset_user_state(
    p_platform_user_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_patient_id UUID;
    v_deleted_anamnesis_count INT := 0;
    v_deleted_protocols_count INT := 0;
    v_deleted_conversation_history_count INT := 0;
    v_deleted_conversation_state_count INT := 0;
    v_deleted_patient_count INT := 0;
BEGIN
    -- 1. Get patient ID
    SELECT id INTO v_patient_id
    FROM patients
    WHERE platform_user_id = p_platform_user_id;
    
    -- If no patient found, nothing to clean up
    IF v_patient_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'message', 'No patient data found for this user',
            'deleted', jsonb_build_object(
                'anamnesis_responses', 0,
                'protocols', 0,
                'conversation_history', 0,
                'conversation_state', 0,
                'patient', 0
            )
        );
    END IF;
    
    -- 2. Delete anamnesis responses
    DELETE FROM anamnesis_responses
    WHERE patient_id = v_patient_id;
    
    GET DIAGNOSTICS v_deleted_anamnesis_count = ROW_COUNT;
    
    -- 3. Delete protocols
    DELETE FROM protocols
    WHERE patient_id = v_patient_id;
    
    GET DIAGNOSTICS v_deleted_protocols_count = ROW_COUNT;
    
    -- 4. Delete conversation history
    DELETE FROM conversation_history
    WHERE patient_id = v_patient_id;
    
    GET DIAGNOSTICS v_deleted_conversation_history_count = ROW_COUNT;
    
    -- 5. Delete conversation state
    DELETE FROM conversation_state
    WHERE patient_id = v_patient_id;
    
    GET DIAGNOSTICS v_deleted_conversation_state_count = ROW_COUNT;
    
    -- 6. Delete patient record (CASCADE will handle any remaining FK references)
    DELETE FROM patients
    WHERE id = v_patient_id;
    
    GET DIAGNOSTICS v_deleted_patient_count = ROW_COUNT;
    
    -- 7. Return cleanup summary
    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'Patient data successfully reset',
        'patient_id', v_patient_id,
        'deleted', jsonb_build_object(
            'anamnesis_responses', v_deleted_anamnesis_count,
            'protocols', v_deleted_protocols_count,
            'conversation_history', v_deleted_conversation_history_count,
            'conversation_state', v_deleted_conversation_state_count,
            'patient', v_deleted_patient_count
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reset_user_state IS 
'Resets ALL patient data for a given platform_user_id. Called by FluxOS reset_state command. Deletes anamnesis responses, protocols, conversation history, conversation state, and patient record.';

