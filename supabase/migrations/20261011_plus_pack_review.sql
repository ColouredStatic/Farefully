-- Applied to Farefully Supabase on 11 Oct 2026; idempotent source record.
-- Authenticated read-only Plus basket pack review. No existing user data affected.
CREATE OR REPLACE FUNCTION public.farefully_plus_pack_review(p_source_profile_id text, p_pack_hints jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_state jsonb;
  v_hint jsonb;
  v_id text;
  v_unit text;
  v_pack_text text;
  v_needed_text text;
  v_pantry_text text;
  v_pack numeric;
  v_needed numeric;
  v_pantry numeric;
  v_buy numeric;
  v_packs integer;
  v_leftover numeric;
  v_eligible boolean;
  v_rows jsonb := '[]'::jsonb;
  v_count integer := 0;
  v_excess_count integer := 0;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING errcode='28000';
  END IF;
  SELECT
    EXISTS(SELECT 1 FROM public.plus_gift_memberships g
           WHERE g.user_id=v_user AND (g.lifetime OR g.expires_at>now()))
    OR EXISTS(SELECT 1 FROM public.billing_accounts b
              WHERE b.user_id=v_user AND b.subscription_status IN ('active','trialing')
                AND (b.current_period_end IS NULL OR b.current_period_end>now()))
  INTO v_eligible;

  IF NOT v_eligible THEN
    RETURN jsonb_build_object('eligible',false,'reason','plus_required');
  END IF;

  IF p_source_profile_id IS NULL OR length(p_source_profile_id) NOT BETWEEN 1 AND 150
      OR jsonb_typeof(p_pack_hints) IS DISTINCT FROM 'array'
      OR jsonb_array_length(p_pack_hints)>160 THEN
    RETURN jsonb_build_object('eligible',true,'error','Invalid basket request');
  END IF;

  SELECT profile_data->'state' INTO v_state
  FROM public.households
  WHERE owner_id=v_user AND source_profile_id=p_source_profile_id;

  IF v_state IS NULL OR jsonb_typeof(v_state->'need') IS DISTINCT FROM 'object'
    OR jsonb_typeof(v_state->'pantry') IS DISTINCT FROM 'object' THEN
    RETURN jsonb_build_object('eligible',true,'error','Save your household and shopping list, then try again');
  END IF;

  FOR v_hint IN SELECT value FROM jsonb_array_elements(p_pack_hints) LOOP
    IF jsonb_typeof(v_hint) IS DISTINCT FROM 'object' THEN CONTINUE; END IF;
    v_id := v_hint->>'id';
    v_unit := left(coalesce(v_hint->>'unit','unit'),12);
    v_pack_text := v_hint->>'pack';
    IF v_id IS NULL OR length(v_id) NOT BETWEEN 1 AND 70
        OR v_id !~ '^[A-Za-z0-9_:-]+$'
        OR v_pack_text IS NULL
        OR v_pack_text !~ '^[0-9]{1,6}(\.[0-9]{1,3})?$'
        OR v_state->'need'->>v_id IS NULL
        THEN CONTINUE;
    END IF;
    v_needed_text := v_state->'need'->>v_id;
    v_pantry_text := coalesce(v_state->'pantry'->>v_id,'0');
    IF v_needed_text !~ '^[0-9]{1,9}(\.[0-9]{1,3})?$'
       OR v_pantry_text !~ '^[0-9]{1,9}(\.[0-9]{1,3})?$' THEN CONTINUE; END IF;

    v_pack := v_pack_text::numeric;
    IF v_pack<=0 THEN CONTINUE; END IF;
    v_needed:=v_needed_text::numeric;
    v_pantry:=v_pantry_text::numeric;
    v_buy:=greatest(0,v_needed-v_pantry);
    IF v_buy<=0 THEN CONTINUE; END IF;

    v_packs:=ceil(v_buy/v_pack);
    IF v_packs>100000 THEN CONTINUE; END IF;
    v_leftover:=greatest(0,v_packs*v_pack-v_buy);
    v_count:=v_count+1;
    IF v_leftover>0 THEN v_excess_count:=v_excess_count+1; END IF;
    v_rows:=v_rows||jsonb_build_array(jsonb_build_object(
      'id',v_id,'unit',v_unit,
      'need_to_buy',round(v_buy,3),
      'pack_size',round(v_pack,3),
      'pack_count',v_packs,
      'excess_quantity',round(v_leftover,3),
      'excess_pct_of_pack',round(100*v_leftover/v_pack,1)
    ));
  END LOOP;
  RETURN jsonb_build_object(
    'eligible',true,'source','Saved household plan and estimated pack sizes',
    'lines_reviewed',v_count,'lines_with_excess',v_excess_count,
    'items',v_rows,
    'notice','Illustrative pack review, not a live store quote. Review storage life and exact food labels before purchasing.'
  );
END;
$function$
;
REVOKE ALL ON FUNCTION public.farefully_plus_pack_review(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.farefully_plus_pack_review(text,jsonb) TO authenticated;
