/*
  Auto-complete a campaign when its goal is reached.

  Extends the existing donation trigger so that, the moment a donation pushes
  current_amount to (or past) goal_amount, the campaign flips to 'completed'.
  Combined with the server-side guard in donation-order, this means a campaign
  stops accepting donations once funded.
*/

CREATE OR REPLACE FUNCTION update_campaign_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE campaigns
  SET current_amount  = current_amount + NEW.amount,
      supporter_count = supporter_count + 1,
      status = CASE
                 WHEN current_amount + NEW.amount >= goal_amount THEN 'completed'
                 ELSE status
               END,
      updated_at      = now()
  WHERE id = NEW.campaign_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
