-- Seed data for destination recommendations

-- Island Vibes
INSERT INTO destination_recommendations (category, category_display_name, name, iata_code, description, display_order, is_active) VALUES
('island-vibes', 'Island Vibes', 'Bali, Indonesia', 'DPS', 'Tropical paradise with stunning beaches, temples, and rice terraces', 1, true),
('island-vibes', 'Island Vibes', 'Maldives', 'MLE', 'Crystal clear waters and overwater bungalows', 2, true),
('island-vibes', 'Island Vibes', 'Santorini, Greece', 'JTR', 'Iconic white buildings and Mediterranean sunsets', 3, true),
('island-vibes', 'Island Vibes', 'Phuket, Thailand', 'HKT', 'Thai beaches, vibrant nightlife, and island hopping', 4, true),
('island-vibes', 'Island Vibes', 'Maui, Hawaii', 'OGG', 'Hawaiian paradise with volcanic landscapes and beaches', 5, true),
('island-vibes', 'Island Vibes', 'Fiji', 'NAN', 'South Pacific islands with coral reefs and friendly locals', 6, true);

-- Mountain Views
INSERT INTO destination_recommendations (category, category_display_name, name, iata_code, description, display_order, is_active) VALUES
('mountain-views', 'Mountain Views', 'Swiss Alps, Zurich', 'ZRH', 'Stunning Alpine scenery and mountain railways', 1, true),
('mountain-views', 'Mountain Views', 'Queenstown, New Zealand', 'ZQN', 'Adventure capital with dramatic mountain landscapes', 2, true),
('mountain-views', 'Mountain Views', 'Denver, Colorado', 'DEN', 'Gateway to the Rocky Mountains', 3, true),
('mountain-views', 'Mountain Views', 'Innsbruck, Austria', 'INN', 'Alpine city surrounded by mountain peaks', 4, true),
('mountain-views', 'Mountain Views', 'Calgary, Canada', 'YYC', 'Near the Canadian Rockies and Banff National Park', 5, true),
('mountain-views', 'Mountain Views', 'Kathmandu, Nepal', 'KTM', 'Gateway to the Himalayas and Mount Everest', 6, true);

-- Snowy Adventures
INSERT INTO destination_recommendations (category, category_display_name, name, iata_code, description, display_order, is_active) VALUES
('snowy-adventures', 'Snowy Adventures', 'Reykjavik, Iceland', 'KEF', 'Northern lights, glaciers, and geothermal spas', 1, true),
('snowy-adventures', 'Snowy Adventures', 'Aspen, Colorado', 'ASE', 'Premier ski resort with luxury amenities', 2, true),
('snowy-adventures', 'Snowy Adventures', 'Niseko, Japan', 'CTS', 'World-class powder snow and hot springs', 3, true),
('snowy-adventures', 'Snowy Adventures', 'Tromsø, Norway', 'TOS', 'Arctic adventures and northern lights', 4, true),
('snowy-adventures', 'Snowy Adventures', 'Whistler, Canada', 'YVR', 'North America''s largest ski resort', 5, true),
('snowy-adventures', 'Snowy Adventures', 'Lapland, Finland', 'RVN', 'Winter wonderland with reindeer and Santa', 6, true);

-- City Escapes
INSERT INTO destination_recommendations (category, category_display_name, name, iata_code, description, display_order, is_active) VALUES
('city-escapes', 'City Escapes', 'Tokyo, Japan', 'NRT', 'Blend of modern technology and ancient traditions', 1, true),
('city-escapes', 'City Escapes', 'New York City', 'JFK', 'The city that never sleeps', 2, true),
('city-escapes', 'City Escapes', 'Paris, France', 'CDG', 'City of lights, romance, and culture', 3, true),
('city-escapes', 'City Escapes', 'Singapore', 'SIN', 'Modern city-state with gardens and cuisine', 4, true),
('city-escapes', 'City Escapes', 'Dubai, UAE', 'DXB', 'Futuristic skyline and luxury shopping', 5, true),
('city-escapes', 'City Escapes', 'London, UK', 'LHR', 'Historic landmarks and modern culture', 6, true);

-- Wine Tours
INSERT INTO destination_recommendations (category, category_display_name, name, iata_code, description, display_order, is_active) VALUES
('wine-tours', 'Wine Tours', 'Napa Valley, California', 'SFO', 'Premier wine region with vineyard tours', 1, true),
('wine-tours', 'Wine Tours', 'Bordeaux, France', 'BOD', 'World-famous wine region and châteaux', 2, true),
('wine-tours', 'Wine Tours', 'Tuscany, Italy', 'FLR', 'Rolling hills, vineyards, and medieval towns', 3, true),
('wine-tours', 'Wine Tours', 'Mendoza, Argentina', 'MDZ', 'Malbec wines with Andes mountain backdrop', 4, true),
('wine-tours', 'Wine Tours', 'Cape Town, South Africa', 'CPT', 'Stellenbosch wine region and stunning coastline', 5, true),
('wine-tours', 'Wine Tours', 'Porto, Portugal', 'OPO', 'Port wine cellars and historic city', 6, true);