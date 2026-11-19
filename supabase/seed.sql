-- Local development seed data. Demo accounts use the password 'password123'.
-- Boundaries: © OpenStreetMap contributors (ODbL), simplified.

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'admin@townping.local',
  extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}',
  '{"full_name":"Platform Admin"}', now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '{"sub":"00000000-0000-4000-8000-000000000001","email":"admin@townping.local"}', 'email', now(), now(), now());

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'staff@ljubljana.townping.local',
  extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}',
  '{"full_name":"Mojca Novak"}', now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', '{"sub":"00000000-0000-4000-8000-000000000002","email":"staff@ljubljana.townping.local"}', 'email', now(), now(), now());

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'citizen@townping.local',
  extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}',
  '{"full_name":"Janez Kranjc"}', now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000003', '{"sub":"00000000-0000-4000-8000-000000000003","email":"citizen@townping.local"}', 'email', now(), now(), now());

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'pending@townping.local',
  extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}',
  '{"full_name":"Luka Zupan"}', now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000004', '{"sub":"00000000-0000-4000-8000-000000000004","email":"pending@townping.local"}', 'email', now(), now(), now());

update public.profiles set is_platform_admin = true where id = '00000000-0000-4000-8000-000000000001';

insert into public.municipalities (id, slug, name, contact_email, website_url, primary_color, center_lat, center_lng, default_zoom, boundary) values
  ('10000000-0000-4000-8000-000000000001', 'ljubljana', 'Mestna občina Ljubljana', 'info@ljubljana.si', 'https://www.ljubljana.si', '#0f766e', 46.0511, 14.5051, 13,
   extensions.st_multi(extensions.st_setsrid(extensions.st_geomfromgeojson('{"type":"Polygon","coordinates":[[[14.408617,46.0814374],[14.42432,46.0802028],[14.4224642,46.0711616],[14.4291234,46.0687287],[14.4256178,46.0662198],[14.4311681,46.0644749],[14.4265355,46.063723],[14.4292948,46.0606056],[14.4338402,46.0633409],[14.4332146,46.0602561],[14.4363953,46.0601458],[14.4409964,46.053045],[14.4394777,46.0502605],[14.442335,46.0486946],[14.4342014,46.0469008],[14.4356483,46.0446122],[14.4330096,46.0425986],[14.4366999,46.0381598],[14.4407367,46.0384377],[14.4426993,46.0339606],[14.4304099,46.026204],[14.4380296,46.0173698],[14.4379282,46.0133473],[14.4584895,46.01045],[14.465027,46.0060628],[14.4617472,46.0007298],[14.4424927,45.9946993],[14.4465195,45.9935041],[14.4310046,45.9869768],[14.4288845,45.9822604],[14.4390598,45.9740866],[14.4575823,45.9763082],[14.4590238,45.9793653],[14.4671627,45.9785216],[14.4674818,45.9761836],[14.4763762,45.9772773],[14.4785598,45.978385],[14.4720274,45.994947],[14.509355,46.0030848],[14.5124059,45.9966102],[14.519777,45.9973729],[14.5250457,45.9921016],[14.5336692,45.9905173],[14.5357718,45.9999915],[14.5414298,46.0058988],[14.5289269,46.0140001],[14.530182,46.0158195],[14.5593688,46.0123271],[14.5731108,46.0167283],[14.5735163,46.0194291],[14.5835917,46.0192231],[14.5912401,46.0083184],[14.5977833,46.0088004],[14.6090453,46.0011462],[14.6138439,46.0017653],[14.6180643,45.9982253],[14.6146558,45.996376],[14.6209139,45.9883012],[14.6325474,45.9868184],[14.6365118,45.9875373],[14.6316043,45.9908644],[14.6320254,45.9955086],[14.640468,45.9875543],[14.6413168,45.9900493],[14.6692087,45.9884324],[14.668868,45.9936321],[14.6832444,45.9989903],[14.6743677,46.0046521],[14.6838108,46.0106799],[14.6941674,46.0081308],[14.6962487,46.0123357],[14.6988694,46.0103694],[14.7044991,46.0153238],[14.714422,46.0118937],[14.7201207,46.0008135],[14.723457,46.0036694],[14.7316706,45.9979078],[14.7431351,45.9978799],[14.7518136,46.0074186],[14.7449957,46.0074487],[14.7482003,46.0126654],[14.7418367,46.0148468],[14.7457087,46.0153502],[14.7405863,46.0171294],[14.7401442,46.0205655],[14.7545053,46.0237192],[14.751975,46.0263411],[14.7553057,46.0297314],[14.7365175,46.0406472],[14.7249688,46.0520416],[14.7313669,46.0516773],[14.7468005,46.0594053],[14.7457392,46.0682387],[14.7238283,46.0656688],[14.7188517,46.0682481],[14.7230844,46.0722983],[14.7116788,46.0779568],[14.6966094,46.0769592],[14.6913952,46.0730358],[14.6868353,46.0775109],[14.6777562,46.0791666],[14.6758073,46.086503],[14.6632887,46.0785205],[14.6205896,46.0761752],[14.5922104,46.0855624],[14.5904787,46.0890608],[14.5942358,46.0987375],[14.5917646,46.1041363],[14.5829901,46.1081807],[14.5795743,46.1031386],[14.5765292,46.1055478],[14.5724883,46.1028515],[14.565162,46.1134231],[14.5539579,46.1167093],[14.5484456,46.1136105],[14.5395513,46.1159416],[14.5357435,46.1210728],[14.5214824,46.1273305],[14.5203754,46.1341371],[14.5131112,46.1389831],[14.5137519,46.1441414],[14.507123,46.1457507],[14.4758913,46.135733],[14.4718434,46.1422017],[14.4679925,46.1415271],[14.4647466,46.1385338],[14.468499,46.1346013],[14.4496077,46.1285018],[14.4439543,46.1210336],[14.4376337,46.128361],[14.425945,46.1287162],[14.4255554,46.1222386],[14.4223062,46.1211335],[14.4200039,46.1140201],[14.4271304,46.115079],[14.4301707,46.1022483],[14.4426187,46.095564],[14.4174685,46.0926587],[14.411267,46.0884341],[14.408617,46.0814374]]]}'), 4326))::extensions.geography),
  ('10000000-0000-4000-8000-000000000002', 'kranj', 'Mestna občina Kranj', 'mestna.obcina@kranj.si', 'https://www.kranj.si', '#1d4ed8', 46.2389, 14.3556, 14,
   extensions.st_multi(extensions.st_setsrid(extensions.st_geomfromgeojson('{"type":"Polygon","coordinates":[[[14.1638435,46.2791346],[14.1864219,46.2710753],[14.1972719,46.252934],[14.2049605,46.2532017],[14.2054719,46.2474109],[14.2217551,46.2459661],[14.2250824,46.248211],[14.2288894,46.2455573],[14.2330121,46.2524662],[14.2354179,46.246391],[14.2449035,46.2412444],[14.2687335,46.2386007],[14.2783068,46.232886],[14.2815793,46.2298598],[14.2750311,46.2250996],[14.2796455,46.2231583],[14.2652152,46.218469],[14.2633468,46.2108362],[14.2658466,46.2094036],[14.2731112,46.2114114],[14.2771333,46.2061193],[14.2779893,46.2090399],[14.2839924,46.2077378],[14.2892975,46.2125026],[14.2976003,46.2006502],[14.3093297,46.2014772],[14.3154985,46.1974213],[14.3258292,46.2000819],[14.3317715,46.191938],[14.3448137,46.1868217],[14.3541212,46.1885121],[14.3551056,46.1929713],[14.3719251,46.1961508],[14.3706964,46.1925451],[14.3602195,46.1910475],[14.3583332,46.1861334],[14.3623396,46.1778628],[14.3691636,46.1781317],[14.3671349,46.1822414],[14.3794094,46.1838651],[14.3954781,46.1577346],[14.4224828,46.1675257],[14.408663,46.1810685],[14.4078593,46.1883883],[14.4039105,46.1917689],[14.4066698,46.1966238],[14.3973207,46.2020455],[14.3919965,46.2113297],[14.385905,46.2148513],[14.3901476,46.2190414],[14.4018418,46.2167739],[14.4057687,46.2214724],[14.4032965,46.2219977],[14.4065648,46.2264382],[14.3971175,46.2319045],[14.396417,46.2432669],[14.3991971,46.2451889],[14.3978552,46.2505173],[14.406581,46.2516371],[14.4060641,46.254204],[14.4017156,46.2611983],[14.395114,46.2629096],[14.3978177,46.2638794],[14.3951916,46.2663386],[14.4008923,46.2664679],[14.4088101,46.2751281],[14.4162159,46.2752346],[14.4111253,46.2794677],[14.4151857,46.2863704],[14.4060176,46.2912214],[14.3956746,46.2873859],[14.3899258,46.2908554],[14.375195,46.2816619],[14.3730943,46.2895141],[14.3677264,46.29132],[14.3702996,46.3001156],[14.363565,46.3043791],[14.3766212,46.3024264],[14.3806219,46.2999108],[14.3793604,46.296665],[14.3872594,46.3007023],[14.3904053,46.3225914],[14.4046782,46.3501439],[14.3851443,46.3471438],[14.3545527,46.3500167],[14.3456605,46.3395116],[14.3475119,46.336751],[14.3366483,46.3381732],[14.3338016,46.3351066],[14.3241755,46.3351853],[14.3273531,46.3281411],[14.3239777,46.3280223],[14.3271696,46.3261516],[14.3260819,46.3163382],[14.3302976,46.3113695],[14.3258842,46.313395],[14.3201831,46.3113729],[14.3245825,46.3041381],[14.3064502,46.2966251],[14.3100605,46.2892331],[14.3141767,46.2901125],[14.3216832,46.2855146],[14.321091,46.2798517],[14.3380348,46.2772764],[14.3384191,46.2702548],[14.3355042,46.269932],[14.3337158,46.2606656],[14.3274111,46.2603839],[14.3317496,46.2537881],[14.3274345,46.249797],[14.3203841,46.252727],[14.3111086,46.2637672],[14.2860353,46.2711339],[14.2471272,46.2723179],[14.2377702,46.2694939],[14.2360301,46.2724155],[14.2302924,46.2679774],[14.2309038,46.2715804],[14.2246261,46.2732836],[14.2237645,46.2772618],[14.2081879,46.2750247],[14.2071674,46.2819276],[14.1956711,46.2756213],[14.1761447,46.2815288],[14.1638435,46.2791346]]]}'), 4326))::extensions.geography);

insert into public.municipality_members (municipality_id, user_id, role, status, job_title) values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'admin', 'approved', 'Oddelek za gospodarske dejavnosti in promet'),
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', 'staff', 'pending', 'Komunalno podjetje');

-- Demo reports (categories/statuses are created by the municipality trigger).
insert into public.reports (municipality_id, category_id, status_id, author_id, title, description, lat, lng, created_at)
select '10000000-0000-4000-8000-000000000001', c.id, (select id from public.statuses where municipality_id = '10000000-0000-4000-8000-000000000001' and is_initial), '00000000-0000-4000-8000-000000000003',
  'Pothole on the bike lane', 'Deep pothole in the bike lane near the crossing, dangerous for cyclists especially at night.', 46.0569, 14.5058, now() - interval '12 days'
from public.categories c where c.municipality_id = '10000000-0000-4000-8000-000000000001' order by c.sort_order offset 0 limit 1;
insert into public.reports (municipality_id, category_id, status_id, author_id, title, description, lat, lng, created_at)
select '10000000-0000-4000-8000-000000000001', c.id, (select id from public.statuses where municipality_id = '10000000-0000-4000-8000-000000000001' and is_initial), '00000000-0000-4000-8000-000000000003',
  'Street light not working', 'The street light in front of house no. 12 has been off for a week.', 46.048, 14.495, now() - interval '10 days'
from public.categories c where c.municipality_id = '10000000-0000-4000-8000-000000000001' order by c.sort_order offset 2 limit 1;
insert into public.reports (municipality_id, category_id, status_id, author_id, title, description, lat, lng, created_at)
select '10000000-0000-4000-8000-000000000001', c.id, (select id from public.statuses where municipality_id = '10000000-0000-4000-8000-000000000001' and is_initial), '00000000-0000-4000-8000-000000000003',
  'Illegal dumping by the river', 'Someone dumped old furniture and bags of construction waste next to the path along the river.', 46.045, 14.515, now() - interval '8 days'
from public.categories c where c.municipality_id = '10000000-0000-4000-8000-000000000001' order by c.sort_order offset 4 limit 1;
insert into public.reports (municipality_id, category_id, status_id, author_id, title, description, lat, lng, created_at)
select '10000000-0000-4000-8000-000000000001', c.id, (select id from public.statuses where municipality_id = '10000000-0000-4000-8000-000000000001' and is_initial), '00000000-0000-4000-8000-000000000003',
  'More bike racks at the market', 'There are never enough bike racks at the central market on Saturdays. Please add at least 20 more.', 46.051, 14.51, now() - interval '6 days'
from public.categories c where c.municipality_id = '10000000-0000-4000-8000-000000000001' order by c.sort_order offset 5 limit 1;
insert into public.reports (municipality_id, category_id, status_id, author_id, title, description, lat, lng, created_at)
select '10000000-0000-4000-8000-000000000001', c.id, (select id from public.statuses where municipality_id = '10000000-0000-4000-8000-000000000001' and is_initial), '00000000-0000-4000-8000-000000000003',
  'Stop sign bent', 'The stop sign at the junction is bent and hardly visible for drivers coming from the north.', 46.062, 14.52, now() - interval '4 days'
from public.categories c where c.municipality_id = '10000000-0000-4000-8000-000000000001' order by c.sort_order offset 1 limit 1;
insert into public.reports (municipality_id, category_id, status_id, author_id, title, description, lat, lng, created_at)
select '10000000-0000-4000-8000-000000000001', c.id, (select id from public.statuses where municipality_id = '10000000-0000-4000-8000-000000000001' and is_initial), '00000000-0000-4000-8000-000000000003',
  'Broken bench in the park', 'Two slats of the bench near the playground are broken.', 46.053, 14.498, now() - interval '2 days'
from public.categories c where c.municipality_id = '10000000-0000-4000-8000-000000000001' order by c.sort_order offset 3 limit 1;

-- Move a couple of demo reports along the workflow.
update public.reports set status_id = (select id from public.statuses where municipality_id = '10000000-0000-4000-8000-000000000001' and sort_order = 20)
 where municipality_id = '10000000-0000-4000-8000-000000000001' and number in (1, 4);
update public.reports set status_id = (select id from public.statuses where municipality_id = '10000000-0000-4000-8000-000000000001' and sort_order = 30)
 where municipality_id = '10000000-0000-4000-8000-000000000001' and number = 6;

insert into public.report_votes (report_id, user_id)
select id, '00000000-0000-4000-8000-000000000002' from public.reports where number in (1, 4) and municipality_id = '10000000-0000-4000-8000-000000000001';

insert into public.report_comments (report_id, author_id, body)
select id, '00000000-0000-4000-8000-000000000003', 'Still there this morning, a car almost lost a wheel.' from public.reports where number = 1 and municipality_id = '10000000-0000-4000-8000-000000000001';

-- Make demo timeline timestamps consistent with the backdated reports.
update public.report_events e set created_at = r.created_at
  from public.reports r where e.report_id = r.id and e.type = 'created';
update public.report_events e set created_at = r.created_at + interval '1 day',
  note = case when r.number = 6 then 'The bench was repaired by the parks department.' else 'Forwarded to the maintenance team.' end
  from public.reports r where e.report_id = r.id and e.type = 'status_changed';
update public.report_comments c set created_at = r.created_at + interval '3 hours'
  from public.reports r where c.report_id = r.id;

-- Spread demo votes over time so "trending" has something to show.
insert into public.report_votes (report_id, user_id, created_at)
select r.id, u.id, now() - (case when r.number = 1 then interval '20 days' else interval '2 days' end)
  from public.reports r
 cross join (values ('00000000-0000-4000-8000-000000000001'::uuid), ('00000000-0000-4000-8000-000000000004'::uuid)) as u(id)
 where r.municipality_id = '10000000-0000-4000-8000-000000000001' and r.number in (1, 2, 4)
on conflict do nothing;
update public.report_votes v set created_at = now() - interval '15 days'
  from public.reports r where r.id = v.report_id and r.number = 1 and r.municipality_id = '10000000-0000-4000-8000-000000000001';
