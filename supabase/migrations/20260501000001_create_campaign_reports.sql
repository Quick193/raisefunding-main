/*
  # Add campaign reports

  Public visitors can report suspicious or unsafe campaigns without exposing
  reports publicly. Reports are intended for operational review outside the
  public app surface.
*/

CREATE TABLE IF NOT EXISTS campaign_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  reporter_email text,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  CONSTRAINT campaign_reports_reason_length CHECK (char_length(reason) BETWEEN 10 AND 5000),
  CONSTRAINT campaign_reports_email_format
    CHECK (reporter_email IS NULL OR reporter_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

ALTER TABLE campaign_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create campaign reports"
  ON campaign_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_campaign_reports_campaign_id ON campaign_reports(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_status ON campaign_reports(status);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_created_at ON campaign_reports(created_at);
