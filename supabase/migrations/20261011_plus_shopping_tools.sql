-- Farefully Plus shopping tools. Keeps normal free shopping unchanged.
CREATE TABLE IF NOT EXISTS private.farefully_plus_shopping_preferences (
  owner_id uuid NOT NULL,
  source_profile_id text NOT NULL,
  aisle_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  actual_spend numeric(10,2),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(owner_id,source_profile_id),
  CONSTRAINT farefully_plus_shopping_aisle_array CHECK (jsonb_typeof(aisle_order)='array'),
  CONSTRAINT farefully_plus_shopping_actual_spend CHECK(actual_spend IS NULL OR (actual_spend>=0 AND actual_spend<=99999999))
);
REVOKE ALL ON private.farefully_plus_shopping_preferences FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.farefully_plus_shopping_tools(
  p_source_profile_id text,
  p_action text,
  p_payload jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $body$
DECLARE
 v_user uuid:=auth.uid();
 v_plus boolean:=false;
 v_state jsonb;
 v_rows jsonb:='[]'::jsonb;
 v_item jsonb;
 v_key text;
 v_unit text;
 v_pack_text text;
 v_week1_text text;
 v_week2_text text;
 v_total_text text;
 v_pantry_text text;
 v_pack numeric;
 v_week1 numeric;
 v_week2 numeric;
 v_total numeric;
 v_have numeric;
 v_first_buy numeric;
 v_second_buy numeric;
 v_first_packs integer;
 v_second_packs integer;
 v_amount_text text;
 v_spend numeric;
 v_aisle jsonb;
 v_name text;
 v_count integer:=0;
BEGIN
 IF v_user IS NULL THEN
   RAISE EXCEPTION 'Authentication required' USING errcode='28000';
 END IF;
 SELECT
  EXISTS (SELECT 1 FROM public.plus_gift_memberships g
          WHERE g.user_id=v_user AND (g.lifetime OR g.expires_at>now()))
  OR EXISTS (SELECT 1 FROM public.billing_accounts b
             WHERE b.user_id=v_user AND b.subscription_status IN ('active','trialing')
               AND (b.current_period_end IS NULL OR b.current_period_end>now()))
  INTO v_plus;
 IF NOT v_plus THEN
   RETURN jsonb_build_object('eligible',false,'reason','plus_required');
 END IF;
 IF p_source_profile_id IS NULL OR length(p_source_profile_id) NOT BETWEEN 1 AND 150 THEN
   RETURN jsonb_build_object('eligible',true,'error','Invalid household');
 END IF;
 SELECT profile_data->'state' INTO v_state
 FROM public.households
 WHERE owner_id=v_user AND source_profile_id=p_source_profile_id;
 IF v_state IS NULL THEN
   RETURN jsonb_build_object('eligible',true,'error','Save the household first');
 END IF;

 IF p_action='get_preferences' THEN
   SELECT aisle_order,actual_spend INTO v_aisle,v_spend
   FROM private.farefully_plus_shopping_preferences
   WHERE owner_id=v_user AND source_profile_id=p_source_profile_id;
   RETURN jsonb_build_object('eligible',true,
     'aisle_order',coalesce(v_aisle,'[]'::jsonb),
     'actual_spend',v_spend);
 ELSIF p_action='save_preferences' THEN
   IF jsonb_typeof(p_payload) IS DISTINCT FROM 'object' THEN
     RETURN jsonb_build_object('eligible',true,'error','Invalid preferences');
   END IF;
   v_aisle:=p_payload->'aisle_order';
   IF jsonb_typeof(v_aisle) IS DISTINCT FROM 'array'
      OR jsonb_array_length(v_aisle)>35 THEN
     RETURN jsonb_build_object('eligible',true,'error','Invalid aisle order');
   END IF;
   FOR v_item IN SELECT value FROM jsonb_array_elements(v_aisle) LOOP
     IF jsonb_typeof(v_item) IS DISTINCT FROM 'string' OR length(trim(v_item #>> '{}')) NOT BETWEEN 1 AND 70 THEN
       RETURN jsonb_build_object('eligible',true,'error','Invalid aisle name');
     END IF;
   END LOOP;
   v_amount_text:=p_payload->>'actual_spend';
   IF v_amount_text IS NOT NULL THEN
     IF v_amount_text !~ '^[0-9]{1,8}(\.[0-9]{1,2})?$' THEN
       RETURN jsonb_build_object('eligible',true,'error','Invalid amount');
     END IF;
     v_spend:=v_amount_text::numeric;
   ELSE
     v_spend:=NULL;
   END IF;
   INSERT INTO private.farefully_plus_shopping_preferences
    (owner_id,source_profile_id,aisle_order,actual_spend,updated_at)
   VALUES (v_user,p_source_profile_id,v_aisle,v_spend,now())
   ON CONFLICT(owner_id,source_profile_id) DO UPDATE
     SET aisle_order=excluded.aisle_order,
         actual_spend=excluded.actual_spend,
         updated_at=now();
   RETURN jsonb_build_object('eligible',true,'saved',true,
     'aisle_order',v_aisle,'actual_spend',v_spend);
 ELSIF p_action='split_fortnight' THEN
   IF jsonb_typeof(v_state->'plan') IS DISTINCT FROM 'array'
      OR jsonb_array_length(v_state->'plan')<>14
      OR jsonb_typeof(v_state->'need') IS DISTINCT FROM 'object'
      OR jsonb_typeof(v_state->'pantry') IS DISTINCT FROM 'object'
      OR jsonb_typeof(p_payload) IS DISTINCT FROM 'array'
      OR jsonb_array_length(p_payload)>160 THEN
     RETURN jsonb_build_object('eligible',true,'error','A saved fourteen-day plan is required');
   END IF;
   FOR v_item IN SELECT value FROM jsonb_array_elements(p_payload) LOOP
     IF jsonb_typeof(v_item) IS DISTINCT FROM 'object' THEN CONTINUE; END IF;
     v_key:=v_item->>'id';
     v_unit:=left(coalesce(v_item->>'unit','unit'),12);
     v_week1_text:=v_item->>'week1';
     v_week2_text:=v_item->>'week2';
     v_pack_text:=v_item->>'pack';
     IF v_key IS NULL OR v_key !~ '^[A-Za-z0-9_:-]{1,70}$'
       OR v_unit NOT IN ('g','ml','each','slice','unit','pack')
       OR v_week1_text IS NULL OR v_week2_text IS NULL OR v_pack_text IS NULL
       OR v_week1_text !~ '^[0-9]{1,9}(\.[0-9]{1,5})?$'
       OR v_week2_text !~ '^[0-9]{1,9}(\.[0-9]{1,5})?$'
       OR v_pack_text !~ '^[0-9]{1,6}(\.[0-9]{1,3})?$'
       OR v_state->'need'->>v_key IS NULL THEN CONTINUE; END IF;
     v_total_text:=v_state->'need'->>v_key;
     v_pantry_text:=coalesce(v_state->'pantry'->>v_key,'0');
     IF v_total_text !~ '^[0-9]{1,9}(\.[0-9]{1,5})?$'
       OR v_pantry_text !~ '^[0-9]{1,9}(\.[0-9]{1,5})?$' THEN CONTINUE; END IF;
     v_week1:=v_week1_text::numeric;
     v_week2:=v_week2_text::numeric;
     v_pack:=v_pack_text::numeric;
     v_total:=v_total_text::numeric;
     v_have:=v_pantry_text::numeric;
     IF v_pack<=0 OR abs(v_week1+v_week2-v_total)>greatest(0.05,v_total*0.001)
       OR v_total<=0 THEN CONTINUE; END IF;
     v_first_buy:=greatest(0,v_week1-v_have);
     v_second_buy:=greatest(0,v_week2-greatest(0,v_have-v_week1));
     v_first_packs:=ceil(v_first_buy/v_pack);
     v_second_packs:=ceil(v_second_buy/v_pack);
     IF v_first_packs>100000 OR v_second_packs>100000 THEN CONTINUE; END IF;
     v_count:=v_count+1;
     v_rows:=v_rows||jsonb_build_array(jsonb_build_object(
       'id',v_key,'unit',v_unit,'pack_size',v_pack,
       'first_need',round(v_first_buy,3),'second_need',round(v_second_buy,3),
       'first_packs',v_first_packs,'second_packs',v_second_packs
     ));
   END LOOP;
   RETURN jsonb_build_object('eligible',true,'items',v_rows,
     'lines',v_count,'split','days 1-7 and days 8-14',
     'notice','Two estimated shopping visits. Non-perishables and unopened packs can often be consolidated; exact food storage life and retailer packs require checking.');
 ELSE
   RETURN jsonb_build_object('eligible',true,'error','Unsupported action');
 END IF;
END
$body$;
REVOKE ALL ON FUNCTION public.farefully_plus_shopping_tools(text,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.farefully_plus_shopping_tools(text,text,jsonb) TO authenticated;
