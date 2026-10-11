-- Remove private Plus shopping preferences when their household is deleted.
-- Does not touch the account's Stripe billing or gifted membership.
CREATE OR REPLACE FUNCTION private.farefully_cleanup_plus_shopping()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $f$
BEGIN
  DELETE FROM private.farefully_plus_shopping_preferences
   WHERE owner_id=OLD.owner_id AND source_profile_id=OLD.source_profile_id;
  RETURN OLD;
END
$f$;
DROP TRIGGER IF EXISTS tr_farefully_cleanup_plus_shopping ON public.households;
CREATE TRIGGER tr_farefully_cleanup_plus_shopping
AFTER DELETE ON public.households FOR EACH ROW
EXECUTE FUNCTION private.farefully_cleanup_plus_shopping();
