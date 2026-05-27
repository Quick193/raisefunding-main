-- =============================================================
-- seed_dummy_data.sql
-- Run this in Supabase → SQL Editor
-- Creates 50 regular + 33 featured dummy campaigns
-- Also adds a public SELECT policy on donations
-- =============================================================

-- 1. ADD PUBLIC SELECT POLICY ON DONATIONS (allows donor list to be public)
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'donations'
      AND policyname = 'Donations are publicly viewable'
  ) THEN
    EXECUTE 'CREATE POLICY "Donations are publicly viewable" ON public.donations FOR SELECT USING (true)';
  END IF;
END $policy$;

-- 2. CLEAR ALL EXISTING CAMPAIGNS (cascades to donations, reports, etc.)
TRUNCATE public.campaigns CASCADE;

-- 3. INSERT DUMMY CAMPAIGNS
DO $seed$
DECLARE
  pid text;
BEGIN
  SELECT id::text INTO pid FROM public.profiles LIMIT 1;

  IF pid IS NULL THEN
    RAISE EXCEPTION 'No user profiles found. Please sign up for an account first, then run this script.';
  END IF;

  -- ===========================================================
  -- REGULAR CAMPAIGNS (50)
  -- ===========================================================

  -- MEDICAL (8)
  INSERT INTO public.campaigns
    (creator_id, title, description, goal_amount, current_amount, status, category, location, end_date, supporter_count, is_featured)
  VALUES
    (pid, 'Help Ramesh Get Heart Surgery',
     'Ramesh Kumar, a 45-year-old auto driver and sole breadwinner, needs urgent bypass surgery. His family of four depends entirely on him. Help us fund this life-saving operation before it is too late.',
     250000, 87000, 'active', 'Medical', 'Mumbai, Maharashtra', NOW() + INTERVAL '45 days', 34, false),

    (pid, 'Save Baby Priya from Congenital Heart Defect',
     'Priya is just 8 months old and has been diagnosed with a congenital heart defect. Her parents, daily wage workers, cannot afford the surgery. Every rupee counts for this precious little life.',
     400000, 156000, 'active', 'Medical', 'New Delhi', NOW() + INTERVAL '30 days', 58, false),

    (pid, 'Kidney Transplant for Suresh Naidu',
     'Suresh Naidu, a 38-year-old fisherman from Chennai, is in end-stage renal failure. He needs an immediate kidney transplant to survive. His wife and three children need your support right now.',
     600000, 210000, 'active', 'Medical', 'Chennai, Tamil Nadu', NOW() + INTERVAL '60 days', 72, false),

    (pid, 'Cancer Treatment for School Teacher Meena',
     'Meena Sharma, a beloved government school teacher, has been diagnosed with breast cancer. The chemotherapy and surgery costs are beyond her family''s means. Help her fight back and return to her students.',
     150000, 89000, 'active', 'Medical', 'Pune, Maharashtra', NOW() + INTERVAL '20 days', 45, false),

    (pid, 'Burn Victim Ankit Needs Skin Grafting',
     'Ankit Yadav, 22, suffered severe burns in a kitchen accident. He needs multiple skin grafting surgeries to regain mobility and return to a normal life. Your support makes all the difference.',
     300000, 45000, 'active', 'Medical', 'Hyderabad, Telangana', NOW() + INTERVAL '55 days', 18, false),

    (pid, 'Spine Surgery for Paralysed Farmer Gopal',
     'Gopal Singh, a 52-year-old farmer, became paralysed after an accident in his field. Spine surgery can restore his movement and independence. Help him walk again and care for his family.',
     500000, 123000, 'active', 'Medical', 'Lucknow, Uttar Pradesh', NOW() + INTERVAL '40 days', 41, false),

    (pid, 'Emergency Surgery for Road Accident Victim',
     'A young man identified as Arun, 24, suffered multiple fractures and internal bleeding in a road accident. He needs emergency surgery immediately. His migrant worker family has no savings at all.',
     100000, 78000, 'active', 'Medical', 'Bangalore, Karnataka', NOW() + INTERVAL '10 days', 62, false),

    (pid, 'Child with Rare Blood Disorder Needs Treatment',
     'Five-year-old Tanmoy has aplastic anemia, a rare blood disorder requiring a bone marrow transplant and ongoing treatment. His parents have already sold their land. Please help save his life.',
     750000, 290000, 'active', 'Medical', 'Kolkata, West Bengal', NOW() + INTERVAL '75 days', 96, false);

  -- EDUCATION (8)
  INSERT INTO public.campaigns
    (creator_id, title, description, goal_amount, current_amount, status, category, location, end_date, supporter_count, is_featured)
  VALUES
    (pid, 'Build Toilets in Rajasthan Government School',
     'A government school in Barmer district has 400 students but no proper toilet facility. Girls often miss school due to this. Help us build hygienic toilets and change their educational journey forever.',
     80000, 54000, 'active', 'Education', 'Barmer, Rajasthan', NOW() + INTERVAL '25 days', 89, false),

    (pid, 'Sponsor 50 Underprivileged Girls Through School',
     'In rural Uttar Pradesh, many girls drop out after Class 5 due to poverty. Your donation covers school fees, books, and uniforms for one full year. Keep them in school and open doors for their future.',
     120000, 43000, 'active', 'Education', 'Jhansi, Uttar Pradesh', NOW() + INTERVAL '90 days', 37, false),

    (pid, 'Digital Classroom for Remote Bihar Village',
     'The primary school in Dariari village has never had electricity. This project brings solar power, a projector, and digital learning to 200 children for the very first time in their lives.',
     250000, 67000, 'active', 'Education', 'Gaya, Bihar', NOW() + INTERVAL '50 days', 23, false),

    (pid, 'Books and Supplies for Tribal School in Jharkhand',
     'A tribal school in the Saranda forest serves 150 Adivasi children who walk 5 km each day to learn. They desperately need textbooks, notebooks, and stationery to continue their education.',
     50000, 31000, 'active', 'Education', 'West Singhbhum, Jharkhand', NOW() + INTERVAL '15 days', 55, false),

    (pid, 'Scholarship Fund for 30 Dalit Students',
     'Thirty bright Dalit students from Tamil Nadu have cleared Class 10 with distinction but cannot afford college fees. Your donation funds one year of higher education and changes their life trajectory.',
     300000, 88000, 'active', 'Education', 'Madurai, Tamil Nadu', NOW() + INTERVAL '60 days', 31, false),

    (pid, 'Computer Lab for Rural Government School Odisha',
     'Students in a rural Odisha school have never touched a computer. Your donation sets up a 20-computer lab with internet access, opening the door to the digital world for 500 students.',
     400000, 112000, 'active', 'Education', 'Koraput, Odisha', NOW() + INTERVAL '80 days', 44, false),

    (pid, 'Support Education for 40 Blind Students Karnataka',
     'Forty blind students at a special needs school in Karnataka need Braille textbooks, audio devices, and trained teachers. Help them get equal access to quality education they deserve.',
     150000, 59000, 'active', 'Education', 'Mysuru, Karnataka', NOW() + INTERVAL '35 days', 48, false),

    (pid, 'Vocational Training Center for Rural Youth in MP',
     'Young people in Madhya Pradesh villages lack skills for employment. This project establishes a vocational training center teaching plumbing, electrical work, and tailoring to 100 young people.',
     200000, 77000, 'active', 'Education', 'Sagar, Madhya Pradesh', NOW() + INTERVAL '70 days', 29, false);

  -- SOCIAL IMPACT (8)
  INSERT INTO public.campaigns
    (creator_id, title, description, goal_amount, current_amount, status, category, location, end_date, supporter_count, is_featured)
  VALUES
    (pid, 'Clean Drinking Water for 5 Rajasthan Villages',
     'Five villages in the Thar desert walk 3 km daily for water that is often contaminated. This project installs a solar-powered water purification system serving 2000 people with clean water.',
     300000, 134000, 'active', 'Social Impact', 'Jaisalmer, Rajasthan', NOW() + INTERVAL '40 days', 67, false),

    (pid, 'Empower 60 Rural Women with Tailoring Skills',
     'Sixty women in rural Uttar Pradesh will receive free sewing machines and three months of tailoring training, enabling them to earn between five and eight thousand rupees per month from home.',
     100000, 38000, 'active', 'Social Impact', 'Sitapur, Uttar Pradesh', NOW() + INTERVAL '30 days', 42, false),

    (pid, 'Community Kitchen for Homeless People in Delhi',
     'Our community kitchen in Old Delhi serves 150 homeless people every day. We need funds to sustain operations for six months. A warm meal changes lives. Be part of this daily miracle.',
     200000, 91000, 'active', 'Social Impact', 'New Delhi', NOW() + INTERVAL '20 days', 83, false),

    (pid, 'Wedding Aid for 10 Orphan Girls in Gujarat',
     'Ten orphan girls from a government home in Gujarat are of marriageable age. Your donations fund their wedding ceremonies with dignity, giving them a new beginning and a fresh start in life.',
     150000, 52000, 'active', 'Social Impact', 'Vadodara, Gujarat', NOW() + INTERVAL '45 days', 36, false),

    (pid, 'Wheelchair-Accessible Ramps for Pune Public Places',
     'Pune''s disabled community struggles with inaccessible public buildings every day. This project installs ramps in 15 government offices, making them fully accessible for wheelchair users.',
     80000, 29000, 'active', 'Social Impact', 'Pune, Maharashtra', NOW() + INTERVAL '25 days', 27, false),

    (pid, 'Day Care Center for 80 Senior Citizens Chennai',
     'Elderly citizens in Chennai are increasingly lonely and neglected. This day care center provides medical checkups, nutritious meals, and companionship to 80 seniors every single day.',
     250000, 103000, 'active', 'Social Impact', 'Chennai, Tamil Nadu', NOW() + INTERVAL '55 days', 54, false),

    (pid, 'Free Mental Health Helpline for 1000 Youth',
     'Youth in Bangalore face rising anxiety, depression, and exam stress with nowhere to turn. Your donation funds a free mental health helpline with trained counselors operating for twelve months.',
     120000, 47000, 'active', 'Social Impact', 'Bangalore, Karnataka', NOW() + INTERVAL '65 days', 39, false),

    (pid, 'Safe Shelter for Trafficking Survivors West Bengal',
     'Women rescued from trafficking in West Bengal need a safe home, counseling, and skill training to rebuild their lives. Your support funds a 20-bed shelter providing refuge for six months.',
     400000, 178000, 'active', 'Social Impact', 'Kolkata, West Bengal', NOW() + INTERVAL '85 days', 76, false);

  -- EMERGENCY (7)
  INSERT INTO public.campaigns
    (creator_id, title, description, goal_amount, current_amount, status, category, location, end_date, supporter_count, is_featured)
  VALUES
    (pid, 'Cyclone Victims Relief Fund Odisha Coast',
     'A severe cyclone devastated 12 coastal villages in Odisha leaving 3000 families without homes. Urgent funds needed for food, tarpaulins, medicines, and clean drinking water for survivors.',
     500000, 267000, 'active', 'Emergency', 'Puri, Odisha', NOW() + INTERVAL '15 days', 143, false),

    (pid, 'Flood Relief for Assam Families 2026',
     'Devastating floods have submerged 200 villages in Assam. Five thousand people are in relief camps with no food or medicine. Every hour matters for these families. Please donate immediately.',
     300000, 189000, 'active', 'Emergency', 'Jorhat, Assam', NOW() + INTERVAL '10 days', 112, false),

    (pid, 'Earthquake Rehabilitation in Kutch Gujarat',
     'A 6.2 magnitude earthquake struck Kutch district, damaging 800 homes and leaving families sleeping in the open. Funds are urgently needed for temporary shelters and emergency food supplies.',
     400000, 145000, 'active', 'Emergency', 'Bhuj, Gujarat', NOW() + INTERVAL '20 days', 88, false),

    (pid, 'Drought Aid for Vidarbha Cotton Farmers',
     'Three consecutive years of drought have devastated 500 cotton farming families in Vidarbha. Debt is mounting dangerously. Your donation provides emergency food kits and seed loans for next season.',
     250000, 98000, 'active', 'Emergency', 'Amravati, Maharashtra', NOW() + INTERVAL '30 days', 61, false),

    (pid, 'Fire Victims Shelter Fund Mumbai Slum',
     'A fire destroyed 200 homes in a Dharavi slum, leaving 800 people completely homeless overnight. Immediate funds needed for temporary shelter, food, and rebuilding basic community infrastructure.',
     150000, 113000, 'active', 'Emergency', 'Mumbai, Maharashtra', NOW() + INTERVAL '8 days', 97, false),

    (pid, 'Landslide Rescue Support Uttarakhand Village',
     'A landslide blocked a mountain village in Chamoli district, cutting off 400 residents from all supplies. Emergency rescue operations, food drops, and medical aid are urgently needed right now.',
     200000, 76000, 'active', 'Emergency', 'Chamoli, Uttarakhand', NOW() + INTERVAL '12 days', 54, false),

    (pid, 'Emergency Oxygen Support for Poor Patients Delhi',
     'Many underprivileged patients in Delhi cannot access oxygen or ICU beds during medical emergencies. This fund procures oxygen concentrators and home care kits for 200 critically ill patients.',
     100000, 87000, 'active', 'Emergency', 'New Delhi', NOW() + INTERVAL '7 days', 134, false);

  -- ENVIRONMENT (7)
  INSERT INTO public.campaigns
    (creator_id, title, description, goal_amount, current_amount, status, category, location, end_date, supporter_count, is_featured)
  VALUES
    (pid, 'Plant 10000 Trees in Barren Madhya Pradesh Land',
     'A degraded forest in Panna district is being restored. Your donation funds the planting and three-year maintenance of 10000 native trees, restoring biodiversity and replenishing groundwater tables.',
     50000, 31000, 'active', 'Environment', 'Panna, Madhya Pradesh', NOW() + INTERVAL '90 days', 78, false),

    (pid, 'Solar Street Lights for 20 Dark Villages in UP',
     'Twenty villages in Uttar Pradesh have no electricity at all. Solar street lights will reduce accidents, allow children to study at night, and dramatically improve safety for women after dark.',
     300000, 87000, 'active', 'Environment', 'Banda, Uttar Pradesh', NOW() + INTERVAL '60 days', 43, false),

    (pid, 'Annual Goa Beach Cleanup and Awareness Drive',
     'Our volunteers clean Goa''s beaches year-round removing tons of plastic waste. We need funds for equipment, recycling partnerships, and awareness campaigns reaching ten thousand tourists annually.',
     30000, 21000, 'active', 'Environment', 'Panaji, Goa', NOW() + INTERVAL '30 days', 57, false),

    (pid, 'Save the Yamuna River Rejuvenation Project Delhi',
     'The Yamuna is dying from industrial pollution. This project plants 5000 trees along the riverbank, installs sewage treatment, and educates 1000 students about the importance of river conservation.',
     200000, 64000, 'active', 'Environment', 'New Delhi', NOW() + INTERVAL '80 days', 35, false),

    (pid, 'Wildlife Corridor for Western Ghats Animals',
     'Shrinking forests force elephants and leopards onto roads, causing deadly conflicts. This project restores a 10 km wildlife corridor in the Western Ghats, keeping both animals and humans safe.',
     500000, 156000, 'active', 'Environment', 'Coorg, Karnataka', NOW() + INTERVAL '120 days', 62, false),

    (pid, 'Organic Farming Training for 100 Punjab Farmers',
     'Chemical farming is destroying Punjab''s soil and water supply. This project trains 100 farmers in certified organic methods, providing starter kits and market linkages for chemical-free produce.',
     150000, 58000, 'active', 'Environment', 'Amritsar, Punjab', NOW() + INTERVAL '45 days', 29, false),

    (pid, 'Community Biogas Plant for 50 Haryana Households',
     'A biogas plant converting cow dung into clean cooking fuel will serve 50 rural households in Haryana, reducing firewood consumption and indoor air pollution significantly for entire families.',
     120000, 43000, 'active', 'Environment', 'Hisar, Haryana', NOW() + INTERVAL '55 days', 34, false);

  -- ANIMAL WELFARE (6)
  INSERT INTO public.campaigns
    (creator_id, title, description, goal_amount, current_amount, status, category, location, end_date, supporter_count, is_featured)
  VALUES
    (pid, 'Mass Sterilization Drive for Pune Stray Dogs',
     'Pune has over 50000 stray dogs suffering from disease and malnutrition. This drive sterilizes and vaccinates 500 dogs, humanely reducing the stray population and preventing rabies outbreaks.',
     80000, 52000, 'active', 'Animal Welfare', 'Pune, Maharashtra', NOW() + INTERVAL '30 days', 89, false),

    (pid, 'Build Shelter for 100 Abandoned Dogs Hyderabad',
     'A volunteer-run shelter in Hyderabad is critically overcrowded. Funds will build a new facility with proper kennels, a medical room, and a feeding area for 100 rescued dogs awaiting adoption.',
     300000, 134000, 'active', 'Animal Welfare', 'Hyderabad, Telangana', NOW() + INTERVAL '50 days', 76, false),

    (pid, 'Wildlife Rescue and Rehabilitation Center West Bengal',
     'A rescue center in West Bengal rehabilitates injured leopards, snakes, birds, and deer. Funds cover veterinary care, proper enclosures, and release preparation for 200 wild animals annually.',
     150000, 67000, 'active', 'Animal Welfare', 'Darjeeling, West Bengal', NOW() + INTERVAL '70 days', 48, false),

    (pid, 'Free Veterinary Camp in 30 Rural UP Villages',
     'Livestock is the only asset for many rural families in Uttar Pradesh. A free veterinary camp will treat 2000 animals, provide vaccinations, and administer deworming to prevent disease spread.',
     50000, 28000, 'active', 'Animal Welfare', 'Muzaffarnagar, Uttar Pradesh', NOW() + INTERVAL '25 days', 37, false),

    (pid, 'Save Critically Endangered Vultures of Rajasthan',
     'India''s vulture population is near extinction due to diclofenac poisoning. This project monitors nesting sites, runs an anti-poisoning awareness campaign, and breeds 50 vultures in captivity.',
     200000, 71000, 'active', 'Animal Welfare', 'Jodhpur, Rajasthan', NOW() + INTERVAL '90 days', 43, false),

    (pid, 'Anti-Poaching Unit for Tiger Reserve in MP',
     'Poachers are targeting tigers in Panna National Park. Funds will equip 10 forest guards with night-vision cameras, patrol vehicles, and communication equipment to protect tigers around the clock.',
     400000, 123000, 'active', 'Animal Welfare', 'Panna, Madhya Pradesh', NOW() + INTERVAL '100 days', 57, false);

  -- OTHER (6)
  INSERT INTO public.campaigns
    (creator_id, title, description, goal_amount, current_amount, status, category, location, end_date, supporter_count, is_featured)
  VALUES
    (pid, 'Preserve Rajasthan Traditional Puppet Art Form',
     'Rajasthani Kathputli puppet masters are a dying community of artists. This fund documents their art on film, trains 20 youth in the craft, and organizes performances to revive this 500-year tradition.',
     100000, 43000, 'active', 'Other', 'Jaipur, Rajasthan', NOW() + INTERVAL '60 days', 38, false),

    (pid, 'Community Sports Ground for Rural Punjab Youth',
     'Youth in a Punjab village have no sports facility whatsoever. This project levels a ground, installs goal posts, and provides cricket and football equipment for 200 young enthusiastic athletes.',
     150000, 62000, 'active', 'Other', 'Hoshiarpur, Punjab', NOW() + INTERVAL '40 days', 44, false),

    (pid, 'Restore Ancient Chola Temple in Tamil Nadu',
     'A 1000-year-old Chola-era temple in Thanjavur is crumbling rapidly. Expert artisans will restore its gopuram, pillars, and intricate murals using traditional methods, preserving this piece of heritage.',
     300000, 98000, 'active', 'Other', 'Thanjavur, Tamil Nadu', NOW() + INTERVAL '80 days', 56, false),

    (pid, 'Community Center for Transgender Rights Bangalore',
     'A safe space for the transgender community in Bangalore providing legal aid, skill training, and professional counseling. Help create a home where dignity and opportunity are truly available to all.',
     200000, 77000, 'active', 'Other', 'Bangalore, Karnataka', NOW() + INTERVAL '55 days', 63, false),

    (pid, 'Startup Fund for 20 Entrepreneurs with Disabilities',
     'Twenty people with disabilities in Delhi have strong business ideas but no seed capital to start. This fund provides micro-grants of ten to fifteen thousand rupees to help them launch their dreams.',
     250000, 91000, 'active', 'Other', 'New Delhi', NOW() + INTERVAL '45 days', 47, false),

    (pid, 'Rural Eco-Tourism Development in Himachal Pradesh',
     'Himalayan villages are losing their youth to cities. This project develops eco-tourism infrastructure, trains villagers as guides and hosts, and creates sustainable year-round income for 30 families.',
     180000, 54000, 'active', 'Other', 'Spiti Valley, Himachal Pradesh', NOW() + INTERVAL '100 days', 29, false);

  -- ===========================================================
  -- FEATURED CAMPAIGNS (33)
  -- ===========================================================

  -- MEDICAL FEATURED (5)
  INSERT INTO public.campaigns
    (creator_id, title, description, goal_amount, current_amount, status, category, location, end_date, supporter_count, is_featured, featured_until)
  VALUES
    (pid, 'Lifesaving Bone Marrow Transplant for Rahul',
     'Rahul, 28, has leukemia and a bone marrow transplant is his only hope. The procedure costs twelve lakhs and must happen in the next 30 days or he will not survive. Help us race against time for him.',
     1200000, 678000, 'active', 'Medical', 'Mumbai, Maharashtra', NOW() + INTERVAL '28 days', 187, true, NOW() + INTERVAL '1 day'),

    (pid, 'Cleft Lip Surgery for 30 Village Children Bhopal',
     'Thirty children in villages around Bhopal were born with cleft lips, affecting their ability to eat, speak, and go to school. Each surgery costs just seven thousand rupees. Give them a normal childhood.',
     210000, 143000, 'active', 'Medical', 'Bhopal, Madhya Pradesh', NOW() + INTERVAL '40 days', 134, true, NOW() + INTERVAL '1 day'),

    (pid, 'Critical ICU Care for Road Accident Victim Ajay',
     'Ajay Mehta, 31, is fighting for his life after a highway accident. His family, daily wage laborers from Gujarat, cannot afford the ICU fees. Seventy-two hours can make the difference. Please act now.',
     350000, 234000, 'active', 'Medical', 'Ahmedabad, Gujarat', NOW() + INTERVAL '5 days', 198, true, NOW() + INTERVAL '1 day'),

    (pid, 'Brain Tumor Surgery for Young Mother Sunita',
     'Sunita, 32, has been diagnosed with glioblastoma. She is a mother of two toddlers who need her. The surgery at AIIMS Delhi costs eight lakhs. Help her children keep their mother alive.',
     800000, 456000, 'active', 'Medical', 'New Delhi', NOW() + INTERVAL '18 days', 267, true, NOW() + INTERVAL '1 day'),

    (pid, 'Thalassemia Treatment Fund for 3-Year-Old Aarav',
     'Little Aarav needs monthly blood transfusions and a bone marrow transplant within two years. Help his parents, struggling garment workers, afford the ongoing treatment to keep him alive and growing.',
     500000, 312000, 'active', 'Medical', 'Chennai, Tamil Nadu', NOW() + INTERVAL '55 days', 243, true, NOW() + INTERVAL '1 day');

  -- EDUCATION FEATURED (5)
  INSERT INTO public.campaigns
    (creator_id, title, description, goal_amount, current_amount, status, category, location, end_date, supporter_count, is_featured, featured_until)
  VALUES
    (pid, 'Rebuild Flood-Damaged School in Assam',
     'The only school serving 500 children in a remote Assam village was completely destroyed by floods. We are rebuilding with flood-resistant construction. These children have not been to school in 8 months.',
     500000, 289000, 'active', 'Education', 'Guwahati, Assam', NOW() + INTERVAL '60 days', 156, true, NOW() + INTERVAL '1 day'),

    (pid, 'Provide Laptops to 200 Underprivileged Students Delhi',
     'During COVID lockdowns, students in Delhi slums fell behind as they had no devices for online learning. Your donation of four thousand rupees funds one refurbished laptop. Change 200 futures today.',
     800000, 421000, 'active', 'Education', 'New Delhi', NOW() + INTERVAL '45 days', 213, true, NOW() + INTERVAL '1 day'),

    (pid, 'Solar-Powered Study Center for Rajasthan Village',
     'A solar-powered study center in a Rajasthan desert village with no electricity will allow 80 students to study after sunset, access internet, and connect with the world outside for the very first time.',
     350000, 198000, 'active', 'Education', 'Barmer, Rajasthan', NOW() + INTERVAL '70 days', 134, true, NOW() + INTERVAL '1 day'),

    (pid, 'Full Scholarship for 50 Slum Girls in Mumbai',
     'Fifty brilliant girls from Dharavi slum passed their 10th board exams with distinction but cannot afford college. Full scholarships cover two years of college education, hostel, and books. Invest in India.',
     600000, 334000, 'active', 'Education', 'Mumbai, Maharashtra', NOW() + INTERVAL '30 days', 189, true, NOW() + INTERVAL '1 day'),

    (pid, 'Digital Literacy Program for Senior Citizens',
     'Thousands of seniors in Bangalore are left behind in the digital age, unable to access pensions or telemedicine. Our three-month program trains 500 seniors on smartphones and government apps.',
     180000, 112000, 'active', 'Education', 'Bangalore, Karnataka', NOW() + INTERVAL '50 days', 167, true, NOW() + INTERVAL '1 day');

  -- SOCIAL IMPACT FEATURED (5)
  INSERT INTO public.campaigns
    (creator_id, title, description, goal_amount, current_amount, status, category, location, end_date, supporter_count, is_featured, featured_until)
  VALUES
    (pid, 'Build 100 Affordable Homes for Homeless Delhi Families',
     'One hundred families in Delhi have been living under flyovers for years. This project builds prefab homes with electricity and water connection, providing permanent shelter and restoring human dignity.',
     3000000, 1456000, 'active', 'Social Impact', 'New Delhi', NOW() + INTERVAL '90 days', 398, true, NOW() + INTERVAL '1 day'),

    (pid, 'Mobile Medical Van for 50 Maharashtra Villages',
     'A fully equipped mobile medical van will visit 50 villages in rural Maharashtra monthly, providing free consultations, medicines, and maternal care to five thousand people who have never seen a doctor.',
     1500000, 723000, 'active', 'Social Impact', 'Nanded, Maharashtra', NOW() + INTERVAL '60 days', 312, true, NOW() + INTERVAL '1 day'),

    (pid, 'Rainwater Harvesting in Marathwada Drought Region',
     'Marathwada faces water scarcity for eight months a year. This project builds ten check dams and fifty farm ponds, storing five hundred million litres of rainwater for five thousand farming families.',
     700000, 389000, 'active', 'Social Impact', 'Latur, Maharashtra', NOW() + INTERVAL '75 days', 234, true, NOW() + INTERVAL '1 day'),

    (pid, 'Women Self-Help Cooperative in Tamil Nadu Villages',
     'Two hundred rural women in Tamil Nadu will form a cooperative producing handloom sarees, organic pickles, and handicrafts. Microloans and professional training will make them financially independent.',
     400000, 198000, 'active', 'Social Impact', 'Sivaganga, Tamil Nadu', NOW() + INTERVAL '45 days', 178, true, NOW() + INTERVAL '1 day'),

    (pid, 'Night School for 300 Working Children in Kolkata',
     'Three hundred children in Kolkata work during the day to support their families. Our free night school runs from 6 pm to 9 pm, giving working children a genuine chance at a brighter future.',
     250000, 134000, 'active', 'Social Impact', 'Kolkata, West Bengal', NOW() + INTERVAL '55 days', 156, true, NOW() + INTERVAL '1 day');

  -- EMERGENCY FEATURED (5)
  INSERT INTO public.campaigns
    (creator_id, title, description, goal_amount, current_amount, status, category, location, end_date, supporter_count, is_featured, featured_until)
  VALUES
    (pid, 'Kerala Floods 2026 Rebuild 500 Shattered Homes',
     'Record monsoon floods have devastated Kerala and 500 families have lost everything. Emergency funds needed for food, medicines, temporary shelters, and long-term reconstruction of destroyed homes.',
     5000000, 2341000, 'active', 'Emergency', 'Kochi, Kerala', NOW() + INTERVAL '20 days', 567, true, NOW() + INTERVAL '1 day'),

    (pid, 'Cyclone Survivors Support Fund Gujarat Coast',
     'A powerful cyclone has ravaged Gujarat''s coastline. Two thousand fishing families have lost their boats, nets, and homes overnight. This fund provides emergency relief and helps rebuild livelihoods.',
     2000000, 987000, 'active', 'Emergency', 'Veraval, Gujarat', NOW() + INTERVAL '15 days', 423, true, NOW() + INTERVAL '1 day'),

    (pid, 'Emergency Medical Aid for Chennai Rain Flood Victims',
     'Unprecedented rains have submerged Chennai and water-borne diseases are spreading rapidly. Urgent funds for medicine kits, water purification tablets, and first aid for ten thousand affected families.',
     1000000, 567000, 'active', 'Emergency', 'Chennai, Tamil Nadu', NOW() + INTERVAL '10 days', 389, true, NOW() + INTERVAL '1 day'),

    (pid, 'Emergency Food for 10000 Marathwada Drought Victims',
     'A severe drought has wiped out crops for the third consecutive year in Marathwada. Ten thousand people have no food. Your five hundred rupees feeds an entire family for one week. Please act now.',
     800000, 612000, 'active', 'Emergency', 'Osmanabad, Maharashtra', NOW() + INTERVAL '8 days', 534, true, NOW() + INTERVAL '1 day'),

    (pid, 'Rescue 200 Families from Landslide Zone Uttarakhand',
     'A massive landslide has trapped 200 families in Chamoli, Uttarakhand and all roads are completely blocked. Funds needed for helicopter evacuations, emergency food drops, and medical airlifts.',
     1200000, 789000, 'active', 'Emergency', 'Chamoli, Uttarakhand', NOW() + INTERVAL '5 days', 478, true, NOW() + INTERVAL '1 day');

  -- ENVIRONMENT FEATURED (5)
  INSERT INTO public.campaigns
    (creator_id, title, description, goal_amount, current_amount, status, category, location, end_date, supporter_count, is_featured, featured_until)
  VALUES
    (pid, 'Restore Mangrove Forests Along Mumbai Coast',
     'Mumbai''s mangroves protect 12 million people from floods and cyclones. This project restores 500 acres of mangroves through community-led planting and long-term protection programs along the coast.',
     1500000, 678000, 'active', 'Environment', 'Thane, Maharashtra', NOW() + INTERVAL '80 days', 289, true, NOW() + INTERVAL '1 day'),

    (pid, 'Transform Pune Slum into Zero Waste Community',
     'Dharampeth slum generates five tonnes of waste daily. This project installs segregation, composting, and recycling infrastructure, creating 50 green jobs and a replicable model for all of India.',
     350000, 187000, 'active', 'Environment', 'Pune, Maharashtra', NOW() + INTERVAL '60 days', 198, true, NOW() + INTERVAL '1 day'),

    (pid, 'Wind-Powered Water Pumps for 50 Rajasthan Farms',
     'Water scarcity threatens 50 Rajasthan farms every summer. Wind-powered pumps will draw groundwater without fuel costs, saving each farmer thirty thousand rupees annually while using zero fossil fuels.',
     600000, 312000, 'active', 'Environment', 'Jaisalmer, Rajasthan', NOW() + INTERVAL '75 days', 167, true, NOW() + INTERVAL '1 day'),

    (pid, 'Protect Olive Ridley Turtle Nesting Beaches Odisha',
     'Olive Ridley turtles, critically endangered, nest on Odisha''s beaches. This project employs 50 local fishermen as turtle guards, builds safe nesting zones, and runs continuous beach patrol teams.',
     250000, 134000, 'active', 'Environment', 'Ganjam, Odisha', NOW() + INTERVAL '90 days', 143, true, NOW() + INTERVAL '1 day'),

    (pid, 'Community Forest Garden for 100 Villages Chhattisgarh',
     'A community forest garden providing wild fruits, traditional medicines, and firewood to 100 Chhattisgarh villages will reduce forest destruction while providing food security for five thousand tribal families.',
     400000, 189000, 'active', 'Environment', 'Bastar, Chhattisgarh', NOW() + INTERVAL '100 days', 134, true, NOW() + INTERVAL '1 day');

  -- ANIMAL WELFARE FEATURED (4)
  INSERT INTO public.campaigns
    (creator_id, title, description, goal_amount, current_amount, status, category, location, end_date, supporter_count, is_featured, featured_until)
  VALUES
    (pid, 'Build India Largest No-Kill Animal Shelter Bangalore',
     'A two-acre no-kill shelter in Bangalore will house 500 rescued dogs and cats with a full veterinary clinic, adoption center, and sterilization unit. Help end the euthanasia of healthy animals in India.',
     2000000, 956000, 'active', 'Animal Welfare', 'Bangalore, Karnataka', NOW() + INTERVAL '90 days', 378, true, NOW() + INTERVAL '1 day'),

    (pid, 'Sea Turtle Rescue and Hatchery Center Andaman',
     'Five sea turtle species nest on Andaman beaches but face serious threats from fishing nets and poaching. This rescue center treats injured turtles, runs a hatchery, and protects ten thousand eggs annually.',
     750000, 398000, 'active', 'Animal Welfare', 'Port Blair, Andaman', NOW() + INTERVAL '70 days', 234, true, NOW() + INTERVAL '1 day'),

    (pid, 'Free Cow Ambulance for Injured Rural Cattle in UP',
     'In rural Uttar Pradesh, injured cattle lie helpless on roads for days with no veterinary help. A GPS-tracked cow ambulance with a veterinarian will respond to 500 calls monthly, saving lives and livelihoods.',
     500000, 267000, 'active', 'Animal Welfare', 'Varanasi, Uttar Pradesh', NOW() + INTERVAL '50 days', 198, true, NOW() + INTERVAL '1 day'),

    (pid, 'Save the Gangetic Dolphin Conservation Program',
     'Gangetic dolphins are critically endangered with fewer than 2500 remaining. This program deploys river rangers, reduces plastic pollution entering the Ganga, and runs a continuous dolphin monitoring network.',
     600000, 312000, 'active', 'Animal Welfare', 'Patna, Bihar', NOW() + INTERVAL '80 days', 213, true, NOW() + INTERVAL '1 day');

  -- OTHER FEATURED (4)
  INSERT INTO public.campaigns
    (creator_id, title, description, goal_amount, current_amount, status, category, location, end_date, supporter_count, is_featured, featured_until)
  VALUES
    (pid, 'Restore 500-Year-Old Stepwell in Rajasthan',
     'The magnificent Panna Meena ka Kund stepwell in Jaipur, built in the 16th century, is crumbling dangerously. Expert restoration will preserve this breathtaking architectural marvel for future generations.',
     1000000, 534000, 'active', 'Other', 'Jaipur, Rajasthan', NOW() + INTERVAL '100 days', 267, true, NOW() + INTERVAL '1 day'),

    (pid, 'National Sports Academy for 200 Rural Athletes',
     'India''s next Olympic champions may be hidden in remote villages. This sports academy provides free coaching in ten disciplines, full nutrition support, and national competition opportunities for 200 rural athletes.',
     3000000, 1234000, 'active', 'Other', 'Lucknow, Uttar Pradesh', NOW() + INTERVAL '90 days', 412, true, NOW() + INTERVAL '1 day'),

    (pid, 'Digitize 5000 Ancient Sanskrit Manuscripts Varanasi',
     'Thousands of priceless Sanskrit manuscripts in Varanasi''s libraries are slowly decaying. This project digitizes five thousand manuscripts, making ancient wisdom freely accessible to scholars worldwide.',
     500000, 234000, 'active', 'Other', 'Varanasi, Uttar Pradesh', NOW() + INTERVAL '75 days', 189, true, NOW() + INTERVAL '1 day'),

    (pid, 'Cultural Heritage Museum for Adivasi Art Jharkhand',
     'Jharkhand''s Adivasi art forms are disappearing as communities urbanize. This museum displays 1000 artifacts, employs 30 tribal artists full-time, and hosts cultural workshops for schools and curious tourists.',
     800000, 389000, 'active', 'Other', 'Ranchi, Jharkhand', NOW() + INTERVAL '85 days', 234, true, NOW() + INTERVAL '1 day');

END $seed$;
