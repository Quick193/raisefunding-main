/*
  40 featured test campaigns to verify carousel fairness logic.
  Run AFTER migration_add_featured_since.sql.

  Split:
  - 20 campaigns with featured_since = NOW() - 2 hours  → PROTECTED (< 24h, always shown)
  - 20 campaigns with featured_since = NOW() - 26 hours → ELIGIBLE  (> 24h, can be displaced)

  Expected result (41 total featured including existing):
  - 20 protected shown
  - 10 eligible shown (most recent eligible fill remaining slots)
  - 11 NOT shown (the 11 oldest eligible, including the 1 backfilled existing campaign)
*/

DO $$
DECLARE
  pid uuid;
BEGIN
  SELECT id INTO pid FROM profiles LIMIT 1;

  -- ── 20 PROTECTED campaigns (featured 2 hours ago, < 24h threshold) ────────

  INSERT INTO public.campaigns
    (creator_id, title, description, goal_amount, current_amount, status, category,
     location, end_date, supporter_count, is_featured, featured_until, featured_since)
  VALUES
    (pid, 'Protected 01 – Clean Water Wells in Rural Rajasthan',
     'Bringing safe drinking water to 12 villages that have relied on contaminated ponds for generations.',
     500000, 210000, 'active', 'Social Impact', 'Rajasthan', NOW() + INTERVAL '60 days', 74, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 hours'),

    (pid, 'Protected 02 – Emergency Dialysis Fund for Elderly Patients',
     'Three elderly patients in Hyderabad cannot afford weekly dialysis. Each session costs 2500. Help them survive.',
     300000, 120000, 'active', 'Medical', 'Hyderabad, Telangana', NOW() + INTERVAL '30 days', 88, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 hours'),

    (pid, 'Protected 03 – Solar Panels for 5 Government Schools in Bihar',
     'Installing solar panels to power computers and evening study programs in off-grid schools.',
     750000, 380000, 'active', 'Education', 'Patna, Bihar', NOW() + INTERVAL '45 days', 102, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 hours'),

    (pid, 'Protected 04 – Flood Relief for Assam Tea Garden Families',
     'The 2024 floods destroyed homes of 200 tea garden worker families. Help them rebuild before winter.',
     1000000, 560000, 'active', 'Emergency', 'Assam', NOW() + INTERVAL '20 days', 143, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 hours'),

    (pid, 'Protected 05 – Save Rescued Street Dogs in Bengaluru',
     'Our shelter has 80 dogs needing vaccinations, sterilisation, and food. Monthly costs are 1.2 lakh.',
     360000, 145000, 'active', 'Animal Welfare', 'Bengaluru, Karnataka', NOW() + INTERVAL '40 days', 67, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 hours'),

    (pid, 'Protected 06 – Sponsor Tribal Girls into Engineering College',
     'Six girls from Jharkhand tribal villages secured government college seats but cannot afford hostel fees.',
     420000, 190000, 'active', 'Education', 'Ranchi, Jharkhand', NOW() + INTERVAL '50 days', 95, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 hours'),

    (pid, 'Protected 07 – Heart Surgery for 4-Year-Old Priya',
     'Priya was born with a ventricular septal defect. Without surgery in 60 days she will not develop normally.',
     650000, 320000, 'active', 'Medical', 'Chennai, Tamil Nadu', NOW() + INTERVAL '35 days', 218, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 hours'),

    (pid, 'Protected 08 – Mangrove Restoration in Sundarbans',
     'Planting 50,000 mangrove saplings to protect coastal villages from cyclones and restore fishing grounds.',
     800000, 290000, 'active', 'Environment', 'West Bengal', NOW() + INTERVAL '90 days', 134, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 hours'),

    (pid, 'Protected 09 – Digital Library for 10 Rural UP Villages',
     'One internet-connected tablet library per village. Children and women can learn anything, for free.',
     250000, 98000, 'active', 'Education', 'Uttar Pradesh', NOW() + INTERVAL '55 days', 61, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 hours'),

    (pid, 'Protected 10 – Burn Victim Reconstruction Surgery in Kolkata',
     'Sunita, 24, suffered severe burns in a kitchen fire. She needs 4 surgeries over 6 months to regain use of her hands.',
     900000, 430000, 'active', 'Medical', 'Kolkata, West Bengal', NOW() + INTERVAL '25 days', 176, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 hours'),

    (pid, 'Protected 11 – Street Food Cart for 10 Widows in Varanasi',
     'Ten widowed women want to start food carts near ghats. One cart costs 18,000. Help them earn their own living.',
     180000, 72000, 'active', 'Social Impact', 'Varanasi, UP', NOW() + INTERVAL '40 days', 54, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 hours'),

    (pid, 'Protected 12 – Spinal Surgery for Daily Wage Worker Ramu',
     'Ramu cannot walk after a construction accident. His family lives on 300 rupees a day. Surgery costs 4 lakh.',
     400000, 187000, 'active', 'Medical', 'Pune, Maharashtra', NOW() + INTERVAL '30 days', 113, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 hours'),

    (pid, 'Protected 13 – Plant 100,000 Trees in Deccan Plateau',
     'Reversing desertification in Marathwada by planting native species with local tribal communities.',
     600000, 241000, 'active', 'Environment', 'Aurangabad, Maharashtra', NOW() + INTERVAL '80 days', 89, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 hours'),

    (pid, 'Protected 14 – Emergency Cancer Medicines for Mohan',
     'Mohan, 55, cannot afford the monthly ₹45,000 chemotherapy medication. Without it he has weeks to live.',
     540000, 310000, 'active', 'Medical', 'Nagpur, Maharashtra', NOW() + INTERVAL '15 days', 201, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 hours'),

    (pid, 'Protected 15 – Robotics Lab for Government School in Delhi',
     'Setting up India's first robotics lab in a Delhi government school serving 1200 students from slum areas.',
     350000, 130000, 'active', 'Education', 'New Delhi', NOW() + INTERVAL '60 days', 77, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 hours'),

    (pid, 'Protected 16 – Rescue and Rehabilitate Trafficked Women in Mumbai',
     'Supporting 25 women rescued from trafficking with safe housing, counselling, and skill training for 3 months.',
     750000, 340000, 'active', 'Social Impact', 'Mumbai, Maharashtra', NOW() + INTERVAL '45 days', 156, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 hours'),

    (pid, 'Protected 17 – Prosthetic Limbs for 8 Landmine Survivors in Kashmir',
     'Eight survivors in border villages have waited years for prosthetics. Each costs 55,000 rupees.',
     440000, 203000, 'active', 'Medical', 'Jammu & Kashmir', NOW() + INTERVAL '35 days', 128, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 hours'),

    (pid, 'Protected 18 – Build Toilets for 30 Dalit Households in Odisha',
     'Families who still practice open defecation because they cannot afford construction. Each toilet is 12,000.',
     360000, 144000, 'active', 'Social Impact', 'Bhubaneswar, Odisha', NOW() + INTERVAL '50 days', 92, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 hours'),

    (pid, 'Protected 19 – Eye Cataract Surgery Camp for 200 Elderly in Himachal',
     'Organising a free surgical camp. Each surgery restores vision in 20 minutes. Cost per patient: 3,500.',
     700000, 380000, 'active', 'Medical', 'Shimla, Himachal Pradesh', NOW() + INTERVAL '28 days', 167, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 hours'),

    (pid, 'Protected 20 – Rebuild Cyclone-Hit Fishing Village in Tamil Nadu',
     'Cyclone Michaung destroyed 60 fishing boats and 40 homes. Help 200 families get back to sea.',
     1200000, 620000, 'active', 'Emergency', 'Chennai, Tamil Nadu', NOW() + INTERVAL '22 days', 234, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 hours');


  -- ── 20 ELIGIBLE campaigns (featured 26 hours ago, > 24h threshold, can be displaced) ──

  INSERT INTO public.campaigns
    (creator_id, title, description, goal_amount, current_amount, status, category,
     location, end_date, supporter_count, is_featured, featured_until, featured_since)
  VALUES
    (pid, 'Eligible 01 – Free Coding Bootcamp for Unemployed Youth in Patna',
     'Training 50 young people who dropped out of school in full-stack web development. Placement guaranteed.',
     500000, 230000, 'active', 'Education', 'Patna, Bihar', NOW() + INTERVAL '60 days', 81, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '26 hours'),

    (pid, 'Eligible 02 – Liver Transplant for 7-Year-Old Aryan',
     'Aryan has progressive liver disease. A living-donor transplant at PGIMER Chandigarh costs 18 lakh.',
     1800000, 890000, 'active', 'Medical', 'Chandigarh', NOW() + INTERVAL '20 days', 312, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '26 hours'),

    (pid, 'Eligible 03 – Organic Farming Cooperative for 40 Tribal Farmers',
     'Helping Adivasi farmers in Chhattisgarh transition to organic and sell directly to urban markets.',
     600000, 270000, 'active', 'Social Impact', 'Raipur, Chhattisgarh', NOW() + INTERVAL '75 days', 76, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '26 hours'),

    (pid, 'Eligible 04 – Earthquake Emergency Relief in Manipur',
     'The 6.8 magnitude earthquake left 500 families homeless. Food, tents, and medicine needed urgently.',
     800000, 510000, 'active', 'Emergency', 'Imphal, Manipur', NOW() + INTERVAL '12 days', 198, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '26 hours'),

    (pid, 'Eligible 05 – Rescue Snow Leopards in Ladakh',
     'Funding anti-poaching patrols and GPS collaring of 12 snow leopards to protect them from hunters.',
     450000, 180000, 'active', 'Animal Welfare', 'Leh, Ladakh', NOW() + INTERVAL '90 days', 143, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '26 hours'),

    (pid, 'Eligible 06 – Dialysis Machine for District Hospital in Chhattisgarh',
     'The only district hospital serving 2 lakh people has no dialysis unit. Patients travel 4 hours each way.',
     1100000, 560000, 'active', 'Medical', 'Jagdalpur, Chhattisgarh', NOW() + INTERVAL '40 days', 187, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '26 hours'),

    (pid, 'Eligible 07 – Scholarship Fund for 20 First-Generation College Students',
     'Children of daily wage labourers who scored 90%+ but have zero money for college fees or textbooks.',
     400000, 178000, 'active', 'Education', 'Surat, Gujarat', NOW() + INTERVAL '55 days', 99, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '26 hours'),

    (pid, 'Eligible 08 – River Cleanup Campaign in Sabarmati',
     'Removing 40 tonnes of plastic waste from a 15km stretch of the Sabarmati river in Ahmedabad.',
     350000, 143000, 'active', 'Environment', 'Ahmedabad, Gujarat', NOW() + INTERVAL '30 days', 112, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '26 hours'),

    (pid, 'Eligible 09 – Mental Health Helpline for Farmers in Maharashtra',
     'A 24/7 Marathi-language helpline for farmers facing debt and depression. Staffed by trained counsellors.',
     600000, 232000, 'active', 'Social Impact', 'Pune, Maharashtra', NOW() + INTERVAL '65 days', 88, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '26 hours'),

    (pid, 'Eligible 10 – Spine Surgery for Schoolteacher Meena',
     'Meena, 38, a primary school teacher in Lucknow, is paralysed from the waist down after a fall. Surgery can restore function.',
     700000, 380000, 'active', 'Medical', 'Lucknow, UP', NOW() + INTERVAL '22 days', 165, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '26 hours'),

    (pid, 'Eligible 11 – Build a Community Kitchen for 500 Street Children',
     'One warm meal a day for 500 children sleeping rough in Delhi. Operational cost is 80 rupees per child per day.',
     500000, 210000, 'active', 'Social Impact', 'New Delhi', NOW() + INTERVAL '45 days', 134, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '26 hours'),

    (pid, 'Eligible 12 – Wildfire Recovery for Uttarakhand Forest Villages',
     'June wildfires destroyed 800 hectares and the livelihoods of 15 forest communities. Replanting and support.',
     700000, 295000, 'active', 'Emergency', 'Dehradun, Uttarakhand', NOW() + INTERVAL '18 days', 121, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '26 hours'),

    (pid, 'Eligible 13 – Save Olive Ridley Turtle Nesting Grounds in Odisha',
     'Protecting 12km of nesting beach from illegal construction and light pollution near Gahirmatha sanctuary.',
     400000, 167000, 'active', 'Environment', 'Kendrapara, Odisha', NOW() + INTERVAL '70 days', 97, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '26 hours'),

    (pid, 'Eligible 14 – Kidney Transplant for 14-Year-Old Riya from Jaipur',
     'Riya needs a new kidney. Her father is a match but they cannot afford the surgery at SMS Medical College.',
     1500000, 780000, 'active', 'Medical', 'Jaipur, Rajasthan', NOW() + INTERVAL '15 days', 278, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '26 hours'),

    (pid, 'Eligible 15 – Skill Training Centre for Disabled Adults in Bhopal',
     'A vocational centre teaching tailoring, mobile repair, and candle-making to 60 differently-abled adults.',
     550000, 225000, 'active', 'Social Impact', 'Bhopal, MP', NOW() + INTERVAL '80 days', 73, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '26 hours'),

    (pid, 'Eligible 16 – Rainwater Harvesting for Drought Villages in Vidarbha',
     'Building rooftop collection systems for 40 families in the most water-stressed part of Maharashtra.',
     480000, 196000, 'active', 'Environment', 'Amravati, Maharashtra', NOW() + INTERVAL '50 days', 84, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '26 hours'),

    (pid, 'Eligible 17 – Free Legal Aid for Domestic Violence Survivors in Kerala',
     'Funding a legal clinic that provides free lawyers and court representation to women who cannot afford it.',
     300000, 122000, 'active', 'Social Impact', 'Thiruvananthapuram, Kerala', NOW() + INTERVAL '60 days', 67, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '26 hours'),

    (pid, 'Eligible 18 – Ambulance Boat for Backwater Villages in Kerala',
     'Remote villages accessible only by water have no emergency transport. A converted boat can save lives.',
     900000, 420000, 'active', 'Medical', 'Alappuzha, Kerala', NOW() + INTERVAL '35 days', 156, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '26 hours'),

    (pid, 'Eligible 19 – Night School for Child Labourers in Tirupur',
     'Teaching reading and maths after work hours to 120 children who work in textile factories during the day.',
     280000, 108000, 'active', 'Education', 'Tirupur, Tamil Nadu', NOW() + INTERVAL '55 days', 79, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '26 hours'),

    (pid, 'Eligible 20 – Gaushala Feed Fund for 300 Abandoned Cows in UP',
     'The gaushala is running out of fodder. 300 cows rescued from slaughter are at risk of starvation.',
     420000, 175000, 'active', 'Animal Welfare', 'Mathura, UP', NOW() + INTERVAL '40 days', 91, true,
     NOW() + INTERVAL '30 days', NOW() - INTERVAL '26 hours');

END $$;
