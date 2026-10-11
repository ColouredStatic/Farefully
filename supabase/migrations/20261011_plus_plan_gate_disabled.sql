-- Applied to Farefully Supabase on 11 Oct 2026. Paid plan enforcement defaults DISABLED.
-- Do not activate until the beta-to-Free transition has been reviewed.
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE IF NOT EXISTS private.farefully_feature_policy(
 id boolean PRIMARY KEY DEFAULT true CHECK(id),
 enforce_paid_plan_limits boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO private.farefully_feature_policy(id,enforce_paid_plan_limits)
VALUES(true,false) ON CONFLICT(id) DO NOTHING;
REVOKE ALL ON private.farefully_feature_policy FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.farefully_feature_access()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_user uuid:=auth.uid();
  v_plus boolean:=false;
  v_limits boolean:=false;
BEGIN
  SELECT enforce_paid_plan_limits INTO v_limits
    FROM private.farefully_feature_policy WHERE id=true;
  v_limits:=coalesce(v_limits,false);
  IF v_user IS NOT NULL THEN
    SELECT
      EXISTS(SELECT 1 FROM public.plus_gift_memberships g
             WHERE g.user_id=v_user AND (g.lifetime OR g.expires_at>now()))
      OR EXISTS(SELECT 1 FROM public.billing_accounts b
                WHERE b.user_id=v_user AND b.subscription_status IN ('active','trialing')
                  AND (b.current_period_end IS NULL OR b.current_period_end>now()))
      INTO v_plus;
  END IF;
  RETURN jsonb_build_object(
    'plus',v_plus,
    'beta_extended_planning',NOT v_limits,
    'may_generate_14_day',v_plus OR NOT v_limits,
    'plus_pack_review',v_plus,
    'paid_plan_limits_live',v_limits
  );
END;
$function$
;
REVOKE ALL ON FUNCTION public.farefully_feature_access() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.farefully_feature_access() TO authenticated;
CREATE OR REPLACE FUNCTION private.farefully_enforce_plan_length()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_user uuid:=auth.uid();
  v_gate boolean:=false;
  v_plus boolean:=false;
  v_state jsonb;
  v_plan jsonb;
  v_old_plan jsonb;
BEGIN
  IF v_user IS NULL OR v_user IS DISTINCT FROM NEW.owner_id THEN
    RETURN NEW; -- RLS still checks ownership; admin/service updates are unaffected.
  END IF;
  SELECT enforce_paid_plan_limits INTO v_gate
    FROM private.farefully_feature_policy WHERE id=true;
  IF NOT coalesce(v_gate,false) THEN RETURN NEW; END IF;
  v_state:=NEW.profile_data->'state';
  v_plan:=v_state->'plan';
  IF jsonb_typeof(v_plan) IS DISTINCT FROM 'array'
     OR jsonb_array_length(v_plan)<=7 THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' THEN
    v_old_plan:=OLD.profile_data #> '{state,plan}';
    -- Maintain existing grandfathered 14-day plans while household preferences,
    -- shopping ticks, pantry or basket are updated. The existing plan isn't altered.
    IF v_plan=v_old_plan THEN RETURN NEW; END IF;
  END IF;
  SELECT
    EXISTS(SELECT 1 FROM public.plus_gift_memberships g
           WHERE g.user_id=v_user AND (g.lifetime OR g.expires_at>now()))
    OR EXISTS(SELECT 1 FROM public.billing_accounts b
              WHERE b.user_id=v_user AND b.subscription_status IN ('active','trialing')
                AND (b.current_period_end IS NULL OR b.current_period_end>now()))
    INTO v_plus;
  IF NOT v_plus THEN
    RAISE EXCEPTION 'Fourteen-day plan generation requires Farefully Plus after beta'
      USING ERRCODE='P0001',HINT='Existing saved plans remain available. Choose seven days for a new plan.';
  END IF;
  RETURN NEW;
END;
$function$
;
DROP TRIGGER IF EXISTS tr_farefully_plan_entitlement ON public.households;
CREATE TRIGGER tr_farefully_plan_entitlement
BEFORE INSERT OR UPDATE OF profile_data ON public.households
FOR EACH ROW EXECUTE FUNCTION private.farefully_enforce_plan_length();
